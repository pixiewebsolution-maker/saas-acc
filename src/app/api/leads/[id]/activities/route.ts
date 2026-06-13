import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as z from 'zod'

const createActivitySchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'NOTE']),
  description: z.string().min(1)
})

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')
    const userRole = req.headers.get('x-user-role')

    if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const leadId = params.id
    const body = await req.json()
    const data = createActivitySchema.parse(body)

    const existingLead = await db.lead.findUnique({ where: { id: leadId, companyId, deletedAt: null } })
    if (!existingLead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    // RBAC: BDE check
    if (userRole === 'BDE' && existingLead.assignedBdeId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const activity = await db.activity.create({
      data: {
        companyId,
        userId,
        leadId,
        type: data.type,
        description: data.description
      },
      include: {
        user: { select: { firstName: true, lastName: true } }
      }
    })

    return NextResponse.json({ success: true, activity })
  } catch (error) {
    console.error('Create activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
