'use client'

import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, Legend, Label, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCostByModel } from '@/lib/api/analytics'

const MODEL_COLORS: Record<string, string> = {
  'anthropic/claude-sonnet-4-6': '#8b5cf6',
  'z-ai/glm-5': '#3b82f6',
  'google/gemini-3.1-pro-preview': '#10b981',
}

const MODEL_LABELS: Record<string, string> = {
  'anthropic/claude-sonnet-4-6': 'Claude',
  'z-ai/glm-5': 'GLM-5',
  'google/gemini-3.1-pro-preview': 'Gemini',
}

interface CostByModelChartProps {
  filters: Record<string, string | undefined>
  activeModel?: string
  onModelClick: (modelId: string) => void
}

export function CostByModelChart({ filters, activeModel, onModelClick }: CostByModelChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-cost-by-model', filters],
    queryFn: () => getCostByModel(filters),
    staleTime: 2 * 60 * 1000,
  })

  const total = data?.reduce((sum: number, d: any) => sum + d.cost, 0) ?? 0

  const chartData = (data ?? []).map((d: any) => ({
    name: MODEL_LABELS[d.model] ?? d.model,
    model: d.model,
    value: d.cost,
    pct: d.pct,
    color: MODEL_COLORS[d.model] ?? '#71717a',
  }))

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-300">Cost by Model</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-56 flex items-center justify-center">
            <Skeleton className="h-40 w-40 rounded-full bg-zinc-800" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-zinc-500">
            No data for selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={224}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                onClick={(entry) => onModelClick(entry.model)}
                style={{ cursor: 'pointer' }}
              >
                {chartData.map((entry: any) => (
                  <Cell
                    key={entry.model}
                    fill={entry.color}
                    opacity={activeModel && activeModel !== entry.model ? 0.3 : 1}
                    stroke="transparent"
                  />
                ))}
                <Label
                  content={() => (
                    <text>
                      <tspan x="50%" y="46%" textAnchor="middle" fill="#a1a1aa" fontSize="11">
                        Total
                      </tspan>
                      <tspan x="50%" y="58%" textAnchor="middle" fill="#fafafa" fontSize="18" fontWeight="700">
                        ${total.toFixed(2)}
                      </tspan>
                    </text>
                  )}
                  position="center"
                />
              </Pie>
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8 }}
                labelStyle={{ color: '#fafafa' }}
                formatter={(value: number, name: string) => [
                  `$${value.toFixed(3)}`,
                  name,
                ]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ color: '#a1a1aa', fontSize: '12px' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
