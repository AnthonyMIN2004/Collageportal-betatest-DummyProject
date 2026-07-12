// ── COLLEGIATE PORTAL | API.JS ──
// Tiny fetch wrapper for the FastAPI backend.
// The portal runs in one of two modes:
//   online  — logged in through the backend, data comes from the API
//   offline — backend unreachable, we fall back to the sample data in
//             js/data.js + localStorage so the app stays usable.

const API_BASE = (() => {
  // Opened as a local file → talk to local uvicorn.
  // Dev server (PC or phone on the same wifi) → uvicorn on whatever host served the page.
  // Served by Nginx on the Pi → same origin under /api (see deploy/nginx.conf).
  if (location.protocol === 'file:') {
    return 'http://127.0.0.1:8000';
  }
  if (['5500', '8080', '3000'].includes(location.port)) {
    return 'http://' + location.hostname + ':8000';
  }
  return '/api';
})();

const API = {
  online: false,
  token: sessionStorage.getItem('kiritan_token') || null,
};

// All backend calls go through here: adds the JWT header, parses JSON,
// and turns HTTP errors into thrown Errors with the server's message.
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (API.token) headers['Authorization'] = 'Bearer ' + API.token;
  const res = await fetch(API_BASE + path, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }
  return res.json();
}

// Pull the real curriculum from the server and replace the local
// fallback constants (declared in js/data.js). Called once after login.
async function syncFromServer() {
  const [sched, classes, events] = await Promise.all([
    apiFetch('/my/schedule'),
    apiFetch('/my/classes'),
    apiFetch('/share/events'),
  ]);

  PERIODS = sched.periods;
  SCHEDULE = sched.schedule;
  ALL_CLASSES = classes.map(c => c.name);

  CLASS_INFO = {};
  CLASS_BRING_ITEMS = {};
  EXAMS = [];
  classes.forEach(c => {
    CLASS_INFO[c.name] = { icon: c.icon, desc: c.desc, exam: c.exam };
    CLASS_BRING_ITEMS[c.name] = c.bring;
    if (c.exam) EXAMS.push(c.exam);
  });
  EXAMS.sort((a, b) => a.date.localeCompare(b.date));

  EVENTS = mapEvents(events);
}

// Backend stores ISO dates; the events card wants "JUN / 20" style.
// Keeps the id so admin can delete events from the dashboard.
function mapEvents(events) {
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return events.map(e => {
    const d = new Date(e.date);
    return { id: e.id, month: MONTHS[d.getMonth()], day: String(d.getDate()), name: e.name, detail: e.detail || '' };
  });
}
