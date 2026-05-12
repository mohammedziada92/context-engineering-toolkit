'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { FileText, Settings2 } from 'lucide-react'
import { usePipelineStore, type SystemPromptData } from '@/stores/pipeline.store'

export const SystemPromptNode = memo(function SystemPromptNode({
  id, data, selected,
}: NodeProps) {
  const d           = { content: '', max_tokens: 500, ...data } as unknown as { type: 'systemPrompt' } & SystemPromptData
  const setSelected = usePipelineStore((s) => s.setSelectedNode)
  const preview     = d.content
    ? d.content.slice(0, 80) + (d.content.length > 80 ? '…' : '')
    : 'Click to write system prompt…'

  return (
    <div
      onClick={() => setSelected(id)}
      className={`
        rounded-lg border bg-zinc-900 w-[240px] cursor-pointer transition-all
        ${selected
          ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.25)]'
          : 'border-zinc-700 hover:border-zinc-600'}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 rounded-t-lg border-b border-blue-600/30">
        <FileText className="h-3.5 w-3.5 text-blue-400" />
        <span className="text-xs font-semibold text-blue-300">System Prompt</span>
        <button
          className="ml-auto text-blue-400/60 hover:text-blue-300 transition-colors"
          onClick={(e) => { e.stopPropagation(); setSelected(id) }}
          aria-label="Configure node"
        >
          <Settings2 className="h-3 w-3" />
        </button>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5">
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{preview}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-zinc-600">Budget</span>
          <span className="text-[10px] font-mono text-blue-400">{d.max_tokens} tok</span>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-blue-500 !border-blue-700 !w-3 !h-3" />
    </div>
  )
})
