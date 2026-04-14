'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { DateRangeSelector } from './DateRangeSelector'
import { AnalyticsFilters } from './AnalyticsFilters'
import { KPICard } from './KPICard'
import { TokenUsageChart } from './TokenUsageChart'
import { CostChart } from './CostChart'
import { CostByModelChart } from './CostByModelChart'
import { RunsByPipelineChart } from './RunsByPipelineChart'
import { LatencyHistogram } from './LatencyHistogram'
import { RunHistoryTable } from './RunHistoryTable'
import { getSummary, exportAnalytics } from '@/lib/api/analytics'
import { Button } from '@/components/ui/button'
import { Download, Activity, Coins, Zap, Clock, TrendingDown } from 'lucide-react'
import { useState } from 'react'

export function AnalyticsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [exporting, setExporting] = useState(false)

  const range = searchParams.get('range') ?? '7d'
  const pipelineId = searchParams.get('pipeline') ?? undefined
  const modelId = searchParams.get('model') ?? undefined
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined

  function setFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/analytics?${params.toString()}`)
  }

  function clearFilters() {
    router.push(`/analytics?range=${range}`)
  }

  const hasActiveFilters = !!(pipelineId || modelId)

  const filters = { range, pipeline_id: pipelineId, model_id: modelId, from, to }

  const { data: summary } = useQuery({
    queryKey: ['analytics-summary', filters],
    queryFn: () => getSummary(filters),
    staleTime: 2 * 60 * 1000,
  })

  async function handleExport(format: 'csv' | 'pdf') {
    setExporting(true)
    try {
      await exportAnalytics({ ...filters, format })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="px-6 py-8 space-y-6">

      {/* ── Top bar ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">Analytics</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangeSelector range={range} from={from} to={to} onChange={setFilter} />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-300 hover:text-zinc-100 gap-1.5 h-8 text-xs"
              onClick={() => handleExport('csv')}
              disabled={exporting}
            >
              <Download className="h-3 w-3" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-300 hover:text-zinc-100 gap-1.5 h-8 text-xs"
              onClick={() => handleExport('pdf')}
              disabled={exporting}
            >
              <Download className="h-3 w-3" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────── */}
      <AnalyticsFilters
        pipelineId={pipelineId}
        modelId={modelId}
        hasActiveFilters={hasActiveFilters}
        onSetFilter={setFilter}
        onClearFilters={clearFilters}
      />

      {/* ── KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KPICard
          label="Total Runs"
          value={summary?.total_runs ?? 0}
          delta={summary?.runs_delta}
          icon={Activity}
          deltaPositiveIsGood={true}
          format="number"
        />
        <KPICard
          label="Total Tokens"
          value={summary?.total_tokens ?? 0}
          delta={summary?.tokens_delta}
          icon={Zap}
          deltaPositiveIsGood={true}
          format="tokens"
        />
        <KPICard
          label="Total Cost"
          value={summary?.total_cost ?? 0}
          delta={summary?.cost_delta}
          icon={Coins}
          deltaPositiveIsGood={false}
          format="currency"
        />
        <KPICard
          label="Avg Latency"
          value={summary?.avg_latency_ms ?? 0}
          delta={summary?.latency_delta}
          icon={Clock}
          deltaPositiveIsGood={false}
          format="latency"
        />
        <KPICard
          label="Avg Cost / Run"
          value={summary?.avg_cost_per_run ?? 0}
          delta={summary?.cost_per_run_delta}
          icon={TrendingDown}
          deltaPositiveIsGood={false}
          format="currency"
        />
      </div>

      {/* ── Row 1: Token Usage (full width) ─────────────── */}
      <TokenUsageChart filters={filters} />

      {/* ── Row 2: Cost Area ────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CostChart filters={filters} />
      </div>

      {/* ── Row 3: Cost by Model Donut + Runs by Pipeline ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CostByModelChart
          filters={filters}
          activeModel={modelId}
          onModelClick={(id) => setFilter('model', id === modelId ? null : id)}
        />
        <RunsByPipelineChart
          filters={filters}
          activePipeline={pipelineId}
          onPipelineClick={(id) => setFilter('pipeline', id === pipelineId ? null : id)}
        />
      </div>

      {/* ── Row 4: Latency Histogram (full width) ─────────── */}
      <LatencyHistogram filters={filters} />

      {/* ── Row 5: Run History Table (full width) ─────────── */}
      <RunHistoryTable filters={filters} />

    </div>
  )
}
