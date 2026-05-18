import { useEffect, useState } from 'react'
import { BarChart3, RefreshCw, Zap, Loader2 } from 'lucide-react'
import api from '../services/api'
import { ScoreBadge } from '../components/ScoreBadge'
import { STAGE_COLORS, type Lead } from '../types'
import toast from 'react-hot-toast'

export default function LeadScoringPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState<string | null>(null)
  const [scoringAll, setScoringAll] = useState(false)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const res = await api.get<Lead[]>('/leads')
      setLeads(res.data)
    } catch {
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  const scoreOne = async (lead: Lead) => {
    setScoring(lead.id)
    try {
      const res = await api.post<{ score: number; insight: string }>(`/ai/score/${lead.id}`)
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, score: res.data.score, scoreInsight: res.data.insight } : l))
      toast.success(`${lead.name} scored: ${res.data.score}`)
    } catch {
      toast.error('Failed to score lead')
    } finally {
      setScoring(null)
    }
  }

  const scoreAll = async () => {
    setScoringAll(true)
    try {
      const res = await api.post<Lead[]>('/ai/score-all')
      setLeads(res.data)
      toast.success('All leads scored!')
    } catch {
      toast.error('Failed to score all leads')
    } finally {
      setScoringAll(false)
    }
  }

  const sorted = [...leads].sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
  const hotLeads = sorted.filter(l => (l.score ?? 0) >= 70)
  const warmLeads = sorted.filter(l => (l.score ?? 0) >= 40 && (l.score ?? 0) < 70)
  const coldLeads = sorted.filter(l => (l.score ?? 0) < 40)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-500" /> Lead Scoring
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">AI-powered lead qualification scores</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchLeads} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={scoreAll}
            disabled={scoringAll}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
          >
            {scoringAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Score All Leads
          </button>
        </div>
      </div>

      {/* Score distribution */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Hot Leads', count: hotLeads.length, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', dot: 'bg-red-500' },
          { label: 'Warm Leads', count: warmLeads.length, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', dot: 'bg-orange-500' },
          { label: 'Cold Leads', count: coldLeads.length, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', dot: 'bg-blue-500' },
        ].map(item => (
          <div key={item.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${item.dot}`} />
              <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
            </div>
            <p className={`text-3xl font-bold ${item.color}`}>{item.count}</p>
          </div>
        ))}
      </div>

      {/* Leads table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Lead</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Stage</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Score</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Insight</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Value</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {sorted.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{lead.company}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[lead.stage]}`}>
                      {lead.stage}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <ScoreBadge score={lead.score} />
                  </td>
                  <td className="px-5 py-3 max-w-[280px]">
                    {lead.scoreInsight ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{lead.scoreInsight}</p>
                    ) : (
                      <span className="text-xs text-gray-300 dark:text-gray-600">Not scored yet</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                    ${lead.value.toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => scoreOne(lead)}
                      disabled={scoring === lead.id || scoringAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-lg text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30 disabled:opacity-50 transition-colors"
                    >
                      {scoring === lead.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                      Score
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
