-- Add description column to knowledge_sources
ALTER TABLE public.knowledge_sources
  ADD COLUMN IF NOT EXISTS description TEXT;
