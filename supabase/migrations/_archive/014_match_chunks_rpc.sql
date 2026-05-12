-- 014_match_chunks_rpc.sql
-- RPC function for pgvector cosine similarity search
-- Called by rag_service.py via supabase.rpc("match_chunks", {...})

CREATE OR REPLACE FUNCTION public.match_chunks(
    query_embedding  VECTOR(1024),
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
