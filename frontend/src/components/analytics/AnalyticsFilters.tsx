'use client'

import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { listPipelines } from '@/lib/api/pipelines'

const MODELS = [
  { id: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
  { id: 'z-ai/glm-5', label: 'GLM-5' },
  { id: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
]

interface AnalyticsFiltersProps {
  pipelineId?: string
  modelId?: string
  hasActiveFilters: boolean
  onSetFilter: (key: string, value: string | null) => void
  onClearFilters: () => void
}

export function AnalyticsFilters({
  pipelineId,
  modelId,
  hasActiveFilters,
  onSetFilter,
  onClearFilters,
}: AnalyticsFiltersProps) {
  const { data: pipelines = [] } = useQuery({
    queryKey: ['pipelines-list'],
    queryFn: listPipelines,
    staleTime: 5 * 60 * 1000,
  })

  const activePipeline = pipelines.find((p: { id: string; name: string }) => p.id === pipelineId)
  const activeModel = MODELS.find((m) => m.id === modelId)

  return (
    <div className="flex items-center gap-2 flex-wrap min-h-8">
      {/* Pipeline selector */}
      <select
        value={pipelineId ?? ''}
        onChange={(e) => onSetFilter('pipeline', e.target.value || null)}
        className="h-8 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-300 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
      >
        <option value="">All Pipelines</option>
        {pipelines.map((p: { id: string; name: string }) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {/* Model selector */}
      <select
        value={modelId ?? ''}
        onChange={(e) => onSetFilter('model', e.target.value || null)}
        className="h-8 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-300 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
      >
        <option value="">All Models</option>
        {MODELS.map((m) => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>

      {/* Active filter chips */}
      {activePipeline && (
        <div className="flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-1">
          <span className="text-xs text-violet-300">{activePipeline.name}</span>
          <button
            onClick={() => onSetFilter('pipeline', null)}
            className="text-violet-400 hover:text-violet-200 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {activeModel && (
        <div className="flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-1">
          <span className="text-xs text-violet-300">{activeModel.label}</span>
          <button
            onClick={() => onSetFilter('model', null)}
            className="text-violet-400 hover:text-violet-200 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Clear all */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-zinc-500 hover:text-zinc-200 px-2"
          onClick={onClearFilters}
        >
          Clear all
        </Button>
      )}
    </div>
  )
}
