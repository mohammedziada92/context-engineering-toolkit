-- 010_chatsessions.sql
-- Playground chat sessions
-- Source: DATABASE.md

CREATE TABLE public.chatsessions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title      TEXT,
    model      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-update updated_at
CREATE TRIGGER set_chatsessions_updated_at
    BEFORE UPDATE ON public.chatsessions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
