'use client'

import { useState } from 'react'
import { Shield, X, Info } from 'lucide-react'

export function BYOKBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [showModal, setShowModal] = useState(false)

  if (dismissed) return null

  return (
    <>
      <div className="flex items-start gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
        <Shield className="h-4 w-4 text-violet-400 flex-shrink-0 mt-0.5" />
        <p className="flex-1 text-sm text-zinc-400">
          CET uses <strong className="text-zinc-300">BYOK</strong> — your OpenRouter key is encrypted via Supabase Vault.
          CET never logs or exposes it.{' '}
          <button
            onClick={() => setShowModal(true)}
            className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
          >
            Learn more
          </button>
        </p>
        <button onClick={() => setDismissed(true)} className="text-zinc-600 hover:text-zinc-400 flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full mx-4">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300">
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-violet-400" />
              <h2 className="text-base font-semibold text-zinc-100">How CET handles your API key</h2>
            </div>
            <ol className="space-y-2">
              {[
                'You enter your OpenRouter key',
                'CET validates it immediately against OpenRouter',
                'Key encrypted via Supabase Vault (AES-256)',
                'Encrypted reference stored in DB — never the raw key',
                'On each pipeline run: server decrypts key in memory, sends to OpenRouter, streams response to you',
                'Key never touches your browser again after save',
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-400">
                  <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-violet-400 text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-zinc-500">
              CET never sees your credits. All LLM costs go directly to your OpenRouter account.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
