import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: 'Sign In — CET' }

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center py-12 bg-linear-to-br from-zinc-950 via-zinc-950 to-zinc-900">
      {/* Centered card */}
      <div className="container relative max-w-250">
        <div className="relative bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex flex-col lg:flex-row items-stretch h-full">

            {/* Left — Image panel (hidden on mobile) */}
            <div className="hidden lg:block w-120 relative bg-primary shrink-0">
              <div className="absolute inset-0">
                <img
                  src="https://www.image2url.com/r2/default/images/1779701783083-b4c00c71-473c-4bf8-a7c8-5068a4e06d3c.png"
                  alt="CET"
                  className="object-cover h-full w-full"
                />
              </div>
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-r from-black/50 via-black/25 to-transparent" />
              {/* Bottom text */}
              <div className="relative p-8 text-white space-y-2 flex flex-col justify-end h-full pb-16">
                <h2 className="text-2xl font-bold">Welcome to CET</h2>
                <p className="text-white/90">Engineer better context. Build smarter LLM pipelines.</p>
              </div>
            </div>

            {/* Right — Login form (untouched) */}
            <div className="w-full lg:w-120 relative z-10 p-8">
              <div className="w-full">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="https://www.image2url.com/r2/default/images/1779700203013-7a29c0fa-6f5f-45b5-a83a-532b55c3af23.png"
                      alt="CET"
                      height={36}
                      className="h-9 w-auto"
                    />
                    <span className="text-lg font-semibold text-zinc-100 tracking-tight">
                      Context Engineering Toolkit
                    </span>
                  </div>
                </div>

                <LoginForm />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
