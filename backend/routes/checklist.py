# ── ROUTE | /my/checklist (PRIVATE) ──
# Per-student "items to bring" daily checklist. State is keyed by day
# (e.g. "Mon") and scoped to the token's user_id.

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

import auth
from database import get_db

router = APIRouter(prefix="/my/checklist")

VALID_DAYS = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"}


class CheckBody(BaseModel):
    item: str = Field(..., max_length=100)
    day: str = Field(..., max_length=3)
    checked: bool


@router.get("")
def get_checklist(day: str | None = None, user: dict = Depends(auth.get_current_user)):
    conn = get_db()
    if day:
        rows = conn.execute(
            "SELECT item, day, checked FROM checklist WHERE user_id = ? AND day = ?",
            (user["sub"], day),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT item, day, checked FROM checklist WHERE user_id = ?",
            (user["sub"],),
        ).fetchall()
    conn.close()
    return [{"item": r["item"], "day": r["day"], "checked": bool(r["checked"])} for r in rows]


@router.post("")
def set_checklist(body: CheckBody, user: dict = Depends(auth.get_current_user)):
    if body.day not in VALID_DAYS:
        raise HTTPException(status_code=400, detail="day must be Mon..Sun")
    conn = get_db()
    # Upsert: one row per (user, item, day)
    existing = conn.execute(
        "SELECT id FROM checklist WHERE user_id = ? AND item = ? AND day = ?",
        (user["sub"], body.item, body.day),
    ).fetchone()
    if existing:
        conn.execute(
            "UPDATE checklist SET checked = ? WHERE id = ?",
            (1 if body.checked else 0, existing["id"]),
        )
    else:
        conn.execute(
            "INSERT INTO checklist (user_id, item, day, checked) VALUES (?, ?, ?, ?)",
            (user["sub"], body.item, body.day, 1 if body.checked else 0),
        )
    conn.commit()
    conn.close()
    return {"ok": True}
