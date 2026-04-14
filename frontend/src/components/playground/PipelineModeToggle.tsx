'use client'

import { useQuery } from '@tanstack/react-query'
import { listPipelines } from '@/lib/api/pipelines'
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
  const { data: pipelines = [] } = useQuery({
    queryKey: ['pipelines-active'],
    queryFn: listPipelines,
    staleTime: 60_000,
    enabled: mode === 'pipeline',
  })

  // Filter to active pipelines client-side
  const activePipelines = (pipelines as any[]).filter(
    (p) => !p.status || p.status === 'active'
  )

  return (
    <div className="space-y-3">
      {/* Mode tabs */}
      <div className="flex rounded-md border border-zinc-800 bg-zinc-950 p-0.5 gap-0.5">
        {(['direct', 'pipeline'] as const).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`flex-1 py-1.5 rounded text-xs font-medium capitalize transition-colors ${
              mode === m
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {m === 'direct' ? 'Direct LLM' : 'Pipeline'}
          </button>
        ))}
      </div>

      {/* Pipeline selector */}
      {mode === 'pipeline' && (
        <div className="space-y-2">
          <select
            value={pipelineId ?? ''}
            onChange={(e) => onPipelineChange(e.target.value)}
            className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
          >
            <option value="" disabled>Select a pipeline…</option>
            {activePipelines.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.pipeline_config?.model?.split('/').pop() ?? 'unknown'} · {p.node_count ?? '?'} nodes)
              </option>
            ))}
          </select>

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
