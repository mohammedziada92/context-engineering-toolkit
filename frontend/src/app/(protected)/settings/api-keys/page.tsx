import { Suspense } from 'react'
import { APIKeysPageContent } from '@/components/settings/api-keys/APIKeysPageContent'
import { SettingsPageSkeleton } from '@/components/settings/SettingsPageSkeleton'

export const metadata = { title: 'API Keys — CET Settings' }

export default function APIKeysPage() {
  return (
    <Suspense fallback={<SettingsPageSkeleton />}>
      <APIKeysPageContent />
    </Suspense>
  )
}
