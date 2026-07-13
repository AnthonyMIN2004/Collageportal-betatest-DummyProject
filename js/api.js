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

// バックエンド通信は全部この関数を通す。fetchを直接呼ばないのがルール。
// やってくれること:
//   ① Content-Type: application/json を毎回付ける
//   ② ログイン済みなら Authorization: Bearer <token> を自動で付ける
//   ③ エラーレスポンス(4xx/5xx)はサーバーのdetailメッセージ付きでthrowする
// なので呼ぶ側は try/catch して e.message を表示するだけでよい。楽。
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (API.token) headers['Authorization'] = 'Bearer ' + API.token;
  const res = await fetch(API_BASE + path, { ...options, headers });
  if (!res.ok) {
    // res.json()が失敗する場合もある(HTMLエラーページ等)ので catch で空オブジェクトに
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ログイン成功後に1回呼ばれる同期処理。
// data.jsのサンプル定数(SCHEDULE, CLASS_INFO...)をサーバーの本物データで上書きする。
// ※data.js側の変数が const じゃなくて let なのはこの上書きのため。消さないこと！
// Promise.allで3本同時に取りに行く(直列だと遅いので)。
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

// After an admin curriculum edit (exam, timetable, class info):
// re-pull everything from the server and repaint the widgets showing it.
async function refreshCurriculum() {
  await syncFromServer();
  runSafe('mascot speech', renderMascotSpeech);
  runSafe('today classes', renderTodayClasses);
  runSafe('bring reminder', renderBringReminder);
  runSafe('exams', renderExams);
  runSafe('class grid', renderBlockGrid);
  runSafe('full schedule', renderFullSchedule);
  runSafe('review select', populateReviewSelect);
  runSafe('class badge', () => {
    document.getElementById('class-badge-count').textContent = ALL_CLASSES.length;
  });
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
