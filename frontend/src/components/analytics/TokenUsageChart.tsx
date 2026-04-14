'use client'

import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTokenUsage, type AnalyticsFilters } from '@/lib/api/analytics'

interface TokenUsageChartProps {
  filters: AnalyticsFilters
}

export function TokenUsageChart({ filters }: TokenUsageChartProps) {
  const { data = [] } = useQuery({
    queryKey: ['analytics-token-usage', filters],
    queryFn: () => getTokenUsage(filters),
    staleTime: 2 * 60 * 1000,
  })

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-zinc-100">
          Token Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-xs text-zinc-500">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="promptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#71717a' }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#71717a' }}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                labelStyle={{ color: '#f4f4f5' }}
              />
              <Area
                type="monotone"
                dataKey="prompt_tokens"
                stroke="#8b5cf6"
                fill="url(#promptGrad)"
                name="Prompt"
              />
              <Area
                type="monotone"
                dataKey="completion_tokens"
                stroke="#2dd4bf"
                fill="url(#completionGrad)"
                name="Completion"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
