'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { getDashboard } from '@/lib/api/dashboard'
import { DashboardStatsRow }      from './DashboardStatsRow'
import { RecentRunsCard }         from './RecentRunsCard'
import { RecentPipelinesCard }    from './RecentPipelinesCard'
import { RecentSourcesCard }      from './RecentSourcesCard'
import { QuickActionsCard }       from './QuickActionsCard'
import { OnboardingChecklist }    from './OnboardingChecklist'
import { Layers } from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '@/stores/auth.store'

export function DashboardPageContent() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  getDashboard,
    staleTime: 10_000,
    refetchInterval: 30_000,
  })

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? ''
  const greeting  = getGreeting(firstName)
  const today     = format(new Date(), 'EEEE, MMMM d')

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Layers className="h-5 w-5 text-violet-400" />
            {greeting}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">{today}</p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Stats row */}
        <DashboardStatsRow stats={data?.stats} loading={isLoading} />

        {/* Quick actions */}
        <QuickActionsCard />

        {/* Onboarding checklist */}
        {data?.onboarding && <OnboardingChecklist onboarding={data.onboarding} />}

        {/* 2-column: recent runs + recent pipelines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RecentRunsCard      runs={data?.recent_runs       ?? []} loading={isLoading} />
          <RecentPipelinesCard pipelines={data?.recent_pipelines ?? []} loading={isLoading} />
        </div>

        {/* Recent knowledge sources */}
        <RecentSourcesCard sources={data?.recent_sources ?? []} loading={isLoading} />
      </div>
    </div>
  )
}

function getGreeting(name: string): string {
  const h = new Date().getHours()
  const suffix = name ? `, ${name}` : ''
  if (h < 12) return `Good morning${suffix}`
  if (h < 17) return `Good afternoon${suffix}`
  return `Good evening${suffix}`
}
