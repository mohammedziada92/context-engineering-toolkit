'use client'

import Link from 'next/link'
import { ExternalLink, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getAnalytics, formatCost, type ModelBreakdown } from '@/lib/api/analytics'

export function UsageThisMonth() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', '30d'],
    queryFn: () => getAnalytics('30d'),
    staleTime: 60_000,
  })

  const totalCost = data?.summary.total_cost_usd ?? 0
  const totalTokens = data?.summary.total_tokens ?? 0
  const totalRuns = data?.summary.total_runs ?? 0
  const models = data?.model_breakdown ?? []

  const maxCost = Math.max(...models.map((m: ModelBreakdown) => m.cost_usd), 0.01)

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-zinc-200">Usage This Month</h2>
          <p className="text-xs text-zinc-500 mt-0.5">From your pipeline runs</p>
        </div>
        <a
          href="https://openrouter.ai/settings/credits"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
        >
          Top up credits <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading usage...
        </div>
      ) : !data ? (
        <p className="text-sm text-zinc-500">No data yet. Run a pipeline to see usage.</p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Cost', value: formatCost(totalCost) },
              { label: 'Tokens', value: totalTokens.toLocaleString() },
              { label: 'Runs', value: String(totalRuns) },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-3 rounded-lg bg-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">{label}</p>
                <p className="text-base font-bold text-zinc-100 tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          {models.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 font-medium">Breakdown by model</p>
              {models.map((m: ModelBreakdown) => {
                const pct = maxCost > 0 ? (m.cost_usd / maxCost) * 100 : 0
                return (
                  <div key={m.model} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400 w-36 truncate">
                      {m.model.split('/').pop()}
                    </span>
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500/60 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-400 tabular-nums w-24 text-right">
                      {formatCost(m.cost_usd)} ({m.run_count})
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
