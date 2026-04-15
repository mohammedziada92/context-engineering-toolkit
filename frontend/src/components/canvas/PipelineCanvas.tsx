'use client'

import { useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type IsValidConnection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

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

// Edge validation: output node cannot be a source
const INVALID_SOURCE_TYPES = new Set(['output'])

export function PipelineCanvas() {
  const {
    nodes, edges, viewport,
    onNodesChange, onEdgesChange, onConnect,
    setViewport, setSelectedNode,
  } = usePipelineStore((s) => s)

  const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
      const source = nodes.find((n) => n.id === connection.source)
      if (!source) return false
      const type = (source.data as { type: string }).type
      return !INVALID_SOURCE_TYPES.has(type)
    },
    [nodes]
  )

  // Keyboard: Delete selected node
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId)
  const deleteNode     = usePipelineStore((s) => s.deleteNode)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        // Don't delete if focus is inside an input/textarea
        const tag = (e.target as HTMLElement).tagName
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
        deleteNode(selectedNodeId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, deleteNode])

  const isEmpty = nodes.length === 0

  return (
    <div className="flex-1 relative bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange as OnNodesChange}
        onEdgesChange={onEdgesChange as OnEdgesChange}
        onConnect={onConnect as OnConnect}
        isValidConnection={isValidConnection}
        defaultViewport={viewport}
        onMoveEnd={(_, vp) => setViewport(vp)}
        onPaneClick={() => setSelectedNode(null)}
        fitView={isEmpty}
        deleteKeyCode={null}   // we handle delete manually
        className="bg-zinc-950"
        defaultEdgeOptions={{ animated: true, style: { stroke: '#6d28d9', strokeWidth: 2 } }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#27272a"
        />
        <Controls
          className="[&>button]:bg-zinc-900 [&>button]:border-zinc-700 [&>button]:text-zinc-300 [&>button:hover]:bg-zinc-800"
        />
        <MiniMap
          className="!bg-zinc-900 !border-zinc-700"
          nodeColor="#52525b"
          maskColor="rgba(9,9,11,0.8)"
        />

        {/* Empty state */}
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                <GitBranch className="h-6 w-6 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-400">Pipeline Canvas</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Drag nodes from the left panel to get started
                </p>
                <p className="text-xs text-zinc-700 mt-0.5">
                  Start with System Prompt → Vector Search → LLM Model → Output
                </p>
              </div>
            </div>
          </div>
        )}
      </ReactFlow>
    </div>
  )
}
