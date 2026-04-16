'use client'

import { usePathname } from 'next/navigation'
import { Menu, Layers } from 'lucide-react'

// Map path prefixes to page titles for the mobile header
const ROUTE_TITLES: [string, string][] = [
  ['/dashboard',  'Dashboard'],
  ['/pipelines',  'Pipelines'],
  ['/knowledge',  'Knowledge Base'],
  ['/analytics',  'Analytics'],
  ['/settings',   'Settings'],
]

interface Props {
  onMenuClick: () => void
}

export function MobileNav({ onMenuClick }: Props) {
  const pathname = usePathname()

  const title = ROUTE_TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? 'CET'

  return (
    <header className="flex items-center gap-3 px-4 h-14 border-b border-zinc-800 lg:hidden shrink-0">
      <button
        onClick={onMenuClick}
        className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded-md bg-violet-600 flex items-center justify-center">
          <Layers className="h-3 w-3 text-white" />
        </div>
        <span className="text-sm font-semibold text-zinc-100">{title}</span>
      </div>
    </header>
  )
}
