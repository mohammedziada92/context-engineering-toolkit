import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: 'Sign In — CET' }

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
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
  )
}
