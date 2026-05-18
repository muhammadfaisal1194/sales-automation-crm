import { useEffect, useState } from 'react'
import { TrendingUp, Users, Mail, CheckCircle, Sparkles, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { SkeletonCard } from '../components/SkeletonCard'
import { ScoreBadge } from '../components/ScoreBadge'
import { STAGES, type Lead, type Activity } from '../types'
import AIDrawer from '../components/AIDrawer'
import toast from 'react-hot-toast'

interface DashboardData {
  leads: Lead[]
  deals: Record<string, { leads: Lead[]; count: number; totalValue: number }>
  activities: Activity[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiDrawer, setAiDrawer] = useState<{ lead: Lead; action: 'draft-email' | 'summarize-deal' | 'next-action' } | null>(null)

  useEffect(() => {
    Promise.all([
      api.get<Lead[]>('/leads'),
      api.get<Record<string, { leads: Lead[]; count: number; totalValue: number }>>('/deals'),
    ]).then(([leadsRes, dealsRes]) => {
      const leads = leadsRes.data
      const allActivities = leads.flatMap(l => l.activities || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)
      setData({ leads, deals: dealsRes.data, activities: allActivities })
    }).catch(() => toast.error('Failed to load dashboard')).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2"><SkeletonCard lines={6} /></div>
          <SkeletonCard lines={6} />
        </div>
      </div>
    )
  }

  if (!data) return null

  const totalPipeline = data.leads.reduce((s, l) => s + l.value, 0)
  const activeLeads = data.leads.length
  const closingDeals = data.deals['Closing']?.count || 0
  const emailsSent = data.activities.filter(a => a.type === 'email').length

  const metrics = [
    { label: 'Pipeline Value', value: `$${(totalPipeline / 1000).toFixed(0)}K`, icon: TrendingUp, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-900/20' },
    { label: 'Active Leads', value: activeLeads, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Emails Sent', value: emailsSent, icon: Mail, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Deals Closing', value: closingDeals, icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
  ]

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{m.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{m.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center`}>
                <m.icon className={`w-5 h-5 ${m.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline preview */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Pipeline Overview</h2>
            <Link to="/pipeline" className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline">
              Full view <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {STAGES.map(stage => {
              const stageData = data.deals[stage]
              const topLeads = stageData?.leads.slice(0, 2) || []
              return (
                <div key={stage} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{stage}</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{stageData?.count || 0}</span>
                  </div>
                  {topLeads.map(lead => (
                    <div key={lead.id} className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{lead.company}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lead.name}</p>
                      <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-1">${(lead.value/1000).toFixed(0)}K</p>
                    </div>
                  ))}
                  {(stageData?.count || 0) > 2 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 pl-2">+{(stageData?.count || 0) - 2} more</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* AI Actions */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" /> AI Actions
            </h2>
          </div>
          <div className="p-4 space-y-2">
            {data.leads.slice(0, 1).map(lead => (
              <div key={lead.id} className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 px-1">Using: {lead.name} · {lead.company}</p>
                {(['draft-email', 'summarize-deal', 'next-action'] as const).map(action => (
                  <button
                    key={action}
                    onClick={() => setAiDrawer({ lead, action })}
                    className="w-full text-left px-3 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-300 transition-colors font-medium"
                  >
                    {action === 'draft-email' ? '✉️ Draft Email' : action === 'summarize-deal' ? '📋 Summarize Deal' : '🎯 Next Best Action'}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {data.activities.slice(0, 8).map(activity => {
            const lead = data.leads.find(l => l.activities?.some(a => a.id === activity.id))
            const icon = activity.type === 'email' ? '✉️' : activity.type === 'call' ? '📞' : activity.type === 'meeting' ? '📅' : activity.type === 'ai' ? '🤖' : '📝'
            return (
              <div key={activity.id} className="flex items-start gap-3 px-5 py-3">
                <span className="text-base">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{activity.summary}</p>
                  {lead && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{lead.name} · {lead.company}</p>}
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                  {new Date(activity.createdAt).toLocaleDateString()}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {aiDrawer && (
        <AIDrawer lead={aiDrawer.lead} action={aiDrawer.action} onClose={() => setAiDrawer(null)} />
      )}
    </div>
  )
}
