import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy Policy — CET' }

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-10">Effective Date: May 27, 2026</p>

        <section className="space-y-10 text-sm leading-relaxed text-zinc-300">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Overview</h2>
            <p>CET (Context Engineering Toolkit) is a developer tool for building, testing, and optimizing LLM context pipelines. This Privacy Policy explains what data we collect, how we use it, and how we protect it. CET operates on a BYOK (Bring Your Own Key) model — we do not pay for or control your LLM usage.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">What Data We Collect</h2>
            <h3 className="text-base font-medium text-zinc-200 mb-2">Account Data</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Email address — via Google OAuth, GitHub OAuth, or Email OTP</li>
              <li>Name and avatar — from your OAuth provider (optional, can be updated)</li>
            </ul>
            <p className="text-zinc-400 italic">We do not store passwords.</p>

            <h3 className="text-base font-medium text-zinc-200 mb-2 mt-6">API Keys</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Your OpenRouter API key is encrypted at rest using Supabase Vault</li>
              <li>It is never returned in full after initial save — only a masked version (sk-or-****) is shown</li>
              <li>It is used server-side only to route your LLM calls through OpenRouter</li>
            </ul>

            <h3 className="text-base font-medium text-zinc-200 mb-2 mt-6">Usage Data</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Pipeline configurations (canvas state, node settings, saved prompts)</li>
              <li>Pipeline run logs (token counts, cost estimates, latency, model used, retrieved chunks)</li>
              <li>Knowledge base content (uploaded documents, text chunks, vector embeddings)</li>
              <li>Chat session history (Playground messages)</li>
            </ul>

            <h3 className="text-base font-medium text-zinc-200 mb-2 mt-6">Analytics</h3>
            <p>Aggregated usage metrics per user: token usage, cost, latency, and run counts over time.</p>
            <p className="text-zinc-400 italic mt-1">We do not use third-party analytics trackers.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="text-zinc-200">Email address</span> → account identification, login, session management</li>
              <li><span className="text-zinc-200">OpenRouter API key</span> → routing your LLM calls via OpenRouter (BYOK)</li>
              <li><span className="text-zinc-200">Pipeline data</span> → saving and restoring your work</li>
              <li><span className="text-zinc-200">Run logs</span> → powering the Analytics dashboard</li>
              <li><span className="text-zinc-200">Knowledge base content</span> → vector search during pipeline execution</li>
            </ul>
            <p className="mt-4">We do not sell your data. We do not use your data to train AI models.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Data Isolation</h2>
            <p>All data is isolated per user using Row Level Security (RLS) enforced at the database level. No other user can access your data.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Third-Party Services</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="text-zinc-200">Supabase</span> — database, authentication, file storage</li>
              <li><span className="text-zinc-200">OpenRouter</span> — LLM routing (your API key and prompt content per request)</li>
              <li><span className="text-zinc-200">Vercel</span> — frontend hosting</li>
              <li><span className="text-zinc-200">Railway</span> — backend hosting</li>
              <li><span className="text-zinc-200">Sentry</span> — error monitoring (stack traces, anonymized error context)</li>
              <li><span className="text-zinc-200">Buy Me a Coffee</span> — optional donation platform; your payment data is handled entirely by Buy Me a Coffee — CET never sees or stores it</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Data Retention</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account data retained while your account is active</li>
              <li>Pipeline and run data retained until you delete it or your account</li>
              <li>Deleted knowledge sources cascade-delete all associated chunks and embeddings</li>
              <li>Account deletion removes all your data permanently and is irreversible</li>
            </ul>
            <p className="mt-3">You can delete your account at any time from Settings → Profile → Danger Zone.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Security</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>API keys encrypted at rest via Supabase Vault</li>
              <li>All data access protected by Row Level Security (RLS)</li>
              <li>All API requests require a valid JWT token verified on every request</li>
              <li>All data in transit encrypted via HTTPS/TLS</li>
              <li>API keys are never logged, never returned in full, never sent to the frontend after initial save</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Your Rights</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="text-zinc-200">Access</span> — all your data is visible within the CET app</li>
              <li><span className="text-zinc-200">Export</span> — pipelines can be exported as JSON</li>
              <li><span className="text-zinc-200">Delete</span> — delete individual resources or your entire account at any time</li>
              <li><span className="text-zinc-200">Correct</span> — update your name, avatar, and preferences in Settings</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Children&apos;s Privacy</h2>
            <p>CET is intended for users aged 18 and older. We do not knowingly collect data from children under 13.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Changes to This Policy</h2>
            <p>We may update this policy as CET evolves. Continued use after changes constitutes acceptance.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Contact</h2>
            <p>GitHub: <a href="https://github.com/mohammedziada92/context-engineering-toolkit" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">github.com/mohammedziada92/context-engineering-toolkit</a></p>
          </div>
        </section>
      </div>
    </div>
  )
}
