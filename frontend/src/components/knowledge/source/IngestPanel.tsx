'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FileText, Link2, Upload, Loader2, CheckCircle2 } from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ingestText, ingestFile, ingestUrl } from '@/lib/api/knowledge'

type Mode = 'text' | 'file' | 'url'

const textSchema = z.object({
  title:   z.string().min(1, 'Required'),
  content: z.string().min(10, 'Min 10 characters'),
})

const urlSchema = z.object({
  url: z.string().url('Must be a valid URL'),
})

export function IngestPanel({ sourceId }: { sourceId: string }) {
  const [mode,    setMode]    = useState<Mode>('text')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileRef               = useRef<HTMLInputElement>(null)
  const qc                    = useQueryClient()

  const textForm = useForm({ resolver: zodResolver(textSchema) })
  const urlForm  = useForm({ resolver: zodResolver(urlSchema) })

  async function onTextSubmit(data: z.infer<typeof textSchema>) {
    setLoading(true)
    try {
      await ingestText(sourceId, data)
      textForm.reset()
      showSuccess()
    } catch { toast.error('Ingestion failed') }
    finally   { setLoading(false) }
  }

  async function onUrlSubmit(data: z.infer<typeof urlSchema>) {
    setLoading(true)
    try {
      await ingestUrl(sourceId, data)
      urlForm.reset()
      showSuccess()
    } catch { toast.error('URL ingestion failed') }
    finally   { setLoading(false) }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      await ingestFile(sourceId, file)
      showSuccess()
    } catch { toast.error('File upload failed') }
    finally   { setLoading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  function showSuccess() {
    setSuccess(true)
    qc.invalidateQueries({ queryKey: ['knowledge-source', sourceId] })
    qc.invalidateQueries({ queryKey: ['knowledge'] })
    setTimeout(() => setSuccess(false), 3000)
    toast.success('Content queued for ingestion', {
      description: 'Chunks will appear in the Chunks tab once processing completes.',
    })
  }

  const tabs: { id: Mode; icon: React.ElementType; label: string }[] = [
    { id: 'text', icon: FileText, label: 'Paste Text' },
    { id: 'file', icon: Upload,   label: 'Upload File' },
    { id: 'url',  icon: Link2,    label: 'From URL' },
  ]

  return (
    <div className="max-w-2xl space-y-5">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg w-fit">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
              ${mode === id
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'}
            `}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Content queued — processing in background…
        </div>
      )}

      {/* Text mode */}
      {mode === 'text' && (
        <form onSubmit={textForm.handleSubmit(onTextSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Document Title</Label>
            <Input
              {...textForm.register('title')}
              placeholder="e.g. Product FAQ v2"
              className="bg-zinc-900 border-zinc-800 text-zinc-200 text-sm"
            />
            {textForm.formState.errors.title && (
              <p className="text-[11px] text-red-400">{textForm.formState.errors.title.message as string}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Content</Label>
            <Textarea
              {...textForm.register('content')}
              placeholder="Paste your document content here…"
              rows={10}
              className="bg-zinc-900 border-zinc-800 text-zinc-200 text-sm resize-y font-mono text-xs"
            />
            {textForm.formState.errors.content && (
              <p className="text-[11px] text-red-400">{textForm.formState.errors.content.message as string}</p>
            )}
          </div>
          <Button
            type="submit" size="sm"
            className="bg-violet-600 hover:bg-violet-500 text-white"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            {loading ? 'Ingesting…' : 'Ingest Text'}
          </Button>
        </form>
      )}

      {/* File mode */}
      {mode === 'file' && (
        <div className="space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-zinc-800 rounded-xl p-10 text-center cursor-pointer hover:border-zinc-600 hover:bg-zinc-900/50 transition-colors"
          >
            <Upload className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-400">Click to upload</p>
            <p className="text-[11px] text-zinc-600 mt-1">PDF, TXT, MD, DOCX — max 20MB</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.md,.docx"
            className="hidden"
            onChange={onFileChange}
          />
          {loading && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading and queuing for ingestion…
            </div>
          )}
        </div>
      )}

      {/* URL mode */}
      {mode === 'url' && (
        <form onSubmit={urlForm.handleSubmit(onUrlSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Web URL</Label>
            <Input
              {...urlForm.register('url')}
              placeholder="https://docs.example.com/page"
              className="bg-zinc-900 border-zinc-800 text-zinc-200 text-sm"
            />
            {urlForm.formState.errors.url && (
              <p className="text-[11px] text-red-400">{urlForm.formState.errors.url.message as string}</p>
            )}
            <p className="text-[10px] text-zinc-600">
              The backend will fetch, parse, and chunk the page content.
            </p>
          </div>
          <Button
            type="submit" size="sm"
            className="bg-violet-600 hover:bg-violet-500 text-white"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            {loading ? 'Fetching…' : 'Ingest URL'}
          </Button>
        </form>
      )}
    </div>
  )
}
