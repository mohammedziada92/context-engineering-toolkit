from loguru import logger

from app.core.config import settings
from app.services.embedding_service import embed_text

from supabase import create_client, Client

import hashlib


def _get_client() -> Client:
    """Create a Supabase client with the service role key (bypasses RLS)."""
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return client


def _content_hash(content: str) -> str:
    """SHA-256 hash of chunk content for dedup."""
    return hashlib.sha256(content.encode()).hexdigest()


async def search_chunks(
    user_id: str,
    knowledge_source_id: str,
    query: str,
    top_k: int = 5,
    similarity_threshold: float = 0.75,
    api_key: str | None = None,
) -> list[dict]:
    """Perform vector similarity search against the chunks table.

    Steps:
      1. Embed the query via OpenRouter (bge-m3, 1024-dim).
      2. Call the match_chunks RPC for pgvector cosine similarity search.
      3. Return matched chunks with similarity scores.
    """
    # 1. Generate query embedding
    query_vector = embed_text(query, api_key=api_key)

    # 2. pgvector cosine similarity search via RPC
    client = _get_client()
    result = client.rpc(
        "match_chunks",
        {
            "query_embedding": query_vector,
            "match_user_id": user_id,
            "match_source_id": knowledge_source_id,
            "match_threshold": similarity_threshold,
            "match_count": top_k,
        },
    ).execute()

    logger.info(
        "Vector search returned {} chunks (source={}, threshold={}, top_k={})",
        len(result.data),
        knowledge_source_id,
        similarity_threshold,
        top_k,
    )

    # 3. Format results
    return [
        {
            "content": row["content"],
            "similarity": row["similarity"],
            "chunk_index": row["chunk_index"],
            "token_count": row["token_count"],
        }
        for row in result.data
    ]


def dedup_chunks(chunks: list[dict]) -> list[dict]:
    """Remove chunks with duplicate content, keeping the highest similarity.

    Uses SHA-256 of content for comparison.
    """
    seen: dict[str, dict] = {}
    for chunk in chunks:
        h = _content_hash(chunk["content"])
        if h not in seen or chunk["similarity"] > seen[h]["similarity"]:
            seen[h] = chunk

    deduped = sorted(seen.values(), key=lambda c: c["similarity"], reverse=True)
    if len(deduped) < len(chunks):
        logger.debug(
            "Dedup removed {} chunks ({} → {})",
            len(chunks) - len(deduped),
            len(chunks),
            len(deduped),
        )
    return deduped


async def retrieve_chunks(
    knowledge_source_id: str,
    query: str,
    top_k: int = 5,
    threshold: float = 0.75,
    user_id: str | None = None,
    api_key: str | None = None,
) -> list[dict]:
    """High-level retrieval: search + dedup + filter.

    Returns chunks with `score`, `content`, `chunk_index`, `metadata`.
    """
    raw = await search_chunks(
        user_id=user_id or "system",
        knowledge_source_id=knowledge_source_id,
        query=query,
        top_k=top_k,
        similarity_threshold=threshold,
        api_key=api_key,
    )
    deduped = dedup_chunks(raw)
    filtered = filter_by_relevance(deduped, threshold)
    return [
        {
            "score": c["similarity"],
            "content": c["content"],
            "chunk_index": c["chunk_index"],
            "metadata": {},
        }
        for c in filtered
    ]


def filter_by_relevance(chunks: list[dict], threshold: float) -> list[dict]:
    """Remove chunks whose similarity falls below the threshold.

    This is a second-pass filter — useful after dedup or when merging
    results from multiple sources with different thresholds.
    """
    filtered = [c for c in chunks if c["similarity"] >= threshold]
    if len(filtered) < len(chunks):
        logger.debug(
            "Relevance filter removed {} chunks ({} → {}, threshold={})",
            len(chunks) - len(filtered),
            len(chunks),
            len(filtered),
            threshold,
        )
    return filtered
