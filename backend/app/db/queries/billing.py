from datetime import datetime, timezone, date

from supabase import create_client, Client

from app.core.config import settings


def _get_client() -> Client:
    """Create a Supabase client with the service role key (bypasses RLS)."""
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return client


def _month_range() -> tuple[datetime, datetime]:
    """Return (start_of_month, end_of_month) as UTC datetimes."""
    today = date.today()
    start = datetime(today.year, today.month, 1, tzinfo=timezone.utc)
    if today.month == 12:
        end = datetime(today.year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(today.year, today.month + 1, 1, tzinfo=timezone.utc)
    return start, end


async def get_usage(user_id: str) -> dict:
    """Return usage counts and storage estimate for the current billing period."""
    client = _get_client()
    start, end = _month_range()

    # Pipelines count
    pipelines = (
        client.table("pipelines")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .execute()
    )

    # Knowledge sources count
    knowledge = (
        client.table("knowledge_sources")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .execute()
    )

    # Runs this month
    runs = (
        client.table("pipeline_runs")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .gte("created_at", start.isoformat())
        .execute()
    )

    return {
        "pipelines_count": pipelines.count or 0,
        "knowledge_count": knowledge.count or 0,
        "runs_this_month": runs.count or 0,
        "storage_mb": 0,  # TODO: query Supabase Storage bucket size
        "period_start": start.isoformat(),
        "period_end": end.isoformat(),
    }


async def notify_interest(user_id: str, email: str, plan: str) -> dict:
    """Upsert a billing interest record (unique on user_id + plan)."""
    client = _get_client()
    client.table("billing_notify_interest").upsert(
        {
            "user_id": user_id,
            "email": email,
            "plan": plan,
        },
        on_conflict="user_id,plan",
    ).execute()
    return {"success": True}
