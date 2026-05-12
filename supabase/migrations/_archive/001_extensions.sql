-- 001_extensions.sql
-- Enable required PostgreSQL extensions + shared updated_at trigger
-- Source: DATABASE.md

-- pgvector — vector similarity search for RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- uuid-ossp — UUID generation (fallback, also supported natively)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgtrgm — trigram matching for fuzzy text search
-- Not available in all Supabase postgres images; create if present
DO $$ BEGIN
    CREATE EXTENSION IF NOT EXISTS pgtrgm;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pgtrgm extension not available — trigram indexes will be skipped';
END $$;

-- ── Shared trigger: auto-update updated_at ──────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
