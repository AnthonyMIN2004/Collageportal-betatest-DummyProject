# ── ROUTE | GET /my/schedule (PRIVATE) ──
# Returns the weekly timetable + period times. Curriculum is shared, but
# the endpoint is token-protected so only logged-in students can read it.

from fastapi import APIRouter, Depends

import auth
import seed_data

router = APIRouter(prefix="/my/schedule")


@router.get("")
def get_schedule(_user: dict = Depends(auth.get_current_user)):
    return {
        "periods": seed_data.PERIODS,
        "schedule": seed_data.SCHEDULE,
    }
