from datetime import datetime

from yarl import URL
from supabase import create_client, Client

from app.core.config import settings


def _get_client() -> Client:
    """Create a Supabase client with the service role key (bypasses RLS)."""
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    client.postgrest.base_url = URL(settings.SUPABASE_URL)
    return client


def _apply_filters(query, user_id: str, start: datetime, end: datetime,
                   pipeline_id: str | None = None, model_id: str | None = None):
    """Apply common filters to a pipelineruns query."""
    query = query.eq("user_id", user_id).gte("created_at", start.isoformat()).lt("created_at", end.isoformat())
    if pipeline_id:
        query = query.eq("pipeline_id", pipeline_id)
    if model_id:
        query = query.eq("model_used", model_id)
    return query


# ── Summary KPIs ────────────────────────────────────────────────


async def get_summary(
    user_id: str,
    start: datetime | None = None,
    end: datetime | None = None,
    pipeline_id: str | None = None,
    model_id: str | None = None,
) -> dict:
    """Return aggregate KPIs with delta comparison."""
    client = _get_client()

    # Current period
    query = client.table("pipelineruns").select(
        "total_tokens, cost_usd, latency_ms, status"
    ).eq("user_id", user_id)

    if start and end:
        query = query.gte("created_at", start.isoformat()).lt("created_at", end.isoformat())
    if pipeline_id:
        query = query.eq("pipeline_id", pipeline_id)
    if model_id:
        query = query.eq("model_used", model_id)

    result = query.execute()
    rows = result.data or []

    total_runs = len(rows)
    total_tokens = sum(r.get("total_tokens") or 0 for r in rows)
    total_cost = sum(float(r.get("cost_usd") or 0) for r in rows)
    avg_latency = (sum(r.get("latency_ms") or 0 for r in rows) / total_runs) if total_runs else 0
    avg_cost_per_run = total_cost / total_runs if total_runs else 0

    resp = {
        "total_runs": total_runs,
        "total_tokens": total_tokens,
        "total_cost": round(total_cost, 6),
        "avg_latency_ms": round(avg_latency, 1),
        "avg_cost_per_run": round(avg_cost_per_run, 6),
    }

    # Delta: compare with previous equal-length period
    if start and end:
        delta_duration = end - start
        prev_start = start - delta_duration
        prev_end = start

        prev_query = client.table("pipelineruns").select(
            "total_tokens, cost_usd, latency_ms"
        ).eq("user_id", user_id).gte("created_at", prev_start.isoformat()).lt("created_at", prev_end.isoformat())
        if pipeline_id:
            prev_query = prev_query.eq("pipeline_id", pipeline_id)
        if model_id:
            prev_query = prev_query.eq("model_used", model_id)

        prev_result = prev_query.execute()
        prev_rows = prev_result.data or []

        prev_runs = len(prev_rows)
        prev_tokens = sum(r.get("total_tokens") or 0 for r in prev_rows)
        prev_cost = sum(float(r.get("cost_usd") or 0) for r in prev_rows)
        prev_latency = (sum(r.get("latency_ms") or 0 for r in prev_rows) / prev_runs) if prev_runs else 0
        prev_avg_cost = prev_cost / prev_runs if prev_runs else 0

        def pct_change(curr, prev):
            if prev == 0:
                return 0.0
            return round(((curr - prev) / prev) * 100, 1)

        resp["runs_delta"] = pct_change(total_runs, prev_runs)
        resp["tokens_delta"] = pct_change(total_tokens, prev_tokens)
        resp["cost_delta"] = pct_change(total_cost, prev_cost)
        resp["latency_delta"] = pct_change(avg_latency, prev_latency)
        resp["cost_per_run_delta"] = pct_change(avg_cost_per_run, prev_avg_cost)

    return resp


# ── Daily token usage ───────────────────────────────────────────


