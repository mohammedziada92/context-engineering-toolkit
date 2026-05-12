'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ReactFlowProvider } from '@xyflow/react'
import { Loader2 } from 'lucide-react'

import { usePipelineStore }          from '@/stores/pipeline.store'
import { useShallow }                from 'zustand/react/shallow'
import { getPipeline, updatePipeline, deletePipeline, duplicatePipeline, type Pipeline } from '@/lib/api/pipelines'
import { CanvasTopBar }              from '@/components/canvas/CanvasTopBar'
import { TokenBudgetBar }            from '@/components/canvas/controls/TokenBudgetBar'
import { NodePanel }                 from '@/components/canvas/controls/NodePanel'
import { ConfigPanel }               from '@/components/canvas/controls/ConfigPanel'
import { RunModal }                  from '@/components/pipelines/RunModal'

const PipelineCanvas = dynamic(
  () => import('@/components/canvas/PipelineCanvas').then((m) => ({ default: m.PipelineCanvas })),
  { ssr: false, loading: () => <div className="flex-1 bg-zinc-950" /> }
)

const AUTO_SAVE_DELAY = 30_000

export default function EditPipelinePage() {
  const router     = useRouter()
  const { id }     = useParams<{ id: string }>()
  const qc         = useQueryClient()
  const store      = usePipelineStore(
    useShallow((s) => ({
      pipelineId: s.pipelineId, pipelineName: s.pipelineName,
      nodes: s.nodes, edges: s.edges, viewport: s.viewport,
      status: s.status, isDirty: s.isDirty, isSaving: s.isSaving,
      setPipelineId: s.setPipelineId, setPipelineName: s.setPipelineName,
      setStatus: s.setStatus, setSaving: s.setSaving, setDirty: s.setDirty,
      loadCanvas: s.loadCanvas,
    }))
  )

  // ── Fetch pipeline ────────────────────────────────────────────────────────
  const { data: pipeline, isLoading } = useQuery({
    queryKey: ['pipeline', id],
    queryFn:  () => getPipeline(id),
    staleTime: 60_000,
  })

  // Load into Zustand on first fetch
  const loaded = useRef(false)
  useEffect(() => {
    if (!pipeline || loaded.current) return
    loaded.current = true
    store.setPipelineId(pipeline.id)
    store.setPipelineName(pipeline.name)
    store.setStatus(pipeline.status as 'active' | 'draft')
    const cs = pipeline.canvas_state as { nodes?: unknown[]; edges?: unknown[]; viewport?: unknown } | undefined
    const LEGACY_TYPE_MAP: Record<string, string> = {
      userMessage: 'systemPrompt',
      llmModel: 'llm',
      vectorSearch: 'rag',
    }
    const migratedNodes = (cs?.nodes ?? []).map((n: any) => {
      const resolvedType = LEGACY_TYPE_MAP[n.type] ?? n.type
      return {
        ...n,
        type: resolvedType,
        data: { ...n.data, type: resolvedType },
      }
    })
    store.loadCanvas(
      migratedNodes as never,
      (cs?.edges ?? []) as never,
      (cs?.viewport ?? { x: 0, y: 0, zoom: 1 }) as never,
    )
  }, [pipeline, store]) // store is a stable ref from useShallow

  // ── Mutations ─────────────────────────────────────────────────────────────
  const { mutateAsync: doUpdate } = useMutation({
    mutationFn: (payload: Parameters<typeof updatePipeline>[1]) =>
      updatePipeline(id, payload),
  })
  const { mutateAsync: doDelete } = useMutation({ mutationFn: () => deletePipeline(id) })
  const { mutateAsync: doDup }    = useMutation({ mutationFn: () => duplicatePipeline(id) })

  // ── Name-only save (PATCH on blur) ─────────────────────────────────────────
  const handleNameChange = useCallback(async (name: string) => {
    try {
      await doUpdate({ name })
      qc.invalidateQueries({ queryKey: ['pipelines'] })
    } catch {
      toast.error('Failed to rename pipeline')
    }
  }, [doUpdate, qc])

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (store.isSaving) return
    store.setSaving(true)
    try {
      await doUpdate({
        name:           store.pipelineName,
        canvas_state:   { nodes: store.nodes, edges: store.edges, viewport: store.viewport },
        pipeline_config: buildPipelineConfig(store.nodes),
        status:         store.status,
      })
      store.setDirty(false)
      qc.invalidateQueries({ queryKey: ['pipelines'] })
    } catch {
      toast.error('Failed to save pipeline')
    } finally {
      store.setSaving(false)
    }
  }, [store, doUpdate, qc])

  // Auto-save
  useEffect(() => {
    const t = setInterval(() => {
      if (store.isDirty) handleSave()
    }, AUTO_SAVE_DELAY)
    return () => clearInterval(t)
  }, [store.isDirty, handleSave])

  // ── Actions ───────────────────────────────────────────────────────────────
  async function handleDelete() {
    const ok = window.confirm(`Delete "${store.pipelineName}"? This cannot be undone.`)
    if (!ok) return
    await doDelete()
    qc.invalidateQueries({ queryKey: ['pipelines'] })
    router.push('/pipelines')
  }

  async function handleDuplicate() {
    const copy = await doDup()
    toast.success('Pipeline duplicated', {
      action: { label: 'Edit', onClick: () => router.push(`/pipelines/${copy.id}`) },
    })
  }

  function handleExport() {
    const json = JSON.stringify({
      name: store.pipelineName,
      version: '1.0',
      exported_at: new Date().toISOString(),
      canvas_state:    { nodes: store.nodes, edges: store.edges, viewport: store.viewport },
      pipeline_config: buildPipelineConfig(store.nodes),
    }, null, 2)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    a.download = `${store.pipelineName.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading || !loaded.current) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <EditPageInner
        onSave={handleSave}
        onNameChange={handleNameChange}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onExport={handleExport}
        pipeline={pipeline!}
      />
    </ReactFlowProvider>
  )
}

// Inner component so RunModal state is clean
function EditPageInner({ onSave, onNameChange, onDelete, onDuplicate, onExport, pipeline }: {
  onSave: () => Promise<void>
  onNameChange: (name: string) => Promise<void>
  onDelete: () => void
  onDuplicate: () => void
  onExport: () => void
  pipeline: Pipeline
}) {
  const [runModalOpen, setRunModalOpen] = useState(false)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <CanvasTopBar
        onSave={onSave}
        onNameChange={onNameChange}
        onRun={() => setRunModalOpen(true)}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onExport={onExport}
        showHistory
      />
      <TokenBudgetBar />
      <div className="flex flex-1 overflow-hidden">
        <NodePanel />
        <PipelineCanvas />
        <ConfigPanel />
      </div>

      {runModalOpen && (
        <RunModal
          pipeline={pipeline}
          onClose={() => setRunModalOpen(false)}
        />
      )}
    </div>
  )
}

function buildPipelineConfig(nodes: ReturnType<typeof usePipelineStore.getState>['nodes']) {
  const config: Record<string, unknown> = {}
  for (const n of nodes) config[n.id] = n.data
  return config
}
