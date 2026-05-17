import re
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.core.config import settings


class ValidateKeyRequest(BaseModel):
    api_key: str


class ValidateKeyResponse(BaseModel):
    valid: bool
    credits_remaining: float | None = None
    plan: str | None = None
    error: str | None = None


class SaveApiKeyRequest(BaseModel):
    api_key: str = Field(..., pattern=r"^sk-or-")


class UpdateModelRequest(BaseModel):
    default_model: str

    def model_must_be_allowed(self) -> str:
        if self.default_model not in settings.ALLOWED_MODEL_IDS:
            raise ValueError(f"Must be one of: {settings.ALLOWED_MODEL_IDS}")
        return self.default_model


class SettingsResponse(BaseModel):
    user_id: UUID
    openrouter_api_key: str | None = None
    default_model: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


# ── Profile & Preferences ───────────────────────────────────────


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    username: str | None = None

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v):
        if v is not None and (len(v) < 2 or len(v) > 100):
            raise ValueError("Name must be 2-100 characters")
        return v

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        if v and not re.match(r'^[a-z0-9-]+$', v):
            raise ValueError("Lowercase, numbers, and - only")
        return v


class PreferencesUpdate(BaseModel):
    theme: str | None = None          # dark | light | system
    timezone: str | None = None
    date_format: str | None = None
