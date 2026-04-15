import { Database, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  filtered: boolean
  onNew:    () => void
}

export function EmptyKnowledge({ filtered, onNew }: Props) {
  if (filtered) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Database className="h-10 w-10 text-zinc-700 mb-4" />
        <p className="text-sm font-medium text-zinc-400">No sources match your filters</p>
        <p className="text-xs text-zinc-600 mt-1">Try adjusting the search or status filter</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-14 w-14 rounded-2xl bg-emerald-600/10 flex items-center justify-center mb-5">
        <Database className="h-7 w-7 text-emerald-500" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-200 mb-1">No knowledge sources yet</h3>
      <p className="text-xs text-zinc-500 max-w-xs leading-relaxed mb-6">
        Create a knowledge source, ingest your documents, and connect it to a RAG pipeline node.
      </p>
      <Button
        size="sm"
        className="bg-violet-600 hover:bg-violet-500 text-white gap-1.5 text-xs"
        onClick={onNew}
      >
        <Plus className="h-3.5 w-3.5" />
        New Knowledge Source
      </Button>
    </div>
  )
}
