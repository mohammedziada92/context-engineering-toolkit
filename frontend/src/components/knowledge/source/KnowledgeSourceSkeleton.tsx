export function KnowledgeSourceSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-pulse">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800">
        <div className="h-7 w-7 rounded bg-zinc-800" />
        <div className="h-4 w-48 rounded bg-zinc-800" />
        <div className="h-5 w-16 rounded-full bg-zinc-800 ml-2" />
      </div>
      {/* Meta */}
      <div className="grid grid-cols-4 gap-px border-b border-zinc-800 bg-zinc-800">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-zinc-950 px-5 py-3 space-y-1.5">
            <div className="h-2.5 w-16 rounded bg-zinc-800" />
            <div className="h-5 w-12 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
      {/* Tabs */}
      <div className="flex gap-4 px-6 border-b border-zinc-800 py-2.5">
        {[80, 60, 80].map((w, i) => (
          <div key={i} className={`h-3 w-${w} rounded bg-zinc-800`} />
        ))}
      </div>
      {/* Content */}
      <div className="px-6 py-5 space-y-3 max-w-2xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-zinc-900" />
        ))}
      </div>
    </div>
  )
}
