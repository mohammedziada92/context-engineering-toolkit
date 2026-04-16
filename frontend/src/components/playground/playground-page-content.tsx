'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  postChatStream,
  createSession,
  updateSession,
  listSessions,
  getSession,
  type ChatPayload,
  type SessionExport,
  type Session,
  exportAsMarkdown,
} from '@/lib/api/playground'
import { PipelineModeToggle } from './PipelineModeToggle'
import { KBAttachmentPanel } from './KBAttachmentPanel'
import { RAGContextInspector } from './RAGContextInspector'
import { SessionHistoryDropdown } from './SessionHistoryDropdown'
import { SaveAsPipelineModal } from './SaveAsPipelineModal'
import { ExportChatMenu } from './ExportChatMenu'
import { ModelSelector } from '@/components/shared/ModelSelector'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Send, Square, Trash2, Sparkles, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// ── Types ────────────────────────────────────────────────────
type Mode = 'direct' | 'pipeline'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  meta?: { tokens_in: number; tokens_out: number; cost_usd: number; latency_ms: number }
  retrieved_chunks?: Array<{ score: number; content: string; chunk_index: number; metadata: Record<string, unknown> }>
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
  threshold: 0.70,
}

const QUICK_STARTS = [
  'What is RAG?',
  'Summarize a document',
  'Write a Python function',
]

// ── Token counter (tiktoken approximation: ~4 chars/token) ───
function approxTokens(text: string) { return Math.ceil(text.length / 4) }

