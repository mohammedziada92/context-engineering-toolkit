export function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
        <div className="space-y-1.5">
          <div className="h-5 w-36 rounded bg-zinc-800" />
          <div className="h-3 w-28 rounded bg-zinc-800" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-zinc-900" />
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-zinc-900" />
          ))}
        </div>

        {/* Runs + Pipelines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-56 rounded-xl bg-zinc-900" />
          <div className="h-56 rounded-xl bg-zinc-900" />
        </div>

        {/* Sources */}
        <div className="h-40 rounded-xl bg-zinc-900" />
      </div>
    </div>
  )
}
