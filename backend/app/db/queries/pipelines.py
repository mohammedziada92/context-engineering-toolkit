from typing import Optional
from supabase import create_client, Client

from app.core.config import settings


def _get_client() -> Client:
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return client

SORT_COLUMNS = {
    "updated_at": ("updated_at", True),
    "created_at": ("created_at", True),
    "name":       ("name", False),
    "run_count":  ("run_count", True),
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
    offset  = (page - 1) * limit

    q = (
        client.table("pipelines")
        .select("*", count="exact")
        .eq("user_id", user_id)
        .range(offset, offset + limit - 1)
    )
    if status:
        q = q.eq("is_active", status == "active")
    if search:
        q = q.ilike("name", f"%{search}%")

    result = q.execute()
    items  = result.data or []

    # Enrich with run_count from pipeline_runs + map is_active → status
    for item in items:
        rc = (
            client.table("pipeline_runs")
            .select("id", count="exact")
            .eq("pipeline_id", item["id"])
            .execute()
        )
        item["run_count"] = rc.count or 0
        item["status"] = "active" if item.get("is_active") else "draft"

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
        client.table("pipeline_runs")
        .select("id", count="exact")
        .eq("pipeline_id", pipeline_id)
        .execute()
    )
    pipeline["run_count"] = rc.count or 0
    pipeline["status"] = "active" if pipeline.get("is_active") else "draft"
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
            "is_active":      False,
        })
        .execute()
    )
    pipeline = result.data[0]
    pipeline["run_count"] = 0
    pipeline["status"] = "active" if pipeline.get("is_active") else "draft"
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
    pipeline = result.data[0]
    pipeline["status"] = "active" if pipeline.get("is_active") else "draft"
    return pipeline


async def patch_pipeline(user_id: str, pipeline_id: str, body) -> dict:
    client  = _get_client()
    payload = {k: v for k, v in body.model_dump().items() if v is not None}
    # Map status string → is_active boolean for DB
    if "status" in payload:
        payload["is_active"] = payload.pop("status") == "active"
    result  = (
        client.table("pipelines")
        .update(payload)
        .eq("id", pipeline_id)
        .eq("user_id", user_id)
        .execute()
    )
    pipeline = result.data[0]
    pipeline["status"] = "active" if pipeline.get("is_active") else "draft"
    return pipeline


async def delete_pipeline(user_id: str, pipeline_id: str) -> None:
    client = _get_client()
    client.table("pipelines").delete().eq("id", pipeline_id).eq("user_id", user_id).execute()
