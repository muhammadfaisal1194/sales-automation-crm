import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authenticate, AuthRequest } from '../middleware/auth'

export const dealsRouter = Router()
const prisma = new PrismaClient()

dealsRouter.use(authenticate)

const STAGES = ['Prospecting', 'Qualified', 'Proposal', 'Closing']

dealsRouter.get('/', async (req: AuthRequest, res) => {
  const leads = await prisma.lead.findMany({
    where: { userId: req.userId },
    include: { activities: { orderBy: { createdAt: 'desc' }, take: 5 } },
    orderBy: { updatedAt: 'desc' },
  })
  type LeadItem = (typeof leads)[0]
  const grouped = STAGES.reduce((acc, stage) => {
    const stageLeads = leads.filter((l: LeadItem) => l.stage === stage)
    acc[stage] = {
      leads: stageLeads,
      count: stageLeads.length,
      totalValue: stageLeads.reduce((sum: number, l: LeadItem) => sum + l.value, 0),
    }
    return acc
  }, {} as Record<string, { leads: LeadItem[]; count: number; totalValue: number }>)
  res.json(grouped)
})

dealsRouter.put('/:id/stage', async (req: AuthRequest, res) => {
  const { id } = req.params
  const { stage } = z.object({ stage: z.enum(['Prospecting', 'Qualified', 'Proposal', 'Closing']) }).parse(req.body)
  const existing = await prisma.lead.findFirst({ where: { id, userId: req.userId } })
  if (!existing) {
    res.status(404).json({ error: 'Lead not found' })
    return
  }
  const lead = await prisma.lead.update({ where: { id }, data: { stage } })
  await prisma.activity.create({
    data: {
      leadId: id,
      type: 'note',
      summary: `Stage changed from ${existing.stage} to ${stage}`,
    },
  })
  res.json(lead)
})
