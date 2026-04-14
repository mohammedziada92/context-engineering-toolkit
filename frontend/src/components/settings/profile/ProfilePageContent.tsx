'use client'

import { useQuery } from '@tanstack/react-query'
import { getProfile, getPreferences } from '@/lib/api/settings'
import { SettingsNav } from '../settings-nav'
import { AvatarSection } from './AvatarSection'
import { PersonalInfoForm } from './PersonalInfoForm'
import { AuthProviders } from './AuthProviders'
import { PreferencesForm } from './PreferencesForm'
import { DangerZone } from './DangerZone'

export function ProfilePageContent() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: 60_000,
  })

  const { data: preferences } = useQuery({
    queryKey: ['preferences'],
    queryFn: getPreferences,
    staleTime: 60_000,
  })

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[680px] mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-zinc-100 mb-1">Settings</h1>
        <p className="text-sm text-zinc-500 mb-6">Manage your profile and preferences</p>

        <SettingsNav />

        <div className="space-y-8">
          <AvatarSection profile={profile} loading={profileLoading} />
          <PersonalInfoForm profile={profile} loading={profileLoading} />
          <AuthProviders identities={profile?.identities ?? []} loading={profileLoading} />
          <PreferencesForm preferences={preferences} />
          <DangerZone />
        </div>
      </div>
    </div>
  )
}
