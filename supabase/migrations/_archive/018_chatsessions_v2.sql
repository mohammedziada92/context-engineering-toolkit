-- Make pipeline_id nullable (Direct mode sessions have no pipeline)
ALTER TABLE chatsessions ALTER COLUMN pipeline_id DROP NOT NULL;

-- Add mode, config JSONB, and session stats
ALTER TABLE chatsessions
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'direct'
    CHECK (mode IN ('direct', 'pipeline')),
  ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS total_tokens INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_cost NUMERIC(10,6) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS message_count INTEGER NOT NULL DEFAULT 0;

-- config JSONB shape (stored, never validated at DB level):
-- {
--   "model": "anthropic/claude-sonnet-4-6",
--   "system_prompt": "You are...",
--   "temperature": 0.7,
--   "max_tokens": 2048,
--   "top_p": 1.0,
--   "stream": true,
--   "knowledge_source_id": null,
--   "top_k": 5,
--   "threshold": 0.70
-- }

-- chatmessages: add retrieved_chunks for RAG Inspector
ALTER TABLE chatmessages
  ADD COLUMN IF NOT EXISTS retrieved_chunks JSONB DEFAULT '[]';
