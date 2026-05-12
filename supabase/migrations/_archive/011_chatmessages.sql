-- 011_chatmessages.sql
-- Chat session messages — append-only
-- Source: DATABASE.md

CREATE TABLE public.chatmessages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES public.chatsessions(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content     TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent updates — append-only
CREATE OR REPLACE FUNCTION prevent_chatmessage_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'chatmessages are append-only — cannot update';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guard_chatmessage_update
    BEFORE UPDATE ON public.chatmessages
    FOR EACH ROW EXECUTE FUNCTION prevent_chatmessage_update();
