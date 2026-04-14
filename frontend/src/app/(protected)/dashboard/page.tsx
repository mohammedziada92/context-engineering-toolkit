import { Suspense } from 'react'
import { DashboardPageContent } from '@/components/dashboard/DashboardPageContent'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'

export const metadata = { title: 'Dashboard — CET' }

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPageContent />
    </Suspense>
  )
}
