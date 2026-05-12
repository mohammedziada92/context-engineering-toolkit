import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PipelinesPageContent } from '@/components/pipelines/PipelinesPageContent'
import { PipelinesSkeleton } from '@/components/pipelines/PipelinesSkeleton'

export const metadata: Metadata = { title: 'Pipelines — CET' }

export default function PipelinesPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <Suspense fallback={<PipelinesSkeleton />}>
        <PipelinesPageContent />
      </Suspense>
    </div>
  )
}
