'use client'

import { useState } from 'react'
import { Link2, MessageCircle, Mail, Video, CheckCircle2, AlertCircle } from 'lucide-react'

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'Send automated follow-ups and reply to leads directly via WhatsApp.',
      icon: MessageCircle,
      status: 'DISCONNECTED',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      id: 'gmail',
      name: 'Google Workspace (Gmail)',
      description: 'Sync your inbox. Automatically log email threads to lead timelines.',
      icon: Mail,
      status: 'CONNECTED',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    {
      id: 'meet',
      name: 'Google Meet',
      description: 'Auto-generate Meet links for scheduled meetings.',
      icon: Video,
      status: 'CONNECTED',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    }
  ])

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(int => {
      if (int.id === id) {
        return { ...int, status: int.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED' }
      }
      return int
    }))
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-medium text-white">Integrations</h2>
        <p className="text-sm text-zinc-400 mt-1">Connect your favorite tools to automate your workflow.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {integrations.map(integration => (
          <div key={integration.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <div className="flex items-start gap-4 mb-4 sm:mb-0">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${integration.bgColor} ${integration.color} ${integration.borderColor}`}>
                <integration.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  {integration.name}
                  {integration.status === 'CONNECTED' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                </h3>
                <p className="text-sm text-zinc-400 mt-0.5">{integration.description}</p>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
                  Status: 
                  <span className={integration.status === 'CONNECTED' ? 'text-emerald-400' : 'text-zinc-500'}>
                    {integration.status}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => toggleIntegration(integration.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                integration.status === 'CONNECTED' 
                  ? 'bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800' 
                  : 'bg-cyan-600 border-cyan-500 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-500/20'
              }`}
            >
              {integration.status === 'CONNECTED' ? 'Disconnect' : 'Connect Account'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3 items-start">
        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-amber-500">OAuth Requirements</h4>
          <p className="text-xs text-amber-500/80 mt-1">
            Connecting Google Workspace requires going through the OAuth consent screen. Ensure your domain is verified in the Google Cloud Console.
          </p>
        </div>
      </div>
    </div>
  )
}
