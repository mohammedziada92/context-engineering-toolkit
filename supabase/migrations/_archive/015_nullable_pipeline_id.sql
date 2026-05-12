-- 015_nullable_pipeline_id.sql
-- Allow pipelineruns.pipeline_id to be NULL for playground runs
-- (playground runs have no pipeline — direct LLM call)

ALTER TABLE public.pipelineruns
    ALTER COLUMN pipeline_id DROP NOT NULL;
