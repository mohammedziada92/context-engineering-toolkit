import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PipelinesPageContent } from '@/components/pipelines/PipelinesPageContent'
import { PipelinesSkeleton } from '@/components/pipelines/PipelinesSkeleton'

export const metadata: Metadata = { title: 'Pipelines — CET' }

export default function PipelinesPage() {
  return (
    <Suspense fallback={<PipelinesSkeleton />}>
      <PipelinesPageContent />
    </Suspense>
  )
}
