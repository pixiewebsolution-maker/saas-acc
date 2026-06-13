'use client'

import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, CheckCircle2, Phone, Briefcase } from 'lucide-react'

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/calendar')
      .then(res => res.json())
      .then(data => {
        if (data.events) setEvents(data.events)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-8 text-zinc-400">Loading calendar...</div>

  const today = new Date()
  today.setHours(0,0,0,0)

  const overdueEvents = events.filter(e => new Date(e.date) < today && e.status !== 'COMPLETED')
  const upcomingEvents = events.filter(e => new Date(e.date) >= today)

  const EventCard = ({ event }: { event: any }) => {
    const isTask = event.type === 'TASK'
    const isMeeting = event.type === 'MEETING'
    const isFollowUp = event.type === 'FOLLOWUP'

    return (
      <div className="flex items-start gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800/50 transition-colors">
        <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isTask ? 'bg-purple-500/20 text-purple-400' : isMeeting ? 'bg-cyan-500/20 text-cyan-400' : 'bg-amber-500/20 text-amber-400'}`}>
          {isTask && <Briefcase className="h-4 w-4" />}
          {isMeeting && <CalendarIcon className="h-4 w-4" />}
          {isFollowUp && <Phone className="h-4 w-4" />}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="text-sm font-medium text-white">{event.title}</h4>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${event.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
              {event.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
            <Clock className="h-3 w-3" />
            <span>{new Date(event.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Unified Calendar</h1>
        <p className="text-sm text-zinc-400 mt-1">All your scheduled meetings, tasks, and follow-ups in one place.</p>
      </div>

      {overdueEvents.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-semibold uppercase text-red-500 tracking-wider mb-4 flex items-center gap-2">
            Overdue <span className="bg-red-500/10 text-red-400 py-0.5 px-2 rounded-full text-xs">{overdueEvents.length}</span>
          </h2>
          <div className="space-y-3">
            {overdueEvents.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold uppercase text-zinc-500 tracking-wider mb-4 flex items-center gap-2">
          Upcoming <span className="bg-zinc-800 text-zinc-300 py-0.5 px-2 rounded-full text-xs">{upcomingEvents.length}</span>
        </h2>
        <div className="space-y-3">
          {upcomingEvents.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm border border-zinc-800 border-dashed rounded-xl">
              No upcoming scheduled events.
            </div>
          ) : (
            upcomingEvents.map(e => <EventCard key={e.id} event={e} />)
          )}
        </div>
      </div>
    </div>
  )
}
