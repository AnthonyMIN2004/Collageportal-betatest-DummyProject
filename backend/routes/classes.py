# ── ROUTE | GET /my/classes (PRIVATE) ──
# Returns enrolled classes with syllabus info, room, type, bring-items,
# and the matching exam (joined from the exams table by class name).

from fastapi import APIRouter, Depends

import auth
import seed_data
from database import get_db

router = APIRouter(prefix="/my/classes")


@router.get("")
def get_classes(_user: dict = Depends(auth.get_current_user)):
    conn = get_db()
    exam_rows = conn.execute(
        "SELECT name, date, room, topics FROM exams"
    ).fetchall()
    conn.close()
    exams_by_class = {r["name"]: dict(r) for r in exam_rows}

    result = []
    for name in seed_data.ALL_CLASSES:
        meetings = [
            {**c, "day": day}
            for day, classes in seed_data.SCHEDULE.items()
            for c in classes
            if c["name"] == name
        ]
        info = seed_data.CLASS_INFO.get(name, {"icon": "📚", "desc": ""})
        result.append({
            "name": name,
            "icon": info["icon"],
            "desc": info["desc"],
            "type": meetings[0]["type"] if meetings else "general",
            "room": meetings[0]["room"] if meetings else "TBD",
            "meetings": meetings,
            "bring": seed_data.CLASS_BRING_ITEMS.get(name, []),
            "exam": exams_by_class.get(name),
        })
    return result
