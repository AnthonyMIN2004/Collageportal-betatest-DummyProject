# ── ROUTE | /share/live/{class} (LOGIN required) ──
# Classroom live code stream. One session per class at a time.
# Frontend polls GET every few seconds while the Live tab is open —
# no websockets needed at this scale (ponytail: polling; move to
# websockets if a class ever outgrows it).

import time

from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel, Field

import auth
from database import get_db

router = APIRouter(prefix="/share/live")

# Class names come from the URL — cap the length like every other input
ClassName = Path(..., min_length=1, max_length=100)


class LivePostBody(BaseModel):
    code: str = Field(..., min_length=1, max_length=20000)


@router.get("/{class_name}")
def get_live(class_name: str = ClassName, _user: dict = Depends(auth.get_current_user)):
    conn = get_db()
    session = conn.execute(
        "SELECT started_by, ts FROM live_sessions WHERE class = ?", (class_name,)
    ).fetchone()
    if not session:
        conn.close()
        return {"active": False, "posts": []}
    posts = conn.execute(
        "SELECT id, sid, code, ts FROM live_posts WHERE class = ? ORDER BY ts ASC",
        (class_name,),
    ).fetchall()
    conn.close()
    return {
        "active": True,
        "started_by": session["started_by"],
        "posts": [dict(p) for p in posts],
    }


@router.post("/{class_name}/start")
def start_live(class_name: str = ClassName, user: dict = Depends(auth.get_current_user)):
    conn = get_db()
    # INSERT OR IGNORE: if two people press start at once, first one wins
    conn.execute(
        "INSERT OR IGNORE INTO live_sessions (class, started_by, ts) VALUES (?, ?, ?)",
        (class_name, user["sub"], int(time.time() * 1000)),
    )
    conn.commit()
    conn.close()
    return {"ok": True}


@router.post("/{class_name}/stop")
def stop_live(class_name: str = ClassName, user: dict = Depends(auth.get_current_user)):
    conn = get_db()
    session = conn.execute(
        "SELECT started_by FROM live_sessions WHERE class = ?", (class_name,)
    ).fetchone()
    if not session:
        conn.close()
        raise HTTPException(status_code=404, detail="No live session for this class")
    # Only whoever started it (or an admin) can shut it down
    if session["started_by"] != user["sub"] and not user["admin"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Only the session starter or an admin can stop it")
    conn.execute("DELETE FROM live_sessions WHERE class = ?", (class_name,))
    conn.execute("DELETE FROM live_posts WHERE class = ?", (class_name,))
    conn.commit()
    conn.close()
    return {"ok": True}


@router.post("/{class_name}/post")
def post_live(
    body: LivePostBody,
    class_name: str = ClassName,
    user: dict = Depends(auth.get_current_user),
):
    conn = get_db()
    session = conn.execute(
        "SELECT class FROM live_sessions WHERE class = ?", (class_name,)
    ).fetchone()
    if not session:
        conn.close()
        raise HTTPException(status_code=404, detail="No live session for this class")
    conn.execute(
        "INSERT INTO live_posts (class, sid, code, ts) VALUES (?, ?, ?, ?)",
        (class_name, user["sub"], body.code, int(time.time() * 1000)),
    )
    conn.commit()
    conn.close()
    return {"ok": True}
