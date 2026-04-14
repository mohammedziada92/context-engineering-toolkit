'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCost, type AnalyticsFilters, type CostEntry } from '@/lib/api/analytics'

const MODEL_COLORS: Record<string, string> = {
  'anthropic/claude-sonnet-4-6': '#4f98a3',
  'z-ai/glm-5': '#8b5cf6',
  'google/gemini-3.1-pro-preview': '#22c55e',
}

const MODEL_LABELS: Record<string, string> = {
  'anthropic/claude-sonnet-4-6': 'Claude',
  'z-ai/glm-5': 'GLM-5',
  'google/gemini-3.1-pro-preview': 'Gemini',
}

interface GroupedRow {
  date: string
  [modelLabel: string]: number | string
}

function groupByDate(data: CostEntry[]): GroupedRow[] {
  const map = new Map<string, GroupedRow>()
  for (const row of data) {
    if (!map.has(row.date)) {
      map.set(row.date, { date: row.date })
    }
    const entry = map.get(row.date)!
    const label = MODEL_LABELS[row.model_used] ?? row.model_used
    entry[label] = (entry[label] as number ?? 0) + row.cost_usd
  }
  return Array.from(map.values())
}

function getUniqueModels(data: CostEntry[]): string[] {
  const seen = new Set<string>()
  for (const row of data) {
    seen.add(MODEL_LABELS[row.model_used] ?? row.model_used)
  }
  return Array.from(seen)
}

interface CostChartProps {
  filters: AnalyticsFilters
}

export function CostChart({ filters }: CostChartProps) {
  const { data = [] } = useQuery({
    queryKey: ['analytics-cost', filters],
    queryFn: () => getCost(filters),
    staleTime: 2 * 60 * 1000,
  })

  const grouped = groupByDate(data)
  const models = getUniqueModels(data)

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-zinc-100">
          Cost by Model
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-xs text-zinc-500">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={grouped}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#71717a' }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#71717a' }}
                tickFormatter={(v: number) => `$${v.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                labelStyle={{ color: '#f4f4f5' }}
                formatter={(value) => [`$${Number(value).toFixed(4)}`]}
              />
              {models.map((label) => {
                const modelId = Object.entries(MODEL_LABELS).find(
                  ([, v]) => v === label
                )?.[0]
                const color =
                  modelId && MODEL_COLORS[modelId]
                    ? MODEL_COLORS[modelId]
                    : '#6b7280'
                return (
                  <Bar
                    key={label}
                    dataKey={label}
                    stackId="cost"
                    fill={color}
                    radius={[2, 2, 0, 0]}
                  />
                )
              })}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
