'use client'

import type { Period } from './AnalyticsPageContent'

const OPTIONS: { value: Period; label: string }[] = [
  { value: '7d',  label: '7 days'  },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
]

interface Props {
  value:    Period
  onChange: (p: Period) => void
}

export function PeriodSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`
            px-3 py-1 rounded-md text-xs font-medium transition-colors
            ${value === o.value
              ? 'bg-violet-600 text-white'
              : 'text-zinc-500 hover:text-zinc-300'}
          `}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
