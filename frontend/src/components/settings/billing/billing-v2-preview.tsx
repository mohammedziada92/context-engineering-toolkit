'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Check } from 'lucide-react'
import { getAuthHeader } from '@/lib/api/api'

const V2_FEATURES = [
  'Team workspaces & shared pipelines',
  'Priority support',
  'Advanced evaluation & A/B testing',
  'Prompt library with version history',
  'Custom embedding model support',
]

interface BillingV2PreviewProps {
  userEmail: string
}

export function BillingV2Preview({ userEmail }: BillingV2PreviewProps) {
  const [email, setEmail] = useState(userEmail)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleNotify() {
    setStatus('loading')
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/billing/notify-interest`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(await getAuthHeader()),
          },
          body: JSON.stringify({ email, plan: 'pro' }),
        }
      )
      if (!res.ok) throw new Error()
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <CardTitle className="text-base font-semibold text-zinc-100">
            CET Pro — Coming Soon
          </CardTitle>
        </div>
        <p className="text-sm text-zinc-400 mt-1">
          Get notified when Pro launches. No spam — one email, when it&apos;s ready.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {V2_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
              <div className="h-1.5 w-1.5 rounded-full bg-violet-500/60 shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {status === 'done' ? (
          <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <Check className="h-4 w-4 text-emerald-400" />
            <p className="text-sm text-emerald-300">
              You&apos;re on the list — we&apos;ll email you when Pro launches.
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="notify-email" className="sr-only">Email</Label>
              <Input
                id="notify-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 h-9 text-sm"
                disabled={status === 'loading'}
              />
            </div>
            <Button
              onClick={handleNotify}
              disabled={!email || status === 'loading'}
              size="sm"
              className="bg-violet-600 hover:bg-violet-500 text-white h-9 font-medium whitespace-nowrap"
            >
              {status === 'loading' ? 'Sending\u2026' : 'Notify Me'}
            </Button>
          </div>
        )}

        {status === 'error' && (
          <p className="text-xs text-red-400">
            Something went wrong. Try again.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
