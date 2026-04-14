'use client'

import Link from 'next/link'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type Format = 'number' | 'tokens' | 'currency' | 'latency'

interface Props {
  icon: LucideIcon
  label: string
  value: number
  delta: number          // absolute count for 'number'; percentage for others
  deltaPositiveIsGood: boolean
  format: Format
  loading?: boolean
  href?: string
}

function formatValue(value: number, format: Format): string {
  switch (format) {
    case 'tokens':
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
      return value.toLocaleString()
    case 'currency':
      return `$${value.toFixed(2)}`
    case 'latency':
      return `${(value / 1000).toFixed(2)}s`
    default:
      return value.toLocaleString()
  }
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  delta,
  deltaPositiveIsGood,
  format,
  loading,
  href,
}: Props) {
  const isPositive = delta > 0
  const isNeutral = delta === 0
  const isGood = deltaPositiveIsGood ? isPositive : !isPositive
  const isBad = deltaPositiveIsGood ? !isPositive : isPositive

  const deltaColor = isNeutral
    ? 'text-zinc-500'
    : isGood
    ? 'text-emerald-400'
    : 'text-red-400'

  const DeltaIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown

  const inner = (
    <div className={cn(
      'group relative rounded-xl border border-zinc-800 bg-zinc-900 p-5 overflow-hidden transition-colors',
      href && 'cursor-pointer hover:border-zinc-700 hover:bg-zinc-800/60'
    )}>
      {/* Icon bg blob */}
      <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-violet-500/5 transition-all group-hover:bg-violet-500/10" />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-violet-400 transition-colors">
            <Icon className="h-4.5 w-4.5" />
          </div>

          {!isNeutral && (
            <div className={cn('flex items-center gap-1 text-xs font-medium tabular-nums', deltaColor)}>
              <DeltaIcon className="h-3 w-3" />
              {format === 'number'
                ? `${Math.abs(delta)} today`
                : `${Math.abs(delta).toFixed(0)}%`}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-24 bg-zinc-800" />
            <Skeleton className="h-4 w-20 bg-zinc-800" />
          </div>
        ) : (
          <>
            <p className="text-2xl font-bold text-zinc-100 tabular-nums tracking-tight">
              {formatValue(value, format)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">{label}</p>
          </>
        )}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{inner}</Link>
  }
  return inner
}
