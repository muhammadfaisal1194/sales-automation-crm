import Anthropic from '@anthropic-ai/sdk'
import { Response } from 'express'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function draftEmail(lead: { name: string; title?: string | null; company: string; value: number; notes?: string | null }, context: string | undefined, res: Response) {
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: 'You are an elite B2B sales rep known for high reply rates. Write emails that are specific, human, and brief.',
    messages: [
      {
        role: 'user',
        content: `Write a cold outreach email to ${lead.name}, ${lead.title || 'decision maker'} at ${lead.company}. Deal value: $${lead.value.toLocaleString()}. Context: ${lead.notes || 'No additional context'}. ${context ? `Additional context: ${context}` : ''} Format: first line is Subject:, then a blank line, then the email body under 120 words. End with a low-friction CTA.`,
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
