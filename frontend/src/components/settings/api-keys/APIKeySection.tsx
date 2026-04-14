'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Eye, EyeOff, Copy, Check, Loader2, ExternalLink, AlertTriangle } from 'lucide-react'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { validateKey, saveKey, removeKey, UserSettings } from '@/lib/api/settings'

interface Props {
  settings?: UserSettings
}

type KeyState = 'none' | 'valid' | 'invalid' | 'validating'

export function APIKeySection({ settings }: Props) {
  const qc = useQueryClient()
  const hasKey = !!settings?.openrouter_api_key

  const [newKey, setNewKey] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [keyState, setKeyState] = useState<KeyState>(hasKey ? 'valid' : 'none')
  const [credits, setCredits] = useState<number | null>(null)
  const [removeOpen, setRemoveOpen] = useState(false)

  // Validate
  const { mutate: validate, isPending: validating } = useMutation({
    mutationFn: () => validateKey(newKey),
    onMutate: () => setKeyState('validating'),
    onSuccess: (data) => {
      if (data.valid) {
        setKeyState('valid')
        setCredits(data.credits_remaining ?? null)
      } else {
        setKeyState('invalid')
      }
    },
  })

  // Save new key
  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () => saveKey(newKey, settings?.default_model ?? 'anthropic/claude-sonnet-4-6'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      setNewKey('')
      toast.success('API key saved')
    },
    onError: () => toast.error('Failed to save key'),
  })

  // Remove key
  const { mutate: remove, isPending: removing } = useMutation({
    mutationFn: removeKey,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      qc.invalidateQueries({ queryKey: ['usage'] })
      setKeyState('none')
      setRemoveOpen(false)
      toast.success('API key removed')
    },
  })

  // Validate existing stored key
  const { mutate: validateExisting, isPending: revalidating } = useMutation({
    mutationFn: () => validateKey('existing'), // backend uses stored key if param is "existing"
    onSuccess: (data) => {
      setKeyState(data.valid ? 'valid' : 'invalid')
      if (data.valid) setCredits(data.credits_remaining ?? null)
      toast.success(data.valid ? 'Key is valid' : 'Key is invalid or no credits')
    },
  })

  function handleCopy() {
    navigator.clipboard.writeText(settings?.openrouter_api_key ?? '')
    setCopied(true)
    toast.success('API key copied')
    setTimeout(() => setCopied(false), 2000)
  }

  const statusBadge = {
    valid: <span className="text-xs text-emerald-400 font-medium">✓ Valid key{credits !== null ? ` · $${credits.toFixed(2)} credits remaining` : ''}</span>,
    invalid: <span className="text-xs text-red-400 font-medium">✗ Invalid key or no credits remaining</span>,
    validating: <span className="text-xs text-zinc-400 font-medium">Validating key...</span>,
    none: null,
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-sm font-medium text-zinc-200">OpenRouter API Key</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Required to run pipelines and use the playground</p>
        </div>
        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
        >
          Get API key <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {hasKey ? (
        /* Existing key state */
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                value={revealed ? settings!.openrouter_api_key! : '••••••••••••••••••••••••••••••••'}
                readOnly
                className="bg-zinc-800 border-zinc-700 text-zinc-300 font-mono text-xs pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button onClick={() => setRevealed(!revealed)} className="text-zinc-500 hover:text-zinc-300 p-1">
                  {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button onClick={handleCopy} className="text-zinc-500 hover:text-zinc-300 p-1">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {statusBadge[keyState]}

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => validateExisting()}
              disabled={revalidating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {revalidating && <Loader2 className="h-3 w-3 animate-spin" />}
              Validate Key
            </button>
            <button
              onClick={() => setRemoveOpen(true)}
              className="px-3 py-1.5 text-xs rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Remove Key
            </button>
          </div>

          {/* Update key inline */}
          <div className="pt-2 border-t border-zinc-800 space-y-2">
            <p className="text-xs text-zinc-500">Update key</p>
            <div className="flex gap-2">
              <Input
                value={newKey}
                onChange={(e) => { setNewKey(e.target.value); setKeyState('none') }}
                placeholder="sk-or-v1-..."
                className="bg-zinc-800 border-zinc-700 text-zinc-100 font-mono text-xs flex-1"
              />
              {newKey.startsWith('sk-or-') && keyState !== 'valid' && (
                <button
                  onClick={() => validate()}
                  disabled={validating}
                  className="px-3 py-1.5 text-xs rounded-md bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors disabled:opacity-50"
                >
                  {validating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Validate'}
                </button>
              )}
              {keyState === 'valid' && newKey && (
                <button
                  onClick={() => save()}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs rounded-md bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save New Key'}
                </button>
              )}
            </div>
            {newKey && !newKey.startsWith('sk-or-') && (
              <p className="text-xs text-red-400">Key must start with sk-or-</p>
            )}
          </div>
        </div>
      ) : (
        /* No key state */
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-300">No API key added yet. Add your key to start running pipelines.</p>
          </div>
          <div className="flex gap-2">
            <Input
              value={newKey}
              onChange={(e) => { setNewKey(e.target.value); setKeyState('none') }}
              placeholder="sk-or-v1-..."
              className="bg-zinc-800 border-zinc-700 text-zinc-100 font-mono text-xs flex-1"
            />
            {newKey.startsWith('sk-or-') && keyState !== 'valid' && (
              <button
                onClick={() => validate()}
                disabled={validating}
                className="px-4 py-2 text-sm rounded-md bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {validating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Validate
              </button>
            )}
            {keyState === 'valid' && (
              <button
                onClick={() => save()}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-md bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Key
              </button>
            )}
          </div>
          {statusBadge[keyState]}
          {newKey && !newKey.startsWith('sk-or-') && (
            <p className="text-xs text-red-400">Key must start with sk-or-</p>
          )}
        </div>
      )}

      {/* Remove confirmation */}
      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Remove API Key?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-sm">
              You will not be able to run pipelines or use the playground until you add a new key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <button
              onClick={() => remove()}
              disabled={removing}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              {removing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Remove Key
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
