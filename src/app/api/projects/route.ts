import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as z from 'zod'

const createProjectSchema = z.object({
  clientId: z.string(),
  name: z.string().min(2),
  status: z.enum(['PENDING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PENDING')
})

export async function GET(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id')
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const projects = await db.project.findMany({
      where: { companyId },
      include: {
        client: { select: { name: true } },
        tasks: { select: { id: true, status: true } } // useful for progress bar
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, projects })
  } catch (error) {
    console.error('Fetch projects error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')

    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (userRole === 'BDE') {
      return NextResponse.json({ error: 'Forbidden. BDE cannot create projects.' }, { status: 403 })
    }

    const body = await req.json()
    const data = createProjectSchema.parse(body)

    const client = await db.client.findUnique({ where: { id: data.clientId, companyId } })
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const project = await db.project.create({
      data: {
        companyId,
        clientId: data.clientId,
        name: data.name,
        status: data.status
      }
    })

    return NextResponse.json({ success: true, project })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    console.error('Create project error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
