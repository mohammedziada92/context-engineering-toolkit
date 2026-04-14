'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, CheckCircle2 } from 'lucide-react'
import { saveAsPipeline } from '@/lib/api/playground'

interface Config {
  model: string
  system_prompt: string
  temperature: number
  max_tokens: number
  top_p: number
  knowledge_source_id: string | null
  top_k: number
  threshold: number
}

interface Props {
  open: boolean
  onClose: () => void
  config: Config
  systemPromptTokens: number
}

const MODEL_NAMES: Record<string, string> = {
  'anthropic/claude-sonnet-4-6': 'Claude Sonnet 4.6',
  'z-ai/glm-5': 'GLM-5',
  'google/gemini-3.1-pro-preview': 'Gemini 3.1 Pro',
}

export function SaveAsPipelineModal({ open, onClose, config, systemPromptTokens }: Props) {
  const router = useRouter()
  const [name, setName] = useState('My Playground Config')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [pipelineId, setPipelineId] = useState<string | null>(null)

  if (!open) return null

  async function handleCreate() {
    if (!name.trim()) return
    setStatus('loading')
    try {
      const pipeline = await saveAsPipeline({
        name: name.trim(),
        model: config.model,
        system_prompt: config.system_prompt,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        top_p: config.top_p,
        knowledge_source_id: config.knowledge_source_id,
        top_k: config.top_k,
        threshold: config.threshold,
      })
      setPipelineId(pipeline.id)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  const PREVIEW = [
    { label: 'Model', value: MODEL_NAMES[config.model] ?? config.model },
    { label: 'System Prompt', value: `${systemPromptTokens} tokens` },
    { label: 'Temperature', value: config.temperature.toFixed(1) },
    { label: 'Knowledge Base', value: config.knowledge_source_id ? `Attached (Top K ${config.top_k}, ≥${config.threshold})` : 'None' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-zinc-100">Save as Pipeline</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {status === 'done' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-300">Pipeline created!</p>
                <p className="text-xs text-emerald-400/70 mt-0.5">
                  &ldquo;{name}&rdquo; is ready in Draft mode.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-zinc-700 text-zinc-300"
                onClick={onClose}
              >
                Close
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white"
                onClick={() => { onClose(); router.push(`/pipelines/${pipelineId}`) }}
              >
                Open Canvas
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              This will create a new pipeline pre-configured with your current playground settings.
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Pipeline Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Playground Config"
                className="bg-zinc-800 border-zinc-700 text-zinc-200 h-9"
                disabled={status === 'loading'}
              />
            </div>

            {/* Config preview */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 divide-y divide-zinc-800">
              {PREVIEW.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs text-zinc-500">{label}</span>
                  <span className="text-xs text-zinc-300 font-medium">{value}</span>
                </div>
              ))}
            </div>

            {status === 'error' && (
              <p className="text-xs text-red-400">Failed to create pipeline. Try again.</p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-zinc-700 text-zinc-300"
                onClick={onClose}
                disabled={status === 'loading'}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white"
                onClick={handleCreate}
                disabled={!name.trim() || status === 'loading'}
              >
                {status === 'loading' ? 'Creating…' : 'Create Pipeline'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
