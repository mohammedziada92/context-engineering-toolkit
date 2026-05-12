'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'

interface Props {
  children: React.ReactNode
}

export function AuthGuard({ children }: Props) {
  const router    = useRouter()
  const pathname  = usePathname()
  const { session, loading, initialized } = useAuthStore()

  useEffect(() => {
    if (!initialized) return
    if (!loading && !session) {
      const next = encodeURIComponent(pathname)
      router.replace(`/login?next=${next}`)
    }
  }, [session, loading, initialized, router, pathname])

  // Show nothing while Supabase resolves the session on first load
  if (!initialized || loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-xs text-zinc-500">Loading…</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return <>{children}</>
}
