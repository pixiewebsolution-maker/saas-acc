import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as z from 'zod'

const createLeadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(5),
  email: z.string().email().optional().nullable(),
  company: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  source: z.enum(['META_ADS', 'MANUAL', 'REFERRAL', 'WEBSITE', 'OTHER']).default('MANUAL'),
  value: z.number().optional().nullable(),
  assignedBdeId: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')
    const userId = req.headers.get('x-user-id')
    
    if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const whereClause: any = { 
      companyId,
      deletedAt: null 
    }

    // RBAC: BDE can only see their own leads
    if (userRole === 'BDE') {
      whereClause.assignedBdeId = userId
    }

    if (status) whereClause.status = status
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ]
    }

    const leads = await db.lead.findMany({
      where: whereClause,
      include: {
        assignedBde: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, leads })
  } catch (error) {
    console.error('Fetch leads error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')
    const userRole = req.headers.get('x-user-role')

    if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = createLeadSchema.parse(body)

    // RBAC check: BDE can't assign to someone else.
    let finalAssignee = data.assignedBdeId
    if (userRole === 'BDE') {
      finalAssignee = userId
    }

    const lead = await db.$transaction(async (tx) => {
      const newLead = await tx.lead.create({
        data: {
          companyId,
          name: data.name,
          phone: data.phone,
          email: data.email,
          company: data.company,
          industry: data.industry,
          source: data.source,
          value: data.value,
          assignedBdeId: finalAssignee
        }
      })

      // Add audit & activity
      await tx.activity.create({
        data: {
          companyId,
          userId,
          leadId: newLead.id,
          type: 'LEAD_UPDATE',
          description: 'Lead was created.'
        }
      })

      if (finalAssignee) {
        await tx.notification.create({
          data: {
            companyId,
            userId: finalAssignee,
            type: 'LEAD_ASSIGNED',
            title: 'New Lead Assigned',
            message: `You have been assigned a new lead: ${newLead.name}`
          }
        })
      }

      return newLead
    })

    return NextResponse.json({ success: true, lead })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    console.error('Create lead error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
