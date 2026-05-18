import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import { useLeadsStore } from '../store/leadsStore'
import type { Lead } from '../types'
import toast from 'react-hot-toast'

export function useLeads(params?: { stage?: string; search?: string; sortBy?: string; sortDir?: string }) {
  const [loading, setLoading] = useState(false)
  const { leads, setLeads, updateLead, removeLead, addLead } = useLeadsStore()

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<Lead[]>('/leads', { params })
      setLeads(res.data)
    } catch {
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [params?.stage, params?.search, params?.sortBy, params?.sortDir])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const createLead = async (data: Omit<Lead, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'activities'>) => {
    const res = await api.post<Lead>('/leads', data)
    addLead(res.data)
    toast.success('Lead created')
    return res.data
  }

  const editLead = async (id: string, data: Partial<Lead>) => {
    const res = await api.put<Lead>(`/leads/${id}`, data)
    updateLead(id, res.data)
    toast.success('Lead updated')
    return res.data
  }

  const deleteLead = async (id: string) => {
    await api.delete(`/leads/${id}`)
    removeLead(id)
    toast.success('Lead deleted')
  }

  return { leads, loading, fetchLeads, createLead, editLead, deleteLead }
}
