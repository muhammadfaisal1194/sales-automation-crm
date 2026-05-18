import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Sparkles, Plus, GripVertical } from 'lucide-react'
import { useDeals } from '../hooks/useDeals'
import { STAGES, STAGE_COLORS, type Lead, type Stage } from '../types'
import { ScoreBadge } from '../components/ScoreBadge'
import AIDrawer from '../components/AIDrawer'
import { SkeletonCard } from '../components/SkeletonCard'

function LeadCard({ lead, onAI }: { lead: Lead; onAI: (lead: Lead) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-0.5 text-gray-300 dark:text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{lead.company}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lead.name}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">${(lead.value / 1000).toFixed(0)}K</span>
            <ScoreBadge score={lead.score} />
          </div>
        </div>
        <button
          onClick={() => onAI(lead)}
          className="opacity-0 group-hover:opacity-100 p-1 text-brand-400 hover:text-brand-600 transition-all rounded"
          title="AI Actions"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const { deals, loading, moveToStage } = useDeals()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [aiDrawer, setAiDrawer] = useState<{ lead: Lead; action: 'draft-email' | 'summarize-deal' | 'next-action' } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const allLeads = STAGES.flatMap(s => deals[s]?.leads || [])
  const activeLead = activeId ? allLeads.find(l => l.id === activeId) : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const leadId = String(active.id)
    const targetStage = String(over.id) as Stage

    if (STAGES.includes(targetStage)) {
      const currentStage = STAGES.find(s => deals[s]?.leads.some(l => l.id === leadId))
      if (currentStage !== targetStage) {
        moveToStage(leadId, targetStage)
      }
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4 h-full">
        {STAGES.map(s => <SkeletonCard key={s} lines={5} />)}
      </div>
    )
  }

  const totalPipeline = STAGES.reduce((sum, s) => sum + (deals[s]?.totalValue || 0), 0)

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header stats */}
      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Total Pipeline</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${(totalPipeline / 1000).toFixed(0)}K</p>
        </div>
        {STAGES.map(stage => (
          <div key={stage} className="hidden lg:block">
            <p className="text-xs text-gray-500 dark:text-gray-400">{stage}</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {deals[stage]?.count || 0} · ${((deals[stage]?.totalValue || 0) / 1000).toFixed(0)}K
            </p>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 flex-1 overflow-x-auto pb-2">
          {STAGES.map(stage => {
            const stageDeals = deals[stage] || { leads: [], count: 0, totalValue: 0 }
            return (
              <div key={stage} id={stage} className="flex flex-col w-64 flex-shrink-0">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[stage]}`}>{stage}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{stageDeals.count}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    ${(stageDeals.totalValue / 1000).toFixed(0)}K
                  </span>
                </div>

                {/* Drop zone */}
                <SortableContext items={stageDeals.leads.map(l => l.id)} strategy={verticalListSortingStrategy} id={stage}>
                  <div className="flex-1 space-y-2.5 min-h-[200px] rounded-xl bg-gray-100/50 dark:bg-gray-800/30 p-2">
                    {stageDeals.leads.map(lead => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onAI={(l) => setAiDrawer({ lead: l, action: 'draft-email' })}
                      />
                    ))}
                    {stageDeals.leads.length === 0 && (
                      <div className="flex items-center justify-center h-20 text-xs text-gray-400 dark:text-gray-600">
                        Drop here
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            )
          })}
        </div>

        <DragOverlay>
          {activeLead && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-brand-200 dark:border-brand-700 shadow-xl w-64 rotate-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{activeLead.company}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{activeLead.name}</p>
              <p className="text-xs font-bold text-brand-600 dark:text-brand-400 mt-1">${(activeLead.value / 1000).toFixed(0)}K</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {aiDrawer && (
        <AIDrawer lead={aiDrawer.lead} action={aiDrawer.action} onClose={() => setAiDrawer(null)} />
      )}
    </div>
  )
}
