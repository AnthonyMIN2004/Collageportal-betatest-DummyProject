# ── ROUTE | POST /login + POST /my/password ──
# Authenticates a student/admin and returns a JWT. Includes simple
# in-memory rate limiting to slow brute-force attempts.
# Also lets a logged-in user (student or admin) change their own password.

import time

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

import auth
from database import get_db

router = APIRouter()

# Rate limit: max attempts per IP within the window.
MAX_ATTEMPTS = 5
WINDOW_SECONDS = 300
_attempts: dict[str, list[float]] = {}


def _rate_limited(ip: str) -> bool:
    now = time.time()
    hits = [t for t in _attempts.get(ip, []) if now - t < WINDOW_SECONDS]
    _attempts[ip] = hits
    return len(hits) >= MAX_ATTEMPTS


def _record_attempt(ip: str) -> None:
    _attempts.setdefault(ip, []).append(time.time())


class LoginBody(BaseModel):
    student_id: str
    password: str


@router.post("/login")
def login(body: LoginBody, request: Request):
    ip = request.client.host if request.client else "unknown"
    if _rate_limited(ip):
        raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")

    conn = get_db()
    row = conn.execute(
        "SELECT id, password_hash, is_admin FROM users WHERE id = ?",
        (body.student_id.strip(),),
    ).fetchone()
    conn.close()

    if not row or not auth.verify_password(body.password, row["password_hash"]):
        _record_attempt(ip)
        raise HTTPException(status_code=401, detail="学籍番号またはパスワードが正しくありません")

    token = auth.create_token(row["id"], bool(row["is_admin"]))
    return {
        "token": token,
        "student_id": row["id"],
        "is_admin": bool(row["is_admin"]),
    }


class PasswordBody(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=4, max_length=100)


@router.post("/my/password")
def change_password(body: PasswordBody, user: dict = Depends(auth.get_current_user)):
    """Change your own password. Requires the current one — a stolen
    token alone isn't enough to lock someone out of their account."""
    conn = get_db()
    row = conn.execute(
        "SELECT password_hash FROM users WHERE id = ?", (user["sub"],)
    ).fetchone()
    if not row or not auth.verify_password(body.old_password, row["password_hash"]):
        conn.close()
        raise HTTPException(status_code=401, detail="現在のパスワードが正しくありません")
    conn.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (auth.hash_password(body.new_password), user["sub"]),
    )
    conn.commit()
    conn.close()
    return {"ok": True}
