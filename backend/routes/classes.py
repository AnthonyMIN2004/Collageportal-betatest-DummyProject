# ── ROUTE | GET /my/classes (PRIVATE) ──
# Returns enrolled classes with syllabus info, room, type, bring-items,
# and the matching exam (joined from the exams table by class name).
# Everything comes from the DB now, so admin edits show up immediately.

from fastapi import APIRouter, Depends

import auth
from database import get_db
from routes.schedule import build_schedule

router = APIRouter(prefix="/my/classes")


@router.get("")
def get_classes(_user: dict = Depends(auth.get_current_user)):
    conn = get_db()
    exam_rows = conn.execute(
        "SELECT id, name, date, room, topics FROM exams"
    ).fetchall()
    info_rows = conn.execute("SELECT name, icon, desc FROM class_info").fetchall()
    bring_rows = conn.execute("SELECT id, class, icon, item FROM bring_items").fetchall()
    conn.close()

    exams_by_class = {r["name"]: dict(r) for r in exam_rows}
    info_by_class = {r["name"]: dict(r) for r in info_rows}
    bring_by_class: dict[str, list] = {}
    for r in bring_rows:
        bring_by_class.setdefault(r["class"], []).append(
            {"id": r["id"], "icon": r["icon"], "item": r["item"]}
        )

    # Class list = unique names in timetable order
    schedule = build_schedule()
    all_names = list(dict.fromkeys(
        m["name"] for day in schedule.values() for m in day
    ))

    result = []
    for name in all_names:
        meetings = [
            {**m, "day": day}
            for day, day_meetings in schedule.items()
            for m in day_meetings
            if m["name"] == name
        ]
        info = info_by_class.get(name, {"icon": "📚", "desc": ""})
        result.append({
            "name": name,
            "icon": info["icon"],
            "desc": info["desc"],
            "type": meetings[0]["type"] if meetings else "general",
            "room": meetings[0]["room"] if meetings else "TBD",
            "meetings": meetings,
            "bring": bring_by_class.get(name, []),
            "exam": exams_by_class.get(name),
        })
    return result
