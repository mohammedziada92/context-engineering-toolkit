import { ExternalLink, Loader2 } from 'lucide-react'
import { UsageStats } from '@/lib/api/settings'

interface Props {
  usage?: UsageStats
}

const MODEL_SHORT: Record<string, string> = {
  'anthropic/claude-sonnet-4-6': 'Claude Sonnet 4.6',
  'z-ai/glm-5': 'GLM-5',
  'google/gemini-3.1-pro-preview': 'Gemini 3.1 Pro',
}

export function UsageThisMonth({ usage }: Props) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-zinc-200">Usage This Month</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Via your OpenRouter account · cached hourly</p>
        </div>
        <a
          href="https://openrouter.ai/credits"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
        >
          Top up credits <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {!usage ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading usage...
        </div>
      ) : (
        <div className="space-y-5">
          {/* Credit bar */}
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
              <span>${usage.spent_usd.toFixed(2)} spent</span>
              <span>${usage.remaining_usd.toFixed(2)} remaining</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-500 transition-all"
                style={{ width: `${Math.min(usage.pct_used, 100)}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">{usage.pct_used}% of ${usage.total_usd.toFixed(2)} total used</p>
          </div>

          {/* By model breakdown */}
          {usage.by_model.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 font-medium">Breakdown by model</p>
              {usage.by_model.map(({ model, spent, pct }) => (
                <div key={model} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 w-36 truncate">
                    {MODEL_SHORT[model] ?? model.split('/').pop()}
                  </span>
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500/60 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-400 tabular-nums w-14 text-right">
                    ${spent.toFixed(2)} <span className="text-zinc-600">({pct}%)</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {usage.cached_at && (
            <p className="text-xs text-zinc-600">
              Last updated {new Date(usage.cached_at).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
