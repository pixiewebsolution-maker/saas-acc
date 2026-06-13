'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Save, Send, CheckCircle, XCircle } from 'lucide-react'

export default function ProposalDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [proposal, setProposal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

  // Editor states
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('') // In a real app, this would be a block editor state
  const [value, setValue] = useState('')

  const fetchProposal = () => {
    fetch(`/api/proposals/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.proposal) {
          setProposal(data.proposal)
          setTitle(data.proposal.title)
          setValue(data.proposal.totalValue?.toString() || '')
          setContent(data.proposal.content?.text || '')
        }
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchProposal()
  }, [params.id])

  const handleSave = async () => {
    setSaving(true)
    await fetch(`/api/proposals/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        totalValue: value ? parseFloat(value) : null,
        content: { text: content }
      })
    })
    setSaving(false)
    fetchProposal() // refresh version
  }

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true)
    const res = await fetch(`/api/proposals/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    
    if (!res.ok) {
      const err = await res.json()
      alert(err.error || 'Failed to update status')
    }
    
    setStatusUpdating(false)
    fetchProposal()
  }

  if (loading) return <div className="p-8 text-zinc-400">Loading proposal...</div>
  if (!proposal) return <div className="p-8 text-red-400">Proposal not found or access denied.</div>

  const isEditable = proposal.status === 'DRAFT' || proposal.status === 'PENDING_APPROVAL'

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-6 rounded-xl">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Proposal: {proposal.title}</h1>
          <div className="text-sm text-zinc-400 flex items-center gap-3">
            <span>Lead: <span className="text-white">{proposal.lead.name}</span></span>
            <span>•</span>
            <span>Version: v{proposal.version}</span>
            <span>•</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              proposal.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
              proposal.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
              proposal.status === 'SENT' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
              'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              {proposal.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {isEditable && (
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-50">
              <Save className="h-4 w-4" /> Save Draft
            </button>
          )}
          {proposal.status === 'DRAFT' && (
            <button onClick={() => handleStatusChange('PENDING_APPROVAL')} disabled={statusUpdating} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-amber-600/20 text-amber-500 hover:bg-amber-600/30 border border-amber-600/30 disabled:opacity-50">
              Request Approval
            </button>
          )}
          {(proposal.status === 'PENDING_APPROVAL' || proposal.status === 'DRAFT') && (
            <button onClick={() => handleStatusChange('SENT')} disabled={statusUpdating} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50">
              <Send className="h-4 w-4" /> Send to Client
            </button>
          )}
          {proposal.status === 'SENT' && (
            <>
              <button onClick={() => handleStatusChange('ACCEPTED')} disabled={statusUpdating} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30 border border-emerald-600/30">
                <CheckCircle className="h-4 w-4" /> Mark Accepted
              </button>
              <button onClick={() => handleStatusChange('REJECTED')} disabled={statusUpdating} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-red-600/20 text-red-500 hover:bg-red-600/30 border border-red-600/30">
                <XCircle className="h-4 w-4" /> Mark Rejected
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col min-h-[500px]">
          <h3 className="text-sm font-semibold uppercase text-zinc-500 tracking-wider mb-4">Document Content</h3>
          {isEditable ? (
            <textarea 
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Start drafting the proposal content here..."
              className="flex-1 w-full bg-zinc-950/50 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
            />
          ) : (
            <div className="flex-1 w-full bg-zinc-950/50 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 whitespace-pre-wrap">
              {content || <span className="text-zinc-600 italic">No content provided.</span>}
            </div>
          )}
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-fit space-y-6">
          <h3 className="text-sm font-semibold uppercase text-zinc-500 tracking-wider">Metadata</h3>
          
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Proposal Title</label>
            {isEditable ? (
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500" />
            ) : (
              <div className="text-sm text-white font-medium">{title}</div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Total Value ($)</label>
            {isEditable ? (
              <input type="number" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-emerald-400 font-medium focus:ring-1 focus:ring-cyan-500" />
            ) : (
              <div className="text-sm text-emerald-400 font-medium">{value ? `$${value}` : 'Not specified'}</div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <div className="text-xs text-zinc-500 mb-1">Created At</div>
            <div className="text-sm text-zinc-300">{new Date(proposal.createdAt).toLocaleString()}</div>
          </div>
          
          <div>
            <div className="text-xs text-zinc-500 mb-1">Last Updated</div>
            <div className="text-sm text-zinc-300">{new Date(proposal.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
