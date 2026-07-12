# Kiritan Collegiate Portal — Backend API

FastAPI + SQLite backend for the student portal. Replaces the hardcoded
`js/data.js` and `localStorage` with a real, shared database.

## Run locally

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# Linux/Pi: source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

Open http://localhost:8000/docs for the interactive API explorer.
The SQLite file `portal.db` is created and seeded automatically on first run.

## Seeded accounts

| Account        | ID      | Password   |
|----------------|---------|------------|
| Students (×10) | `25501`–`25510` | same as the ID (e.g. `25501`) |
| Admin          | `admin` | `admin123` |

⚠️ **Change these before going live.** Set real secrets via env vars:

| Env var            | Purpose                                  | Default |
|--------------------|------------------------------------------|---------|
| `PORTAL_SECRET`    | JWT signing key (forge-proof your tokens)| dev key |
| `PORTAL_ADMIN_ID`  | Admin login id                           | `admin` |
| `PORTAL_ADMIN_PW`  | Admin password (used on first seed only) | `admin123` |
| `PORTAL_CORS`      | Comma-separated allowed frontend origins | localhost |
| `PORTAL_DB`        | Path to the SQLite file                  | `./portal.db` |

(Admin id/pw only take effect when the DB is first created. Delete
`portal.db` to re-seed.)

## Endpoints

| Method | Path                      | Access  |
|--------|---------------------------|---------|
| POST   | `/login`                  | public  |
| GET/POST | `/share/reviews`        | public  |
| GET    | `/share/events`           | public  |
| POST/DELETE | `/share/events`      | admin   |
| GET/POST | `/my/tasks`             | student |
| POST   | `/my/tasks/{id}/toggle`   | student |
| DELETE | `/my/tasks/{id}`          | student |
| GET    | `/my/schedule`            | student |
| GET    | `/my/classes`             | student |
| GET/POST | `/my/checklist`         | student |
| GET    | `/admin/users`, `/admin/stats` | admin |
| DELETE | `/admin/reviews/{id}`     | admin   |

Send the token from `/login` as `Authorization: Bearer <token>` on every
private/admin request.

## Security notes (from the plan)

- ✅ Parameterized SQL everywhere (no injection)
- ✅ bcrypt password hashing (no plaintext)
- ✅ JWT tokens, 24h expiry
- ✅ `/my/*` requires a valid token; `/admin/*` requires an admin token
- ✅ CORS locked to the frontend origin
- ✅ Login rate limiting (5 tries / 5 min per IP)
- ⬜ HTTPS / firewall / port-forwarding — handled at the Pi + Nginx layer
