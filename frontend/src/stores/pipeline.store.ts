import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
  type Node,
  type Edge,
  type Viewport,
  addEdge,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react'
import { DEFAULT_MODEL } from '@/lib/models'

// ── Node data shapes ────────────────────────────────────────────────────────

export interface SystemPromptData {
  content: string
  max_tokens: number         // budget: 500
}

export interface RAGNodeData {
  knowledge_source_id: string | null
  top_k: number              // default 5
  similarity_threshold: number // default 0.75
  max_tokens: number         // budget: 1500
}

export interface HistoryNodeData {
  strategy: 'keep' | 'summarize' | 'truncate'
  max_tokens: number         // budget: 500
}

export interface LLMNodeData {
  model: string              // default DEFAULT_MODEL
  temperature: number        // default 0.7
  max_output_tokens: number  // default 2048
  stream: boolean
}

export interface OutputNodeData {
  format: 'markdown' | 'plain'
}

export type CETNodeData =
  | ({ type: 'systemPrompt' } & SystemPromptData)
  | ({ type: 'rag' }         & RAGNodeData)
  | ({ type: 'history' }     & HistoryNodeData)
  | ({ type: 'llm' }         & LLMNodeData)
  | ({ type: 'output' }      & OutputNodeData)

// ── Token budget ─────────────────────────────────────────────────────────────

export const TOKEN_BUDGET = {
  systemPrompt: 500,
  rag:          1_500,
  history:      500,
  llm:          2_048,   // max output tokens
  total:        997_952, // 1_000_000 - 2_048
}

export function computeTokenUsage(nodes: Node[]): {
  systemPrompt: number
  rag: number
  history: number
  total: number
  over: boolean
} {
  let sp = 0, rag = 0, hist = 0
  for (const n of nodes) {
    const d = n.data as unknown as CETNodeData
    if (d.type === 'systemPrompt') sp   = d.max_tokens
    if (d.type === 'rag')          rag  = d.max_tokens
    if (d.type === 'history')      hist = d.max_tokens
  }
  const total = sp + rag + hist
  return { systemPrompt: sp, rag, history: hist, total, over: total > TOKEN_BUDGET.total }
}

// ── Validation ───────────────────────────────────────────────────────────────

export type Severity = 'error' | 'warning'

export interface ValidationIssue {
  message: string
  severity: Severity
}

const NODE_TYPE_LABELS: Record<string, string> = {
  systemPrompt: 'System Prompt',
  rag:          'Vector Search',
  history:      'Chat History',
  llm:          'LLM Model',
  output:       'Output',
}

export function validatePipeline(nodes: Node[], edges: Edge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const types = nodes.map((n) => (n.data as unknown as CETNodeData).type)

  // Error-level: missing required nodes (blocks run)
  if (!types.includes('llm'))    issues.push({ message: 'Add an LLM Model node', severity: 'error' })
  if (!types.includes('output')) issues.push({ message: 'Add an Output node', severity: 'error' })

  // Warning-level: missing optional nodes
  if (!types.includes('systemPrompt')) issues.push({ message: 'Add a System Prompt node', severity: 'warning' })

  // Error-level: disconnected nodes
  const sources = new Set(edges.map((e) => e.source))
  for (const n of nodes) {
    const d = n.data as unknown as CETNodeData
    if (d.type !== 'output' && !sources.has(n.id)) {
      const label = NODE_TYPE_LABELS[d.type] ?? d.type
      issues.push({ message: `${label} node is not connected`, severity: 'error' })
    }
  }

  return issues
}

// ── Store ────────────────────────────────────────────────────────────────────

export interface PipelineStore {
  // Identity
  pipelineId:   string | null
  pipelineName: string
  status:       'active' | 'draft'
  isDirty:      boolean
  isSaving:     boolean

  // Canvas
  nodes:    Node[]
  edges:    Edge[]
  viewport: Viewport

  // UI
  selectedNodeId: string | null

  // Actions
  setPipelineId:   (id: string) => void
  setPipelineName: (name: string) => void
  setStatus:       (status: 'active' | 'draft') => void
  setDirty:        (dirty: boolean) => void
  setSaving:       (saving: boolean) => void

  loadCanvas: (nodes: Node[], edges: Edge[], viewport: Viewport) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect:     (connection: Connection) => void
  addNode:       (node: Omit<Node, 'data'> & { data: unknown }) => void
  updateNodeData:(id: string, data: Partial<CETNodeData>) => void
  deleteNode:    (id: string) => void
  setViewport:   (viewport: Viewport) => void

  setSelectedNode: (id: string | null) => void
  reset: () => void
}

const INITIAL: Omit<PipelineStore, keyof Pick<PipelineStore,
  'setPipelineId' | 'setPipelineName' | 'setStatus' | 'setDirty' | 'setSaving' |
  'loadCanvas' | 'onNodesChange' | 'onEdgesChange' | 'onConnect' | 'addNode' |
  'updateNodeData' | 'deleteNode' | 'setViewport' | 'setSelectedNode' | 'reset'
>> = {
  pipelineId:     null,
  pipelineName:   'Untitled Pipeline',
  status:         'draft',
  isDirty:        false,
  isSaving:       false,
  nodes:          [],
  edges:          [],
  viewport:       { x: 0, y: 0, zoom: 1 },
  selectedNodeId: null,
}

export const usePipelineStore = create<PipelineStore>()(
  subscribeWithSelector((set) => ({
    ...INITIAL,

    setPipelineId:   (id)     => set({ pipelineId: id }),
    setPipelineName: (name)   => set({ pipelineName: name, isDirty: true }),
    setStatus:       (status) => set({ status }),
    setDirty:        (dirty)  => set({ isDirty: dirty }),
    setSaving:       (saving) => set({ isSaving: saving }),

    loadCanvas: (nodes, edges, viewport) =>
      set({ nodes, edges, viewport, isDirty: false }),

    onNodesChange: (changes) =>
      set((s) => ({
        nodes:   applyNodeChanges(changes, s.nodes),
        isDirty: changes.some(c => c.type !== 'dimensions' && c.type !== 'select') ? true : s.isDirty,
      })),

    onEdgesChange: (changes) =>
      set((s) => ({
        edges:   applyEdgeChanges(changes, s.edges),
        isDirty: changes.some(c => c.type !== 'select') ? true : s.isDirty,
      })),

    onConnect: (connection) =>
      set((s) => ({
        edges:   addEdge({ ...connection, animated: true }, s.edges),
        isDirty: true,
      })),

    addNode: (node) =>
      set((s) => ({ nodes: [...s.nodes, node as Node], isDirty: true })),

    updateNodeData: (id, data) =>
      set((s) => ({
        nodes: s.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...data } } : n
        ),
        isDirty: true,
      })),

    deleteNode: (id) =>
      set((s) => ({
        nodes: s.nodes.filter((n) => n.id !== id),
        edges: s.edges.filter((e) => e.source !== id && e.target !== id),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
        isDirty: true,
      })),

    setViewport: (viewport) => set({ viewport }),
    setSelectedNode: (id)   => set({ selectedNodeId: id }),

    reset: () => set({ ...INITIAL }),
  }))
)
