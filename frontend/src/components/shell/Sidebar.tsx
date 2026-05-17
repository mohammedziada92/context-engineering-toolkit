'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter }   from 'next/navigation'
import {
  Layers, LayoutDashboard, GitBranch,
  Database, Gamepad2, BarChart2, Settings, LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
  { href: '/pipelines',  icon: GitBranch,       label: 'Pipelines'  },
  { href: '/knowledge',  icon: Database,        label: 'Knowledge'  },
  { href: '/playground', icon: Gamepad2,        label: 'Playground' },
  { href: '/analytics',  icon: BarChart2,       label: 'Analytics'  },
  { href: '/settings',   icon: Settings,        label: 'Settings'   },
]

interface Props {
  onClose?: () => void
}

export function Sidebar({ onClose }: Props) {
  const pathname  = usePathname()
  const router    = useRouter()
  const { user, signOut } = useAuthStore()
  const [avatarBroken, setAvatarBroken] = useState(false)

  const showAvatar = user?.user_metadata?.avatar_url && !avatarBroken

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  function isActive(href: string) {
    // /pipelines/new and /pipelines/[id] both highlight the Pipelines nav item
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-zinc-800 shrink-0">
        <div className="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center">
          <Layers className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-zinc-100 tracking-tight">CET</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive(href)
                ? 'bg-violet-600/15 text-violet-300'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/70'
            )}
          >
            <Icon className={cn(
              'h-4 w-4 shrink-0',
              isActive(href) ? 'text-violet-400' : 'text-zinc-600'
            )} />
            {label}
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-2 py-3 border-t border-zinc-800 shrink-0 space-y-0.5">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
          {/* Avatar */}
          {showAvatar ? (
            <img
              src={user.user_metadata.avatar_url}
              alt=""
              className="h-6 w-6 rounded-full shrink-0 object-cover"
              referrerPolicy="no-referrer"
              onError={() => setAvatarBroken(true)}
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-violet-700 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-semibold text-white uppercase">
                {user?.email?.[0] ?? '?'}
              </span>
            </div>
          )}
          <p className="text-[11px] text-zinc-400 truncate flex-1">{user?.email}</p>
        </div>

        <a
          href="https://www.buymeacoffee.com/MohammedZiada92"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          ☕ Buy me a coffee
        </a>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
