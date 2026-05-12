'use client'

import { useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  MarkerType,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type IsValidConnection,
} from '@xyflow/react'

import { usePipelineStore } from '@/stores/pipeline.store'
import { SystemPromptNode } from './nodes/SystemPromptNode'
import { RAGNode }          from './nodes/RAGNode'
import { HistoryNode }      from './nodes/HistoryNode'
import { LLMNode }          from './nodes/LLMNode'
import { OutputNode }       from './nodes/OutputNode'
import { GitBranch }        from 'lucide-react'

const NODE_TYPES = {
  systemPrompt: SystemPromptNode,
  rag:          RAGNode,
  history:      HistoryNode,
  llm:          LLMNode,
  output:       OutputNode,
}

const NODE_MINIMAP_COLORS: Record<string, string> = {
  systemPrompt: '#3b82f6',
  rag:          '#10b981',
  history:      '#f59e0b',
  llm:          '#8b5cf6',
  output:       '#71717a',
}

export function PipelineCanvas() {
  const storeNodes     = usePipelineStore((s) => s.nodes)
  const storeEdges     = usePipelineStore((s) => s.edges)
  const onNodesChange  = usePipelineStore((s) => s.onNodesChange)
  const onEdgesChange  = usePipelineStore((s) => s.onEdgesChange)
  const onConnect      = usePipelineStore((s) => s.onConnect)
  const setViewport    = usePipelineStore((s) => s.setViewport)
  const setSelectedNode= usePipelineStore((s) => s.setSelectedNode)

  const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
      // Block self-connections
      if (connection.source === connection.target) return false

      // Block if source is output (no outgoing edges)
      const source = storeNodes.find((n) => n.id === connection.source)
      if (!source) return false
      const sourceType = (source.data as { type: string }).type
      if (sourceType === 'output') return false

      // Block if target is systemPrompt (no incoming edges — it's an input-only node)
      const target = storeNodes.find((n) => n.id === connection.target)
      if (!target) return false
      const targetType = (target.data as { type: string }).type
      if (targetType === 'systemPrompt') return false

      // Block duplicate connections
      const exists = storeEdges.some(
        (e) => e.source === connection.source && e.target === connection.target
      )
      if (exists) return false

      return true
    },
    [storeNodes, storeEdges]
  )

  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId)
  const deleteNode     = usePipelineStore((s) => s.deleteNode)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        const tag = (e.target as HTMLElement).tagName
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
        deleteNode(selectedNodeId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, deleteNode])

  const isEmpty = storeNodes.length === 0

  return (
    <div className="flex-1 relative bg-zinc-950">
      <ReactFlow
        nodes={storeNodes}
        edges={storeEdges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange as OnNodesChange}
        onEdgesChange={onEdgesChange as OnEdgesChange}
        onConnect={onConnect as OnConnect}
        isValidConnection={isValidConnection}
        onMoveEnd={(_, vp) => setViewport(vp)}
        onNodeClick={(_, n) => setSelectedNode(n.id)}
        onPaneClick={() => setSelectedNode(null)}
        fitView={isEmpty}
        deleteKeyCode={null}
        className="bg-zinc-950"
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#6d28d9', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6d28d9', width: 16, height: 16 },
        }}
        connectionLineStyle={{ stroke: '#8b5cf6', strokeWidth: 2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#27272a" />
        <Controls className="[&>button]:bg-zinc-900 [&>button]:border-zinc-700 [&>button]:text-zinc-300 [&>button:hover]:bg-zinc-800" />
        <MiniMap
          className="bg-zinc-900! border-zinc-700!"
          nodeColor={(node) => NODE_MINIMAP_COLORS[node.type ?? ''] ?? '#52525b'}
          maskColor="rgba(9,9,11,0.8)"
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                <GitBranch className="h-6 w-6 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-400">Pipeline Canvas</p>
                <p className="text-xs text-zinc-600 mt-1">Drag nodes from the left panel to get started</p>
                <p className="text-xs text-zinc-700 mt-0.5">Start with System Prompt → Vector Search → LLM Model → Output</p>
              </div>
            </div>
          </div>
        )}
      </ReactFlow>
    </div>
  )
}
