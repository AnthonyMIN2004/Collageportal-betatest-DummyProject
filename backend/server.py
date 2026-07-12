# ── COLLEGIATE PORTAL | SERVER.PY ──
# FastAPI entry point. Wires up CORS, initializes the database, and
# mounts every route module. Run with:  uvicorn server:app --reload

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routes import (
    admin,
    checklist,
    classes,
    events,
    login,
    reviews,
    schedule,
    tasks,
)

app = FastAPI(title="Kiritan Collegiate Portal API", version="1.0.0")

# ── CORS ──
# SECURITY: only allow the frontend origin.
_default_origins = "http://localhost,http://localhost:8080,http://127.0.0.1:5500"
origins = [o.strip() for o in os.environ.get("PORTAL_CORS", _default_origins).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup():
    init_db()
    # Loud reminder so nobody deploys with the dev secret by accident
    if os.environ.get("PORTAL_SECRET") is None:
        # plain ASCII on purpose — emoji crashes on Windows cp932 consoles
        print("WARNING: PORTAL_SECRET is not set, using the dev default. "
              "Set a real secret before exposing this server to the internet!")


@app.get("/health")
def health():
    return {"status": "ok"}


# Mount routers
app.include_router(login.router)        # POST /login                  (public)
app.include_router(reviews.router)      # /share/reviews               (public)
app.include_router(events.router)       # /share/events                (public read)
app.include_router(tasks.router)        # /my/tasks                    (private)
app.include_router(schedule.router)     # /my/schedule                 (private)
app.include_router(classes.router)      # /my/classes                  (private)
app.include_router(checklist.router)    # /my/checklist                (private)
app.include_router(admin.router)        # /admin/*                     (admin only)
