import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LandingNav } from '@/components/landing/landing-nav'
import { CanvasPreview } from '@/components/landing/canvas-preview'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import {
  GitBranch,
  BookOpen,
  Gamepad2,
  Play,
  ArrowRight,
  Key,
  Layers,
  Zap,
} from 'lucide-react'

export default async function LandingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 overflow-x-hidden">
      <LandingNav />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center text-center px-6 pt-32 pb-20">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden">
          <div className="h-150 w-225 rounded-full bg-violet-600/10 blur-[120px] -translate-y-1/4" />
        </div>

        <Badge
          variant="outline"
          className="mb-6 border-violet-500/40 bg-violet-500/10 text-violet-400 text-xs tracking-wide"
        >
          Context Engineering · Not Prompt Guessing
        </Badge>

        <h1 className="relative max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          The{' '}
          <span className="bg-linear-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent">
            Postman
          </span>{' '}
          for LLM Context
        </h1>

        <p className="mt-6 max-w-2xl text-xl text-zinc-400 leading-relaxed">
          Build, test, and optimize RAG pipelines visually.
          No prompt guessing. No black boxes.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button
            render={<Link href="/login" />}
            size="lg"
            className="bg-violet-600 hover:bg-violet-500 text-white px-8 h-12 text-base font-medium"
          >
            Start Building Free
          </Button>
          <Button
            render={<a href="https://github.com/mohammedziada92/context-engineering-toolkit" target="_blank" rel="noopener noreferrer" />}
            size="lg"
            variant="ghost"
            className="h-12 text-base text-zinc-300 hover:text-white gap-2"
          >
            <Play className="h-4 w-4 fill-current" />
            View Demo
          </Button>
        </div>

        {/* Canvas Preview */}
        <div className="relative mt-16 w-full max-w-5xl">
          <div className="absolute inset-0 rounded-2xl bg-linear-to-b from-violet-500/20 to-transparent blur-xl -z-10" />
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <span className="ml-3 text-xs text-zinc-500 font-mono">RAG Pipeline v2 — Canvas</span>
            </div>
            <CanvasPreview />
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ──────────────────────────────────────── */}
      <section className="border-y border-zinc-800 bg-zinc-900/40 py-6">
        <div className="mx-auto max-w-4xl px-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <p className="text-sm text-zinc-500 font-medium whitespace-nowrap">Works with</p>
          <div className="flex items-center gap-8">
            <svg className="h-5 opacity-40 hover:opacity-70 transition-opacity" viewBox="0 0 120 28" fill="white" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="22" fontFamily="system-ui" fontSize="18" fontWeight="600">Anthropic</text>
            </svg>
            <span className="text-zinc-700">&middot;</span>
            <svg className="h-5 opacity-40 hover:opacity-70 transition-opacity" viewBox="0 0 80 28" fill="white" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="22" fontFamily="system-ui" fontSize="18" fontWeight="600">Google</text>
            </svg>
            <span className="text-zinc-700">&middot;</span>
            <svg className="h-5 opacity-40 hover:opacity-70 transition-opacity" viewBox="0 0 50 28" fill="white" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="22" fontFamily="system-ui" fontSize="18" fontWeight="600">Z.ai</text>
            </svg>
          </div>
          <p className="text-xs text-zinc-600 sm:ml-2">via OpenRouter</p>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight">
            Everything you need to engineer context
          </h2>
          <p className="mt-3 text-zinc-400 max-w-xl mx-auto">
            Stop debugging blind. Start engineering with precision.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="bg-zinc-900 border-zinc-800 hover:border-violet-500/40 transition-colors">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                  <f.icon className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="font-semibold text-zinc-100 mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="border-y border-zinc-800 bg-zinc-900/30 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight">Up and running in minutes</h2>
            <p className="mt-3 text-zinc-400">Three steps from zero to your first pipeline run.</p>
          </div>

          <div className="relative grid gap-8 sm:grid-cols-3">
            <div className="absolute top-5 left-1/6 right-1/6 hidden sm:block h-px bg-linear-to-r from-violet-500/0 via-violet-500/40 to-violet-500/0" />

            {STEPS.map((step, i) => (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-violet-500/50 bg-violet-500/10 text-sm font-bold text-violet-400">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-zinc-100 mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 py-28 text-center">
        <h2 className="text-4xl font-bold tracking-tight mb-4">
          Ready to engineer better context?
        </h2>
        <p className="text-zinc-400 mb-10 text-lg">
          Free forever. Bring your own OpenRouter key. No card required.
        </p>
        <Button
          render={<Link href="/login" />}
          size="lg"
          className="bg-violet-600 hover:bg-violet-500 text-white px-10 h-12 text-base font-medium gap-2"
        >
          Start Building Free
          <ArrowRight className="h-4 w-4" />
        </Button>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <CETLogo className="h-5 w-5 text-violet-400" />
            <span className="text-sm font-semibold text-zinc-300">CET</span>
            <span className="text-zinc-600 text-sm ml-2">&copy; 2026</span>
          </div>
          <nav className="flex items-center gap-6">
            {['Docs', 'GitHub', 'Privacy', 'Terms'].map((item) => (
              <a key={item} href="#" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">
                {item}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}

/* ── Data ─────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: GitBranch,
    title: 'Visual Pipeline Builder',
    description:
      'Drag-and-drop React Flow canvas. Connect System Prompt \u2192 RAG \u2192 History \u2192 LLM \u2192 Output nodes. No code required.',
  },
  {
    icon: BookOpen,
    title: 'Knowledge Base Management',
    description:
      'Upload PDFs, URLs, or paste text. Chunked and embedded via multilingual-e5-large into pgvector automatically.',
  },
  {
    icon: Gamepad2,
    title: 'Live Playground Streaming',
    description:
      'Test any model or pipeline with real-time SSE streaming. See token usage, cost, and latency per message.',
  },
  {
    icon: Layers,
    title: 'Token Budget Control',
    description:
      'Color-coded budget bar on every pipeline canvas. Allocate context across System Prompt, RAG, and History blocks.',
  },
  {
    icon: Zap,
    title: 'Real-Time Analytics',
    description:
      'Token usage, cost by model, latency distribution, and run history \u2014 all scoped to your pipelines.',
  },
  {
    icon: Key,
    title: 'BYOK \u00b7 Zero Markup',
    description:
      'Bring your own OpenRouter key. All LLM costs go directly to your account. CET charges you nothing.',
  },
]

const STEPS = [
  {
    title: 'Connect your OpenRouter key',
    description: 'Paste your API key in Settings. CET encrypts it via Supabase Vault \u2014 it never leaves your account.',
  },
  {
    title: 'Build your pipeline',
    description: 'Drag nodes onto the canvas, upload a knowledge source, set your prompts and thresholds.',
  },
  {
    title: 'Run & iterate',
    description: 'Stream live responses, inspect retrieved chunks, compare models, and tune until it\'s right.',
  },
]

/* ── Inline SVG Logo ──────────────────────────────────────────── */
function CETLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="CET Logo"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 17.5h7M17.5 14v7" />
    </svg>
  )
}
