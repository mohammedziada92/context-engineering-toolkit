import time
import math
from yarl import URL
from supabase import create_client, Client

from app.core.config import settings


def _get_client() -> Client:
    """Create a Supabase client with the service role key (bypasses RLS)."""
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    client.postgrest.base_url = URL(settings.SUPABASE_URL)
    return client


# ── Chunking helpers ────────────────────────────────────────────

CHUNK_SIZE = 500      # characters per chunk
CHUNK_OVERLAP = 50    # overlap between consecutive chunks


def _split_text(text: str) -> list[str]:
    """Split text into overlapping chunks of ~CHUNK_SIZE characters."""
    if not text:
        return []
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunks.append(text[start:end])
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


# ── Sources CRUD ────────────────────────────────────────────────


async def list_knowledge_sources(
    user_id: str,
    page: int = 1,
    limit: int = 12,
    status: str | None = None,
    search: str | None = None,
) -> dict:
    """Paginated list of knowledge sources for a user."""
    client = _get_client()
    offset = (page - 1) * limit

    q = (
        client.table("knowledgesources")
        .select("*", count="exact")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
    )
    if status:
        q = q.eq("status", status)
    if search:
        q = q.ilike("name", f"%{search}%")

    result = q.execute()
    items = result.data or []

    # Enrich each source with chunk_count
    for item in items:
        rc = (
            client.table("chunks")
            .select("id", count="exact")
            .eq("knowledge_source_id", item["id"])
            .execute()
        )
        item["chunk_count"] = rc.count or 0

    return {
        "items": items,
        "total": result.count or 0,
        "page": page,
        "limit": limit,
    }


async def create_knowledge_source(
    user_id: str,
    name: str,
    description: str | None = None,
    embedding_model: str = "openai/text-embedding-3-small",
) -> dict:
    """Insert a new knowledge source row. Returns the created row."""
    client = _get_client()
    insert: dict = {
        "user_id": user_id,
        "name": name,
        "type": "text",
        "status": "pending",
        "embedding_model": embedding_model,
        "total_chunks": 0,
    }
    if description:
        insert["description"] = description
    result = client.table("knowledgesources").insert(insert).execute()
    return result.data[0]


