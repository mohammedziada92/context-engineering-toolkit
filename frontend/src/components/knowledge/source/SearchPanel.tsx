'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Loader2 } from 'lucide-react'
import { Button }  from '@/components/ui/button'
import { Input }   from '@/components/ui/input'
import { Badge }   from '@/components/ui/badge'
import { Slider }  from '@/components/ui/slider'
import { searchChunks, type Chunk } from '@/lib/api/knowledge'

function similarityColor(score: number): string {
  if (score >= 0.90) return 'bg-emerald-500/10 text-emerald-400 border-transparent'
  if (score >= 0.75) return 'bg-blue-500/10 text-blue-400 border-transparent'
  return 'bg-zinc-800 text-zinc-400 border-transparent'
}

export function SearchPanel({ sourceId }: { sourceId: string }) {
  const [query,    setQuery]    = useState('')
  const [topK,     setTopK]     = useState(5)
  const [thresh,   setThresh]   = useState(0.50)
  const [searched, setSearched] = useState(false)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', sourceId, query, topK, thresh],
    queryFn: () =>
      searchChunks(sourceId, {
        query,
        top_k: topK,
        threshold: thresh,
      }),
    enabled: searched && query.trim().length > 0,
    staleTime: 30_000,
  })

  const results: Chunk[] = data?.results ?? []
  const latency   = data?.latency_ms
  const queryToks = data?.query_tokens

  function handleSearch() {
    if (!query.trim()) return
    setSearched(true)
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Query row */}
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSearched(false) }}
          placeholder="Semantic search query…"
          className="bg-zinc-900 border-zinc-800 text-zinc-200 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          size="sm"
          onClick={handleSearch}
          disabled={isFetching || !query.trim()}
          className="bg-violet-600 hover:bg-violet-500 text-white shrink-0"
        >
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xs text-zinc-500 shrink-0 w-12">Top K</span>
          <Slider
            value={[topK]}
            onValueChange={([v]) => setTopK(v)}
            min={1}
            max={20}
            step={1}
            className="flex-1"
          />
          <span className="text-xs text-zinc-400 tabular-nums w-6 text-right">{topK}</span>
        </div>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xs text-zinc-500 shrink-0 w-16">Threshold</span>
          <Slider
            value={[thresh]}
            onValueChange={([v]) => setThresh(v)}
            min={0.50}
            max={1.00}
            step={0.01}
            className="flex-1"
          />
          <span className="text-xs text-zinc-400 tabular-nums w-10 text-right">{thresh.toFixed(2)}</span>
        </div>
      </div>

      {/* Meta */}
      {data && (
        <div className="flex items-center gap-4 text-[10px] text-zinc-600">
          {latency != null && <span>{latency.toFixed(0)} ms</span>}
          {queryToks != null && <span>{queryToks} query tokens</span>}
          <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Loading */}
      {isFetching && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
        </div>
      )}

      {/* Results */}
      {!isFetching && searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-8 w-8 text-zinc-700 mb-3" />
          <p className="text-sm font-medium text-zinc-400">No results</p>
          <p className="text-xs text-zinc-600 mt-1">Try a different query or lower the threshold</p>
        </div>
      )}

      {!isFetching && results.length > 0 && (
        <div className="space-y-2">
          {results.map((r, i) => (
            <div
              key={i}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-zinc-300 leading-relaxed flex-1">{r.content}</p>
                <Badge
                  variant="outline"
                  className={`text-[10px] h-5 shrink-0 tabular-nums ${similarityColor(r.similarity ?? 0)}`}
                >
                  {((r.similarity ?? 0) * 100).toFixed(1)}%
                </Badge>
              </div>
              {r.metadata && Object.keys(r.metadata).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {Object.entries(r.metadata).slice(0, 4).map(([k, v]) => (
                    <Badge key={k} variant="outline" className="text-[9px] border-zinc-700 text-zinc-500 h-4 px-1.5">
                      {k}: {String(v).slice(0, 24)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Initial state */}
      {!searched && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-8 w-8 text-zinc-700 mb-3" />
          <p className="text-sm font-medium text-zinc-400">Test semantic search</p>
          <p className="text-xs text-zinc-600 mt-1">
            Enter a query and press Search to find similar chunks
          </p>
        </div>
      )}
    </div>
  )
}
