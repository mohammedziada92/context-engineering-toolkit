import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export function NoAPIKeyBanner() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
      <p className="text-sm text-amber-300 flex-1">
        Add your OpenRouter API key to run pipelines and use the playground.
      </p>
      <Link
        href="/settings/api-keys"
        className="text-xs font-medium text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded px-2.5 py-1 transition-colors flex-shrink-0"
      >
        Go to Settings
      </Link>
    </div>
  )
}
