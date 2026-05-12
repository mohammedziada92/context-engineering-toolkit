'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Database, RefreshCw } from 'lucide-react'
import { Button }  from '@/components/ui/button'
import { Badge }   from '@/components/ui/badge'
import {
  getKnowledgeSource,
  deleteKnowledgeSource,
  type KnowledgeSourceStatus,
} from '@/lib/api/knowledge'
import { IngestPanel }     from './IngestPanel'
import { ChunksPanel }     from './ChunksPanel'
import { SearchPanel }     from './SearchPanel'
import { SourceMetaCard }  from './SourceMetaCard'
import { KnowledgeDeleteDialog } from '../KnowledgeDeleteDialog'

const STATUS_COLORS: Record<KnowledgeSourceStatus, string> = {
  ready:      'bg-emerald-500/10 text-emerald-400 border-transparent',
  processing: 'bg-blue-500/10 text-blue-400 border-transparent',
  pending:    'bg-zinc-800 text-zinc-400 border-transparent',
  error:      'bg-red-500/10 text-red-400 border-transparent',
}

type Tab = 'ingest' | 'chunks' | 'search'

export function KnowledgeSourceContent({ id }: { id: string }) {
  const router = useRouter()
  const qc     = useQueryClient()
  const [tab,         setTab]         = useState<Tab>('ingest')
  const [deleteOpen,  setDeleteOpen]  = useState(false)

  const { data: source, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['knowledge-source', id],
    queryFn:  () => getKnowledgeSource(id),
    staleTime: 15_000,
    refetchInterval: (query) =>
      query.state.data?.status === 'processing' ? 3_000 : false,
  })

  const { mutate: doDelete, isPending: deleting } = useMutation({
    mutationFn: () => deleteKnowledgeSource(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge'] })
      toast.success('Knowledge source deleted')
      router.push('/knowledge')
    },
    onError: () => toast.error('Failed to delete knowledge source'),
  })

  if (isLoading || !source) return null  // Suspense fallback handles loading

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800">
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 text-zinc-400 hover:text-zinc-200"
          onClick={() => router.push('/knowledge')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Database className="h-4 w-4 text-emerald-400 shrink-0" />
          <h1 className="text-sm font-semibold text-zinc-100 truncate">{source.name}</h1>
          <Badge
            variant="outline"
            className={`text-[10px] h-5 gap-1 px-2 shrink-0 ${STATUS_COLORS[source.status]}`}
          >
            {source.status === 'processing' && (
              <RefreshCw className="h-2.5 w-2.5 animate-spin" />
            )}
            {source.status.charAt(0).toUpperCase() + source.status.slice(1)}
          </Badge>
        </div>

        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 text-zinc-400 hover:text-zinc-200"
          onClick={() => {
            refetch()
            qc.invalidateQueries({ queryKey: ['chunks', id] })
          }}
          title="Refresh"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>

        <Button
          variant="outline" size="sm"
          className="h-7 text-xs border-zinc-700 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          onClick={() => setDeleteOpen(true)}
        >
          Delete
        </Button>
      </div>

      {/* Meta card */}
      <SourceMetaCard source={source} />

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 px-6">
        {(['ingest', 'chunks', 'search'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`
              px-4 py-2.5 text-xs font-medium capitalize transition-colors border-b-2
              ${tab === t
                ? 'text-violet-400 border-violet-500'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'}
            `}
          >
            {t === 'ingest' ? 'Add Content' : t === 'chunks' ? 'Chunks' : 'Test Search'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {tab === 'ingest' && <IngestPanel sourceId={id} />}
        {tab === 'chunks' && <ChunksPanel sourceId={id} chunkCount={source.chunk_count} />}
        {tab === 'search' && <SearchPanel sourceId={id} />}
      </div>

      {/* Delete dialog */}
      {deleteOpen && (
        <KnowledgeDeleteDialog
          source={source}
          deleting={deleting}
          onConfirm={() => doDelete()}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </div>
  )
}
