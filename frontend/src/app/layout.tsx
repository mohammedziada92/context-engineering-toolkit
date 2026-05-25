import type { Metadata, Viewport } from 'next'
import { Inter, Oxanium } from 'next/font/google'
import { Providers } from '@/components/Providers'
import '@xyflow/react/dist/style.css'
import './globals.css'
import { cn } from "@/lib/utils";

const oxanium = Oxanium({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default:  'Context Engineering Toolkit',
    template: '%s — CET',
  },
  description: 'Build, test, and optimize context windows for LLM-powered applications.',
  robots: { index: false, follow: false },   // internal tool — no indexing
}

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", oxanium.variable)} suppressHydrationWarning>
      <body className="min-h-dvh bg-zinc-950 text-zinc-100 antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
