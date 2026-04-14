'use client'

import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

/* ── Context ──────────────────────────────────────────────────── */

interface SheetCtx {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SheetContext = createContext<SheetCtx>({
  open: false,
  onOpenChange: () => {},
})

/* ── Sheet ────────────────────────────────────────────────────── */

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

export function Sheet({ open = false, onOpenChange, children }: SheetProps) {
  const handleOpenChange = useCallback(
    (v: boolean) => onOpenChange?.(v),
    [onOpenChange],
  )

  return (
    <SheetContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </SheetContext.Provider>
  )
}

/* ── SheetTrigger ─────────────────────────────────────────────── */

interface SheetTriggerProps {
  asChild?: boolean
  children: ReactNode
  className?: string
}

export function SheetTrigger({ asChild, children, className }: SheetTriggerProps) {
  const { onOpenChange } = useContext(SheetContext)

  if (asChild && isValidElement(children)) {
    return cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onClick: () => onOpenChange(true),
      className: cn(
        (children as React.ReactElement<{ className?: string }>).props.className,
        className,
      ),
    })
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => onOpenChange(true)}
    >
      {children}
    </button>
  )
}

/* ── SheetContent ─────────────────────────────────────────────── */

interface SheetContentProps {
  side?: 'left' | 'right'
  className?: string
  children: ReactNode
}

export function SheetContent({
  side = 'right',
  className,
  children,
}: SheetContentProps) {
  const { open, onOpenChange } = useContext(SheetContext)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onOpenChange])

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'fixed inset-y-0 z-50 flex flex-col bg-background shadow-xl transition-transform duration-300 ease-out',
          side === 'right'
            ? 'right-0 animate-in slide-in-from-right duration-300'
            : 'left-0 animate-in slide-in-from-left duration-300',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
