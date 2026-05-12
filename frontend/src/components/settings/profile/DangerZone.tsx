'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { deleteAccount, getProfile } from '@/lib/api/settings'

export function DangerZone() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: getProfile, staleTime: 60_000 })

  const { mutate, isPending } = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      router.push('/?deleted=true')
    },
    onError: () => toast.error('Failed to delete account. Please try again.'),
  })

  return (
    <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h2 className="text-sm font-medium text-red-400">Danger Zone</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 rounded-md border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors flex-shrink-0"
        >
          Delete My Account
        </button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Delete Account?</AlertDialogTitle>
            <div className="space-y-2">
              <AlertDialogDescription className="text-zinc-400 text-sm">
                This will permanently delete:
              </AlertDialogDescription>
              <ul className="list-disc list-inside space-y-1 text-zinc-500 text-xs">
                <li>Your profile and settings</li>
                <li>All your pipelines and version history</li>
                <li>All knowledge sources and embeddings</li>
                <li>All run history records</li>
                <li>All chat sessions</li>
                <li>Your encrypted OpenRouter API key</li>
              </ul>
              <span className="block mt-2 text-red-400 text-xs font-medium">
                This action cannot be undone.
              </span>
            </div>
          </AlertDialogHeader>

          <div className="px-1 py-2">
            <p className="text-xs text-zinc-400 mb-2">
              Type <span className="font-mono font-bold text-zinc-200">DELETE</span> to confirm
            </p>
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
              className="bg-zinc-800 border-zinc-700 text-zinc-100 font-mono"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
              onClick={() => setConfirm('')}
            >
              Cancel
            </AlertDialogCancel>
            <button
              disabled={confirm !== 'DELETE' || isPending}
              onClick={() => mutate()}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Delete My Account
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
