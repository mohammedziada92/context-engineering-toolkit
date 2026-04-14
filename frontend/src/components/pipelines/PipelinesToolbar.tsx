'use client'

import { useEffect, useRef } from 'react'
import { Search, LayoutGrid, List } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
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
          defaultValue={search}
          onChange={handleSearch}
          placeholder="Search pipelines..."
          className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-violet-500/30"
        />
      </div>

      {/* Status filter */}
      <Select value={status || 'all'} onValueChange={(v) => onStatusChange(v === 'all' ? '' : v)}>
        <SelectTrigger className="w-[130px] bg-zinc-900 border-zinc-800 text-zinc-300">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-800">
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={sort} onValueChange={onSortChange}>
        <SelectTrigger className="w-[150px] bg-zinc-900 border-zinc-800 text-zinc-300">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-800">
          <SelectItem value="updated_at">Last Updated</SelectItem>
          <SelectItem value="created_at">Date Created</SelectItem>
          <SelectItem value="name">Name A–Z</SelectItem>
          <SelectItem value="run_count">Most Runs</SelectItem>
        </SelectContent>
      </Select>

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
