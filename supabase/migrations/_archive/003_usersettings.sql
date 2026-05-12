-- 003_usersettings.sql
-- usersettings table + CHECK constraint on default_model
-- Source: DATABASE.md

CREATE TABLE public.usersettings (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    openrouter_api_key TEXT,                -- encrypted via Supabase Vault in practice
    default_model     TEXT NOT NULL DEFAULT 'anthropic/claude-sonnet-4-6',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Only 3 supported models allowed
    CONSTRAINT valid_default_model CHECK (
        default_model IN (
            'anthropic/claude-sonnet-4-6',
            'z-ai/glm-5',
            'google/gemini-3.1-pro-preview'
        )
    )
);

-- Trigger: auto-update updated_at
CREATE TRIGGER set_usersettings_updated_at
    BEFORE UPDATE ON public.usersettings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
