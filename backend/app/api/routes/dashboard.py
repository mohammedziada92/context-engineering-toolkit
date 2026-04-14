from fastapi import APIRouter, Depends

from app.middleware.auth import get_current_user
from app.db.queries import dashboard as dashboard_db

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    user: dict = Depends(get_current_user),
):
    """Return aggregated dashboard stats for the current user."""
    return await dashboard_db.get_stats(user["sub"])
