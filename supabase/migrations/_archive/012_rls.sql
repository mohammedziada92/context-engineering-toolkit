-- 012_rls.sql
-- Enable Row Level Security + policies for all 10 CET tables
-- Source: DATABASE.md
-- Convention: users can only access their own data (user_id match)

-- ── Enable RLS on all tables ────────────────────────────────
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usersettings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelineversions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelineruns       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledgesources   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chunks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promptlibrary      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatsessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatmessages       ENABLE ROW LEVEL SECURITY;

-- ── users ────────────────────────────────────────────────────
CREATE POLICY "Users manage own profile"
    ON public.users FOR ALL
    USING (auth.uid() = id);

-- ── usersettings ────────────────────────────────────────────
CREATE POLICY "Users read own settings"
    ON public.usersettings FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users insert own settings"
    ON public.usersettings FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own settings"
    ON public.usersettings FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own settings"
    ON public.usersettings FOR DELETE
    USING (user_id = auth.uid());

-- ── pipelines ───────────────────────────────────────────────
CREATE POLICY "Users read own pipelines"
    ON public.pipelines FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users insert own pipelines"
    ON public.pipelines FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own pipelines"
    ON public.pipelines FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own pipelines"
    ON public.pipelines FOR DELETE
    USING (user_id = auth.uid());

-- ── pipelineversions ────────────────────────────────────────
CREATE POLICY "Users read own pipeline versions"
    ON public.pipelineversions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users insert own pipeline versions"
    ON public.pipelineversions FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ── pipelineruns ────────────────────────────────────────────
CREATE POLICY "Users read own pipeline runs"
    ON public.pipelineruns FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users insert own pipeline runs"
    ON public.pipelineruns FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ── knowledgesources ────────────────────────────────────────
CREATE POLICY "Users read own knowledge sources"
    ON public.knowledgesources FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users insert own knowledge sources"
    ON public.knowledgesources FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own knowledge sources"
    ON public.knowledgesources FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own knowledge sources"
    ON public.knowledgesources FOR DELETE
    USING (user_id = auth.uid());

-- ── chunks ──────────────────────────────────────────────────
CREATE POLICY "Users read own chunks"
    ON public.chunks FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users insert own chunks"
    ON public.chunks FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own chunks"
    ON public.chunks FOR DELETE
    USING (user_id = auth.uid());

-- ── promptlibrary ───────────────────────────────────────────
CREATE POLICY "Users read own prompts"
    ON public.promptlibrary FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users insert own prompts"
    ON public.promptlibrary FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own prompts"
    ON public.promptlibrary FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own prompts"
    ON public.promptlibrary FOR DELETE
    USING (user_id = auth.uid());

-- ── chatsessions ────────────────────────────────────────────
CREATE POLICY "Users read own chat sessions"
    ON public.chatsessions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users insert own chat sessions"
    ON public.chatsessions FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own chat sessions"
    ON public.chatsessions FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own chat sessions"
    ON public.chatsessions FOR DELETE
    USING (user_id = auth.uid());

-- ── chatmessages ────────────────────────────────────────────
CREATE POLICY "Users read own chat messages"
    ON public.chatmessages FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users insert own chat messages"
    ON public.chatmessages FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ── service_role grants (bypasses RLS for backend vault service) ──
-- The backend uses the Supabase service_role key to read/write settings
-- and manage pipeline data server-side. These grants are required because
-- the service_role role is not a table owner.
GRANT ALL ON public.users              TO service_role;
GRANT ALL ON public.usersettings       TO service_role;
GRANT ALL ON public.pipelines          TO service_role;
GRANT ALL ON public.pipelineversions   TO service_role;
GRANT ALL ON public.pipelineruns       TO service_role;
GRANT ALL ON public.knowledgesources   TO service_role;
GRANT ALL ON public.chunks             TO service_role;
GRANT ALL ON public.promptlibrary      TO service_role;
GRANT ALL ON public.chatsessions       TO service_role;
GRANT ALL ON public.chatmessages       TO service_role;
