import { FileText, Layers, Cpu } from 'lucide-react'
import { format } from 'date-fns'
import type { KnowledgeSource } from '@/lib/api/knowledge'

export function SourceMetaCard({ source }: { source: KnowledgeSource }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px border-b border-zinc-800 bg-zinc-800">
      {[
        { icon: FileText, label: 'Documents',       value: source.document_count.toLocaleString() },
        { icon: Layers,   label: 'Chunks',          value: source.chunk_count.toLocaleString() },
        { icon: Cpu,      label: 'Embedding Model', value: source.embedding_model },
        { icon: null,     label: 'Created',         value: format(new Date(source.created_at), 'MMM d, yyyy') },
      ].map(({ icon: Icon, label, value }) => (
        <div key={label} className="bg-zinc-950 px-5 py-3 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-wider">
            {Icon && <Icon className="h-3 w-3" />}
            {label}
          </div>
          <p className="text-sm font-semibold text-zinc-200 tabular-nums">{value}</p>
        </div>
      ))}
    </div>
  )
}
