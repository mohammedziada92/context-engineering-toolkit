import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <span className="text-lg font-semibold tracking-tight">
          <span className="text-primary">CET</span>
        </span>
        <Link
          href="/login"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Context Engineering
            <span className="text-primary"> Toolkit</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Build, test, and optimize context windows for LLM-powered
            applications. Manage pipelines, ingest knowledge sources, and
            analyze performance — all in one place.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              View on GitHub
            </a>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-6">
            {[
              'Visual Pipeline Builder',
              'RAG Knowledge Base',
              'Real-time Analytics',
              'Multi-model Support',
            ].map((f) => (
              <span
                key={f}
                className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-muted-foreground"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-zinc-600 border-t border-zinc-800">
        Context Engineering Toolkit &mdash; Internal Tool
      </footer>
    </div>
  )
}
