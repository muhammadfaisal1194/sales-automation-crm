import { useState } from 'react'
import { Brain, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { useLeads } from '../hooks/useLeads'
import AIDrawer from '../components/AIDrawer'
import { ScoreBadge } from '../components/ScoreBadge'
import { STAGE_COLORS, type Lead } from '../types'

type AIAction = 'draft-email' | 'summarize-deal' | 'next-action'

const AI_ACTIONS: { action: AIAction; label: string; description: string; emoji: string }[] = [
  { action: 'draft-email', label: 'Draft Email', description: 'Generate a personalized outreach email', emoji: '✉️' },
  { action: 'summarize-deal', label: 'Summarize Deal', description: 'Get a deal status summary and key facts', emoji: '📋' },
  { action: 'next-action', label: 'Next Best Action', description: 'AI recommends what to do next', emoji: '🎯' },
]

function LeadRow({ lead, onAction }: { lead: Lead; onAction: (lead: Lead, action: AIAction) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <p className="font-semibold text-gray-900 dark:text-white">{lead.name}</p>
            <span className="text-gray-400 dark:text-gray-500">·</span>
            <p className="text-sm text-gray-500 dark:text-gray-400">{lead.company}</p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[lead.stage]}`}>
              {lead.stage}
            </span>
            <ScoreBadge score={lead.score} />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">${lead.value.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">{expanded ? 'Hide' : 'AI Actions'}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4 grid grid-cols-3 gap-3 border-t border-gray-50 dark:border-gray-800 pt-4">
          {AI_ACTIONS.map(({ action, label, description, emoji }) => (
            <button
              key={action}
              onClick={() => onAction(lead, action)}
              className="flex flex-col items-start gap-1 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl transition-colors group text-left"
            >
              <span className="text-lg">{emoji}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-300">{label}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AIInsightsPage() {
  const { leads, loading } = useLeads()
  const [aiDrawer, setAiDrawer] = useState<{ lead: Lead; action: AIAction } | null>(null)
  const [filter, setFilter] = useState<'all' | 'hot' | 'unscored'>('all')

  const filtered = leads.filter(l => {
    if (filter === 'hot') return (l.score ?? 0) >= 70
    if (filter === 'unscored') return l.score == null
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-brand-500" /> AI Insights
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Claude-powered assistance for every lead
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['all', 'hot', 'unscored'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-100 dark:border-brand-800">
        <Sparkles className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-brand-800 dark:text-brand-200">AI-Powered Sales Assistant</p>
          <p className="text-xs text-brand-600 dark:text-brand-400 mt-0.5">
            Click on any lead to expand AI actions. Claude will analyze the lead's data to draft personalized emails,
            summarize deal status, or recommend the next best action.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => (
            <LeadRow
              key={lead.id}
              lead={lead}
              onAction={(l, action) => setAiDrawer({ lead: l, action })}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-400 dark:text-gray-500">
              No leads match the filter. Try a different view.
            </div>
          )}
        </div>
      )}

      {aiDrawer && (
        <AIDrawer
          lead={aiDrawer.lead}
          action={aiDrawer.action}
          onClose={() => setAiDrawer(null)}
        />
      )}
    </div>
  )
}
