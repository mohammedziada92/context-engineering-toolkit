'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ReactFlowProvider } from '@xyflow/react'

import { usePipelineStore }          from '@/stores/pipeline.store'
import { createPipeline, updatePipeline, deletePipeline, duplicatePipeline } from '@/lib/api/pipelines'
import { CanvasTopBar }              from '@/components/canvas/CanvasTopBar'
import { TokenBudgetBar }            from '@/components/canvas/controls/TokenBudgetBar'
import { NodePanel }                 from '@/components/canvas/controls/NodePanel'
import { ConfigPanel }               from '@/components/canvas/controls/ConfigPanel'

// Lazy-load heavy canvas bundle
const PipelineCanvas = dynamic(
  () => import('@/components/canvas/PipelineCanvas').then((m) => ({ default: m.PipelineCanvas })),
  { ssr: false, loading: () => <div className="flex-1 bg-zinc-950" /> }
)

const AUTO_SAVE_DELAY = 30_000

export default function NewPipelinePage() {
  const router = useRouter()
  const qc     = useQueryClient()
  const store  = usePipelineStore()

  // Reset store on mount
  useEffect(() => { store.reset() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { mutateAsync: doCreate } = useMutation({ mutationFn: createPipeline })
  const { mutateAsync: doUpdate } = useMutation({ mutationFn: ({ id, ...rest }: { id: string } & Parameters<typeof updatePipeline>[1]) => updatePipeline(id, rest) })
  const { mutateAsync: doDelete } = useMutation({ mutationFn: deletePipeline })
  const { mutateAsync: doDup }    = useMutation({ mutationFn: duplicatePipeline })

  const handleSave = useCallback(async () => {
    if (store.isSaving) return
    store.setSaving(true)
    try {
      const payload = {
        name:           store.pipelineName,
        canvas_state:   { nodes: store.nodes, edges: store.edges, viewport: store.viewport },
        pipeline_config: buildPipelineConfig(store.nodes),
        status:         store.status,
      }

      if (store.pipelineId) {
        await doUpdate({ id: store.pipelineId, ...payload })
      } else {
        const created = await doCreate(payload)
        store.setPipelineId(created.id)
        // Update URL without full navigation
        window.history.replaceState({}, '', `/pipelines/${created.id}`)
      }
      store.setDirty(false)
      qc.invalidateQueries({ queryKey: ['pipelines'] })
    } catch {
      toast.error('Failed to save pipeline')
    } finally {
      store.setSaving(false)
    }
  }, [store, doCreate, doUpdate, qc])

  // Auto-save every 30s when dirty
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      if (store.isDirty && store.pipelineId) handleSave()
    }, AUTO_SAVE_DELAY)
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current) }
  }, [store.isDirty, store.pipelineId, handleSave])

  function handleExport() {
    const json = JSON.stringify({
      name: store.pipelineName,
      version: '1.0',
      exported_at: new Date().toISOString(),
      canvas_state:    { nodes: store.nodes, edges: store.edges, viewport: store.viewport },
      pipeline_config: buildPipelineConfig(store.nodes),
    }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${store.pipelineName.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
  }

  async function handleDelete() {
    if (!store.pipelineId) { store.reset(); router.push('/pipelines'); return }
    const ok = window.confirm(`Delete "${store.pipelineName}"? This cannot be undone.`)
    if (!ok) return
    await doDelete(store.pipelineId)
    qc.invalidateQueries({ queryKey: ['pipelines'] })
    router.push('/pipelines')
  }

  async function handleDuplicate() {
    if (!store.pipelineId) { toast.error('Save the pipeline first'); return }
    const copy = await doDup(store.pipelineId)
    toast.success('Pipeline duplicated', {
      action: { label: 'Edit', onClick: () => router.push(`/pipelines/${copy.id}`) },
    })
  }

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-full overflow-hidden">
        <CanvasTopBar
          onSave={handleSave}
          onRun={() => toast.info('Save the pipeline first, then use Run')}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onExport={handleExport}
        />
        <TokenBudgetBar />
        <div className="flex flex-1 overflow-hidden">
          <NodePanel />
          <PipelineCanvas />
          <ConfigPanel />
        </div>
      </div>
    </ReactFlowProvider>
  )
}

function buildPipelineConfig(nodes: ReturnType<typeof usePipelineStore.getState>['nodes']) {
  const config: Record<string, unknown> = {}
  for (const n of nodes) {
    const d = n.data as Record<string, unknown>
    config[n.id] = d
  }
  return config
}
