'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Trash2, ChevronDown, ChevronUp, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge }  from '@/components/ui/badge'
import { listChunks, deleteChunk, type Chunk } from '@/lib/api/knowledge'
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination'

const PAGE_LIMIT = 20

interface Props {
  sourceId:   string
  chunkCount: number
}

export function ChunksPanel({ sourceId, chunkCount }: Props) {
  const [page,     setPage]     = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['chunks', sourceId, page],
    queryFn:  () => listChunks(sourceId, { page, limit: PAGE_LIMIT }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  const { mutate: doDelete } = useMutation({
    mutationFn: (chunkId: string) => deleteChunk(sourceId, chunkId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chunks', sourceId] })
      qc.invalidateQueries({ queryKey: ['knowledge-source', sourceId] })
      toast.success('Chunk deleted')
    },
    onError: () => toast.error('Failed to delete chunk'),
  })

  const chunks     = data?.items ?? []
  const total      = data?.total ?? chunkCount
  const totalPages = Math.ceil(total / PAGE_LIMIT)

  if (isLoading && chunks.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-zinc-900 animate-pulse" />
        ))}
      </div>
    )
  }

  if (chunks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Layers className="h-10 w-10 text-zinc-700 mb-4" />
        <p className="text-sm font-medium text-zinc-400">No chunks yet</p>
        <p className="text-xs text-zinc-600 mt-1">
          Add content using the "Add Content" tab
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <p className="text-xs text-zinc-500">{total.toLocaleString()} chunks total</p>

      <div className="space-y-2">
        {chunks.map((chunk) => (
          <ChunkRow
            key={chunk.id}
            chunk={chunk}
            expanded={expanded === chunk.id}
            onToggle={() => setExpanded(expanded === chunk.id ? null : chunk.id)}
            onDelete={() => doDelete(chunk.id)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
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

function ChunkRow({ chunk, expanded, onToggle, onDelete }: {
  chunk:    Chunk
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const preview = chunk.content.slice(0, 120) + (chunk.content.length > 120 ? '…' : '')

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-300 leading-relaxed">
            {expanded ? chunk.content : preview}
          </p>
          {chunk.metadata && Object.keys(chunk.metadata).length > 0 && !expanded && (
            <div className="flex items-center gap-2 mt-1.5">
              {Object.entries(chunk.metadata).slice(0, 3).map(([k, v]) => (
                <Badge key={k} variant="outline" className="text-[9px] border-zinc-700 text-zinc-500 h-4 px-1.5">
                  {k}: {String(v).slice(0, 20)}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-zinc-600">{chunk.token_count} tok</span>
          <Button
            variant="ghost" size="icon"
            className="h-5 w-5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            aria-label="Delete chunk"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          {expanded
            ? <ChevronUp className="h-3.5 w-3.5 text-zinc-600" />
            : <ChevronDown className="h-3.5 w-3.5 text-zinc-600" />
          }
        </div>
      </div>

      {/* Expanded metadata */}
      {expanded && chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
        <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-950/50">
          <p className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wider">Metadata</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(chunk.metadata).map(([k, v]) => (
              <Badge key={k} variant="outline" className="text-[10px] border-zinc-700 text-zinc-400 h-5 px-2">
                {k}: {String(v)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
