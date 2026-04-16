'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { toast }    from 'sonner'
import { useAuthStore } from '@/stores/auth.store'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormData = z.infer<typeof schema>

export function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { signIn }   = useAuthStore()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit({ email, password }: FormData) {
    setLoading(true)
    try {
      await signIn(email, password)
      const next = searchParams.get('next')
      router.replace(next ? decodeURIComponent(next) : '/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
      <div className="mb-6">
        <h1 className="text-base font-semibold text-zinc-100">Sign in to CET</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Use your Supabase-provisioned account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-400">Email</Label>
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
            placeholder="••••••••"
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
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
