import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as z from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(2),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().optional().nullable(), // ISO string
  assigneeId: z.string(),
  leadId: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')
    const userId = req.headers.get('x-user-id')
    
    if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const whereClause: any = { companyId }

    // RBAC: BDE can only see their own tasks
    if (userRole === 'BDE') {
      whereClause.assigneeId = userId
    }

    const tasks = await db.task.findMany({
      where: whereClause,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, name: true, company: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, tasks })
  } catch (error) {
    console.error('Fetch tasks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')

    if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = createTaskSchema.parse(body)

    const task = await db.task.create({
      data: {
        companyId,
        title: data.title,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assigneeId: data.assigneeId,
        leadId: data.leadId || null
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, name: true } }
      }
    })

    // If assigned to someone else, notify them
    if (data.assigneeId !== userId) {
      await db.notification.create({
        data: {
          companyId,
          userId: data.assigneeId,
          type: 'LEAD_ASSIGNED', // Repurposed for general assignment
          title: 'New Task Assigned',
          message: `You have been assigned a task: ${task.title}`
        }
      })
    }

    return NextResponse.json({ success: true, task })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    console.error('Create task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
