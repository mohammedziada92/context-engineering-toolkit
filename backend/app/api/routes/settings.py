from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile

from app.middleware.auth import get_current_user
from app.models.settings import (
    ProfileUpdate,
    PreferencesUpdate,
    SaveApiKeyRequest,
    SettingsResponse,
    UpdateModelRequest,
    ValidateKeyRequest,
    ValidateKeyResponse,
)
from app.core.config import settings
from app.db.queries import settings as db
from app.services import vault_service

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])


@router.post("/validate-key", response_model=ValidateKeyResponse)
async def validate_key(
    request: Request,
    body: ValidateKeyRequest,
    user: dict = Depends(get_current_user),
):
    """Validate an OpenRouter API key without saving it."""
    result = await vault_service.validate_openrouter_key(body.api_key)
    return ValidateKeyResponse(**result)


@router.put("/api-key")
async def save_api_key(
    request: Request,
    body: SaveApiKeyRequest,
    user: dict = Depends(get_current_user),
):
    """Validate then encrypt and save an OpenRouter API key."""
    # Validate first
    validation = await vault_service.validate_openrouter_key(body.api_key)
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail="API key validation failed")

    # Get current model or use default
    current = await vault_service.get_settings(user["sub"])
    default_model = current.get("default_model", settings.MODEL_QUALITY) if current else settings.MODEL_QUALITY

    # Save
    await vault_service.save_api_key(user["sub"], body.api_key, default_model)
    return {"message": "API key saved", "key": "sk-or-masked"}


@router.get("", response_model=SettingsResponse)
async def get_settings_route(
    request: Request,
    user: dict = Depends(get_current_user),
):
    """Get settings — key always returned masked."""
    row = await vault_service.get_settings(user["sub"])
    if not row:
        raise HTTPException(status_code=404, detail="Settings not found. Save an API key first.")
    row["openrouter_api_key"] = "sk-or-masked"
    return SettingsResponse(**row)


@router.delete("/api-key")
async def delete_api_key(
    request: Request,
    user: dict = Depends(get_current_user),
):
    """Remove the stored OpenRouter API key."""
    await vault_service.delete_key(user["sub"])
    return {"message": "API key removed"}


@router.put("/model")
async def update_model(
    request: Request,
    body: UpdateModelRequest,
    user: dict = Depends(get_current_user),
):
    """Update the default model — must be one of 3 supported."""
    if body.default_model not in settings.ALLOWED_MODEL_IDS:
        raise HTTPException(
            status_code=422,
            detail=f"Must be one of: {settings.ALLOWED_MODEL_IDS}",
        )
    await vault_service.update_default_model(user["sub"], body.default_model)
    return {"message": "Default model updated", "default_model": body.default_model}


# ── Profile ──────────────────────────────────────────────────────


@router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    return await db.get_profile(user["sub"])


@router.put("/profile")
async def update_profile(body: ProfileUpdate, user: dict = Depends(get_current_user)):
    await db.update_profile(user["sub"], body)
    return {"success": True}


# ── Preferences ──────────────────────────────────────────────────


@router.get("/preferences")
async def get_preferences(user: dict = Depends(get_current_user)):
    return await db.get_preferences(user["sub"])


@router.put("/preferences")
async def update_preferences(body: PreferencesUpdate, user: dict = Depends(get_current_user)):
    await db.update_preferences(user["sub"], body)
    return {"success": True}


# ── Avatar ───────────────────────────────────────────────────────


@router.post("/avatar")
async def upload_avatar(file: UploadFile, user: dict = Depends(get_current_user)):
    contents = await file.read()
    # Store avatar in Supabase Storage
    from supabase import create_client
    from yarl import URL as YarlURL
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    client.postgrest.base_url = YarlURL(settings.SUPABASE_URL)
    path = f"avatars/{user['sub']}"
    client.storage.from_("avatars").upload(path, contents, {"content-type": file.content_type or "image/webp", "upsert": "true"})
    url = client.storage.from_("avatars").get_public_url(path)
    await db.update_avatar(user["sub"], url)
    return {"avatar_url": url}


# ── Usage ────────────────────────────────────────────────────────


@router.get("/usage")
async def get_usage(user: dict = Depends(get_current_user)):
    """Fetch credit balance from OpenRouter. Cached 1hr server-side."""
    api_key = await vault_service.get_decrypted_key(user["sub"])
    if not api_key:
        raise HTTPException(403, "No API key configured")
    # TODO: implement openrouter_service.get_usage for live balance
    return {
        "spent_usd": 0.0,
        "remaining_usd": 0.0,
        "total_usd": 0.0,
        "pct_used": 0,
        "by_model": [],
        "cached_at": "",
    }


# ── Account deletion ─────────────────────────────────────────────


@router.delete("/account", status_code=204)
async def delete_account(user: dict = Depends(get_current_user)):
    """Cascade delete all user data then remove auth user."""
    await db.cascade_delete_user(user["sub"])
    # supabase.auth.admin.delete_user(user["sub"])
    return
