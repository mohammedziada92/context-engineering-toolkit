from fastapi import APIRouter, Depends

from app.middleware.auth import get_current_user
from app.models.billing import NotifyInterestRequest
from app.db.queries import billing as billing_db

router = APIRouter(prefix="/api/v1/billing", tags=["billing"])


@router.get("/usage")
async def get_billing_usage(user: dict = Depends(get_current_user)):
    """Return usage quotas for the current billing period."""
    return await billing_db.get_usage(user["sub"])


@router.post("/notify-interest")
async def notify_interest(
    payload: NotifyInterestRequest,
    user: dict = Depends(get_current_user),
):
    """Register interest in a paid plan. Unique on (user_id, plan)."""
    return await billing_db.notify_interest(
        user_id=user["sub"],
        email=payload.email,
        plan=payload.plan,
    )
