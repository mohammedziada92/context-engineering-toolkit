'use client'

import { Activity, Coins, Zap, TrendingUp, AlertCircle } from 'lucide-react'
import { formatCost, formatTokens, formatLatency, type AnalyticsSummary } from '@/lib/api/analytics'

interface Props {
  summary?: AnalyticsSummary
  loading:  boolean
}

export function SummaryKPIs({ summary, loading }: Props) {
  const successRate = summary
    ? summary.total_runs > 0
      ? ((summary.success_runs / summary.total_runs) * 100).toFixed(1)
      : '0.0'
    : null

  const kpis = [
    {
      icon:    Activity,
      label:   'Total Runs',
      value:   summary?.total_runs.toLocaleString() ?? '—',
      sub:     summary ? `${summary.success_runs} succeeded, ${summary.error_runs} errors` : '',
      color:   'text-blue-400',
      bg:      'bg-blue-500/10',
    },
    {
      icon:    Coins,
      label:   'Total Cost',
      value:   summary ? formatCost(summary.total_cost_usd) : '—',
      sub:     'OpenRouter charges',
      color:   'text-emerald-400',
      bg:      'bg-emerald-500/10',
    },
    {
      icon:    TrendingUp,
      label:   'Tokens Used',
      value:   summary ? formatTokens(summary.total_tokens) : '—',
      sub:     'Input + output',
      color:   'text-violet-400',
      bg:      'bg-violet-500/10',
    },
    {
      icon:    Zap,
      label:   'Avg Latency',
      value:   summary ? formatLatency(summary.avg_latency_ms) : '—',
      sub:     'End-to-end per run',
      color:   'text-amber-400',
      bg:      'bg-amber-500/10',
    },
    {
      icon:    AlertCircle,
      label:   'Success Rate',
      value:   successRate !== null ? `${successRate}%` : '—',
      sub:     summary ? `${summary.total_runs - summary.success_runs} failures` : '',
      color:   successRate !== null && Number(successRate) >= 95 ? 'text-emerald-400' : 'text-red-400',
      bg:      successRate !== null && Number(successRate) >= 95 ? 'bg-emerald-500/10' : 'bg-red-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map(({ icon: Icon, label, value, sub, color, bg }) => (
        <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className={`inline-flex h-8 w-8 rounded-lg items-center justify-center mb-3 ${bg}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          {loading ? (
            <div className="space-y-1.5">
              <div className="h-6 w-20 rounded bg-zinc-800 animate-pulse" />
              <div className="h-3 w-28 rounded bg-zinc-800 animate-pulse" />
            </div>
          ) : (
            <>
              <p className={`text-xl font-semibold tabular-nums ${color}`}>{value}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5 leading-tight">{label}</p>
              {sub && <p className="text-[10px] text-zinc-700 mt-0.5">{sub}</p>}
            </>
          )}
        </div>
      ))}
    </div>
  )
}
