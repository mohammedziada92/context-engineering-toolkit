'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Play, Loader2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { type Pipeline } from '@/lib/api/pipelines'
import { SUPPORTED_MODELS } from '@/lib/models'
import { getAuthHeader } from '@/lib/api/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

interface Props {
  pipeline: Pipeline
  onClose: () => void
}

interface UsageEvent { tokens: number; cost: number; latency_ms: number }

export function RunModal({ pipeline, onClose }: Props) {
  const [message, setMessage]         = useState('')
  const [modelOverride, setModel]     = useState<string>('default')
  const [streaming, setStreaming]     = useState(false)
  const [output, setOutput]           = useState('')
  const [usage, setUsage]             = useState<UsageEvent | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const esRef                          = useRef<EventSource | null>(null)
  const outputRef                      = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  // Cleanup on unmount
  useEffect(() => () => { esRef.current?.close() }, [])

  async function handleRun() {
    if (!message.trim()) return
    setOutput(''); setUsage(null); setError(null); setStreaming(true)

    const headers = await getAuthHeader()
    const url   = `${API_BASE}/api/v1/pipelines/${pipeline.id}/run/stream?` +
      new URLSearchParams({
        message,
        ...(modelOverride !== 'default' ? { model_override: modelOverride } : {}),
        authorization: headers.Authorization,
      })

    const es = new EventSource(url)
    esRef.current = es

    es.addEventListener('token', (e) => {
      const data = JSON.parse(e.data) as { content: string }
      setOutput((prev) => prev + data.content)
    })

    es.addEventListener('usage', (e) => {
      setUsage(JSON.parse(e.data) as UsageEvent)
    })

    es.addEventListener('done', () => {
      es.close(); setStreaming(false)
    })

    es.onerror = () => {
      es.close()
      setStreaming(false)
      setError('Pipeline run failed. Check your API key and try again.')
    }
  }

  function handleStop() {
    esRef.current?.close()
    setStreaming(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Run Pipeline</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{pipeline.name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">User Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What is retrieval augmented generation?"
              rows={3}
              disabled={streaming}
              className="bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 resize-none focus-visible:ring-violet-500/30"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRun()
              }}
            />
          </div>

          {/* Model override */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Model Override</label>
            <select
              value={modelOverride}
              onChange={(e) => { if (e.target.value !== null) setModel(e.target.value) }}
              className="select-native w-full" style={{height: '2.25rem', fontSize: '0.875rem'}}
            >
              <option value="default">Use pipeline default</option>
              {SUPPORTED_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Output area */}
          {(output || streaming || error) && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Output</label>
              <div
                ref={outputRef}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 min-h-[120px] max-h-[300px] overflow-y-auto text-sm text-zinc-200 font-mono whitespace-pre-wrap"
              >
                {output}
                {streaming && <span className="inline-block h-3.5 w-0.5 bg-violet-400 animate-pulse ml-0.5 align-text-bottom" />}
                {error && <span className="text-red-400">{error}</span>}
              </div>
            </div>
          )}

          {/* Usage stats */}
          {usage && (
            <div className="flex gap-6 text-xs text-zinc-500 border-t border-zinc-800 pt-3">
              <span><span className="text-zinc-300 font-medium">{usage.tokens.toLocaleString()}</span> tokens</span>
              <span><span className="text-zinc-300 font-medium">${usage.cost.toFixed(4)}</span> cost</span>
              <span><span className="text-zinc-300 font-medium">{(usage.latency_ms / 1000).toFixed(2)}s</span> latency</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-600">Cmd+Enter to run</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Cancel
            </Button>
            {streaming ? (
              <Button onClick={handleStop} className="bg-red-600 hover:bg-red-500 text-white gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Stop
              </Button>
            ) : (
              <Button
                onClick={handleRun}
                disabled={!message.trim()}
                className="bg-violet-600 hover:bg-violet-500 text-white gap-2 disabled:opacity-40"
              >
                <Play className="h-4 w-4" />
                Run Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
