import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as z from 'zod'

const createProposalSchema = z.object({
  leadId: z.string(),
  title: z.string().min(2),
  content: z.any(), // JSON
  totalValue: z.number().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')
    const userId = req.headers.get('x-user-id')
    
    if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const whereClause: any = { companyId }

    // RBAC: BDE can only see proposals for their leads
    if (userRole === 'BDE') {
      whereClause.lead = { assignedBdeId: userId }
    }

    const proposals = await db.proposal.findMany({
      where: whereClause,
      include: {
        lead: { select: { name: true, company: true } }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ success: true, proposals })
  } catch (error) {
    console.error('Fetch proposals error:', error)
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
    const data = createProposalSchema.parse(body)

    // Check lead
    const lead = await db.lead.findUnique({ where: { id: data.leadId, companyId } })
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    // RBAC check
    if (userRole === 'BDE' && lead.assignedBdeId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const proposal = await db.$transaction(async (tx) => {
      const p = await tx.proposal.create({
        data: {
          companyId,
          leadId: data.leadId,
          title: data.title,
          content: data.content || {},
          totalValue: data.totalValue,
          status: 'DRAFT'
        }
      })

      // Log activity
      await tx.activity.create({
        data: {
          companyId,
          userId,
          leadId: data.leadId,
          type: 'PROPOSAL',
          description: `Drafted a new proposal: ${data.title}`
        }
      })

      return p
    })

    return NextResponse.json({ success: true, proposal })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    console.error('Create proposal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
