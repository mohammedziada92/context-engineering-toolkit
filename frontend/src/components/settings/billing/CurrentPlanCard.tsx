import { CheckCircle2 } from 'lucide-react'
import { UserProfile } from '@/lib/api/settings'

const FEATURES = [
  'Unlimited pipelines',
  'Unlimited knowledge sources',
  'Unlimited playground sessions',
  'Full analytics dashboard',
  'All 3 LLM models via OpenRouter',
  'pgvector semantic search',
  'BYOK your OpenRouter key',
]

interface Props {
  profile?: UserProfile
}

export function CurrentPlanCard({ profile }: Props) {
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-semibold text-zinc-100">CET Free Plan</h2>
            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Active
            </span>
          </div>
          {memberSince && (
            <p className="text-xs text-zinc-500">Member since {memberSince}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-zinc-100">$0</p>
          <p className="text-xs text-zinc-500">no credit card needed</p>
        </div>
      </div>

      <p className="text-xs text-zinc-400 mb-4">Everything you need to get started.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {FEATURES.map((f) => (
          <div key={f} className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-xs text-zinc-300">{f}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
