'use client'

import { useEffect, useState } from 'react'

const directPhrases = [
  "Routing to model...",
  "Thinking...",
  "Streaming response...",
]

const ragPhrases = [
  "Searching knowledge base...",
  "Ranking by similarity...",
  "Retrieving context...",
  "Assembling context window...",
  "Counting tokens...",
  "Building prompt...",
  "Routing to model...",
  "Streaming response...",
]

interface ThinkingLoaderProps {
  isRAG: boolean
}

export function ThinkingLoader({ isRAG }: ThinkingLoaderProps) {
  const phrases = isRAG ? ragPhrases : directPhrases
  const [index, setIndex] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (reducedMotion) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length)
    }, 1500)
    return () => clearInterval(id)
  }, [phrases.length, reducedMotion])

  const phrase = reducedMotion ? 'Thinking...' : phrases[index]

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
      {!reducedMotion && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
      )}
      {phrase}
    </span>
  )
}