async def get_knowledge_source(source_id: str, user_id: str) -> dict | None:
    """Return a single knowledge source enriched with chunk_count."""
    client = _get_client()
    result = (
        client.table("knowledgesources")
        .select("*")
        .eq("id", source_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    if not result.data:
        return None
    source = result.data

    # Enrich with chunk count
    rc = (
        client.table("chunks")
        .select("id", count="exact")
        .eq("knowledge_source_id", source_id)
        .execute()
    )
    source["chunk_count"] = rc.count or 0
    return source


async def update_knowledge_source(
    source_id: str, user_id: str, updates: dict
) -> dict:
    """Update name/description. Returns updated row."""
    client = _get_client()
    result = (
        client.table("knowledgesources")
        .update(updates)
        .eq("id", source_id)
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0]


async def delete_knowledge_source(source_id: str, user_id: str) -> None:
    """Delete a knowledge source. Cascades chunks via FK ON DELETE CASCADE."""
    client = _get_client()
    client.table("knowledgesources").delete().eq("id", source_id).eq("user_id", user_id).execute()


# ── Chunks CRUD ─────────────────────────────────────────────────


async def list_chunks(
    source_id: str,
    user_id: str,
    page: int = 1,
    limit: int = 20,
) -> dict:
    """Paginated chunks for a source, ordered by chunk_index."""
    client = _get_client()
    offset = (page - 1) * limit

    count_result = (
        client.table("chunks")
        .select("id", count="exact")
        .eq("knowledge_source_id", source_id)
        .eq("user_id", user_id)
        .execute()
    )
    total = count_result.count or 0

    result = (
        client.table("chunks")
        .select("id, chunk_index, content, token_count, metadata, created_at")
        .eq("knowledge_source_id", source_id)
        .eq("user_id", user_id)
        .order("chunk_index")
        .range(offset, offset + limit - 1)
        .execute()
    )

    return {
        "items": result.data or [],
        "total": total,
        "page": page,
        "limit": limit,
    }


async def delete_chunk(source_id: str, chunk_id: str, user_id: str) -> None:
    """Delete a single chunk with source/user ownership check."""
    client = _get_client()
    client.table("chunks").delete().eq("id", chunk_id).eq("knowledge_source_id", source_id).eq("user_id", user_id).execute()

    # Decrement source total_chunks
    source = (
        client.table("knowledgesources")
        .select("total_chunks")
        .eq("id", source_id)
        .single()
        .execute()
    )
    if source.data:
        new_count = max(0, (source.data.get("total_chunks") or 0) - 1)
        client.table("knowledgesources").update({"total_chunks": new_count}).eq("id", source_id).execute()


# ── Ingestion ───────────────────────────────────────────────────


async def _ingest_chunks(source_id: str, user_id: str, text_chunks: list[str]) -> None:
    """Embed text chunks and insert into the chunks table."""
    from app.services.embedding_service import embed_batch

    client = _get_client()

    # Embed all chunks
    embeddings = embed_batch(text_chunks)

    # Build rows
    rows = []
    for i, (chunk_text, embedding) in enumerate(zip(text_chunks, embeddings)):
        # Rough token estimate: ~4 chars per token
        token_count = math.ceil(len(chunk_text) / 4)
        rows.append({
            "knowledge_source_id": source_id,
            "user_id": user_id,
            "content": chunk_text,
            "embedding": str(embedding),
            "chunk_index": i,
            "token_count": token_count,
            "metadata": {},
        })

    # Insert in batches of 100 (Supabase PostgREST limit)
    batch_size = 100
    for i in range(0, len(rows), batch_size):
        client.table("chunks").insert(rows[i : i + batch_size]).execute()

    # Update source: set total_chunks + status=ready
    client.table("knowledgesources").update({
        "total_chunks": len(rows),
        "status": "ready",
    }).eq("id", source_id).execute()


async def queue_ingest_text(
    source_id: str, title: str, content: str, metadata: dict
) -> str:
    """Ingest plain text: split → embed → store chunks."""
    client = _get_client()

    # Set status to processing
    source = (
        client.table("knowledgesources")
        .select("user_id")
        .eq("id", source_id)
        .single()
        .execute()
    )
    user_id = source.data["user_id"]

    client.table("knowledgesources").update({"status": "processing"}).eq("id", source_id).execute()

    # Split and ingest
    chunks = _split_text(content)
    await _ingest_chunks(source_id, user_id, chunks)

    return f"ingest-text-{source_id}"


async def queue_ingest_file(
    source_id: str, filename: str, content: bytes, content_type: str
) -> str:
    """Ingest a file: extract text → split → embed → store chunks."""
    client = _get_client()

    source = (
        client.table("knowledgesources")
        .select("user_id")
        .eq("id", source_id)
        .single()
        .execute()
    )
    user_id = source.data["user_id"]

    client.table("knowledgesources").update({"status": "processing"}).eq("id", source_id).execute()

    # Extract text based on file type
    text: str
    if content_type and "pdf" in content_type:
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(stream=content, filetype="pdf")
            text = "\n".join(page.get_text() for page in doc)
            doc.close()
        except ImportError:
            text = content.decode("utf-8", errors="replace")
    else:
        text = content.decode("utf-8", errors="replace")

    # Update source type to reflect actual file type
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "txt"
    source_type = ext if ext in ("pdf", "txt") else "txt"
    client.table("knowledgesources").update({"type": source_type}).eq("id", source_id).execute()

    # Split and ingest
    chunks = _split_text(text)
    await _ingest_chunks(source_id, user_id, chunks)

    return f"ingest-file-{source_id}"


async def queue_ingest_url(
    source_id: str, url: str, metadata: dict
) -> str:
    """Ingest a URL: fetch → extract text → split → embed → store chunks."""
    import httpx

    client = _get_client()

    source = (
        client.table("knowledgesources")
        .select("user_id")
        .eq("id", source_id)
        .single()
        .execute()
    )
    user_id = source.data["user_id"]

    client.table("knowledgesources").update({
        "status": "processing",
        "source_url": url,
        "type": "url",
    }).eq("id", source_id).execute()

    # Fetch URL content
    try:
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.get(url)
            resp.raise_for_status()
            text = resp.text
    except Exception as e:
        client.table("knowledgesources").update({
            "status": "error",
            "error_message": f"Failed to fetch URL: {e}",
        }).eq("id", source_id).execute()
        return f"ingest-url-{source_id}"

    # Basic HTML stripping if it looks like HTML
    if "<" in text and ">" in text:
        import re
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"\s+", " ", text).strip()

    chunks = _split_text(text)
    if chunks:
        await _ingest_chunks(source_id, user_id, chunks)
    else:
        client.table("knowledgesources").update({
            "status": "error",
            "error_message": "No extractable text content from URL",
        }).eq("id", source_id).execute()

    return f"ingest-url-{source_id}"


# ── Semantic search ─────────────────────────────────────────────


async def search_chunks(
    source_id: str,
    query: str,
    top_k: int = 5,
    threshold: float = 0.75,
) -> dict:
    """Embed query and search via pgvector match_chunks RPC.

    Returns {"results": [...], "query_tokens": int, "latency_ms": float}.
    """
    from app.services.embedding_service import embed_text

    client = _get_client()

    # Get source to find user_id for the RPC call
    source = (
        client.table("knowledgesources")
        .select("user_id")
        .eq("id", source_id)
        .single()
        .execute()
    )
    user_id = source.data["user_id"]

    t0 = time.perf_counter()

    # Embed the query
    query_embedding = embed_text(query)

    # Rough token estimate for the query
    query_tokens = math.ceil(len(query) / 4)

    # Call the match_chunks RPC function
    rpc_result = client.rpc("match_chunks", {
        "query_embedding": str(query_embedding),
        "match_user_id": user_id,
        "match_source_id": source_id,
        "match_threshold": threshold,
        "match_count": top_k,
    }).execute()

    latency_ms = (time.perf_counter() - t0) * 1000

    results = []
    for row in rpc_result.data or []:
        results.append({
            "id": row["id"],
            "content": row["content"],
            "chunk_index": row["chunk_index"],
            "token_count": row.get("token_count"),
            "metadata": row.get("metadata", {}),
            "similarity": row["similarity"],
        })

    return {
        "results": results,
        "query_tokens": query_tokens,
        "latency_ms": round(latency_ms, 1),
    }


# ── Storage helpers (kept from original) ────────────────────────


async def upload_to_storage(storage_path: str, file_bytes: bytes, content_type: str) -> None:
    """Upload file bytes to Supabase Storage."""
    client = _get_client()
    bucket, _, path = storage_path.partition("/")
    client.storage.from_(bucket).upload(path, file_bytes, {"content-type": content_type})


async def delete_from_storage(storage_path: str) -> None:
    """Delete a file from Supabase Storage. Ignores errors if file missing."""
    client = _get_client()
    bucket, _, path = storage_path.partition("/")
    try:
        client.storage.from_(bucket).remove([path])
    except Exception:
        pass
