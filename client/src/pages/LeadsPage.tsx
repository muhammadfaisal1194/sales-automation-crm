import { useState } from 'react'
import { Plus, Search, Sparkles, Trash2, Edit2, ChevronUp, ChevronDown, X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLeads } from '../hooks/useLeads'
import { STAGES, STAGE_COLORS, type Lead } from '../types'
import { ScoreBadge } from '../components/ScoreBadge'
import { SkeletonTable } from '../components/SkeletonCard'
import AIDrawer from '../components/AIDrawer'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  company: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  title: z.string().optional(),
  source: z.string().optional(),
  stage: z.enum(['Prospecting', 'Qualified', 'Proposal', 'Closing']),
  value: z.coerce.number().min(0),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function LeadModal({ lead, onClose, onSave }: {
  lead: Lead | null
  onClose: () => void
  onSave: (data: FormData) => Promise<void>
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: lead ? {
      name: lead.name, company: lead.company, email: lead.email,
      phone: lead.phone || '', title: lead.title || '', source: lead.source || '',
      stage: lead.stage, value: lead.value, notes: lead.notes || '',
    } : { stage: 'Prospecting', value: 0 },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {lead ? 'Edit Lead' : 'New Lead'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name *</label>
              <input {...register('name')} className="input" placeholder="Full name" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Company *</label>
              <input {...register('company')} className="input" placeholder="Company name" />
              {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email *</label>
              <input {...register('email')} type="email" className="input" placeholder="email@co.com" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Phone</label>
              <input {...register('phone')} className="input" placeholder="+1 555 0100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Title</label>
              <input {...register('title')} className="input" placeholder="Job title" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Source</label>
              <input {...register('source')} className="input" placeholder="LinkedIn, Referral..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Stage *</label>
              <select {...register('stage')} className="input">
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Deal Value ($) *</label>
              <input {...register('value')} type="number" className="input" placeholder="10000" />
              {errors.value && <p className="text-xs text-red-500 mt-1">{errors.value.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
            <textarea {...register('notes')} className="input min-h-[80px] resize-none" placeholder="Notes about this lead..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {lead ? 'Save changes' : 'Create lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LeadsPage() {
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')
  const [modal, setModal] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null })
  const [aiDrawer, setAiDrawer] = useState<{ lead: Lead; action: 'draft-email' | 'summarize-deal' | 'next-action' } | null>(null)

  const { leads, loading, createLead, editLead, deleteLead } = useLeads(
    { stage: stage || undefined, search: search || undefined, sortBy, sortDir }
  )

  const handleSort = (col: string) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return null
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  const handleSave = async (data: FormData) => {
    try {
      if (modal.lead) {
        await editLead(modal.lead.id, data)
      } else {
        await createLead(data as Parameters<typeof createLead>[0])
      }
      setModal({ open: false, lead: null })
    } catch {
      toast.error('Failed to save lead')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return
    await deleteLead(id)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={stage}
          onChange={e => setStage(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={() => setModal({ open: true, lead: null })}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> New Lead
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-4"><SkeletonTable rows={6} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {[
                    { label: 'Name', col: 'name' },
                    { label: 'Company', col: 'company' },
                    { label: 'Stage', col: 'stage' },
                    { label: 'Score', col: 'score' },
                    { label: 'Value', col: 'value' },
                    { label: 'Email', col: null },
                    { label: 'Actions', col: null },
                  ].map(({ label, col }) => (
                    <th
                      key={label}
                      onClick={col ? () => handleSort(col) : undefined}
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide ${col ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none' : ''}`}
                    >
                      <span className="flex items-center gap-1">
                        {label}
                        {col && <SortIcon col={col} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.name}</p>
                      {lead.title && <p className="text-xs text-gray-400 dark:text-gray-500">{lead.title}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{lead.company}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[lead.stage]}`}>
                        {lead.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3"><ScoreBadge score={lead.score} /></td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      ${lead.value.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[160px] truncate">
                      {lead.email}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setAiDrawer({ lead, action: 'draft-email' })}
                          className="p-1.5 text-brand-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                          title="AI Actions"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setModal({ open: true, lead })}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                      No leads found. Create your first lead to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.open && (
        <LeadModal
          lead={modal.lead}
          onClose={() => setModal({ open: false, lead: null })}
          onSave={handleSave}
        />
      )}

      {aiDrawer && (
        <AIDrawer lead={aiDrawer.lead} action={aiDrawer.action} onClose={() => setAiDrawer(null)} />
      )}

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid rgb(229 231 235);
          background: white;
          color: rgb(17 24 39);
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          ring: 2px;
          ring-color: rgb(14 165 233);
          border-color: rgb(14 165 233);
        }
        @media (prefers-color-scheme: dark) {
          .input {
            border-color: rgb(55 65 81);
            background: rgb(31 41 55);
            color: white;
          }
        }
        .dark .input {
          border-color: rgb(55 65 81);
          background: rgb(31 41 55);
          color: white;
        }
      `}</style>
    </div>
  )
}
