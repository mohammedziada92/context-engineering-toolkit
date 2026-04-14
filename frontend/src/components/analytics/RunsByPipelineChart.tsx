'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getRunsByPipeline } from '@/lib/api/analytics'

interface RunsByPipelineChartProps {
  filters: Record<string, string | undefined>
  activePipeline?: string
  onPipelineClick: (pipelineId: string) => void
}

function truncate(str: string, max = 22) {
  return str.length > max ? str.slice(0, max) + '…' : str
}

export function RunsByPipelineChart({
  filters,
  activePipeline,
  onPipelineClick,
}: RunsByPipelineChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-runs-by-pipeline', filters],
    queryFn: () => getRunsByPipeline(filters),
    staleTime: 2 * 60 * 1000,
  })

  const chartData = (data ?? [])
    .sort((a: any, b: any) => b.runs - a.runs)
    .map((d: any) => ({
      ...d,
      label: truncate(d.pipeline),
    }))

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-300">Runs by Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2 pt-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-6 bg-zinc-800 rounded" style={{ width: `${80 - i * 15}%` }} />
            ))}
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-zinc-500">
            No pipeline runs yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 44)}>
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 4, right: 40, left: 4, bottom: 4 }}
            >
              <XAxis
                type="number"
                tick={{ fill: '#71717a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={130}
                tick={{ fill: '#a1a1aa', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(139,92,246,0.08)' }}
                contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8 }}
                formatter={(value: number) => [value.toLocaleString() + ' runs', 'Runs']}
                labelFormatter={() => ''}
              />
              <Bar
                dataKey="runs"
                radius={[0, 4, 4, 0]}
                onClick={(entry) => onPipelineClick(entry.id)}
                style={{ cursor: 'pointer' }}
              >
                {chartData.map((entry: any) => (
                  <Cell
                    key={entry.id}
                    fill="#8b5cf6"
                    opacity={activePipeline && activePipeline !== entry.id ? 0.3 : 1}
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
