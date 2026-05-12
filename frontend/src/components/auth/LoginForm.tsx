'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowLeft, Mail, KeyRound, CheckCircle2, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button }     from '@/components/ui/button'
import { Input }      from '@/components/ui/input'
import { Label }      from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

// ── Zod schemas ─────────────────────────────────────────────────

const passwordSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})

const signUpSchema = z.object({
  full_name: z.string().min(2, 'Enter your name').max(100),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string().min(1, 'Confirm your password'),
}).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

const emailSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

type PasswordData = z.infer<typeof passwordSchema>
type SignUpData = z.infer<typeof signUpSchema>
type EmailData = z.infer<typeof emailSchema>

// ── Google / GitHub SVG icons ───────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-2">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

// ── Main form ────────────────────────────────────────────────────

type View = 'password' | 'signup' | 'signup-done' | 'link' | 'sent'

export function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  const [view, setView]             = useState<View>('password')
  const [email, setEmail]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(0)

  const { register, handleSubmit, formState: { errors } } = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  })

  const { register: registerSignUp, handleSubmit: handleSubmitSignUp, formState: { errors: errorsSignUp } } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
  })

  const { register: registerEmail, handleSubmit: handleSubmitEmail, formState: { errors: errorsEmail } } = useForm<EmailData>({
    resolver: zodResolver(emailSchema),
  })

  function startTimer() {
    setResendTimer(60)
    const id = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(id); return 0 }
        return t - 1
      })
    }, 1000)
  }

  function redirectAfterLogin() {
    const next = searchParams.get('next')
    router.replace(next ? decodeURIComponent(next) : '/dashboard')
  }

  // ── OAuth ───────────────────────────────────────────────────

  async function handleOAuth(provider: 'google' | 'github') {
    setError(null)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (oauthError) throw oauthError
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'OAuth sign-in failed')
    }
  }

  // ── Password sign-in ────────────────────────────────────────

  async function onPasswordSignIn({ email: e, password }: PasswordData) {
    setError(null)
    setLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: e, password })
      if (signInError) {
        if (signInError.message.toLowerCase().includes('email not confirmed')) {
          throw new Error('Email not confirmed. Please check your inbox.')
        }
        throw new Error('Invalid email or password')
      }
      redirectAfterLogin()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Sign up ─────────────────────────────────────────────────

  async function onSignUp({ full_name, email: e, password }: SignUpData) {
    setError(null)
    setLoading(true)
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: e,
        password,
        options: {
          data: { full_name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already registered')) {
          throw new Error('This email is already registered. Try signing in instead.')
        }
        throw signUpError
      }
      setEmail(e)
      setView('signup-done')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign-up failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Send magic link ─────────────────────────────────────────

  async function onSendLink({ email: e }: EmailData) {
    setError(null)
    setLoading(true)
    try {
      const { error: linkError } = await supabase.auth.signInWithOtp({
        email: e,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (linkError) throw linkError
      setEmail(e)
      setView('sent')
      startTimer()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send sign-in link')
    } finally {
      setLoading(false)
    }
  }

  // ── Resend ──────────────────────────────────────────────────

  async function handleResend() {
    setError(null)
    try {
      const { error: resendError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (resendError) throw resendError
      startTimer()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend')
    }
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="w-full max-w-100 rounded-lg border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
      {/* ── Sign-in view (default) ────────────────────────────── */}
      {view === 'password' && (
        <>
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-zinc-100">Welcome to CET</h1>
            <p className="text-sm text-zinc-500 mt-1">Sign in to continue</p>
          </div>

          {/* OAuth buttons */}
          <div className="space-y-2.5">
            <Button
              type="button"
              variant="outline"
              className="w-full border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100"
              onClick={() => handleOAuth('google')}
            >
              <GoogleIcon />
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100"
              onClick={() => handleOAuth('github')}
            >
              <GitHubIcon />
              Continue with GitHub
            </Button>
          </div>

          {/* Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-zinc-900 px-2 text-zinc-500">or</span>
            </div>
          </div>

          {/* Email + Password form */}
          <form onSubmit={handleSubmit(onPasswordSignIn)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Email address</Label>
              <Input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
                autoFocus
              />
              {errors.email && (
                <p className="text-[11px] text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Password</Label>
              <Input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
              />
              {errors.password && (
                <p className="text-[11px] text-red-400">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
              {loading ? 'Signing in…' : 'Sign in with password'}
            </Button>
          </form>

          {/* Switch to sign-up / magic link */}
          <div className="mt-4 flex flex-col gap-2 text-center">
            <button
              type="button"
              onClick={() => { setView('signup'); setError(null) }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <UserPlus className="h-3 w-3 inline mr-1" />
              Don't have an account? Sign up
            </button>
            <button
              type="button"
              onClick={() => { setView('link'); setError(null) }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Mail className="h-3 w-3 inline mr-1" />
              Send me a sign-in link instead
            </button>
          </div>

          {/* Terms */}
          <p className="text-[11px] text-zinc-600 text-center mt-4 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="#" className="text-zinc-500 underline hover:text-zinc-400">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-zinc-500 underline hover:text-zinc-400">Privacy Policy</a>.
          </p>
        </>
      )}

      {/* ── Sign-up view ──────────────────────────────────────── */}
      {view === 'signup' && (
        <>
          <button
            type="button"
            onClick={() => { setView('password'); setError(null) }}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </button>

          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-zinc-100">Create your account</h1>
            <p className="text-sm text-zinc-500 mt-1">Get started with CET for free</p>
          </div>

          {/* OAuth buttons */}
          <div className="space-y-2.5">
            <Button
              type="button"
              variant="outline"
              className="w-full border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100"
              onClick={() => handleOAuth('google')}
            >
              <GoogleIcon />
              Sign up with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100"
              onClick={() => handleOAuth('github')}
            >
              <GitHubIcon />
              Sign up with GitHub
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-zinc-900 px-2 text-zinc-500">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmitSignUp(onSignUp)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Full name</Label>
              <Input
                {...registerSignUp('full_name')}
                type="text"
                autoComplete="name"
                placeholder="Your name"
                className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
                autoFocus
              />
              {errorsSignUp.full_name && (
                <p className="text-[11px] text-red-400">{errorsSignUp.full_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Email address</Label>
              <Input
                {...registerSignUp('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
                autoFocus
              />
              {errorsSignUp.email && (
                <p className="text-[11px] text-red-400">{errorsSignUp.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Password</Label>
              <Input
                {...registerSignUp('password')}
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
              />
              {errorsSignUp.password && (
                <p className="text-[11px] text-red-400">{errorsSignUp.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Confirm password</Label>
              <Input
                {...registerSignUp('confirm')}
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
              />
              {errorsSignUp.confirm && (
                <p className="text-[11px] text-red-400">{errorsSignUp.confirm.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="text-[11px] text-zinc-600 text-center mt-4 leading-relaxed">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-zinc-500 underline hover:text-zinc-400">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-zinc-500 underline hover:text-zinc-400">Privacy Policy</a>.
          </p>
        </>
      )}

      {/* ── Sign-up confirmation ──────────────────────────────── */}
      {view === 'signup-done' && (
        <>
          <button
            type="button"
            onClick={() => { setView('password'); setError(null) }}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </button>

          <div className="text-center py-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-zinc-100">Account created</h1>
            <p className="text-sm text-zinc-500 mt-2">
              We sent a confirmation link to <span className="text-zinc-300">{email}</span>
            </p>
            <p className="text-xs text-zinc-600 mt-3">
              Click the link in your email to verify your account, then sign in.
            </p>
          </div>

          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100"
              onClick={() => { setView('password'); setError(null) }}
            >
              <KeyRound className="h-4 w-4 mr-2" />
              Go to sign in
            </Button>
          </div>
        </>
      )}

      {/* ── Magic link email input ────────────────────────────── */}
      {view === 'link' && (
        <>
          <button
            type="button"
            onClick={() => { setView('password'); setError(null) }}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to password sign-in
          </button>

          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-zinc-100">Sign in with link</h1>
            <p className="text-sm text-zinc-500 mt-1">We'll send a sign-in link to your email</p>
          </div>

          <form onSubmit={handleSubmitEmail(onSendLink)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Email address</Label>
              <Input
                {...registerEmail('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
                autoFocus
              />
              {errorsEmail.email && (
                <p className="text-[11px] text-red-400">{errorsEmail.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
              {loading ? 'Sending link…' : 'Send sign-in link'}
            </Button>
          </form>
        </>
      )}

      {/* ── Link sent confirmation ────────────────────────────── */}
      {view === 'sent' && (
        <>
          <button
            type="button"
            onClick={() => { setView('link'); setError(null) }}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>

          <div className="text-center py-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-zinc-100">Check your email</h1>
            <p className="text-sm text-zinc-500 mt-2">
              We sent a sign-in link to <span className="text-zinc-300">{email}</span>
            </p>
            <p className="text-xs text-zinc-600 mt-3">
              Click the link in your email to sign in. This page will update automatically.
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-zinc-500">
              {resendTimer > 0 ? (
                <>Resend link in <span className="text-zinc-300 tabular-nums">{resendTimer}s</span></>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-violet-400 hover:text-violet-300 underline"
                >
                  Resend link
                </button>
              )}
            </p>
          </div>
        </>
      )}

      {/* Error alert */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
