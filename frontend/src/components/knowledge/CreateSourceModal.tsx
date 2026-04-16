'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'

const schema = z.object({
  name:            z.string().min(2, 'Min 2 characters').max(100, 'Max 100 characters'),
  description:     z.string().max(300, 'Max 300 characters').optional(),
  embedding_model: z.string(),
})

type FormData = z.infer<typeof schema>

const EMBEDDING_MODELS = [
  { id: 'text-embedding-3-small', label: 'text-embedding-3-small (OpenAI, fast + cheap)' },
  { id: 'text-embedding-3-large', label: 'text-embedding-3-large (OpenAI, high quality)' },
]

interface Props {
  creating: boolean
  onCreate: (data: { name: string; description?: string; embedding_model?: string }) => void
  onClose:  () => void
}

export function CreateSourceModal({ creating, onCreate, onClose }: Props) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { embedding_model: 'text-embedding-3-small' },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">New Knowledge Source</h2>
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 text-zinc-500 hover:text-zinc-200"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onCreate)} className="px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Name <span className="text-red-400">*</span></Label>
            <Input
              {...register('name')}
              placeholder="Product Docs, FAQ, Internal KB…"
              className="bg-zinc-900 border-zinc-800 text-zinc-200 text-sm"
              autoFocus
            />
            {errors.name && (
              <p className="text-[11px] text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Description</Label>
            <Textarea
              {...register('description')}
              placeholder="Optional — what documents belong here?"
              rows={2}
              className="bg-zinc-900 border-zinc-800 text-zinc-200 text-sm resize-none"
            />
            {errors.description && (
              <p className="text-[11px] text-red-400">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Embedding Model</Label>
            <Select
              defaultValue="text-embedding-3-small"
              onValueChange={(v) => setValue('embedding_model', v ?? '')}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {EMBEDDING_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-zinc-600">
              Cannot be changed after creation — all chunks use the same embedding space.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button" variant="ghost" size="sm"
              className="text-zinc-400 hover:text-zinc-200"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit" size="sm"
              className="bg-violet-600 hover:bg-violet-500 text-white"
              disabled={creating}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {creating ? 'Creating…' : 'Create Source'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
