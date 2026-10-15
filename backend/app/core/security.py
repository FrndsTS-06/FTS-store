import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Set
import bcrypt
import jwt
from app.core.config import settings

# In-memory revocation set for logged-out token JTIs
_REVOKED_TOKENS: Set[str] = set()

def hash_password(password: str) -> str:
    """
    Hash a plaintext password using bcrypt with a randomized salt.
    Never stores or returns plaintext passwords.
    """
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Securely verify that a plaintext password matches the bcrypt hash.
    Constant-time comparison built into bcrypt to prevent timing attacks.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def create_access_token(
    subject: str,
    role: str,
    email: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Generate an HMAC-SHA256 signed JSON Web Token with claims:
    - sub: user UUID
    - role: role string (e.g. 'customer', 'admin')
    - email: user email
    - iat: issued-at timestamp
    - exp: expiration timestamp
    - jti: unique token UUID for revocation tracking
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: Dict[str, Any] = {
        "sub": subject,
        "role": role,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": str(uuid.uuid4())
    }

    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT access token:
    - Verifies HMAC-SHA256 signature against settings.SECRET_KEY
    - Verifies token has not expired
    - Verifies token has not been revoked
    Raises jwt.PyJWTError subclasses upon failure.
    """
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    
    jti = payload.get("jti")
    if jti and jti in _REVOKED_TOKENS:
        raise jwt.InvalidTokenError("Token has been revoked.")

    return payload

def revoke_token(token: str) -> bool:
    """
    Add a token's JTI to the revoked set.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"],
            options={"verify_exp": False}
        )
        jti = payload.get("jti")
        if jti:
            _REVOKED_TOKENS.add(jti)
            return True
    except Exception:
        pass
    return False

def is_token_revoked(jti: str) -> bool:
    return jti in _REVOKED_TOKENS
