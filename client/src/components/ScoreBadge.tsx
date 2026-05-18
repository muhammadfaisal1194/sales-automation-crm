interface Props {
  score?: number | null
}

export function ScoreBadge({ score }: Props) {
  if (score == null) return <span className="text-xs text-gray-400">—</span>

  const label = score >= 70 ? 'Hot' : score >= 40 ? 'Warm' : 'Cold'
  const cls = score >= 70
    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    : score >= 40
    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-orange-500' : 'bg-blue-500'}`} />
      {label} {score}
    </span>
  )
}
