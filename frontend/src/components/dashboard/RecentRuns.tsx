'use client'

import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { Zap, ArrowRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface Run {
  id: string
  pipeline_name: string
  model_used: string
  total_tokens: number
  status: 'success' | 'error' | 'running'
  created_at: string
}

interface Props {
  runs: Run[]
  loading: boolean
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

const StatusIcon = ({ status }: { status: Run['status'] }) => {
  if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
  if (status === 'error') return <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
  return <Loader2 className="h-4 w-4 text-blue-400 animate-spin flex-shrink-0" />
}

function modelShort(model: string) {
  return model.split('/').pop()?.replace('claude-sonnet-', 'claude-s-') ?? model
}

export function RecentRuns({ runs, loading }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
          <Zap className="h-4 w-4 text-zinc-500" />
          Recent Runs
        </h2>
        <Link
          href="/analytics"
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
        >
          View analytics <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="divide-y divide-zinc-800/60">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="h-4 w-4 rounded-full bg-zinc-800" />
              <Skeleton className="h-4 w-28 bg-zinc-800" />
              <Skeleton className="h-4 w-16 bg-zinc-800 ml-auto" />
            </div>
          ))
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <Zap className="h-8 w-8 text-zinc-700 mb-2" />
            <p className="text-sm text-zinc-500">No runs yet.</p>
            <Link href="/playground" className="text-xs text-violet-400 hover:text-violet-300 mt-1">
              Open Playground
            </Link>
          </div>
        ) : (
          runs.map((run) => (
            <div key={run.id} className="flex items-center gap-3 px-5 py-3.5">
              <StatusIcon status={run.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">{run.pipeline_name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {modelShort(run.model_used)}
                  {run.total_tokens > 0 && ` · ${run.total_tokens.toLocaleString()} tok`}
                </p>
              </div>
              <span className="text-xs text-zinc-500 flex-shrink-0">
                {relativeTime(run.created_at)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
