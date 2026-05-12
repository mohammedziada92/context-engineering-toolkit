-- 008_chunks.sql
-- Vector chunks table — heart of RAG
-- Requires: 001_extensions.sql (pgvector)
-- Source: DATABASE.md

CREATE TABLE public.chunks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_source_id UUID NOT NULL REFERENCES public.knowledgesources(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content             TEXT NOT NULL,
    content_hash        TEXT,
    embedding           VECTOR(1024) NOT NULL,  -- intfloat/multilingual-e5-large
    token_count         INTEGER,
    chunk_index         INTEGER NOT NULL,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
