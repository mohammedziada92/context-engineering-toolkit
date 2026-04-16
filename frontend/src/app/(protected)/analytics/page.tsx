import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AnalyticsPageContent } from '@/components/analytics/analytics-page-content'
import { AnalyticsSkeleton }    from '@/components/analytics/AnalyticsSkeleton'

export const metadata: Metadata = { title: 'Analytics — CET' }

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsPageContent />
    </Suspense>
  )
}
