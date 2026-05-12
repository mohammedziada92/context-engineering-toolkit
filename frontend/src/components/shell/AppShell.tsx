'use client'

import { useState } from 'react'
import { Sidebar }     from './Sidebar'
import { MobileNav }   from './MobileNav'

interface Props {
  children: React.ReactNode
}

export function AppShell({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-dvh overflow-hidden bg-zinc-950">
      {/* Desktop sidebar — fixed, not in flow */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-60 lg:flex-col">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-60 lg:hidden">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main content area — scrollable, offset for fixed sidebar */}
      <div className="lg:ml-60 flex flex-col h-full">
        {/* Mobile top bar */}
        <MobileNav onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content — full-height pages (canvas, playground) use flex-1; scrollable pages add their own overflow-y-auto wrapper */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
