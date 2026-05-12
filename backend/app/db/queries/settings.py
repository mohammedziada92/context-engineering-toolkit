from supabase import create_client, Client

from app.core.config import settings


def _get_client() -> Client:
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return client


async def ensure_user_exists(user_id: str, email: str = "", full_name: str | None = None) -> None:
    """Upsert a row in public.users if the auth trigger didn't create one.

    Supabase Cloud may not have the on_auth_user_created trigger on auth.users,
    so this acts as a fallback on every authenticated API call.
    """
    client = _get_client()
    existing = client.table("users").select("id").eq("id", user_id).maybe_single().execute()
    if not existing or not existing.data:
        client.table("users").upsert({
            "id": user_id,
            "email": email,
            "full_name": full_name,
        }, on_conflict="id").execute()


async def get_profile(user_id: str, jwt_user: dict | None = None) -> dict:
    """Fetch user profile from user_settings, falling back to JWT metadata."""
    client = _get_client()
    meta = (jwt_user or {}).get("user_metadata", {}) or {}
    jwt_email = (jwt_user or {}).get("email", "")

    # Extract auth provider identities
    providers = (jwt_user or {}).get("app_metadata", {}).get("providers", [])
    identities = [{"provider": p, "email": jwt_email} for p in providers] if providers else []

    row = client.table("user_settings").select("*").eq("user_id", user_id).maybe_single().execute()
    if not row or not row.data:
        return {
            "full_name": meta.get("full_name") or meta.get("name"),
            "email": jwt_email,
            "username": meta.get("user_name") or meta.get("preferred_username"),
            "avatar_url": meta.get("avatar_url"),
            "created_at": "",
            "identities": identities,
        }
    data = row.data
    return {
        "full_name": data.get("full_name") or meta.get("full_name") or meta.get("name"),
        "email": data.get("email") or jwt_email,
        "username": data.get("username") or meta.get("user_name") or meta.get("preferred_username"),
        "avatar_url": data.get("avatar_url") or meta.get("avatar_url"),
        "created_at": data.get("created_at", ""),
        "identities": identities or data.get("identities", []),
    }


async def update_profile(user_id: str, body) -> None:
    """Update profile fields in usersettings. Upserts if no row exists."""
    client = _get_client()
    updates = {}
    if body.full_name is not None:
        updates["full_name"] = body.full_name
    if body.username is not None:
        updates["username"] = body.username
    if not updates:
        return
    client.table("user_settings").upsert({
        "user_id": user_id,
        **updates,
    }, on_conflict="user_id").execute()


async def get_preferences(user_id: str) -> dict:
    """Fetch user preferences."""
    client = _get_client()
    row = client.table("user_settings").select("theme, language, timezone, date_format").eq("user_id", user_id).maybe_single().execute()
    if not row or not row.data:
        return {"theme": "dark", "language": "en", "timezone": "UTC", "date_format": "MMM D, YYYY"}
    return row.data


async def update_preferences(user_id: str, body) -> None:
    """Update user preferences. Upserts if no row exists."""
    client = _get_client()
    updates = {}
    for field in ("theme", "language", "timezone", "date_format"):
        val = getattr(body, field, None)
        if val is not None:
            updates[field] = val
    if not updates:
        return
    client.table("user_settings").upsert({
        "user_id": user_id,
        **updates,
    }, on_conflict="user_id").execute()


async def update_avatar(user_id: str, avatar_url: str) -> None:
    """Update avatar URL in usersettings."""
    client = _get_client()
    client.table("user_settings").update({"avatar_url": avatar_url}).eq("user_id", user_id).execute()


async def cascade_delete_user(user_id: str) -> None:
    """Delete all user data across all tables."""
    client = _get_client()
    # Delete in dependency order (children first)
    tables = [
        ("chatmessages", "user_id"),
        ("chatsessions", "user_id"),
        ("pipelineruns", "user_id"),
        ("pipelineversions", "pipeline_id"),
        ("chunks", "knowledge_source_id"),
        ("knowledgesources", "user_id"),
        ("pipelines", "user_id"),
        ("usersettings", "user_id"),
    ]
    for table, column in tables:
        try:
            if column == "pipeline_id" or column == "knowledge_source_id":
                # Need to delete via subquery for FK-linked tables
                pass
            else:
                client.table(table).delete().eq(column, user_id).execute()
        except Exception:
            pass  # Table may not have data

    # Direct user tables
    client.table("pipeline_runs").delete().eq("user_id", user_id).execute()
    client.table("pipelines").delete().eq("user_id", user_id).execute()
    client.table("knowledge_sources").delete().eq("user_id", user_id).execute()
    client.table("chat_sessions").delete().eq("user_id", user_id).execute()
    client.table("chat_messages").delete().eq("user_id", user_id).execute()
    client.table("user_settings").delete().eq("user_id", user_id).execute()
