# ── ROUTE | /share/snippets (LOGIN required) ──
# Shared code snippets per class. Any logged-in student can read and
# post; deleting is limited to the snippet's author or an admin.

import time

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

import auth
from database import get_db

router = APIRouter(prefix="/share/snippets")


class SnippetBody(BaseModel):
    # Field limits double as input validation (see reviews.py)
    class_name: str = Field(..., alias="class", min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=200)
    code: str = Field(..., min_length=1, max_length=20000)

    class Config:
        populate_by_name = True


@router.get("")
def list_snippets(
    class_name: str = Query(..., alias="class", max_length=100),
    _user: dict = Depends(auth.get_current_user),
):
    conn = get_db()
    rows = conn.execute(
        "SELECT id, class, title, code, author, ts FROM snippets WHERE class = ? ORDER BY ts DESC",
        (class_name,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("")
def create_snippet(body: SnippetBody, user: dict = Depends(auth.get_current_user)):
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO snippets (class, title, code, author, ts) VALUES (?, ?, ?, ?, ?)",
        (body.class_name, body.title.strip(), body.code, user["sub"], int(time.time() * 1000)),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"ok": True, "id": new_id}


@router.delete("/{snippet_id}")
def delete_snippet(snippet_id: int, user: dict = Depends(auth.get_current_user)):
    conn = get_db()
    row = conn.execute("SELECT author FROM snippets WHERE id = ?", (snippet_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Snippet not found")
    # Only the author or an admin may delete
    if row["author"] != user["sub"] and not user["admin"]:
        conn.close()
        raise HTTPException(status_code=403, detail="You can only delete your own snippets")
    conn.execute("DELETE FROM snippets WHERE id = ?", (snippet_id,))
    conn.commit()
    conn.close()
    return {"ok": True}
