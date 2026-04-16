'use client'

import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { type Pipeline } from '@/lib/api/pipelines'

interface Props {
  pipeline: Pipeline
  deleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function PipelineDeleteDialog({ pipeline, deleting, onConfirm, onCancel }: Props) {
  return (
    <AlertDialog open onOpenChange={(open: boolean) => !open && onCancel()}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{pipeline.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            This will also delete all run history for this pipeline.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel}
            className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={onConfirm}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-500 text-white"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Delete Pipeline
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
