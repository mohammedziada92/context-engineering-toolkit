'use client'

import { useQuery } from '@tanstack/react-query'
import { listPipelines, type PipelinesListResponse, type Pipeline } from '@/lib/api/pipelines'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

type Mode = 'direct' | 'pipeline'

interface Props {
  mode: Mode
  pipelineId: string | null
  onModeChange: (mode: Mode) => void
  onPipelineChange: (id: string) => void
}

export function PipelineModeToggle({ mode, pipelineId, onModeChange, onPipelineChange }: Props) {
  const { data: pipelinesResponse } = useQuery<PipelinesListResponse>({
    queryKey: ['pipelines-active'],
    queryFn: () => listPipelines(),
    staleTime: 60_000,
    enabled: mode === 'pipeline',
  })

  // Filter to active pipelines client-side
  const activePipelines: Pipeline[] = (pipelinesResponse?.items ?? []).filter(
    (p) => !p.status || p.status === 'active'
  )

  return (
    <div className="space-y-3">
      {/* Mode tabs */}
      <div className="inline-flex rounded-lg bg-zinc-800/60 p-0.5 gap-0.5">
        {(['direct', 'pipeline'] as const).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
              mode === m
                ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {m === 'direct' ? 'Direct LLM' : 'Pipeline'}
          </button>
        ))}
      </div>

      {/* Pipeline selector */}
      {mode === 'pipeline' && (
        <div className="space-y-2">
          <Select value={pipelineId ?? ''} onValueChange={(v) => { if (v) onPipelineChange(v) }}>
            <SelectTrigger className="h-8 bg-zinc-900 border-zinc-700 text-zinc-100 text-xs hover:bg-zinc-800">
              <SelectValue placeholder="Select a pipeline…">
                {(value: string | null) => {
                  if (!value) return 'Select a pipeline…'
                  const pipeline = activePipelines.find((p) => p.id === value)
                  return pipeline?.name ?? value
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              {activePipelines.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100">
                  {p.name} <span className="text-zinc-500">({typeof (p.pipeline_config as Record<string, unknown>)?.model === 'string' ? ((p.pipeline_config as Record<string, string>).model).split('/').pop() : 'unknown'} · {(p.canvas_state as { nodes?: unknown[] })?.nodes?.length ?? '?'} nodes)</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {pipelineId && (
            <Link
              href={`/pipelines/${pipelineId}`}
              className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              target="_blank"
            >
              <ExternalLink className="h-3 w-3" />
              View Pipeline Canvas
            </Link>
          )}

          {activePipelines.length === 0 && (
            <p className="text-xs text-zinc-500">
              No active pipelines.{' '}
              <Link href="/pipelines/new" className="text-violet-400 hover:text-violet-300">
                Create one
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
