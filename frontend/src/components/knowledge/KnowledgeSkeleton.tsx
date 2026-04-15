export function KnowledgeSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
        <div className="space-y-1.5">
          <div className="h-5 w-44 rounded bg-zinc-800" />
          <div className="h-3 w-60 rounded bg-zinc-800" />
        </div>
        <div className="h-7 w-24 rounded-md bg-zinc-800" />
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 px-6 py-3 border-b border-zinc-800">
        <div className="h-8 flex-1 max-w-sm rounded-md bg-zinc-800" />
        <div className="h-8 w-36 rounded-md bg-zinc-800" />
      </div>

      {/* Grid */}
      <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 rounded-xl bg-zinc-900" />
        ))}
      </div>
    </div>
  )
}
