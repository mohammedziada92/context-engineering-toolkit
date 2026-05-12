'use client'

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster, toast } from 'sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'

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
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
