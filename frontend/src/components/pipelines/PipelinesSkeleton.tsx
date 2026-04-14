import { Skeleton } from '@/components/ui/skeleton'

export function PipelinesSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-32 bg-zinc-800" />
            <Skeleton className="h-4 w-20 bg-zinc-800" />
          </div>
          <Skeleton className="h-9 w-36 rounded-md bg-zinc-800" />
        </div>

        {/* Toolbar */}
        <div className="flex gap-3">
          <Skeleton className="h-9 flex-1 bg-zinc-800 rounded-md" />
          <Skeleton className="h-9 w-32 bg-zinc-800 rounded-md" />
          <Skeleton className="h-9 w-36 bg-zinc-800 rounded-md" />
          <Skeleton className="h-9 w-20 bg-zinc-800 rounded-md" />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg bg-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  )
}
