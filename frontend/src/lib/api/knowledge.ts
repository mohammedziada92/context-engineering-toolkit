import { apiFetch } from './api'

export type KnowledgeSourceStatus = 'pending' | 'processing' | 'ready' | 'error'

export interface KnowledgeSource {
  id: string
  name: string
  description: string | null
  status: KnowledgeSourceStatus
  chunk_count: number
  document_count: number
  embedding_model: string
  created_at: string
  updated_at: string
}

export interface Chunk {
  id: string
  knowledge_source_id: string
  content: string
  metadata: Record<string, unknown>
  token_count: number
  similarity?: number   // present in search results
  created_at: string
}

export interface KnowledgeSourcesParams {
  page?: number
  limit?: number
  status?: KnowledgeSourceStatus | ''
  search?: string
}

export interface KnowledgeSourcesResponse {
  items: KnowledgeSource[]
  total: number
  page: number
  limit: number
}

export interface ChunksResponse {
  items: Chunk[]
  total: number
  page: number
  limit: number
}

export interface SearchResponse {
  results: Chunk[]
  query_tokens: number
  latency_ms: number
}

export interface IngestResponse {
  job_id: string
  status: 'queued'
}

// ── Sources CRUD ─────────────────────────────────────────────────────────────

export const listKnowledgeSources = (
  params: KnowledgeSourcesParams = {}
): Promise<KnowledgeSourcesResponse> => {
  const q = new URLSearchParams()
  if (params.page)   q.set('page',   String(params.page))
  if (params.limit)  q.set('limit',  String(params.limit))
  if (params.status) q.set('status', params.status)
  if (params.search) q.set('search', params.search)
  return apiFetch(`/api/v1/knowledge?${q}`)
}

// Backward-compat flat export used by ConfigPanel (returns all ready sources)
export const getKnowledgeSources = (): Promise<KnowledgeSource[]> =>
  listKnowledgeSources({ status: 'ready', limit: 100 }).then((r) => r.items)

export const getKnowledgeSource = (id: string): Promise<KnowledgeSource> =>
  apiFetch(`/api/v1/knowledge/${id}`)

export const createKnowledgeSource = (body: {
  name: string
  description?: string
  embedding_model?: string
}): Promise<KnowledgeSource> =>
  apiFetch('/api/v1/knowledge', { method: 'POST', body: JSON.stringify(body) })

export const updateKnowledgeSource = (
  id: string,
  body: Partial<Pick<KnowledgeSource, 'name' | 'description'>>
): Promise<KnowledgeSource> =>
  apiFetch(`/api/v1/knowledge/${id}`, { method: 'PUT', body: JSON.stringify(body) })

export const deleteKnowledgeSource = (id: string): Promise<void> =>
  apiFetch(`/api/v1/knowledge/${id}`, { method: 'DELETE' })

// ── Ingestion ─────────────────────────────────────────────────────────────────

export const ingestText = (
  id: string,
  body: { title: string; content: string; metadata?: Record<string, unknown> }
): Promise<IngestResponse> =>
  apiFetch(`/api/v1/knowledge/${id}/ingest/text`, {
    method: 'POST',
    body:   JSON.stringify(body),
  })

export const ingestFile = (id: string, file: File): Promise<IngestResponse> => {
  const fd = new FormData()
  fd.append('file', file)
  return apiFetch(`/api/v1/knowledge/${id}/ingest/file`, {
    method: 'POST',
    body:   fd,
    // No Content-Type header — browser sets multipart boundary automatically
  })
}

export const ingestUrl = (
  id: string,
  body: { url: string; metadata?: Record<string, unknown> }
): Promise<IngestResponse> =>
  apiFetch(`/api/v1/knowledge/${id}/ingest/url`, {
    method: 'POST',
    body:   JSON.stringify(body),
  })

// ── Chunks ───────────────────────────────────────────────────────────────────

export const listChunks = (
  id: string,
  params: { page?: number; limit?: number } = {}
): Promise<ChunksResponse> => {
  const q = new URLSearchParams()
  if (params.page)  q.set('page',  String(params.page))
  if (params.limit) q.set('limit', String(params.limit))
  return apiFetch(`/api/v1/knowledge/${id}/chunks?${q}`)
}

export const deleteChunk = (id: string, chunkId: string): Promise<void> =>
  apiFetch(`/api/v1/knowledge/${id}/chunks/${chunkId}`, { method: 'DELETE' })

// ── Semantic search ───────────────────────────────────────────────────────────

export const searchChunks = (
  id: string,
  body: { query: string; top_k?: number; threshold?: number }
): Promise<SearchResponse> =>
  apiFetch(`/api/v1/knowledge/${id}/search`, {
    method: 'POST',
    body:   JSON.stringify(body),
  })
