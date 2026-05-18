import { useEffect, useState } from 'react'
import { Calendar, Plus, RefreshCw, ExternalLink, Loader2 } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  location?: string
  htmlLink?: string
}

interface CalendarStatus {
  connected: boolean
  email?: string
  authUrl?: string
}

export default function CalendarPage() {
  const [status, setStatus] = useState<CalendarStatus | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const res = await api.get<CalendarStatus>('/calendar/status')
      setStatus(res.data)
      if (res.data.connected) fetchEvents()
    } catch {
      toast.error('Failed to check Calendar status')
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    setRefreshing(true)
    try {
      const res = await api.get<CalendarEvent[]>('/calendar/events')
      setEvents(res.data)
    } catch {
      toast.error('Failed to fetch events')
    } finally {
      setRefreshing(false)
    }
  }

  const handleConnect = () => {
    const stored = localStorage.getItem('auth-storage')
    let token = ''
    if (stored) {
      try { const { state } = JSON.parse(stored); token = state?.token || '' } catch {}
    }
    window.location.href = `/api/google/auth?token=${token}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    )
  }

  if (!status?.connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 py-20">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
          <Calendar className="w-8 h-8 text-blue-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Connect Google Calendar</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Sync your Google Calendar to view and manage meetings with leads directly from the CRM.
          </p>
        </div>
        <button
          onClick={handleConnect}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-colors"
        >
          <Calendar className="w-5 h-5" /> Connect Calendar
        </button>
      </div>
    )
  }

  const today = new Date()
  const upcoming = events.filter(e => new Date(e.start) >= today)
  const past = events.filter(e => new Date(e.start) < today).slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Connected as <strong>{status.email}</strong></span>
        </div>
        <button
          onClick={fetchEvents}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Upcoming events */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Upcoming Events</h2>
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{upcoming.length} events</span>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {upcoming.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">No upcoming events</div>
          ) : (
            upcoming.map(event => (
              <div key={event.id} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                    {new Date(event.start).toLocaleDateString('en', { month: 'short' })}
                  </span>
                  <span className="text-lg font-bold text-brand-700 dark:text-brand-300 leading-none">
                    {new Date(event.start).getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">{event.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date(event.start).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })} —{' '}
                    {new Date(event.end).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {event.location && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{event.location}</p>}
                  {event.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{event.description}</p>}
                </div>
                {event.htmlLink && (
                  <a
                    href={event.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-1.5 text-gray-400 hover:text-brand-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Past events */}
      {past.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-500 dark:text-gray-400 text-sm">Recent Past Events</h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {past.map(event => (
              <div key={event.id} className="px-5 py-3 flex items-center gap-3 opacity-60">
                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{event.title}</span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(event.start).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
