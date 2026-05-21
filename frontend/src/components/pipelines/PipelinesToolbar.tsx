'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, LayoutGrid, List } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Props {
  search: string
  status: string
  sort: string
  view: 'grid' | 'list'
  onSearchChange: (v: string) => void
  onStatusChange: (v: string) => void
  onSortChange: (v: string) => void
  onViewChange: (v: 'grid' | 'list') => void
}

export function PipelinesToolbar({
  search, status, sort, view,
  onSearchChange, onStatusChange, onSortChange, onViewChange,
}: Props) {
  const [localSearch, setLocalSearch] = useState(search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync when parent resets search (e.g. clear)
  useEffect(() => { setLocalSearch(search) }, [search])

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setLocalSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onSearchChange(val), 300)
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          value={localSearch}
          onChange={handleSearch}
          placeholder="Search pipelines..."
          className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-violet-500/30"
        />
      </div>

      {/* Status filter */}
      <select
        value={status || 'all'}
        onChange={(e) => onStatusChange(e.target.value === 'all' ? '' : e.target.value)}
        className="flex h-9 w-[130px] items-center rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-sm text-zinc-300 outline-none focus-visible:border-violet-500/50 focus-visible:ring-2 focus-visible:ring-violet-500/20 cursor-pointer appearance-none"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="draft">Draft</option>
      </select>

      {/* Sort */}
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        className="flex h-9 w-[150px] items-center rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-sm text-zinc-300 outline-none focus-visible:border-violet-500/50 focus-visible:ring-2 focus-visible:ring-violet-500/20 cursor-pointer appearance-none"
      >
        <option value="updated_at">Last Updated</option>
        <option value="created_at">Date Created</option>
        <option value="name">Name A–Z</option>
        <option value="run_count">Most Runs</option>
      </select>

      {/* View toggle */}
      <div className="flex rounded-md border border-zinc-800 overflow-hidden">
        {(['grid', 'list'] as const).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={cn(
              'p-2 transition-colors',
              view === v
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            )}
            aria-label={v === 'grid' ? 'Grid view' : 'List view'}
          >
            {v === 'grid' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </button>
        ))}
      </div>
    </div>
  )
}
