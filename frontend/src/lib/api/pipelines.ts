import { apiFetch } from './api'

export type PipelineStatus = 'active' | 'draft'

export interface Pipeline {
  id: string
  name: string
  description: string | null
  status: PipelineStatus
  model: string          // e.g. "anthropic/claude-sonnet-4-6"
  run_count: number
  canvas_state: {
    nodes: unknown[]
    edges: unknown[]
    viewport: { x: number; y: number; zoom: number }
  }
  pipeline_config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface PipelinesListParams {
  page?: number
  limit?: number
  status?: PipelineStatus | ''
  sort?: 'updated_at' | 'created_at' | 'name' | 'run_count'
  search?: string
}

export interface PipelinesListResponse {
  items: Pipeline[]
  total: number
  page: number
  limit: number
}

export interface RunPipelineResponse {
  run_id: string
}

export const listPipelines = (params: PipelinesListParams = {}): Promise<PipelinesListResponse> => {
  const q = new URLSearchParams()
  if (params.page)   q.set('page',   String(params.page))
  if (params.limit)  q.set('limit',  String(params.limit))
  if (params.status) q.set('status', params.status)
  if (params.sort)   q.set('sort',   params.sort)
  if (params.search) q.set('search', params.search)
  return apiFetch(`/api/v1/pipelines?${q}`)
}

export const getPipeline = (id: string): Promise<Pipeline> =>
  apiFetch(`/api/v1/pipelines/${id}`)

export const createPipeline = (body: {
  name: string
  description?: string
  canvas_state?: object
  pipeline_config?: object
}): Promise<Pipeline> =>
  apiFetch('/api/v1/pipelines', { method: 'POST', body: JSON.stringify(body) })

export const updatePipeline = (id: string, body: Partial<Pick<Pipeline, 'name' | 'description' | 'status' | 'canvas_state' | 'pipeline_config'>>): Promise<Pipeline> =>
  apiFetch(`/api/v1/pipelines/${id}`, { method: 'PUT', body: JSON.stringify(body) })

export const patchPipeline = (id: string, body: Partial<Pick<Pipeline, 'status' | 'canvas_state' | 'pipeline_config'>>): Promise<Pipeline> =>
  apiFetch(`/api/v1/pipelines/${id}`, { method: 'PATCH', body: JSON.stringify(body) })

export const deletePipeline = (id: string): Promise<void> =>
  apiFetch(`/api/v1/pipelines/${id}`, { method: 'DELETE' })

export const duplicatePipeline = (id: string): Promise<Pipeline> =>
  apiFetch(`/api/v1/pipelines/${id}/duplicate`, { method: 'POST' })

export const runPipeline = (id: string, message: string, modelOverride?: string): Promise<RunPipelineResponse> =>
  apiFetch(`/api/v1/pipelines/${id}/run`, {
    method: 'POST',
    body: JSON.stringify({ message, model_override: modelOverride ?? null }),
  })

/** Derives a short model label for display: "claude-sonnet-4.6" from "anthropic/claude-sonnet-4-6" */
export function modelShortname(model: string): string {
  return model.split('/').pop()?.replace(/-/g, '.') ?? model
}
