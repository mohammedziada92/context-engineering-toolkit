'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart2 } from 'lucide-react'
import { getAnalytics, type AnalyticsResponse, type Period } from '@/lib/api/analytics'
import { PeriodSelector }     from './PeriodSelector'
import { SummaryKPIs }        from './SummaryKPIs'
import { TokenUsageChart }    from './TokenUsageChart'
import { CostChart }          from './CostChart'
import { ModelBreakdownTable }    from './ModelBreakdownTable'
import { PipelineBreakdownTable } from './PipelineBreakdownTable'
import { RunHistoryTable }        from './RunHistoryTable'

export function AnalyticsPageContent() {
  const [period, setPeriod] = useState<Period>('30d')

  const { data, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: ['analytics', period],
    queryFn:  () => getAnalytics(period),
    staleTime: 5 * 60_000,  // 5 minutes — analytics data doesn't change second-by-second
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-violet-400" />
            Analytics
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Token usage, costs, and pipeline run history
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* KPI row */}
        <SummaryKPIs summary={data?.summary} loading={isLoading} />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TokenUsageChart dailyUsage={data?.daily_usage ?? []} loading={isLoading} />
          <CostChart       dailyUsage={data?.daily_usage ?? []} loading={isLoading} />
        </div>

        {/* Breakdowns row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ModelBreakdownTable    models={data?.model_breakdown    ?? []} loading={isLoading} />
          <PipelineBreakdownTable pipelines={data?.pipeline_breakdown ?? []} loading={isLoading} />
        </div>

        {/* Run history */}
        <RunHistoryTable period={period} />
      </div>
    </div>
  )
}
