from supabase import create_client, Client

from app.core.config import settings


def _get_client() -> Client:
    """Create a Supabase client with the service role key (bypasses RLS)."""
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return client


# ── Chat sessions ────────────────────────────────────────────────


async def create_session(
    user_id: str,
    name: str | None = None,
    mode: str = "direct",
    pipeline_id: str | None = None,
    config: dict | None = None,
) -> dict:
    """Create a new chat session. Returns the created row."""
    client = _get_client()
    insert: dict = {
        "user_id": user_id,
        "name": name or "New Chat",
        "mode": mode,
        "config": config or {},
    }
    if pipeline_id:
        insert["pipeline_id"] = pipeline_id
    result = client.table("chat_sessions").insert(insert).execute()
    return result.data[0]


async def get_sessions_by_user(user_id: str) -> list[dict]:
    """Return all chat sessions for a user, most recently updated first."""
    client = _get_client()
    result = (
        client.table("chat_sessions")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute()
    )
    return result.data


async def get_session_by_id(session_id: str, user_id: str) -> dict | None:
    """Return a single chat session if owned by user."""
    client = _get_client()
    result = (
        client.table("chat_sessions")
        .select("*")
        .eq("id", session_id)
        .eq("user_id", user_id)
        .execute()
    )
    if result.data:
        return result.data[0]
    return None


async def get_session_with_messages(session_id: str, user_id: str) -> dict | None:
    """Return a session with its messages included."""
    client = _get_client()
    # Fetch session
    session = await get_session_by_id(session_id, user_id)
    if not session:
        return None
    # Fetch messages
    msgs = (
        client.table("chat_messages")
        .select("*")
        .eq("session_id", session_id)
        .eq("user_id", user_id)
        .order("created_at")
        .execute()
    )
    session["messages"] = msgs.data
    return session


async def update_session(
    session_id: str,
    user_id: str,
    updates: dict,
) -> dict | None:
    """Update session fields. Returns updated row or None."""
    client = _get_client()
    result = (
        client.table("chat_sessions")
        .update(updates)
        .eq("id", session_id)
        .eq("user_id", user_id)
        .execute()
    )
    if result.data:
        return result.data[0]
    return None


async def delete_session(session_id: str, user_id: str) -> bool:
    """Delete a session and its messages. Returns True if deleted."""
    client = _get_client()
    # Delete messages first (FK constraint)
    client.table("chat_messages").delete().eq("session_id", session_id).eq("user_id", user_id).execute()
    result = client.table("chat_sessions").delete().eq("id", session_id).eq("user_id", user_id).execute()
    return len(result.data) > 0


async def delete_all_sessions(user_id: str) -> int:
    """Delete all sessions and messages for a user. Returns count deleted."""
    client = _get_client()
    # Delete all messages for user's sessions
    sessions = (
        client.table("chat_sessions")
        .select("id")
        .eq("user_id", user_id)
        .execute()
    )
    if sessions.data:
        ids = [s["id"] for s in sessions.data]
        client.table("chat_messages").delete().in_("session_id", ids).execute()
    # Delete all sessions
    result = client.table("chat_sessions").delete().eq("user_id", user_id).execute()
    return len(result.data)


# ── Chat messages ────────────────────────────────────────────────


async def create_message(
    session_id: str,
    user_id: str,
    role: str,
    content: str,
    retrieved_chunks: list[dict] | None = None,
) -> dict:
    """Append a message to a chat session. Returns the created row."""
    client = _get_client()
    insert: dict = {
        "session_id": session_id,
        "user_id": user_id,
        "role": role,
        "content": content,
    }
    if retrieved_chunks:
        insert["retrieved_chunks"] = retrieved_chunks
    result = client.table("chat_messages").insert(insert).execute()
    return result.data[0]


async def get_messages_by_session(session_id: str, user_id: str) -> list[dict]:
    """Return all messages for a session, oldest first."""
    client = _get_client()
    result = (
        client.table("chat_messages")
        .select("*")
        .eq("session_id", session_id)
        .eq("user_id", user_id)
        .order("created_at")
        .execute()
    )
    return result.data
