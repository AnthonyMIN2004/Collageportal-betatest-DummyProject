# Kiritan Collegiate Portal (Beta)

A student portal PWA for Osaka Christian College — class schedule, quick
tasks, bring-checklist, anonymous course reviews, campus events, and the
Kiritan mascot. Bilingual (EN/JA), installable on Android and iPhone.

## Stack

- **Frontend:** vanilla JS + Tailwind CSS, PWA (`index.html`, `js/`, `css/`, `sw.js`)
- **Backend:** FastAPI + SQLite, JWT auth (`backend/`)
- Works **online** (data from the API) and **offline** (falls back to
  sample data in `js/data.js` + localStorage)

## Run it locally

```bash
# 1. backend
cd backend
python -m venv .venv && .venv\Scripts\activate   # (source .venv/bin/activate on mac/linux)
pip install -r requirements.txt
uvicorn server:app --reload --port 8000

# 2. frontend (from the project root, in another terminal)
python -m http.server 8080
# open http://localhost:8080
```

Login with a seeded student: ID `25501`–`25510`, password = same as the ID.
Admin: `admin` / `admin123`. **Change these before going live.**

## CSS build

`style.css` is generated — don't edit it by hand:

```bash
npm install
npm run build:css     # or npm run watch:css while developing
```

Feature styles live in `css/` and are imported from `input.css`.

## Deploy to the Raspberry Pi

See [deploy/README.md](deploy/README.md) — 12 steps from blank Pi to live,
with ready-made nginx and systemd configs.
