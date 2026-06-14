import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')
    const userId = req.headers.get('x-user-id')
    
    if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch Tasks
    const taskWhere: any = { companyId, dueDate: { not: null }, status: { not: 'CANCELLED' } }
    if (userRole === 'BDE') taskWhere.assigneeId = userId
    
    const tasks = await db.task.findMany({
      where: taskWhere,
      include: { lead: { select: { name: true } } }
    })

    // Fetch FollowUps
    const followUpWhere: any = { companyId, status: { not: 'COMPLETED' } }
    if (userRole === 'BDE') followUpWhere.lead = { assignedBdeId: userId }

    const followUps = await db.followUp.findMany({
      where: followUpWhere,
      include: { lead: { select: { name: true } } }
    })

    // Fetch Meetings
    const meetingWhere: any = { companyId, status: { not: 'CANCELLED' } }
    if (userRole === 'BDE') meetingWhere.lead = { assignedBdeId: userId }

    const meetings = await db.meeting.findMany({
      where: meetingWhere,
      include: { lead: { select: { name: true } } }
    })

    // Format events for a unified calendar response
    const events = [
      ...tasks.map((t: any) => ({
        id: `task-${t.id}`,
        title: `Task: ${t.title} ${t.lead ? `(${t.lead.name})` : ''}`,
        date: t.dueDate,
        type: 'TASK',
        status: t.status
      })),
      ...followUps.map((f: any) => ({
        id: `followup-${f.id}`,
        title: `Follow-up: ${f.lead.name}`,
        date: f.scheduledAt,
        type: 'FOLLOWUP',
        status: f.status
      })),
      ...meetings.map((m: any) => ({
        id: `meeting-${m.id}`,
        title: `Meeting: ${m.title} ${m.lead ? `(${m.lead.name})` : ''}`,
        date: m.scheduledAt,
        type: 'MEETING',
        status: m.status
      }))
    ]

    // Sort chronologically
    events.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())

    return NextResponse.json({ success: true, events })
  } catch (error) {
    console.error('Fetch calendar error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
