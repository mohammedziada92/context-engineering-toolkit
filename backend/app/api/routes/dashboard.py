from fastapi import APIRouter, Depends
from app.middleware.auth import get_current_user
from app.db.queries import dashboard as db
from app.db.queries.settings import ensure_user_exists

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("")
async def get_dashboard(user=Depends(get_current_user)):
    """
    Returns a single aggregated response for the dashboard page:
    - stats: pipeline/knowledge/run/token/cost counts for today
    - recent_runs: last 5 runs across all pipelines
    - recent_pipelines: last 3 updated pipelines
    - recent_sources: last 3 updated knowledge sources
    """
    await ensure_user_exists(
        user["sub"],
        email=user.get("email", ""),
        full_name=user.get("user_metadata", {}).get("full_name"),
    )
    return await db.get_dashboard(user_id=user["sub"])
