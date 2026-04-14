export const SUPPORTED_MODELS = [
  { id: 'anthropic/claude-sonnet-4-6', name: 'Claude Sonnet 4.6' },
  { id: 'z-ai/glm-5', name: 'GLM-5' },
  { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro' },
] as const

export type SupportedModelId = (typeof SUPPORTED_MODELS)[number]['id']
