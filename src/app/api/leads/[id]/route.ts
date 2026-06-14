import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import * as z from 'zod'

const updateLeadSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(5).optional(),
  email: z.string().email().optional().nullable(),
  company: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'MEETING_SCHEDULED', 'PROPOSAL_SENT', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).optional(),
  value: z.number().optional().nullable(),
  assignedBdeId: z.string().optional().nullable(),
})

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')
    const userId = req.headers.get('x-user-id')
    
    if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const leadId = params.id

    const lead = await db.lead.findUnique({
      where: { id: leadId, companyId, deletedAt: null },
      include: {
        assignedBde: { select: { id: true, firstName: true, lastName: true } },
        activities: { 
          include: { user: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    // RBAC
    if (userRole === 'BDE' && lead.assignedBdeId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ success: true, lead })
  } catch (error) {
    console.error('Fetch lead error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')
    const userRole = req.headers.get('x-user-role')

    if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const leadId = params.id
    const body = await req.json()
    const data = updateLeadSchema.parse(body)

    const existingLead = await db.lead.findUnique({ where: { id: leadId, companyId, deletedAt: null } })
    if (!existingLead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    // RBAC: BDE check
    if (userRole === 'BDE') {
      if (existingLead.assignedBdeId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      // BDE cannot reassign
      if (data.assignedBdeId !== undefined && data.assignedBdeId !== existingLead.assignedBdeId) {
        return NextResponse.json({ error: 'Forbidden: Cannot reassign lead' }, { status: 403 })
      }
    }

    const updatedLead = await db.$transaction(async (tx: any) => {
      const updated = await tx.lead.update({
        where: { id: leadId },
        data
      })

      // Generate activity log for specific changes
      if (data.status && data.status !== existingLead.status) {
        await tx.activity.create({
          data: {
            companyId,
            userId,
            leadId,
            type: 'LEAD_UPDATE',
            description: `Changed status from ${existingLead.status} to ${data.status}`
          }
        })
      }
      
      if (data.assignedBdeId && data.assignedBdeId !== existingLead.assignedBdeId) {
        await tx.activity.create({
          data: {
            companyId,
            userId,
            leadId,
            type: 'LEAD_UPDATE',
            description: `Lead reassigned.`
          }
        })
        
        await tx.notification.create({
          data: {
            companyId,
            userId: data.assignedBdeId,
            type: 'LEAD_ASSIGNED',
            title: 'Lead Reassigned',
            message: `You have been assigned to lead: ${updated.name}`
          }
        })
      }

      return updated
    })

    return NextResponse.json({ success: true, lead: updatedLead })
  } catch (error) {
    console.error('Update lead error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
