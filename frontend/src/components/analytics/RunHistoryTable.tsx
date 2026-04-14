'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { getRuns, type AnalyticsFilters, type RunEntry } from '@/lib/api/analytics'

// ── Status badge ──────────────────────────────────────────

const STATUS_VARIANT: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  success: 'default',
  error: 'destructive',
  cancelled: 'secondary',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? 'outline'} className="text-[10px]">
      {status}
    </Badge>
  )
}

// ── Model label ───────────────────────────────────────────

const MODEL_SHORT: Record<string, string> = {
  'anthropic/claude-sonnet-4-6': 'Claude',
  'z-ai/glm-5': 'GLM-5',
  'google/gemini-3.1-pro-preview': 'Gemini',
}

// ── Time formatter ────────────────────────────────────────

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return d.toLocaleDateString()
}

// ── Props ─────────────────────────────────────────────────

interface RunHistoryTableProps {
  filters: AnalyticsFilters
}

// ── Component ─────────────────────────────────────────────

export function RunHistoryTable({ filters }: RunHistoryTableProps) {
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data, isLoading } = useQuery({
    queryKey: ['analytics-runs', page, filters],
    queryFn: () => getRuns(page, pageSize, filters),
    staleTime: 2 * 60 * 1000,
  })

  const runs = data?.runs ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-zinc-100 mb-3">Run History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th className="pb-2 text-xs font-medium text-zinc-500">Pipeline</th>
                <th className="pb-2 text-xs font-medium text-zinc-500">Model</th>
                <th className="pb-2 text-xs font-medium text-zinc-500">Status</th>
                <th className="pb-2 text-xs font-medium text-zinc-500 text-right">Tokens</th>
                <th className="pb-2 text-xs font-medium text-zinc-500 text-right">Cost</th>
                <th className="pb-2 text-xs font-medium text-zinc-500 text-right">Latency</th>
                <th className="pb-2 text-xs font-medium text-zinc-500 text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <Loader2 className="size-4 animate-spin text-zinc-500 mx-auto" />
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-zinc-500">
                    No runs yet
                  </td>
                </tr>
              ) : (
                runs.map((run: RunEntry) => (
                  <tr
                    key={run.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="py-2.5 pr-3 text-zinc-100 truncate max-w-32">
                      {run.pipeline_name ?? 'Playground'}
                    </td>
                    <td className="py-2.5 pr-3 text-zinc-400">
                      {MODEL_SHORT[run.model_used] ?? run.model_used}
                    </td>
                    <td className="py-2.5 pr-3">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-zinc-400">
                      {run.total_tokens.toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-zinc-400">
                      ${run.cost_usd.toFixed(4)}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-zinc-400">
                      {run.latency_ms.toLocaleString()}ms
                    </td>
                    <td className="py-2.5 text-right text-zinc-500 whitespace-nowrap">
                      {formatTime(run.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">
              {total} run{total !== 1 ? 's' : ''} &middot; Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
