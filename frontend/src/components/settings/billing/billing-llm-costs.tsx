'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAuthHeader } from '@/lib/api/api'
import Link from 'next/link'

interface LLMCostData {
  spent_usd: number
  remaining_usd: number
  total_usd: number
  pct_used: number
  cached_at: string
  by_model: {
    model: string
    spent: number
    pct: number
  }[]
}

const MODEL_LABELS: Record<string, string> = {
  'anthropic/claude-sonnet-4-6': 'Claude Sonnet 4.6',
  'z-ai/glm-5': 'GLM-5',
  'google/gemini-3.1-pro-preview': 'Gemini 3.1 Pro',
}

const MODEL_COLORS: Record<string, string> = {
  'anthropic/claude-sonnet-4-6': 'bg-violet-500',
  'z-ai/glm-5': 'bg-blue-500',
  'google/gemini-3.1-pro-preview': 'bg-emerald-500',
}

function barColor(pct: number) {
  if (pct > 80) return 'bg-red-500'
  if (pct > 60) return 'bg-amber-500'
  return 'bg-emerald-500'
}

async function fetchLLMCosts(): Promise<LLMCostData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/settings/usage`, {
    headers: await getAuthHeader(),
  })
  if (!res.ok) throw new Error('Failed to fetch LLM costs')
  return res.json()
}

export function BillingLLMCosts() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['llm-costs'],
    queryFn: fetchLLMCosts,
    staleTime: 60 * 60 * 1000, // 1 hour — matches API cache
  })

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-zinc-100">LLM Costs</CardTitle>
            <p className="text-xs text-zinc-500 mt-0.5">
              CET does not charge for LLM usage — all costs go to your OpenRouter account.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">

        {isError && (
          <div className="rounded-md border border-zinc-700 bg-zinc-800/50 px-4 py-3">
            <p className="text-sm text-zinc-400">
              No OpenRouter key connected.{' '}
              <Link href="/settings/api-keys" className="text-violet-400 hover:text-violet-300 underline-offset-2 hover:underline">
                Add your API key
              </Link>{' '}
              to see LLM cost tracking.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-40 bg-zinc-800" />
            <Skeleton className="h-2 w-full bg-zinc-800" />
            <Skeleton className="h-4 w-32 bg-zinc-800" />
          </div>
        )}

        {data && (
          <>
            {/* Low credits warning */}
            {data.pct_used > 80 && (
              <div
                className={`rounded-md border px-4 py-3 text-sm ${
                  data.remaining_usd <= 0
                    ? 'border-red-500/30 bg-red-500/10 text-red-300'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                }`}
              >
                {data.remaining_usd <= 0
                  ? `No credits remaining — pipelines and playground are disabled until you top up your OpenRouter account.`
                  : `Low credits — $${data.remaining_usd.toFixed(2)} remaining. Top up to avoid pipeline failures.`}
                <a
                  href="https://openrouter.ai/credits"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`ml-2 underline underline-offset-2 ${
                    data.remaining_usd <= 0
                      ? 'hover:text-red-200'
                      : 'hover:text-amber-200'
                  }`}
                >
                  Top up on OpenRouter &#x2197;
                </a>
              </div>
            )}

            {/* Spent / Remaining summary */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold tabular-nums text-zinc-100">
                  ${data.spent_usd.toFixed(2)}
                </p>
                <p className="text-xs text-zinc-500">spent this month</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium tabular-nums text-zinc-300">
                  ${data.remaining_usd.toFixed(2)} remaining
                </p>
                <p className="text-xs text-zinc-500">of ${data.total_usd.toFixed(2)}</p>
              </div>
            </div>

            {/* Credit bar */}
            <div className="space-y-1">
              <div className="h-2 w-full rounded-full bg-zinc-800">
                <div
                  className={`h-2 rounded-full transition-all ${barColor(data.pct_used)}`}
                  style={{ width: `${Math.min(data.pct_used, 100)}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 text-right">{data.pct_used}% used</p>
            </div>

            {/* By-model breakdown */}
            <div className="space-y-3 pt-1">
              {data.by_model.map((m) => (
                <div key={m.model} className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${MODEL_COLORS[m.model] ?? 'bg-zinc-500'}`} />
                  <span className="text-sm text-zinc-300 flex-1">
                    {MODEL_LABELS[m.model] ?? m.model}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-zinc-800">
                      <div
                        className={`h-1.5 rounded-full ${MODEL_COLORS[m.model] ?? 'bg-zinc-500'}`}
                        style={{ width: `${m.pct}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-zinc-400 w-10 text-right">
                      ${m.spent.toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-600 w-8 text-right">{m.pct}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Links */}
            <div className="flex items-center gap-4 pt-1 border-t border-zinc-800">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-zinc-400 hover:text-zinc-200 gap-1.5 px-0"
                onClick={() => window.open('https://openrouter.ai/activity', '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
                View detailed analytics
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-zinc-400 hover:text-zinc-200 gap-1.5 px-0"
                onClick={() => window.open('https://openrouter.ai/credits', '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
                Manage OpenRouter credits
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
