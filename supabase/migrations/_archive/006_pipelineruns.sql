-- 006_pipelineruns.sql
-- Pipeline execution logs — append-only, never update or delete after creation
-- Source: DATABASE.md

CREATE TABLE public.pipelineruns (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id       UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_message      TEXT NOT NULL,
    llm_response      TEXT,
    model_used        TEXT NOT NULL,
    prompt_tokens     INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens      INTEGER DEFAULT 0,
    cost_usd          NUMERIC(10,6) DEFAULT 0,
    latency_ms        INTEGER DEFAULT 0,
    retrieved_chunks  JSONB DEFAULT '[]',
    status            TEXT NOT NULL DEFAULT 'success'
                      CHECK (status IN ('success', 'error', 'cancelled')),
    error_message     TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable guards — silently reject update and delete
CREATE RULE no_update_pipelineruns AS ON UPDATE TO public.pipelineruns DO INSTEAD NOTHING;
CREATE RULE no_delete_pipelineruns AS ON DELETE TO public.pipelineruns DO INSTEAD NOTHING;
