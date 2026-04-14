import { Suspense } from 'react'
import { AnalyticsPageContent } from '@/components/analytics/analytics-page-content'
import { Skeleton } from '@/components/ui/skeleton'

function AnalyticsSkeleton() {
  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 bg-zinc-800" />
        <Skeleton className="h-8 w-64 bg-zinc-800" />
      </div>
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 bg-zinc-800 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 w-full bg-zinc-800 rounded-lg" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-64 bg-zinc-800 rounded-lg" />
        <Skeleton className="h-64 bg-zinc-800 rounded-lg" />
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsPageContent />
    </Suspense>
  )
}
