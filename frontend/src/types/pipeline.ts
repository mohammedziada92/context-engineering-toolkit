export interface Pipeline {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  version: number;
  is_active: boolean;
  canvas_state: CanvasState | null;
  pipeline_config: Record<string, unknown> | null;
  token_budget: number;
  model: string | null;
  tags: string[];
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CanvasState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/** Minimal serialised node from the API (before React Flow enrichment). */
export interface CanvasNode {
  id: string;
  type?: string;
  position?: { x: number; y: number };
  data?: Record<string, unknown>;
}

/** Minimal serialised edge from the API. */
export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
}

export interface PipelineVersion {
  id: string;
  pipeline_id: string;
  user_id: string;
  version: number;
  snapshot: Record<string, unknown>;
  created_at: string;
}

export interface TokenBudget {
  system: number;
  rag: number;
  history: number;
  total: number;
  isOverBudget: boolean;
}
