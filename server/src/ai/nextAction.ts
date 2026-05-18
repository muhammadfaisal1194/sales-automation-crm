import Anthropic from '@anthropic-ai/sdk'
import { Response } from 'express'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function nextAction(lead: { name: string; company: string; stage: string; value: number; notes?: string | null; score?: number | null; activities: { type: string; summary: string; createdAt: Date }[] }, res: Response) {
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: 'You are an expert sales coach helping reps close deals faster.',
    messages: [
      {
        role: 'user',
        content: `Given this deal, recommend the single best next action. Structure your response as: 1) Recommended Action (one sentence), 2) Why Now (2-3 sentences), 3) Talk Track (specific words to use). Deal: ${JSON.stringify({
          name: lead.name,
          company: lead.company,
          stage: lead.stage,
          value: lead.value,
          score: lead.score,
          notes: lead.notes,
          recentActivities: lead.activities.slice(0, 10),
        })}`,
      },
    ],
  })
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
    }
  }
  res.write('data: [DONE]\n\n')
}
