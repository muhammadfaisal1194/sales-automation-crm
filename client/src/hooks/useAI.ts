import { useState, useCallback } from 'react'
import { streamAI } from '../services/ai'

type AIAction = 'draft-email' | 'summarize-deal' | 'next-action'

export function useAI() {
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const run = useCallback(async (action: AIAction, leadId: string, context?: string) => {
    setOutput('')
    setError(null)
    setDone(false)
    setLoading(true)

    const body: Record<string, unknown> = { leadId }
    if (context) body.context = context

    await streamAI(
      `/ai/${action}`,
      body,
      (chunk) => setOutput((prev) => prev + chunk),
      () => {
        setDone(true)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )
  }, [])

  const reset = useCallback(() => {
    setOutput('')
    setError(null)
    setDone(false)
    setLoading(false)
  }, [])

  return { output, loading, error, done, run, reset }
}
