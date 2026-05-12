'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getAuthHeader } from '@/lib/api/api'

interface UsageData {
  pipelines_count: number
  knowledge_count: number
  runs_this_month: number
  storage_mb: number
  period_start: string
  period_end: string
}

async function fetchUsage(): Promise<UsageData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/billing/usage`, {
    headers: await getAuthHeader(),
  })
  if (!res.ok) throw new Error('Failed to fetch usage')
  return res.json()
}

const ROWS = [
  {
    label: 'Pipeline Runs',
    key: 'runs_this_month' as const,
    limit: 'Unlimited',
    format: (v: number) => v.toLocaleString() + ' runs this month',
  },
  {
    label: 'Pipelines',
    key: 'pipelines_count' as const,
    limit: 'Unlimited',
    format: (v: number) => v.toLocaleString() + ' created',
  },
  {
    label: 'Knowledge Sources',
    key: 'knowledge_count' as const,
    limit: 'Unlimited',
    format: (v: number) => v.toLocaleString() + ' sources',
  },
  {
    label: 'Storage',
    key: 'storage_mb' as const,
    limit: '1 GB',
    format: (v: number) => (v / 1024).toFixed(1) + ' GB of 1 GB',
    showBar: true,
    maxMb: 1024,
  },
]

export function BillingQuotas() {
  const { data, isLoading } = useQuery({
    queryKey: ['billing-usage'],
    queryFn: fetchUsage,
    staleTime: 5 * 60 * 1000,
  })

  const resetDate = data
    ? new Date(data.period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-zinc-100">Usage Quotas</CardTitle>
          {resetDate && (
            <span className="text-xs text-zinc-500">Resets {resetDate}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {ROWS.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-zinc-300">{row.label}</span>
                <div className="flex items-center gap-3">
                  {isLoading ? (
                    <Skeleton className="h-3 w-28 bg-zinc-800" />
                  ) : (
                    <span className="text-xs text-zinc-400 font-mono tabular-nums">
                      {data && data[row.key] != null ? row.format(data[row.key]) : '\u2014'}
                    </span>
                  )}
                  <span className="text-xs text-emerald-400 font-medium w-20 text-right">
                    {row.limit}
                  </span>
                </div>
              </div>
              {'showBar' in row && row.showBar && data?.storage_mb != null && (
                <div className="h-1.5 w-full rounded-full bg-zinc-800">
                  <div
                    className="h-1.5 rounded-full bg-violet-500 transition-all"
                    style={{
                      width: `${Math.min((data.storage_mb / (row.maxMb ?? 1024)) * 100, 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
