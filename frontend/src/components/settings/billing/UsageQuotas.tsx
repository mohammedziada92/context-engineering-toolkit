import { Skeleton } from '@/components/ui/skeleton'

interface QuotaRow {
  label: string
  used: number
  limit: string
  unit?: string
}

interface Props {
  quotas?: {
    pipelines: number
    knowledge_sources: number
    chunks: number
    runs_this_month: number
    resets_at: string
  }
}

export function UsageQuotas({ quotas }: Props) {
  const resetDate = quotas?.resets_at
    ? new Date(quotas.resets_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null

  const rows: QuotaRow[] = quotas
    ? [
        { label: 'Pipelines created', used: quotas.pipelines, limit: 'Unlimited' },
        { label: 'Knowledge sources', used: quotas.knowledge_sources, limit: 'Unlimited' },
        { label: 'Chunks indexed', used: quotas.chunks, limit: 'Unlimited', unit: 'chunks' },
        { label: 'Runs this month', used: quotas.runs_this_month, limit: 'Unlimited' },
      ]
    : []

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-zinc-200">Usage Quotas</h2>
        {resetDate && <p className="text-xs text-zinc-500">Resets {resetDate}</p>}
      </div>

      {!quotas ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-40 bg-zinc-800" />
              <Skeleton className="h-4 w-24 bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/60">
          {rows.map(({ label, used, limit, unit }) => (
            <div key={label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <span className="text-sm text-zinc-400">{label}</span>
              <div className="text-right">
                <span className="text-sm font-medium text-zinc-200 tabular-nums">
                  {used.toLocaleString()}{unit ? ` ${unit}` : ''}
                </span>
                <span className="text-xs text-zinc-500 ml-2">{limit}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
