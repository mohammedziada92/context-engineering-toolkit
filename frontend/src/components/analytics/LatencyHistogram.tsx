'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getLatencyDistribution } from '@/lib/api/analytics'

interface LatencyHistogramProps {
  filters: Record<string, string | undefined>
}

function formatMs(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`
}

export function LatencyHistogram({ filters }: LatencyHistogramProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-latency-distribution', filters],
    queryFn: () => getLatencyDistribution(filters),
    staleTime: 2 * 60 * 1000,
  })

  const buckets = data?.buckets ?? []
  const stats = data?.stats ?? null

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-300">Latency Distribution</CardTitle>
          {stats && (
            <div className="flex items-center gap-4">
              {[
                { label: 'Median', value: stats.median },
                { label: 'P95', value: stats.p95 },
                { label: 'P99', value: stats.p99 },
              ].map(({ label, value }) => (
                <div key={label} className="text-right">
                  <p className="text-xs text-zinc-500">{label}</p>
                  <p className="text-sm font-mono font-medium text-zinc-200 tabular-nums">
                    {formatMs(value)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 flex items-end gap-2 pb-4 px-2">
            {[40, 65, 80, 55, 35, 20].map((h, i) => (
              <Skeleton key={i} className="flex-1 bg-zinc-800 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        ) : buckets.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-zinc-500">
            No latency data for selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={192}>
            <BarChart data={buckets} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="bucket"
                tick={{ fill: '#71717a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                cursor={{ fill: 'rgba(139,92,246,0.08)' }}
                contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8 }}
                formatter={(value: number, _: string, props: any) => [
                  `${value.toLocaleString()} runs (${props.payload.pct}%)`,
                  'Runs',
                ]}
              />
              <Bar dataKey="runs" radius={[3, 3, 0, 0]}>
                {buckets.map((entry: any) => (
                  <Cell
                    key={entry.bucket}
                    fill={entry.bucket === '5s+' ? '#ef4444' : '#8b5cf6'}
                    opacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
