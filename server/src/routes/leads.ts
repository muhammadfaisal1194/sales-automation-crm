import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import multer from 'multer'
import { authenticate, AuthRequest } from '../middleware/auth'

export const leadsRouter = Router()
const prisma = new PrismaClient()
const upload = multer({ storage: multer.memoryStorage() })

leadsRouter.use(authenticate)

const leadSchema = z.object({
  name: z.string().min(1),
  company: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  title: z.string().optional(),
  source: z.string().optional(),
  stage: z.string().optional(),
  value: z.number().optional(),
  notes: z.string().optional(),
})

leadsRouter.get('/', async (req: AuthRequest, res) => {
  const { stage, search, sortBy = 'createdAt', sortDir = 'desc' } = req.query
  const where: Record<string, unknown> = { userId: req.userId }
  if (stage) where.stage = stage
  if (search) {
    where.OR = [
      { name: { contains: search as string } },
      { company: { contains: search as string } },
      { email: { contains: search as string } },
    ]
  }
  const orderBy = { [sortBy as string]: sortDir }
  const leads = await prisma.lead.findMany({
    where,
    orderBy,
    include: { activities: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })
  res.json(leads)
})

leadsRouter.post('/', async (req: AuthRequest, res) => {
  const data = leadSchema.parse(req.body)
  const lead = await prisma.lead.create({
    data: { ...data, userId: req.userId! },
  })
  res.json(lead)
})

leadsRouter.put('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params
  const existing = await prisma.lead.findFirst({ where: { id, userId: req.userId } })
  if (!existing) {
    res.status(404).json({ error: 'Lead not found' })
    return
  }
  const data = leadSchema.partial().parse(req.body)
  const lead = await prisma.lead.update({ where: { id }, data })
  res.json(lead)
})

leadsRouter.delete('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params
  const existing = await prisma.lead.findFirst({ where: { id, userId: req.userId } })
  if (!existing) {
    res.status(404).json({ error: 'Lead not found' })
    return
  }
  await prisma.activity.deleteMany({ where: { leadId: id } })
  await prisma.lead.delete({ where: { id } })
  res.json({ success: true })
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
leadsRouter.post('/import', upload.single('file') as any, async (req: AuthRequest, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }
  const csv = req.file.buffer.toString('utf-8')
  const lines = csv.split('\n').filter(l => l.trim())
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const imported: unknown[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => { obj[h] = values[idx] || '' })
    if (!obj.name || !obj.company || !obj.email) continue
    try {
      const lead = await prisma.lead.create({
        data: {
          name: obj.name,
          company: obj.company,
          email: obj.email,
          phone: obj.phone || null,
          title: obj.title || null,
          source: obj.source || 'CSV Import',
          stage: obj.stage || 'Prospecting',
          value: parseFloat(obj.value || '0') || 0,
          notes: obj.notes || null,
          userId: req.userId!,
        },
      })
      imported.push(lead)
    } catch { /* skip invalid rows */ }
  }
  res.json({ imported: imported.length, leads: imported })
})
