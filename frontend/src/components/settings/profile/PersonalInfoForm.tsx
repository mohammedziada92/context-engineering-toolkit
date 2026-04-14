'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { updateProfile, UserProfile } from '@/lib/api/settings'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

const schema = z.object({
  full_name: z.string().min(2, 'At least 2 characters').max(100, 'Too long'),
  username: z
    .union([
      z.string().min(3, 'At least 3 characters').max(30).regex(/^[a-z0-9-]+$/, 'Lowercase, numbers, and - only'),
      z.literal(''),
    ])
    .optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  profile?: UserProfile
  loading: boolean
}

export function PersonalInfoForm({ profile, loading }: Props) {
  const qc = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (profile) reset({ full_name: profile.full_name ?? '', username: profile.username ?? '' })
  }, [profile, reset])

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormValues) => updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated successfully')
    },
    onError: () => toast.error('Failed to save. Please try again.'),
  })

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-sm font-medium text-zinc-200 mb-5">Personal Information</h2>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-20 bg-zinc-800" />
              <Skeleton className="h-9 w-full bg-zinc-800 rounded-md" />
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Full Name</Label>
            <Input
              {...register('full_name')}
              placeholder="John Doe"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
            {errors.full_name && (
              <p className="text-xs text-red-400">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Email</Label>
            <Input
              value={profile?.email ?? ''}
              disabled
              className="bg-zinc-800/50 border-zinc-700 text-zinc-500 cursor-not-allowed"
            />
            <p className="text-xs text-zinc-600">Email cannot be changed</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Username</Label>
            <Input
              {...register('username')}
              placeholder="johndoe"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
            {errors.username && (
              <p className="text-xs text-red-400">{errors.username.message}</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!isDirty || isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
