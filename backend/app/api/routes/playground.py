import json
import time
import uuid
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from loguru import logger
from pydantic import BaseModel
from supabase import create_client, Client

from app.core.config import settings
from app.db.queries import playground as playground_db
from app.middleware.auth import get_current_user
from app.models.playground import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatRequest,
    ChatSessionCreate,
    ChatSessionDetailResponse,
    ChatSessionResponse,
    CreateSessionRequest,
    PlaygroundRunRequest,
    UpdateSessionRequest,
)
from app.services import llm_service, token_service, vault_service

router = APIRouter(prefix="/api/v1/playground", tags=["playground"])


def _sse(event: dict) -> str:
    """Format a dict as an SSE data frame."""
    return f"data: {json.dumps(event)}\n\n"


def _get_supabase() -> Client:
    """Create a Supabase client with the service role key."""
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return client


# ── POST /api/v1/playground/run ─────────────────────────────────


@router.post("/run")
async def run_playground(
    body: PlaygroundRunRequest,
    user: dict = Depends(get_current_user),
):
    """Direct LLM call — no pipeline. Streams SSE tokens.

    Gates: 403 if no OpenRouter API key saved.
    Logs to pipelineruns with pipeline_id=NULL.
    """
    user_id = user["sub"]

    # Gate: block run if no API key saved
    api_key = await vault_service.get_decrypted_key(user_id)
    if not api_key:
        raise HTTPException(
            status_code=403,
            detail="Add your OpenRouter API key in Settings first",
        )

    # Build messages array
    messages: list[dict] = []
    if body.system_prompt:
        messages.append({"role": "system", "content": body.system_prompt})
    messages.extend(body.messages)

    logger.info(
        "Starting playground run: model={}, user={}, messages={}",
        body.model,
        user_id,
        len(messages),
    )

    async def stream() -> AsyncGenerator[str, None]:
        start_time = time.perf_counter()
        llm_response_text = ""
        prompt_tokens = token_service.count_messages_tokens(messages)
        completion_tokens = 0

        yield _sse({"status": "calling_llm", "model": body.model})

        try:
            async for delta in llm_service.call_llm_stream(
                user_id=user_id,
                model=body.model,
                messages=messages,
            ):
                llm_response_text += delta
                completion_tokens += token_service.count_tokens(delta)
                yield _sse({"content": delta})

        except Exception as e:
            logger.error("Playground LLM stream error: {}", e)
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            await _log_playground_run(
                user_id=user_id,
                user_message=_last_user_content(body.messages),
                llm_response=llm_response_text,
                model_used=effective_model,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=prompt_tokens + completion_tokens,
                cost_usd=token_service.estimate_cost(
                    prompt_tokens, completion_tokens, effective_model
                ),
                latency_ms=latency_ms,
                status="error",
                error_message=str(e),
            )
            yield _sse({"status": "error", "error": str(e)})
            return

        # Log run (pipeline_id=NULL)
        latency_ms = int((time.perf_counter() - start_time) * 1000)
        total_tokens = prompt_tokens + completion_tokens
        cost_usd = token_service.estimate_cost(
            prompt_tokens, completion_tokens, body.model
        )

        await _log_playground_run(
            user_id=user_id,
            user_message=_last_user_content(body.messages),
            llm_response=llm_response_text,
            model_used=body.model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            cost_usd=cost_usd,
            latency_ms=latency_ms,
            status="success",
        )

        logger.info(
            "Playground run complete: model={}, tokens={}, cost=${:.4f}, latency={}ms",
            body.model,
            total_tokens,
            cost_usd,
            latency_ms,
        )

        yield _sse({
            "status": "done",
            "analytics": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens,
                "cost_usd": cost_usd,
                "latency_ms": latency_ms,
                "chunks_used": 0,
            },
        })

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ── GET /api/v1/playground/sessions ─────────────────────────────


@router.get("/sessions", response_model=list[ChatSessionResponse])
async def list_sessions(
    user: dict = Depends(get_current_user),
):
    """Return all chat sessions for the user, most recently updated first."""
    rows = await playground_db.get_sessions_by_user(user["sub"])
    # Enrich with message_count
    out: list[dict] = []
    for row in rows:
        count_result = (
            _get_supabase()
            .table("chat_messages")
            .select("id", count="exact")
            .eq("session_id", row["id"])
            .execute()
        )
        row["message_count"] = count_result.count or 0
        out.append(row)
    return out


# ── POST /api/v1/playground/sessions ────────────────────────────


@router.post("/sessions", response_model=ChatSessionResponse, status_code=201)
async def create_session(
    body: CreateSessionRequest,
    user: dict = Depends(get_current_user),
):
    """Create a new chat session with mode and config."""
    config_dict = body.config.model_dump()
    session = await playground_db.create_session(
        user_id=user["sub"],
        name=body.name,
        mode=body.mode,
        pipeline_id=body.pipeline_id,
        config=config_dict,
    )
    session["message_count"] = 0
    logger.info("Created chat session {} for user {}", session["id"], user["sub"])
    return session


