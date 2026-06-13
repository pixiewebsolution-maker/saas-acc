import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as z from 'zod'

const updateProposalSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'SENT', 'ACCEPTED', 'REJECTED']).optional(),
  title: z.string().min(2).optional(),
  content: z.any().optional(),
  totalValue: z.number().optional().nullable(),
})

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')
    const userId = req.headers.get('x-user-id')

    if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const proposal = await db.proposal.findUnique({
      where: { id: params.id, companyId },
      include: { lead: { select: { id: true, name: true, assignedBdeId: true } } }
    })

    if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // RBAC
    if (userRole === 'BDE' && proposal.lead.assignedBdeId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ success: true, proposal })
  } catch (error) {
    console.error('Fetch proposal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')
    const userId = req.headers.get('x-user-id')

    if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = updateProposalSchema.parse(body)

    const proposal = await db.proposal.findUnique({
      where: { id: params.id, companyId },
      include: { lead: true }
    })

    if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // RBAC: BDE cannot approve/send proposals directly. BDM or Admin must transition to SENT or ACCEPTED.
    if (userRole === 'BDE') {
      if (proposal.lead.assignedBdeId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      if (data.status && ['SENT', 'ACCEPTED', 'REJECTED'].includes(data.status)) {
        return NextResponse.json({ error: 'BDE cannot approve proposals.' }, { status: 403 })
      }
    }

    const updatedProposal = await db.$transaction(async (tx) => {
      // If content is updated, bump version
      const versionBump = (data.content && JSON.stringify(data.content) !== JSON.stringify(proposal.content)) ? 1 : 0
      
      const updated = await tx.proposal.update({
        where: { id: params.id },
        data: {
          ...data,
          version: { increment: versionBump }
        }
      })

      if (data.status && data.status !== proposal.status) {
        await tx.activity.create({
          data: {
            companyId,
            userId,
            leadId: proposal.leadId,
            type: 'PROPOSAL',
            description: `Proposal '${proposal.title}' status changed to ${data.status}`
          }
        })
        
        // Notify BDM if pending approval
        if (data.status === 'PENDING_APPROVAL') {
           // Complex logic: find BDMs. We skip direct notification insert here 
           // and rely on a real Queue system in production.
        }
      }

      return updated
    })

    return NextResponse.json({ success: true, proposal: updatedProposal })
  } catch (error) {
    console.error('Update proposal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
