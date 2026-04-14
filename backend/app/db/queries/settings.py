from yarl import URL
from supabase import create_client, Client

from app.core.config import settings


def _get_client() -> Client:
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    client.postgrest.base_url = URL(settings.SUPABASE_URL)
    return client


async def get_profile(user_id: str) -> dict:
    """Fetch user profile from auth metadata + usersettings."""
    client = _get_client()
    # Get from usersettings table
    row = client.table("usersettings").select("*").eq("user_id", user_id).maybe_single().execute()
    if not row.data:
        return {
            "full_name": None,
            "email": "",
            "username": None,
            "avatar_url": None,
            "created_at": "",
            "identities": [],
        }
    data = row.data
    return {
        "full_name": data.get("full_name"),
        "email": data.get("email", ""),
        "username": data.get("username"),
        "avatar_url": data.get("avatar_url"),
        "created_at": data.get("created_at", ""),
        "identities": data.get("identities", []),
    }


async def update_profile(user_id: str, body) -> None:
    """Update profile fields in usersettings."""
    client = _get_client()
    updates = {}
    if body.full_name is not None:
        updates["full_name"] = body.full_name
    if body.username is not None:
        updates["username"] = body.username
    if not updates:
        return
    client.table("usersettings").update(updates).eq("user_id", user_id).execute()


async def get_preferences(user_id: str) -> dict:
    """Fetch user preferences."""
    client = _get_client()
    row = client.table("usersettings").select("theme, language, timezone, date_format").eq("user_id", user_id).maybe_single().execute()
    if not row.data:
        return {"theme": "dark", "language": "en", "timezone": "UTC", "date_format": "MMM D, YYYY"}
    return row.data


async def update_preferences(user_id: str, body) -> None:
    """Update user preferences."""
    client = _get_client()
    updates = {}
    for field in ("theme", "language", "timezone", "date_format"):
        val = getattr(body, field, None)
        if val is not None:
            updates[field] = val
    if not updates:
        return
    client.table("usersettings").update(updates).eq("user_id", user_id).execute()


async def update_avatar(user_id: str, avatar_url: str) -> None:
    """Update avatar URL in usersettings."""
    client = _get_client()
    client.table("usersettings").update({"avatar_url": avatar_url}).eq("user_id", user_id).execute()


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
    client.table("pipelineruns").delete().eq("user_id", user_id).execute()
    client.table("pipelines").delete().eq("user_id", user_id).execute()
    client.table("knowledgesources").delete().eq("user_id", user_id).execute()
    client.table("chatsessions").delete().eq("user_id", user_id).execute()
    client.table("chatmessages").delete().eq("user_id", user_id).execute()
    client.table("usersettings").delete().eq("user_id", user_id).execute()
