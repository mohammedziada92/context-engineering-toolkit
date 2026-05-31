import os
import base64
import httpx
from supabase import create_client, Client
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import settings


def _get_vault_key() -> bytes:
    """Load the AES-256-GCM encryption key from env."""
    key_b64 = settings.VAULT_ENCRYPTION_KEY
    if not key_b64:
        raise RuntimeError("VAULT_ENCRYPTION_KEY not set — cannot encrypt/decrypt API keys")
    return base64.b64decode(key_b64)


def encrypt_api_key(plaintext: str) -> str:
    """Encrypt an API key using AES-256-GCM. Returns base64(nonce + ciphertext)."""
    aesgcm = AESGCM(_get_vault_key())
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ciphertext).decode()


def decrypt_api_key(encrypted: str) -> str:
    """Decrypt an AES-256-GCM encrypted API key."""
    aesgcm = AESGCM(_get_vault_key())
    data = base64.b64decode(encrypted)
    nonce, ciphertext = data[:12], data[12:]
    return aesgcm.decrypt(nonce, ciphertext, None).decode()


def _get_service_client() -> Client:
    """Create a Supabase client with the service role key (bypasses RLS)."""
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return client


async def validate_openrouter_key(api_key: str) -> dict:
    """Validate an OpenRouter API key and return credit info."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://openrouter.ai/api/v1/auth/key",
            headers={"Authorization": f"Bearer {api_key}"},
        )
    if response.status_code == 200:
        data = response.json().get("data", {})
        return {
            "valid": True,
            "credits_remaining": data.get("limit_remaining"),
            "plan": data.get("label", "pay-as-you-go"),
            "error": None,
        }
    return {"valid": False, "credits_remaining": None, "plan": None, "error": "Invalid API key"}


async def save_api_key(user_id: str, api_key: str, default_model: str) -> None:
    """Save or update the OpenRouter API key for a user (encrypted at rest)."""
    encrypted = encrypt_api_key(api_key)
    client = _get_service_client()
    client.table("user_settings").upsert(
        {
            "user_id": user_id,
            "openrouter_api_key": encrypted,
            "default_model": default_model,
        },
        on_conflict="user_id",
    ).execute()


async def get_decrypted_key(user_id: str) -> str | None:
    """Retrieve and decrypt the stored API key for a user (server-side only)."""
    client = _get_service_client()
    result = (
        client.table("user_settings")
        .select("openrouter_api_key")
        .eq("user_id", user_id)
        .execute()
    )
    if result.data:
        encrypted = result.data[0].get("openrouter_api_key")
        if not encrypted:
            return None
        try:
            return decrypt_api_key(encrypted)
        except Exception:
            # Key was stored before encryption was enabled — return as-is for migration
            return encrypted
    return None


async def get_settings(user_id: str) -> dict | None:
    """Get full settings row for a user."""
    client = _get_service_client()
    result = (
        client.table("user_settings")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )
    if result.data:
        row = result.data[0]
        # Mask the API key in the response
        encrypted = row.get("openrouter_api_key", "")
        if encrypted:
            row["openrouter_api_key"] = "sk-or-masked"
        return row
    return None


async def delete_key(user_id: str) -> None:
    """Remove the stored API key for a user."""
    client = _get_service_client()
    client.table("user_settings").update(
        {"openrouter_api_key": ""}
    ).eq("user_id", user_id).execute()


async def update_default_model(user_id: str, model: str) -> None:
    """Update the default model for a user."""
    client = _get_service_client()
    client.table("user_settings").update(
        {"default_model": model}
    ).eq("user_id", user_id).execute()
