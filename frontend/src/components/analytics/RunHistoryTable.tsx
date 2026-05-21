'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, MinusCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Badge }  from '@/components/ui/badge'
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination'
import {
  getRuns, formatCost, formatTokens, formatLatency,
  type RunRecord, type Period,
} from '@/lib/api/analytics'
import { modelShortname } from '@/lib/models'

const PAGE_LIMIT = 20

const STATUS_CONFIG: Record<RunRecord['status'], {
  icon: React.ElementType
  className: string
}> = {
  success:   { icon: CheckCircle2, className: 'text-emerald-400' },
  error:     { icon: XCircle,      className: 'text-red-400'     },
  cancelled: { icon: MinusCircle,  className: 'text-zinc-500'    },
}

interface Props {
  period: Period
}

export function RunHistoryTable({ period }: Props) {
  const router    = useRouter()
  const [page,    setPage]    = useState(1)
  const [status,  setStatus]  = useState<RunRecord['status'] | ''>('')
  const [model,   setModel]   = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['runs', { period, page, status, model }],
    queryFn:  () => getRuns({ page, limit: PAGE_LIMIT, status: status || undefined, model: model || undefined, period }),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })

  const runs       = data?.items ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_LIMIT)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      {/* Table header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          Run History
          {total > 0 && (
            <span className="text-zinc-600 font-normal">{total.toLocaleString()} total</span>
          )}
        </h2>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={status || 'all'}
            onChange={(e) => { setStatus(e.target.value === 'all' ? '' : e.target.value as RunRecord['status']); setPage(1) }}
            className="flex h-7 w-[120px] items-center rounded-lg border border-zinc-700 bg-zinc-800 px-2 text-[11px] text-zinc-300 outline-none focus-visible:border-violet-500/50 focus-visible:ring-2 focus-visible:ring-violet-500/20 cursor-pointer appearance-none"
          >
            <option value="all">All statuses</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xs text-zinc-600">No runs in this period</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Status', 'Pipeline', 'Model', 'Tokens', 'Cost', 'Latency', 'Time'].map((h) => (
                  <th key={h} className="pb-2 text-left font-medium text-zinc-500 pr-4 last:pr-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {runs.map((run) => {
                const cfg  = STATUS_CONFIG[run.status]
                const Icon = cfg.icon
                return (
                  <tr
                    key={run.id}
                    onClick={() => router.push(`/pipelines/${run.pipeline_id}`)}
                    className="hover:bg-zinc-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 pr-4">
                      <Icon className={`h-3.5 w-3.5 ${cfg.className}`} />
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-200 font-medium max-w-[140px] truncate">
                      {run.pipeline_name}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-zinc-400">
                      {modelShortname(run.model)}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums text-zinc-400">
                      {formatTokens(run.total_tokens)}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums text-emerald-400">
                      {formatCost(run.cost_usd)}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums text-zinc-400">
                      {formatLatency(run.latency_ms)}
                    </td>
                    <td className="py-2.5 text-zinc-600 tabular-nums">
                      {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-disabled={page <= 1}
                  className={page <= 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-3 py-1.5 text-xs text-zinc-400 tabular-nums">
                  {page} / {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-disabled={page >= totalPages}
                  className={page >= totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
