-- 009_promptlibrary.sql
-- Saved prompts / prompt templates
-- Source: DATABASE.md

CREATE TABLE public.promptlibrary (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    content     TEXT NOT NULL,
    description TEXT,
    tags        TEXT[] DEFAULT '{}',
    is_template BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-update updated_at
CREATE TRIGGER set_promptlibrary_updated_at
    BEFORE UPDATE ON public.promptlibrary
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
