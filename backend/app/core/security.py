import time

import httpx
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.core.config import settings

security = HTTPBearer()

# --- JWKS cache for Supabase Cloud (ES256) ---

_jwks_cache: dict | None = None
_jwks_fetched_at: float = 0.0
_JWKS_TTL = 3600  # 1 hour


def _get_jwks() -> dict:
    global _jwks_cache, _jwks_fetched_at
    if _jwks_cache and (time.monotonic() - _jwks_fetched_at) < _JWKS_TTL:
        return _jwks_cache
    url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    resp = httpx.get(url, timeout=10)
    resp.raise_for_status()
    _jwks_cache = resp.json()
    _jwks_fetched_at = time.monotonic()
    return _jwks_cache


def verify_jwt_token(token: str) -> dict:
    """Decode and validate a Supabase JWT from a raw token string."""
    # Attempt 1: JWKS (Supabase Cloud — ES256)
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if kid:
            jwks = _get_jwks()
            for key in jwks.get("keys", []):
                if key.get("kid") == kid:
                    return jwt.decode(
                        token,
                        key,
                        algorithms=[key.get("alg", "ES256")],
                        audience="authenticated",
                    )
    except Exception:
        pass

    # Attempt 2: HS256 with shared secret (local Supabase)
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def verify_jwt(
    token: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """FastAPI dependency — extracts token from Authorization header."""
    return verify_jwt_token(token.credentials)
