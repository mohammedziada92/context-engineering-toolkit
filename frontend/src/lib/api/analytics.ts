import { apiFetch } from './api'

export interface RunRecord {
  id: string
  pipeline_id: string
  pipeline_name: string
  model: string
  status: 'success' | 'error' | 'cancelled'
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cost_usd: number
  latency_ms: number
  created_at: string
}

export interface DailyUsage {
  date: string           // ISO date "2026-04-01"
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cost_usd: number
  run_count: number
}

export interface ModelBreakdown {
  model: string
  run_count: number
  total_tokens: number
  cost_usd: number
  avg_latency_ms: number
  error_rate: number     // 0.0 – 1.0
}

export interface PipelineBreakdown {
  pipeline_id: string
  pipeline_name: string
  run_count: number
  total_tokens: number
  cost_usd: number
  success_rate: number   // 0.0 – 1.0
  avg_latency_ms: number
}

export interface AnalyticsSummary {
  total_runs: number
  success_runs: number
  error_runs: number
  total_tokens: number
  total_cost_usd: number
  avg_latency_ms: number
  period_start: string
  period_end: string
}

export interface AnalyticsResponse {
  summary:            AnalyticsSummary
  daily_usage:        DailyUsage[]
  model_breakdown:    ModelBreakdown[]
  pipeline_breakdown: PipelineBreakdown[]
}

export interface RunsParams {
  page?:        number
  limit?:       number
  pipeline_id?: string
  model?:       string
  status?:      'success' | 'error' | 'cancelled' | ''
  period?:      '7d' | '30d' | '90d'
}

export interface RunsResponse {
  items: RunRecord[]
  total: number
  page:  number
  limit: number
}

export const getAnalytics = (period: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsResponse> =>
  apiFetch(`/api/v1/analytics?period=${period}`)

export const getRuns = (params: RunsParams = {}): Promise<RunsResponse> => {
  const q = new URLSearchParams()
  if (params.page)        q.set('page',        String(params.page))
  if (params.limit)       q.set('limit',       String(params.limit))
  if (params.pipeline_id) q.set('pipeline_id', params.pipeline_id)
  if (params.model)       q.set('model',       params.model)
  if (params.status)      q.set('status',      params.status)
  if (params.period)      q.set('period',      params.period)
  return apiFetch(`/api/v1/analytics/runs?${q}`)
}

/** Format USD cost with appropriate precision */
export function formatCost(usd: number): string {
  if (usd === 0)     return '$0.00'
  if (usd < 0.001)   return `$${(usd * 1000).toFixed(3)}m` // sub-cent: show millicents
  if (usd < 0.01)    return `$${usd.toFixed(4)}`
  if (usd < 1)       return `$${usd.toFixed(3)}`
  return `$${usd.toFixed(2)}`
}

/** Format token count with K/M suffix */
export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

/** Format latency: ms under 1s, seconds above */
export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
