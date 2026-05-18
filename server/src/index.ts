import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { authRouter } from './routes/auth'
import { leadsRouter } from './routes/leads'
import { dealsRouter } from './routes/deals'
import { aiRouter } from './routes/ai'
import { googleRouter } from './routes/google'
import { gmailRouter } from './routes/gmail'
import { calendarRouter } from './routes/calendar'
import { driveRouter } from './routes/drive'
import { outreachRouter } from './routes/outreach'
import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRouter)
app.use('/api/leads', leadsRouter)
app.use('/api/deals', dealsRouter)
app.use('/api/ai', aiRouter)
app.use('/api/google', googleRouter)
app.use('/api/gmail', gmailRouter)
app.use('/api/calendar', calendarRouter)
app.use('/api/drive', driveRouter)
app.use('/api/outreach', outreachRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
