'use client'

import { GitBranch } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCost, formatTokens, formatLatency, type PipelineBreakdown } from '@/lib/api/analytics'

interface Props {
  pipelines: PipelineBreakdown[]
  loading:   boolean
}

export function PipelineBreakdownTable({ pipelines, loading }: Props) {
  const router = useRouter()

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="text-xs font-semibold text-zinc-300 mb-4 flex items-center gap-2">
        <GitBranch className="h-3.5 w-3.5 text-blue-400" />
        By Pipeline
      </h2>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-4 flex-1 rounded bg-zinc-800 animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      ) : pipelines.length === 0 ? (
        <p className="text-xs text-zinc-600 py-4 text-center">No data for this period</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Pipeline', 'Runs', 'Cost', 'Avg Latency', 'Success Rate'].map((h) => (
                <th key={h} className="pb-2 text-left font-medium text-zinc-500 pr-3 last:pr-0">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {pipelines.map((p) => (
              <tr
                key={p.pipeline_id}
                onClick={() => router.push(`/pipelines/${p.pipeline_id}`)}
                className="hover:bg-zinc-800/40 transition-colors cursor-pointer"
              >
                <td className="py-2.5 pr-3 text-zinc-200 font-medium truncate max-w-[140px]">
                  {p.pipeline_name}
                </td>
                <td className="py-2.5 pr-3 tabular-nums text-zinc-400">
                  {p.run_count.toLocaleString()}
                </td>
                <td className="py-2.5 pr-3 tabular-nums text-emerald-400 font-medium">
                  {formatCost(p.cost_usd)}
                </td>
                <td className="py-2.5 pr-3 tabular-nums text-zinc-400">
                  {formatLatency(p.avg_latency_ms)}
                </td>
                <td className="py-2.5 tabular-nums">
                  <span className={`font-medium ${
                    p.success_rate >= 0.95 ? 'text-emerald-400' :
                    p.success_rate >= 0.8  ? 'text-amber-400'   :
                    'text-red-400'
                  }`}>
                    {(p.success_rate * 100).toFixed(1)}%
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
