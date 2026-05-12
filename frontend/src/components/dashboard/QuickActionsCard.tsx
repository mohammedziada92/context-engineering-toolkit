'use client'

import { useRouter } from 'next/navigation'
import { Plus, Upload, Gamepad2, Database } from 'lucide-react'

const ACTIONS = [
  {
    icon:    Plus,
    label:   'New Pipeline',
    desc:    'Build a context pipeline',
    href:    '/pipelines/new',
    color:   'text-violet-400',
    bg:      'bg-violet-500/10 hover:bg-violet-500/20 border-violet-800/50',
  },
  {
    icon:    Upload,
    label:   'Upload Document',
    desc:    'Ingest files for RAG',
    href:    '/knowledge?action=upload',
    color:   'text-emerald-400',
    bg:      'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-800/50',
  },
  {
    icon:    Gamepad2,
    label:   'Open Playground',
    desc:    'Chat with any model',
    href:    '/playground',
    color:   'text-blue-400',
    bg:      'bg-blue-500/10 hover:bg-blue-500/20 border-blue-800/50',
  },
  {
    icon:    Database,
    label:   'Add Knowledge',
    desc:    'Create a knowledge base',
    href:    '/knowledge?action=create',
    color:   'text-amber-400',
    bg:      'bg-amber-500/10 hover:bg-amber-500/20 border-amber-800/50',
  },
]

export function QuickActionsCard() {
  const router = useRouter()

  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Quick Actions</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ACTIONS.map(({ icon: Icon, label, desc, href, color, bg }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className={`
              flex flex-col items-start gap-2 p-4 rounded-xl border
              transition-colors text-left ${bg}
            `}
          >
            <Icon className={`h-5 w-5 ${color}`} />
            <div>
              <p className={`text-xs font-semibold ${color}`}>{label}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
