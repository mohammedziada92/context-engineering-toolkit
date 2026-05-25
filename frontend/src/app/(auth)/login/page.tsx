import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: 'Sign In — CET' }

export default function LoginPage() {
  return (
    <div className="min-h-dvh grid grid-cols-1 md:grid-cols-[55fr_45fr]">
      {/* Left — Full-height image panel (hidden on mobile) */}
      <div className="hidden md:block relative">
        <img
          src="https://www.image2url.com/r2/default/images/1779701783083-b4c00c71-473c-4bf8-a7c8-5068a4e06d3c.png"
          alt="CET"
          className="h-full w-full object-cover"
        />
        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-black/70 to-transparent" />
        {/* Text overlay */}
        <div className="absolute bottom-8 left-8 right-8">
          <h2 className="text-white font-bold text-2xl mb-1">Welcome to CET</h2>
          <p className="text-zinc-300 text-sm">Engineer better context. Build smarter LLM pipelines.</p>
        </div>
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
