# DATABASE.md — Context Engineering Toolkit (CET)
## Database Schema

| Field | Value |
|---|---|
| Version | 1.1 |
| Date | May 12, 2026 |
| Engine | PostgreSQL 15 + pgvector |
| Host | Supabase (cloud) |
| Author | MOHAMMED ZIADA |

---

## Table of Contents

1. Overview
2. Extensions
3. Tables
   - 3.1 users
   - 3.2 user_settings
   - 3.3 pipelines
   - 3.4 pipeline_versions
   - 3.5 pipeline_runs
   - 3.6 knowledge_sources
   - 3.7 chunks
   - 3.8 prompt_library
   - 3.9 chat_sessions
   - 3.10 chat_messages
4. Relationship Diagram
5. Row Level Security
6. Indexes
7. Migration Files

---

## 1. Overview

| Property | Value |
|---|---|
| Total Tables | 10 |
| Vector Tables | 1 — `chunks` uses `VECTOR(1024)` |
| JSONB Columns | 5 — `canvas_state`, `pipeline_config`, `chunk_config`, `config`, `metadata` |
| RLS Enabled | All tables |
| Auth Provider | Supabase Auth (GoTrue) |

### Table Dependency Order

```
auth.users (Supabase managed)
└── users (public mirror)
    ├── user_settings (1:1 — auto-created on signup)
    ├── pipelines (1:many)
    │   ├── pipeline_versions (1:many)
    │   └── pipeline_runs (1:many — pipeline_id nullable for playground runs)
    ├── knowledge_sources (1:many)
    │   └── chunks (1:many — vector embeddings)
    ├── prompt_library (1:many)
    └── chat_sessions (1:many — pipeline_id nullable for direct mode)
        └── chat_messages (1:many)
```

> **MVP Rule:** No `projects` table. All entities belong directly
> to `user_id`. Pipelines, knowledge sources, and settings all
> reference `auth.users` directly. Projects layer is v2.

---

## 2. Extensions

```sql
-- migration: 001_extensions.sql
-- Must run FIRST before any table creation

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- UUID generation
CREATE EXTENSION IF NOT EXISTS vector;         -- pgvector
CREATE EXTENSION IF NOT EXISTS pg_trgm;        -- text search

-- Verify extensions loaded correctly
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'vector', 'pg_trgm');
```

---

## 3. Tables

### Shared Trigger — Auto-update `updated_at`

```sql
-- Reusable trigger function used by all tables
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 3.1 users

Managed by Supabase Auth. A mirror trigger keeps a
`public.users` table in sync with `auth.users`.

```sql
-- migration: 002_users.sql

CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id)
              ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-sync trigger: auth.users → public.users
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Columns:**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, FK auth.users | Supabase Auth user ID |
| `email` | TEXT | UNIQUE, NOT NULL | User email address |
| `full_name` | TEXT | nullable | From OAuth provider |
| `avatar_url` | TEXT | nullable | Profile picture URL |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Account creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last profile update |

---

### 3.2 user_settings

Stores per-user OpenRouter API key (encrypted) and preferences.
One row per user. **Auto-created on signup** via trigger — see below.

```sql
-- migration: 003_user_settings.sql

CREATE TABLE public.user_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id)
                      ON DELETE CASCADE,
  openrouter_api_key  TEXT,         -- encrypted via Supabase Vault
  default_model       TEXT NOT NULL
                      DEFAULT 'anthropic/claude-sonnet-4-6'
                      CHECK (default_model IN (
                        'anthropic/claude-sonnet-4-6',
                        'z-ai/glm-5',
                        'google/gemini-3.1-pro-preview'
                      )),
  full_name           TEXT,
  email               TEXT,
  username            TEXT,
  avatar_url          TEXT,
  theme               TEXT NOT NULL DEFAULT 'dark',
  language            TEXT NOT NULL DEFAULT 'en',
  timezone            TEXT NOT NULL DEFAULT 'UTC',
  date_format         TEXT NOT NULL DEFAULT 'MMM D, YYYY',
  identities          JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Auto-create trigger** (migration: `20260512000000_user_settings_auto_create.sql`):

```sql
-- Every new user gets a default user_settings row on signup.
-- Prevents silent failures when code queries user_settings before
-- the user has visited the Settings page.

