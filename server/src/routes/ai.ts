import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authenticate, AuthRequest } from '../middleware/auth'
import { draftEmail } from '../ai/draftEmail'
import { scoreLeads } from '../ai/scoreLeads'
import { summarizeDeal } from '../ai/summarizeDeal'
import { nextAction } from '../ai/nextAction'

export const aiRouter = Router()
const prisma = new PrismaClient()

aiRouter.use(authenticate)

aiRouter.post('/draft-email', async (req: AuthRequest, res) => {
  const { leadId, context } = z.object({ leadId: z.string(), context: z.string().optional() }).parse(req.body)
  const lead = await prisma.lead.findFirst({ where: { id: leadId, userId: req.userId } })
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' })
    return
  }
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  await draftEmail(lead, context, res)
  res.end()
})

aiRouter.post('/score-leads', async (req: AuthRequest, res) => {
  const { leadIds } = z.object({ leadIds: z.array(z.string()) }).parse(req.body)
  const leads = await prisma.lead.findMany({ where: { id: { in: leadIds }, userId: req.userId } })
  const results = await scoreLeads(leads, prisma)
  res.json(results)
})

aiRouter.post('/summarize-deal', async (req: AuthRequest, res) => {
  const { leadId } = z.object({ leadId: z.string() }).parse(req.body)
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId: req.userId },
    include: { activities: { orderBy: { createdAt: 'desc' }, take: 10 } },
  })
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' })
    return
  }
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  await summarizeDeal(lead, res)
  res.end()
})

aiRouter.post('/score/:leadId', async (req: AuthRequest, res) => {
  const leadId = req.params.leadId
  const lead = await prisma.lead.findFirst({ where: { id: leadId, userId: req.userId } })
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' })
    return
  }
  const results = await scoreLeads([lead], prisma)
  res.json(results[0] || { score: 0, insight: '' })
})

aiRouter.post('/score-all', async (req: AuthRequest, res) => {
  const leads = await prisma.lead.findMany({ where: { userId: req.userId } })
  const results = await scoreLeads(leads, prisma)
  const updatedLeads = await prisma.lead.findMany({ where: { userId: req.userId } })
  res.json(updatedLeads)
})

aiRouter.post('/next-action', async (req: AuthRequest, res) => {
  const { leadId } = z.object({ leadId: z.string() }).parse(req.body)
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId: req.userId },
    include: { activities: { orderBy: { createdAt: 'desc' }, take: 10 } },
  })
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' })
    return
  }
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  await nextAction(lead, res)
  res.end()
})
