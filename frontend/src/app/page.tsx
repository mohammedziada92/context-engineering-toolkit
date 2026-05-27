import Link from 'next/link'
import { GitBranch, BookOpen, Gamepad2 } from 'lucide-react'

const FEATURES = [
  { icon: GitBranch, title: 'Visual Pipeline Builder', description: 'Drag-and-drop RAG pipeline canvas. Connect nodes visually — no code required.' },
  { icon: BookOpen, title: 'Knowledge Base Management', description: 'Upload PDFs, scrape URLs, paste text. Chunked, embedded, and ready for retrieval.' },
  { icon: Gamepad2, title: 'Live Playground & Streaming', description: 'Test any model or pipeline in real time with token usage and cost per message.' },
]

const STEPS = [
  { num: 1, title: 'Connect your OpenRouter key', description: 'Add your BYOK key in Settings. CET encrypts it — your credits, your control.' },
  { num: 2, title: 'Build your pipeline', description: 'Drag nodes onto the canvas. Connect retrieval, prompts, and models visually.' },
  { num: 3, title: 'Run & iterate in Playground', description: 'Send real messages, inspect retrieved chunks, and tune until it\'s right.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-zinc-950 text-zinc-100">
      {/* ── Nav ──────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <Link href="/" className="shrink-0">
          <img
            src="https://www.image2url.com/r2/default/images/1779700203013-7a29c0fa-6f5f-45b5-a83a-532b55c3af23.png"
            alt="CET"
            height={32}
            className="h-8 w-auto"
          />
        </Link>
        <div className="flex items-center gap-6">
          <a href="https://cet.mintlify.app/docs/introduction" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Docs</a>
          <a href="https://github.com/mohammedziada92/context-engineering-toolkit" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">GitHub</a>
          <Link href="/login" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">Sign In</Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            The Postman for <span className="text-primary">LLM Context</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Build, test, and optimize RAG pipelines visually. No prompt guessing. No black boxes.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link href="/login" className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              Start Building Free
            </Link>
            <a href="https://github.com/mohammedziada92/context-engineering-toolkit" target="_blank" rel="noopener noreferrer" className="rounded-md border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors">
              View on GitHub
            </a>
          </div>
        </div>
      </main>

      {/* ── Social Proof Bar ─────────────────────────────── */}
      <section className="py-10 border-t border-zinc-800/50">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-400">
          <span>Works with</span>
          <img src="https://cdn.simpleicons.org/anthropic/a1a1aa" alt="Anthropic" className="h-5 w-auto" />
          <span className="font-medium">Anthropic</span>
          <img src="https://cdn.simpleicons.org/google/a1a1aa" alt="Google" className="h-5 w-auto" />
          <span className="font-medium">Google</span>
          <span className="font-medium">Z.ai</span>
          <span className="text-zinc-500">via OpenRouter</span>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-3">
              <Icon className="h-6 w-6 text-violet-400" />
              <h3 className="text-white font-semibold">{title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative text-center space-y-2">
                <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-violet-500/10 text-violet-400 font-bold text-sm">{step.num}</span>
                <h3 className="text-white font-medium">{step.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
                {/* Connector line between steps (desktop only) */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-[calc(50%+2rem)] w-[calc(100%-4rem)] border-t border-zinc-700" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────── */}
      <section className="py-20 px-6 bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold">Ready to engineer better context?</h2>
          <Link href="/login" className="inline-block rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Start Building Free
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-zinc-800 py-6 text-center text-sm text-zinc-500">
        © 2026 CET ·{' '}
        <a href="https://cet.mintlify.app/docs/introduction" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">Docs</a>{' · '}
        <a href="https://github.com/mohammedziada92/context-engineering-toolkit" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">GitHub</a>{' · '}
        <a href="#" className="hover:text-zinc-300 transition-colors">Privacy</a>{' · '}
        <a href="#" className="hover:text-zinc-300 transition-colors">Terms</a>
      </footer>
    </div>
  )
}
