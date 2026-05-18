import { useState, useRef, useEffect } from 'react'
import { X, Copy, Send, RefreshCw, Sparkles, CheckCircle } from 'lucide-react'
import { useAI } from '../hooks/useAI'
import type { Lead } from '../types'
import toast from 'react-hot-toast'
import api from '../services/api'

interface Props {
  lead: Lead
  action: 'draft-email' | 'summarize-deal' | 'next-action'
  onClose: () => void
}

const ACTION_LABELS = {
  'draft-email': 'Draft Email',
  'summarize-deal': 'Summarize Deal',
  'next-action': 'Next Best Action',
}

export default function AIDrawer({ lead, action, onClose }: Props) {
  const { output, loading, error, done, run, reset } = useAI()
  const [copied, setCopied] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    run(action, lead.id)
  }, [lead.id, action])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard')
  }

  const handleSendEmail = async () => {
    if (action !== 'draft-email') return
    const lines = output.split('\n')
    const subjectLine = lines.find(l => l.startsWith('Subject:'))
    const subject = subjectLine ? subjectLine.replace('Subject:', '').trim() : 'Follow up'
    const body = lines.slice(lines.indexOf(subjectLine || '') + 2).join('\n').trim()
    try {
      await api.post('/gmail/send', { to: lead.email, subject, body, leadId: lead.id })
      toast.success('Email sent!')
      onClose()
    } catch {
      toast.error('Failed to send email. Check Gmail connection in Settings.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 dark:bg-black/60" onClick={onClose} />
      <div className="w-[520px] bg-white dark:bg-gray-900 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{ACTION_LABELS[action]}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{lead.name} · {lead.company}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Output area */}
        <div className="flex-1 overflow-hidden flex flex-col p-6">
          {loading && !output && (
            <div className="flex items-center gap-3 text-brand-600 dark:text-brand-400 mb-4">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm font-medium">Claude is thinking...</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">{error}</p>
              <button
                onClick={() => { reset(); run(action, lead.id) }}
                className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          <div
            ref={outputRef}
            className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-xl p-4 font-mono text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed"
          >
            {output || (loading ? '' : 'No output yet')}
            {loading && output && <span className="inline-block w-0.5 h-4 bg-brand-500 animate-pulse ml-0.5 align-text-bottom" />}
          </div>
        </div>

        {/* Actions */}
        {(done || output) && (
          <div className="flex items-center gap-2 px-6 pb-4">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            {action === 'draft-email' && (
              <button
                onClick={handleSendEmail}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Send className="w-4 h-4" />
                Send via Gmail
              </button>
            )}
            <button
              onClick={() => { reset(); run(action, lead.id) }}
              className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
