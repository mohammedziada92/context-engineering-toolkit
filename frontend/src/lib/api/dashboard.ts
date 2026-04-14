import { apiFetch } from './api'

export interface DashboardStats {
  pipelines: { count: number; delta: number }
  knowledge_sources: { count: number; delta: number }
  runs_today: { count: number; delta: number }
  tokens_today: { total: number; delta_pct: number }
  cost_today: { usd: number; delta_pct: number }
  onboarding_complete: boolean
  pipeline_count: number
  run_count: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch('/api/v1/dashboard/stats')
}
