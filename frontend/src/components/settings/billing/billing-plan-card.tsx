'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'

const FREE_PLAN_FEATURES = [
  'Unlimited pipelines',
  'Unlimited knowledge sources',
  'Unlimited playground sessions',
  'Full analytics dashboard',
  'All 3 LLM models via OpenRouter',
  'pgvector semantic search',
  'BYOK — your OpenRouter key',
]

interface BillingPlanCardProps {
  memberSince: string
}

export function BillingPlanCard({ memberSince }: BillingPlanCardProps) {
  const formatted = new Date(memberSince).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">CET Free Plan</h2>
            <p className="text-sm text-zinc-400 mt-0.5">Member since {formatted}</p>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </Badge>
        </div>
        <p className="text-sm text-zinc-400 mt-2">
          Everything you need to get started. No credit card required.
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {FREE_PLAN_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-sm text-zinc-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
