'use client'

import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Database, Layers, ArrowRight, CheckCircle2, Loader2, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge }  from '@/components/ui/badge'
import type { KnowledgeSource, KnowledgeSourceStatus } from '@/lib/api/knowledge'

const STATUS_CONFIG: Record<KnowledgeSourceStatus, {
  icon: React.ElementType
  className: string
}> = {
  ready:      { icon: CheckCircle2, className: 'bg-emerald-500/10 text-emerald-400 border-transparent' },
  processing: { icon: Loader2,      className: 'bg-blue-500/10 text-blue-400 border-transparent'     },
  pending:    { icon: Clock,        className: 'bg-zinc-800 text-zinc-400 border-transparent'         },
  error:      { icon: AlertCircle,  className: 'bg-red-500/10 text-red-400 border-transparent'        },
}

interface Props {
  sources: KnowledgeSource[]
  loading: boolean
}

export function RecentSourcesCard({ sources, loading }: Props) {
  const router = useRouter()

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-emerald-400" />
          Knowledge Sources
        </h2>
        <Button
          variant="ghost" size="sm"
          className="h-6 text-[11px] text-zinc-500 hover:text-zinc-300 gap-1 px-2"
          onClick={() => router.push('/knowledge')}
        >
          View all <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : sources.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs text-zinc-600">No knowledge sources yet</p>
          <Button
            size="sm"
            className="mt-3 h-7 text-xs bg-emerald-700 hover:bg-emerald-600 text-white"
            onClick={() => router.push('/knowledge')}
          >
            Create knowledge source
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sources.map((s) => {
            const cfg  = STATUS_CONFIG[s.status]
            const Icon = cfg.icon
            return (
              <div
                key={s.id}
                onClick={() => router.push(`/knowledge/${s.id}`)}
                className="flex flex-col gap-2 p-3 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-200 truncate">{s.name}</p>
                  <Badge variant="outline" className={`text-[9px] h-4 px-1.5 shrink-0 ${cfg.className}`}>
                    <Icon className={`h-2 w-2 mr-0.5 ${s.status === 'processing' ? 'animate-spin' : ''}`} />
                    {s.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                  <span className="flex items-center gap-1">
                    <Layers className="h-2.5 w-2.5" />
                    {(s.chunk_count ?? 0).toLocaleString()} chunks
                  </span>
                  <span>{formatDistanceToNow(new Date(s.updated_at), { addSuffix: true })}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
