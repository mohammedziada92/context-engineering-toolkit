'use client'

import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle2, XCircle, MinusCircle, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCost, formatTokens, formatLatency, type RunRecord } from '@/lib/api/analytics'
import { modelShortname } from '@/lib/models'

const STATUS_ICONS: Record<RunRecord['status'], { icon: React.ElementType; cls: string }> = {
  success:   { icon: CheckCircle2, cls: 'text-emerald-400' },
  error:     { icon: XCircle,      cls: 'text-red-400'     },
  cancelled: { icon: MinusCircle,  cls: 'text-zinc-500'    },
}

interface Props {
  runs:    RunRecord[]
  loading: boolean
}

export function RecentRunsCard({ runs, loading }: Props) {
  const router = useRouter()

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          Recent Runs
        </h2>
        <Button
          variant="ghost" size="sm"
          className="h-6 text-[11px] text-zinc-500 hover:text-zinc-300 gap-1 px-2"
          onClick={() => router.push('/analytics')}
        >
          View all <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-zinc-600">No runs yet</p>
          <p className="text-[11px] text-zinc-700 mt-0.5">
            Run a pipeline to see activity here
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {runs.map((run) => {
            const { icon: Icon, cls } = STATUS_ICONS[run.status]
            return (
              <div
                key={run.id}
                onClick={() => router.push(`/pipelines/${run.pipeline_id}`)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/60 cursor-pointer transition-colors"
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${cls}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-200 truncate">
                    {run.pipeline_name}
                  </p>
                  <p className="text-[10px] text-zinc-600">
                    {modelShortname(run.model)} · {run.total_tokens != null ? formatTokens(run.total_tokens) : '—'} · {run.cost_usd != null ? formatCost(run.cost_usd) : '—'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-zinc-500">{run.latency_ms != null ? formatLatency(run.latency_ms) : '—'}</p>
                  <p className="text-[10px] text-zinc-700">
                    {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
