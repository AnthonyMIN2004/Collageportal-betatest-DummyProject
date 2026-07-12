# ── ROUTE | /share/events (PUBLIC read, ADMIN delete) ──
# Campus events feed. Listing is public; creating/deleting is restricted
# to admins so students can't spam the shared calendar.

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

import auth
from database import get_db

router = APIRouter(prefix="/share/events")


class EventBody(BaseModel):
    name: str
    date: str
    detail: str | None = None


@router.get("")
def list_events():
    conn = get_db()
    rows = conn.execute(
        "SELECT id, name, date, detail FROM events ORDER BY date ASC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("")
def create_event(body: EventBody, _admin: dict = Depends(auth.get_current_admin)):
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO events (name, date, detail) VALUES (?, ?, ?)",
        (body.name, body.date, body.detail),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"ok": True, "id": new_id}


@router.delete("/{event_id}")
def delete_event(event_id: int, _admin: dict = Depends(auth.get_current_admin)):
    conn = get_db()
    cur = conn.execute("DELETE FROM events WHERE id = ?", (event_id,))
    conn.commit()
    deleted = cur.rowcount
    conn.close()
    if not deleted:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"ok": True}
