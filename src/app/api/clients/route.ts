import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as z from 'zod'

const createClientSchema = z.object({
  leadId: z.string()
})

export async function GET(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')
    
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // BDEs don't manage clients unless they have tasks, but for Sprint 4 we'll let them view clients attached to their leads.
    // For simplicity, BDMs/Admins see all.
    const clients = await db.client.findMany({
      where: { companyId, deletedAt: null },
      include: {
        lead: { select: { company: true, email: true, phone: true, assignedBdeId: true } },
        projects: { select: { id: true, name: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, clients })
  } catch (error) {
    console.error('Fetch clients error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')

    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    // RBAC: Only BDM or Admin can convert Lead to Client
    if (userRole === 'BDE') {
      return NextResponse.json({ error: 'Forbidden. BDE cannot convert clients.' }, { status: 403 })
    }

    const body = await req.json()
    const data = createClientSchema.parse(body)

    const lead = await db.lead.findUnique({ where: { id: data.leadId, companyId } })
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    if (lead.status !== 'CLOSED_WON') {
      return NextResponse.json({ error: 'Lead must be CLOSED_WON to convert' }, { status: 400 })
    }

    const existingClient = await db.client.findUnique({ where: { leadId: lead.id } })
    if (existingClient) {
      return NextResponse.json({ error: 'Lead is already converted to a client' }, { status: 400 })
    }

    const client = await db.client.create({
      data: {
        companyId,
        leadId: lead.id,
        name: lead.company || lead.name // Default to company name if B2B, else personal name
      }
    })

    return NextResponse.json({ success: true, client })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    console.error('Create client error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
