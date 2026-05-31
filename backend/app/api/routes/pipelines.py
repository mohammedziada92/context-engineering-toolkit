# Appended endpoints to existing routes/pipelines.py

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from uuid import UUID
import uuid, json, asyncio

from app.middleware.auth import get_current_user, get_current_user_sse
from app.db.queries import pipelines as q
from app.models.pipeline import (
    PipelineCreate, PipelineUpdate, PipelinePatch,
    PipelineListResponse,
)
from app.services.pipeline_engine import execute_pipeline
from app.services import vault_service
from app.core.config import settings


class PipelineRunRequest(BaseModel):
    """Typed request body for POST /pipelines/{id}/run."""
    message: str = Field(..., max_length=10000)
    session_id: Optional[str] = None
    model_override: Optional[str] = None

    @field_validator("model_override")
    @classmethod
    def validate_model(cls, v):
        if v and v not in settings.ALLOWED_MODEL_IDS:
            raise ValueError(f"model must be one of: {settings.ALLOWED_MODEL_IDS}")
        return v

router = APIRouter(prefix="/api/v1/pipelines", tags=["pipelines"])


@router.get("", response_model=PipelineListResponse)
async def list_pipelines(
    page:   int            = Query(1, ge=1),
    limit:  int            = Query(12, ge=1, le=50),
    status: Optional[str]  = Query(None),
    sort:   str            = Query("updated_at"),
    search: Optional[str]  = Query(None),
    user=Depends(get_current_user),
):
    return await q.list_pipelines(
        user_id=user["sub"], page=page, limit=limit,
        status=status, sort=sort, search=search,
    )


@router.post("", status_code=201)
async def create_pipeline(body: PipelineCreate, user=Depends(get_current_user)):
    return await q.create_pipeline(user_id=user["sub"], body=body)


@router.get("/{pipeline_id}")
async def get_pipeline(pipeline_id: str, user=Depends(get_current_user)):
    pipeline = await q.get_pipeline(user_id=user["sub"], pipeline_id=pipeline_id)
    if not pipeline:
        raise HTTPException(404, "Pipeline not found")
    return pipeline


@router.put("/{pipeline_id}")
async def update_pipeline(pipeline_id: str, body: PipelineUpdate, user=Depends(get_current_user)):
    return await q.update_pipeline(user_id=user["sub"], pipeline_id=pipeline_id, body=body)


@router.patch("/{pipeline_id}")
async def patch_pipeline(pipeline_id: str, body: PipelinePatch, user=Depends(get_current_user)):
    return await q.patch_pipeline(user_id=user["sub"], pipeline_id=pipeline_id, body=body)


@router.delete("/{pipeline_id}")
async def delete_pipeline(pipeline_id: str, user=Depends(get_current_user)):
    await q.delete_pipeline(user_id=user["sub"], pipeline_id=pipeline_id)
    return {"deleted": True}


@router.post("/{pipeline_id}/duplicate")
async def duplicate_pipeline(pipeline_id: str, user=Depends(get_current_user)):
    original = await q.get_pipeline(user_id=user["sub"], pipeline_id=pipeline_id)
    if not original:
        raise HTTPException(404, "Pipeline not found")
    copy_body = PipelineCreate(
        name=f"{original['name']} (copy)",
        description=original.get("description"),
        canvas_state=original.get("canvas_state", {}),
        pipeline_config=original.get("pipeline_config", {}),
    )
    return await q.create_pipeline(user_id=user["sub"], body=copy_body)


@router.get("/{pipeline_id}/run/stream")
async def run_pipeline_stream(
    pipeline_id: str,
    message:        str          = Query(...),
    model_override: Optional[str]= Query(None),
    user=Depends(get_current_user_sse),
):
    """SSE stream endpoint for pipeline runs from EventSource (GET + query-string auth)."""
    # Validate model_override against whitelist
    if model_override and model_override not in settings.ALLOWED_MODEL_IDS:
        raise HTTPException(status_code=422, detail=f"Invalid model ID. Must be one of: {settings.ALLOWED_MODEL_IDS}")

    user_id = user["sub"]
    api_key = await vault_service.get_decrypted_key(user_id)
    if not api_key:
        raise HTTPException(403, "Add your OpenRouter API key in Settings first")

    pipeline = await q.get_pipeline(user_id=user_id, pipeline_id=pipeline_id)
    if not pipeline:
        raise HTTPException(404, "Pipeline not found")

    canvas_state = pipeline.get("canvas_state") or {}
    pipeline_config = pipeline.get("pipeline_config") or {}

    async def event_stream():
        async for event_type, event_data in execute_pipeline(
            canvas_state=canvas_state,
            pipeline_config=pipeline_config,
            pipeline_id=pipeline_id,
            user_message=message,
            user_id=user_id,
            session_id=str(uuid.uuid4()),
            model_override=model_override,
            api_key=api_key,
        ):
            yield f"event: {event_type}\ndata: {json.dumps(event_data)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/{pipeline_id}/run")
async def run_pipeline_post(
    pipeline_id: str,
    body: PipelineRunRequest,
    user=Depends(get_current_user),
):
    """Non-streaming run — returns run_id immediately; client polls /runs/{run_id}."""
    user_id = user["sub"]
    api_key = await vault_service.get_decrypted_key(user_id)
    if not api_key:
        raise HTTPException(403, "Add your OpenRouter API key in Settings first")
    run_id = str(uuid.uuid4())
    # Fire-and-forget — full impl in pipelineengine.py
    asyncio.create_task(
        execute_pipeline(
            pipeline_config={},
            user_message=body.message,
            user_id=user_id,
            session_id=run_id,
            pipeline_id=pipeline_id,
            model_override=body.model_override,
            api_key=api_key,
        )
    )
    return {"run_id": run_id}
