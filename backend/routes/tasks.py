# ── ROUTE | /my/tasks (PRIVATE) ──
# Per-student quick tasks. Every query is scoped to the token's user_id
# so a student can only ever see or change their own tasks.

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

import auth
from database import get_db

router = APIRouter(prefix="/my/tasks")


class TaskBody(BaseModel):
    content: str


@router.get("")
def list_tasks(user: dict = Depends(auth.get_current_user)):
    conn = get_db()
    rows = conn.execute(
        "SELECT id, content, done FROM tasks WHERE user_id = ? ORDER BY id ASC",
        (user["sub"],),
    ).fetchall()
    conn.close()
    return [{"id": r["id"], "content": r["content"], "done": bool(r["done"])} for r in rows]


@router.post("")
def add_task(body: TaskBody, user: dict = Depends(auth.get_current_user)):
    text = body.content.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Task content is required")
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO tasks (user_id, content, done) VALUES (?, ?, 0)",
        (user["sub"], text),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"ok": True, "id": new_id}


@router.post("/{task_id}/toggle")
def toggle_task(task_id: int, user: dict = Depends(auth.get_current_user)):
    conn = get_db()
    cur = conn.execute(
        "UPDATE tasks SET done = 1 - done WHERE id = ? AND user_id = ?",
        (task_id, user["sub"]),
    )
    conn.commit()
    changed = cur.rowcount
    conn.close()
    if not changed:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"ok": True}


@router.delete("/{task_id}")
def delete_task(task_id: int, user: dict = Depends(auth.get_current_user)):
    conn = get_db()
    cur = conn.execute(
        "DELETE FROM tasks WHERE id = ? AND user_id = ?",
        (task_id, user["sub"]),
    )
    conn.commit()
    deleted = cur.rowcount
    conn.close()
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"ok": True}
