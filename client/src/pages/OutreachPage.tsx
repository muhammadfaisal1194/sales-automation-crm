import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Send, Sparkles, X, Loader2 } from 'lucide-react'
import api from '../services/api'
import type { EmailTemplate, Lead } from '../types'
import { useLeads } from '../hooks/useLeads'
import AIDrawer from '../components/AIDrawer'
import toast from 'react-hot-toast'

function TemplateModal({ template, onClose, onSave }: {
  template: EmailTemplate | null
  onClose: () => void
  onSave: (data: { name: string; subject: string; body: string }) => Promise<void>
}) {
  const [name, setName] = useState(template?.name || '')
  const [subject, setSubject] = useState(template?.subject || '')
  const [body, setBody] = useState(template?.body || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name || !subject || !body) { toast.error('All fields required'); return }
    setSaving(true)
    try { await onSave({ name, subject, body }) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {template ? 'Edit Template' : 'New Template'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Template Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Initial Outreach"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Email subject line"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Body</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none font-mono"
              placeholder="Dear {{name}},&#10;&#10;..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Template
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OutreachPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; template: EmailTemplate | null }>({ open: false, template: null })
  const [sending, setSending] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState('')
  const [aiDrawer, setAiDrawer] = useState<{ lead: Lead; action: 'draft-email' } | null>(null)
  const { leads } = useLeads()

  useEffect(() => {
    api.get<EmailTemplate[]>('/outreach/templates')
      .then(r => setTemplates(r.data))
      .catch(() => toast.error('Failed to load templates'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (data: { name: string; subject: string; body: string }) => {
    if (modal.template) {
      const res = await api.put<EmailTemplate>(`/outreach/templates/${modal.template.id}`, data)
      setTemplates(t => t.map(x => x.id === modal.template!.id ? res.data : x))
      toast.success('Template updated')
    } else {
      const res = await api.post<EmailTemplate>('/outreach/templates', data)
      setTemplates(t => [...t, res.data])
      toast.success('Template created')
    }
    setModal({ open: false, template: null })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return
    await api.delete(`/outreach/templates/${id}`)
    setTemplates(t => t.filter(x => x.id !== id))
    toast.success('Template deleted')
  }

  const handleSend = async (template: EmailTemplate) => {
    if (!selectedLead) { toast.error('Select a lead to send to'); return }
    const lead = leads.find(l => l.id === selectedLead)
    if (!lead) return
    setSending(template.id)
    try {
      await api.post('/gmail/send', {
        to: lead.email,
        subject: template.subject.replace('{{name}}', lead.name).replace('{{company}}', lead.company),
        body: template.body.replace(/\{\{name\}\}/g, lead.name).replace(/\{\{company\}\}/g, lead.company),
        leadId: lead.id,
      })
      toast.success(`Email sent to ${lead.email}`)
    } catch {
      toast.error('Failed to send. Check Gmail connection in Settings.')
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email Templates</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create reusable email templates for outreach</p>
        </div>
        <button
          onClick={() => setModal({ open: true, template: null })}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {/* Lead selector */}
      <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Send to:</label>
        <select
          value={selectedLead}
          onChange={e => setSelectedLead(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Select a lead...</option>
          {leads.map(l => <option key={l.id} value={l.id}>{l.name} · {l.company} ({l.email})</option>)}
        </select>
        {selectedLead && leads.find(l => l.id === selectedLead) && (
          <button
            onClick={() => setAiDrawer({ lead: leads.find(l => l.id === selectedLead)!, action: 'draft-email' })}
            className="flex items-center gap-2 px-3 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-lg text-sm font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
          >
            <Sparkles className="w-4 h-4" /> AI Draft
          </button>
        )}
      </div>

      {/* Templates grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(template => (
            <div key={template.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{template.subject}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setModal({ open: true, template })}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 font-mono text-xs bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                {template.body}
              </p>
              <button
                onClick={() => handleSend(template)}
                disabled={!!sending || !selectedLead}
                className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-40"
              >
                {sending === template.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Send
              </button>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="col-span-2 text-center py-12 text-sm text-gray-400 dark:text-gray-500">
              No templates yet. Create your first email template.
            </div>
          )}
        </div>
      )}

      {modal.open && (
        <TemplateModal template={modal.template} onClose={() => setModal({ open: false, template: null })} onSave={handleSave} />
      )}

      {aiDrawer && (
        <AIDrawer lead={aiDrawer.lead} action={aiDrawer.action} onClose={() => setAiDrawer(null)} />
      )}
    </div>
  )
}