# ── PATCH /api/v1/playground/sessions/{session_id}/tokens ────────


class TokenFlushBody(BaseModel):
    total_tokens: int
    total_cost: float


@router.patch("/sessions/{session_id}/tokens")
async def flush_session_tokens(
    session_id: str,
    body: TokenFlushBody,
    user: dict = Depends(get_current_user),
):
    """Increment session token totals — used by sendBeacon on unmount."""
    session = await playground_db.get_session_by_id(session_id, user["sub"])
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await _increment_session_totals(session_id, body.total_tokens, body.total_cost)
    return {"ok": True}


# ── GET /api/v1/playground/sessions/{session_id} ────────────────


@router.get("/sessions/{session_id}", response_model=ChatSessionDetailResponse)
async def get_session(
    session_id: str,
    user: dict = Depends(get_current_user),
):
    """Return a single session with its messages."""
    session = await playground_db.get_session_with_messages(session_id, user["sub"])
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session["message_count"] = len(session.get("messages", []))
    return session


# ── PATCH /api/v1/playground/sessions/{session_id} ──────────────


@router.patch("/sessions/{session_id}", response_model=ChatSessionResponse)
async def patch_session(
    session_id: str,
    body: UpdateSessionRequest,
    user: dict = Depends(get_current_user),
):
    """Update session name or config."""
    updates: dict = {}
    if body.name is not None:
        updates["name"] = body.name
    if body.config is not None:
        updates["config"] = body.config.model_dump()

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    session = await playground_db.update_session(session_id, user["sub"], updates)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


# ── DELETE /api/v1/playground/sessions/{session_id} ─────────────


