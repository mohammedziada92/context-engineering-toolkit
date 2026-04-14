import { apiFetch, getAuthHeader } from './api'

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL

// ── Session CRUD ─────────────────────────────────────────────
export async function listSessions() {
  return apiFetch('/api/v1/playground/sessions?limit=20')
}

export async function getSession(id: string) {
  return apiFetch(`/api/v1/playground/sessions/${id}`)
}

export async function createSession(payload: {
  mode: 'direct' | 'pipeline'
  pipeline_id?: string | null
  config: Record<string, unknown>
  name?: string
}) {
  return apiFetch('/api/v1/playground/sessions', { method: 'POST', body: JSON.stringify(payload) })
}

export async function updateSession(id: string, patch: Record<string, unknown>) {
  return apiFetch(`/api/v1/playground/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export async function deleteSession(id: string) {
  return apiFetch(`/api/v1/playground/sessions/${id}`, { method: 'DELETE' })
}

export async function deleteAllSessions() {
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
  model: string
  system_prompt: string
  temperature: number
  max_tokens: number
  top_p: number
  knowledge_source_id?: string | null
  top_k?: number
  threshold?: number
}) {
  return apiFetch('/api/v1/pipelines', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
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
  const nodes = [
    { id: 'user-msg', type: 'userMessage', position: { x: 80, y: 200 }, data: {} },
    { id: 'sys-prompt', type: 'systemPrompt', position: { x: 80, y: 80 }, data: { content: cfg.system_prompt } },
    { id: 'llm', type: 'llmModel', position: { x: 480, y: 160 }, data: { model: cfg.model } },
    { id: 'output', type: 'output', position: { x: 720, y: 160 }, data: { format: 'markdown' } },
  ]
  const edges = [
    { id: 'e1', source: 'user-msg', target: 'llm', animated: true },
    { id: 'e2', source: 'sys-prompt', target: 'llm', animated: true },
    { id: 'e3', source: 'llm', target: 'output', animated: true },
  ]
  if (cfg.knowledge_source_id) {
    nodes.push({
      id: 'rag',
      type: 'vectorSearch',
      position: { x: 280, y: 200 },
      data: {
        knowledge_source_id: cfg.knowledge_source_id,
        top_k: cfg.top_k ?? 5,
        threshold: cfg.threshold ?? 0.70,
      },
    })
    edges.push(
      { id: 'e4', source: 'user-msg', target: 'rag', animated: true },
      { id: 'e5', source: 'rag', target: 'llm', animated: true },
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
      const m = msg.metadata
      const parts: string[] = []
      if (m.tokens_in) parts.push(`${m.tokens_in} in`)
      if (m.tokens_out) parts.push(`${m.tokens_out} out`)
      if (m.cost_usd) parts.push(`$${m.cost_usd.toFixed(4)}`)
      if (m.latency_ms) parts.push(`${(m.latency_ms / 1000).toFixed(2)}s`)
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
