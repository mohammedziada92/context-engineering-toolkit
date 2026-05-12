-- ============================================================
-- CET — Context Engineering Toolkit
-- Consolidated Initial Schema Migration
-- Date: 2026-04-23
-- Engine: PostgreSQL 15 + pgvector (Supabase)
-- ============================================================
-- Replaces migrations 001–018 into a single idempotent file.
-- Tables are ordered by dependency (referenced before referrer).
-- ============================================================

BEGIN;

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- 2. ENUMS  (none — using TEXT + CHECK constraints instead)
-- ============================================================

-- ============================================================
-- 3. SHARED FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mirror auth.users → public.users on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. TABLES (dependency order)
-- ============================================================

-- ── 4.1 users ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id)
              ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── 4.2 user_settings ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id)
                      ON DELETE CASCADE,
  openrouter_api_key  TEXT,
  default_model       TEXT NOT NULL
                      DEFAULT 'anthropic/claude-sonnet-4-6'
                      CHECK (default_model IN (
                        'anthropic/claude-sonnet-4-6',
                        'z-ai/glm-5',
                        'google/gemini-3.1-pro-preview'
                      )),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

DROP TRIGGER IF EXISTS user_settings_updated_at ON public.user_settings;
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── 4.3 pipelines ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pipelines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id)
                   ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  version          INTEGER NOT NULL DEFAULT 1,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  canvas_state     JSONB,
  pipeline_config  JSONB,
  token_budget     INTEGER NOT NULL DEFAULT 4096,
  model            TEXT
                   CHECK (model IS NULL OR model IN (
                     'anthropic/claude-sonnet-4-6',
                     'z-ai/glm-5',
                     'google/gemini-3.1-pro-preview'
                   )),
  tags             TEXT[] DEFAULT '{}',
  last_run_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS pipelines_updated_at ON public.pipelines;
CREATE TRIGGER pipelines_updated_at
  BEFORE UPDATE ON public.pipelines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── 4.4 pipeline_versions ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pipeline_versions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id      UUID NOT NULL REFERENCES public.pipelines(id)
                   ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES public.users(id)
                   ON DELETE CASCADE,
  version          INTEGER NOT NULL,
  pipeline_config  JSONB NOT NULL,
  canvas_state     JSONB,
  change_summary   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pipeline_id, version)
);

-- ── 4.5 pipeline_runs ─────────────────────────────────────
-- pipeline_id is nullable: playground "direct" runs have no pipeline
CREATE TABLE IF NOT EXISTS public.pipeline_runs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id         UUID REFERENCES public.pipelines(id)
                      ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.users(id)
                      ON DELETE CASCADE,
  user_message        TEXT NOT NULL,
  llm_response        TEXT,
  model_used          TEXT NOT NULL,
  prompt_tokens       INTEGER DEFAULT 0,
  completion_tokens   INTEGER DEFAULT 0,
  total_tokens        INTEGER DEFAULT 0,
  cost_usd            NUMERIC(10, 6) DEFAULT 0,
  latency_ms          INTEGER DEFAULT 0,
  retrieved_chunks    JSONB DEFAULT '[]',
  status              TEXT NOT NULL DEFAULT 'success'
                      CHECK (status IN ('success', 'error', 'cancelled')),
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4.6 knowledge_sources ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.knowledge_sources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id)
                   ON DELETE CASCADE,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL
                   CHECK (type IN ('pdf', 'txt', 'url', 'text')),
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN (
                     'pending', 'processing',
                     'embedding', 'ready', 'error'
                   )),
  content_hash     TEXT,
  storage_path     TEXT,
  source_url       TEXT,
  error_message    TEXT,
  metadata         JSONB,
  chunk_config     JSONB,
  embedding_model  TEXT NOT NULL
                   DEFAULT 'intfloat/multilingual-e5-large',
  total_chunks     INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS knowledge_sources_updated_at ON public.knowledge_sources;
CREATE TRIGGER knowledge_sources_updated_at
  BEFORE UPDATE ON public.knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── 4.7 chunks ─────────────────────────────────────────────
-- pgvector table — heart of RAG search. VECTOR(1024) for e5-large.
CREATE TABLE IF NOT EXISTS public.chunks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_source_id UUID NOT NULL
                      REFERENCES public.knowledge_sources(id)
                      ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.users(id)
                      ON DELETE CASCADE,
  content             TEXT NOT NULL,
  content_hash        TEXT,
  embedding           VECTOR(1024) NOT NULL,
  token_count         INTEGER,
  chunk_index         INTEGER NOT NULL,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4.8 prompt_library ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prompt_library (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id)
              ON DELETE CASCADE,
  name        TEXT NOT NULL,
  content     TEXT NOT NULL,
  description TEXT,
  tags        TEXT[] DEFAULT '{}',
  token_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS prompt_library_updated_at ON public.prompt_library;
