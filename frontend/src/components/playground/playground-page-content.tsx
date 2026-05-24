'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  postChatStream,
  createSession,
  getSession,
  deleteSession,
  updateSession,
  type ChatPayload,
  type SessionExport,
  type Session,
  exportAsMarkdown,
} from '@/lib/api/playground'
import { getPipeline, type Pipeline } from '@/lib/api/pipelines'
import { PipelineModeToggle } from './PipelineModeToggle'
import { ThinkingLoader } from './ThinkingLoader'
import { KBAttachmentPanel } from './KBAttachmentPanel'
import { RAGContextInspector } from './RAGContextInspector'
import { SaveAsPipelineModal } from './SaveAsPipelineModal'
import { ExportChatMenu } from './ExportChatMenu'
import { ModelSelector } from '@/components/shared/ModelSelector'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  ArrowUp, Square, Trash2, Sparkles, Layers,
  MessageSquare, Plus, ChevronDown, ChevronRight,
  AlertTriangle, ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────
type Mode = 'direct' | 'pipeline'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  meta?: { tokens_in: number; tokens_out: number; cost_usd: number; latency_ms: number }
  retrieved_chunks?: Array<{ score: number; content: string; chunk_index: number; metadata: Record<string, unknown> }>
  error_code?: string | null
  pipeline_id?: string | null
}

interface Config {
  mode: Mode
  pipeline_id: string | null
  model: string
  system_prompt: string
  temperature: number
  max_tokens: number
  top_p: number
  stream: boolean
  knowledge_source_id: string | null
  top_k: number
  threshold: number
}

const DEFAULT_CONFIG: Config = {
  mode: 'direct',
  pipeline_id: null,
  model: 'anthropic/claude-sonnet-4-6',
  system_prompt: 'You are a helpful assistant.',
  temperature: 0.7,
  max_tokens: 2048,
  top_p: 1.0,
  stream: true,
  knowledge_source_id: null,
  top_k: 5,
  threshold: 0.50,
}

const QUICK_STARTS = [
  'What is RAG?',
  'Summarize a document',
  'Write a Python function',
]

function approxTokens(text: string) { return Math.ceil(text.length / 4) }

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Parse pipeline canvas nodes into keyed categories ──────
function parseCanvasNodes(pipeline: Pipeline) {
  const nodes = (pipeline.canvas_state as { nodes?: { type: string; data?: Record<string, unknown> }[] })?.nodes ?? []
  const parsed: Record<string, Record<string, unknown>> = {}
  for (const n of nodes) {
    const cat = n.type === 'vectorSearch' ? 'rag' : n.type === 'systemPrompt' ? 'system_prompt' : n.type === 'knowledgeSource' ? 'knowledge_source' : n.type === 'chatHistory' ? 'chat_history' : n.type
    if (cat) parsed[cat] = n.data ?? {}
  }
  return parsed
}

