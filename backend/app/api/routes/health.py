import os

from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/health")
async def health(request: Request):
    return {
        "status": "ok",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "version": "1.0.0",
    }
