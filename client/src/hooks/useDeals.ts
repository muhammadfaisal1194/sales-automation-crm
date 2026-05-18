import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import type { Lead, Stage } from '../types'
import { useLeadsStore } from '../store/leadsStore'
import toast from 'react-hot-toast'

interface StageGroup {
  leads: Lead[]
  count: number
  totalValue: number
}

export function useDeals() {
  const [deals, setDeals] = useState<Record<string, StageGroup>>({})
  const [loading, setLoading] = useState(false)
  const { updateLead } = useLeadsStore()

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<Record<string, StageGroup>>('/deals')
      setDeals(res.data)
    } catch {
      toast.error('Failed to load pipeline')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDeals()
  }, [fetchDeals])

  const moveToStage = async (leadId: string, stage: Stage) => {
    try {
      const res = await api.put(`/deals/${leadId}/stage`, { stage })
      updateLead(leadId, res.data)
      await fetchDeals()
      toast.success(`Moved to ${stage}`)
    } catch {
      toast.error('Failed to move deal')
    }
  }

  return { deals, loading, fetchDeals, moveToStage }
}
