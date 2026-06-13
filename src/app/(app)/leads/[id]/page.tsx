'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Phone, Mail, Building, Briefcase, DollarSign, Calendar, MessageSquare, Tag, Check, UserPlus } from 'lucide-react'

export default function LeadDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('timeline')

  // Activity Form
  const [activityType, setActivityType] = useState('NOTE')
  const [activityDesc, setActivityDesc] = useState('')
  const [logging, setLogging] = useState(false)

  const fetchLead = () => {
    fetch(`/api/leads/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.lead) setLead(data.lead)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchLead()
  }, [params.id])

  const handleStatusChange = async (newStatus: string) => {
    await fetch(`/api/leads/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    fetchLead()
  }

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    setLogging(true)
    await fetch(`/api/leads/${params.id}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: activityType, description: activityDesc })
    })
    setActivityDesc('')
    setActivityType('NOTE')
    setLogging(false)
    fetchLead()
  }

  if (loading) return <div className="p-8 text-zinc-400">Loading details...</div>
  if (!lead) return <div className="p-8 text-red-400">Lead not found or access denied.</div>

  const pipelineStages = ['NEW', 'CONTACTED', 'QUALIFIED', 'MEETING_SCHEDULED', 'PROPOSAL_SENT', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']
  const currentStageIndex = pipelineStages.indexOf(lead.status)

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      {/* Header Profile */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6 shadow-2xl flex flex-col md:flex-row justify-between gap-6">
        <div className="flex gap-6 items-center">
          <div className="h-20 w-20 rounded-full bg-cyan-900/30 flex items-center justify-center text-2xl font-semibold text-cyan-400 border border-cyan-800/50">
            {lead.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{lead.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
              {lead.company && <span className="flex items-center gap-1"><Building className="h-4 w-4" /> {lead.company}</span>}
              {lead.email && <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {lead.email}</span>}
              <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {lead.phone}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 justify-center">
          <select 
            value={lead.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-sm font-medium text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          >
            {pipelineStages.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <div className="text-sm text-zinc-400 flex items-center gap-1">
            Assignee: <span className="text-white font-medium">{lead.assignedBde ? `${lead.assignedBde.firstName} ${lead.assignedBde.lastName}` : 'Unassigned'}</span>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Bar */}
      <div className="flex bg-zinc-900/50 border border-zinc-800 rounded-md overflow-hidden h-2">
        {pipelineStages.map((stage, idx) => (
          <div key={stage} className={`flex-1 ${idx <= currentStageIndex ? (lead.status === 'CLOSED_LOST' ? 'bg-red-500' : lead.status === 'CLOSED_WON' ? 'bg-emerald-500' : 'bg-cyan-500') : 'bg-zinc-800'} ${idx < pipelineStages.length - 1 ? 'border-r border-zinc-950' : ''}`} />
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Details */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold uppercase text-zinc-400 tracking-wider mb-4">About</h3>
            <div className="space-y-4">
              <div className="flex gap-3 text-sm">
                <Briefcase className="h-5 w-5 text-zinc-500" />
                <div>
                  <div className="text-zinc-500">Industry</div>
                  <div className="text-white font-medium">{lead.industry || '-'}</div>
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <DollarSign className="h-5 w-5 text-zinc-500" />
                <div>
                  <div className="text-zinc-500">Estimated Value</div>
                  <div className="text-emerald-400 font-medium">{lead.value ? `$${lead.value}` : '-'}</div>
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <Tag className="h-5 w-5 text-zinc-500" />
                <div>
                  <div className="text-zinc-500">Source</div>
                  <div className="text-white font-medium">{lead.source.replace('_', ' ')}</div>
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <Calendar className="h-5 w-5 text-zinc-500" />
                <div>
                  <div className="text-zinc-500">Created On</div>
                  <div className="text-white font-medium">{new Date(lead.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Activities & Timeline */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex border-b border-zinc-800">
              <button onClick={() => setActiveTab('timeline')} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'timeline' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30'}`}>Activity Timeline</button>
              <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'details' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30'}`}>Details & Notes</button>
            </div>
            
            <div className="p-6">
              {activeTab === 'timeline' && (
                <div className="flex flex-col gap-8">
                  {/* Log Action Box */}
                  <form onSubmit={handleLogActivity} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg">
                    <div className="flex gap-2 mb-3 border-b border-zinc-800 pb-3">
                      {['NOTE', 'CALL', 'EMAIL', 'MEETING'].map(type => (
                        <button key={type} type="button" onClick={() => setActivityType(type)} className={`px-3 py-1 text-xs font-medium rounded-full ${activityType === type ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'}`}>
                          {type}
                        </button>
                      ))}
                    </div>
                    <textarea 
                      required 
                      value={activityDesc}
                      onChange={e => setActivityDesc(e.target.value)}
                      placeholder="Start typing to log an activity or note..." 
                      className="w-full bg-transparent resize-none text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none min-h-[80px]"
                    />
                    <div className="flex justify-end mt-2">
                      <button disabled={logging} type="submit" className="px-4 py-1.5 bg-cyan-600 text-white text-xs font-medium rounded hover:bg-cyan-500 disabled:opacity-50">
                        {logging ? 'Logging...' : 'Log Activity'}
                      </button>
                    </div>
                  </form>

                  {/* Timeline */}
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-zinc-800">
                    {lead.activities.map((activity: any) => (
                      <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900 text-cyan-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                          {activity.type === 'CALL' ? <Phone className="h-4 w-4" /> : activity.type === 'EMAIL' ? <Mail className="h-4 w-4" /> : activity.type === 'MEETING' ? <Calendar className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-zinc-900/50 p-4 rounded border border-zinc-800 shadow">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-white text-sm">{activity.user.firstName} {activity.user.lastName}</span>
                            <span className="text-xs text-zinc-500">{new Date(activity.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="text-sm text-zinc-400">{activity.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
