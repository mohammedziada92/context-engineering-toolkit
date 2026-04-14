'use client'

import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Camera, Loader2 } from 'lucide-react'
import { uploadAvatar, UserProfile } from '@/lib/api/settings'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  profile?: UserProfile
  loading: boolean
}

function getInitials(name: string | null | undefined, email: string | undefined) {
  if (name) {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  }
  return (email?.[0] ?? 'U').toUpperCase()
}

export function AvatarSection({ profile, loading }: Props) {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (data) => {
      qc.setQueryData(['profile'], (old: UserProfile) => ({ ...old, avatar_url: data.avatar_url }))
      setPreview(null)
      toast.success('Avatar updated')
    },
    onError: () => toast.error('Failed to upload avatar'),
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File must be under 2 MB')
      return
    }

    // Resize to 256×256 via canvas API before upload
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (ev) => {
      img.src = ev.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 256
        canvas.getContext('2d')!.drawImage(img, 0, 0, 256, 256)
        canvas.toBlob((blob) => {
          if (!blob) return
          const resized = new File([blob], 'avatar.webp', { type: 'image/webp' })
          setPreview(URL.createObjectURL(resized))
          mutate(resized)
        }, 'image/webp', 0.9)
      }
    }
    reader.readAsDataURL(file)
  }

  const avatarSrc = preview ?? profile?.avatar_url

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-sm font-medium text-zinc-200 mb-4">Profile Photo</h2>
      <div className="flex items-center gap-5">
        <div className="relative group">
          <div className="h-20 w-20 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center">
            {loading ? (
              <Skeleton className="h-20 w-20 rounded-full bg-zinc-800" />
            ) : avatarSrc ? (
              <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-semibold text-zinc-300">
                {getInitials(profile?.full_name, profile?.email)}
              </span>
            )}
          </div>
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
            className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
            Change Avatar
          </button>
          <p className="text-xs text-zinc-500 mt-1">JPG, PNG, WebP · Max 2 MB</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </section>
  )
}
