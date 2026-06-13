'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Plus } from 'lucide-react'

const PIPELINE_STAGES = [
  'NEW', 'CONTACTED', 'QUALIFIED', 'MEETING_SCHEDULED', 
  'PROPOSAL_SENT', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'
]

export default function PipelinePage() {
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedLead, setDraggedLead] = useState<any>(null)

  const fetchLeads = () => {
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => {
        if (data.leads) setLeads(data.leads)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const handleDragStart = (lead: any) => {
    setDraggedLead(lead)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, stage: string) => {
    e.preventDefault()
    if (!draggedLead || draggedLead.status === stage) return

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === draggedLead.id ? { ...l, status: stage } : l))

    // DB update
    await fetch(`/api/leads/${draggedLead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: stage })
    })

    setDraggedLead(null)
  }

  if (loading) return <div className="p-8 text-zinc-400">Loading pipeline...</div>

  // Group leads by status
  const columns = PIPELINE_STAGES.map(stage => ({
    stage,
    leads: leads.filter(l => l.status === stage)
  }))

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-white">Sales Pipeline</h1>
        <button 
          onClick={() => router.push('/leads/new')}
          className="flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-500/20"
        >
          <Plus className="h-4 w-4" />
          Add Lead
        </button>
      </div>

      <div className="flex-1 flex overflow-x-auto gap-6 pb-4">
        {columns.map((col) => (
          <div 
            key={col.stage} 
            className="flex-shrink-0 w-80 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col max-h-full"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.stage)}
          >
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/80 rounded-t-xl">
              <h3 className="font-semibold text-sm text-white tracking-wide flex items-center gap-2">
                {col.stage.replace('_', ' ')}
                <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full text-xs">{col.leads.length}</span>
              </h3>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {col.leads.map(lead => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => handleDragStart(lead)}
                  onClick={() => router.push(`/leads/${lead.id}`)}
                  className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg cursor-grab active:cursor-grabbing hover:border-cyan-500/50 transition-colors shadow-sm relative group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-medium text-zinc-100 group-hover:text-cyan-400 transition-colors">{lead.name}</h4>
                    <MoreHorizontal className="h-4 w-4 text-zinc-600 opacity-0 group-hover:opacity-100" />
                  </div>
                  {lead.company && <div className="text-xs text-zinc-500 mb-2">{lead.company}</div>}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800/50">
                    <span className="text-xs font-semibold text-emerald-400">{lead.value ? `$${lead.value}` : '-'}</span>
                    {lead.assignedBde ? (
                      <div className="h-6 w-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-300" title={`${lead.assignedBde.firstName} ${lead.assignedBde.lastName}`}>
                        {lead.assignedBde.firstName[0]}{lead.assignedBde.lastName[0]}
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-600">Unassigned</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
