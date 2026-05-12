'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { GitBranch, Play, Edit2, Copy, Trash2, MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { type Pipeline, modelShortname, pipelineModel } from '@/lib/api/pipelines'

interface Props {
  pipeline: Pipeline
  onRun: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onStatusToggle: () => void
}

export function PipelineCard({ pipeline, onRun, onEdit, onDuplicate, onDelete, onStatusToggle }: Props) {
  const [hovered, setHovered] = useState(false)
  const isActive = pipeline.status === 'active'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 flex flex-col gap-3 hover:border-zinc-700 transition-colors relative group"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <GitBranch className="h-4 w-4 text-violet-400 shrink-0" />
          <span className="font-medium text-zinc-100 truncate text-sm">{pipeline.name}</span>
        </div>

        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
          >
            <MoreHorizontal className="h-4 w-4" />
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
              className="gap-2 cursor-pointer text-red-400 hover:bg-zinc-800 hover:text-red-300 focus:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status + Model */}
      <div className="flex items-center gap-2 flex-wrap">
        <Tooltip>
          <TooltipTrigger
            render={
              <Badge
                variant="outline"
                className={`cursor-pointer select-none transition-colors ${
                  isActive
                    ? 'border-transparent bg-emerald-500/10 text-emerald-400 text-xs hover:bg-emerald-500/20'
                    : 'border-transparent bg-zinc-800 text-zinc-400 text-xs hover:bg-zinc-700'
                }`}
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); onStatusToggle() }}
              >
                <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                {isActive ? 'Active' : 'Draft'}
              </Badge>
            }
          />
          <TooltipContent side="bottom" className="text-xs">
            Click to set {isActive ? 'Draft' : 'Active'}
          </TooltipContent>
        </Tooltip>
        <span className="text-xs text-zinc-500 font-mono">{modelShortname(pipelineModel(pipeline))}</span>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs text-zinc-500 mt-auto pt-1">
        <span>{pipeline.run_count} run{pipeline.run_count !== 1 ? 's' : ''}</span>
        <span>{formatDistanceToNow(new Date(pipeline.updated_at), { addSuffix: true })}</span>
      </div>

      {/* Hover action buttons */}
      <div
        className={`flex gap-2 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
          className="flex-1 h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          <Edit2 className="h-3 w-3 mr-1" /> Edit
        </Button>
        <Button
          size="sm"
          onClick={onRun}
          className="flex-1 h-7 text-xs bg-violet-600 hover:bg-violet-500 text-white"
        >
          <Play className="h-3 w-3 mr-1" /> Run
        </Button>
      </div>
    </div>
  )
}
