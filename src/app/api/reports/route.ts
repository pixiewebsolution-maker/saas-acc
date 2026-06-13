import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')
    const userId = req.headers.get('x-user-id')
    
    if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Build where clause based on RBAC
    const leadWhere: any = { companyId, deletedAt: null }
    if (userRole === 'BDE') {
      leadWhere.assignedBdeId = userId
    }

    // 1. Pipeline Metrics
    const allLeads = await db.lead.findMany({
      where: leadWhere,
      select: { status: true, value: true, source: true, createdAt: true }
    })

    const totalLeads = allLeads.length
    const wonLeads = allLeads.filter(l => l.status === 'CLOSED_WON')
    const pipelineValue = allLeads
      .filter(l => l.status !== 'CLOSED_WON' && l.status !== 'CLOSED_LOST')
      .reduce((sum, lead) => sum + (Number(lead.value) || 0), 0)
    const wonValue = wonLeads.reduce((sum, lead) => sum + (Number(lead.value) || 0), 0)

    const conversionRate = totalLeads === 0 ? 0 : Math.round((wonLeads.length / totalLeads) * 100)

    // 2. Stage Breakdown
    const stageBreakdown = allLeads.reduce((acc: any, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1
      return acc
    }, {})

    // 3. Source Performance
    const sourceBreakdown = allLeads.reduce((acc: any, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1
      return acc
    }, {})

    // 4. Activity Metrics (Last 30 Days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const activityWhere: any = { companyId, createdAt: { gte: thirtyDaysAgo } }
    if (userRole === 'BDE') activityWhere.userId = userId

    const recentActivities = await db.activity.groupBy({
      by: ['type'],
      where: activityWhere,
      _count: { id: true }
    })

    const activityBreakdown = recentActivities.reduce((acc: any, act) => {
      acc[act.type] = act._count.id
      return acc
    }, {})

    return NextResponse.json({ 
      success: true, 
      metrics: {
        totalLeads,
        pipelineValue,
        wonValue,
        conversionRate,
        stageBreakdown,
        sourceBreakdown,
        activityBreakdown
      } 
    })
  } catch (error) {
    console.error('Fetch reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
