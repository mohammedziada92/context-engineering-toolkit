'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { History, Settings2 } from 'lucide-react'
import { usePipelineStore, type HistoryNodeData } from '@/stores/pipeline.store'

const STRATEGY_LABELS = { keep: 'Keep all', summarize: 'Summarize', truncate: 'Truncate' }

export const HistoryNode = memo(function HistoryNode({ id, data, selected }: NodeProps) {
  const d           = data as unknown as { type: 'history' } & HistoryNodeData
  const setSelected = usePipelineStore((s) => s.setSelectedNode)

  return (
    <div
      onClick={() => setSelected(id)}
      className={`
        rounded-lg border bg-zinc-900 w-[240px] cursor-pointer transition-all
        ${selected
          ? 'border-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.25)]'
          : 'border-zinc-700 hover:border-zinc-600'}
      `}
    >
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-600/20 rounded-t-lg border-b border-amber-600/30">
        <History className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-amber-300">Chat History</span>
        <button
          className="ml-auto text-amber-400/60 hover:text-amber-300 transition-colors"
          onClick={(e) => { e.stopPropagation(); setSelected(id) }}
          aria-label="Configure node"
        >
          <Settings2 className="h-3 w-3" />
        </button>
      </div>

      <div className="px-3 py-2.5 space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-500">Strategy</span>
          <span className="text-[10px] text-amber-300 font-medium">{STRATEGY_LABELS[d.strategy]}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-500">Budget</span>
          <span className="text-[10px] font-mono text-amber-400">{d.max_tokens} tok</span>
        </div>
      </div>

      <Handle type="target" position={Position.Left}  className="!bg-amber-500 !border-amber-700 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-amber-500 !border-amber-700 !w-3 !h-3" />
    </div>
  )
})
