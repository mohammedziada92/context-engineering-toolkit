'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Profile', href: '/settings/profile' },
  { label: 'API Keys', href: '/settings/api-keys' },
  { label: 'Billing', href: '/settings/billing' },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b border-zinc-800 mb-8">
      {TABS.map(({ label, href }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              active
                ? 'text-violet-400 border-violet-500'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
