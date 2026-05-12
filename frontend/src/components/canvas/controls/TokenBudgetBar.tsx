'use client'

import { usePipelineStore, computeTokenUsage, TOKEN_BUDGET } from '@/stores/pipeline.store'

const INPUT_BUDGET = TOKEN_BUDGET.systemPrompt + TOKEN_BUDGET.rag + TOKEN_BUDGET.history

const COLORS: Record<string, string> = {
  systemPrompt: '#3b82f6', // blue-500
  rag:          '#10b981', // emerald-500
  history:      '#f59e0b', // amber-500
}

export function TokenBudgetBar() {
  const nodes  = usePipelineStore((s) => s.nodes)
  const usage  = computeTokenUsage(nodes)
  const fillPct = Math.min(100, (usage.total / INPUT_BUDGET) * 100)

  const segments = [
    { key: 'systemPrompt', label: 'System Prompt', value: usage.systemPrompt },
    { key: 'rag',          label: 'RAG',           value: usage.rag },
    { key: 'history',      label: 'History',       value: usage.history },
  ]

  const total = usage.total || 1

  // Build a CSS linear-gradient so segments are always visible as solid blocks
  const activeSegments = segments.filter((s) => s.value > 0)
  let gradientStops: string[] = []
  if (activeSegments.length > 0) {
    let offset = 0
    for (const s of activeSegments) {
      const segPct = (s.value / total) * fillPct
      const start = offset
      const end = offset + segPct
      gradientStops.push(
        `${COLORS[s.key]} ${start}%`,
        `${COLORS[s.key]} ${end}%`,
      )
      offset = end
    }
  }

  return (
    <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-950 flex items-center gap-4">
      {/* Bar */}
      <div className="flex-1">
        <div
          className="h-3 rounded-full bg-zinc-800"
          style={gradientStops.length > 0 ? {
            background: `linear-gradient(to right, ${gradientStops.join(', ')})`,
          } : undefined}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-zinc-500 shrink-0">
        {segments.map((s) => (
          <span key={s.key} className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: COLORS[s.key] }}
            />
            {s.label}
          </span>
        ))}
      </div>

      {/* Total */}
      <div className={`text-xs font-mono shrink-0 ${usage.over ? 'text-red-400' : 'text-zinc-400'}`}>
        {usage.total.toLocaleString()}
        <span className="text-zinc-600"> / {INPUT_BUDGET.toLocaleString()}</span>
        {usage.over && <span className="ml-2 text-red-400 font-semibold">Over budget!</span>}
      </div>
    </div>
  )
}
