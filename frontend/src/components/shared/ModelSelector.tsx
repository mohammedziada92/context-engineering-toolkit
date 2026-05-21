'use client'

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
  className?: string
}

const MODELS = [
  { id: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'Anthropic' },
  { id: 'z-ai/glm-5', label: 'GLM-5', provider: 'Z.ai' },
  { id: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', provider: 'Google' },
]

export function ModelSelector({ value, onChange, className }: ModelSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => { if (e.target.value) onChange(e.target.value) }}
      className={`flex h-8 w-full items-center rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 text-xs text-zinc-100 outline-none focus-visible:border-violet-500/50 focus-visible:ring-2 focus-visible:ring-violet-500/20 cursor-pointer appearance-none hover:bg-zinc-800 ${className ?? ''}`}
    >
      {MODELS.map((m) => (
        <option key={m.id} value={m.id}>{m.label} ({m.provider})</option>
      ))}
    </select>
  )
}
