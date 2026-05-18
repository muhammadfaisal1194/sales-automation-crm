import { Router } from 'express'
import { google } from 'googleapis'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authenticate, AuthRequest } from '../middleware/auth'

export const calendarRouter = Router()
const prisma = new PrismaClient()

async function getCalendarClient(userId: string) {
  const tokenRecord = await prisma.googleToken.findUnique({ where: { userId } })
  if (!tokenRecord) throw new Error('Google not connected')
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
  oauth2Client.setCredentials({
    access_token: tokenRecord.accessToken,
    refresh_token: tokenRecord.refreshToken,
  })
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

calendarRouter.get('/status', authenticate, async (req: AuthRequest, res) => {
  const token = await prisma.googleToken.findUnique({ where: { userId: req.userId } })
  const connected = !!token && (token.scope || '').includes('calendar')
  res.json({
    connected,
    authUrl: connected ? undefined : `/api/google/auth`,
  })
})

calendarRouter.get('/events', authenticate, async (req: AuthRequest, res) => {
  try {
    const calendar = await getCalendarClient(req.userId!)
    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
    })
    const items = (events.data.items || []).map(e => ({
      id: e.id,
      title: e.summary,
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      description: e.description,
      location: e.location,
      htmlLink: e.htmlLink,
    }))
    res.json(items)
  } catch {
    res.json([])
  }
})

calendarRouter.get('/events/:email', authenticate, async (req: AuthRequest, res) => {
  const { email } = req.params
  try {
    const calendar = await getCalendarClient(req.userId!)
    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: 'startTime',
      q: email,
    })
    res.json(events.data.items || [])
  } catch {
    res.json([])
  }
})

calendarRouter.post('/events', authenticate, async (req: AuthRequest, res) => {
  const { leadId, title, start, end, attendees } = z.object({
    leadId: z.string(),
    title: z.string(),
    start: z.string(),
    end: z.string(),
    attendees: z.array(z.string()),
  }).parse(req.body)

  const calendar = await getCalendarClient(req.userId!)
  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: title,
      start: { dateTime: start },
      end: { dateTime: end },
      attendees: attendees.map(email => ({ email })),
    },
  })

  await prisma.activity.create({
    data: { leadId, type: 'meeting', summary: `Meeting scheduled: ${title}` },
  })

  res.json(event.data)
})
