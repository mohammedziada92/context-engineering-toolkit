'use client'

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

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
    <Select value={value} onValueChange={(v) => { if (v) onChange(v) }}>
      <SelectTrigger className={`h-8 bg-zinc-900 border-zinc-700 text-zinc-100 text-xs hover:bg-zinc-800 ${className ?? ''}`}>
        <SelectValue placeholder="Select model…" />
      </SelectTrigger>
      <SelectContent className="bg-zinc-900 border-zinc-800">
        {MODELS.map((m) => (
          <SelectItem key={m.id} value={m.id} className="text-xs text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100">
            {m.label} <span className="text-zinc-500">({m.provider})</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
