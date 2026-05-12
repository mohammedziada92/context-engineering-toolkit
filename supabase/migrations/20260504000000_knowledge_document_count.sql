-- Track number of distinct ingestions (documents) per knowledge source
ALTER TABLE public.knowledge_sources
  ADD COLUMN IF NOT EXISTS document_count INTEGER NOT NULL DEFAULT 0;
