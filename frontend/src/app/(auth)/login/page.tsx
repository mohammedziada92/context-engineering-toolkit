import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: 'Sign In — CET' }

export default function LoginPage() {
  return (
    <div className="min-h-dvh grid grid-cols-1 md:grid-cols-2">
      {/* Left — CET Logo panel (hidden on mobile) */}
      <div className="hidden md:flex items-center justify-center bg-zinc-950 border-r border-zinc-800">
        <img
          src="https://www.image2url.com/r2/default/images/1779700536639-9eb5805b-6cd7-4c89-bec8-f67cbb4f8906.png"
          alt="CET"
          className="max-w-xs w-auto"
        />
      </div>

      {/* Right — Login form */}
      <div className="flex items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-100">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <path d="M17.5 14v6M14.5 17h6" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-zinc-100 tracking-tight">
                Context Engineering Toolkit
              </span>
            </div>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
