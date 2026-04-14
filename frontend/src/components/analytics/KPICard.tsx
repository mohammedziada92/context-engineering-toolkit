'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon,
} from 'lucide-react'

type KPIFormat = 'number' | 'tokens' | 'currency' | 'latency'

interface KPICardProps {
  label: string
  value: number
  delta?: number
  deltaPositiveIsGood: boolean
  icon: LucideIcon
  format: KPIFormat
}

function formatValue(value: number, format: KPIFormat): string {
  switch (format) {
    case 'number':
      return value.toLocaleString()
    case 'tokens':
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)
    case 'currency':
      return `$${value.toFixed(4)}`
    case 'latency':
      return `${Math.round(value)}ms`
    default:
      return String(value)
  }
}

export function KPICard({ label, value, delta, deltaPositiveIsGood, icon: Icon, format }: KPICardProps) {
  const displayValue = formatValue(value, format)

  let trendColor = ''
  let TrendIcon: typeof TrendingUp | null = null

  if (delta !== undefined) {
    const isPositive = delta > 0
    const isGood = isPositive === deltaPositiveIsGood
    trendColor = isGood ? 'text-emerald-500' : 'text-red-500'
    TrendIcon = isPositive ? TrendingUp : delta < 0 ? TrendingDown : Minus
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-500">{label}</p>
          <Icon className="size-4 text-zinc-600" />
        </div>
        <p className="mt-1 text-xl font-semibold text-zinc-100 tabular-nums">
          {displayValue}
        </p>
        {delta !== undefined && (
          <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
            {TrendIcon && <TrendIcon className="size-3" />}
            <span className="text-[10px] font-medium">
              {delta > 0 ? '+' : ''}
              {delta.toFixed(1)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
