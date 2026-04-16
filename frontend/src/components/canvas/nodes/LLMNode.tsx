'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Cpu, Settings2 } from 'lucide-react'
import { usePipelineStore, type LLMNodeData } from '@/stores/pipeline.store'
import { modelShortname } from '@/lib/models'

export const LLMNode = memo(function LLMNode({ id, data, selected }: NodeProps) {
  const d           = data as unknown as { type: 'llm' } & LLMNodeData
  const setSelected = usePipelineStore((s) => s.setSelectedNode)

  return (
    <div
      onClick={() => setSelected(id)}
      className={`
        rounded-lg border bg-zinc-900 w-[240px] cursor-pointer transition-all
        ${selected
          ? 'border-violet-500 shadow-[0_0_0_2px_rgba(139,92,246,0.25)]'
          : 'border-zinc-700 hover:border-zinc-600'}
      `}
    >
      <div className="flex items-center gap-2 px-3 py-2 bg-violet-600/20 rounded-t-lg border-b border-violet-600/30">
        <Cpu className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-xs font-semibold text-violet-300">LLM Model</span>
        <button
          className="ml-auto text-violet-400/60 hover:text-violet-300 transition-colors"
          onClick={(e) => { e.stopPropagation(); setSelected(id) }}
          aria-label="Configure node"
        >
          <Settings2 className="h-3 w-3" />
        </button>
      </div>

      <div className="px-3 py-2.5 space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-500">Model</span>
          <span className="text-[10px] text-violet-300 font-mono font-medium">{modelShortname(d.model)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-500">Temp</span>
          <span className="text-[10px] font-mono text-violet-400">{d.temperature.toFixed(1)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-500">Max tokens</span>
          <span className="text-[10px] font-mono text-violet-400">{d.max_output_tokens.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-500">Stream</span>
          <span className={`text-[10px] font-medium ${d.stream ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {d.stream ? 'On' : 'Off'}
          </span>
        </div>
      </div>

      <Handle type="target" position={Position.Left}  className="!bg-violet-500 !border-violet-700 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-violet-500 !border-violet-700 !w-3 !h-3" />
    </div>
  )
})