@router.delete("/sessions/{session_id}")
async def remove_session(
    session_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete a session and its messages."""
    deleted = await playground_db.delete_session(session_id, user["sub"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"deleted": True}


# ── DELETE /api/v1/playground/sessions ──────────────────────────


@router.delete("/sessions", status_code=200)
async def remove_all_sessions(
    user: dict = Depends(get_current_user),
):
    """Delete all sessions and messages for the current user."""
    count = await playground_db.delete_all_sessions(user["sub"])
    return {"deleted": count}


# ── POST /api/v1/playground/chat ────────────────────────────────


@router.post("/chat")
async def chat_stream(
    body: ChatRequest,
    user: dict = Depends(get_current_user),
):
    """SSE streaming chat endpoint with optional RAG.

    - Creates or reuses a session
    - Persists user + assistant messages
    - Optionally retrieves knowledge-base chunks (RAG)
    - Returns streamed tokens via SSE
    """
    user_id = user["sub"]

    # Gate: check API key
    api_key = await vault_service.get_decrypted_key(user_id)
    if not api_key:
        raise HTTPException(
            status_code=403,
            detail="Add your OpenRouter API key in Settings first",
        )

    # Resolve or create session
    session_id = body.session_id
    session_pipeline_id: str | None = None
    if not session_id:
        session = await playground_db.create_session(
            user_id=user_id,
            mode=body.mode,
            pipeline_id=body.pipeline_id,
            config={
                "model": body.model,
                "system_prompt": body.system_prompt,
                "temperature": body.temperature,
                "max_tokens": body.max_tokens,
                "top_p": body.top_p,
                "knowledge_source_id": body.knowledge_source_id,
                "top_k": body.top_k,
                "threshold": body.threshold,
            },
        )
        session_id = session["id"]
        session_pipeline_id = session.get("pipeline_id")
    else:
        session = await playground_db.get_session_by_id(session_id, user_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        session_pipeline_id = session.get("pipeline_id")

    # Persist user message
    await playground_db.create_message(
        session_id=session_id,
        user_id=user_id,
        role="user",
        content=body.message,
    )

    # Resolve effective config: in pipeline mode, load canvas_state overrides
    effective_model = body.model
    effective_system_prompt = body.system_prompt
    effective_kb_id = body.knowledge_source_id
    effective_top_k = body.top_k
    effective_threshold = body.threshold
    nodes: dict = {}
    pipeline_rag_has_kb = None  # None = no RAG node, True/False = RAG node KB status

    if body.mode == "pipeline" and body.pipeline_id:
        from app.db.queries.pipelines import get_pipeline
        pipeline = await get_pipeline(user_id=user_id, pipeline_id=body.pipeline_id)
        if pipeline:
            canvas_state = pipeline.get("canvas_state") or {}
            from app.services.pipeline_engine import _parse_nodes
            nodes = _parse_nodes(canvas_state)
            llm_data = nodes.get("llm") or {}
            sp_data = nodes.get("system_prompt") or {}
            rag_data = nodes.get("rag") or {}
            ks_data = nodes.get("knowledge_source") or {}
            # Override model from pipeline LLM node
            if llm_data.get("model"):
                effective_model = llm_data["model"]
            # Override system prompt from pipeline
            if sp_data.get("content"):
                effective_system_prompt = sp_data["content"]
            # Resolve knowledge_source_id from RAG/knowledge_source node
            rag_kb_id = rag_data.get("knowledge_source_id") or rag_data.get("source_id") or ks_data.get("source_id")
            pipeline_rag_has_kb = bool(rag_kb_id)
            logger.info(
                "Playground pipeline mode: pipeline_id={}, rag_kb_id={}, rag_data_keys={}, ks_data_keys={}",
                body.pipeline_id,
                rag_kb_id,
                list(rag_data.keys()) if rag_data else [],
                list(ks_data.keys()) if ks_data else [],
            )
            if rag_kb_id:
                effective_kb_id = rag_kb_id
            if rag_data.get("top_k"):
                effective_top_k = rag_data["top_k"]
            if rag_data.get("similarity_threshold"):
                effective_threshold = min(body.threshold, rag_data["similarity_threshold"])
        else:
            logger.warning("Playground pipeline mode: pipeline {} not found for user {}", body.pipeline_id, user_id)

    logger.info(
        "Playground RAG resolution: mode={}, effective_kb_id={}, top_k={}, threshold={}",
        body.mode,
        effective_kb_id,
        effective_top_k,
        effective_threshold,
    )

    # Build messages for LLM
    llm_messages: list[dict] = []
    if effective_system_prompt:
        llm_messages.append({"role": "system", "content": effective_system_prompt})

    # Optional RAG: retrieve chunks (works in both direct and pipeline mode)
    retrieved_chunks: list[dict] = []
    if effective_kb_id:
        try:
            from app.services.rag_service import retrieve_chunks
            retrieved_chunks = await retrieve_chunks(
                knowledge_source_id=effective_kb_id,
                query=body.message,
                top_k=effective_top_k,
                threshold=effective_threshold,
                user_id=user_id,
                api_key=api_key,
            )
            if retrieved_chunks:
                context_text = "\n\n".join(c["content"] for c in retrieved_chunks)
                rag_message = {
                    "role": "system",
                    "content": f"Use the following context to answer the user's question:\n\n{context_text}",
                }
                llm_messages.append(rag_message)
        except Exception as e:
            logger.error(
                "Playground RAG retrieval failed for source={}, query='{}', threshold={}, api_key={}…: {}",
                effective_kb_id,
                body.message[:80],
                effective_threshold,
                bool(api_key),
                e,
                exc_info=True,
            )

    llm_messages.append({"role": "user", "content": body.message})

    logger.info(
        "Playground chat: session={}, mode={}, model={}, rag={}, chunks={}",
        session_id,
        body.mode,
        effective_model,
        bool(effective_kb_id),
        len(retrieved_chunks),
    )

    async def stream() -> AsyncGenerator[str, None]:
        # CEP-23 diagnostic: log all short-circuit inputs
        logger.warning(
            "CEP-23 short-circuit check: mode={}, pipeline_id={}, nodes_keys={}, rag_node={}, rag_node_type={}, pipeline_rag_has_kb={}",
            body.mode,
            body.pipeline_id,
            list(nodes.keys()),
            nodes.get("rag"),
            type(nodes.get("rag")),
            pipeline_rag_has_kb,
        )
        # Short-circuit: pipeline has RAG node but no knowledge base connected
        if body.mode == "pipeline" and body.pipeline_id and nodes.get("rag") is not None and pipeline_rag_has_kb is False:
            yield _sse({
                "status": "warning",
                "error_code": "no_knowledge_base",
                "pipeline_id": body.pipeline_id,
                "message": "No Knowledge Base connected to the Vector Search node.",
            })
            return

        start_time = time.perf_counter()
        llm_response_text = ""
        prompt_tokens = token_service.count_messages_tokens(llm_messages)
        completion_tokens = 0

        yield _sse({"status": "calling_llm", "model": effective_model, "session_id": session_id})

        if retrieved_chunks:
            yield _sse({"chunks": retrieved_chunks})

        try:
            async for delta in llm_service.call_llm_stream(
                user_id=user_id,
                model=effective_model,
                messages=llm_messages,
                temperature=body.temperature,
                max_tokens=body.max_tokens,
                top_p=body.top_p,
            ):
                llm_response_text += delta
                completion_tokens += token_service.count_tokens(delta)
                yield _sse({"content": delta})

        except Exception as e:
            logger.error("Playground chat stream error: {}", e)
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            await _log_playground_run(
                user_id=user_id,
                user_message=body.message,
                llm_response=llm_response_text,
                model_used=effective_model,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=prompt_tokens + completion_tokens,
                cost_usd=token_service.estimate_cost(
                    prompt_tokens, completion_tokens, effective_model
                ),
                latency_ms=latency_ms,
                status="error",
                error_message=str(e),
                pipeline_id=session_pipeline_id,
            )
            yield _sse({"status": "error", "error": str(e)})
            return

        # Persist assistant message with retrieved chunks
        await playground_db.create_message(
            session_id=session_id,
            user_id=user_id,
            role="assistant",
            content=llm_response_text,
            retrieved_chunks=retrieved_chunks if retrieved_chunks else None,
        )

        # Log run
        latency_ms = int((time.perf_counter() - start_time) * 1000)
        total_tokens = prompt_tokens + completion_tokens
        cost_usd = token_service.estimate_cost(
            prompt_tokens, completion_tokens, body.model
        )

        await _log_playground_run(
            user_id=user_id,
            user_message=body.message,
            llm_response=llm_response_text,
            model_used=body.model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            cost_usd=cost_usd,
            latency_ms=latency_ms,
            status="success",
            pipeline_id=session_pipeline_id,
        )

        # Increment session-level totals
        try:
            await _increment_session_totals(session_id, total_tokens, cost_usd)
        except Exception as e:
            logger.error("Session totals increment failed for {}: {}", session_id, e)

        yield _sse({
            "status": "done",
            "session_id": session_id,
            "analytics": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens,
                "cost_usd": cost_usd,
                "latency_ms": latency_ms,
                "chunks_used": len(retrieved_chunks),
            },
        })

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ── GET /api/v1/playground/sessions/{session_id}/messages ──────


@router.get(
    "/sessions/{session_id}/messages",
    response_model=list[ChatMessageResponse],
)
async def list_messages(
    session_id: str,
    user: dict = Depends(get_current_user),
):
    """Return all messages for a session, oldest first."""
    session = await playground_db.get_session_by_id(session_id, user["sub"])
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return await playground_db.get_messages_by_session(session_id, user["sub"])


# ── POST /api/v1/playground/sessions/{session_id}/messages ─────


@router.post(
    "/sessions/{session_id}/messages",
    response_model=ChatMessageResponse,
    status_code=201,
)
async def create_message(
    session_id: str,
    body: ChatMessageCreate,
    user: dict = Depends(get_current_user),
):
    """Append a message to a chat session."""
    session = await playground_db.get_session_by_id(session_id, user["sub"])
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    message = await playground_db.create_message(
        session_id=session_id,
        user_id=user["sub"],
        role=body.role,
        content=body.content,
        retrieved_chunks=body.retrieved_chunks,
    )
    return message


# ── Helpers ──────────────────────────────────────────────────────


def _last_user_content(messages: list[dict]) -> str:
    """Extract the content of the last user message for run logging."""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            return msg.get("content", "")
    return ""


async def _log_playground_run(
    user_id: str,
    user_message: str,
    llm_response: str,
    model_used: str,
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
    cost_usd: float,
    latency_ms: int,
    status: str,
    error_message: str | None = None,
    pipeline_id: str | None = None,
) -> None:
    """Insert a playground run into pipelineruns."""
    client = _get_supabase()
    client.table("pipeline_runs").insert({
        "id": str(uuid.uuid4()),
        "pipeline_id": pipeline_id,
        "user_id": user_id,
        "user_message": user_message,
        "llm_response": llm_response,
        "model_used": model_used,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": total_tokens,
        "cost_usd": cost_usd,
        "latency_ms": latency_ms,
        "retrieved_chunks": [],
        "status": status,
        "error_message": error_message,
    }).execute()


async def _increment_session_totals(
    session_id: str,
    delta_tokens: int,
    delta_cost: float,
) -> None:
    """Increment chat_sessions token totals and message count."""
    try:
        client = _get_supabase()
        row = client.table("chat_sessions").select("total_tokens, total_cost, message_count").eq("id", session_id).single().execute()
        if row.data:
            new_tokens = (row.data["total_tokens"] or 0) + delta_tokens
            new_cost = (row.data["total_cost"] or 0) + delta_cost
            new_count = (row.data["message_count"] or 0) + 1
            client.table("chat_sessions").update({
                "total_tokens": new_tokens,
                "total_cost": new_cost,
                "message_count": new_count,
            }).eq("id", session_id).execute()
            logger.info("Session {} updated: tokens={}, cost={:.4f}, messages={}", session_id, new_tokens, new_cost, new_count)
        else:
            logger.warning("Session {} not found for token increment", session_id)
    except Exception as e:
        logger.error("Failed to increment session totals for {}: {}", session_id, e)
