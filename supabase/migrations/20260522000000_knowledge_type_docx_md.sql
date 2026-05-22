-- Add docx and md to the knowledge_sources type CHECK constraint.
-- The original constraint only allowed ('pdf', 'txt', 'url', 'text').

ALTER TABLE public.knowledge_sources
  DROP CONSTRAINT knowledge_sources_type_check;

ALTER TABLE public.knowledge_sources
  ADD CONSTRAINT knowledge_sources_type_check
  CHECK (type IN ('pdf', 'txt', 'url', 'text', 'docx', 'md'));
