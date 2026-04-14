'use client'

import { useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/api'
import Link from 'next/link'
import { CheckCircle2, Circle, Key, GitBranch, Play, LogIn } from 'lucide-react'

interface Props {
  hasApiKey: boolean
  pipelineCount: number
  runCount: number
}

interface Step {
  icon: typeof LogIn
  label: string
  done: boolean
  href?: string
  action?: string
}

export function SetupChecklist({ hasApiKey, pipelineCount, runCount }: Props) {
  const qc = useQueryClient()

  const steps: Step[] = [
    { icon: LogIn, label: 'Sign in', done: true },
    { icon: Key, label: 'Add your OpenRouter API key', done: hasApiKey, href: '/settings/api-keys', action: 'Go to API Keys' },
    { icon: GitBranch, label: 'Create your first pipeline', done: pipelineCount > 0, href: '/pipelines/new', action: 'Create Pipeline' },
    { icon: Play, label: 'Run your first pipeline', done: runCount > 0, href: '/playground', action: 'Open Playground' },
  ]

  const completedCount = steps.filter((s) => s.done).length
  const allDone = completedCount === steps.length
  const pct = Math.round((completedCount / steps.length) * 100)

  if (allDone) return null

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-zinc-200">Get started with CET</h2>
          <span className="text-xs text-zinc-500 tabular-nums">{completedCount} of {steps.length} complete</span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="divide-y divide-zinc-800/60">
        {steps.map(({ icon: Icon, label, done, href, action }) => (
          <div
            key={label}
            className={`flex items-center gap-4 px-5 py-3.5 ${done ? 'opacity-50' : ''}`}
          >
            {done ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-zinc-600 flex-shrink-0" />
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 flex-shrink-0">
              <Icon className={`h-4 w-4 ${done ? 'text-emerald-400' : 'text-zinc-400'}`} />
            </div>
            <p className={`flex-1 text-sm ${done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
              {label}
            </p>
            {!done && href && action && (
              <Link
                href={href}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex-shrink-0"
              >
                {action} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