CREATE OR REPLACE FUNCTION public.auto_create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_settings
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_user_settings();
```

**Columns:**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Settings record ID |
| `user_id` | UUID | FK users, UNIQUE | One row per user |
| `openrouter_api_key` | TEXT | nullable | Encrypted via Supabase Vault |
| `default_model` | TEXT | NOT NULL, CHECK | One of 3 supported model IDs |
| `full_name` | TEXT | nullable | Display name |
| `email` | TEXT | nullable | Email override |
| `username` | TEXT | nullable | Username |
| `avatar_url` | TEXT | nullable | Avatar URL |
| `theme` | TEXT | NOT NULL, DEFAULT 'dark' | UI theme |
| `language` | TEXT | NOT NULL, DEFAULT 'en' | UI language |
| `timezone` | TEXT | NOT NULL, DEFAULT 'UTC' | User timezone |
| `date_format` | TEXT | NOT NULL, DEFAULT 'MMM D, YYYY' | Date display format |
| `identities` | JSONB | NOT NULL, DEFAULT '[]' | Linked auth identities |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update time |

---

### 3.3 pipelines

Core entity. Stores the visual canvas state AND the
executable pipeline config separately. Belongs directly
to `user_id` — no project layer.

```sql
-- migration: 004_pipelines.sql

CREATE TABLE public.pipelines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id)
                   ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  version          INTEGER NOT NULL DEFAULT 1,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  canvas_state     JSONB,            -- React Flow nodes + edges
  pipeline_config  JSONB,            -- Executable config for engine
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

CREATE TRIGGER pipelines_updated_at
  BEFORE UPDATE ON public.pipelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Columns:**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Pipeline identifier |
| `user_id` | UUID | FK users, CASCADE | Owner |
| `name` | TEXT | NOT NULL | Pipeline display name |
| `description` | TEXT | nullable | Optional description |
| `version` | INTEGER | DEFAULT 1 | Current active version number |
| `is_active` | BOOLEAN | DEFAULT true | Active/draft status |
| `canvas_state` | JSONB | nullable | React Flow nodes + edges |
| `pipeline_config` | JSONB | nullable | Executable pipeline schema |
| `token_budget` | INTEGER | DEFAULT 4096 | Total token limit |
| `model` | TEXT | nullable, CHECK | LLM model override |
| `tags` | TEXT[] | DEFAULT '{}' | Searchable tags |
| `last_run_at` | TIMESTAMPTZ | nullable | Last execution timestamp |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update time |

> **Note:** `is_active` maps to the frontend `status` field: `true` → `"active"`, `false` → `"draft"`.

---

### 3.4 pipeline_versions

Immutable version history. Every pipeline save creates
a new row. Nothing is ever overwritten.

```sql
-- migration: 005_pipeline_versions.sql

CREATE TABLE public.pipeline_versions (
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
```

**Columns:**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Version record ID |
| `pipeline_id` | UUID | FK pipelines, CASCADE | Parent pipeline |
| `user_id` | UUID | FK users | Who saved this version |
| `version` | INTEGER | NOT NULL | Version number (1, 2, 3...) |
| `pipeline_config` | JSONB | NOT NULL | Snapshot of executable config |
| `canvas_state` | JSONB | nullable | Snapshot of canvas layout |
| `change_summary` | TEXT | nullable | Human-readable change description |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | When this version was saved |

---

### 3.5 pipeline_runs

Execution logs. Every LLM call records tokens,
cost, latency, retrieved chunks, and response.

> **Important:** `pipeline_id` is **nullable**. Playground "direct" runs
> (no pipeline selected) insert `NULL` here. Pipeline-linked runs
> store the pipeline UUID.

```sql
-- migration: 006_pipeline_runs.sql

CREATE TABLE public.pipeline_runs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id         UUID REFERENCES public.pipelines(id)
                      ON DELETE CASCADE,        -- nullable for playground runs
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
```

**Columns:**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Run record ID |
| `pipeline_id` | UUID | FK pipelines, **nullable**, CASCADE | Which pipeline was run. NULL = playground direct run |
| `user_id` | UUID | FK users | Who ran it |
| `user_message` | TEXT | NOT NULL | Input query |
| `llm_response` | TEXT | nullable | Full LLM output |
| `model_used` | TEXT | NOT NULL | Actual model called |
| `prompt_tokens` | INTEGER | DEFAULT 0 | Input tokens used |
| `completion_tokens` | INTEGER | DEFAULT 0 | Output tokens used |
| `total_tokens` | INTEGER | DEFAULT 0 | Total tokens |
| `cost_usd` | NUMERIC(10,6) | DEFAULT 0 | Estimated cost in USD |
| `latency_ms` | INTEGER | DEFAULT 0 | End-to-end latency |
| `retrieved_chunks` | JSONB | DEFAULT '[]' | Chunks used in context |
| `status` | TEXT | CHECK | `success` / `error` / `cancelled` |
| `error_message` | TEXT | nullable | Error detail if failed |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Run timestamp |

