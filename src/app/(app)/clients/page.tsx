'use client'

import { useState, useEffect } from 'react'
import { Building, FolderOpen, Mail, Phone, Plus } from 'lucide-react'

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modals / forms
  const [creatingProjectFor, setCreatingProjectFor] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')

  const fetchClients = () => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        if (data.clients) setClients(data.clients)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleCreateProject = async (e: React.FormEvent, clientId: string) => {
    e.preventDefault()
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, name: projectName })
    })
    setCreatingProjectFor(null)
    setProjectName('')
    fetchClients()
  }

  if (loading) return <div className="p-8 text-zinc-400">Loading clients...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Clients & Projects</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage converted leads and their active deliverables.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {clients.map(client => (
          <div key={client.id} className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-800 bg-zinc-900/80">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{client.name}</h3>
                    <div className="text-xs text-zinc-400 flex gap-3 mt-1">
                      {client.lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{client.lead.email}</span>}
                      {client.lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{client.lead.phone}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 flex-1 bg-zinc-950/30">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" /> Projects
                </h4>
                <button 
                  onClick={() => setCreatingProjectFor(client.id)}
                  className="text-cyan-400 hover:text-cyan-300 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="h-3 w-3" /> New Project
                </button>
              </div>

              {creatingProjectFor === client.id && (
                <form onSubmit={(e) => handleCreateProject(e, client.id)} className="mb-4 flex gap-2">
                  <input 
                    autoFocus required type="text" placeholder="Project Name..."
                    value={projectName} onChange={e => setProjectName(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500"
                  />
                  <button type="submit" className="bg-cyan-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-cyan-500">Save</button>
                  <button type="button" onClick={() => setCreatingProjectFor(null)} className="text-zinc-400 hover:text-white px-2 py-1.5 text-sm">Cancel</button>
                </form>
              )}

              <div className="space-y-2">
                {client.projects.length === 0 ? (
                  <div className="text-xs text-zinc-500 italic p-2 border border-dashed border-zinc-800 rounded">No active projects.</div>
                ) : (
                  client.projects.map((project: any) => (
                    <div key={project.id} className="flex justify-between items-center bg-zinc-900 border border-zinc-800 rounded p-3">
                      <span className="text-sm font-medium text-zinc-100">{project.name}</span>
                      <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${project.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : project.status === 'ACTIVE' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ))}

        {clients.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-zinc-800 rounded-xl">
            <Building className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-zinc-400 font-medium">No clients yet</h3>
            <p className="text-sm text-zinc-500 mt-1">Move a lead to CLOSED WON to convert them into a client.</p>
          </div>
        )}
      </div>
    </div>
  )
}
