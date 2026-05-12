'use client'

import { Loader2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog'
import type { KnowledgeSource } from '@/lib/api/knowledge'

interface Props {
  source:    KnowledgeSource
  deleting:  boolean
  onConfirm: () => void
  onCancel:  () => void
}

export function KnowledgeDeleteDialog({ source, deleting, onConfirm, onCancel }: Props) {
  return (
    <AlertDialog open onOpenChange={(open: boolean) => { if (!open) onCancel() }}>
      <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">Delete &quot;{source.name}&quot;?</AlertDialogTitle>
          <div className="text-zinc-400 text-sm space-y-2">
            <AlertDialogDescription className="block">
              This will permanently delete:
            </AlertDialogDescription>
            <ul className="list-disc list-inside text-xs space-y-1 text-zinc-500">
              <li>All {(source.chunk_count ?? 0).toLocaleString()} stored chunks</li>
              <li>All {(source.document_count ?? 0).toLocaleString()} ingested documents</li>
              <li>All pgvector embeddings for this source</li>
              <li>Any pipeline references to this source</li>
            </ul>
            <span className="block text-xs text-red-400 mt-2">This cannot be undone.</span>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel}
            className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-500 text-white"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {deleting ? 'Deleting…' : 'Delete Source'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
