'use client'

import { useState, useEffect } from 'react'

export default function TeamSettingsPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Invite form state
  const [showInvite, setShowInvite] = useState(false)
  const [inviteData, setInviteData] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'BDE' })
  const [inviting, setInviting] = useState(false)

  const fetchUsers = () => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.users) setUsers(data.users)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inviteData)
    })
    setInviting(false)
    setShowInvite(false)
    setInviteData({ firstName: '', lastName: '', email: '', password: '', role: 'BDE' })
    fetchUsers()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove user from workspace?')) return
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    fetchUsers()
  }

  if (loading) return <div className="text-zinc-400">Loading team...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-white">Team Members</h2>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-500"
        >
          {showInvite ? 'Cancel' : 'Invite User'}
        </button>
      </div>

      {showInvite && (
        <form onSubmit={handleInvite} className="mb-8 bg-zinc-900/80 p-4 rounded-lg border border-zinc-800 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="First Name" value={inviteData.firstName} onChange={e => setInviteData({...inviteData, firstName: e.target.value})} className="rounded bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100" />
            <input required placeholder="Last Name" value={inviteData.lastName} onChange={e => setInviteData({...inviteData, lastName: e.target.value})} className="rounded bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input required type="email" placeholder="Email" value={inviteData.email} onChange={e => setInviteData({...inviteData, email: e.target.value})} className="rounded bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100" />
            <input required type="password" placeholder="Temporary Password" value={inviteData.password} onChange={e => setInviteData({...inviteData, password: e.target.value})} className="rounded bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100" />
          </div>
          <select value={inviteData.role} onChange={e => setInviteData({...inviteData, role: e.target.value})} className="w-full rounded bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100">
            <option value="BDE">BDE (Exec)</option>
            <option value="BDM">BDM (Manager)</option>
            <option value="COMPANY_ADMIN">Admin</option>
          </select>
          <button disabled={inviting} type="submit" className="w-full rounded-md bg-cyan-600 py-2 text-sm font-medium text-white hover:bg-cyan-500">
            {inviting ? 'Inviting...' : 'Send Invite'}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-900/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-900/30">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-300">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-white">{user.firstName} {user.lastName}</div>
                      <div className="text-xs text-zinc-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">
                  <span className="inline-flex rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${user.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleDelete(user.id)} className="text-red-400 hover:text-red-300">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
