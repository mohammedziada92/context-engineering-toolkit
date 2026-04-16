'use client'

import { useCallback } from 'react'
import { FileText, Search, History, Cpu, HardDrive } from 'lucide-react'
import { usePipelineStore, type CETNodeData } from '@/stores/pipeline.store'
import { DEFAULT_MODEL } from '@/lib/models'

const NODE_CATEGORIES = [
  {
    label: 'Input',
    nodes: [
      {
        type: 'systemPrompt',
        icon: FileText,
        label: 'System Prompt',
        color: 'text-blue-400',
        bg:    'bg-blue-600/10 hover:bg-blue-600/20 border-blue-800',
        defaultData: {
          type: 'systemPrompt',
          content: '',
          max_tokens: 500,
        },
      },
    ],
  },
  {
    label: 'Retrieval',
    nodes: [
      {
        type: 'rag',
        icon: Search,
        label: 'Vector Search',
        color: 'text-emerald-400',
        bg:    'bg-emerald-600/10 hover:bg-emerald-600/20 border-emerald-800',
        defaultData: {
          type: 'rag',
          knowledge_source_id: null,
          top_k: 5,
          similarity_threshold: 0.75,
          max_tokens: 1500,
        },
      },
    ],
  },
  {
    label: 'Processing',
    nodes: [
      {
        type: 'history',
        icon: History,
        label: 'Chat History',
        color: 'text-amber-400',
        bg:    'bg-amber-600/10 hover:bg-amber-600/20 border-amber-800',
        defaultData: {
          type: 'history',
          strategy: 'summarize',
          max_tokens: 500,
        },
      },
    ],
  },
  {
    label: 'Output',
    nodes: [
      {
        type: 'llm',
        icon: Cpu,
        label: 'LLM Model',
        color: 'text-violet-400',
        bg:    'bg-violet-600/10 hover:bg-violet-600/20 border-violet-800',
        defaultData: {
          type: 'llm',
          model: DEFAULT_MODEL,
          temperature: 0.7,
          max_output_tokens: 2048,
          stream: true,
        },
      },
      {
        type: 'output',
        icon: HardDrive,
        label: 'Output',
        color: 'text-zinc-400',
        bg:    'bg-zinc-800/50 hover:bg-zinc-700/50 border-zinc-700',
        defaultData: {
          type: 'output',
          format: 'markdown',
        },
      },
    ],
  },
]

let nodeCounter = 1

export function NodePanel() {
  const addNode = usePipelineStore((s) => s.addNode)

  const handleAdd = useCallback(
    (nodeType: string, defaultData: object) => {
      const id = `${nodeType}-${nodeCounter++}`
      addNode({
        id,
        type: nodeType,
        position: { x: 250 + Math.random() * 100, y: 100 + Math.random() * 200 },
        data: defaultData,
      })
    },
    [addNode]
  )

  return (
    <div className="w-[220px] border-r border-zinc-800 bg-zinc-950 flex flex-col overflow-y-auto">
      <div className="px-3 py-3 border-b border-zinc-800">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nodes</p>
      </div>

      <div className="flex-1 px-2 py-3 space-y-4">
        {NODE_CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600 px-1 mb-1.5">
              {cat.label}
            </p>
            <div className="space-y-1">
              {cat.nodes.map((node) => {
                const Icon = node.icon
                return (
                  <button
                    key={node.type}
                    onClick={() => handleAdd(node.type, node.defaultData)}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 rounded-md border
                      text-left text-xs font-medium transition-colors
                      ${node.bg} ${node.color}
                    `}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {node.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
