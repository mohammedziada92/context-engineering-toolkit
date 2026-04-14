'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { History, Trash2, ChevronDown, MessageSquare } from 'lucide-react'
import { deleteAllSessions } from '@/lib/api/playground'
import { useQueryClient } from '@tanstack/react-query'

interface Session {
  id: string
  name: string
  mode: 'direct' | 'pipeline'
  message_count: number
  created_at: string
  updated_at: string
  config: { model?: string }
}

interface Props {
  sessions: Session[]
  activeSessionId: string | null
  onSelect: (id: string) => void
  onDeleteAll: () => void
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  if (d === 1) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function groupByDay(sessions: Session[]) {
  const groups: Record<string, Session[]> = {}
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  for (const s of sessions) {
    const d = new Date(s.updated_at).toDateString()
    const label = d === today ? 'Today' : d === yesterday ? 'Yesterday' : new Date(s.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    if (!groups[label]) groups[label] = []
    groups[label].push(s)
  }
  return groups
}

export function SessionHistoryDropdown({ sessions, activeSessionId, onSelect, onDeleteAll }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleDeleteAll() {
    await deleteAllSessions()
    qc.invalidateQueries({ queryKey: ['playground-sessions'] })
    onDeleteAll()
    setOpen(false)
  }

  const groups = groupByDay(sessions)

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 px-2"
        onClick={() => setOpen((o) => !o)}
      >
        <History className="h-3.5 w-3.5" />
        Sessions
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-72 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
            <span className="text-xs font-medium text-zinc-300">Session History</span>
            {sessions.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Delete All
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            <div className="p-1">
              <button
                onClick={() => { onDeleteAll(); setOpen(false) }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-violet-400 hover:bg-violet-500/10 transition-colors"
              >
                + New Chat
              </button>
            </div>

            {Object.keys(groups).length === 0 && (
              <p className="px-3 py-4 text-xs text-zinc-500 text-center">No sessions yet</p>
            )}

            {Object.entries(groups).map(([label, daySessions]) => (
              <div key={label}>
                <p className="px-3 py-1 text-xs font-medium text-zinc-600 uppercase tracking-wider">{label}</p>
                {daySessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { onSelect(s.id); setOpen(false) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-800 transition-colors ${
                      s.id === activeSessionId ? 'bg-zinc-800' : ''
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-xs text-zinc-300 truncate">{s.name}</p>
                      <p className="text-xs text-zinc-600">
                        {s.message_count} msgs · {s.mode === 'pipeline' ? 'Pipeline' : (s.config?.model?.split('/').pop() ?? 'Direct')}
                      </p>
                    </div>
                    <span className="text-xs text-zinc-600 shrink-0">{relativeTime(s.updated_at)}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
