'use client'

import { useQuery } from '@tanstack/react-query'
import { useReactFlow } from '@xyflow/react'
import { X, Trash2 } from 'lucide-react'
import { usePipelineStore } from '@/stores/pipeline.store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { SUPPORTED_MODELS } from '@/lib/models'
import { getKnowledgeSources } from '@/lib/api/knowledge'
import { TOKEN_BUDGET } from '@/stores/pipeline.store'

export function ConfigPanel() {
  const nodes          = usePipelineStore((s) => s.nodes)
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId)
  const setSelectedNode= usePipelineStore((s) => s.setSelectedNode)
  const updateNodeData = usePipelineStore((s) => s.updateNodeData)
  const deleteNode     = usePipelineStore((s) => s.deleteNode)
  const { setNodes: setRFNodes } = useReactFlow()

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  const { data: kbSources } = useQuery({
    queryKey: ['knowledge-sources'],
    queryFn:  getKnowledgeSources,
    enabled:  selectedNode?.data?.type === 'rag',
    staleTime: 60_000,
  })

  if (!selectedNode) {
    return (
      <div className="w-[320px] border-l border-zinc-800 bg-zinc-950 flex items-center justify-center p-6">
        <p className="text-xs text-zinc-600 text-center leading-relaxed">
          Select a node to configure it
        </p>
      </div>
    )
  }

  const d    = selectedNode.data as Record<string, unknown>
  const type = (d.type ?? '') as string

  function update(patch: Record<string, unknown>) {
    const id = selectedNode!.id
    updateNodeData(id, patch as never)
    setRFNodes((rfNodes) =>
      rfNodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
      )
    )
  }

  return (
    <div className="w-[320px] border-l border-zinc-800 bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
        <p className="text-xs font-semibold text-zinc-300">
          Configure {type === 'systemPrompt' ? 'System Prompt' : type === 'rag' ? 'Vector Search' : type === 'llm' ? 'LLM' : type === 'history' ? 'Chat History' : 'Output'} Node
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
            onClick={() => deleteNode(selectedNode.id)}
            aria-label="Delete node"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
            onClick={() => setSelectedNode(null)}
            aria-label="Close panel"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Scrollable Fields */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* System Prompt */}
        {type === 'systemPrompt' && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Prompt Content</Label>
              <Textarea
                value={(d.content ?? '') as string}
                onChange={(e) => update({ content: e.target.value })}
                placeholder="You are a helpful assistant..."
                rows={8}
                className="bg-zinc-900 border-zinc-800 text-zinc-200 text-xs resize-none focus-visible:ring-violet-500/30"
              />
            </div>
            <BudgetSlider
              label="Max Token Budget"
              value={(d.max_tokens ?? 0) as number}
              max={TOKEN_BUDGET.systemPrompt * 4}
              onChange={(v) => update({ max_tokens: v })}
              color="text-blue-400"
            />
          </>
        )}

        {/* RAG */}
        {type === 'rag' && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Knowledge Source</Label>
              <select
                value={(d.knowledge_source_id as string) ?? 'none'}
                onChange={(e) => update({ knowledge_source_id: e.target.value === 'none' ? null : e.target.value })}
                className="flex h-8 w-full items-center rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300 outline-none focus-visible:border-violet-500/50 focus-visible:ring-2 focus-visible:ring-violet-500/20 cursor-pointer appearance-none"
              >
                <option value="none">None</option>
                {(kbSources ?? []).map((s: { id: string; name: string }) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <NumberField label="Top K" value={(d.top_k ?? 5) as number} min={1} max={20}
              onChange={(v) => update({ top_k: v })} />

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label className="text-xs text-zinc-400">Similarity Threshold</Label>
                <span className="text-xs font-mono text-emerald-400">{((d.similarity_threshold ?? 0.5) as number).toFixed(2)}</span>
              </div>
              <Slider
                min={0.40} max={1.0} step={0.01}
                value={[(d.similarity_threshold ?? 0.5) as number]}
                onValueChange={(v) => update({ similarity_threshold: typeof v === 'number' ? v : (v as number[])[0] })}
                className="[&>span]:bg-emerald-500"
              />
              <p className="text-[10px] text-zinc-600">Lower values return more results but may reduce relevance</p>
            </div>

            <BudgetSlider
              label="Max Token Budget"
              value={(d.max_tokens ?? 0) as number}
              max={TOKEN_BUDGET.rag * 4}
              onChange={(v) => update({ max_tokens: v })}
              color="text-emerald-400"
            />
          </>
        )}

        {/* History */}
        {type === 'history' && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Compression Strategy</Label>
              <select
                value={(d.strategy ?? 'keep') as string}
                onChange={(e) => update({ strategy: e.target.value })}
                className="flex h-8 w-full items-center rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300 outline-none focus-visible:border-violet-500/50 focus-visible:ring-2 focus-visible:ring-violet-500/20 cursor-pointer appearance-none"
              >
                <option value="keep">Keep all</option>
                <option value="summarize">Summarize</option>
                <option value="truncate">Truncate</option>
              </select>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                {d.strategy === 'summarize'
                  ? 'LLM compresses history before injecting — adds latency but saves tokens'
                  : d.strategy === 'truncate'
                  ? 'Keeps last N messages fitting within budget'
                  : 'Injects full history — risky for long sessions'}
              </p>
            </div>
            <BudgetSlider
              label="Max Token Budget"
              value={(d.max_tokens ?? 0) as number}
              max={TOKEN_BUDGET.history * 4}
              onChange={(v) => update({ max_tokens: v })}
              color="text-amber-400"
            />
          </>
        )}

        {/* LLM */}
        {type === 'llm' && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Model</Label>
              <select
                value={(d.model ?? '') as string}
                onChange={(e) => update({ model: e.target.value })}
                className="flex h-8 w-full items-center rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300 outline-none focus-visible:border-violet-500/50 focus-visible:ring-2 focus-visible:ring-violet-500/20 cursor-pointer appearance-none"
              >
                {SUPPORTED_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} — {m.provider}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label className="text-xs text-zinc-400">Temperature</Label>
                <span className="text-xs font-mono text-violet-400">{((d.temperature ?? 0.7) as number).toFixed(1)}</span>
              </div>
              <Slider
                min={0} max={1} step={0.1}
                value={[(d.temperature ?? 0.7) as number]}
                onValueChange={(v) => update({ temperature: typeof v === 'number' ? v : (v as number[])[0] })}
                className="[&>span]:bg-violet-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-600">
                <span>0.0 precise</span>
                <span>1.0 creative</span>
              </div>
            </div>

            <NumberField label="Max Output Tokens" value={(d.max_output_tokens ?? 2048) as number}
              min={256} max={8192} onChange={(v) => update({ max_output_tokens: v })} />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs text-zinc-400">Streaming</Label>
                <p className="text-[10px] text-zinc-600">Enable SSE streaming</p>
              </div>
              <Switch
                checked={(d.stream ?? false) as boolean}
                onCheckedChange={(v) => update({ stream: v })}
              />
            </div>
          </>
        )}

        {/* Output */}
        {type === 'output' && (
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Output Format</Label>
            <select
              value={(d.format ?? 'text') as string}
              onChange={(e) => update({ format: e.target.value })}
              className="flex h-8 w-full items-center rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300 outline-none focus-visible:border-violet-500/50 focus-visible:ring-2 focus-visible:ring-violet-500/20 cursor-pointer appearance-none"
            >
              <option value="markdown">Markdown</option>
              <option value="plain">Plain text</option>
            </select>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Shared sub-components ────────────────────────────────────────────────────

function BudgetSlider({
  label, value, max, onChange, color,
}: { label: string; value: number; max: number; onChange: (v: number) => void; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <Label className="text-xs text-zinc-400">{label}</Label>
        <span className={`text-xs font-mono ${color}`}>{value.toLocaleString()}</span>
      </div>
      <Slider
        min={100} max={max} step={100}
        value={[value]}
        onValueChange={(v) => onChange(typeof v === 'number' ? v : (v as number[])[0])}
      />
    </div>
  )
}

function NumberField({
  label, value, min, max, onChange,
}: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-zinc-400">{label}</Label>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-zinc-900 border-zinc-800 text-zinc-200 text-xs"
      />
    </div>
  )
}
