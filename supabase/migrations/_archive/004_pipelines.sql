-- 004_pipelines.sql
-- pipelines table
-- Source: DATABASE.md

CREATE TABLE public.pipelines (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    description      TEXT,
    version          INTEGER NOT NULL DEFAULT 1,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    canvas_state     JSONB,
    pipeline_config  JSONB,
    token_budget     INTEGER NOT NULL DEFAULT 4096,
    model            TEXT,
    tags             TEXT[] DEFAULT '{}',
    last_run_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-update updated_at
CREATE TRIGGER set_pipelines_updated_at
    BEFORE UPDATE ON public.pipelines
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
