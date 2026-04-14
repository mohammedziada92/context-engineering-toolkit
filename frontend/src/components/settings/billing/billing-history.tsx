import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink } from 'lucide-react'

export function BillingHistory() {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-zinc-100">Billing History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-zinc-400">
          CET is currently <span className="text-zinc-200 font-medium">free</span>. No payments have been made to CET.
          LLM costs are billed directly by OpenRouter — not CET.
        </p>
        <a
          href="https://openrouter.ai/activity"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          OpenRouter Dashboard
        </a>
      </CardContent>
    </Card>
  )
}
