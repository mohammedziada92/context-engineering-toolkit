import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { UsageStats } from '@/lib/api/settings'

interface Props {
  usage?: UsageStats
  hasKey: boolean
}

const MODEL_SHORT: Record<string, string> = {
  'anthropic/claude-sonnet-4-6': 'Claude Sonnet 4.6',
  'z-ai/glm-5': 'GLM-5',
  'google/gemini-3.1-pro-preview': 'Gemini 3.1 Pro',
}

export function LLMCosts({ usage, hasKey }: Props) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-zinc-200">LLM Costs</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Via your OpenRouter account</p>
        </div>
        <Link href="/analytics" className="text-xs text-violet-400 hover:text-violet-300">
          View detailed analytics →
        </Link>
      </div>

      {!hasKey ? (
        <div className="text-center py-6">
          <p className="text-sm text-zinc-500 mb-2">No OpenRouter key connected</p>
          <Link href="/settings/api-keys" className="text-xs text-violet-400 hover:text-violet-300">
            Add your API key to see LLM cost tracking
          </Link>
        </div>
      ) : !usage ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Spent', value: `$${usage.spent_usd.toFixed(2)}` },
              { label: 'Remaining', value: `$${usage.remaining_usd.toFixed(2)}` },
              { label: 'Total Credits', value: `$${usage.total_usd.toFixed(2)}` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-3 rounded-lg bg-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">{label}</p>
                <p className="text-base font-bold text-zinc-100 tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          {usage.by_model.length > 0 && (
            <div className="space-y-2 pt-2">
              {usage.by_model.map(({ model, spent, pct }) => (
                <div key={model} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 w-36 truncate">
                    {MODEL_SHORT[model] ?? model.split('/').pop()}
                  </span>
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500/60 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-zinc-400 tabular-nums w-20 text-right">
                    ${spent.toFixed(2)} ({pct}%)
                  </span>
                </div>
              ))}
            </div>
          )}

          <a
            href="https://openrouter.ai/credits"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
          >
            Manage OpenRouter credits <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </section>
  )
}
