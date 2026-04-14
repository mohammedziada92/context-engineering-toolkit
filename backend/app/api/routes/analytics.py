import csv
import io
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from app.db.queries import analytics as analytics_db
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


# ── Helpers ─────────────────────────────────────────────────────


def parse_date_range(range: str = "7d", from_: str = None, to_: str = None):
    """Returns (start_dt, end_dt) based on range or custom from/to."""
    if from_ and to_:
        start = datetime.fromisoformat(from_)
        end = datetime.fromisoformat(to_) + timedelta(days=1)
    else:
        days = {"1d": 1, "7d": 7, "30d": 30, "90d": 90}.get(range, 7)
        end = datetime.utcnow()
        start = end - timedelta(days=days)
    return start, end


# ── GET /api/v1/analytics/summary ──────────────────────────────


@router.get("/summary")
async def get_summary(
    range: str = Query("7d"),
    from_: str = Query(None, alias="from"),
    to_: str = Query(None, alias="to"),
    pipeline_id: Optional[str] = None,
    model_id: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """Return KPI summary cards with delta comparison."""
    start, end = parse_date_range(range, from_, to_)
    return await analytics_db.get_summary(
        user_id=user["sub"],
        start=start,
        end=end,
        pipeline_id=pipeline_id,
        model_id=model_id,
    )


# ── GET /api/v1/analytics/token-usage ──────────────────────────


@router.get("/token-usage")
async def get_token_usage(
    range: str = Query("7d"),
    from_: str = Query(None, alias="from"),
    to_: str = Query(None, alias="to"),
    pipeline_id: Optional[str] = None,
    model_id: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """Return daily token usage."""
    start, end = parse_date_range(range, from_, to_)
    return await analytics_db.get_token_usage(
        user_id=user["sub"],
        start=start,
        end=end,
        pipeline_id=pipeline_id,
        model_id=model_id,
    )


# ── GET /api/v1/analytics/cost ─────────────────────────────────


@router.get("/cost")
async def get_cost(
    range: str = Query("7d"),
    from_: str = Query(None, alias="from"),
    to_: str = Query(None, alias="to"),
    pipeline_id: Optional[str] = None,
    model_id: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """Return daily cost grouped by model."""
    start, end = parse_date_range(range, from_, to_)
    return await analytics_db.get_cost(
        user_id=user["sub"],
        start=start,
        end=end,
        pipeline_id=pipeline_id,
        model_id=model_id,
    )


# ── GET /api/v1/analytics/latency ──────────────────────────────


@router.get("/latency")
async def get_latency(
    range: str = Query("7d"),
    from_: str = Query(None, alias="from"),
    to_: str = Query(None, alias="to"),
    pipeline_id: Optional[str] = None,
    model_id: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """Return p50/p95/p99 latency per pipeline."""
    start, end = parse_date_range(range, from_, to_)
    raw = await analytics_db.get_latency(
        user_id=user["sub"],
        start=start,
        end=end,
        pipeline_id=pipeline_id,
        model_id=model_id,
    )
    return [
        {
            "pipeline_id": str(row["pipeline_id"]),
            "pipeline_name": row["pipeline_name"] or "Unnamed",
            "p50_ms": float(row["p50_ms"]),
            "p95_ms": float(row["p95_ms"]),
            "p99_ms": float(row["p99_ms"]),
            "run_count": int(row["run_count"]),
        }
        for row in raw
    ]


# ── GET /api/v1/analytics/runs ─────────────────────────────────


@router.get("/runs")
async def get_runs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    pipeline_id: Optional[str] = None,
    model_id: Optional[str] = None,
    status: Optional[str] = None,
    from_: str = Query(None, alias="from"),
    to_: str = Query(None, alias="to"),
    user: dict = Depends(get_current_user),
):
    """Return paginated run history with optional filters."""
    start, end = parse_date_range("90d", from_, to_)
    return await analytics_db.get_runs(
        user_id=user["sub"],
        page=page,
        page_size=page_size,
        pipeline_id=pipeline_id,
        model_id=model_id,
        status=status,
        date_from=start.isoformat(),
        date_to=end.isoformat(),
    )


# ── GET /api/v1/analytics/cost-by-model ────────────────────────


@router.get("/cost-by-model")
async def cost_by_model(
    range: str = Query("7d"),
    from_: str = Query(None, alias="from"),
    to_: str = Query(None, alias="to"),
    pipeline_id: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    start, end = parse_date_range(range, from_, to_)
    return await analytics_db.get_cost_by_model(
        user_id=user["sub"],
        start=start,
        end=end,
        pipeline_id=pipeline_id,
    )


# ── GET /api/v1/analytics/runs-by-pipeline ─────────────────────


@router.get("/runs-by-pipeline")
async def runs_by_pipeline(
    range: str = Query("7d"),
    from_: str = Query(None, alias="from"),
    to_: str = Query(None, alias="to"),
    model_id: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    start, end = parse_date_range(range, from_, to_)
    return await analytics_db.get_runs_by_pipeline(
        user_id=user["sub"],
        start=start,
        end=end,
        model_id=model_id,
    )


# ── GET /api/v1/analytics/latency-distribution ─────────────────


@router.get("/latency-distribution")
async def latency_distribution(
    range: str = Query("7d"),
    from_: str = Query(None, alias="from"),
    to_: str = Query(None, alias="to"),
    pipeline_id: Optional[str] = None,
    model_id: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    start, end = parse_date_range(range, from_, to_)
    return await analytics_db.get_latency_distribution(
        user_id=user["sub"],
        start=start,
        end=end,
        pipeline_id=pipeline_id,
        model_id=model_id,
    )


# ── GET /api/v1/analytics/export ───────────────────────────────


@router.get("/export")
async def export_analytics(
    format: str = Query("csv"),
    range: str = Query("7d"),
    from_: str = Query(None, alias="from"),
    to_: str = Query(None, alias="to"),
    pipeline_id: Optional[str] = None,
    model_id: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    start, end = parse_date_range(range, from_, to_)
    runs = await analytics_db.get_runs_for_export(
        user_id=user["sub"],
        start=start,
        end=end,
        pipeline_id=pipeline_id,
        model_id=model_id,
    )
    if format == "csv":
        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=[
                "run_id", "pipeline", "model", "tokens_in",
                "tokens_out", "cost_usd", "latency_ms", "status", "created_at",
            ],
        )
        writer.writeheader()
        writer.writerows(runs)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=cet-analytics-{range}.csv"
            },
        )
    # PDF: stub for v2
    return {"detail": "PDF export coming in v2. Use CSV for now."}