export function PlaygroundPageContent() {
  const qc = useQueryClient()
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: sessions } = useQuery<Session[]>({
    queryKey: ['playground-sessions'],
    queryFn: listSessions,
    staleTime: 30_000,
  })

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function patchConfig(patch: Partial<Config>) {
    setConfig((c) => ({ ...c, ...patch }))
  }

  // ── Session operations ────────────────────────────────────
  async function loadSession(id: string) {
    const s = await getSession(id)
    setSessionId(s.id)
    setMessages(s.messages ?? [])
    patchConfig({ ...DEFAULT_CONFIG, mode: s.mode, pipeline_id: s.pipeline_id, ...s.config })
  }

  function clearChat() {
    setMessages([])
    setSessionId(null)
    setConfig(DEFAULT_CONFIG)
  }

  // ── Send message ─────────────────────────────────────────
  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content || streaming) return
    setInput('')

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content }
    const assistantId = crypto.randomUUID()
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', streaming: true }

    setMessages((m) => [...m, userMsg, assistantMsg])
    setStreaming(true)

    // Ensure session exists
    let sid = sessionId
    if (!sid) {
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
    }

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

          if (data.content !== undefined && !data.status) {
            // Token delta from LLM stream
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantId ? { ...msg, content: msg.content + data.content } : msg
              )
            )
          } else if (data.chunks) {
            // RAG retrieved chunks
            retrievedChunks = data.chunks
          } else if (data.status === 'done') {
            // Stream complete — extract analytics
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
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, streaming: false, meta: finalMeta, retrieved_chunks: retrievedChunks }
            : msg
        )
      )
      setStreaming(false)
      abortRef.current = null
    }
  }

  function stopStreaming() {
    abortRef.current?.abort()
    setStreaming(false)
    setMessages((m) =>
      m.map((msg) => (msg.streaming ? { ...msg, streaming: false } : msg))
    )
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.key === 'Enter' && !e.shiftKey) || (e.key === 'Enter' && e.ctrlKey)) {
      e.preventDefault()
      sendMessage()
    }
    if (e.key === 'Escape') stopStreaming()
  }

  // ── Session totals ────────────────────────────────────────
  const sessionTokens = messages
    .filter((m) => m.meta)
    .reduce((s, m) => s + (m.meta!.tokens_in + m.meta!.tokens_out), 0)
  const sessionCost = messages
    .filter((m) => m.meta)
    .reduce((s, m) => s + m.meta!.cost_usd, 0)

  // ── Export data ───────────────────────────────────────────
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
  const isSystemPromptWarning = systemPromptTokens > 3500
  const isSystemPromptError = systemPromptTokens > 4000

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Config Panel ──────────────────────────────────── */}
      <aside className="hidden md:flex w-[360px] shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/50 overflow-y-auto">
        <div className="p-4 space-y-5">

          {/* Mode Toggle */}
          <PipelineModeToggle
            mode={config.mode}
            pipelineId={config.pipeline_id}
            onModeChange={(mode) => patchConfig({ mode, pipeline_id: null })}
            onPipelineChange={(pipeline_id) => patchConfig({ pipeline_id })}
          />

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
                    isSystemPromptError ? 'text-red-400' :
                    isSystemPromptWarning ? 'text-amber-400' :
                    'text-zinc-500'
                  )}>
                    {systemPromptTokens.toLocaleString()} / 4,000 tokens
                  </span>
                </div>
                <Textarea
                  value={config.system_prompt}
                  onChange={(e) => patchConfig({ system_prompt: e.target.value })}
                  placeholder="You are a helpful assistant."
                  className="min-h-[120px] max-h-[260px] resize-none bg-zinc-800 border-zinc-700 text-zinc-200 text-sm font-mono placeholder:text-zinc-500 focus:border-violet-500"
                />
                {isSystemPromptError && (
                  <p className="text-xs text-red-400">System prompt too long — must be under 4,000 tokens.</p>
                )}
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-zinc-400">Temperature</Label>
                  <span className="text-xs text-zinc-300 tabular-nums">{config.temperature.toFixed(1)}</span>
                </div>
                <Slider
                  min={0} max={1} step={0.1}
                  value={[config.temperature]}
                  onValueChange={([v]) => patchConfig({ temperature: v })}
                  className="[&_[role=slider]]:bg-violet-500"
                />
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>Precise</span><span>Creative</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-400">Max Output Tokens</Label>
                <input
                  type="number"
                  min={1} max={8192}
                  value={config.max_tokens}
                  onChange={(e) => patchConfig({ max_tokens: Number(e.target.value) })}
                  className="w-full h-8 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-200 tabular-nums focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Top P */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-zinc-400">Top P</Label>
                  <span className="text-xs text-zinc-300 tabular-nums">{config.top_p.toFixed(1)}</span>
                </div>
                <input
                  type="number"
                  min={0} max={1} step={0.1}
                  value={config.top_p}
                  onChange={(e) => patchConfig({ top_p: Number(e.target.value) })}
                  className="w-full h-8 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-200 tabular-nums focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Stream Toggle */}
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-zinc-400">Streaming</Label>
                <Switch
                  checked={config.stream}
                  onCheckedChange={(stream) => patchConfig({ stream })}
                />
              </div>
            </>
          )}

          {/* KB Attachment — both modes */}
          <KBAttachmentPanel
            knowledgeSourceId={config.knowledge_source_id}
            topK={config.top_k}
            threshold={config.threshold}
            onKBChange={(knowledge_source_id) => patchConfig({ knowledge_source_id })}
            onTopKChange={(top_k) => patchConfig({ top_k })}
            onThresholdChange={(threshold) => patchConfig({ threshold })}
          />

          {/* Save as Pipeline (Direct mode only) */}
          {config.mode === 'direct' && (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-zinc-700 text-zinc-300 hover:text-zinc-100 gap-2 text-xs"
              onClick={() => setSaveModalOpen(true)}
            >
              <Layers className="h-3.5 w-3.5 text-violet-400" />
              Save as Pipeline
            </Button>
          )}
        </div>
      </aside>

      {/* ── Chat Panel ────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5 bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <SessionHistoryDropdown
              sessions={sessions ?? []}
              activeSessionId={sessionId}
              onSelect={loadSession}
              onDeleteAll={async () => {
                clearChat()
                qc.invalidateQueries({ queryKey: ['playground-sessions'] })
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-500 hover:text-zinc-200"
              onClick={clearChat}
              title="Clear chat (Ctrl+L)"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <div className="hidden sm:flex items-center gap-3 mr-2">
                <span className="text-xs text-zinc-500 tabular-nums">
                  {messages.length} msgs · {sessionTokens.toLocaleString()} tokens · ${sessionCost.toFixed(4)}
                </span>
              </div>
            )}
            <ExportChatMenu session={sessionExport} disabled={messages.length === 0} />
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-5 pb-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200 mb-1">
                  Test any model or pipeline
                </h3>
                <p className="text-sm text-zinc-500">
                  Real-time streaming. Attach a knowledge base for RAG.
                </p>
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
                <div className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white rounded-br-sm'
                    : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
                )}>
                  {msg.content}
                  {msg.streaming && (
                    <span className="inline-block ml-1 h-3.5 w-0.5 bg-violet-400 animate-pulse rounded-full" />
                  )}
                </div>

                {/* Message meta */}
                {msg.role === 'assistant' && msg.meta && !msg.streaming && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500 tabular-nums ml-1">
                    <span>{msg.meta.tokens_in + msg.meta.tokens_out} tokens</span>
                    <span>·</span>
                    <span>${msg.meta.cost_usd.toFixed(4)}</span>
                    <span>·</span>
                    <span>{(msg.meta.latency_ms / 1000).toFixed(2)}s</span>
                  </div>
                )}

                {/* RAG Context Inspector */}
                {msg.role === 'assistant' && msg.retrieved_chunks && msg.retrieved_chunks.length > 0 && !msg.streaming && (
                  <RAGContextInspector chunks={msg.retrieved_chunks} />
                )}
              </div>
            ))
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-end gap-3">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message… (Enter to send, Shift+Enter for new line)"
              disabled={streaming}
              rows={1}
              className="flex-1 min-h-[44px] max-h-[144px] resize-none bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 text-sm focus:border-violet-500 transition-colors"
            />
            {streaming ? (
              <Button
                size="icon"
                variant="outline"
                className="h-11 w-11 border-zinc-600 text-zinc-300 hover:text-white hover:bg-red-500/10 hover:border-red-500/50 shrink-0"
                onClick={stopStreaming}
                title="Stop (Escape)"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                className="h-11 w-11 bg-violet-600 hover:bg-violet-500 text-white shrink-0"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isSystemPromptError}
                title="Send (Enter)"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-zinc-600 text-center">
            Enter to send · Shift+Enter new line · Escape to stop
          </p>
        </div>
      </div>

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
