from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.config import settings


class PipelineCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    model: str | None = None
    canvas_state: dict | None = None
    pipeline_config: dict | None = None

    @field_validator("model")
    @classmethod
    def model_must_be_allowed(cls, v: str | None) -> str | None:
        if v and v not in settings.ALLOWED_MODEL_IDS:
            raise ValueError(f"model must be one of: {settings.ALLOWED_MODEL_IDS}")
        return v


class PipelineUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    canvas_state: dict | None = None
    pipeline_config: dict | None = None
    model: str | None = None
    token_budget: int | None = Field(None, ge=1)

    @field_validator("model")
    @classmethod
    def model_must_be_allowed(cls, v: str | None) -> str | None:
        if v and v not in settings.ALLOWED_MODEL_IDS:
            raise ValueError(f"model must be one of: {settings.ALLOWED_MODEL_IDS}")
        return v


class PipelineResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: str | None
    version: int
    is_active: bool
    canvas_state: dict | None
    pipeline_config: dict | None
    token_budget: int
    model: str | None
    tags: list[str]
    last_run_at: datetime | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PipelineVersionResponse(BaseModel):
    id: UUID
    pipeline_id: UUID
    user_id: UUID
    version: int
    snapshot: dict
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RunPipelineRequest(BaseModel):
    user_message: str = Field(..., min_length=1)
    session_id: str | None = None


class PipelinePatch(BaseModel):
    """Partial update — only non-None fields are applied."""
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    status: str | None = None
    canvas_state: dict | None = None
    pipeline_config: dict | None = None
    model: str | None = None

    @field_validator("model")
    @classmethod
    def model_must_be_allowed(cls, v: str | None) -> str | None:
        if v and v not in settings.ALLOWED_MODEL_IDS:
            raise ValueError(f"model must be one of: {settings.ALLOWED_MODEL_IDS}")
        return v


class PipelineListResponse(BaseModel):
    items: list[dict]
    total: int
    page: int
    limit: int
