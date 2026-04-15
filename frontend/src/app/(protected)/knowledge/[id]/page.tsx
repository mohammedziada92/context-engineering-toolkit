import { Suspense } from 'react'
import type { Metadata } from 'next'
import { KnowledgeSourceContent } from '@/components/knowledge/source/KnowledgeSourceContent'
import { KnowledgeSourceSkeleton } from '@/components/knowledge/source/KnowledgeSourceSkeleton'

export const metadata: Metadata = { title: 'Knowledge Source — CET' }

export default function KnowledgeSourcePage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<KnowledgeSourceSkeleton />}>
      <KnowledgeSourceContent id={params.id} />
    </Suspense>
  )
}
