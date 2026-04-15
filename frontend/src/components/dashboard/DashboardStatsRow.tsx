'use client'

import { GitBranch, Database, Play, Coins, TrendingUp, Activity } from 'lucide-react'
import { formatCost, formatTokens } from '@/lib/api/analytics'
import type { DashboardStats } from '@/lib/api/dashboard'

interface Props {
  stats?:  DashboardStats
  loading: boolean
}

export function DashboardStatsRow({ stats, loading }: Props) {
  const cards = [
    {
      icon:    GitBranch,
      label:   'Pipelines',
      value:   stats?.pipeline_count.toLocaleString() ?? '—',
      sub:     stats ? `${stats.active_pipelines} active` : '',
      color:   'text-violet-400',
      bg:      'bg-violet-500/10',
    },
    {
      icon:    Database,
      label:   'Knowledge Sources',
      value:   stats?.knowledge_source_count.toLocaleString() ?? '—',
      sub:     'Vector databases',
      color:   'text-emerald-400',
      bg:      'bg-emerald-500/10',
    },
    {
      icon:    Play,
      label:   'Runs Today',
      value:   stats?.total_runs_today.toLocaleString() ?? '—',
      sub:     'Across all pipelines',
      color:   'text-blue-400',
      bg:      'bg-blue-500/10',
    },
    {
      icon:    TrendingUp,
      label:   'Tokens Today',
      value:   stats ? formatTokens(stats.total_tokens_today) : '—',
      sub:     'Input + output',
      color:   'text-amber-400',
      bg:      'bg-amber-500/10',
    },
    {
      icon:    Coins,
      label:   'Cost Today',
      value:   stats ? formatCost(stats.total_cost_today_usd) : '—',
      sub:     'OpenRouter charges',
      color:   'text-emerald-400',
      bg:      'bg-emerald-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map(({ icon: Icon, label, value, sub, color, bg }) => (
        <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className={`inline-flex h-8 w-8 rounded-lg items-center justify-center mb-3 ${bg}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          {loading ? (
            <div className="space-y-1.5">
              <div className="h-5 w-16 rounded bg-zinc-800 animate-pulse" />
              <div className="h-3 w-24 rounded bg-zinc-800 animate-pulse" />
            </div>
          ) : (
            <>
              <p className={`text-xl font-semibold tabular-nums ${color}`}>{value}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">{label}</p>
              {sub && <p className="text-[10px] text-zinc-700 mt-0.5">{sub}</p>}
            </>
          )}
        </div>
      ))}
    </div>
  )
}
