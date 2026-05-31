import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of Service — CET' }

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mb-10">Effective Date: May 27, 2026</p>

        <section className="space-y-10 text-sm leading-relaxed text-zinc-300">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Overview</h2>
            <p>These Terms govern your use of the Context Engineering Toolkit (CET). By creating an account or using CET, you agree to these Terms. CET operates on a BYOK model — you supply your own OpenRouter API key to run LLM calls.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Eligibility</h2>
            <p>You must be at least 18 years old to use CET.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Your Account</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You are responsible for all activity under your account</li>
              <li>You must provide accurate information when signing up</li>
              <li>You may not share your account with others</li>
            </ul>
            <p className="mt-3">CET uses Google OAuth, GitHub OAuth, and Email OTP. We do not store passwords.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Bring Your Own Key (BYOK)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your API key is your own — CET does not provide or pay for LLM credits</li>
              <li>All LLM costs are billed directly to your OpenRouter account</li>
              <li>You are responsible for any costs incurred through your OpenRouter key while using CET</li>
              <li>CET stores your key encrypted and never exposes it in full after initial save</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Acceptable Use</h2>
            <p className="mb-2">You agree not to use CET to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe the intellectual property rights of any third party</li>
              <li>Upload malicious files or content designed to harm the Service or other users</li>
              <li>Attempt to access another user&apos;s data or circumvent Row Level Security</li>
              <li>Reverse engineer or decompile CET (except where permitted by applicable law or the open-source license)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Your Content</h2>
            <p>You retain ownership of all content you create in CET. By uploading content, you grant us a limited license to store and process it solely to provide the Service to you. We do not use your content to train AI models.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Service Availability</h2>
            <p>CET is provided on an as-is, as-available basis. We recommend exporting critical pipeline configurations via JSON export as a backup.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Current Plan — Free MVP</h2>
            <p>CET is currently free to use. There are no charges or subscriptions required. An optional Buy Me a Coffee donation link is available in the app — donations are voluntary, processed entirely by Buy Me a Coffee&apos;s platform, and do not affect your access to CET in any way.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Intellectual Property</h2>
            <p>CET and its original content are owned by the CET team. The source code is available on GitHub under the license specified in the repository.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Termination</h2>
            <p>We may suspend or terminate your account if you violate these Terms or engage in abusive or illegal activity. You may delete your account at any time from Settings → Profile → Danger Zone. Deletion is permanent and irreversible.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Limitation of Liability</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>CET is provided &quot;as is&quot; without warranties of any kind</li>
              <li>We are not liable for any LLM costs incurred through your OpenRouter account</li>
              <li>Our total liability for any claim shall not exceed the amount you have paid us in the past 12 months</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">Changes to These Terms</h2>
            <p>We may update these Terms as CET evolves. Continued use after changes constitutes acceptance.</p>
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
