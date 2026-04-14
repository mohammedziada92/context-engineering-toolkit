from yarl import URL
from supabase import create_client, Client
from datetime import date, timedelta

from app.core.config import settings


def _get_client() -> Client:
    """Create a Supabase client with the service role key (bypasses RLS)."""
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    client.postgrest.base_url = URL(settings.SUPABASE_URL)
    return client


async def get_stats(user_id: str) -> dict:
    supabase = _get_client()
    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()

    # Parallel fetches via supabase-py
    pipelines_res = supabase.table("pipelines").select("id", count="exact") \
        .eq("user_id", user_id).execute()

    pipelines_today_res = supabase.table("pipelines").select("id", count="exact") \
        .eq("user_id", user_id).gte("created_at", today).execute()

    kb_res = supabase.table("knowledgesources").select("id", count="exact") \
        .eq("user_id", user_id).execute()

    kb_today_res = supabase.table("knowledgesources").select("id", count="exact") \
        .eq("user_id", user_id).gte("created_at", today).execute()

    # Runs today vs yesterday
    runs_today_res = supabase.table("pipelineruns").select("id, total_tokens, cost_usd", count="exact") \
        .eq("user_id", user_id).gte("created_at", today).execute()

    runs_yesterday_res = supabase.table("pipelineruns").select("id", count="exact") \
        .eq("user_id", user_id) \
        .gte("created_at", yesterday) \
        .lt("created_at", today).execute()

    runs_all_res = supabase.table("pipelineruns").select("id", count="exact") \
        .eq("user_id", user_id).execute()

    # Settings for onboarding
    settings_res = supabase.table("usersettings").select("openrouter_api_key, onboarding_complete") \
        .eq("user_id", user_id).maybe_single().execute()

    # Aggregate
    runs_today = runs_today_res.data or []
    tokens_today = sum(r.get("total_tokens", 0) for r in runs_today)
    runs_today_count = runs_today_res.count or 0
    runs_yesterday_count = runs_yesterday_res.count or 0

    settings = settings_res.data or {}
    pipeline_count = pipelines_res.count or 0
    run_count = runs_all_res.count or 0
    has_key = bool(settings.get("openrouter_api_key"))

    onboarding_complete = (
        settings.get("onboarding_complete", False)
        or (has_key and pipeline_count > 0 and run_count > 0)
    )

    return {
        "pipelines": {
            "count": pipeline_count,
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
            "delta_pct": 0,  # v2: compare vs yesterday
        },
        "cost_today": {
            "usd": sum(r.get("cost_usd", 0) for r in runs_today),
            "delta_pct": 0,
        },
        "onboarding_complete": onboarding_complete,
        "pipeline_count": pipeline_count,
        "run_count": run_count,
    }
