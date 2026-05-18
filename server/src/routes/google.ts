import { Router } from 'express'
import { google } from 'googleapis'
import { PrismaClient } from '@prisma/client'
import { authenticate, AuthRequest } from '../middleware/auth'
import jwt from 'jsonwebtoken'

export const googleRouter = Router()
const prisma = new PrismaClient()

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

googleRouter.get('/auth', (req, res) => {
  const tokenParam = req.query.token as string | undefined
  let userId: string | undefined

  if (tokenParam) {
    try {
      const payload = jwt.verify(tokenParam, process.env.JWT_SECRET || 'secret') as { userId: string }
      userId = payload.userId
    } catch { /* invalid token */ }
  }

  const authHeader = req.headers.authorization
  if (!userId && authHeader?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET || 'secret') as { userId: string }
      userId = payload.userId
    } catch { /* invalid token */ }
  }

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const oauth2Client = getOAuth2Client()
  const state = jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '10m' })
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
    state,
    prompt: 'consent',
  })
  res.redirect(url)
})

googleRouter.get('/callback', async (req, res) => {
  const { code, state } = req.query
  try {
    const { userId } = jwt.verify(state as string, process.env.JWT_SECRET || 'secret') as { userId: string }
    const oauth2Client = getOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code as string)
    await prisma.googleToken.upsert({
      where: { userId },
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || '',
        scope: tokens.scope || '',
        expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
      },
      create: {
        userId,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || '',
        scope: tokens.scope || '',
        expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
      },
    })
    res.redirect('http://localhost:5173/settings?connected=true')
  } catch (err) {
    res.redirect('http://localhost:5173/settings?connected=false')
  }
})

googleRouter.get('/status', authenticate, async (req: AuthRequest, res) => {
  const token = await prisma.googleToken.findUnique({ where: { userId: req.userId } })
  if (!token) {
    res.json({ gmail: false, calendar: false, drive: false })
    return
  }
  const scope = token.scope || ''
  res.json({
    gmail: scope.includes('gmail'),
    calendar: scope.includes('calendar'),
    drive: scope.includes('drive'),
  })
})
