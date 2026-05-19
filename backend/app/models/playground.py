from uuid import UUID
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.config import settings


# ── Run request ──────────────────────────────────────────────────


class PlaygroundRunRequest(BaseModel):
    """Body for POST /api/v1/playground/run — direct LLM call, no pipeline."""

    model: str = Field(..., min_length=1)
    messages: list[dict] = Field(..., min_length=1)
    system_prompt: str | None = None

    @field_validator("model")
    @classmethod
    def model_must_be_allowed(cls, v: str) -> str:
        if v not in settings.ALLOWED_MODEL_IDS:
            raise ValueError(f"model must be one of: {settings.ALLOWED_MODEL_IDS}")
        return v


# ── Session config ───────────────────────────────────────────────


class SessionConfig(BaseModel):
    model: str = Field(default="anthropic/claude-sonnet-4-6")
    system_prompt: str = Field(default="")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=4096, ge=1, le=16384)
    top_p: float = Field(default=1.0, ge=0.0, le=1.0)
    knowledge_source_id: str | None = None
    top_k: int = Field(default=5, ge=1, le=20)
    threshold: float = Field(default=0.50, ge=0.0, le=1.0)


# ── Chat sessions ────────────────────────────────────────────────


class ChatSessionCreate(BaseModel):
    """Body for POST /api/v1/playground/sessions."""

    name: str | None = None
    pipeline_id: str | None = None


class CreateSessionRequest(BaseModel):
    """Body for POST /api/v1/playground/sessions (v2 with mode + config)."""

    name: str | None = None
    mode: Literal["direct", "pipeline"] = "direct"
    pipeline_id: str | None = None
    config: SessionConfig = Field(default_factory=SessionConfig)


class UpdateSessionRequest(BaseModel):
    """Body for PATCH /api/v1/playground/sessions/{id}."""

    name: str | None = None
    config: SessionConfig | None = None


class ChatSessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    mode: str = "direct"
    pipeline_id: UUID | None
    config: dict | None = None
    message_count: int = 0
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ChatSessionDetailResponse(ChatSessionResponse):
    """Full session with messages included."""
    messages: list["ChatMessageResponse"] = []


# ── Chat messages ────────────────────────────────────────────────


class ChatMessageCreate(BaseModel):
    """Body for POST /api/v1/playground/sessions/{id}/messages."""

    role: str = Field(..., pattern=r"^(user|assistant)$")
    content: str = Field(..., min_length=1)
    retrieved_chunks: list[dict] | None = None


class ChatMessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    retrieved_chunks: list[dict] | None = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ── Chat (SSE) request ──────────────────────────────────────────


class ChatRequest(BaseModel):
    """Body for POST /api/v1/playground/chat — SSE streaming with optional RAG."""

    session_id: str | None = None
    message: str = Field(..., min_length=1)
    mode: Literal["direct", "pipeline"] = "direct"
    pipeline_id: str | None = None
    model: str = Field(default="anthropic/claude-sonnet-4-6")
    system_prompt: str = Field(default="")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=4096, ge=1, le=16384)
    top_p: float = Field(default=1.0, ge=0.0, le=1.0)
    knowledge_source_id: str | None = None
    top_k: int = Field(default=5, ge=1, le=20)
    threshold: float = Field(default=0.50, ge=0.0, le=1.0)
