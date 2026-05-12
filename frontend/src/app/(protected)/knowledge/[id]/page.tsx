import { Suspense } from 'react'
import type { Metadata } from 'next'
import { KnowledgeSourceContent } from '@/components/knowledge/source/KnowledgeSourceContent'
import { KnowledgeSourceSkeleton } from '@/components/knowledge/source/KnowledgeSourceSkeleton'

export const metadata: Metadata = { title: 'Knowledge Source — CET' }

export default async function KnowledgeSourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Suspense fallback={<KnowledgeSourceSkeleton />}>
      <KnowledgeSourceContent id={id} />
    </Suspense>
  )
}
