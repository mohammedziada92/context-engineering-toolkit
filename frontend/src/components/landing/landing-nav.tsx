'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, X } from 'lucide-react'

export function LandingNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-800/60 backdrop-blur-md bg-zinc-950/80">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-100 hover:text-white transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-violet-400" aria-hidden>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 17.5h7M17.5 14v7" />
          </svg>
          <span>CET</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <a href="#" className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors rounded-md hover:bg-zinc-800/60">
            Docs
          </a>
          <a
            href="https://github.com/mohammedziada92/context-engineering-toolkit"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors rounded-md hover:bg-zinc-800/60"
          >
            GitHub
          </a>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <Button
            render={<Link href="/login" />}
            variant="ghost"
            size="sm"
            className="text-zinc-300 hover:text-white"
          >
            Sign In
          </Button>
          <Button
            render={<Link href="/login" />}
            size="sm"
            className="bg-violet-600 hover:bg-violet-500 text-white font-medium"
          >
            Start
          </Button>
        </div>

        {/* Mobile Hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="sm:hidden text-zinc-400 hover:text-zinc-100">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-zinc-900 border-zinc-800 p-0">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <span className="font-semibold text-zinc-100">CET</span>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-zinc-400">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              {['Docs', 'GitHub'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {item}
                </a>
              ))}
              <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-col gap-2">
                <Button
                  render={<Link href="/login" />}
                  variant="outline"
                  className="border-zinc-700 text-zinc-200"
                  onClick={() => setOpen(false)}
                >
                  Sign In
                </Button>
                <Button
                  render={<Link href="/login" />}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                  onClick={() => setOpen(false)}
                >
                  Start Building Free
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
