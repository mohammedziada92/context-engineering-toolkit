'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { formatCost, type DailyUsage } from '@/lib/api/analytics'

interface Props {
  dailyUsage: DailyUsage[]
  loading:    boolean
}

export function CostChart({ dailyUsage, loading }: Props) {
  const data = dailyUsage.map((d) => ({
    label:    format(parseISO(d.date), 'MMM d'),
    cost_usd: d.cost_usd,
    runs:     d.run_count,
  }))

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="text-xs font-semibold text-zinc-300 mb-4">Daily Cost (USD)</h2>

      {loading ? (
        <div className="h-[200px] rounded-lg bg-zinc-800 animate-pulse" />
      ) : data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-xs text-zinc-600">No cost data for this period</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCost(v)}
              width={48}
            />
            <Tooltip
              contentStyle={{
                background: '#18181b', border: '1px solid #27272a',
                borderRadius: '8px', fontSize: '11px', color: '#d4d4d8',
              }}
              formatter={(val: number, _: string, entry: { payload: { runs: number } }) => [
                `${formatCost(val)} (${entry.payload.runs} runs)`,
                'Cost',
              ]}
              labelFormatter={(l) => l}
              cursor={{ fill: '#27272a' }}
            />
            <Bar
              dataKey="cost_usd"
              fill="#7c3aed"
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
