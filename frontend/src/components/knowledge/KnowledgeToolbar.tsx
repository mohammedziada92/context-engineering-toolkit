'use client'

import { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input }  from '@/components/ui/input'
import type { KnowledgeSourceStatus } from '@/lib/api/knowledge'

interface Props {
  search:   string
  status:   KnowledgeSourceStatus | ''
  onSearch: (q: string) => void
  onStatus: (s: KnowledgeSourceStatus | '') => void
}

export function KnowledgeToolbar({ search, status, onSearch, onStatus }: Props) {
  const [localSearch, setLocalSearch] = useState(search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setLocalSearch(search) }, [search])

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setLocalSearch(val)
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
          value={localSearch}
          onChange={handleSearch}
          placeholder="Search knowledge sources…"
          className="pl-8 bg-zinc-900 border-zinc-800 text-zinc-200 text-xs h-8"
        />
      </div>

      {/* Status filter */}
      <select
        value={status || 'all'}
        onChange={(e) => onStatus(e.target.value === 'all' ? '' : e.target.value as KnowledgeSourceStatus)}
        className="select-native w-[140px]"
      >
        <option value="all">All statuses</option>
        <option value="ready">Ready</option>
        <option value="processing">Processing</option>
        <option value="pending">Pending</option>
        <option value="error">Error</option>
      </select>
    </div>
  )
}
