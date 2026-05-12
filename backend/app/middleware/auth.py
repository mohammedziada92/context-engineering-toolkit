from fastapi import Depends, Query, Request

from app.core.security import verify_jwt_token


async def get_current_user(request: Request) -> dict:
    """Extract authenticated user from JWT in Authorization header."""
    from fastapi.security import HTTPBearer

    bearer = HTTPBearer()
    try:
        creds = await bearer(request)
        token = creds.credentials
    except Exception:
        raise _unauthorized()
    return verify_jwt_token(token)


async def get_current_user_sse(
    request: Request,
    authorization: str | None = Query(None, alias="authorization"),
) -> dict:
    """Auth for SSE endpoints — accepts JWT from query param or header."""
    token = None

    # Try header first
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    # Fall back to query param (EventSource can't set headers)
    elif authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:]
        else:
            token = authorization

    if not token:
        raise _unauthorized()
    return verify_jwt_token(token)


from fastapi import HTTPException


def _unauthorized():
    return HTTPException(status_code=401, detail="Invalid token")
