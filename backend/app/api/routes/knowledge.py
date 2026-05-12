from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from app.middleware.auth import get_current_user
from app.db.queries import knowledge as db

router = APIRouter(prefix="/api/v1/knowledge", tags=["knowledge"])


# ── Pydantic models ───────────────────────────────────────────────────────────

class KnowledgeSourceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    embedding_model: str = "baai/bge-m3"

class KnowledgeSourceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class IngestTextBody(BaseModel):
    title: str
    content: str
    metadata: dict = {}

class IngestUrlBody(BaseModel):
    url: str
    metadata: dict = {}

class SearchBody(BaseModel):
    query: str
    top_k: int = 5
    threshold: float = 0.75


# ── Sources CRUD ──────────────────────────────────────────────────────────────

@router.get("")
async def list_knowledge_sources(
    page:   int                    = Query(1, ge=1),
    limit:  int                    = Query(12, ge=1, le=100),
    status: Optional[str]          = Query(None),
    search: Optional[str]          = Query(None),
    user=Depends(get_current_user),
):
    return await db.list_knowledge_sources(
        user_id=user["sub"], page=page, limit=limit, status=status, search=search
    )


@router.post("", status_code=201)
async def create_knowledge_source(
    body: KnowledgeSourceCreate,
    user=Depends(get_current_user),
):
    return await db.create_knowledge_source(user_id=user["sub"], **body.model_dump())


@router.get("/{id}")
async def get_knowledge_source(id: str, user=Depends(get_current_user)):
    source = await db.get_knowledge_source(id, user["sub"])
    if not source:
        raise HTTPException(404, "Knowledge source not found")
    return source


@router.put("/{id}")
async def update_knowledge_source(
    id: str, body: KnowledgeSourceUpdate, user=Depends(get_current_user)
):
    return await db.update_knowledge_source(id, user["sub"], body.model_dump(exclude_none=True))


@router.delete("/{id}")
async def delete_knowledge_source(id: str, user=Depends(get_current_user)):
    await db.delete_knowledge_source(id, user["sub"])
    return {"deleted": True}


# ── Ingestion ─────────────────────────────────────────────────────────────────

@router.post("/{id}/ingest/text", status_code=202)
async def ingest_text(id: str, body: IngestTextBody, user=Depends(get_current_user)):
    source = await db.get_knowledge_source(id, user["sub"])
    if not source:
        raise HTTPException(404, "Knowledge source not found")
    job_id = await db.queue_ingest_text(id, body.title, body.content, body.metadata)
    return {"job_id": job_id, "status": "queued"}


@router.post("/{id}/ingest/file", status_code=202)
async def ingest_file(
    id: str,
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    source = await db.get_knowledge_source(id, user["sub"])
    if not source:
        raise HTTPException(404, "Knowledge source not found")
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(413, "File exceeds 20MB limit")
    job_id = await db.queue_ingest_file(id, file.filename or "upload", content, file.content_type)
    return {"job_id": job_id, "status": "queued"}


@router.post("/{id}/ingest/url", status_code=202)
async def ingest_url(id: str, body: IngestUrlBody, user=Depends(get_current_user)):
    source = await db.get_knowledge_source(id, user["sub"])
    if not source:
        raise HTTPException(404, "Knowledge source not found")
    job_id = await db.queue_ingest_url(id, body.url, body.metadata)
    return {"job_id": job_id, "status": "queued"}


# ── Chunks ────────────────────────────────────────────────────────────────────

@router.get("/{id}/chunks")
async def list_chunks(
    id:    str,
    page:  int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user=Depends(get_current_user),
):
    return await db.list_chunks(id, user["sub"], page=page, limit=limit)


@router.delete("/{id}/chunks/{chunk_id}")
async def delete_chunk(id: str, chunk_id: str, user=Depends(get_current_user)):
    await db.delete_chunk(id, chunk_id, user["sub"])
    return {"deleted": True}


# ── Semantic search ───────────────────────────────────────────────────────────

@router.post("/{id}/search")
async def search_chunks(id: str, body: SearchBody, user=Depends(get_current_user)):
    source = await db.get_knowledge_source(id, user["sub"])
    if not source:
        raise HTTPException(404, "Knowledge source not found")
    return await db.search_chunks(
        id, body.query, top_k=body.top_k, threshold=body.threshold
    )
