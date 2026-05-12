import { Suspense } from 'react'
import { ProfilePageContent } from '@/components/settings/profile/ProfilePageContent'
import { SettingsPageSkeleton } from '@/components/settings/SettingsPageSkeleton'

export const metadata = { title: 'Profile — CET Settings' }

export default function ProfilePage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <Suspense fallback={<SettingsPageSkeleton />}>
        <ProfilePageContent />
      </Suspense>
    </div>
  )
}
