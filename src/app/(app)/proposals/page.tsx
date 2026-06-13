'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, ExternalLink } from 'lucide-react'

export default function ProposalsPage() {
  const router = useRouter()
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<any[]>([])

  // Modal State
  const [showCreate, setShowCreate] = useState(false)
  const [formData, setFormData] = useState({ title: '', leadId: '', totalValue: '' })
  const [creating, setCreating] = useState(false)

  const fetchProposals = () => {
    fetch('/api/proposals')
      .then(res => res.json())
      .then(data => {
        if (data.proposals) setProposals(data.proposals)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchProposals()
    fetch('/api/leads').then(res => res.json()).then(data => {
      if (data.leads) setLeads(data.leads.filter((l: any) => l.status !== 'CLOSED_LOST'))
    })
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: formData.title,
        leadId: formData.leadId,
        totalValue: formData.totalValue ? parseFloat(formData.totalValue) : null,
        content: { blocks: [] } // default empty JSON structure for future block editor
      })
    })
    
    if (res.ok) {
      const data = await res.json()
      router.push(`/proposals/${data.proposal.id}`)
    } else {
      setCreating(false)
      alert('Failed to create proposal')
    }
  }

  if (loading) return <div className="p-8 text-zinc-400">Loading proposals...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Proposals</h1>
          <p className="text-sm text-zinc-400 mt-1">Draft, send, and track financial quotes.</p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-500/20"
        >
          <Plus className="h-4 w-4" />
          {showCreate ? 'Cancel' : 'New Proposal'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-8 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-6 rounded-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Proposal Title</label>
              <input required autoFocus type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500" placeholder="e.g. Enterprise CRM License" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Select Lead</label>
              <select required value={formData.leadId} onChange={e => setFormData({...formData, leadId: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500">
                <option value="">Choose Lead...</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.name} ({l.company || 'Individual'})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Total Value ($)</label>
              <input required type="number" value={formData.totalValue} onChange={e => setFormData({...formData, totalValue: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500" placeholder="5000" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button disabled={creating} type="submit" className="px-4 py-2 text-sm font-medium rounded-md bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Draft'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-900/80">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Proposal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Lead/Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Version</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-900/30">
            {proposals.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-500 text-sm">No proposals found.</td></tr>
            ) : proposals.map(prop => (
              <tr key={prop.id} onClick={() => router.push(`/proposals/${prop.id}`)} className="hover:bg-zinc-800/30 transition-colors group cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                    <span className="font-medium text-white">{prop.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-zinc-300">{prop.lead.name}</div>
                  {prop.lead.company && <div className="text-xs text-zinc-500">{prop.lead.company}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                    prop.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    prop.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                    prop.status === 'SENT' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                    'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {prop.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">v{prop.version}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-emerald-400">
                  {prop.totalValue ? `$${prop.totalValue}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
