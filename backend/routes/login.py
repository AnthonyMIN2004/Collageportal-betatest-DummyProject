# ── ROUTE | POST /login ──
# Authenticates a student/admin and returns a JWT. Includes simple
# in-memory rate limiting to slow brute-force attempts.

import time

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

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
