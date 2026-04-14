'use client'

import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { GitBranch, ArrowRight } from 'lucide-react'

interface Pipeline {
  id: string
  name: string
  status: 'active' | 'draft'
  model: string
  run_count: number
  updated_at: string
}

interface Props {
  pipelines: Pipeline[]
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

function modelShort(model: string) {
  return model.split('/').pop()?.replace('claude-sonnet-', 'claude-s-') ?? model
}

export function RecentPipelines({ pipelines, loading }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-zinc-500" />
          Recent Pipelines
        </h2>
        <Link
          href="/pipelines"
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="divide-y divide-zinc-800/60">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="h-4 w-36 bg-zinc-800" />
              <Skeleton className="h-5 w-12 bg-zinc-800 ml-auto" />
              <Skeleton className="h-4 w-12 bg-zinc-800" />
            </div>
          ))
        ) : pipelines.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <GitBranch className="h-8 w-8 text-zinc-700 mb-2" />
            <p className="text-sm text-zinc-500">No pipelines yet.</p>
            <Link href="/pipelines/new" className="text-xs text-violet-400 hover:text-violet-300 mt-1">
              Create your first
            </Link>
          </div>
        ) : (
          pipelines.map((p) => (
            <Link
              key={p.id}
              href={`/pipelines/${p.id}`}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">{p.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{modelShort(p.model)} · {p.run_count} runs</p>
              </div>
              <Badge
                variant="outline"
                className={p.status === 'active'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 text-xs'}
              >
                {p.status === 'active' && (
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                )}
                {p.status}
              </Badge>
              <span className="text-xs text-zinc-500 flex-shrink-0 w-12 text-right">
                {relativeTime(p.updated_at)}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
