'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/api'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
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
    queryFn: async () => {
      const res = await apiFetch<{ items: any[]; total: number }>('/api/v1/knowledge?status=ready&limit=50')
      return res.items ?? []
    },
    staleTime: 60_000,
  })

  return (
    <div className="space-y-3 pt-3 border-t border-zinc-800">
      <div className="flex items-center gap-1.5">
        <BookOpen className="h-3.5 w-3.5 text-zinc-500" />
        <Label className="text-xs font-medium text-zinc-400">Knowledge Base</Label>
      </div>

      <Select value={knowledgeSourceId ?? 'none'} onValueChange={(v) => onKBChange(v === 'none' ? null : v)}>
        <SelectTrigger className="h-8 bg-zinc-900 border-zinc-700 text-zinc-100 text-xs hover:bg-zinc-800">
          <SelectValue placeholder="None">
            {(value: string | null) => {
              if (!value || value === 'none') return 'None'
              const source = sources.find((s) => s.id === value)
              return source?.name ?? value
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-800">
          <SelectItem value="none" className="text-xs text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100">None</SelectItem>
          {sources.map((s) => (
            <SelectItem key={s.id} value={s.id} className="text-xs text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100">
              {s.name} <span className="text-zinc-500">({s.total_chunks?.toLocaleString() ?? 0} chunks)</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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

      {sources.length === 0 && (
        <p className="text-xs text-zinc-600">
          No ready knowledge sources.{' '}
          <a href="/knowledge" className="text-violet-400 hover:text-violet-300">Upload one</a>.
        </p>
      )}
    </div>
  )
}
