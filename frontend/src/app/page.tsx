import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <Link href="/" className="shrink-0">
          <img
            src="https://drive.google.com/uc?export=view&id=1IOVW10GGZTht1tyXmsUOAK-C1QzYPIy8"
            alt="CET"
            height={32}
            className="h-8 w-auto"
          />
        </Link>
        <div className="flex items-center gap-6">
          <a href="#" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            Docs
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            GitHub
          </a>
          <Link
            href="/login"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            The Postman for{' '}
            <span className="text-primary">LLM Context</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Build, test, and optimize RAG pipelines visually. No prompt guessing. No black boxes.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start Building Free
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
