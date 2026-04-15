import { Suspense } from 'react'
import type { Metadata } from 'next'
import { KnowledgePageContent } from '@/components/knowledge/KnowledgePageContent'
import { KnowledgeSkeleton }    from '@/components/knowledge/KnowledgeSkeleton'

export const metadata: Metadata = { title: 'Knowledge Base — CET' }

export default function KnowledgePage() {
  return (
    <Suspense fallback={<KnowledgeSkeleton />}>
      <KnowledgePageContent />
    </Suspense>
  )
}
