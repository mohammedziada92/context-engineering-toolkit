'use client'

import { memo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Database, FileText, Layers, Trash2, ExternalLink, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { KnowledgeSource, KnowledgeSourceStatus } from '@/lib/api/knowledge'

const STATUS_CONFIG: Record<KnowledgeSourceStatus, {
  label: string
  icon: React.ElementType
  className: string
}> = {
  ready:      { label: 'Ready',      icon: CheckCircle2, className: 'bg-emerald-500/10 text-emerald-400 border-transparent' },
  processing: { label: 'Processing', icon: Loader2,      className: 'bg-blue-500/10 text-blue-400 border-transparent' },
  pending:    { label: 'Pending',    icon: Clock,        className: 'bg-zinc-800 text-zinc-400 border-transparent' },
  error:      { label: 'Error',      icon: AlertCircle,  className: 'bg-red-500/10 text-red-400 border-transparent' },
}

interface Props {
  source:   KnowledgeSource
  onOpen:   () => void
  onDelete: () => void
}

export const KnowledgeSourceCard = memo(function KnowledgeSourceCard({ source, onOpen, onDelete }: Props) {
  const cfg  = STATUS_CONFIG[source.status]
  const Icon = cfg.icon

  return (
    <div
      onClick={onOpen}
      className="group relative flex flex-col gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-emerald-600/15 flex items-center justify-center shrink-0">
            <Database className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-100 truncate">{source.name}</p>
            {source.description && (
              <p className="text-[11px] text-zinc-500 truncate mt-0.5">{source.description}</p>
            )}
          </div>
        </div>

        {/* Delete — hover reveal */}
        <Button
          variant="ghost" size="icon"
          className="h-6 w-6 shrink-0 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          aria-label="Delete source"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {source.document_count.toLocaleString()} docs
        </span>
        <span className="flex items-center gap-1">
          <Layers className="h-3 w-3" />
          {source.chunk_count.toLocaleString()} chunks
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        <Badge variant="outline" className={`text-[10px] h-5 gap-1 px-2 ${cfg.className}`}>
          <Icon className={`h-2.5 w-2.5 ${source.status === 'processing' ? 'animate-spin' : ''}`} />
          {cfg.label}
        </Badge>
        <span className="text-[10px] text-zinc-600">
          {formatDistanceToNow(new Date(source.updated_at), { addSuffix: true })}
        </span>
      </div>

      {/* Open indicator on hover */}
      <ExternalLink className="absolute bottom-4 right-4 h-3 w-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
})
