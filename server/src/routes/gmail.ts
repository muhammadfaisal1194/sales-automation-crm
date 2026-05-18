import { Router } from 'express'
import { google } from 'googleapis'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authenticate, AuthRequest } from '../middleware/auth'

export const gmailRouter = Router()
const prisma = new PrismaClient()

async function getGmailClient(userId: string) {
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
  return google.gmail({ version: 'v1', auth: oauth2Client })
}

gmailRouter.get('/status', authenticate, async (req: AuthRequest, res) => {
  const token = await prisma.googleToken.findUnique({ where: { userId: req.userId } })
  const connected = !!token && (token.scope || '').includes('gmail')
  res.json({
    connected,
    authUrl: connected ? undefined : `/api/google/auth`,
  })
})

gmailRouter.get('/messages', authenticate, async (req: AuthRequest, res) => {
  try {
    const gmail = await getGmailClient(req.userId!)
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
      labelIds: ['INBOX'],
    })
    const messages = listRes.data.messages || []
    const detailed = await Promise.all(
      messages.slice(0, 15).map(async (m) => {
        const msg = await gmail.users.messages.get({ userId: 'me', id: m.id!, format: 'metadata', metadataHeaders: ['Subject', 'From', 'Date'] })
        const headers = msg.data.payload?.headers || []
        const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)'
        const from = headers.find(h => h.name === 'From')?.value || ''
        const date = headers.find(h => h.name === 'Date')?.value || ''
        const isRead = !msg.data.labelIds?.includes('UNREAD')
        const snippet = msg.data.snippet || ''
        return { id: m.id, threadId: m.threadId, subject, from, date, isRead, snippet }
      })
    )
    res.json(detailed)
  } catch {
    res.json([])
  }
})

gmailRouter.get('/threads/:email', authenticate, async (req: AuthRequest, res) => {
  const { email } = req.params
  try {
    const gmail = await getGmailClient(req.userId!)
    const threadsRes = await gmail.users.threads.list({
      userId: 'me',
      q: `from:${email} OR to:${email}`,
      maxResults: 10,
    })
    const threads = threadsRes.data.threads || []
    const detailed = await Promise.all(
      threads.map(async (t) => {
        const thread = await gmail.users.threads.get({ userId: 'me', id: t.id! })
        const msg = thread.data.messages?.[0]
        const headers = msg?.payload?.headers || []
        const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)'
        const from = headers.find(h => h.name === 'From')?.value || ''
        const date = headers.find(h => h.name === 'Date')?.value || ''
        return { id: t.id, subject, from, date, messageCount: thread.data.messages?.length || 0 }
      })
    )
    res.json(detailed)
  } catch {
    res.json([])
  }
})

gmailRouter.post('/send', authenticate, async (req: AuthRequest, res) => {
  const { to, subject, body, leadId } = z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string(),
    leadId: z.string().optional(),
  }).parse(req.body)

  const gmail = await getGmailClient(req.userId!)
  const message = [`To: ${to}`, `Subject: ${subject}`, '', body].join('\n')
  const encoded = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
  await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encoded } })

  if (leadId) {
    await prisma.activity.create({
      data: { leadId, type: 'email', summary: `Email sent: ${subject}` },
    })
  }
  res.json({ success: true })
})
