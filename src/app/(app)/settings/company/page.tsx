'use client'

import { useState, useEffect } from 'react'

export default function CompanySettingsPage() {
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', domain: '', primaryColor: '' })

  useEffect(() => {
    fetch('/api/companies/me')
      .then(res => res.json())
      .then(data => {
        if (data.company) {
          setCompany(data.company)
          setFormData({
            name: data.company.name || '',
            domain: data.company.domain || '',
            primaryColor: data.company.primaryColor || '#06B6D4'
          })
        }
        setLoading(false)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/companies/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    setSaving(false)
  }

  if (loading) return <div className="text-zinc-400">Loading...</div>

  return (
    <div>
      <h2 className="text-xl font-medium text-white mb-6">Company Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        <div>
          <label className="block text-sm font-medium uppercase text-zinc-400">Company Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium uppercase text-zinc-400">Custom Domain</label>
          <input
            type="text"
            value={formData.domain}
            placeholder="crm.yourcompany.com"
            onChange={e => setFormData({ ...formData, domain: e.target.value })}
            className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium uppercase text-zinc-400">Primary Color</label>
          <div className="mt-1 flex items-center gap-3">
            <input
              type="color"
              value={formData.primaryColor}
              onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
              className="h-9 w-9 rounded border border-zinc-800 cursor-pointer bg-zinc-950"
            />
            <input
              type="text"
              value={formData.primaryColor}
              onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
              className="block flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex justify-center rounded-md border border-transparent bg-cyan-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
