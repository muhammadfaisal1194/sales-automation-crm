import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authenticate, AuthRequest } from '../middleware/auth'

export const outreachRouter = Router()
const prisma = new PrismaClient()

outreachRouter.use(authenticate)

const templateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
})

outreachRouter.get('/templates', async (req: AuthRequest, res) => {
  const templates = await prisma.emailTemplate.findMany({
    where: { userId: req.userId },
    orderBy: { name: 'asc' },
  })
  res.json(templates)
})

outreachRouter.post('/templates', async (req: AuthRequest, res) => {
  const data = templateSchema.parse(req.body)
  const template = await prisma.emailTemplate.create({
    data: { ...data, userId: req.userId! },
  })
  res.json(template)
})

outreachRouter.put('/templates/:id', async (req: AuthRequest, res) => {
  const { id } = req.params
  const existing = await prisma.emailTemplate.findFirst({ where: { id, userId: req.userId } })
  if (!existing) {
    res.status(404).json({ error: 'Template not found' })
    return
  }
  const data = templateSchema.partial().parse(req.body)
  const template = await prisma.emailTemplate.update({ where: { id }, data })
  res.json(template)
})

outreachRouter.delete('/templates/:id', async (req: AuthRequest, res) => {
  const { id } = req.params
  const existing = await prisma.emailTemplate.findFirst({ where: { id, userId: req.userId } })
  if (!existing) {
    res.status(404).json({ error: 'Template not found' })
    return
  }
  await prisma.emailTemplate.delete({ where: { id } })
  res.json({ success: true })
})
