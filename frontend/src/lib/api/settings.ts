import { apiFetch } from './api'
import { SUPPORTED_MODELS } from '@/lib/models'

// Re-export for convenience — used by playground page
export { SUPPORTED_MODELS }

export interface UserSettings {
  user_id: string
  openrouter_api_key: string | null   // always masked: "sk-or-masked" or null
  default_model: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  full_name: string | null
  email: string
  username: string | null
  avatar_url: string | null
  created_at: string
  identities: Array<{ provider: 'google' | 'github' | 'email'; email: string }>
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system'
  language: string
  timezone: string
  date_format: string
}

export interface UsageStats {
  spent_usd: number
  remaining_usd: number
  total_usd: number
  pct_used: number
  by_model: Array<{ model: string; spent: number; pct: number }>
  cached_at: string
}

export interface ValidateKeyResponse {
  valid: boolean
  credits_remaining?: number
  plan?: string
  error?: string
}

export const getSettings = (): Promise<UserSettings> =>
  apiFetch('/api/v1/settings')

export const getProfile = (): Promise<UserProfile> =>
  apiFetch('/api/v1/settings/profile')

export const getPreferences = (): Promise<UserPreferences> =>
  apiFetch('/api/v1/settings/preferences')

export const getUsage = (): Promise<UsageStats> =>
  apiFetch('/api/v1/settings/usage')

export const updateProfile = (body: { full_name?: string; username?: string }): Promise<void> =>
  apiFetch('/api/v1/settings/profile', { method: 'PUT', body: JSON.stringify(body) })

export const updatePreferences = (body: Partial<UserPreferences>): Promise<void> =>
  apiFetch('/api/v1/settings/preferences', { method: 'PUT', body: JSON.stringify(body) })

export const uploadAvatar = (file: File): Promise<{ avatar_url: string }> => {
  const fd = new FormData()
  fd.append('file', file)
  return apiFetch('/api/v1/settings/avatar', { method: 'POST', body: fd })
}

export const validateKey = (key: string): Promise<ValidateKeyResponse> =>
  apiFetch('/api/v1/settings/validate-key', {
    method: 'POST',
    body: JSON.stringify({ openrouter_api_key: key }),
  })

export const saveKey = (key: string, default_model: string): Promise<void> =>
  apiFetch('/api/v1/settings', {
    method: 'PUT',
    body: JSON.stringify({ openrouter_api_key: key, default_model }),
  })

export const removeKey = (): Promise<void> =>
  apiFetch('/api/v1/settings/api-key', { method: 'DELETE' })

export const updateDefaultModel = (model: string): Promise<void> =>
  apiFetch('/api/v1/settings', {
    method: 'PUT',
    body: JSON.stringify({ default_model: model }),
  })

export const deleteAccount = (): Promise<void> =>
  apiFetch('/api/v1/account', { method: 'DELETE' })

export const notifyProInterest = (email: string): Promise<void> =>
  apiFetch('/api/v1/billing/notify-interest', {
    method: 'POST',
    body: JSON.stringify({ email, plan: 'pro' }),
  })
