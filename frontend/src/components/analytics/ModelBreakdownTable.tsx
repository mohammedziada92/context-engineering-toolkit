'use client'

import { Cpu } from 'lucide-react'
import { modelShortname } from '@/lib/models'
import { formatCost, formatTokens, formatLatency, type ModelBreakdown } from '@/lib/api/analytics'

interface Props {
  models:  ModelBreakdown[]
  loading: boolean
}

export function ModelBreakdownTable({ models, loading }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="text-xs font-semibold text-zinc-300 mb-4 flex items-center gap-2">
        <Cpu className="h-3.5 w-3.5 text-violet-400" />
        By Model
      </h2>

      {loading ? (
        <TableSkeleton rows={3} cols={4} />
      ) : models.length === 0 ? (
        <p className="text-xs text-zinc-600 py-4 text-center">No data for this period</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Model', 'Runs', 'Tokens', 'Cost', 'Avg Latency', 'Error Rate'].map((h) => (
                <th key={h} className="pb-2 text-left font-medium text-zinc-500 pr-3 last:pr-0">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {models.map((m) => (
              <tr key={m.model} className="hover:bg-zinc-800/40 transition-colors">
                <td className="py-2.5 pr-3 font-mono text-zinc-300">
                  {modelShortname(m.model)}
                </td>
                <td className="py-2.5 pr-3 tabular-nums text-zinc-400">
                  {m.run_count.toLocaleString()}
                </td>
                <td className="py-2.5 pr-3 tabular-nums text-zinc-400">
                  {formatTokens(m.total_tokens)}
                </td>
                <td className="py-2.5 pr-3 tabular-nums text-emerald-400 font-medium">
                  {formatCost(m.cost_usd)}
                </td>
                <td className="py-2.5 pr-3 tabular-nums text-zinc-400">
                  {formatLatency(m.avg_latency_ms)}
                </td>
                <td className="py-2.5 tabular-nums">
                  <span className={`font-medium ${
                    m.error_rate > 0.1 ? 'text-red-400' :
                    m.error_rate > 0   ? 'text-amber-400' :
                    'text-emerald-400'
                  }`}>
                    {(m.error_rate * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function TableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 flex-1 rounded bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )
}
