'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  listPipelines,
  patchPipeline,
  deletePipeline,
  duplicatePipeline,
  type Pipeline,
  type PipelineStatus,
} from '@/lib/api/pipelines'
import { PipelinesToolbar } from './PipelinesToolbar'
import { PipelineCard } from './PipelineCard'
import { PipelineListRow } from './PipelineListRow'
import { RunModal } from './RunModal'
import { PipelineDeleteDialog } from './PipelineDeleteDialog'
import { EmptyPipelines } from './EmptyPipelines'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

const PAGE_LIMIT = 12
const VIEW_KEY = 'cet:pipeline-view'

type ViewMode = 'grid' | 'list'

export function PipelinesPageContent() {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()
  const qc          = useQueryClient()

  // --- URL-synced toolbar state ---
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [status, setStatus] = useState<PipelineStatus | ''>(
    (searchParams.get('status') as PipelineStatus | '') ?? ''
  )
  const [sort, setSort]   = useState(searchParams.get('sort') ?? 'updated_at')
  const [page, setPage]   = useState(Number(searchParams.get('page') ?? 1))
  const [view, setView]   = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(VIEW_KEY) as ViewMode) ?? 'grid'
    }
    return 'grid'
  })

  // --- Modals ---
  const [runTarget,    setRunTarget]    = useState<Pipeline | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Pipeline | null>(null)

  // Sync URL params
  const pushParams = useCallback(
    (overrides: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString())
      Object.entries(overrides).forEach(([k, v]) => {
        v ? next.set(k, v) : next.delete(k)
      })
      router.replace(`${pathname}?${next}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  useEffect(() => { if (view) localStorage.setItem(VIEW_KEY, view) }, [view])

  // --- Data ---
  const { data, isLoading } = useQuery({
    queryKey: ['pipelines', { search, status, sort, page }],
    queryFn: () => listPipelines({ page, limit: PAGE_LIMIT, status, search }),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  })

  const pipelines  = useMemo(() => {
    const list = [...(data?.items ?? [])]
    switch (sort) {
      case 'name':
        return list.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base', numeric: true }))
      case 'created_at':
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'run_count':
        return list.sort((a, b) => (b.run_count ?? 0) - (a.run_count ?? 0))
      case 'updated_at':
      default:
        return list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    }
  }, [data?.items, sort])
  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_LIMIT)

  // --- Mutations ---
  const { mutate: doDelete, isPending: deleting } = useMutation({
    mutationFn: (id: string) => deletePipeline(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipelines'] })
      toast.success('Pipeline deleted')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Failed to delete pipeline'),
  })

  const { mutate: doDuplicate } = useMutation({
    mutationFn: (id: string) => duplicatePipeline(id),
    onSuccess: (copy) => {
      qc.invalidateQueries({ queryKey: ['pipelines'] })
      toast.success('Pipeline duplicated', {
        action: { label: 'Edit', onClick: () => router.push(`/pipelines/${copy.id}`) },
      })
    },
    onError: () => toast.error('Failed to duplicate pipeline'),
  })

  const { mutate: doToggleStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PipelineStatus }) =>
      patchPipeline(id, { status }),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['pipelines'] })
      toast.success(`Pipeline set to ${status === 'active' ? 'Active' : 'Draft'}`)
    },
    onError: () => toast.error('Failed to update status'),
  })

  function handleStatusToggle(p: Pipeline) {
    if (!p.id) return
    const next: PipelineStatus = p.status === 'active' ? 'draft' : 'active'
    doToggleStatus({ id: p.id, status: next })
  }

  // --- Handlers ---
  function handleSearchChange(v: string) {
    setSearch(v); setPage(1)
    pushParams({ search: v, page: '' })
  }
  function handleStatusChange(v: string) {
    setStatus(v as PipelineStatus | ''); setPage(1)
    pushParams({ status: v, page: '' })
  }
  function handleSortChange(v: string) {
    setSort(v); setPage(1)
    pushParams({ sort: v, page: '' })
  }
  function handlePageChange(p: number) {
    setPage(p)
    pushParams({ page: String(p) })
  }

  return (
    <TooltipProvider>
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1200px] mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">Pipelines</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {data?.total ?? 0} pipeline{(data?.total ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            onClick={() => router.push('/pipelines/new')}
            className="bg-violet-600 hover:bg-violet-500 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            New Pipeline
          </Button>
        </div>

        {/* Toolbar */}
        <PipelinesToolbar
          search={search}
          status={status}
          sort={sort}
          view={view}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          onSortChange={handleSortChange}
          onViewChange={setView}
        />

        {/* Content */}
        {isLoading ? (
          <PipelinesLoadingGrid view={view} />
        ) : pipelines.length === 0 ? (
          <EmptyPipelines hasFilters={!!(search || status)} />
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {pipelines.map((p) => (
              <PipelineCard
                key={p.id}
                pipeline={p}
                onRun={() => setRunTarget(p)}
                onEdit={() => router.push(`/pipelines/${p.id}`)}
                onDuplicate={() => doDuplicate(p.id)}
                onDelete={() => setDeleteTarget(p)}
                onStatusToggle={() => handleStatusToggle(p)}
              />
            ))}
            {/* New Pipeline dashed card */}
            <button
              onClick={() => router.push('/pipelines/new')}
              className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 p-6 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 hover:border-violet-700 transition-colors min-h-[160px]"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">New Pipeline</span>
            </button>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-left">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium text-right">Runs</th>
                  <th className="px-4 py-3 font-medium text-right">Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {pipelines.map((p) => (
                  <PipelineListRow
                    key={p.id}
                    pipeline={p}
                    onRun={() => setRunTarget(p)}
                    onEdit={() => router.push(`/pipelines/${p.id}`)}
                    onDuplicate={() => doDuplicate(p.id)}
                    onDelete={() => setDeleteTarget(p)}
                    onStatusToggle={() => handleStatusToggle(p)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => page > 1 && handlePageChange(page - 1)}
                    className={page <= 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                  />
                </PaginationItem>
                <PaginationItem className="text-sm text-zinc-400 flex items-center px-3">
                  Page {page} of {totalPages}
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => page < totalPages && handlePageChange(page + 1)}
                    className={page >= totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Modals */}
      {runTarget && (
        <RunModal pipeline={runTarget} onClose={() => setRunTarget(null)} />
      )}
      {deleteTarget && (
        <PipelineDeleteDialog
          pipeline={deleteTarget}
          deleting={deleting}
          onConfirm={() => doDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
    </TooltipProvider>
  )
}

function PipelinesLoadingGrid({ view }: { view: ViewMode }) {
  if (view === 'list') {
    return (
      <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-zinc-800 last:border-0">
            <div className="h-4 bg-zinc-800 rounded w-48" />
            <div className="h-4 bg-zinc-800 rounded w-16" />
            <div className="h-4 bg-zinc-800 rounded w-32" />
            <div className="h-4 bg-zinc-800 rounded w-10 ml-auto" />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 h-40 animate-pulse">
          <div className="h-4 bg-zinc-800 rounded w-3/4 mb-3" />
          <div className="h-3 bg-zinc-800 rounded w-1/2 mb-6" />
          <div className="h-3 bg-zinc-800 rounded w-1/3" />
        </div>
      ))}
    </div>
  )
}