CREATE TRIGGER prompt_library_updated_at
  BEFORE UPDATE ON public.prompt_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── 4.9 chat_sessions ──────────────────────────────────────
-- pipeline_id nullable: "direct" mode sessions have no pipeline.
-- Includes mode, config, and session stats (v2 schema).
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id   UUID REFERENCES public.pipelines(id)
                ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users(id)
                ON DELETE CASCADE,
  name          TEXT DEFAULT 'New Session',
  mode          TEXT NOT NULL DEFAULT 'direct'
                CHECK (mode IN ('direct', 'pipeline')),
  config        JSONB NOT NULL DEFAULT '{}',
  total_tokens  INTEGER NOT NULL DEFAULT 0,
  total_cost    NUMERIC(10, 6) NOT NULL DEFAULT 0,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── 4.10 chat_messages ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES public.chat_sessions(id)
                    ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.users(id)
                    ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content           TEXT NOT NULL,
  token_count       INTEGER DEFAULT 0,
  metadata          JSONB DEFAULT '{}',
  retrieved_chunks  JSONB DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4.11 billing_notify_interest ───────────────────────────
CREATE TABLE IF NOT EXISTS public.billing_notify_interest (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  plan       TEXT NOT NULL DEFAULT 'pro',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, plan)
);

-- ============================================================
-- 5. INDEXES
-- ============================================================

-- Vector similarity search (core RAG index)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON public.chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Pipeline lookups
CREATE INDEX IF NOT EXISTS idx_pipelines_user_id
  ON public.pipelines (user_id);

CREATE INDEX IF NOT EXISTS idx_pipelines_is_active
  ON public.pipelines (user_id, is_active);

-- Pipeline runs analytics
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_pipeline_id
  ON public.pipeline_runs (pipeline_id);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_user_id
  ON public.pipeline_runs (user_id);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_created_at
  ON public.pipeline_runs (created_at DESC);