---

### 3.6 knowledge_sources

Metadata for uploaded documents and scraped URLs.
Actual content stored in `chunks` after processing.
Belongs directly to `user_id` — no project layer.

```sql
-- migration: 007_knowledge_sources.sql

CREATE TABLE public.knowledge_sources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id)
                   ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  type             TEXT NOT NULL
                   CHECK (type IN ('pdf', 'txt', 'url', 'text')),
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN (
                     'pending', 'processing',
                     'embedding', 'ready', 'error'
                   )),
  content_hash     TEXT,           -- MD5 for cache coherency
  storage_path     TEXT,           -- Supabase Storage path
  source_url       TEXT,           -- for type=url
  error_message    TEXT,           -- populated on status=error
  metadata         JSONB,          -- file_size, page_count, etc.
  chunk_config     JSONB,          -- chunking strategy settings
  embedding_model  TEXT NOT NULL
                   DEFAULT 'baai/bge-m3',
  total_chunks     INTEGER NOT NULL DEFAULT 0,
  document_count   INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER knowledge_sources_updated_at
  BEFORE UPDATE ON public.knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Columns:**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Source identifier |
| `user_id` | UUID | FK users, CASCADE | Owner |
| `name` | TEXT | NOT NULL | Display name |
| `description` | TEXT | nullable | Optional description |
| `type` | TEXT | CHECK | `pdf` / `txt` / `url` / `text` |
| `status` | TEXT | CHECK | Processing status |
| `content_hash` | TEXT | nullable | MD5 for detecting stale cache |
| `storage_path` | TEXT | nullable | Supabase Storage path |
| `source_url` | TEXT | nullable | Original URL if type=url |
| `error_message` | TEXT | nullable | Error detail if status=error |
| `metadata` | JSONB | nullable | file_size, page_count, etc. |
| `chunk_config` | JSONB | nullable | chunk_size, overlap, strategy |
| `embedding_model` | TEXT | NOT NULL | Model used for embeddings |
| `total_chunks` | INTEGER | DEFAULT 0 | Count after processing |
| `document_count` | INTEGER | DEFAULT 0 | Number of ingested documents |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Upload time |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last status update |

> **Note on `chunk_count` vs `total_chunks`:** The DB column is `total_chunks`.
> The frontend type `KnowledgeSource.chunk_count` is a **computed enrichment field**
> added by the backend at query time (counting actual rows in `chunks` table),
> not a stored column. The dashboard maps `total_chunks` → `chunk_count` for the API response.

---

### 3.7 chunks

Individual text chunks with their vector embeddings.
This is the pgvector table — the heart of RAG search.
Belongs directly to `user_id` — no project layer.

```sql
-- migration: 008_chunks.sql
-- Requires pgvector extension (001_extensions.sql)

