from typing import Optional
from yarl import URL
from supabase import create_client, Client

from app.core.config import settings


def _get_client() -> Client:
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    client.postgrest.base_url = URL(settings.SUPABASE_URL)
    return client

SORT_COLUMNS = {
    "updated_at": "updated_at",
    "created_at": "created_at",
    "name":       "name",
    "run_count":  "run_count",
}


async def list_pipelines(
    user_id: str,
    page: int = 1,
    limit: int = 12,
    status: Optional[str] = None,
    sort: str = "updated_at",
    search: Optional[str] = None,
) -> dict:
    client  = _get_client()
    col     = SORT_COLUMNS.get(sort, "updated_at")
    offset  = (page - 1) * limit

    q = (
        client.table("pipelines")
        .select("*", count="exact")
        .eq("user_id", user_id)
        .order(col, desc=True)
        .range(offset, offset + limit - 1)
    )
    if status:
        q = q.eq("status", status)
    if search:
        q = q.ilike("name", f"%{search}%")

    result = q.execute()
    items  = result.data or []

    # Enrich with run_count from pipeline_runs
    for item in items:
        rc = (
            client.table("pipelineruns")
            .select("id", count="exact")
            .eq("pipeline_id", item["id"])
            .execute()
        )
        item["run_count"] = rc.count or 0

    return {
        "items": items,
        "total": result.count or 0,
        "page":  page,
        "limit": limit,
    }


async def get_pipeline(user_id: str, pipeline_id: str) -> Optional[dict]:
    client = _get_client()
    result = (
        client.table("pipelines")
        .select("*")
        .eq("id", pipeline_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        return None
    pipeline = result.data
    rc = (
        client.table("pipelineruns")
        .select("id", count="exact")
        .eq("pipeline_id", pipeline_id)
        .execute()
    )
    pipeline["run_count"] = rc.count or 0
    return pipeline


async def create_pipeline(user_id: str, body) -> dict:
    client = _get_client()
    result = (
        client.table("pipelines")
        .insert({
            "user_id":        user_id,
            "name":           body.name,
            "description":    getattr(body, "description", None),
            "canvas_state":   getattr(body, "canvas_state", {}) or {},
            "pipeline_config":getattr(body, "pipeline_config", {}) or {},
            "status":         "draft",
        })
        .execute()
    )
    pipeline = result.data[0]
    pipeline["run_count"] = 0
    return pipeline


async def update_pipeline(user_id: str, pipeline_id: str, body) -> dict:
    client  = _get_client()
    payload = body.model_dump(exclude_none=True)
    result  = (
        client.table("pipelines")
        .update(payload)
        .eq("id", pipeline_id)
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0]


async def patch_pipeline(user_id: str, pipeline_id: str, body) -> dict:
    client  = _get_client()
    payload = {k: v for k, v in body.model_dump().items() if v is not None}
    result  = (
        client.table("pipelines")
        .update(payload)
        .eq("id", pipeline_id)
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0]


async def delete_pipeline(user_id: str, pipeline_id: str) -> None:
    client = _get_client()
    client.table("pipelines").delete().eq("id", pipeline_id).eq("user_id", user_id).execute()
