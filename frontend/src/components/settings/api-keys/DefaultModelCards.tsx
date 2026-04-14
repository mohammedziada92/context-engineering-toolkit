'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'
import { updateDefaultModel } from '@/lib/api/settings'
import { cn } from '@/lib/utils'

const MODELS = [
  {
    id: 'anthropic/claude-sonnet-4-6',
    provider: 'Anthropic',
    name: 'Claude Sonnet 4.6',
    role: 'Quality Default',
    roleClass: 'text-violet-400 bg-violet-500/10',
    context: '1M ctx',
    price: '$3 / $15 per 1M tok',
  },
  {
    id: 'z-ai/glm-5',
    provider: 'Z.ai',
    name: 'GLM-5',
    role: 'Agent / Coding',
    roleClass: 'text-blue-400 bg-blue-500/10',
    context: '—',
    price: 'Custom pricing',
  },
  {
    id: 'google/gemini-3.1-pro-preview',
    provider: 'Google',
    name: 'Gemini 3.1 Pro',
    role: 'Budget / RAG',
    roleClass: 'text-emerald-400 bg-emerald-500/10',
    context: '1M ctx',
    price: '$2 / $12 per 1M tok',
  },
]

interface Props {
  currentModel?: string
}

export function DefaultModelCards({ currentModel }: Props) {
  const qc = useQueryClient()
  const activeModel = currentModel ?? 'anthropic/claude-sonnet-4-6'

  const { mutate } = useMutation({
    mutationFn: updateDefaultModel,
    onSuccess: (_, model) => {
      qc.setQueryData(['settings'], (old: any) => ({ ...old, default_model: model }))
      toast.success('Default model updated')
    },
  })

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-sm font-medium text-zinc-200 mb-1">Default Model</h2>
      <p className="text-xs text-zinc-500 mb-4">Used by new pipelines and the playground</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {MODELS.map((m) => {
          const active = activeModel === m.id
          return (
            <button
              key={m.id}
              onClick={() => mutate(m.id)}
              className={cn(
                'relative text-left rounded-xl border p-4 transition-all',
                active
                  ? 'border-violet-500/50 bg-violet-500/10'
                  : 'border-zinc-700 bg-zinc-800/60 hover:border-zinc-600'
              )}
            >
              {active && (
                <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-violet-400" />
              )}
              <p className="text-xs text-zinc-500 mb-1">{m.provider}</p>
              <p className="text-sm font-medium text-zinc-200 mb-2">{m.name}</p>
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${m.roleClass} mb-3`}>
                {m.role}
              </span>
              <p className="text-xs text-zinc-600">{m.context}</p>
              <p className="text-xs text-zinc-600">{m.price}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
