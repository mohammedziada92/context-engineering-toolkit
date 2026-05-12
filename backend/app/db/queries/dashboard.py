from supabase import create_client, Client
from datetime import date, timedelta

from app.core.config import settings


def _get_client() -> Client:
    """Create a Supabase client with the service role key (bypasses RLS)."""
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return client


async def get_stats(user_id: str) -> dict:
    supabase = _get_client()
    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()

    # Parallel fetches via supabase-py
    pipelines_res = supabase.table("pipelines").select("id", count="exact") \
        .eq("user_id", user_id).execute()

    active_pipelines_res = supabase.table("pipelines").select("id", count="exact") \
        .eq("user_id", user_id).eq("is_active", True).execute()

    pipelines_today_res = supabase.table("pipelines").select("id", count="exact") \
        .eq("user_id", user_id).gte("created_at", today).execute()

    kb_res = supabase.table("knowledge_sources").select("id", count="exact") \
        .eq("user_id", user_id).execute()

    kb_today_res = supabase.table("knowledge_sources").select("id", count="exact") \
        .eq("user_id", user_id).gte("created_at", today).execute()

    # Runs today vs yesterday
    runs_today_res = supabase.table("pipeline_runs").select("id, total_tokens, cost_usd", count="exact") \
        .eq("user_id", user_id).gte("created_at", today).execute()

    runs_yesterday_res = supabase.table("pipeline_runs").select("id", count="exact") \
        .eq("user_id", user_id) \
        .gte("created_at", yesterday) \
        .lt("created_at", today).execute()

    runs_all_res = supabase.table("pipeline_runs").select("id", count="exact") \
        .eq("user_id", user_id).execute()

    # Settings for onboarding
    settings_res = supabase.table("user_settings").select("openrouter_api_key"). \
        eq("user_id", user_id).maybe_single().execute()

    # Aggregate
    runs_today = runs_today_res.data or []
    tokens_today = sum(r.get("total_tokens", 0) for r in runs_today)
    runs_today_count = runs_today_res.count or 0
    runs_yesterday_count = runs_yesterday_res.count or 0

    settings = (settings_res.data if settings_res else None) or {}
    pipeline_count = pipelines_res.count or 0
    run_count = runs_all_res.count or 0
    has_key = bool(settings.get("openrouter_api_key"))

    onboarding_complete = (
        settings.get("onboarding_complete", False)
        or (has_key and pipeline_count > 0 and run_count > 0)
    )

    cost_today_usd = sum(r.get("cost_usd", 0) for r in runs_today)

    return {
        "pipelines": {
            "count": pipeline_count,
            "active": active_pipelines_res.count or 0,
            "delta": pipelines_today_res.count or 0,
        },
        "knowledge_sources": {
            "count": kb_res.count or 0,
            "delta": kb_today_res.count or 0,
        },
        "runs_today": {
            "count": runs_today_count,
            "delta": runs_today_count - runs_yesterday_count,
        },
        "tokens_today": {
            "total": tokens_today,
            "delta_pct": 0,
        },
        "cost_today": {
            "usd": cost_today_usd,
            "delta_pct": 0,
        },
        "onboarding_complete": onboarding_complete,
        "has_api_key": has_key,
        "pipeline_count": pipeline_count,
        "active_pipelines": active_pipelines_res.count or 0,
        "run_count": run_count,
        # Flat fields for frontend DashboardStats interface
        "knowledge_source_count": kb_res.count or 0,
        "total_runs_today": runs_today_count,
        "total_tokens_today": tokens_today,
        "total_cost_today_usd": cost_today_usd,
    }


async def get_dashboard(user_id: str) -> dict:
    """Single aggregated response for the dashboard page.

    Returns: { stats, recent_runs, recent_pipelines, recent_sources }
    """
    client = _get_client()

    # Stats
    stats = await get_stats(user_id)

    # Recent runs — last 5 with pipeline name
    runs_result = (
        client.table("pipeline_runs")
        .select(
            "id, pipeline_id, user_message, llm_response, model_used, "
            "total_tokens, cost_usd, latency_ms, status, created_at, "
            "pipelines!pipeline_runs_pipeline_id_fkey(name)"
        )
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )
    recent_runs = []
    for row in runs_result.data or []:
        pipeline_info = row.pop("pipelines", None)
        row["pipeline_name"] = pipeline_info["name"] if pipeline_info else None
        if row["pipeline_id"] is None:
            row["pipeline_name"] = "Playground"
        row["model"] = row.pop("model_used", None)
        recent_runs.append(row)

    # Recent pipelines — last 3
    pipelines_result = (
        client.table("pipelines")
        .select("id, name, description, is_active, model, updated_at, created_at")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .limit(3)
        .execute()
    )
    recent_pipelines = pipelines_result.data or []

    # Enrich each pipeline with run_count and map is_active → status
    for p in recent_pipelines:
        rc = client.table("pipeline_runs").select("id", count="exact") \
            .eq("pipeline_id", p["id"]).execute()
        p["run_count"] = rc.count or 0
        p["status"] = "active" if p.get("is_active") else "draft"

    # Recent knowledge sources — last 3
    sources_result = (
        client.table("knowledge_sources")
        .select("id, name, type, status, total_chunks, updated_at, created_at")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .limit(3)
        .execute()
    )
    recent_sources = []
    for row in sources_result.data or []:
        row["chunk_count"] = row.pop("total_chunks", 0) or 0
        recent_sources.append(row)

    return {
        "stats": stats,
        "recent_runs": recent_runs,
        "recent_pipelines": recent_pipelines,
        "recent_sources": recent_sources,
        "onboarding": {
            "has_api_key": bool(stats.get("has_api_key")),
            "has_pipeline": stats.get("pipeline_count", 0) > 0,
            "has_run": stats.get("run_count", 0) > 0,
            "complete": stats.get("onboarding_complete", False),
        },
    }