-- Knowledge source lookups
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_user_id
  ON public.knowledge_sources (user_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_status
  ON public.knowledge_sources (user_id, status);

-- Chunks lookup by source
CREATE INDEX IF NOT EXISTS idx_chunks_knowledge_source_id
  ON public.chunks (knowledge_source_id);

CREATE INDEX IF NOT EXISTS idx_chunks_user_id
  ON public.chunks (user_id);

-- Prompt library search
CREATE INDEX IF NOT EXISTS idx_prompt_library_user_id
  ON public.prompt_library (user_id);

-- Chat session lookups
CREATE INDEX IF NOT EXISTS idx_chat_sessions_pipeline_id
  ON public.chat_sessions (pipeline_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id
  ON public.chat_messages (session_id);

-- Text search on chunk content (trigram)
CREATE INDEX IF NOT EXISTS idx_chunks_content_trgm
  ON public.chunks
  USING gin (content gin_trgm_ops);

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_versions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_runs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_sources     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chunks                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_library        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_notify_interest ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================

CREATE POLICY "Users manage own profile"
  ON public.users FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "Users manage own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own pipelines"
  ON public.pipelines FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own pipeline versions"
  ON public.pipeline_versions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own pipeline runs"
  ON public.pipeline_runs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own knowledge sources"
  ON public.knowledge_sources FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own chunks"
  ON public.chunks FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own prompts"
  ON public.prompt_library FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own chat sessions"
  ON public.chat_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own chat messages"
  ON public.chat_messages FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own interest"
  ON public.billing_notify_interest FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 8. RPC FUNCTIONS
-- ============================================================

-- ── 8.1 Vector similarity search (RAG) ─────────────────────
CREATE OR REPLACE FUNCTION public.match_chunks(
    query_embedding  VECTOR(1024),
    match_user_id    UUID,
    match_source_id  UUID,
    match_threshold  FLOAT   DEFAULT 0.75,
    match_count      INT     DEFAULT 5
)
RETURNS TABLE (
    id                  UUID,
    knowledge_source_id UUID,
    content             TEXT,
    chunk_index         INTEGER,
    token_count         INTEGER,
    metadata            JSONB,
    similarity          FLOAT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.knowledge_source_id,
        c.content,
        c.chunk_index,
        c.token_count,
        c.metadata,
        1 - (c.embedding <=> query_embedding) AS similarity
    FROM public.chunks c
    WHERE c.user_id = match_user_id
      AND c.knowledge_source_id = match_source_id
      AND 1 - (c.embedding <=> query_embedding) >= match_threshold
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ── 8.2 Analytics — summary KPIs ───────────────────────────
CREATE OR REPLACE FUNCTION public.analytics_summary(p_user_id UUID)
RETURNS TABLE (
    total_runs       BIGINT,
    total_tokens     BIGINT,
    total_cost_usd   NUMERIC,
    avg_latency_ms   NUMERIC,
    success_count    BIGINT,
    active_pipelines BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        COALESCE(SUM(1), 0)                                    AS total_runs,
        COALESCE(SUM(pr.total_tokens), 0)                      AS total_tokens,
        COALESCE(SUM(pr.cost_usd), 0)                          AS total_cost_usd,
        COALESCE(AVG(pr.latency_ms), 0)                        AS avg_latency_ms,
        COALESCE(SUM(CASE WHEN pr.status = 'success' THEN 1 END), 0) AS success_count,
        (SELECT COUNT(*) FROM public.pipelines
         WHERE user_id = p_user_id AND is_active = true)        AS active_pipelines
    FROM public.pipeline_runs pr
    WHERE pr.user_id = p_user_id
      AND pr.created_at >= now() - interval '30 days';
$$;

-- ── 8.3 Analytics — daily token usage ──────────────────────
CREATE OR REPLACE FUNCTION public.analytics_token_usage(p_user_id UUID)
RETURNS TABLE (
    date              TEXT,
    prompt_tokens     BIGINT,
    completion_tokens BIGINT,
    total_tokens      BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        to_char(pr.created_at, 'YYYY-MM-DD') AS date,
        COALESCE(SUM(pr.prompt_tokens), 0)     AS prompt_tokens,
        COALESCE(SUM(pr.completion_tokens), 0)  AS completion_tokens,
        COALESCE(SUM(pr.total_tokens), 0)       AS total_tokens
    FROM public.pipeline_runs pr
    WHERE pr.user_id = p_user_id
      AND pr.created_at >= now() - interval '30 days'
    GROUP BY to_char(pr.created_at, 'YYYY-MM-DD')
    ORDER BY date;
$$;

-- ── 8.4 Analytics — daily cost by model ────────────────────
CREATE OR REPLACE FUNCTION public.analytics_cost(p_user_id UUID)
RETURNS TABLE (
    date        TEXT,
    model_used  TEXT,
    cost_usd    NUMERIC
)
LANGUAGE sql STABLE
AS $$
    SELECT
        to_char(pr.created_at, 'YYYY-MM-DD') AS date,
        pr.model_used,
        COALESCE(SUM(pr.cost_usd), 0) AS cost_usd
    FROM public.pipeline_runs pr
    WHERE pr.user_id = p_user_id
      AND pr.created_at >= now() - interval '30 days'
    GROUP BY to_char(pr.created_at, 'YYYY-MM-DD'), pr.model_used
    ORDER BY date, model_used;
$$;

-- ── 8.5 Analytics — latency percentiles per pipeline ───────
CREATE OR REPLACE FUNCTION public.analytics_latency(p_user_id UUID)
RETURNS TABLE (
    pipeline_id   UUID,
    pipeline_name TEXT,
    p50_ms        NUMERIC,
    p95_ms        NUMERIC,
    p99_ms        NUMERIC,
    run_count     BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        pr.pipeline_id,
        p.name AS pipeline_name,
        COALESCE(percentile_cont(0.50) WITHIN GROUP (ORDER BY pr.latency_ms), 0) AS p50_ms,
        COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY pr.latency_ms), 0) AS p95_ms,
        COALESCE(percentile_cont(0.99) WITHIN GROUP (ORDER BY pr.latency_ms), 0) AS p99_ms,
        COUNT(*) AS run_count
    FROM public.pipeline_runs pr
    LEFT JOIN public.pipelines p ON p.id = pr.pipeline_id
    WHERE pr.user_id = p_user_id
      AND pr.created_at >= now() - interval '30 days'
      AND pr.pipeline_id IS NOT NULL
    GROUP BY pr.pipeline_id, p.name
    ORDER BY run_count DESC;
$$;

-- ============================================================
-- 9. SEED DATA
-- ============================================================

-- No seed data required.
-- User rows are auto-created via the handle_new_user trigger
-- when users sign up through Supabase Auth.

COMMIT;
