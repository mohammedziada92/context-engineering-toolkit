'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Save, Play, Loader2, MoreHorizontal, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Badge }  from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePipelineStore, validatePipeline } from '@/stores/pipeline.store'
import { toast } from 'sonner'

interface Props {
  onSave:      () => Promise<void>
  onRun:       () => void
  onDuplicate: () => void
  onDelete:    () => void
  onExport:    () => void
  showHistory?: boolean
}

export function CanvasTopBar({
  onSave, onRun, onDuplicate, onDelete, onExport, showHistory,
}: Props) {
  const router = useRouter()
  const {
    pipelineName, setPipelineName,
    status, isDirty, isSaving,
    nodes, edges,
  } = usePipelineStore((s) => s)

  const [editingName, setEditingName] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editingName) inputRef.current?.select() }, [editingName])

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
    const errors = validatePipeline(nodes, edges)
    if (errors.length > 0) {
      toast.error(errors[0], { description: errors.slice(1).join(', ') || undefined })
      return
    }
    onRun()
  }

  const SaveIcon = isSaving
    ? Loader2
    : isDirty
    ? AlertCircle
    : CheckCircle2

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950">
      {/* Back */}
      <Button
        variant="ghost" size="icon"
        className="h-7 w-7 text-zinc-400 hover:text-zinc-200"
        onClick={() => {
          if (isDirty) {
            const ok = window.confirm('You have unsaved changes. Leave anyway?')
            if (!ok) return
          }
          router.push('/pipelines')
        }}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Pipeline name */}
      {editingName ? (
        <Input
          ref={inputRef}
          defaultValue={pipelineName}
          className="h-7 w-56 bg-zinc-900 border-zinc-700 text-zinc-100 text-sm px-2"
          onBlur={(e) => { setPipelineName(e.target.value || 'Untitled Pipeline'); setEditingName(false) }}
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
        className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-1.5"
        onClick={onSave}
        disabled={isSaving}
      >
        <SaveIcon className={`h-3.5 w-3.5 ${isSaving ? 'animate-spin' : ''}`} />
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
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-200">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
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
    </div>
  )
}
