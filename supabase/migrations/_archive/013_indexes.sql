-- 013_indexes.sql
-- Performance indexes for all CET tables
-- Source: DATABASE.md

-- ── usersettings ────────────────────────────────────────────
CREATE INDEX idx_usersettings_user_id ON public.usersettings(user_id);

-- ── pipelines ───────────────────────────────────────────────
CREATE INDEX idx_pipelines_user_id    ON public.pipelines(user_id);
CREATE INDEX idx_pipelines_is_active  ON public.pipelines(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_pipelines_last_run   ON public.pipelines(user_id, last_run_at DESC NULLS LAST);

-- ── pipelineversions ────────────────────────────────────────
CREATE INDEX idx_pipelineversions_pipeline_id ON public.pipelineversions(pipeline_id);
CREATE INDEX idx_pipelineversions_pipeline_version ON public.pipelineversions(pipeline_id, version DESC);

-- ── pipelineruns ────────────────────────────────────────────
CREATE INDEX idx_pipelineruns_pipeline_id  ON public.pipelineruns(pipeline_id);
CREATE INDEX idx_pipelineruns_user_id      ON public.pipelineruns(user_id);
CREATE INDEX idx_pipelineruns_created_at   ON public.pipelineruns(user_id, created_at DESC);
CREATE INDEX idx_pipelineruns_model_used   ON public.pipelineruns(user_id, model_used);

-- ── knowledgesources ────────────────────────────────────────
CREATE INDEX idx_knowledgesources_user_id ON public.knowledgesources(user_id);
CREATE INDEX idx_knowledgesources_status  ON public.knowledgesources(user_id, status);
-- Trigram index (requires pgtrgm — skip if not available)
DO $$ BEGIN
    CREATE INDEX idx_knowledgesources_name_trgm ON public.knowledgesources USING gin(name gin_trgm_ops);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping knowledgesources trigram index — pgtrgm not available';
END $$;

-- ── chunks ──────────────────────────────────────────────────
-- IVFFlat index for vector similarity search (cosine)
-- Must be created AFTER data is loaded for optimal centroid selection
-- lists = 100 is appropriate for up to ~1M rows
CREATE INDEX idx_chunks_embedding ON public.chunks
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_chunks_knowledge_source_id ON public.chunks(knowledge_source_id);
CREATE INDEX idx_chunks_user_id             ON public.chunks(user_id);
CREATE INDEX idx_chunks_source_index        ON public.chunks(knowledge_source_id, chunk_index);

-- ── promptlibrary ───────────────────────────────────────────
CREATE INDEX idx_promptlibrary_user_id ON public.promptlibrary(user_id);
DO $$ BEGIN
    CREATE INDEX idx_promptlibrary_name_trgm ON public.promptlibrary USING gin(name gin_trgm_ops);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping promptlibrary trigram index — pgtrgm not available';
END $$;
CREATE INDEX idx_promptlibrary_tags ON public.promptlibrary USING gin(tags);

-- ── chatsessions ────────────────────────────────────────────
CREATE INDEX idx_chatsessions_user_id ON public.chatsessions(user_id);
CREATE INDEX idx_chatsessions_created ON public.chatsessions(user_id, created_at DESC);

-- ── chatmessages ────────────────────────────────────────────
CREATE INDEX idx_chatmessages_session_id ON public.chatmessages(session_id);
CREATE INDEX idx_chatmessages_created_at ON public.chatmessages(session_id, created_at ASC);
