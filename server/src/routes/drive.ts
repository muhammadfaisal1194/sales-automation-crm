import { Router } from 'express'
import { google } from 'googleapis'
import { PrismaClient } from '@prisma/client'
import { authenticate, AuthRequest } from '../middleware/auth'

export const driveRouter = Router()
const prisma = new PrismaClient()

async function getDriveClient(userId: string) {
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
  return google.drive({ version: 'v3', auth: oauth2Client })
}

driveRouter.get('/status', authenticate, async (req: AuthRequest, res) => {
  const token = await prisma.googleToken.findUnique({ where: { userId: req.userId } })
  const connected = !!token && (token.scope || '').includes('drive')
  res.json({ connected })
})

driveRouter.get('/files', authenticate, async (req: AuthRequest, res) => {
  const { q } = req.query
  try {
    const drive = await getDriveClient(req.userId!)
    const query = q ? `name contains '${String(q)}'` : 'trashed = false'
    const files = await drive.files.list({
      q: query,
      pageSize: 20,
      fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
      orderBy: 'modifiedTime desc',
    })
    const results = (files.data.files || []).map(f => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.size,
      modifiedTime: f.modifiedTime,
      webViewLink: f.webViewLink,
    }))
    res.json(results)
  } catch {
    res.json([])
  }
})

driveRouter.get('/search', authenticate, async (req: AuthRequest, res) => {
  const { q } = req.query
  try {
    const drive = await getDriveClient(req.userId!)
    const files = await drive.files.list({
      q: q ? `name contains '${String(q)}'` : undefined,
      pageSize: 10,
      fields: 'files(id, name, mimeType, webViewLink)',
    })
    const results = (files.data.files || []).map(f => ({
      id: f.id,
      name: f.name,
      url: f.webViewLink,
      mimeType: f.mimeType,
    }))
    res.json(results)
  } catch {
    res.json([])
  }
})
