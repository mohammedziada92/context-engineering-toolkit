export function CanvasPreview() {
  return (
    <div className="relative h-72 bg-zinc-950 overflow-hidden select-none" aria-hidden>
      {/* Dot grid background */}
      <svg className="absolute inset-0 h-full w-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#52525b" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Pipeline nodes */}
      <div className="absolute inset-0 flex items-center justify-center gap-4 px-8">

        {/* User Message Node */}
        <div className="flex flex-col rounded-lg border border-zinc-700 bg-zinc-900 w-36 overflow-hidden shadow-lg">
          <div className="bg-violet-600/80 px-3 py-1.5 text-xs font-medium text-white flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
            User Message
          </div>
          <div className="px-3 py-2">
            <p className="text-xs text-zinc-400 truncate">What is RAG?</p>
          </div>
          <div className="flex justify-end px-2 pb-2">
            <div className="h-2 w-2 rounded-full border border-zinc-600 bg-zinc-800" />
          </div>
        </div>

        {/* Arrow */}
        <svg width="32" height="16" viewBox="0 0 32 16" className="text-violet-500 shrink-0">
          <path d="M0 8 H28 M22 2 L30 8 L22 14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Vector Search Node */}
        <div className="flex flex-col rounded-lg border border-zinc-700 bg-zinc-900 w-40 overflow-hidden shadow-lg">
          <div className="bg-emerald-700/80 px-3 py-1.5 text-xs font-medium text-white flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
            Vector Search
          </div>
          <div className="px-3 py-2 space-y-1">
            <p className="text-xs text-zinc-400">KB: product-docs</p>
            <p className="text-xs text-zinc-500">Top K: 5 · 0.75</p>
          </div>
          <div className="flex justify-between px-2 pb-2">
            <div className="h-2 w-2 rounded-full border border-zinc-600 bg-zinc-800" />
            <div className="h-2 w-2 rounded-full border border-zinc-600 bg-zinc-800" />
          </div>
        </div>

        {/* Arrow */}
        <svg width="32" height="16" viewBox="0 0 32 16" className="text-violet-500 shrink-0">
          <path d="M0 8 H28 M22 2 L30 8 L22 14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* LLM Model Node */}
        <div className="flex flex-col rounded-lg border border-violet-600/60 bg-zinc-900 w-40 overflow-hidden shadow-lg shadow-violet-900/20">
          <div className="bg-violet-600/80 px-3 py-1.5 text-xs font-medium text-white flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
            LLM Model
          </div>
          <div className="px-3 py-2 space-y-1">
            <p className="text-xs text-zinc-300">claude-sonnet-4.6</p>
            <p className="text-xs text-zinc-500">Temp 0.7 · 2048</p>
          </div>
          <div className="flex justify-between px-2 pb-2">
            <div className="h-2 w-2 rounded-full border border-violet-600/60 bg-zinc-800" />
            <div className="h-2 w-2 rounded-full border border-violet-600/60 bg-zinc-800" />
          </div>
        </div>

        {/* Arrow */}
        <svg width="32" height="16" viewBox="0 0 32 16" className="text-violet-500 shrink-0">
          <path d="M0 8 H28 M22 2 L30 8 L22 14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Output Node */}
        <div className="flex flex-col rounded-lg border border-zinc-700 bg-zinc-900 w-36 overflow-hidden shadow-lg">
          <div className="bg-zinc-700/80 px-3 py-1.5 text-xs font-medium text-zinc-200 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            Output
          </div>
          <div className="px-3 py-2">
            <p className="text-xs text-zinc-400 truncate">Markdown</p>
          </div>
          <div className="flex justify-start px-2 pb-2">
            <div className="h-2 w-2 rounded-full border border-zinc-600 bg-zinc-800" />
          </div>
        </div>
      </div>

      {/* Token Budget Bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1">
        <span className="text-xs text-zinc-500">Token Budget</span>
        <div className="flex gap-0.5 ml-2">
          <div className="h-2 w-12 rounded-sm bg-blue-500/70" title="System Prompt" />
          <div className="h-2 w-20 rounded-sm bg-emerald-500/70" title="RAG" />
          <div className="h-2 w-10 rounded-sm bg-amber-500/70" title="History" />
          <div className="h-2 w-24 rounded-sm bg-zinc-700" title="Remaining" />
        </div>
        <span className="text-xs text-zinc-500 ml-1">2,500 / 997,952</span>
      </div>

      {/* Fade overlay bottom */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-linear-to-t from-zinc-900 to-transparent" />
    </div>
  )
}
