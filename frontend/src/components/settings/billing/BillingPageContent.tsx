'use client'

import { useQuery } from '@tanstack/react-query'
import { getProfile } from '@/lib/api/settings'
import { apiFetch } from '@/lib/api/api'
import { SettingsNav } from '../settings-nav'
import { CurrentPlanCard } from './CurrentPlanCard'
import { UsageQuotas } from './UsageQuotas'
import { LLMCosts } from './LLMCosts'
import { NotifyMeModal } from './NotifyMeModal'
import { useState } from 'react'
import { Sparkles } from 'lucide-react'

export function BillingPageContent() {
  const [notifyOpen, setNotifyOpen] = useState(false)

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: getProfile, staleTime: 60_000 })

  const { data: quotas } = useQuery({
    queryKey: ['billing-usage'],
    queryFn: () => apiFetch('/api/v1/billing/usage'),
    staleTime: 60_000,
  })

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[680px] mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-zinc-100 mb-1">Settings</h1>
        <p className="text-sm text-zinc-500 mb-6">Plan details and usage</p>

        <SettingsNav />

        <div className="space-y-8">
          <CurrentPlanCard profile={profile} />
          <UsageQuotas quotas={quotas as any} />
          <LLMCosts />

          {/* v2 Plans teaser */}
          <section className="rounded-xl border border-zinc-700 bg-zinc-800/40 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <h2 className="text-sm font-medium text-zinc-200">CET Pro — Coming Soon</h2>
                </div>
                <p className="text-xs text-zinc-500">
                  Team workspaces, shared pipelines, priority support, and more. Be first to know.
                </p>
              </div>
              <button
                onClick={() => setNotifyOpen(true)}
                className="flex-shrink-0 px-3 py-1.5 text-xs rounded-md border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors ml-4"
              >
                Notify me
              </button>
            </div>
          </section>

          {/* Billing History */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-sm font-medium text-zinc-200 mb-1">Billing History</h2>
            <p className="text-xs text-zinc-500 mb-4">
              CET is free — LLM costs go directly to your OpenRouter account.
            </p>
            <a
              href="https://openrouter.ai/activity"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300"
            >
              View LLM spend on OpenRouter →
            </a>
          </section>

          {/* Support the project */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-sm font-medium text-zinc-200 mb-1">Support the project</h2>
            <p className="text-xs text-zinc-500 mb-4">
              CET is built and maintained independently. If it&apos;s been useful to you, a coffee goes a long way. ☕
            </p>
            <a
              href="https://www.buymeacoffee.com/MohammedZiada92"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-[#000000] hover:brightness-95 transition-all"
              style={{ backgroundColor: '#FFDD00' }}
            >
              ☕ Buy me a coffee
            </a>
          </section>
        </div>

        <NotifyMeModal
          open={notifyOpen}
          onClose={() => setNotifyOpen(false)}
          email={profile?.email}
        />
      </div>
    </div>
  )
}
