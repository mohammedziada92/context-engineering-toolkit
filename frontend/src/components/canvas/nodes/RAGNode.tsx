'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Search, Settings2 } from 'lucide-react'
import { usePipelineStore, type RAGNodeData } from '@/stores/pipeline.store'

export const RAGNode = memo(function RAGNode({ id, data, selected }: NodeProps) {
  const d           = { knowledge_source_id: null, top_k: 5, similarity_threshold: 0.75, max_tokens: 1500, ...data } as unknown as { type: 'rag' } & RAGNodeData
  const setSelected = usePipelineStore((s) => s.setSelectedNode)

  return (
    <div
      onClick={() => setSelected(id)}
      className={`
        rounded-lg border bg-zinc-900 w-[240px] cursor-pointer transition-all
        ${selected
          ? 'border-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]'
          : 'border-zinc-700 hover:border-zinc-600'}
      `}
    >
      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-600/20 rounded-t-lg border-b border-emerald-600/30">
        <Search className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-xs font-semibold text-emerald-300">Vector Search</span>
        <button
          className="ml-auto text-emerald-400/60 hover:text-emerald-300 transition-colors"
          onClick={(e) => { e.stopPropagation(); setSelected(id) }}
          aria-label="Configure node"
        >
          <Settings2 className="h-3 w-3" />
        </button>
      </div>

      <div className="px-3 py-2.5 space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-500">Knowledge Source</span>
          <span className="text-[10px] text-zinc-300 font-medium truncate max-w-[100px]">
            {d.knowledge_source_id ? 'Selected' : 'Not set'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-500">Top K</span>
          <span className="text-[10px] font-mono text-emerald-400">{d.top_k}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-500">Threshold</span>
          <span className="text-[10px] font-mono text-emerald-400">{d.similarity_threshold.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-500">Budget</span>
          <span className="text-[10px] font-mono text-emerald-400">{d.max_tokens} tok</span>
        </div>
      </div>

      <Handle type="target" position={Position.Left}  className="!bg-emerald-500 !border-emerald-700 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-emerald-500 !border-emerald-700 !w-3 !h-3" />
    </div>
  )
})
