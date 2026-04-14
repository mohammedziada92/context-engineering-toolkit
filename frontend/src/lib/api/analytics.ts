import { apiFetch, getAuthHeader } from "@/lib/api/api";

// ── Types ────────────────────────────────────────────────

export interface AnalyticsFilters {
  range?: string;
  pipeline_id?: string;
  model_id?: string;
  from?: string;
  to?: string;
  format?: "csv" | "pdf";
}

export interface SummaryResponse {
  total_runs: number;
  total_tokens: number;
  total_cost: number;
  avg_latency_ms: number;
  avg_cost_per_run: number;
  runs_delta?: number;
  tokens_delta?: number;
  cost_delta?: number;
  latency_delta?: number;
  cost_per_run_delta?: number;
}

export interface TokenUsageEntry {
  date: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface CostEntry {
  date: string;
  model_used: string;
  cost_usd: number;
}

export interface CostByModelEntry {
  model_used: string;
  total_cost: number;
  run_count: number;
}

export interface RunsByPipelineEntry {
  pipeline_id: string;
  pipeline_name: string;
  run_count: number;
  total_cost: number;
}

export interface LatencyDistributionBucket {
  bucket: string;
  runs: number;
  pct: number;
}

export interface LatencyDistributionStats {
  median: number;
  p95: number;
  p99: number;
}

export interface LatencyDistributionResponse {
  buckets: LatencyDistributionBucket[];
  stats: LatencyDistributionStats;
}

export interface RunEntry {
  id: string;
  pipeline_id: string | null;
  pipeline_name: string | null;
  user_message: string;
  model_used: string;
  status: string;
  total_tokens: number;
  cost_usd: number;
  latency_ms: number;
  created_at: string;
}

export interface RunsResponse {
  runs: RunEntry[];
  total: number;
  page: number;
  page_size: number;
}

// ── Helper ───────────────────────────────────────────────

function buildParams(filters: AnalyticsFilters): string {
  const p = new URLSearchParams();
  if (filters.range && filters.range !== "custom") p.set("range", filters.range);
  if (filters.from) p.set("from", filters.from);
  if (filters.to) p.set("to", filters.to);
  if (filters.pipeline_id) p.set("pipeline_id", filters.pipeline_id);
  if (filters.model_id) p.set("model_id", filters.model_id);
  return p.toString();
}

// ── API calls ────────────────────────────────────────────

export async function getSummary(filters: AnalyticsFilters = {}) {
  return apiFetch(`/api/v1/analytics/summary?${buildParams(filters)}`);
}

export function getTokenUsage(filters: AnalyticsFilters = {}) {
  return apiFetch<TokenUsageEntry[]>(
    `/api/v1/analytics/token-usage?${buildParams(filters)}`
  );
}

export function getCost(filters: AnalyticsFilters = {}) {
  return apiFetch<CostEntry[]>(
    `/api/v1/analytics/cost?${buildParams(filters)}`
  );
}

export async function getCostByModel(filters: AnalyticsFilters = {}) {
  return apiFetch(`/api/v1/analytics/cost-by-model?${buildParams(filters)}`);
}

export async function getRunsByPipeline(filters: AnalyticsFilters = {}) {
  return apiFetch(`/api/v1/analytics/runs-by-pipeline?${buildParams(filters)}`);
}

export async function getLatencyDistribution(filters: AnalyticsFilters = {}) {
  return apiFetch(`/api/v1/analytics/latency-distribution?${buildParams(filters)}`);
}

export function getRuns(
  page: number = 1,
  pageSize: number = 20,
  filters: AnalyticsFilters = {}
) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (filters.pipeline_id) params.set("pipeline_id", filters.pipeline_id);
  if (filters.model_id) params.set("model_id", filters.model_id);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  return apiFetch<RunsResponse>(`/api/v1/analytics/runs?${params}`);
}

// ── Export (triggers browser download) ───────────────────

export async function exportAnalytics(
  filters: AnalyticsFilters & { format: "csv" | "pdf" }
) {
  const headers = await getAuthHeader();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/analytics/export?${buildParams(filters)}&format=${filters.format}`,
    { headers }
  );
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cet-analytics-${filters.range ?? "custom"}-${new Date().toISOString().split("T")[0]}.${filters.format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
