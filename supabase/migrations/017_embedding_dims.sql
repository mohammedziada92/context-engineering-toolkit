-- 017_embedding_dims.sql
-- Update embedding dimensions from 1024 (multilingual-e5-large) to 1536 (text-embedding-3-small)
-- Must run AFTER 008_chunks.sql and 014_match_chunks_rpc.sql

-- Drop the existing IVFFlat index (depends on column type)
DROP INDEX IF EXISTS public.idx_chunks_embedding;

-- Alter the embedding column type
ALTER TABLE public.chunks
    ALTER COLUMN embedding TYPE vector(1536);

-- Recreate the index (IVFFlat with cosine distance, lists=100 for ~1M rows)
CREATE INDEX idx_chunks_embedding ON public.chunks
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Update the match_chunks RPC to accept the new dimension
CREATE OR REPLACE FUNCTION public.match_chunks(
    query_embedding  VECTOR(1536),
    match_user_id    UUID,
    match_source_id  UUID,
    match_threshold  FLOAT   DEFAULT 0.75,
    match_count      INT     DEFAULT 5
)
RETURNS TABLE (
    id                UUID,
    knowledge_source_id UUID,
    content           TEXT,
    chunk_index       INTEGER,
    token_count       INTEGER,
    metadata          JSONB,
    similarity        FLOAT
)
LANGUAGE plpgsql
STABLE
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
