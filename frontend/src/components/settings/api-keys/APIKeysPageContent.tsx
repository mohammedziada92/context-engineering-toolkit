'use client'

import { useQuery } from '@tanstack/react-query'
import { getSettings } from '@/lib/api/settings'
import { SettingsNav } from '../settings-nav'
import { BYOKBanner } from './BYOKBanner'
import { APIKeySection } from './APIKeySection'
import { DefaultModelCards } from './DefaultModelCards'
import { UsageThisMonth } from './UsageThisMonth'

export function APIKeysPageContent() {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    staleTime: 60_000,
  })

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[680px] mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-zinc-100 mb-1">Settings</h1>
        <p className="text-sm text-zinc-500 mb-6">Manage your API key and model defaults</p>

        <SettingsNav />

        <div className="space-y-8">
          <BYOKBanner />
          <APIKeySection settings={settings} />
          <DefaultModelCards currentModel={settings?.default_model} />
          <UsageThisMonth />
        </div>
      </div>
    </div>
  )
}
