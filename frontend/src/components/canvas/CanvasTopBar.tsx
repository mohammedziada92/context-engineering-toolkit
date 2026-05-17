'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Save, Play, Loader2, MoreHorizontal, AlertTriangle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Badge }  from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { usePipelineStore, validatePipeline } from '@/stores/pipeline.store'
import { toast } from 'sonner'

interface Props {
  onSave:      () => Promise<void>
  onRun:       () => void
  onDuplicate: () => void
  onDelete:    () => void
  onExport:    () => void
  onNameChange?: (name: string) => Promise<void>
  showHistory?: boolean
}

export function CanvasTopBar({
  onSave, onRun, onDuplicate, onDelete, onExport, onNameChange, showHistory,
}: Props) {
  const router = useRouter()
  const pipelineName    = usePipelineStore((s) => s.pipelineName)
  const setPipelineName = usePipelineStore((s) => s.setPipelineName)
  const status          = usePipelineStore((s) => s.status)
  const isDirty         = usePipelineStore((s) => s.isDirty)
  const isSaving        = usePipelineStore((s) => s.isSaving)
  const nodes           = usePipelineStore((s) => s.nodes)
  const edges           = usePipelineStore((s) => s.edges)

  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(pipelineName)
  const [discardOpen, setDiscardOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editingName) { setDraftName(pipelineName); inputRef.current?.select() } }, [editingName, pipelineName])

  // Ctrl+S / Cmd+S save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        onSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onSave])

  function handleRunClick() {
    const issues = validatePipeline(nodes, edges)
    if (issues.length > 0) {
      const hasErrors = issues.some((i) => i.severity === 'error')

      // Show each issue as a separate toast with its severity icon
      for (const issue of issues) {
        const icon = issue.severity === 'error'
          ? <XCircle className="h-4 w-4 text-red-400 shrink-0" />
          : <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />

        if (issue.severity === 'error') {
          toast.error(issue.message, { icon })
        } else {
          toast.warning(issue.message, { icon })
        }
      }

      // Only block run if there are errors
      if (hasErrors) return
    }
    onRun()
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950">
      {/* Back */}
      <Button
        variant="ghost" size="icon"
        className="h-7 w-7 text-zinc-400 hover:text-zinc-200"
        onClick={() => {
          if (isDirty) {
            setDiscardOpen(true)
          } else {
            router.push('/pipelines')
          }
        }}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Pipeline name */}
      {editingName ? (
        <Input
          ref={inputRef}
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          className="h-7 w-56 bg-zinc-900 border-zinc-700 text-zinc-100 text-sm px-2"
          onBlur={() => {
            const newName = draftName || 'Untitled Pipeline'
            setPipelineName(newName)
            setEditingName(false)
            if (onNameChange) onNameChange(newName)
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        />
      ) : (
        <button
          onClick={() => setEditingName(true)}
          className="text-sm font-medium text-zinc-200 hover:text-white transition-colors"
        >
          {pipelineName}
        </button>
      )}

      {/* Dirty indicator */}
      {isDirty && !isSaving && (
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Unsaved changes" />
      )}

      {/* Status badge */}
      <Badge
        variant="outline"
        className={
          status === 'active'
            ? 'border-transparent bg-emerald-500/10 text-emerald-400 text-xs'
            : 'border-transparent bg-zinc-800 text-zinc-400 text-xs'
        }
      >
        {status === 'active' ? 'Active' : 'Draft'}
      </Badge>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Save */}
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs border-zinc-600 text-zinc-200 hover:bg-zinc-700 hover:text-white gap-1.5 disabled:opacity-40"
        onClick={onSave}
        disabled={!isDirty || isSaving}
      >
        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        {isSaving ? 'Saving…' : 'Save'}
      </Button>

      {/* Run */}
      <Button
        size="sm"
        className="h-7 text-xs bg-violet-600 hover:bg-violet-500 text-white gap-1.5"
        onClick={handleRunClick}
      >
        <Play className="h-3.5 w-3.5" />
        Run
      </Button>

      {/* More menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200 w-44">
          <DropdownMenuItem onClick={onDuplicate} className="gap-2 cursor-pointer hover:bg-zinc-800">
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExport} className="gap-2 cursor-pointer hover:bg-zinc-800">
            Export JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem
            onClick={onDelete}
            className="gap-2 cursor-pointer text-red-400 hover:bg-zinc-800 hover:text-red-300"
          >
            Delete Pipeline
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Unsaved changes dialog */}
      <AlertDialog open={discardOpen} onOpenChange={(open) => { if (!open) setDiscardOpen(false) }}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">You have unsaved changes</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-sm">
              Leaving will discard your changes to this pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              Keep editing
            </AlertDialogCancel>
            <button
              onClick={() => { setDiscardOpen(false); router.push('/pipelines') }}
              className="px-4 py-2 rounded-md border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
            >
              Leave anyway
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
