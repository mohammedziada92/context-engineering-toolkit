export interface SupportedModel {
  id: string
  provider: string
  name: string
  context_window: number | null
  input_price_per_million: number | null
  output_price_per_million: number | null
  role: 'quality' | 'agent' | 'budget'
}

export const SUPPORTED_MODELS: SupportedModel[] = [
  {
    id: 'anthropic/claude-sonnet-4-6',
    provider: 'Anthropic',
    name: 'Claude Sonnet 4.6',
    context_window: 1_000_000,
    input_price_per_million: 3.00,
    output_price_per_million: 15.00,
    role: 'quality',
  },
  {
    id: 'z-ai/glm-5',
    provider: 'Z.ai',
    name: 'GLM-5',
    context_window: null,
    input_price_per_million: null,
    output_price_per_million: null,
    role: 'agent',
  },
  {
    id: 'google/gemini-3.1-pro-preview',
    provider: 'Google',
    name: 'Gemini 3.1 Pro Preview',
    context_window: 1_048_576,
    input_price_per_million: 2.00,
    output_price_per_million: 12.00,
    role: 'budget',
  },
]

export const DEFAULT_MODEL = 'anthropic/claude-sonnet-4-6'

export function modelById(id: string): SupportedModel | undefined {
  return SUPPORTED_MODELS.find((m) => m.id === id)
}

/** "claude-sonnet-4.6" from "anthropic/claude-sonnet-4-6" */
export function modelShortname(id: string): string {
  return id.split('/').pop()?.replace(/-/g, '.') ?? id
}
