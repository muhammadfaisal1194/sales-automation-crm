export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3 px-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/8" />
        </div>
      ))}
    </div>
  )
}
