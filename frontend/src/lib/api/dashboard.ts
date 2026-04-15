import { apiFetch } from './api'
import type { Pipeline } from './pipelines'
import type { KnowledgeSource } from './knowledge'
import type { RunRecord } from './analytics'

export interface DashboardStats {
  pipeline_count:       number
  knowledge_source_count: number
  total_runs_today:     number
  total_cost_today_usd: number
  total_tokens_today:   number
  active_pipelines:     number
}

export interface DashboardData {
  stats:               DashboardStats
  recent_runs:         RunRecord[]        // last 5 runs across all pipelines
  recent_pipelines:    Pipeline[]         // last 3 updated pipelines
  recent_sources:      KnowledgeSource[]  // last 3 updated knowledge sources
}

export const getDashboard = (): Promise<DashboardData> =>
  apiFetch('/api/v1/dashboard')
