export interface User {
  id: string
  name: string
  email: string
}

export interface Activity {
  id: string
  leadId: string
  type: 'email' | 'call' | 'meeting' | 'note' | 'ai'
  summary: string
  createdAt: string
}

export interface Lead {
  id: string
  name: string
  company: string
  email: string
  phone?: string
  title?: string
  source?: string
  stage: 'Prospecting' | 'Qualified' | 'Proposal' | 'Closing'
  score?: number
  scoreInsight?: string
  value: number
  notes?: string
  userId: string
  activities?: Activity[]
  createdAt: string
  updatedAt: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  userId: string
}

export type Stage = 'Prospecting' | 'Qualified' | 'Proposal' | 'Closing'

export const STAGES: Stage[] = ['Prospecting', 'Qualified', 'Proposal', 'Closing']

export const STAGE_COLORS: Record<Stage, string> = {
  Prospecting: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Qualified: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  Proposal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Closing: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}
