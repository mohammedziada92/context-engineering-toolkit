export function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
        <div className="space-y-1.5">
          <div className="h-5 w-28 rounded bg-zinc-800" />
          <div className="h-3 w-52 rounded bg-zinc-800" />
        </div>
        <div className="h-8 w-44 rounded-lg bg-zinc-800" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-zinc-900" />
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-[268px] rounded-xl bg-zinc-900" />
          <div className="h-[268px] rounded-xl bg-zinc-900" />
        </div>

        {/* Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-[200px] rounded-xl bg-zinc-900" />
          <div className="h-[200px] rounded-xl bg-zinc-900" />
        </div>

        {/* Run history */}
        <div className="h-[300px] rounded-xl bg-zinc-900" />
      </div>
    </div>
  )
}
