# ── ROUTE | /share/reviews (PUBLIC) ──
# Anonymous course reviews. Anyone can read; anyone can post.
# Reviews carry no author, matching the frontend's anonymity promise.

import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from database import get_db

router = APIRouter(prefix="/share/reviews")


class ReviewBody(BaseModel):
    # Field limits double as input validation: anything oversized or
    # out of range is rejected by FastAPI with a 422 before we touch the DB.
    class_name: str = Field(..., alias="class", max_length=100)
    stars: int = Field(0, ge=0, le=5)
    difficulty: str | None = Field(None, max_length=20)
    body: str = Field(..., max_length=2000)

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
        # 400, not a 200-with-error — clients rely on the status code
        raise HTTPException(status_code=400, detail="Review body is required")
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO reviews (class, stars, difficulty, body, ts) VALUES (?, ?, ?, ?, ?)",
        (body.class_name, body.stars, body.difficulty, text, int(time.time() * 1000)),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"ok": True, "id": new_id}
