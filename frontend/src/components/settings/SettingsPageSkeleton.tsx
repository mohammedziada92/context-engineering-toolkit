import { Skeleton } from '@/components/ui/skeleton'

export function SettingsPageSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[680px] mx-auto px-6 py-8 space-y-8">
        <div className="space-y-1">
          <Skeleton className="h-7 w-32 bg-zinc-800" />
          <Skeleton className="h-4 w-48 bg-zinc-800" />
        </div>
        <div className="flex gap-1 border-b border-zinc-800 pb-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 bg-zinc-800 rounded-none" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl bg-zinc-800" />
        ))}
      </div>
    </div>
  )
}
