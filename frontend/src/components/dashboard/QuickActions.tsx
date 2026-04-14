'use client'

import { useRouter } from 'next/navigation'
import { Plus, Upload, Gamepad2 } from 'lucide-react'

const ACTIONS = [
  { icon: Plus, label: 'New Pipeline', desc: 'Build a RAG pipeline visually', href: '/pipelines/new', color: 'violet' },
  { icon: Upload, label: 'Upload Document', desc: 'Add a PDF, URL, or text source', href: '/knowledge', color: 'blue' },
  { icon: Gamepad2, label: 'Open Playground', desc: 'Test any model in real time', href: '/playground', color: 'emerald' },
] as const

const colorMap = {
  violet: 'bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20',
  blue: 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20',
}

export function QuickActions() {
  const router = useRouter()

  return (
    <div>
      <h2 className="text-sm font-medium text-zinc-400 mb-3">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ACTIONS.map(({ icon: Icon, label, desc, href, color }) => (
          <button
            key={label}
            onClick={() => router.push(href)}
            className="group flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left hover:border-zinc-700 hover:bg-zinc-800/60 transition-colors"
          >
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${colorMap[color]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200 group-hover:text-zinc-100">{label}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
