'use client'

import { usePipelineStore, computeTokenUsage, TOKEN_BUDGET } from '@/stores/pipeline.store'

export function TokenBudgetBar() {
  const nodes  = usePipelineStore((s) => s.nodes)
  const usage  = computeTokenUsage(nodes)
  const pct    = Math.min(100, (usage.total / TOKEN_BUDGET.total) * 100)

  const segments = [
    { key: 'systemPrompt', label: 'System Prompt', value: usage.systemPrompt, color: 'bg-blue-500',   pct: (usage.systemPrompt / TOKEN_BUDGET.total) * 100 },
    { key: 'rag',          label: 'RAG',           value: usage.rag,          color: 'bg-emerald-500', pct: (usage.rag          / TOKEN_BUDGET.total) * 100 },
    { key: 'history',      label: 'History',       value: usage.history,      color: 'bg-amber-500',   pct: (usage.history      / TOKEN_BUDGET.total) * 100 },
  ]

  return (
    <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-950 flex items-center gap-4">
      {/* Bar */}
      <div className="flex-1 relative">
        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden flex">
          {segments.map((s) =>
            s.value > 0 ? (
              <div
                key={s.key}
                style={{ width: `${s.pct}%` }}
                className={`${s.color} transition-all duration-300`}
                title={`${s.label}: ${s.value.toLocaleString()} tokens`}
              />
            ) : null
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-zinc-500 shrink-0">
        {segments.map((s) => (
          <span key={s.key} className="flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-full ${s.color}`} />
            {s.label}
          </span>
        ))}
      </div>

      {/* Total */}
      <div className={`text-xs font-mono shrink-0 ${usage.over ? 'text-red-400' : 'text-zinc-400'}`}>
        {usage.total.toLocaleString()}
        <span className="text-zinc-600"> / {TOKEN_BUDGET.total.toLocaleString()}</span>
        {usage.over && <span className="ml-2 text-red-400 font-semibold">Over budget!</span>}
      </div>
    </div>
  )
}
