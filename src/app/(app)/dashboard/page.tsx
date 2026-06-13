'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, DollarSign, Target, Activity } from 'lucide-react'

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reports')
      .then(res => res.json())
      .then(data => {
        if (data.metrics) setMetrics(data.metrics)
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
            <div className="h-4 w-24 bg-zinc-800 rounded mb-4 animate-pulse" />
            <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )

  const StatCard = ({ title, value, icon: Icon, trend }: any) => (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 text-zinc-800/30 group-hover:text-cyan-900/20 transition-colors">
        <Icon className="h-24 w-24" />
      </div>
      <div className="relative z-10 flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          {title}
        </span>
        <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
        {trend && <div className="text-xs font-medium text-emerald-400 mt-1">{trend}</div>}
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Dashboard Overview</h1>
        <p className="text-sm text-zinc-400 mt-1">Real-time metrics and pipeline analytics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Leads" value={metrics.totalLeads} icon={Target} trend="Active pipeline" />
        <StatCard title="Pipeline Value" value={`$${metrics.pipelineValue.toLocaleString()}`} icon={BarChart3} />
        <StatCard title="Closed Won Revenue" value={`$${metrics.wonValue.toLocaleString()}`} icon={DollarSign} trend="All time" />
        <StatCard title="Conversion Rate" value={`${metrics.conversionRate}%`} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold uppercase text-zinc-400 tracking-wider mb-6 flex items-center gap-2">
            <Activity className="h-4 w-4" /> Activity Output (Last 30 Days)
          </h3>
          <div className="space-y-4">
            {Object.entries(metrics.activityBreakdown).length === 0 ? (
              <div className="text-zinc-500 text-sm">No recent activity logged.</div>
            ) : (
              Object.entries(metrics.activityBreakdown).map(([type, count]: any) => (
                <div key={type} className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
                  <span className="text-sm font-medium text-zinc-300">{type.replace('_', ' ')}</span>
                  <span className="text-sm font-bold text-cyan-400">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold uppercase text-zinc-400 tracking-wider mb-6">Lead Sources</h3>
          <div className="space-y-4">
            {Object.entries(metrics.sourceBreakdown).length === 0 ? (
              <div className="text-zinc-500 text-sm">No leads to analyze.</div>
            ) : (
              Object.entries(metrics.sourceBreakdown)
                .sort(([, a]: any, [, b]: any) => b - a)
                .map(([source, count]: any) => (
                <div key={source} className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
                  <span className="text-sm font-medium text-zinc-300">{source.replace('_', ' ')}</span>
                  <span className="text-sm font-bold text-white">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
