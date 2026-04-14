'use client'

import { formatDistanceToNow } from 'date-fns'
import { Play, Edit2, Copy, Trash2, MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Pipeline, modelShortname } from '@/lib/api/pipelines'

interface Props {
  pipeline: Pipeline
  onRun: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function PipelineListRow({ pipeline, onRun, onEdit, onDuplicate, onDelete }: Props) {
  const isActive = pipeline.status === 'active'

  return (
    <tr
      className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors cursor-pointer group"
      onClick={onEdit}
    >
      <td className="px-4 py-3 text-zinc-200 font-medium">{pipeline.name}</td>
      <td className="px-4 py-3">
        <Badge
          variant="outline"
          className={
            isActive
              ? 'border-transparent bg-emerald-500/10 text-emerald-400 text-xs'
              : 'border-transparent bg-zinc-800 text-zinc-400 text-xs'
          }
        >
          <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
          {isActive ? 'Active' : 'Draft'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{modelShortname(pipeline.model)}</td>
      <td className="px-4 py-3 text-zinc-400 text-right">{pipeline.run_count}</td>
      <td className="px-4 py-3 text-zinc-500 text-right text-xs">
        {formatDistanceToNow(new Date(pipeline.updated_at), { addSuffix: true })}
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-violet-400 hover:bg-violet-500/10"
            onClick={onRun}
            aria-label="Run pipeline"
          >
            <Play className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-zinc-400 hover:text-zinc-200"
                aria-label="More options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200 w-40">
              <DropdownMenuItem onClick={onEdit} className="gap-2 cursor-pointer hover:bg-zinc-800">
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate} className="gap-2 cursor-pointer hover:bg-zinc-800">
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                onClick={onDelete}
                className="gap-2 cursor-pointer text-red-400 hover:bg-zinc-800 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  )
}