async def get_token_usage(
    user_id: str,
    start: datetime | None = None,
    end: datetime | None = None,
    pipeline_id: str | None = None,
    model_id: str | None = None,
) -> list[dict]:
    """Return daily token usage."""
    client = _get_client()

    if start and end:
        query = _apply_filters(
            client.table("pipelineruns").select("created_at, prompt_tokens, completion_tokens, total_tokens"),
            user_id, start, end, pipeline_id, model_id,
        )
        result = query.execute()
        rows = result.data or []

        # Group by date
        by_date: dict[str, dict] = {}
        for r in rows:
            day = r["created_at"][:10]
            if day not in by_date:
                by_date[day] = {"date": day, "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            by_date[day]["prompt_tokens"] += r.get("prompt_tokens") or 0
            by_date[day]["completion_tokens"] += r.get("completion_tokens") or 0
            by_date[day]["total_tokens"] += r.get("total_tokens") or 0

        return sorted(by_date.values(), key=lambda x: x["date"])

    # Fallback to RPC for legacy
    result = client.rpc("analytics_token_usage", {"p_user_id": user_id}).execute()
    return result.data or []


# ── Daily cost by model ─────────────────────────────────────────


async def get_cost(
    user_id: str,
    start: datetime | None = None,
    end: datetime | None = None,
    pipeline_id: str | None = None,
    model_id: str | None = None,
) -> list[dict]:
    """Return daily cost grouped by model."""
    client = _get_client()

    if start and end:
        query = _apply_filters(
            client.table("pipelineruns").select("created_at, model_used, cost_usd"),
            user_id, start, end, pipeline_id, model_id,
        )
        result = query.execute()
        rows = result.data or []

        # Group by date + model
        by_date_model: dict[tuple, dict] = {}
        for r in rows:
            day = r["created_at"][:10]
            model = r.get("model_used") or "unknown"
            key = (day, model)
            if key not in by_date_model:
                by_date_model[key] = {"date": day, "model_used": model, "cost_usd": 0.0}
            by_date_model[key]["cost_usd"] += float(r.get("cost_usd") or 0)

        return sorted(by_date_model.values(), key=lambda x: (x["date"], x["model_used"]))

    # Fallback to RPC for legacy
    result = client.rpc("analytics_cost", {"p_user_id": user_id}).execute()
    return result.data or []


# ── Latency percentiles ─────────────────────────────────────────


async def get_latency(
    user_id: str,
    start: datetime | None = None,
    end: datetime | None = None,
    pipeline_id: str | None = None,
    model_id: str | None = None,
) -> list[dict]:
    """Return p50/p95/p99 latency per pipeline."""
    client = _get_client()

    if start and end:
        query = _apply_filters(
            client.table("pipelineruns").select("pipeline_id, latency_ms, pipelines!pipelineruns_pipeline_id_fkey(name)"),
            user_id, start, end, pipeline_id, model_id,
        )
        result = query.execute()
        rows = result.data or []

        # Group by pipeline and compute percentiles
        by_pipeline: dict[str, list] = {}
        pipeline_names: dict[str, str] = {}
        for r in rows:
            pid = str(r.get("pipeline_id") or "playground")
            pipeline_info = r.pop("pipelines", None)
            pipeline_names[pid] = pipeline_info["name"] if pipeline_info else "Playground"
            lat = r.get("latency_ms") or 0
            by_pipeline.setdefault(pid, []).append(lat)

        import statistics
        out = []
        for pid, lats in by_pipeline.items():
            lats_sorted = sorted(lats)
            n = len(lats_sorted)
            out.append({
                "pipeline_id": pid,
                "pipeline_name": pipeline_names.get(pid, "Unknown"),
                "p50_ms": statistics.median(lats_sorted),
                "p95_ms": lats_sorted[int(n * 0.95)] if n > 0 else 0,
                "p99_ms": lats_sorted[int(n * 0.99)] if n > 0 else 0,
                "run_count": n,
            })
        return out

    # Fallback to RPC for legacy
    result = client.rpc("analytics_latency", {"p_user_id": user_id}).execute()
    return result.data or []


# ── Paginated run history ───────────────────────────────────────


async def get_runs(
    user_id: str,
    page: int = 1,
    page_size: int = 20,
    pipeline_id: str | None = None,
    model_id: str | None = None,
    status: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
) -> dict:
    """Return paginated run history with pipeline names.

    Returns {"runs": [...], "total": N, "page": int, "page_size": int}.
    """
    client = _get_client()

    # Build base query with pipeline name join
    query = (
        client.table("pipelineruns")
        .select("id, pipeline_id, user_message, llm_response, model_used, "
                "prompt_tokens, completion_tokens, total_tokens, cost_usd, "
                "latency_ms, retrieved_chunks, status, error_message, created_at, "
                "pipelines!pipelineruns_pipeline_id_fkey(name)")
        .eq("user_id", user_id)
    )

    # Optional filters
    if pipeline_id:
        query = query.eq("pipeline_id", pipeline_id)
    if model_id:
        query = query.eq("model_used", model_id)
    if status:
        query = query.eq("status", status)
    if date_from:
        query = query.gte("created_at", date_from)
    if date_to:
        query = query.lte("created_at", date_to)

    # Count total (same filters, just count)
    count_query = (
        client.table("pipelineruns")
        .select("id", count="exact")
        .eq("user_id", user_id)
    )
    if pipeline_id:
        count_query = count_query.eq("pipeline_id", pipeline_id)
    if model_id:
        count_query = count_query.eq("model_used", model_id)
    if status:
        count_query = count_query.eq("status", status)
    if date_from:
        count_query = count_query.gte("created_at", date_from)
    if date_to:
        count_query = count_query.lte("created_at", date_to)

    count_result = count_query.execute()
    total = count_result.count or 0

    # Paginated fetch
    offset = (page - 1) * page_size
    query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)
    result = query.execute()

    # Flatten pipeline name from join
    runs = []
    for row in result.data or []:
        pipeline_info = row.pop("pipelines", None)
        row["pipeline_name"] = pipeline_info["name"] if pipeline_info else None
        # Playground runs have no pipeline
        if row["pipeline_id"] is None:
            row["pipeline_name"] = "Playground"
        runs.append(row)

    return {
        "runs": runs,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ── Cost by model aggregation ─────────────────────────────────


async def get_cost_by_model(
    user_id: str,
    start: datetime,
    end: datetime,
    pipeline_id: str | None = None,
) -> list[dict]:
    """Return cost aggregated by model with run counts and percentages."""
    client = _get_client()

    query = _apply_filters(
        client.table("pipelineruns").select("model_used, cost_usd"),
        user_id, start, end, pipeline_id,
    )
    result = query.execute()
    rows = result.data or []

    # Aggregate by model
    by_model: dict[str, dict] = {}
    for r in rows:
        model = r.get("model_used") or "unknown"
        if model not in by_model:
            by_model[model] = {"model": model, "cost": 0.0, "runs": 0}
        by_model[model]["cost"] += float(r.get("cost_usd") or 0)
        by_model[model]["runs"] += 1

    total_cost = sum(m["cost"] for m in by_model.values())
    for m in by_model.values():
        m["pct"] = round((m["cost"] / total_cost * 100), 1) if total_cost > 0 else 0

    return sorted(by_model.values(), key=lambda x: x["cost"], reverse=True)


# ── Runs by pipeline aggregation ──────────────────────────────


async def get_runs_by_pipeline(
    user_id: str,
    start: datetime,
    end: datetime,
    model_id: str | None = None,
) -> list[dict]:
    """Return run counts aggregated by pipeline."""
    client = _get_client()

    query = _apply_filters(
        client.table("pipelineruns").select(
            "pipeline_id, cost_usd, pipelines!pipelineruns_pipeline_id_fkey(name)"
        ),
        user_id, start, end, None, model_id,
    )
    result = query.execute()
    rows = result.data or []

    by_pipeline: dict[str, dict] = {}
    for r in rows:
        pid = str(r.get("pipeline_id") or "playground")
        pipeline_info = r.get("pipelines")
        name = pipeline_info["name"] if pipeline_info else "Playground"

        if pid not in by_pipeline:
            by_pipeline[pid] = {"id": pid, "pipeline": name, "runs": 0, "cost": 0.0}
        by_pipeline[pid]["runs"] += 1
        by_pipeline[pid]["cost"] += float(r.get("cost_usd") or 0)

    return sorted(by_pipeline.values(), key=lambda x: x["runs"], reverse=True)


# ── Latency distribution histogram ────────────────────────────


async def get_latency_distribution(
    user_id: str,
    start: datetime,
    end: datetime,
    pipeline_id: str | None = None,
    model_id: str | None = None,
) -> dict:
    """Return latency histogram buckets + percentile stats."""
    client = _get_client()

    query = _apply_filters(
        client.table("pipelineruns").select("latency_ms"),
        user_id, start, end, pipeline_id, model_id,
    )
    result = query.execute()
    rows = result.data or []

    if not rows:
        return {"buckets": [], "stats": {"median": 0, "p95": 0, "p99": 0}}

    import statistics
    lats = sorted(r.get("latency_ms") or 0 for r in rows)
    n = len(lats)

    # Percentiles
    stats = {
        "median": round(statistics.median(lats), 1),
        "p95": round(lats[int(n * 0.95)], 1) if n > 0 else 0,
        "p99": round(lats[int(n * 0.99)], 1) if n > 0 else 0,
    }

    # Histogram buckets
    buckets_def = [
        ("<250ms", 0, 250),
        ("250-500ms", 250, 500),
        ("500ms-1s", 500, 1000),
        ("1-2s", 1000, 2000),
        ("2-3s", 2000, 3000),
        ("3-5s", 3000, 5000),
        ("5s+", 5000, float("inf")),
    ]

    buckets = []
    for label, lo, hi in buckets_def:
        count = sum(1 for l in lats if lo <= l < hi)
        pct = round(count / n * 100, 1) if n > 0 else 0
        buckets.append({"bucket": label, "runs": count, "pct": pct})

    return {"buckets": buckets, "stats": stats}


# ── Export runs as flat rows ──────────────────────────────────


async def get_runs_for_export(
    user_id: str,
    start: datetime,
    end: datetime,
    pipeline_id: str | None = None,
    model_id: str | None = None,
) -> list[dict]:
    """Return flat rows suitable for CSV export."""
    client = _get_client()

    query = _apply_filters(
        client.table("pipelineruns").select(
            "id, pipeline_id, model_used, prompt_tokens, completion_tokens, "
            "cost_usd, latency_ms, status, created_at, "
            "pipelines!pipelineruns_pipeline_id_fkey(name)"
        ),
        user_id, start, end, pipeline_id, model_id,
    ).order("created_at", desc=True)

    result = query.execute()
    rows = result.data or []

    out = []
    for r in rows:
        pipeline_info = r.get("pipelines")
        out.append({
            "run_id": r["id"],
            "pipeline": pipeline_info["name"] if pipeline_info else "Playground",
            "model": r.get("model_used", ""),
            "tokens_in": r.get("prompt_tokens", 0),
            "tokens_out": r.get("completion_tokens", 0),
            "cost_usd": round(float(r.get("cost_usd") or 0), 6),
            "latency_ms": r.get("latency_ms", 0),
            "status": r.get("status", ""),
            "created_at": r.get("created_at", ""),
        })
    return out
