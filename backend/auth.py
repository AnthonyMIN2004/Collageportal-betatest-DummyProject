# ── COLLEGIATE PORTAL | AUTH.PY ──
# Password hashing (bcrypt) + JWT token issue/verify + FastAPI guards.

import os
import datetime

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException, status

# SECRET_KEY signs the JWTs. MUST be set via env in production —
# anyone who knows it can forge tokens.
SECRET_KEY = os.environ.get("PORTAL_SECRET", "dev-secret-change-me-before-deploy")
ALGORITHM = "HS256"
TOKEN_TTL_HOURS = 24


# ── Password hashing ──
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# ── JWT tokens ──
def create_token(student_id: str, is_admin: bool) -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": student_id,
        "admin": bool(is_admin),
        "iat": now,
        "exp": now + datetime.timedelta(hours=TOKEN_TTL_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


# ── FastAPI dependencies (route guards) ──
def get_current_user(authorization: str = Header(None)) -> dict:
    """Require a valid Bearer token. Returns {sub, admin}."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header",
        )
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired — please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"sub": payload["sub"], "admin": payload.get("admin", False)}


def get_current_admin(user: dict = Depends(get_current_user)) -> dict:
    """Require an admin token."""
    if not user.get("admin"):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user