// ── Component ────────────────────────────────────────────────
export function PlaygroundPageContent() {
  const qc = useQueryClient()
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [paramsOpen, setParamsOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const creatingSessionRef = useRef(false)
  const renamedRef = useRef(false)
  const baseTokensRef = useRef(0)
  const baseCostRef = useRef(0)

  const { data: sessions } = useQuery<Session[]>({
    queryKey: ['playground-sessions'],
    queryFn: () => import('@/lib/api/playground').then((m) => m.listSessions()),
    staleTime: 30_000,
  })

  // Fetch selected pipeline details for read-only Settings summary
  const { data: selectedPipeline } = useQuery<Pipeline>({
    queryKey: ['pipeline', config.pipeline_id],
    queryFn: () => getPipeline(config.pipeline_id!),
    enabled: config.mode === 'pipeline' && !!config.pipeline_id,
    staleTime: 60_000,
  })

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function patchConfig(patch: Partial<Config>) {
    setConfig((c) => ({ ...c, ...patch }))
  }

  // ── Session operations ─────────────────────────────────────
  async function loadSession(id: string) {
    const s = await getSession(id)
    setSessionId(s.id)
    renamedRef.current = (s.messages?.length ?? 0) > 0
    baseTokensRef.current = s.total_tokens ?? 0
    baseCostRef.current = s.total_cost ?? 0
    setMessages(
      (s.messages ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        retrieved_chunks: (m.retrieved_chunks as Message['retrieved_chunks']) ?? undefined,
      }))
    )
    patchConfig({ ...DEFAULT_CONFIG, mode: s.mode, pipeline_id: s.pipeline_id, ...s.config as Partial<Config> })
  }

  function clearChat() {
    setMessages([])
    setSessionId(null)
    setConfig(DEFAULT_CONFIG)
    renamedRef.current = false
    baseTokensRef.current = 0
    baseCostRef.current = 0
  }

  async function handleDeleteSession(id: string) {
    // Optimistic: remove from cache immediately
    qc.setQueryData<Session[]>(['playground-sessions'], (old) =>
      old ? old.filter((s) => s.id !== id) : old
    )
    if (sessionId === id) clearChat()
    try {
      await deleteSession(id)
    } catch {
      // Rollback on failure
      qc.invalidateQueries({ queryKey: ['playground-sessions'] })
    }
  }

  // ── Send message ───────────────────────────────────────────
  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content || streaming) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content }
    const assistantId = crypto.randomUUID()

    // Show user message immediately, assistant bubble only when stream starts
    setMessages((m) => [...m, userMsg])
    setStreaming(true)

    let sid = sessionId
    if (!sid) {
      if (creatingSessionRef.current) {
        setMessages((m) => m.filter((msg) => msg.id !== userMsg.id))
        setStreaming(false)
        return
      }
      creatingSessionRef.current = true
      try {
        const session = await createSession({
          mode: config.mode,
          pipeline_id: config.pipeline_id,
          config: {
            model: config.model,
            system_prompt: config.system_prompt,
            temperature: config.temperature,
            max_tokens: config.max_tokens,
            top_p: config.top_p,
            stream: config.stream,
            knowledge_source_id: config.knowledge_source_id,
            top_k: config.top_k,
            threshold: config.threshold,
          },
        })
        sid = session.id
        setSessionId(sid)
        qc.invalidateQueries({ queryKey: ['playground-sessions'] })
      } catch {
        setMessages((m) => [...m, { id: assistantId, role: 'assistant', content: '*Error: Failed to create session.*', streaming: false }])
        setStreaming(false)
        return
      } finally {
        creatingSessionRef.current = false
      }
    }

    // Add assistant placeholder right before stream begins
    setMessages((m) => [...m, { id: assistantId, role: 'assistant', content: '', streaming: true }])

    const payload: ChatPayload = {
      session_id: sid!,
      message: content,
      mode: config.mode,
      pipeline_id: config.pipeline_id,
      model: config.model,
      system_prompt: config.system_prompt,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      top_p: config.top_p,
      stream: config.stream,
      knowledge_source_id: config.knowledge_source_id,
      top_k: config.top_k,
      threshold: config.threshold,
    }

    abortRef.current = new AbortController()
    let retrievedChunks: Message['retrieved_chunks']
    let finalMeta: Message['meta']
    let warningReceived = false
    const startTime = Date.now()

    try {
      const res = await postChatStream(payload, abortRef.current.signal)
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = JSON.parse(line.slice(6))

          if (data.status === 'warning' && data.error_code === 'no_knowledge_base') {
            warningReceived = true
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: '', streaming: false, error_code: data.error_code, pipeline_id: data.pipeline_id ?? null }
                  : msg
              )
            )
            break
          } else if (data.content !== undefined && !data.status) {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantId ? { ...msg, content: msg.content + data.content } : msg
              )
            )
          } else if (data.chunks) {
            retrievedChunks = data.chunks
          } else if (data.status === 'done') {
            const a = data.analytics ?? {}
            finalMeta = {
              tokens_in: a.prompt_tokens ?? 0,
              tokens_out: a.completion_tokens ?? 0,
              cost_usd: a.cost_usd ?? 0,
              latency_ms: a.latency_ms ?? (Date.now() - startTime),
            }
            break
          } else if (data.status === 'error') {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: `*Error: ${data.error ?? 'Unknown error'}*`, streaming: false }
                  : msg
              )
            )
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: '*Error: Failed to get response. Please try again.*', streaming: false }
              : msg
          )
        )
      }
    } finally {
      if (!warningReceived) {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? { ...msg, streaming: false, meta: finalMeta, retrieved_chunks: retrievedChunks }
              : msg
          )
        )
      }
      setStreaming(false)
      abortRef.current = null
      // Auto-rename session after first message
      if (sid && messages.length === 0 && !renamedRef.current) {
        renamedRef.current = true
        const title = content.length > 40 ? content.slice(0, 40).trimEnd() + '…' : content
        updateSession(sid, { name: title }).catch(() => {})
        qc.invalidateQueries({ queryKey: ['playground-sessions'] })
      }
    }
  }

  function stopStreaming() {
    abortRef.current?.abort()
    setStreaming(false)
    setMessages((m) => m.map((msg) => (msg.streaming ? { ...msg, streaming: false } : msg)))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.key === 'Enter' && !e.shiftKey) || (e.key === 'Enter' && e.ctrlKey)) {
      e.preventDefault()
      sendMessage()
    }
    if (e.key === 'Escape') stopStreaming()
  }

  // ── Session totals ─────────────────────────────────────────
  const liveTokens = messages
    .filter((m) => m.meta)
    .reduce((s, m) => s + (m.meta!.tokens_in + m.meta!.tokens_out), 0)
  const liveCost = messages
    .filter((m) => m.meta)
    .reduce((s, m) => s + m.meta!.cost_usd, 0)
  const sessionTokens = baseTokensRef.current + liveTokens
  const sessionCost = baseCostRef.current + liveCost

  // Note: token persistence is handled server-side by _increment_session_totals
  // during the SSE stream, so no client-side flush is needed.

  const sessionExport: SessionExport = {
    created_at: new Date().toISOString(),
    config: config as unknown as Record<string, unknown>,
    total_tokens: sessionTokens,
    total_cost: sessionCost,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      metadata: m.meta as Record<string, unknown> | undefined,
      retrieved_chunks: m.retrieved_chunks,
    })),
  }

  const systemPromptTokens = approxTokens(config.system_prompt)
  const isSystemPromptError = systemPromptTokens > 4000

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ══ LEFT: Sessions Sidebar ═══════════════════════════ */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/50">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Sessions</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-zinc-500 hover:text-zinc-200"
            onClick={() => clearChat()}
            title="New chat"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          {sessions && sessions.length > 0 ? (
            <div className="py-1">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => loadSession(s.id)}
                  onKeyDown={(e) => e.key === 'Enter' && loadSession(s.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 transition-colors group cursor-pointer',
                    sessionId === s.id
                      ? 'bg-zinc-800/80 border-l-2 border-violet-500'
                      : 'hover:bg-zinc-800/40 border-l-2 border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                    <span className="text-xs text-zinc-300 truncate flex-1">{s.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id) }}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="ml-5.5 mt-0.5 flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600">
                      {s.message_count} msg{s.message_count !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[10px] text-zinc-600">·</span>
                    <span className="text-[10px] text-zinc-600">{relativeTime(s.updated_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <MessageSquare className="h-6 w-6 text-zinc-700" />
              <p className="text-xs text-zinc-600">No sessions yet</p>
            </div>
          )}
        </div>
      </aside>

      {/* ══ CENTER: Chat Area ════════════════════════════════ */}
      <div className="flex flex-1 flex-col min-w-0 bg-zinc-950">

        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 shrink-0">
          <div className="flex items-center gap-3">
            <PipelineModeToggle
              mode={config.mode}
              pipelineId={config.pipeline_id}
              onModeChange={(mode) => patchConfig({ mode, pipeline_id: null })}
              onPipelineChange={(pipeline_id) => patchConfig({ pipeline_id })}
            />
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <span className="hidden sm:inline text-xs text-zinc-500 tabular-nums">
                {messages.length} msgs · {sessionTokens.toLocaleString()} tokens · ${sessionCost.toFixed(4)}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-500 hover:text-zinc-200"
              onClick={clearChat}
              title="Clear chat"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <ExportChatMenu session={sessionExport} disabled={messages.length === 0} />
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.length === 0 && config.mode === 'pipeline' && !config.pipeline_id ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-5 pb-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-300 mb-1">No Pipeline Selected</h3>
                <p className="text-sm text-amber-300/70">Select a pipeline from the dropdown above to start chatting.</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-5 pb-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200 mb-1">Test any model or pipeline</h3>
                <p className="text-sm text-zinc-500">Real-time streaming. Attach a knowledge base for RAG.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {QUICK_STARTS.map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 text-xs h-8"
                    onClick={() => sendMessage(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={cn('flex flex-col gap-1', msg.role === 'user' ? 'items-end' : 'items-start')}>
                {msg.error_code === 'no_knowledge_base' ? (
                  <div className="max-w-[85%] rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <p className="text-amber-300 font-medium text-sm">No Knowledge Base Connected</p>
                        <p className="text-amber-300/80 text-xs leading-relaxed">
                          This pipeline has a Vector Search node but no knowledge base is attached. To enable RAG retrieval:
                        </p>
                        <ol className="text-amber-300/80 text-xs space-y-1 list-decimal list-inside">
                          <li>Open the Pipeline Canvas</li>
                          <li>Select the Vector Search node</li>
                          <li>Choose a Knowledge Base</li>
                          <li>Return to Playground and resend</li>
                        </ol>
                        {msg.pipeline_id && (
                          <Link
                            href={`/pipelines/${msg.pipeline_id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded px-2.5 py-1 transition-colors mt-1"
                            target="_blank"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Pipeline Canvas
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                <div className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white rounded-br-sm'
                    : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
                )}>
                  {msg.content.replace(/^\*\*Assistant\*\*\s*/i, '')}
                  {msg.streaming && !msg.content && (
                    <ThinkingLoader isRAG={!!config.knowledge_source_id} />
                  )}
                  {msg.streaming && msg.content && (
                    <span className="inline-block ml-1 h-3.5 w-0.5 bg-violet-400 animate-pulse rounded-full" />
                  )}
                </div>
                )}

                {msg.role === 'assistant' && msg.meta && !msg.streaming && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500 tabular-nums ml-1">
                    <span>{msg.meta.tokens_in + msg.meta.tokens_out} tokens</span>
                    <span>·</span>
                    <span>${msg.meta.cost_usd.toFixed(4)}</span>
                    <span>·</span>
                    <span>{(msg.meta.latency_ms / 1000).toFixed(2)}s</span>
                  </div>
                )}

                {msg.role === 'assistant' && msg.retrieved_chunks && msg.retrieved_chunks.length > 0 && !msg.streaming && (
                  <RAGContextInspector chunks={msg.retrieved_chunks} />
                )}
              </div>
            ))
          )}
        </div>

        {/* Input bar */}
        <div className="px-4 pb-4 pt-2 shrink-0">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-700/80 bg-zinc-800/80 pl-4 pr-2.5 py-2 focus-within:border-zinc-500 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={config.mode === 'pipeline' && !config.pipeline_id ? 'Select a pipeline to start chatting…' : 'Send a message…'}
              disabled={streaming || (config.mode === 'pipeline' && !config.pipeline_id)}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 max-h-50 outline-none overflow-y-auto"
            />
            {streaming ? (
              <button
                onClick={stopStreaming}
                title="Stop (Escape)"
                className="shrink-0 h-8 w-8 rounded-full bg-zinc-600 hover:bg-red-500/80 flex items-center justify-center transition-colors"
              >
                <Square className="h-3.5 w-3.5 text-white fill-white" />
              </button>
            ) : (
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isSystemPromptError || (config.mode === 'pipeline' && !config.pipeline_id)}
                title="Send (Enter)"
                className="shrink-0 h-8 w-8 rounded-full bg-zinc-100 hover:bg-white flex items-center justify-center transition-colors disabled:bg-zinc-700 disabled:cursor-not-allowed"
              >
                <ArrowUp className="h-4 w-4 text-zinc-900 disabled:text-zinc-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══ RIGHT: Settings Panel ════════════════════════════ */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-l border-zinc-800 bg-zinc-900/50">
        <div className="px-4 py-2.5 border-b border-zinc-800">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Settings</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 [scrollbar-gutter:stable]">

          {/* ── Pipeline mode: no pipeline selected ── */}
          {config.mode === 'pipeline' && !config.pipeline_id && (
            <p className="text-xs text-zinc-500 text-center pt-8">
              Select a pipeline to see its configuration.
            </p>
          )}

          {/* ── Pipeline mode: read-only summary ── */}
          {config.mode === 'pipeline' && config.pipeline_id && (() => {
            const pNodes = selectedPipeline ? parseCanvasNodes(selectedPipeline) : {}
            const llm = pNodes.llm as Record<string, unknown> | undefined
            const rag = pNodes.rag as Record<string, unknown> | undefined
            const sp = pNodes.system_prompt as Record<string, unknown> | undefined
            const canvasNodes = (selectedPipeline?.canvas_state as { nodes?: unknown[] })?.nodes ?? []
            const model = (llm?.model as string ?? selectedPipeline?.model ?? '').split('/').pop() || 'Unknown'
            const kbConnected = !!(rag?.knowledge_source_id)
            const spContent = (sp?.content as string) ?? ''
            return (
              <div className="space-y-4">
                {/* Model */}
                <div className="space-y-1">
                  <span className="text-xs text-zinc-500">Model</span>
                  <p className="text-sm text-zinc-200">{model}</p>
                </div>

                {/* Knowledge Base */}
                <div className="space-y-1">
                  <span className="text-xs text-zinc-500">Knowledge Base</span>
                  <p className={cn('text-sm', kbConnected ? 'text-zinc-200' : 'text-amber-400')}>
                    {kbConnected ? 'Connected' : 'Not connected'}
                  </p>
                </div>

                {/* System Prompt */}
                <div className="space-y-1">
                  <span className="text-xs text-zinc-500">System Prompt</span>
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-4">
                    {spContent
                      ? spContent.length > 120 ? spContent.slice(0, 120) + '…' : spContent
                      : 'Not configured'}
                  </p>
                </div>

                {/* Nodes count + link */}
                <div className="space-y-1">
                  <span className="text-xs text-zinc-500">Nodes</span>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-zinc-200">{canvasNodes.length} nodes</p>
                    <Link
                      href={`/pipelines/${config.pipeline_id}`}
                      className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                      target="_blank"
                    >
                      View Canvas <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Divider + note */}
                <div className="border-t border-zinc-800 pt-3">
                  <p className="text-[11px] text-zinc-500">
                    Configuration is managed on the Pipeline Canvas.
                  </p>
                </div>
              </div>
            )
          })()}

          {/* ── Direct mode: interactive controls ── */}
          {config.mode === 'direct' && (
            <>
              {/* Model Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-400">Model</Label>
                <ModelSelector
                  value={config.model}
                  onChange={(model) => patchConfig({ model })}
                />
              </div>

              {/* System Prompt */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-zinc-400">System Prompt</Label>
                  <span className={cn(
                    'text-xs tabular-nums',
                    systemPromptTokens > 3500 ? (isSystemPromptError ? 'text-red-400' : 'text-amber-400') : 'text-zinc-500'
                  )}>
                    {systemPromptTokens.toLocaleString()} / 4,000
                  </span>
                </div>
                <Textarea
                  value={config.system_prompt}
                  onChange={(e) => patchConfig({ system_prompt: e.target.value })}
                  placeholder="You are a helpful assistant."
                  className="min-h-25 max-h-50 resize-none bg-zinc-800 border-zinc-700 text-zinc-200 text-sm font-mono placeholder:text-zinc-500 focus:border-violet-500"
                />
                {systemPromptTokens > 3500 && !isSystemPromptError && (
                  <p className="text-xs text-amber-400">Approaching limit</p>
                )}
                {isSystemPromptError && (
                  <p className="text-xs text-red-400">System prompt too long.</p>
                )}
              </div>

              {/* Collapsible Parameters */}
              <div>
                <button
                  onClick={() => setParamsOpen((o) => !o)}
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors w-full"
                >
                  {paramsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  Parameters
                </button>

                {paramsOpen && (
                  <div className="mt-3 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-zinc-500">Temperature</Label>
                        <span className="text-xs text-zinc-300 tabular-nums">{config.temperature.toFixed(1)}</span>
                      </div>
                      <Slider
                        min={0} max={1} step={0.1}
                        value={[config.temperature]}
                        onValueChange={(v) => patchConfig({ temperature: typeof v === 'number' ? v : (v as number[])[0] })}
                        className="**:[[role=slider]]:bg-violet-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-500">Max Tokens</Label>
                      <input
                        type="number"
                        min={1} max={8192}
                        value={config.max_tokens}
                        onChange={(e) => patchConfig({ max_tokens: Number(e.target.value) })}
                        className="w-full h-7 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 text-xs text-zinc-200 tabular-nums focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-500">Top P</Label>
                      <input
                        type="number"
                        min={0} max={1} step={0.1}
                        value={config.top_p}
                        onChange={(e) => patchConfig({ top_p: Number(e.target.value) })}
                        className="w-full h-7 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 text-xs text-zinc-200 tabular-nums focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-zinc-500">Streaming</Label>
                      <Switch
                        checked={config.stream}
                        onCheckedChange={(stream) => patchConfig({ stream })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* KB Attachment — direct mode only */}
              <KBAttachmentPanel
                knowledgeSourceId={config.knowledge_source_id}
                topK={config.top_k}
                threshold={config.threshold}
                disabled={false}
                onKBChange={(knowledge_source_id) => patchConfig({ knowledge_source_id })}
                onTopKChange={(top_k) => patchConfig({ top_k })}
                onThresholdChange={(threshold) => patchConfig({ threshold })}
              />
            </>
          )}
        </div>

        {/* Pinned footer — always visible */}
        {config.mode === 'direct' && (
          <div className="p-4 border-t border-zinc-800 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-zinc-700 text-zinc-300 hover:text-zinc-100 gap-2 text-xs"
              onClick={() => setSaveModalOpen(true)}
            >
              <Layers className="h-3.5 w-3.5 text-violet-400" />
              Save as Pipeline
            </Button>
          </div>
        )}
      </aside>

      {/* Save as Pipeline Modal */}
      <SaveAsPipelineModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        config={config}
        systemPromptTokens={systemPromptTokens}
      />
    </div>
  )
}
