import { apiFetch, getAuthHeader } from './api'
import type { Pipeline } from './pipelines'

const BASE = process.env.NEXT_PUBLIC_API_URL

// ── Types ─────────────────────────────────────────────────────

export interface Session {
  id: string
  name: string
  mode: 'direct' | 'pipeline'
  pipeline_id: string | null
  config: Record<string, unknown>
  message_count: number
  created_at: string
  updated_at: string
  messages?: SessionMessage[]
  total_tokens?: number
  total_cost?: number
}

export interface SessionMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  model?: string
  retrieved_chunks?: unknown[]
  metadata?: Record<string, unknown>
  created_at?: string
}

// ── Session CRUD ─────────────────────────────────────────────

export async function listSessions(): Promise<Session[]> {
  return apiFetch('/api/v1/playground/sessions?limit=20')
}

/** Alias used by playground page */
export const getSessions = listSessions

export async function getSession(id: string): Promise<Session> {
  return apiFetch(`/api/v1/playground/sessions/${id}`)
}

export async function getMessages(sessionId: string): Promise<SessionMessage[]> {
  return apiFetch(`/api/v1/playground/sessions/${sessionId}/messages`)
}

export async function addMessage(sessionId: string, role: 'user' | 'assistant', content: string): Promise<SessionMessage> {
  return apiFetch(`/api/v1/playground/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ role, content }),
  })
}

export async function createSession(payload?: {
  mode?: 'direct' | 'pipeline'
  pipeline_id?: string | null
  config?: Record<string, unknown>
  name?: string
}): Promise<Session> {
  const body = payload ?? { mode: 'direct', config: {} }
  return apiFetch('/api/v1/playground/sessions', { method: 'POST', body: JSON.stringify(body) })
}

export async function updateSession(id: string, patch: Record<string, unknown>): Promise<Session> {
  return apiFetch(`/api/v1/playground/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export async function deleteSession(id: string): Promise<void> {
  return apiFetch(`/api/v1/playground/sessions/${id}`, { method: 'DELETE' })
}

export async function deleteAllSessions(): Promise<void> {
  return apiFetch('/api/v1/playground/sessions', { method: 'DELETE' })
}

// ── Streaming chat ────────────────────────────────────────────
export interface ChatPayload {
  session_id: string
  message: string
  mode: 'direct' | 'pipeline'
  pipeline_id?: string | null
  model?: string
  system_prompt?: string
  temperature?: number
  max_tokens?: number
  top_p?: number
  stream?: boolean
  knowledge_source_id?: string | null
  top_k?: number
  threshold?: number
}

export async function postChatStream(payload: ChatPayload, signal?: AbortSignal): Promise<Response> {
  const headers = await getAuthHeader()
  return fetch(`${BASE}/api/v1/playground/chat`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
}

// ── Save as Pipeline ─────────────────────────────────────────
export async function saveAsPipeline(payload: {
  name: string
  description?: string
  model: string
  system_prompt: string
  temperature: number
  max_tokens: number
  top_p: number
  knowledge_source_id?: string | null
  top_k?: number
  threshold?: number
}): Promise<Pipeline> {
  return apiFetch('/api/v1/pipelines', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
      pipeline_config: {
        model: payload.model,
        system_prompt: payload.system_prompt,
        temperature: payload.temperature,
        max_tokens: payload.max_tokens,
        top_p: payload.top_p,
        knowledge_source_id: payload.knowledge_source_id ?? null,
        top_k: payload.top_k ?? 5,
        threshold: payload.threshold ?? 0.70,
      },
      canvas_state: buildCanvasFromConfig(payload),
      status: 'draft',
    }),
  })
}

function buildCanvasFromConfig(cfg: {
  model: string
  system_prompt: string
  knowledge_source_id?: string | null
  top_k?: number
  threshold?: number
}) {
  const nodes: Array<{ id: string; type: string; position: { x: number; y: number }; data: Record<string, unknown> }> = [
    { id: 'sys-prompt', type: 'systemPrompt', position: { x: 80, y: 80 }, data: { content: cfg.system_prompt, type: 'systemPrompt', max_tokens: 500 } },
    { id: 'llm', type: 'llm', position: { x: 480, y: 160 }, data: { model: cfg.model, type: 'llm', temperature: 0.7, max_output_tokens: 2048, stream: true } },
    { id: 'output', type: 'output', position: { x: 720, y: 160 }, data: { format: 'markdown', type: 'output' } },
  ]
  const edges = [
    { id: 'e1', source: 'sys-prompt', target: 'llm', animated: true },
    { id: 'e2', source: 'llm', target: 'output', animated: true },
  ]
  if (cfg.knowledge_source_id) {
    nodes.push({
      id: 'rag',
      type: 'rag',
      position: { x: 280, y: 200 },
      data: {
        type: 'rag',
        knowledge_source_id: cfg.knowledge_source_id,
        top_k: cfg.top_k ?? 5,
        similarity_threshold: cfg.threshold ?? 0.70,
        max_tokens: 1500,
      },
    })
    edges.push(
      { id: 'e3', source: 'rag', target: 'llm', animated: true },
    )
  }
  return { nodes, edges, viewport: { x: 0, y: 0, zoom: 1 } }
}

// ── Export ────────────────────────────────────────────────────
export function exportAsMarkdown(session: SessionExport): string {
  const date = new Date(session.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
  const lines = [
    `# Playground Session — ${date}`,
    `**Model:** ${session.config.model ?? '—'}`,
    `**Tokens:** ${session.total_tokens.toLocaleString()}`,
    `**Cost:** $${session.total_cost.toFixed(4)}`,
    '',
    '---',
    '',
  ]
  for (const msg of session.messages) {
    lines.push(`**${msg.role === 'user' ? 'User' : 'Assistant'}**`)
    lines.push('')
    lines.push(msg.content)
    if (msg.metadata) {
      const m = msg.metadata as Record<string, number | string | undefined>
      const parts: string[] = []
      if (m.tokens_in) parts.push(`${m.tokens_in} in`)
      if (m.tokens_out) parts.push(`${m.tokens_out} out`)
      if (m.cost_usd) parts.push(`$${(m.cost_usd as number).toFixed(4)}`)
      if (m.latency_ms) parts.push(`${((m.latency_ms as number) / 1000).toFixed(2)}s`)
      if (parts.length) lines.push(``, `*${parts.join(' · ')}*`)
    }
    lines.push('', '---', '')
  }
  return lines.join('\n')
}

export interface SessionExport {
  created_at: string
  config: Record<string, unknown>
  total_tokens: number
  total_cost: number
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    metadata?: Record<string, unknown>
    retrieved_chunks?: Array<{ score: number; content: string; chunk_index: number; metadata: Record<string, unknown> }>
  }>
}
