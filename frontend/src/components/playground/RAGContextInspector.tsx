'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Chunk {
  score: number
  content: string
  chunk_index: number
  metadata: Record<string, unknown>
}

interface Props {
  chunks: Chunk[]
}

function scoreColor(score: number) {
  if (score >= 0.90) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
  if (score >= 0.75) return 'text-blue-400 border-blue-500/30 bg-blue-500/10'
  return 'text-amber-400 border-amber-500/30 bg-amber-500/10'
}

function scoreLabel(score: number) {
  if (score >= 0.90) return 'Excellent'
  if (score >= 0.75) return 'Good'
  return 'Marginal'
}

export function RAGContextInspector({ chunks }: Props) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  function toggleChunk(idx: number) {
    setExpanded((s) => {
      const next = new Set(s)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  return (
    <div className="ml-1 w-full max-w-[85%]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Database className="h-3 w-3" />
        {chunks.length} chunk{chunks.length !== 1 ? 's' : ''} retrieved
      </button>

      {open && (
        <div className="space-y-2 mt-1">
          {chunks.map((chunk, i) => (
            <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden">
              <button
                onClick={() => toggleChunk(i)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-800/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className={cn(
                    'text-xs font-mono font-medium px-1.5 py-0.5 rounded border',
                    scoreColor(chunk.score)
                  )}>
                    {chunk.score.toFixed(2)}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {scoreLabel(chunk.score)} · Chunk {chunk.chunk_index}
                    {chunk.metadata?.page != null && ` · Pg ${String(chunk.metadata.page)}`}
                    {chunk.metadata?.source != null && ` · ${String(chunk.metadata.source)}`}
                  </span>
                </div>
                {expanded.has(i)
                  ? <ChevronDown className="h-3 w-3 text-zinc-600" />
                  : <ChevronRight className="h-3 w-3 text-zinc-600" />
                }
              </button>

              {expanded.has(i) && (
                <div className="px-3 pb-3 pt-1">
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono">
                    {chunk.content}
                  </p>
                </div>
              )}

              {!expanded.has(i) && (
                <div className="px-3 pb-2">
                  <p className="text-xs text-zinc-500 truncate">
                    {chunk.content.slice(0, 120)}…
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
