import { Request, Response, NextFunction } from 'express'

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  console.error(err)
  if (err instanceof Error) {
    res.status(500).json({ error: err.message })
  } else {
    res.status(500).json({ error: 'Internal server error' })
  }
}
