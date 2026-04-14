'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, X, Bell, CheckCircle2 } from 'lucide-react'
import { notifyProInterest } from '@/lib/api/settings'

interface Props {
  open: boolean
  onClose: () => void
  email?: string
}

export function NotifyMeModal({ open, onClose, email }: Props) {
  const [inputEmail, setInputEmail] = useState(email ?? '')
  const [success, setSuccess] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: () => notifyProInterest(inputEmail),
    onSuccess: () => setSuccess(true),
    onError: () => toast.error('Already on the list, or something went wrong'),
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-sm w-full mx-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300">
          <X className="h-4 w-4" />
        </button>

        {success ? (
          <div className="text-center py-4">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <h2 className="text-base font-semibold text-zinc-100 mb-1">You're on the list!</h2>
            <p className="text-sm text-zinc-400">We'll notify you when CET Pro launches.</p>
            <button onClick={onClose} className="mt-4 text-xs text-violet-400 hover:text-violet-300">Close</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-5 w-5 text-amber-400" />
              <h2 className="text-base font-semibold text-zinc-100">Get notified about Pro</h2>
            </div>
            <p className="text-sm text-zinc-400 mb-4">
              We'll email you when CET Pro launches with team workspaces, shared pipelines, and priority support.
            </p>

            <div className="space-y-3">
              <input
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => mutate()}
                  disabled={!inputEmail || isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-md bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Notify Me
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
