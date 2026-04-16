import Link from 'next/link'
import { GitBranch, Plus } from 'lucide-react'

export function EmptyPipelines({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <GitBranch className="h-10 w-10 text-zinc-700" />
        <h3 className="text-base font-medium text-zinc-300">No pipelines match your filters</h3>
        <p className="text-sm text-zinc-500">Try a different search term or status filter.</p>
      </div>
    )
  }

  return (
    <div className="mt-16 flex flex-col items-center gap-4 text-center">
      <div className="rounded-full bg-zinc-800/80 p-5">
        <GitBranch className="h-10 w-10 text-zinc-500" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-medium text-zinc-200">No pipelines yet</h3>
        <p className="text-sm text-zinc-500 max-w-xs">
          Build your first RAG pipeline visually — no code required.
        </p>
      </div>
      <Link
        href="/pipelines/new"
        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-2.5 py-1.5 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Create Pipeline
      </Link>
    </div>
  )
}
