-- 005_pipelineversions.sql
-- Immutable pipeline version history — never overwrite, append-only
-- Source: DATABASE.md

CREATE TABLE public.pipelineversions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    version     INTEGER NOT NULL,
    snapshot    JSONB NOT NULL,            -- full canvas_state + config snapshot
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable guards — silently reject update and delete
CREATE RULE no_update_pipelineversions AS ON UPDATE TO public.pipelineversions DO INSTEAD NOTHING;
CREATE RULE no_delete_pipelineversions AS ON DELETE TO public.pipelineversions DO INSTEAD NOTHING;
