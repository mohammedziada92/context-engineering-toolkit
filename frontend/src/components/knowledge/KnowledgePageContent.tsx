'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  listKnowledgeSources,
  deleteKnowledgeSource,
  createKnowledgeSource,
  type KnowledgeSource,
  type KnowledgeSourceStatus,
} from '@/lib/api/knowledge'
import { KnowledgeToolbar }     from './KnowledgeToolbar'
import { KnowledgeSourceCard }  from './KnowledgeSourceCard'
import { KnowledgeDeleteDialog } from './KnowledgeDeleteDialog'
import { CreateSourceModal }    from './CreateSourceModal'
import { EmptyKnowledge }       from './EmptyKnowledge'
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination'

const PAGE_LIMIT = 12

export function KnowledgePageContent() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const qc           = useQueryClient()

  // URL-synced state
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [status, setStatus] = useState<KnowledgeSourceStatus | ''>(
    (searchParams.get('status') as KnowledgeSourceStatus | '') ?? ''
  )
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 1))

  // Modal state
  const [deleteTarget,  setDeleteTarget]  = useState<KnowledgeSource | null>(null)
  const [createOpen,    setCreateOpen]    = useState(false)

  // Push URL params
  const pushParams = useCallback(
    (overrides: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString())
      Object.entries(overrides).forEach(([k, v]) => v ? next.set(k, v) : next.delete(k))
      router.replace(`${pathname}?${next}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  // Query
  const { data, isLoading } = useQuery({
    queryKey: ['knowledge', { search, status, page }],
    queryFn:  () => listKnowledgeSources({ page, limit: PAGE_LIMIT, status, search }),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  })

  const sources    = data?.items ?? []
  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_LIMIT)

  // Mutations
  const { mutate: doDelete, isPending: deleting } = useMutation({
    mutationFn: (id: string) => deleteKnowledgeSource(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge'] })
      toast.success('Knowledge source deleted')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Failed to delete knowledge source'),
  })

  const { mutate: doCreate, isPending: creating } = useMutation({
    mutationFn: createKnowledgeSource,
    onSuccess: (source) => {
      qc.invalidateQueries({ queryKey: ['knowledge'] })
      toast.success('Knowledge source created')
      setCreateOpen(false)
      if (source?.id) router.push(`/knowledge/${source.id}`)
    },
    onError: () => toast.error('Failed to create knowledge source'),
  })

  // Toolbar handlers — sync to URL
  function handleSearch(q: string) {
    setSearch(q); setPage(1)
    pushParams({ search: q, page: '' })
  }
  function handleStatus(s: KnowledgeSourceStatus | '') {
    setStatus(s); setPage(1)
    pushParams({ status: s, page: '' })
  }
  function handlePage(p: number) {
    setPage(p)
    pushParams({ page: String(p) })
  }

  const isEmpty = !isLoading && sources.length === 0

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-400" />
            Knowledge Base
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage vector knowledge sources for RAG pipelines
          </p>
        </div>
        <Button
          size="sm"
          className="bg-violet-600 hover:bg-violet-500 text-white gap-1.5 text-xs"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          New Source
        </Button>
      </div>

      {/* Toolbar */}
      <KnowledgeToolbar
        search={search}
        status={status}
        onSearch={handleSearch}
        onStatus={handleStatus}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl bg-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyKnowledge filtered={!!(search || status)} onNew={() => setCreateOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.map((source) => (
              <KnowledgeSourceCard
                key={source.id}
                source={source}
                onOpen={() => { if (source?.id) router.push(`/knowledge/${source.id}`) }}
                onDelete={() => setDeleteTarget(source)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePage(Math.max(1, page - 1))}
                    aria-disabled={page <= 1}
                    className={page <= 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-3 py-1.5 text-xs text-zinc-400 tabular-nums">
                    {page} / {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePage(Math.min(totalPages, page + 1))}
                    aria-disabled={page >= totalPages}
                    className={page >= totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Modals */}
      {deleteTarget && (
        <KnowledgeDeleteDialog
          source={deleteTarget}
          deleting={deleting}
          onConfirm={() => doDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {createOpen && (
        <CreateSourceModal
          creating={creating}
          onCreate={doCreate}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  )
}
