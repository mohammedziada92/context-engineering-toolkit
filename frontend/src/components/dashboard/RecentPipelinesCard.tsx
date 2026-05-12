'use client'

import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { GitBranch, Play, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge }  from '@/components/ui/badge'
import { modelShortname } from '@/lib/models'
import type { Pipeline } from '@/lib/api/pipelines'

interface Props {
  pipelines: Pipeline[]
  loading:   boolean
}

export function RecentPipelinesCard({ pipelines, loading }: Props) {
  const router = useRouter()

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
          <GitBranch className="h-3.5 w-3.5 text-violet-400" />
          Recent Pipelines
        </h2>
        <Button
          variant="ghost" size="sm"
          className="h-6 text-[11px] text-zinc-500 hover:text-zinc-300 gap-1 px-2"
          onClick={() => router.push('/pipelines')}
        >
          View all <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : pipelines.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-zinc-600">No pipelines yet</p>
          <Button
            size="sm"
            className="mt-3 h-7 text-xs bg-violet-600 hover:bg-violet-500 text-white"
            onClick={() => router.push('/pipelines/new')}
          >
            Create your first pipeline
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          {pipelines.map((p) => (
            <div
              key={p.id}
              onClick={() => router.push(`/pipelines/${p.id}`)}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/60 cursor-pointer transition-colors"
            >
              <div className="h-7 w-7 rounded-md bg-violet-600/15 flex items-center justify-center shrink-0">
                <GitBranch className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-200 truncate">{p.name}</p>
                <p className="text-[10px] text-zinc-600">
                  {p.model ? `${modelShortname(p.model)} · ` : ''}{p.run_count ?? 0} run{(p.run_count ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge
                  variant="outline"
                  className={`text-[9px] h-4 px-1.5 border-transparent ${
                    p.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${p.status === 'active' ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                  {p.status === 'active' ? 'Active' : 'Draft'}
                </Badge>
                <p className="text-[10px] text-zinc-700">
                  {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
