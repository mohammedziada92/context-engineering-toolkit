-- 007_knowledgesources.sql
-- Knowledge source metadata — tracks upload/ingestion status
-- Source: DATABASE.md

CREATE TABLE public.knowledgesources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL CHECK (type IN ('pdf', 'txt', 'url', 'text')),
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'embedding', 'ready', 'error')),
    content_hash    TEXT,
    storage_path    TEXT,
    source_url      TEXT,
    error_message   TEXT,
    metadata        JSONB,
    chunk_config    JSONB,
    embedding_model TEXT NOT NULL DEFAULT 'intfloat/multilingual-e5-large',
    total_chunks    INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-update updated_at
CREATE TRIGGER set_knowledgesources_updated_at
    BEFORE UPDATE ON public.knowledgesources
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
