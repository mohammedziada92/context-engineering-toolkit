'use client'

import { useRouter } from 'next/navigation'
import { Check, Key, GitBranch, Play, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  icon: React.ElementType
  label: string
  description: string
  done: boolean
  action?: string
  href?: string
}

interface Props {
  onboarding: {
    has_api_key: boolean
    has_pipeline: boolean
    has_run: boolean
    complete: boolean
  }
}

export function OnboardingChecklist({ onboarding }: Props) {
  const router = useRouter()

  if (onboarding.complete) return null

  const steps: Step[] = [
    { icon: LogIn,    label: 'Sign in',                  description: 'Create your account',              done: true },
    { icon: Key,      label: 'Add OpenRouter API key',   description: 'Connect your LLM provider',        done: onboarding.has_api_key,   action: 'Add key',  href: '/settings' },
    { icon: GitBranch,label: 'Create a pipeline',        description: 'Build your first context pipeline', done: onboarding.has_pipeline,  action: 'Create',   href: '/pipelines/new' },
    { icon: Play,     label: 'Run a pipeline',           description: 'Execute and see live results',      done: onboarding.has_run,       action: 'View',      href: '/pipelines' },
  ]

  const completedCount = steps.filter((s) => s.done).length

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Get started with CET</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {completedCount}/{steps.length} steps complete
          </p>
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-24 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-500"
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-zinc-800/60">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <div
              key={step.label}
              className={cn(
                'flex items-center justify-between px-4 py-2.5',
                step.done ? 'opacity-60' : ''
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center shrink-0',
                    step.done
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-zinc-800 text-zinc-500'
                  )}
                >
                  {step.done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-200">{step.label}</p>
                  <p className="text-[10px] text-zinc-500">{step.description}</p>
                </div>
              </div>
              {!step.done && step.action && step.href && (
                <button
                  onClick={() => router.push(step.href!)}
                  className="text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {step.action}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