CREATE TABLE public.chunks (
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
```

**Columns:**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Chunk identifier |
| `knowledge_source_id` | UUID | FK knowledge_sources, CASCADE | Parent source |
| `user_id` | UUID | FK users, CASCADE | Owner — for RLS |
| `content` | TEXT | NOT NULL | Raw text of this chunk |
| `content_hash` | TEXT | nullable | MD5 for deduplication |
| `embedding` | VECTOR(1024) | NOT NULL | Vector embedding (baai/bge-m3, 1024 dims) |
| `token_count` | INTEGER | nullable | Token count of this chunk |
| `chunk_index` | INTEGER | NOT NULL | Position in source document |
| `metadata` | JSONB | DEFAULT '{}' | page_number, section, etc. |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | When chunk was created |

---

### 3.8 prompt_library

Reusable saved system prompts. Users save prompts here
and load them into the Monaco editor on the pipeline canvas.

```sql
-- migration: 009_prompt_library.sql

CREATE TABLE public.prompt_library (
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

CREATE TRIGGER prompt_library_updated_at
  BEFORE UPDATE ON public.prompt_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Columns:**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Prompt identifier |
| `user_id` | UUID | FK users, CASCADE | Owner |
| `name` | TEXT | NOT NULL | Display name |
| `content` | TEXT | NOT NULL | Full prompt text |
| `description` | TEXT | nullable | Optional description |
| `tags` | TEXT[] | DEFAULT '{}' | Searchable tags |
| `token_count` | INTEGER | DEFAULT 0 | Pre-calculated token count |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last edit time |

---

### 3.9 chat_sessions

Playground session history. Each session is one
conversation thread in the playground tester.

> **Important:** `pipeline_id` is **nullable**. "Direct" mode sessions
> have no pipeline attached. The `mode` column tracks whether the
> session uses direct LLM calls or a pipeline configuration.

```sql
-- migration: 010_chat_sessions.sql

CREATE TABLE public.chat_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id   UUID REFERENCES public.pipelines(id)
                ON DELETE CASCADE,        -- nullable: direct mode has no pipeline
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

CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Columns:**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Session identifier |
| `pipeline_id` | UUID | FK pipelines, **nullable**, CASCADE | Which pipeline this session uses. NULL = direct mode |
| `user_id` | UUID | FK users, CASCADE | Owner |
| `name` | TEXT | DEFAULT 'New Session' | Session display name |
| `mode` | TEXT | NOT NULL, CHECK | `direct` or `pipeline` |
| `config` | JSONB | NOT NULL, DEFAULT '{}' | Session config (model, system_prompt, temperature, etc.) |
| `total_tokens` | INTEGER | NOT NULL, DEFAULT 0 | Cumulative tokens used |
| `total_cost` | NUMERIC(10,6) | NOT NULL, DEFAULT 0 | Cumulative cost in USD |
| `message_count` | INTEGER | NOT NULL, DEFAULT 0 | Number of messages |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Session start time |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last activity time |

---

### 3.10 chat_messages

Individual messages within a chat session.
Stores both user messages and LLM responses, including
retrieved RAG chunks for assistant messages.

```sql
-- migration: 011_chat_messages.sql

CREATE TABLE public.chat_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES public.chat_sessions(id)
                    ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.users(id)
                    ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content           TEXT NOT NULL,
  token_count       INTEGER DEFAULT 0,
  metadata          JSONB DEFAULT '{}',         -- model_used, latency, cost, etc.
  retrieved_chunks  JSONB DEFAULT '[]',          -- RAG chunks for assistant messages
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Columns:**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Message identifier |
| `session_id` | UUID | FK chat_sessions, CASCADE | Parent session |
| `user_id` | UUID | FK users, CASCADE | Owner — for RLS |
| `role` | TEXT | CHECK | `user` or `assistant` |
| `content` | TEXT | NOT NULL | Message text |
| `token_count` | INTEGER | DEFAULT 0 | Token count of this message |
| `metadata` | JSONB | DEFAULT '{}' | model_used, latency_ms, cost_usd |
| `retrieved_chunks` | JSONB | DEFAULT '[]' | RAG chunks retrieved for this response |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Message timestamp |

---

## 4. Relationship Diagram

```
auth.users (Supabase managed)
│
└── public.users
│
├── user_settings (1:1 — auto-created on signup via trigger)
│
├── pipelines (1:many)
│   ├── pipeline_versions (1:many — immutable history)
│   └── pipeline_runs (1:many — pipeline_id NULLABLE for playground)
│
├── knowledge_sources (1:many)
│   └── chunks (1:many — vector embeddings)
│
├── prompt_library (1:many)
│
└── chat_sessions (1:many — pipeline_id NULLABLE for direct mode)
    └── chat_messages (1:many)
```

**Key Rules:**
- No `projects` table — all entities reference `user_id` directly (MVP)
- `chunks` always cascade-delete when `knowledge_source` is deleted
- `pipeline_versions` are immutable — never updated, only inserted
- `pipeline_runs` are append-only — never updated after creation
- `pipeline_runs.pipeline_id` can be NULL (playground direct runs)
- `chat_sessions.pipeline_id` can be NULL (direct mode sessions)
- `chat_messages` are append-only — never updated after creation
- `user_settings` row is auto-created for every new user via trigger

---

## 5. Row Level Security

All tables have RLS enabled. Users can only access
their own rows.

```sql
-- migration: 012_rls.sql

-- ── Enable RLS on all tables ─────────────────────────────
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_versions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_runs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_sources  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chunks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_library     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages      ENABLE ROW LEVEL SECURITY;

-- ── users ────────────────────────────────────────────────
CREATE POLICY "Users manage own profile"
  ON public.users FOR ALL
  USING (auth.uid() = id);

-- ── user_settings ────────────────────────────────────────
CREATE POLICY "Users manage own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id);

-- ── pipelines ────────────────────────────────────────────
CREATE POLICY "Users manage own pipelines"
  ON public.pipelines FOR ALL
  USING (auth.uid() = user_id);

-- ── pipeline_versions ────────────────────────────────────
CREATE POLICY "Users manage own pipeline versions"
  ON public.pipeline_versions FOR ALL
  USING (auth.uid() = user_id);

-- ── pipeline_runs ────────────────────────────────────────
CREATE POLICY "Users manage own pipeline runs"
  ON public.pipeline_runs FOR ALL
  USING (auth.uid() = user_id);

-- ── knowledge_sources ────────────────────────────────────
CREATE POLICY "Users manage own knowledge sources"
  ON public.knowledge_sources FOR ALL
  USING (auth.uid() = user_id);

-- ── chunks ───────────────────────────────────────────────
CREATE POLICY "Users manage own chunks"
  ON public.chunks FOR ALL
  USING (auth.uid() = user_id);

-- ── prompt_library ───────────────────────────────────────
CREATE POLICY "Users manage own prompts"
  ON public.prompt_library FOR ALL
  USING (auth.uid() = user_id);

-- ── chat_sessions ────────────────────────────────────────
CREATE POLICY "Users manage own chat sessions"
  ON public.chat_sessions FOR ALL
  USING (auth.uid() = user_id);

-- ── chat_messages ────────────────────────────────────────
CREATE POLICY "Users manage own chat messages"
  ON public.chat_messages FOR ALL
  USING (auth.uid() = user_id);
```

---

## 6. Indexes

```sql
-- migration: 013_indexes.sql

-- ── Vector similarity search (core RAG index) ────────────
-- ivfflat index for cosine similarity on 1024-dim vectors
CREATE INDEX idx_chunks_embedding
  ON public.chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ── Pipeline lookups ─────────────────────────────────────
CREATE INDEX idx_pipelines_user_id
  ON public.pipelines (user_id);

CREATE INDEX idx_pipelines_is_active
  ON public.pipelines (user_id, is_active);

-- ── Pipeline runs analytics ──────────────────────────────
CREATE INDEX idx_pipeline_runs_pipeline_id
  ON public.pipeline_runs (pipeline_id);

CREATE INDEX idx_pipeline_runs_user_id
  ON public.pipeline_runs (user_id);

CREATE INDEX idx_pipeline_runs_created_at
  ON public.pipeline_runs (created_at DESC);

-- ── Knowledge source lookups ─────────────────────────────
CREATE INDEX idx_knowledge_sources_user_id
  ON public.knowledge_sources (user_id);

CREATE INDEX idx_knowledge_sources_status
  ON public.knowledge_sources (user_id, status);

-- ── Chunks lookup by source ──────────────────────────────
CREATE INDEX idx_chunks_knowledge_source_id
  ON public.chunks (knowledge_source_id);

CREATE INDEX idx_chunks_user_id
  ON public.chunks (user_id);

-- ── Prompt library search ────────────────────────────────
CREATE INDEX idx_prompt_library_user_id
  ON public.prompt_library (user_id);

-- ── Chat session lookups ─────────────────────────────────
CREATE INDEX idx_chat_sessions_pipeline_id
  ON public.chat_sessions (pipeline_id);

CREATE INDEX idx_chat_messages_session_id
  ON public.chat_messages (session_id);

-- ── Text search on chunk content ─────────────────────────
CREATE INDEX idx_chunks_content_trgm
  ON public.chunks
  USING gin (content gin_trgm_ops);
```

---

## 7. Migration Files

Run all migration files in this exact order:

```
supabase/migrations/
├── 20260423000000_initial_schema.sql           -- All tables, RLS, indexes
├── 20260426000000_user_settings_columns.sql    -- Profile columns for user_settings
├── 20260429000000_knowledge_description.sql    -- description column on knowledge_sources
├── 20260504000000_knowledge_document_count.sql -- document_count column on knowledge_sources
├── 20260512000000_user_settings_auto_create.sql -- Auto-create user_settings on signup
└── _archive/                                   -- Legacy individual migrations
```

### Run Command

Apply via **Supabase Dashboard → SQL Editor** or via `psql`:

```bash
# Connect to Supabase PostgreSQL
psql -U postgres -d postgres -h db.kjeljybhbetvfvcmdtxs.supabase.co -p 5432

# Apply each migration in order
\i supabase/migrations/20260423000000_initial_schema.sql
\i supabase/migrations/20260426000000_user_settings_columns.sql
\i supabase/migrations/20260429000000_knowledge_description.sql
\i supabase/migrations/20260504000000_knowledge_document_count.sql
\i supabase/migrations/20260512000000_user_settings_auto_create.sql
```
