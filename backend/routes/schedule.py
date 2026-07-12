# ── ROUTE | GET /my/schedule (PRIVATE) ──
# Returns the weekly timetable + period times. Curriculum is shared, but
# the endpoint is token-protected so only logged-in students can read it.
# Timetable rows come from the class_meetings table (admin-editable);
# period times stay constant in seed_data.

from fastapi import APIRouter, Depends

import auth
import seed_data
from database import get_db

router = APIRouter(prefix="/my/schedule")

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]


def build_schedule() -> dict:
    """{day: [meeting, ...]} from the DB, sorted by period. Includes ids
    so the admin UI can delete individual meetings."""
    conn = get_db()
    rows = conn.execute(
        "SELECT id, day, period, name, room, type FROM class_meetings ORDER BY period ASC"
    ).fetchall()
    conn.close()
    schedule = {d: [] for d in DAYS}
    for r in rows:
        if r["day"] in schedule:
            schedule[r["day"]].append(dict(r))
    return schedule


@router.get("")
def get_schedule(_user: dict = Depends(auth.get_current_user)):
    return {
        "periods": seed_data.PERIODS,
        "schedule": build_schedule(),
    }
