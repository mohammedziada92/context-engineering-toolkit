from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.middleware.auth import get_current_user
from app.db.queries import analytics as db

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("")
async def get_analytics(
    period: str = Query("30d", pattern="^(7d|30d|90d)$"),
    user=Depends(get_current_user),
):
    """
    Returns aggregated analytics for the given period:
    - summary KPIs (total runs, costs, tokens, latency, success rate)
    - daily_usage array for time-series charts
    - model_breakdown and pipeline_breakdown for tables
    """
    return await db.get_analytics(user_id=user["sub"], period=period)


@router.get("/runs")
async def list_runs(
    page:        int           = Query(1, ge=1),
    limit:       int           = Query(20, ge=1, le=100),
    pipeline_id: Optional[str] = Query(None),
    model:       Optional[str] = Query(None),
    status:      Optional[str] = Query(None, pattern="^(success|error|cancelled)$"),
    period:      str           = Query("30d", pattern="^(7d|30d|90d)$"),
    user=Depends(get_current_user),
):
    return await db.list_runs(
        user_id=user["sub"],
        page=page,
        limit=limit,
        pipeline_id=pipeline_id,
        model=model,
        status=status,
        period=period,
    )
