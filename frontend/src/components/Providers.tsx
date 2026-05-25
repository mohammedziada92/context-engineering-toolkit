'use client'

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { ThemeProvider, useTheme } from 'next-themes'
import { ErrorBoundary } from '@/components/ErrorBoundary'

/** Sync theme from backend preferences on mount (source of truth). */
function ThemeSync() {
  const { setTheme } = useTheme()
  useEffect(() => {
    fetch('/api/v1/settings/preferences', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((prefs: { theme?: string } | null) => {
        if (prefs?.theme) setTheme(prefs.theme)
      })
      .catch(() => {})
  }, [setTheme])
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  // One QueryClient per browser session — useState ensures it's stable across re-renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            const msg = error.message || 'Request failed'
            toast.error(msg)
          },
        }),
        defaultOptions: {
          queries: {
            retry:            1,
            refetchOnWindowFocus: false,
            staleTime:        30_000,
          },
        },
      })
  )

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ThemeSync />
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: '#18181b',
                border:     '1px solid #27272a',
                color:      '#d4d4d8',
                fontSize:   '13px',
              },
            }}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
