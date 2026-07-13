// ── COLLEGIATE PORTAL | UTILS.JS ──
// Helper utilities, dialog system, toast, clock

// ── HELPER UTILITIES ──
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TODAY = DAYS[new Date().getDay()];

function timeToMins(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getStatus(s, e) {
  const n = new Date().getHours() * 60 + new Date().getMinutes();
  const sm = timeToMins(s);
  const em = timeToMins(e);
  return n > em ? 'done' : n >= sm ? 'now' : 'upcoming';
}

// XSS対策の要。innerHTMLに流し込むユーザー入力は必ずこれを通すこと！
// レビュー本文とかスニペットのコードとか、他人が書いた文字列は全部対象。
// &を最初に変換するのは順番が大事だから(後にやると&lt;の&まで二重変換される)。
// "も変換するのは value="..." 属性の中に入れる場面があるため。
function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function timeAgo(ts) {
  const diffSec = (Date.now() - ts) / 1000;
  if (diffSec < 60) return lang === 'en' ? 'just now' : 'たった今';
  if (diffSec < 3600) return lang === 'en' ? Math.floor(diffSec / 60) + 'm ago' : Math.floor(diffSec / 60) + '分前';
  return lang === 'en' ? Math.floor(diffSec / 3600) + 'h ago' : Math.floor(diffSec / 3600) + '時間前';
}

// ── 自作ダイアログシステム ──
// confirm()の代わり。ポイントはPromiseを返すところ:
//   const ok = await showCustomConfirm(...) と書けるので、
//   「OKを待ってから続きをやる」処理が自然に書ける。
// resolveを外の変数に逃がしておいて、ボタンクリック時に呼ぶ仕掛け。
let confirmPromiseResolve = null;

function showCustomAlert(title, message) {
  document.getElementById('alert-title').textContent = title;
  document.getElementById('alert-body').textContent = message;
  const overlay = document.getElementById('custom-alert-overlay');
  overlay.classList.add('opacity-100', 'pointer-events-auto');
  overlay.classList.remove('opacity-0', 'pointer-events-none');
  document.getElementById('alert-box').classList.remove('scale-95');
  document.getElementById('alert-box').classList.add('scale-100');
}

function closeCustomAlert() {
  const overlay = document.getElementById('custom-alert-overlay');
  overlay.classList.remove('opacity-100', 'pointer-events-auto');
  overlay.classList.add('opacity-0', 'pointer-events-none');
  document.getElementById('alert-box').classList.remove('scale-100');
  document.getElementById('alert-box').classList.add('scale-95');
}

function showCustomConfirm(title, message, okText = 'Confirm', cancelText = 'Cancel') {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-body').textContent = message;
  document.getElementById('confirm-ok-lbl').textContent = okText;
  document.getElementById('confirm-cancel-lbl').textContent = cancelText;
  const overlay = document.getElementById('custom-confirm-overlay');
  overlay.classList.add('opacity-100', 'pointer-events-auto');
  overlay.classList.remove('opacity-0', 'pointer-events-none');
  document.getElementById('confirm-box').classList.remove('scale-95');
  document.getElementById('confirm-box').classList.add('scale-100');
  return new Promise((resolve) => {
    confirmPromiseResolve = resolve;
  });
}

function resolveCustomConfirm(value) {
  const overlay = document.getElementById('custom-confirm-overlay');
  overlay.classList.remove('opacity-100', 'pointer-events-auto');
  overlay.classList.add('opacity-0', 'pointer-events-none');
  document.getElementById('confirm-box').classList.remove('scale-100');
  document.getElementById('confirm-box').classList.add('scale-95');
  if (confirmPromiseResolve) {
    confirmPromiseResolve(value);
    confirmPromiseResolve = null;
  }
}

// 上からぴょこっと出る通知。2.5秒表示→フェードアウト→DOMから削除。
// 遷移が終わるのを待ってからremove()しないとアニメーションが切れるので
// setTimeoutが2段になってる。
function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'bg-slate-900/95 backdrop-blur-md text-white text-xs font-black p-3.5 rounded-xl shadow-xl border border-white/10 flex items-center gap-2.5 transition-all duration-300 transform translate-y-0 opacity-100';
  toast.innerHTML = `<span class="text-blue-400">✨</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('-translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// クリップボードコピー。navigator.clipboardはhttps必須なので、
// http環境(開発中のLAN)でも動く古典的なtextarea+execCommand方式を使ってる。
// deprecatedなのは知ってるけど、動くものは動く。Pi移行後に書き換え検討。
function safeCopyToClipboard(text) {
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(area);
    return copied;
  } catch (err) {
    return false;
  }
}

// ── REAL TIME CLOCK LOOP ──
function runRealTimeClock() {
  const clockEl = document.getElementById('header-time');
  const dateEl = document.getElementById('header-date');
  setInterval(() => {
    const d = new Date();
    clockEl.textContent = d.toLocaleTimeString('ja-JP', { hour12: false });
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = d.toLocaleDateString(lang === 'en' ? 'en-US' : 'ja-JP', options).toUpperCase();
  }, 1000);
}
