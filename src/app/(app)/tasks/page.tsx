'use client'

import { useState, useEffect } from 'react'
import { Plus, CheckCircle2, Circle, Clock } from 'lucide-react'

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  
  // Add form state
  const [formData, setFormData] = useState({ title: '', priority: 'MEDIUM', assigneeId: '', dueDate: '' })
  const [users, setUsers] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  const fetchTasks = () => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => {
        if (data.tasks) setTasks(data.tasks)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchTasks()
    fetch('/api/users').then(res => res.json()).then(data => {
      if (data.users) setUsers(data.users)
    })
  }, [])

  const handleStatusChange = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
    
    // Optimistic
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
      })
    })
    if (res.ok) {
      setShowAdd(false)
      setFormData({ title: '', priority: 'MEDIUM', assigneeId: '', dueDate: '' })
      fetchTasks()
    }
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-zinc-400">Loading tasks...</div>

  const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED')

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tasks</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage your internal and lead-specific operational tasks.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-500/20"
        >
          <Plus className="h-4 w-4" />
          {showAdd ? 'Cancel' : 'Add Task'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-8 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-6 rounded-xl space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Task Title</label>
            <input required autoFocus type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Priority</label>
              <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Due Date</label>
              <input type="datetime-local" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Assignee</label>
              <select required value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500">
                <option value="">Select User...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button disabled={saving} type="submit" className="px-4 py-2 text-sm font-medium rounded-md bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto space-y-8 pb-8">
        <div>
          <h2 className="text-sm font-semibold uppercase text-zinc-500 tracking-wider mb-4 flex items-center gap-2">
            Pending <span className="bg-zinc-800 text-zinc-300 py-0.5 px-2 rounded-full text-xs">{pendingTasks.length}</span>
          </h2>
          <div className="space-y-2">
            {pendingTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors group">
                <div className="flex items-center gap-4">
                  <button onClick={() => handleStatusChange(task.id, task.status)} className="text-zinc-500 hover:text-cyan-400 transition-colors">
                    <Circle className="h-5 w-5" />
                  </button>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-100">{task.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      {task.dueDate && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(task.dueDate).toLocaleDateString()}</span>}
                      <span className={`font-medium ${task.priority === 'URGENT' ? 'text-red-400' : task.priority === 'HIGH' ? 'text-amber-400' : 'text-zinc-500'}`}>
                        {task.priority}
                      </span>
                      <span>•</span>
                      <span>Assigned to: {task.assignee.firstName}</span>
                    </div>
                  </div>
                </div>
                {task.lead && (
                  <div className="hidden sm:block px-3 py-1 bg-zinc-800/50 rounded-md border border-zinc-700/50 text-xs text-zinc-400">
                    Lead: <span className="text-zinc-300 font-medium">{task.lead.name}</span>
                  </div>
                )}
              </div>
            ))}
            {pendingTasks.length === 0 && <div className="text-sm text-zinc-500 italic p-4">No pending tasks.</div>}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase text-zinc-500 tracking-wider mb-4 flex items-center gap-2">
            Completed <span className="bg-zinc-800 text-zinc-300 py-0.5 px-2 rounded-full text-xs">{completedTasks.length}</span>
          </h2>
          <div className="space-y-2 opacity-60">
            {completedTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-zinc-900/20 border border-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <button onClick={() => handleStatusChange(task.id, task.status)} className="text-emerald-500 hover:text-emerald-400 transition-colors">
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-300 line-through decoration-zinc-600">{task.title}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
