'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { getDashboard } from '@/lib/api/dashboard'
import { DashboardStatsRow }      from './DashboardStatsRow'
import { RecentRunsCard }         from './RecentRunsCard'
import { RecentPipelinesCard }    from './RecentPipelinesCard'
import { RecentSourcesCard }      from './RecentSourcesCard'
import { QuickActionsCard }       from './QuickActionsCard'
import { Layers } from 'lucide-react'
import { format } from 'date-fns'

export function DashboardPageContent() {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  getDashboard,
    staleTime: 60_000,
    refetchInterval: 60_000,   // refresh every minute for live "today" stats
  })

  const greeting = getGreeting()
  const today    = format(new Date(), 'EEEE, MMMM d')

  return (
    <div className="flex flex-col h-full overflow-hidden">
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

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
