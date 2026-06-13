import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as z from 'zod'

const updateTaskSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  title: z.string().min(2).optional(),
})

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')
    const userId = req.headers.get('x-user-id')

    if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const taskId = params.id
    const body = await req.json()
    const data = updateTaskSchema.parse(body)

    const existingTask = await db.task.findUnique({ where: { id: taskId, companyId } })
    if (!existingTask) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    // RBAC: BDE check
    if (userRole === 'BDE' && existingTask.assigneeId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updatedTask = await db.task.update({
      where: { id: taskId },
      data
    })

    return NextResponse.json({ success: true, task: updatedTask })
  } catch (error) {
    console.error('Update task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
