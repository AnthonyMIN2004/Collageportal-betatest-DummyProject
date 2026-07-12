# ── ROUTE | /admin/* (ADMIN ONLY) ──
# Every route here depends on get_current_admin: a student token gets
# 403, no/invalid token gets 401. Only an admin token passes.

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

import auth
from database import get_db

router = APIRouter(prefix="/admin", dependencies=[Depends(auth.get_current_admin)])


@router.get("/users")
def list_users():
    conn = get_db()
    rows = conn.execute("SELECT id, is_admin FROM users ORDER BY id ASC").fetchall()
    conn.close()
    return [{"id": r["id"], "is_admin": bool(r["is_admin"])} for r in rows]


@router.get("/stats")
def stats():
    conn = get_db()
    out = {}
    for table in ("users", "tasks", "reviews", "events", "exams", "checklist"):
        # table names are a fixed whitelist above — never user input
        out[table] = conn.execute(f"SELECT COUNT(*) AS n FROM {table}").fetchone()["n"]
    conn.close()
    return out


class ResetPasswordBody(BaseModel):
    new_password: str = Field(..., min_length=4, max_length=100)


@router.post("/users/{user_id}/password")
def reset_password(user_id: str, body: ResetPasswordBody):
    """Admin reset for a student who forgot their password.
    Passwords are bcrypt-hashed — nobody can read the old one, only replace it."""
    conn = get_db()
    row = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    conn.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (auth.hash_password(body.new_password), user_id),
    )
    conn.commit()
    conn.close()
    return {"ok": True}


@router.delete("/reviews/{review_id}")
def delete_review(review_id: int):
    conn = get_db()
    cur = conn.execute("DELETE FROM reviews WHERE id = ?", (review_id,))
    conn.commit()
    deleted = cur.rowcount
    conn.close()
    if not deleted:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"ok": True}
