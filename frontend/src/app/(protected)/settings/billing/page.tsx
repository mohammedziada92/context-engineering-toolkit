import { Suspense } from 'react'
import { BillingPageContent } from '@/components/settings/billing/BillingPageContent'
import { SettingsPageSkeleton } from '@/components/settings/SettingsPageSkeleton'

export const metadata = { title: 'Billing — CET Settings' }

export default function BillingPage() {
  return (
    <Suspense fallback={<SettingsPageSkeleton />}>
      <BillingPageContent />
    </Suspense>
  )
}
