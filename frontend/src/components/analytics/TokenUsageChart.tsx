'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { formatTokens, type DailyUsage } from '@/lib/api/analytics'

interface Props {
  dailyUsage: DailyUsage[]
  loading:    boolean
}

export function TokenUsageChart({ dailyUsage, loading }: Props) {
  const data = dailyUsage.map((d) => ({
    date:   d.date,
    label:  format(parseISO(d.date), 'MMM d'),
    input:  d.input_tokens,
    output: d.output_tokens,
  }))

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="text-xs font-semibold text-zinc-300 mb-4">Token Usage</h2>

      {loading ? (
        <div className="h-[200px] rounded-lg bg-zinc-800 animate-pulse" />
      ) : data.length === 0 ? (
        <EmptyChart label="No token data for this period" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="inputGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6d28d9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6d28d9" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="outputGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0}   />
              </linearGradient>
            </defs>
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
              tickFormatter={formatTokens}
              width={42}
            />
            <Tooltip
              contentStyle={{
                background: '#18181b', border: '1px solid #27272a',
                borderRadius: '8px', fontSize: '11px', color: '#d4d4d8',
              }}
              formatter={(val, name) => [
                formatTokens(Number(val)),
                name === 'input' ? 'Input tokens' : 'Output tokens',
              ]}
              labelFormatter={(l) => l}
            />
            <Legend
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: '10px', color: '#71717a', paddingTop: '8px' }}
            />
            <Area
              type="monotone" dataKey="input"  name="input"
              stroke="#6d28d9" fill="url(#inputGrad)"
              strokeWidth={1.5} dot={false}
            />
            <Area
              type="monotone" dataKey="output" name="output"
              stroke="#0d9488" fill="url(#outputGrad)"
              strokeWidth={1.5} dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[200px] flex items-center justify-center">
      <p className="text-xs text-zinc-600">{label}</p>
    </div>
  )
}
