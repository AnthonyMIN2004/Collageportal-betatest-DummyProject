# ── ROUTE | /share/reviews (PUBLIC) ──
# Anonymous course reviews. Anyone can read; anyone can post.
# Reviews carry no author, matching the frontend's anonymity promise.

import time

from fastapi import APIRouter
from pydantic import BaseModel, Field

from database import get_db

router = APIRouter(prefix="/share/reviews")


class ReviewBody(BaseModel):
    class_name: str = Field(..., alias="class")
    stars: int = 0
    difficulty: str | None = None
    body: str

    class Config:
        populate_by_name = True


@router.get("")
def list_reviews():
    conn = get_db()
    rows = conn.execute(
        "SELECT id, class, stars, difficulty, body, ts FROM reviews ORDER BY ts DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("")
def create_review(body: ReviewBody):
    text = body.body.strip()
    if not text:
        return {"ok": False, "error": "Review body is required"}
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO reviews (class, stars, difficulty, body, ts) VALUES (?, ?, ?, ?, ?)",
        (body.class_name, body.stars, body.difficulty, text, int(time.time() * 1000)),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"ok": True, "id": new_id}
