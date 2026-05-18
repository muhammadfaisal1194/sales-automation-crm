import { create } from 'zustand'
import type { Lead } from '../types'

interface LeadsState {
  leads: Lead[]
  selectedLead: Lead | null
  setLeads: (leads: Lead[]) => void
  setSelectedLead: (lead: Lead | null) => void
  updateLead: (id: string, data: Partial<Lead>) => void
  removeLead: (id: string) => void
  addLead: (lead: Lead) => void
}

export const useLeadsStore = create<LeadsState>((set) => ({
  leads: [],
  selectedLead: null,
  setLeads: (leads) => set({ leads }),
  setSelectedLead: (lead) => set({ selectedLead: lead }),
  updateLead: (id, data) =>
    set((s) => ({
      leads: s.leads.map((l) => (l.id === id ? { ...l, ...data } : l)),
      selectedLead: s.selectedLead?.id === id ? { ...s.selectedLead, ...data } : s.selectedLead,
    })),
  removeLead: (id) => set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })),
  addLead: (lead) => set((s) => ({ leads: [lead, ...s.leads] })),
}))
