'use client'

import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '@/lib/api/dashboard'
import { apiFetch } from '@/lib/api/api'
import { StatsCard } from './StatsCard'
import { QuickActions } from './QuickActions'
import { RecentPipelines } from './RecentPipelines'
import { RecentRuns } from './RecentRuns'
import { SetupChecklist } from './SetupChecklist'
import { NoAPIKeyBanner } from './NoAPIKeyBanner'
import { GitBranch, BookOpen, Zap, Coins } from 'lucide-react'

export function DashboardPageContent() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    staleTime: 30_000,
  })

  const { data: pipelines = [], isLoading: pipelinesLoading } = useQuery({
    queryKey: ['dashboard-pipelines'],
    queryFn: () => apiFetch('/api/v1/pipelines?limit=5&sort=updated_at'),
    staleTime: 30_000,
  })

  const { data: runs = [], isLoading: runsLoading } = useQuery({
    queryKey: ['dashboard-runs'],
    queryFn: () => apiFetch('/api/v1/runs?limit=5&sort=created_at'),
    staleTime: 30_000,
  })

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiFetch('/api/v1/settings'),
    staleTime: 60_000,
  })

  const hasAPIKey = !!(settings as any)?.openrouter_api_key
  const showChecklist = stats && !stats.onboarding_complete

  // Greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const userName = (settings as any)?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">
            {greeting}, {userName}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* No API key banner */}
        {!hasAPIKey && !statsLoading && (
          <NoAPIKeyBanner />
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={GitBranch}
            label="Pipelines"
            value={stats?.pipelines.count ?? 0}
            delta={stats?.pipelines.delta ?? 0}
            deltaPositiveIsGood
            format="number"
            loading={statsLoading}
            href="/pipelines"
          />
          <StatsCard
            icon={BookOpen}
            label="Knowledge Sources"
            value={stats?.knowledge_sources.count ?? 0}
            delta={stats?.knowledge_sources.delta ?? 0}
            deltaPositiveIsGood
            format="number"
            loading={statsLoading}
            href="/knowledge"
          />
          <StatsCard
            icon={Zap}
            label="Runs Today"
            value={stats?.runs_today.count ?? 0}
            delta={stats?.runs_today.delta ?? 0}
            deltaPositiveIsGood
            format="number"
            loading={statsLoading}
            href="/analytics"
          />
          <StatsCard
            icon={Coins}
            label="Tokens Today"
            value={stats?.tokens_today.total ?? 0}
            delta={stats?.tokens_today.delta_pct ?? 0}
            deltaPositiveIsGood
            format="tokens"
            loading={statsLoading}
            href="/analytics"
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Setup Checklist */}
        {showChecklist && (
          <SetupChecklist
            hasApiKey={hasAPIKey}
            pipelineCount={stats?.pipeline_count ?? 0}
            runCount={stats?.run_count ?? 0}
          />
        )}

        {/* Two-column: Recent Pipelines + Recent Runs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentPipelines
            pipelines={pipelines as any[]}
            loading={pipelinesLoading}
          />
          <RecentRuns
            runs={runs as any[]}
            loading={runsLoading}
          />
        </div>

      </div>
    </div>
  )
}
