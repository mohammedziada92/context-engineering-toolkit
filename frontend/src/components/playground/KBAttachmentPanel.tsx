'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/api'
import { Label } from '@/components/ui/label'
import { BookOpen } from 'lucide-react'

interface Props {
  knowledgeSourceId: string | null
  topK: number
  threshold: number
  onKBChange: (id: string | null) => void
  onTopKChange: (v: number) => void
  onThresholdChange: (v: number) => void
}

export function KBAttachmentPanel({
  knowledgeSourceId,
  topK,
  threshold,
  onKBChange,
  onTopKChange,
  onThresholdChange,
}: Props) {
  const { data: sources = [] } = useQuery({
    queryKey: ['knowledge-ready'],
    queryFn: () => apiFetch('/api/v1/knowledge?status=ready&limit=50'),
    staleTime: 60_000,
  })

  return (
    <div className="space-y-3 pt-3 border-t border-zinc-800">
      <div className="flex items-center gap-1.5">
        <BookOpen className="h-3.5 w-3.5 text-zinc-500" />
        <Label className="text-xs font-medium text-zinc-400">Knowledge Base</Label>
      </div>

      <select
        value={knowledgeSourceId ?? ''}
        onChange={(e) => onKBChange(e.target.value || null)}
        className="w-full h-8 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-xs text-zinc-300 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
      >
        <option value="">None</option>
        {(sources as any[]).map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.total_chunks?.toLocaleString() ?? 0} chunks)
          </option>
        ))}
      </select>

      {knowledgeSourceId && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-zinc-500">Top K</Label>
            <input
              type="number"
              min={1} max={20}
              value={topK}
              onChange={(e) => onTopKChange(Number(e.target.value))}
              className="w-full h-7 rounded border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-200 tabular-nums focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-zinc-500">Threshold</Label>
            <input
              type="number"
              min={0.5} max={1.0} step={0.05}
              value={threshold}
              onChange={(e) => onThresholdChange(Number(e.target.value))}
              className="w-full h-7 rounded border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-200 tabular-nums focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        </div>
      )}

      {(sources as any[]).length === 0 && (
        <p className="text-xs text-zinc-600">
          No ready knowledge sources.{' '}
          <a href="/knowledge" className="text-violet-400 hover:text-violet-300">Upload one</a>.
        </p>
      )}
    </div>
  )
}
