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


def _delete_row(table: str, row_id: int, label: str):
    """Shared delete-by-id helper. `table` is always one of our own
    string constants below, never user input."""
    conn = get_db()
    cur = conn.execute(f"DELETE FROM {table} WHERE id = ?", (row_id,))
    conn.commit()
    deleted = cur.rowcount
    conn.close()
    if not deleted:
        raise HTTPException(status_code=404, detail=f"{label} not found")
    return {"ok": True}


# ── Exams ──
class ExamBody(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)   # class name
    date: str = Field(..., max_length=10)                  # ISO "YYYY-MM-DD"
    room: str = Field("TBD", max_length=50)
    topics: str = Field("", max_length=500)


@router.post("/exams")
def create_exam(body: ExamBody):
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO exams (name, date, room, class, topics) VALUES (?, ?, ?, ?, ?)",
        (body.name, body.date, body.room, body.name, body.topics),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"ok": True, "id": new_id}


@router.delete("/exams/{exam_id}")
def delete_exam(exam_id: int):
    return _delete_row("exams", exam_id, "Exam")


# ── Timetable meetings ──
class MeetingBody(BaseModel):
    day: str = Field(..., pattern="^(Mon|Tue|Wed|Thu|Fri)$")
    period: int = Field(..., ge=1, le=5)
    name: str = Field(..., min_length=1, max_length=100)
    room: str = Field("TBD", max_length=50)
    type: str = Field("general", pattern="^(general|code|sport|seminar)$")


@router.post("/meetings")
def create_meeting(body: MeetingBody):
    conn = get_db()
    # One class per day+period slot — replacing is what admin means anyway
    existing = conn.execute(
        "SELECT id FROM class_meetings WHERE day = ? AND period = ?",
        (body.day, body.period),
    ).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=409, detail="That day/period slot is already taken — delete it first")
    cur = conn.execute(
        "INSERT INTO class_meetings (day, period, name, room, type) VALUES (?, ?, ?, ?, ?)",
        (body.day, body.period, body.name, body.room, body.type),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"ok": True, "id": new_id}


@router.delete("/meetings/{meeting_id}")
def delete_meeting(meeting_id: int):
    return _delete_row("class_meetings", meeting_id, "Meeting")


# ── Class info (syllabus text + icon) ──
class ClassInfoBody(BaseModel):
    icon: str = Field("📚", max_length=10)
    desc: str = Field("", max_length=1000)


@router.put("/classes/{class_name}")
def update_class_info(class_name: str, body: ClassInfoBody):
    conn = get_db()
    # Upsert: class may exist in the timetable without an info row yet
    conn.execute(
        "INSERT INTO class_info (name, icon, desc) VALUES (?, ?, ?) "
        "ON CONFLICT(name) DO UPDATE SET icon = excluded.icon, desc = excluded.desc",
        (class_name, body.icon, body.desc),
    )
    conn.commit()
    conn.close()
    return {"ok": True}


# ── Bring items ──
class BringBody(BaseModel):
    class_name: str = Field(..., alias="class", min_length=1, max_length=100)
    icon: str = Field("📓", max_length=10)
    item: str = Field(..., min_length=1, max_length=100)

    class Config:
        populate_by_name = True


@router.post("/bring")
def create_bring_item(body: BringBody):
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO bring_items (class, icon, item) VALUES (?, ?, ?)",
        (body.class_name, body.icon, body.item),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"ok": True, "id": new_id}


@router.delete("/bring/{item_id}")
def delete_bring_item(item_id: int):
    return _delete_row("bring_items", item_id, "Bring item")


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
