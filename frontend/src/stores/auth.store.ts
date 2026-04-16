import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { Session, User } from '@supabase/supabase-js'

interface AuthState {
  session:     Session | null
  user:        User    | null
  loading:     boolean
  initialized: boolean

  // Actions
  signIn:  (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  _init:   () => void
}

export const useAuthStore = create<AuthState>((set) => {
  const supabase = createClient()

  // Subscribe to Supabase auth state changes once at store creation.
  // This fires immediately with the current session (INITIAL_SESSION event)
  // and then again on every sign-in/sign-out.
  supabase.auth.onAuthStateChange((_event, session) => {
    set({
      session,
      user:        session?.user ?? null,
      loading:     false,
      initialized: true,
    })
  })

  return {
    session:     null,
    user:        null,
    loading:     true,    // true until first onAuthStateChange fires
    initialized: false,

    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      // Session is set via onAuthStateChange — no manual set() needed
    },

    async signOut() {
      await supabase.auth.signOut()
      // Session cleared via onAuthStateChange
    },

    _init() {
      // No-op — initialization happens in the store factory above.
      // Exposed for testing only.
    },
  }
})
