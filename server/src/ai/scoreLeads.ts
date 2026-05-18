import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface Lead {
  id: string
  name: string
  company: string
  stage: string
  value: number
  notes?: string | null
  updatedAt: Date
}

interface ScoreResult {
  id: string
  score: number
  insight: string
}

export async function scoreLeads(leads: Lead[], prisma: PrismaClient): Promise<ScoreResult[]> {
  const leadsJson = leads.map(l => ({
    id: l.id,
    name: l.name,
    company: l.company,
    stage: l.stage,
    value: l.value,
    notes: l.notes,
    daysSinceUpdate: Math.floor((Date.now() - new Date(l.updatedAt).getTime()) / (1000 * 60 * 60 * 24)),
  }))

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: 'You are a revenue operations analyst. Score leads 0-100 based on conversion likelihood. Return ONLY valid JSON, no markdown.',
    messages: [
      {
        role: 'user',
        content: `Score these leads and return ONLY a JSON array: [{"id": "...", "score": 0-100, "insight": "brief reason"}]. Leads: ${JSON.stringify(leadsJson)}. Base score on: stage (Closing > Proposal > Qualified > Prospecting), deal value (higher = better), recency of updates (recent = better), engagement signals in notes.`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  const results: ScoreResult[] = JSON.parse(jsonMatch[0])

  for (const result of results) {
    await prisma.lead.update({
      where: { id: result.id },
      data: { score: result.score, scoreInsight: result.insight },
    })
  }

  return results
}
