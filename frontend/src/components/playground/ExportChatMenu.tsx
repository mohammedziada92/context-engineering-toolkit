'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, ChevronDown, Copy, Check } from 'lucide-react'
import { exportAsMarkdown, type SessionExport } from '@/lib/api/playground'

interface Props {
  session: SessionExport
  disabled?: boolean
}

export function ExportChatMenu({ session, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function downloadBlob(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  async function copyMarkdown() {
    const md = exportAsMarkdown(session)
    await navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    setOpen(false)
  }

  const dateStr = new Date().toISOString().split('T')[0]

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled}
        className="h-8 gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 px-2"
        onClick={() => setOpen((o) => !o)}
      >
        <Download className="h-3.5 w-3.5" />
        Export
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 w-48 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden">
          {[
            {
              label: copied ? 'Copied!' : 'Copy as Markdown',
              icon: copied ? Check : Copy,
              action: copyMarkdown,
            },
            {
              label: 'Download .md',
              icon: Download,
              action: () => downloadBlob(
                exportAsMarkdown(session),
                `cet-playground-${dateStr}.md`,
                'text/markdown'
              ),
            },
            {
              label: 'Download .json',
              icon: Download,
              action: () => downloadBlob(
                JSON.stringify(session, null, 2),
                `cet-playground-${dateStr}.json`,
                'application/json'
              ),
            },
          ].map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              onClick={action}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <Icon className="h-3.5 w-3.5 text-zinc-500" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
