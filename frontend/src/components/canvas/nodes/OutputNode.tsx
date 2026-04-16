'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { HardDrive, Settings2 } from 'lucide-react'
import { usePipelineStore, type OutputNodeData } from '@/stores/pipeline.store'

export const OutputNode = memo(function OutputNode({ id, data, selected }: NodeProps) {
  const d           = data as unknown as { type: 'output' } & OutputNodeData
  const setSelected = usePipelineStore((s) => s.setSelectedNode)

  return (
    <div
      onClick={() => setSelected(id)}
      className={`
        rounded-lg border bg-zinc-900 w-[200px] cursor-pointer transition-all
        ${selected
          ? 'border-zinc-400 shadow-[0_0_0_2px_rgba(161,161,170,0.2)]'
          : 'border-zinc-700 hover:border-zinc-600'}
      `}
    >
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-700/30 rounded-t-lg border-b border-zinc-700/50">
        <HardDrive className="h-3.5 w-3.5 text-zinc-400" />
        <span className="text-xs font-semibold text-zinc-300">Output</span>
        <button
          className="ml-auto text-zinc-500 hover:text-zinc-300 transition-colors"
          onClick={(e) => { e.stopPropagation(); setSelected(id) }}
          aria-label="Configure node"
        >
          <Settings2 className="h-3 w-3" />
        </button>
      </div>

      <div className="px-3 py-2.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-500">Format</span>
          <span className="text-[10px] text-zinc-300 font-medium capitalize">{d.format}</span>
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="!bg-zinc-500 !border-zinc-600 !w-3 !h-3" />
    </div>
  )
})
