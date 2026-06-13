'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewLeadPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [bdes, setBdes] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    industry: '',
    source: 'MANUAL',
    value: '',
    assignedBdeId: ''
  })

  useEffect(() => {
    // Fetch users for assignment
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.users) {
          // BDEs and BDMs can be assigned
          setBdes(data.users.filter((u: any) => u.role !== 'COMPANY_ADMIN'))
        }
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      ...formData,
      value: formData.value ? parseFloat(formData.value) : undefined,
      assignedBdeId: formData.assignedBdeId || undefined
    }

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      router.push('/leads')
    } else {
      alert('Failed to create lead')
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Add New Lead</h1>
        <p className="text-sm text-zinc-400 mt-1">Manually enter a new potential client.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 uppercase mb-1">Full Name *</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 uppercase mb-1">Phone *</label>
            <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 uppercase mb-1">Email</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 uppercase mb-1">Company</label>
            <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 uppercase mb-1">Industry</label>
            <input type="text" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 uppercase mb-1">Est. Value ($)</label>
            <input type="number" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 uppercase mb-1">Source</label>
            <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500">
              <option value="MANUAL">Manual</option>
              <option value="REFERRAL">Referral</option>
              <option value="WEBSITE">Website</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 uppercase mb-1">Assign To</label>
            <select value={formData.assignedBdeId} onChange={e => setFormData({...formData, assignedBdeId: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500">
              <option value="">Unassigned</option>
              {bdes.map(b => (
                <option key={b.id} value={b.id}>{b.firstName} {b.lastName} ({b.role})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-800 flex justify-end gap-3">
          <button type="button" onClick={() => router.push('/leads')} className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white">Cancel</button>
          <button disabled={saving} type="submit" className="px-4 py-2 text-sm font-medium rounded-md bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 shadow-lg shadow-cyan-500/20">
            {saving ? 'Saving...' : 'Create Lead'}
          </button>
        </div>
      </form>
    </div>
  )
}
