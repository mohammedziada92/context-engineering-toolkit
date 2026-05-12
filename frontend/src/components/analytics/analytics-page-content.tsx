'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { getAnalytics, getRuns, type AnalyticsResponse, type Period } from '@/lib/api/analytics'
import { PeriodSelector }     from './PeriodSelector'
import { SummaryKPIs }        from './SummaryKPIs'
import { TokenUsageChart }    from './TokenUsageChart'
import { CostChart }          from './CostChart'
import { ModelBreakdownTable }    from './ModelBreakdownTable'
import { PipelineBreakdownTable } from './PipelineBreakdownTable'
import { RunHistoryTable }        from './RunHistoryTable'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AnalyticsPageContent() {
  const [period, setPeriod] = useState<Period>('30d')

  const { data, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: ['analytics', period],
    queryFn:  () => getAnalytics(period),
    staleTime: 5 * 60_000,
  })

  const handleExportCSV = useCallback(async () => {
    try {
      const res = await getRuns({ period, limit: 100 })
      const rows = res.items
      if (rows.length === 0) { toast.error('No runs to export'); return }
      const header = 'Pipeline,Model,Status,Input Tokens,Output Tokens,Total Tokens,Cost (USD),Latency (ms),Time'
      const lines = rows.map((r) =>
        [
          `"${(r.pipeline_name ?? '').replace(/"/g, '""')}"`,
          r.model,
          r.status,
          r.input_tokens,
          r.output_tokens,
          r.total_tokens,
          r.cost_usd.toFixed(4),
          r.latency_ms,
          new Date(r.created_at).toISOString(),
        ].join(',')
      )
      const csv = [header, ...lines].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${rows.length} runs to CSV`)
    } catch {
      toast.error('Failed to export CSV')
    }
  }, [period])

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
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
        <div className="flex items-center gap-2">
          <PeriodSelector value={period} onChange={setPeriod} />
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-center gap-1.5 h-7 px-3 rounded-md border border-zinc-700 bg-transparent text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-900 border-zinc-800" align="end">
              <DropdownMenuItem
                className="text-xs text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100"
                onClick={handleExportCSV}
              >
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100"
                onClick={() => toast.info('PDF export coming soon')}
              >
                Download PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
