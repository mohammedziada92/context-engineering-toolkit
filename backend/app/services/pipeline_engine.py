import json
import time
import uuid
from collections.abc import AsyncGenerator

from loguru import logger
from supabase import create_client, Client

from app.core.config import settings
from app.core.models import DEFAULT_MODEL
from app.services import llm_service, rag_service, token_service


def _get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


# ── Node parsing ────────────────────────────────────────────────

_NODE_TYPE_MAP = {
    "systemPrompt":      "system_prompt",
    "system_prompt":     "system_prompt",
    "vectorSearch":      "rag",
    "vector_search":     "rag",
    "rag":               "rag",
    "knowledgeSource":   "knowledge_source",
    "knowledge_source":  "knowledge_source",
    "chatHistory":       "chat_history",
    "chat_history":      "chat_history",
    "llmNode":           "llm",
    "llm":               "llm",
    "output":            "output",
}


def _parse_nodes(canvas_state: dict) -> dict:
    """Extract typed node configs from canvas_state.nodes."""
    nodes = canvas_state.get("nodes", [])

    parsed: dict[str, dict | None] = {
        "system_prompt": None,
        "rag": None,
        "knowledge_source": None,
        "chat_history": None,
        "llm": None,
        "output": None,
    }

    for node in nodes:
        raw_type = node.get("type", "")
        category = _NODE_TYPE_MAP.get(raw_type)
        if not category:
            continue
        data = node.get("data", {})

        if category == "knowledge_source":
            parsed["knowledge_source"] = data
        elif category == "rag":
            parsed["rag"] = data
        else:
            parsed[category] = data

    if parsed["knowledge_source"] and not parsed["rag"]:
        parsed["rag"] = {}
    if parsed["rag"] is not None and parsed["knowledge_source"]:
        parsed["rag"].setdefault(
            "source_id", parsed["knowledge_source"].get("source_id")
        )

    return parsed


# ── DB helpers ───────────────────────────────────────────────────


async def _load_chat_history(session_id: str, user_id: str) -> list[dict]:
    client = _get_supabase()
    result = (
        client.table("chat_messages")
        .select("role, content")
        .eq("session_id", session_id)
        .eq("user_id", user_id)
        .order("created_at")
        .execute()
    )
    return result.data


async def _log_run(
    pipeline_id: str,
    user_id: str,
    user_message: str,
    llm_response: str,
    model_used: str,
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
    cost_usd: float,
    latency_ms: int,
    retrieved_chunks: list[dict],
    status: str,
    error_message: str | None = None,
) -> None:
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
        "retrieved_chunks": retrieved_chunks,
        "status": status,
        "error_message": error_message,
    }).execute()


# ── Main engine ─────────────────────────────────────────────────


async def execute_pipeline(
    canvas_state: dict,
    pipeline_config: dict,
    pipeline_id: str,
    user_message: str,
    user_id: str,
    session_id: str | None = None,
    model_override: str | None = None,
    api_key: str | None = None,
) -> AsyncGenerator[tuple[str, dict], None]:
    """Execute a pipeline and yield (event_type, data_dict) tuples.

    Frontend expects these SSE event types:
      - token: { content: "..." }  — streamed LLM output
      - usage: { tokens, cost, latency_ms }  — cost tracking
      - done: {}  — run complete
    """
    start_time = time.perf_counter()

    nodes = _parse_nodes(canvas_state)
    llm_data = nodes.get("llm") or {}
    model = model_override or llm_data.get("model") or DEFAULT_MODEL

    # ── RAG retrieval ──────────────────────────────────────────
    rag_data = nodes.get("rag") or {}
    source_id = rag_data.get("knowledge_source_id") or rag_data.get("source_id")
    chunks: list[dict] = []

    if source_id:
        try:
            chunks = await rag_service.search_chunks(
                user_id=user_id,
                knowledge_source_id=source_id,
                query=user_message,
                top_k=rag_data.get("top_k", 5),
                similarity_threshold=rag_data.get("similarity_threshold", 0.5),
                api_key=api_key,
            )
        except Exception as e:
            logger.warning("RAG search failed, continuing without context: {}", e)

    threshold = rag_data.get("similarity_threshold", 0.5)
    chunks = rag_service.dedup_chunks(chunks)
    chunks = rag_service.filter_by_relevance(chunks, threshold)

    # ── Chat history ───────────────────────────────────────────
    hist_data = nodes.get("chat_history") or {}
    strategy = hist_data.get("strategy", "truncate")
    history_max_tokens = hist_data.get("max_tokens", 500)

    history: list[dict] = []
    if session_id:
        raw_messages = await _load_chat_history(session_id, user_id)
        history = token_service.compress_history(
            raw_messages, history_max_tokens, strategy
        )

    # ── Build messages ─────────────────────────────────────────
    messages: list[dict] = []

    sp_data = nodes.get("system_prompt") or {}
    system_text = sp_data.get("content", "")
    if system_text:
        messages.append({"role": "system", "content": system_text})

    if chunks:
        rag_text = "\n\n".join(
            f"[Chunk {c['chunk_index']}] (similarity: {c['similarity']:.2f})\n{c['content']}"
            for c in chunks
        )
        messages.append({"role": "system", "content": f"Retrieved context:\n{rag_text}"})

    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": user_message})

    # ── LLM stream call ────────────────────────────────────────
    llm_response_text = ""
    prompt_tokens = token_service.count_messages_tokens(messages)
    completion_tokens = 0
    temperature = llm_data.get("temperature", 0.7)
    max_output_tokens = llm_data.get("max_output_tokens", 2048)

    try:
        async for delta in llm_service.call_llm_stream(
            user_id=user_id,
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_output_tokens,
        ):
            llm_response_text += delta
            completion_tokens += token_service.count_tokens(delta)
            yield "token", {"content": delta}

    except Exception as e:
        logger.error("LLM stream error for pipeline {}: {}", pipeline_id, e)
        latency_ms = int((time.perf_counter() - start_time) * 1000)
        await _log_run(
            pipeline_id=pipeline_id, user_id=user_id,
            user_message=user_message, llm_response=llm_response_text,
            model_used=model, prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens,
            cost_usd=token_service.estimate_cost(prompt_tokens, completion_tokens, model),
            latency_ms=latency_ms,
            retrieved_chunks=_chunk_summaries(chunks),
            status="error", error_message=str(e),
        )
        yield "error", {"error": str(e)}
        return

    # ── Log run ────────────────────────────────────────────────
    latency_ms = int((time.perf_counter() - start_time) * 1000)
    total_tokens = prompt_tokens + completion_tokens
    cost_usd = token_service.estimate_cost(prompt_tokens, completion_tokens, model)

    await _log_run(
        pipeline_id=pipeline_id, user_id=user_id,
        user_message=user_message, llm_response=llm_response_text,
        model_used=model, prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        cost_usd=cost_usd, latency_ms=latency_ms,
        retrieved_chunks=_chunk_summaries(chunks),
        status="success",
    )

    logger.info(
        "Pipeline run complete: pipeline={}, model={}, tokens={}, "
        "cost=${:.4f}, latency={}ms, chunks={}",
        pipeline_id, model, total_tokens, cost_usd, latency_ms, len(chunks),
    )

    yield "usage", {
        "tokens": total_tokens,
        "cost": cost_usd,
        "latency_ms": latency_ms,
    }
    yield "done", {}


def _chunk_summaries(chunks: list[dict]) -> list[dict]:
    return [
        {"chunk_index": c["chunk_index"], "similarity": c["similarity"]}
        for c in chunks
    ]
