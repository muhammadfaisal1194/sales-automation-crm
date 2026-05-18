import { useEffect, useState } from 'react'
import { Mail, RefreshCw, Send, Inbox, Star, Loader2 } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

interface GmailMessage {
  id: string
  threadId: string
  subject: string
  from: string
  snippet: string
  date: string
  isRead: boolean
}

interface GmailStatus {
  connected: boolean
  email?: string
  authUrl?: string
}

export default function GmailPage() {
  const [status, setStatus] = useState<GmailStatus | null>(null)
  const [messages, setMessages] = useState<GmailMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState<GmailMessage | null>(null)
  const [compose, setCompose] = useState(false)
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const res = await api.get<GmailStatus>('/gmail/status')
      setStatus(res.data)
      if (res.data.connected) fetchMessages()
    } catch {
      toast.error('Failed to check Gmail status')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    setRefreshing(true)
    try {
      const res = await api.get<GmailMessage[]>('/gmail/messages')
      setMessages(res.data)
    } catch {
      toast.error('Failed to fetch messages')
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

  const handleSend = async () => {
    if (!to || !subject || !body) { toast.error('Fill all fields'); return }
    setSending(true)
    try {
      await api.post('/gmail/send', { to, subject, body })
      toast.success('Email sent!')
      setCompose(false)
      setTo(''); setSubject(''); setBody('')
      fetchMessages()
    } catch {
      toast.error('Failed to send email')
    } finally {
      setSending(false)
    }
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
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <Mail className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Connect Gmail</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Connect your Gmail account to send emails directly from the CRM and track email activity for your leads.
          </p>
        </div>
        <button
          onClick={handleConnect}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-colors"
        >
          <Mail className="w-5 h-5" /> Connect Gmail
        </button>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Configure Gmail OAuth credentials in Settings first.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Connected as <strong>{status.email}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMessages}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => setCompose(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg"
          >
            <Send className="w-4 h-4" /> Compose
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* List */}
        <div className="w-80 flex-shrink-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <Inbox className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Inbox ({messages.length})</span>
          </div>
          {messages.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">No messages</div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  onClick={() => setSelected(msg)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${selected?.id === msg.id ? 'bg-brand-50 dark:bg-brand-900/20' : ''} ${!msg.isRead ? 'font-semibold' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{msg.from}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">{new Date(msg.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white truncate">{msg.subject}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{msg.snippet}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-y-auto">
          {selected ? (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{selected.subject}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <span>From: <strong>{selected.from}</strong></span>
                <span>{new Date(selected.date).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selected.snippet}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-500">
              Select a message to read
            </div>
          )}
        </div>
      </div>

      {/* Compose modal */}
      {compose && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6">
          <div className="w-[480px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900 dark:bg-gray-800 rounded-t-2xl">
              <span className="text-sm font-medium text-white">New Message</span>
              <button onClick={() => setCompose(false)} className="text-gray-400 hover:text-white">
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>
            <div className="p-4 space-y-3">
              <input value={to} onChange={e => setTo(e.target.value)} placeholder="To" className="w-full px-3 py-2 text-sm border-b border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white focus:outline-none" />
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="w-full px-3 py-2 text-sm border-b border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white focus:outline-none" />
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} placeholder="Write your message..." className="w-full px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:outline-none resize-none" />
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                <button onClick={() => setCompose(false)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Discard</button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
