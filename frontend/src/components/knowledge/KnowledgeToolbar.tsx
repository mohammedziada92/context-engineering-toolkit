'use client'

import { useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input }  from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { KnowledgeSourceStatus } from '@/lib/api/knowledge'

interface Props {
  search:   string
  status:   KnowledgeSourceStatus | ''
  onSearch: (q: string) => void
  onStatus: (s: KnowledgeSourceStatus | '') => void
}

export function KnowledgeToolbar({ search, status, onSearch, onStatus }: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onSearch(val), 300)
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-zinc-800 bg-zinc-950">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
        <Input
          defaultValue={search}
          onChange={handleSearch}
          placeholder="Search knowledge sources…"
          className="pl-8 bg-zinc-900 border-zinc-800 text-zinc-200 text-xs h-8"
        />
      </div>

      {/* Status filter */}
      <Select value={status || 'all'} onValueChange={(v) => onStatus(v === 'all' ? '' : v as KnowledgeSourceStatus)}>
        <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800 text-zinc-300 text-xs h-8">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-800">
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="ready">Ready</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="error">Error</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
