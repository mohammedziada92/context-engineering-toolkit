import hashlib
from pathlib import PurePosixPath

import fitz  # PyMuPDF
import httpx
import tiktoken
from bs4 import BeautifulSoup
from loguru import logger
from supabase import create_client, Client

from app.core.config import settings
from app.services.embedding_service import embed_batch
from app.services.chunking_service import split_text


# ── Supabase client (bypasses RLS) ────────────────────

def _get_service_client() -> Client:
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return client


# ── Tokenizer (cl100k_base) ───────────────────────────

_enc = tiktoken.get_encoding("cl100k_base")


def _count_tokens(text: str) -> int:
    return len(_enc.encode(text))


# ── Text extraction ───────────────────────────────────

async def _extract_pdf(storage_path: str) -> str:
    """Extract text from a PDF using block-level parsing.

    Uses PyMuPDF's "blocks" mode which groups text spans into visual
    blocks (paragraphs).  Each block is separated by ``\\n\\n`` so the
    chunking pipeline receives real paragraph boundaries instead of
    flat positional text.
    """
    client = _get_service_client()
    bucket, _, path = storage_path.partition("/")
    response = client.storage.from_(bucket).download(path)
    doc = fitz.open(stream=response, filetype="pdf")
    blocks: list[str] = []
    for page in doc:
        for blk in page.get_text("blocks"):
            # blk[6] == 0 → text block (1 = image)
            if blk[6] == 0:
                text = blk[4].strip()
                if text:
                    blocks.append(text)
    doc.close()
    return "\n\n".join(blocks)


async def _extract_txt(storage_path: str) -> str:
    """Read a text file from Supabase Storage."""
    client = _get_service_client()
    bucket, _, path = storage_path.partition("/")
    response = client.storage.from_(bucket).download(path)
    return response.decode("utf-8")


async def _extract_url(source_url: str) -> str:
    """Fetch a URL and extract visible text with BeautifulSoup."""
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        resp = await client.get(source_url)
        resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    # Remove script/style blocks before extracting
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    return soup.get_text(strip=True, separator="\n")


def _extract_text_direct(metadata: dict) -> str:
    """Return pasted text stored in metadata."""
    return metadata.get("raw_text", "")


async def _extract_text(source: dict) -> str:
    """Route to the correct extractor based on source type."""
    source_type = source["type"]
    if source_type == "pdf":
        return await _extract_pdf(source["storage_path"])
    elif source_type == "txt":
        return await _extract_txt(source["storage_path"])
    elif source_type == "url":
        return await _extract_url(source["source_url"])
    elif source_type == "text":
        return _extract_text_direct(source.get("metadata", {}))
    raise ValueError(f"Unsupported source type: {source_type}")


# ── Main ingestion pipeline ───────────────────────────

async def ingest_source(source_id: str, user_id: str, api_key: str) -> None:
    """Full ingestion pipeline for a knowledge source.

    Steps:
        1. Update status → "processing"
        2. Extract text (PDF / TXT / URL / pasted text)
        3. Chunk text (200 tokens, 20 overlap by default)
        4. Update status → "embedding"
        5. Embed all chunks via embed_batch (requires user's api_key — BYOK)
        6. INSERT chunks into public.chunks with VECTOR(1024)
        7. Update knowledgesources → status="ready", total_chunks=N

    On any exception: status="error", error_message=str(e)
    """
    db = _get_service_client()
    source_table = db.table("knowledge_sources")

    try:
        # ── Step 1: Mark processing ────────────────────
        source_table.update({"status": "processing"}).eq("id", source_id).execute()
        logger.info("Ingesting source {} — status → processing", source_id)

        # Fetch source row
        result = source_table.select("*").eq("id", source_id).single().execute()
        source = result.data

        # ── Step 2: Extract text ───────────────────────
        logger.info("Extracting text from {} source {}", source["type"], source_id)
        raw_text = await _extract_text(source)
        logger.info("Extracted {} characters from {}", len(raw_text), source_id)

        # ── Step 3: Chunk ──────────────────────────────
        chunks = split_text(raw_text)
        logger.info("Split into {} chunks (sentence-aware recursive splitter)", len(chunks))

        # ── Step 4: Mark embedding ─────────────────────
        source_table.update({"status": "embedding"}).eq("id", source_id).execute()

        # ── Step 5: Embed all chunks ───────────────────
        logger.info("Embedding {} chunks for {}", len(chunks), source_id)
        embeddings = embed_batch(chunks, api_key=api_key)  # BYOK — user's key required

        # ── Step 6: Delete old chunks, then insert new ones ──
        db.table("chunks").delete().eq("knowledge_source_id", source_id).execute()
        logger.info("Cleared old chunks for {}", source_id)

        rows = [
            {
                "knowledge_source_id": source_id,
                "user_id": user_id,
                "content": chunk,
                "content_hash": hashlib.sha256(chunk.encode()).hexdigest(),
                "embedding": embedding,
                "chunk_index": idx,
                "token_count": _count_tokens(chunk),
            }
            for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings))
        ]
        db.table("chunks").insert(rows).execute()
        logger.info("Inserted {} chunks for {}", len(rows), source_id)

        # ── Step 7: Mark ready ─────────────────────────
        source_table.update(
            {"status": "ready", "total_chunks": len(chunks)}
        ).eq("id", source_id).execute()
        logger.info(
            "Source {} ready — {} chunks ingested", source_id, len(chunks)
        )

    except Exception as e:
        logger.error("Ingestion failed for {}: {}", source_id, e)
        source_table.update(
            {"status": "error", "error_message": str(e)}
        ).eq("id", source_id).execute()
        raise
