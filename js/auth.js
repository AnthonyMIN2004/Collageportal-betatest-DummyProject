// ── COLLEGIATE PORTAL | AUTH.JS ──
// Login gate. Tries the real backend first (JWT login); if the server
// can't be reached — e.g. opening index.html without the Pi running —
// it falls back to offline demo mode with the sample data.

// Offline fallback: the same 10 student ids the backend seeds
const VALID = Array.from({ length: 10 }, (_, i) => String(25501 + i));
let studentId = null;
let isAdmin = false;

async function login() {
  const sid = String(document.getElementById('sid-input').value).trim();
  const pw = String(document.getElementById('pw-input').value);
  const errEl = document.getElementById('gate-error');
  errEl.textContent = '';

  if (!sid) {
    errEl.textContent = lang === 'en' ? 'Please enter your student ID.' : '学籍番号を入力してください';
    return;
  }

  try {
    const res = await apiFetch('/login', {
      method: 'POST',
      body: JSON.stringify({ student_id: sid, password: pw }),
    });
    API.token = res.token;
    API.online = true;
    isAdmin = res.is_admin;
    sessionStorage.setItem('kiritan_token', res.token);
    // UI hint only — the server checks the token itself on every admin call
    sessionStorage.setItem('kiritan_admin', res.is_admin ? '1' : '');
    await enterPortal(res.student_id);
  } catch (e) {
    // TypeError from fetch = network problem (server down) → offline mode.
    // Anything else is a real rejection from the server (wrong password etc).
    if (e instanceof TypeError) {
      if (VALID.includes(sid)) {
        API.online = false;
        await enterPortal(sid);
        showToast(lang === 'en' ? '📡 Offline mode — server not reachable' : '📡 オフラインモードで起動しました');
      } else {
        errEl.textContent = lang === 'en' ? 'Student ID not recognized.' : '学籍番号が正しくありません';
      }
    } else {
      errEl.textContent = '❌ ' + e.message;
    }
  }
}

async function enterPortal(sid) {
  studentId = sid;
  sessionStorage.setItem('kiritan_sid', sid);
  document.getElementById('gate').classList.add('hidden');
  if (API.online) {
    try {
      await syncFromServer();
    } catch (e) {
      console.warn('Server sync failed, showing local sample data:', e);
    }
  }
  init();
  showToast(lang === 'en' ? 'Welcome back!' : 'おかえりなさい！');
}

function logout() {
  sessionStorage.removeItem('kiritan_token');
  sessionStorage.removeItem('kiritan_sid');
  sessionStorage.removeItem('kiritan_admin');
  location.reload();
}

// ── Password change modal ──
function openPasswordModal() {
  if (!API.online) {
    showCustomAlert(
      lang === 'en' ? 'Offline mode' : 'オフラインモード',
      lang === 'en' ? 'Password change needs the server. Try again when you are online.' : 'パスワード変更にはサーバー接続が必要です。オンライン時にお試しください。'
    );
    return;
  }
  // Admin extra: reset a student's password (bcrypt = nobody can read
  // the old one, resetting is the only recovery path)
  document.getElementById('pw-admin-reset').classList.toggle('hidden', !isAdmin);
  ['pw-old', 'pw-new', 'pw-reset-sid', 'pw-reset-new'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('pw-modal').classList.remove('hidden');
}

function closePasswordModal() {
  document.getElementById('pw-modal').classList.add('hidden');
}

async function changeOwnPassword() {
  const oldPw = document.getElementById('pw-old').value;
  const newPw = document.getElementById('pw-new').value;
  if (newPw.length < 4) {
    showToast(lang === 'en' ? '⚠️ New password: at least 4 characters.' : '⚠️ 新パスワードは4文字以上にしてください。');
    return;
  }
  try {
    await apiFetch('/my/password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPw, new_password: newPw }),
    });
    closePasswordModal();
    showToast(lang === 'en' ? '🔑 Password changed!' : '🔑 パスワードを変更しました！');
  } catch (e) {
    showToast('⚠️ ' + e.message);
  }
}

async function adminResetPassword() {
  const sid = document.getElementById('pw-reset-sid').value.trim();
  const newPw = document.getElementById('pw-reset-new').value;
  if (!sid || newPw.length < 4) {
    showToast(lang === 'en' ? '⚠️ Enter a student ID and a password (4+ chars).' : '⚠️ 学籍番号と4文字以上のパスワードを入力してください。');
    return;
  }
  try {
    await apiFetch('/admin/users/' + encodeURIComponent(sid) + '/password', {
      method: 'POST',
      body: JSON.stringify({ new_password: newPw }),
    });
    closePasswordModal();
    showToast(lang === 'en' ? `🔑 Password reset for ${sid}.` : `🔑 ${sid} のパスワードをリセットしました。`);
  } catch (e) {
    showToast('⚠️ ' + e.message);
  }
}

// Enter key submits from either field
['sid-input', 'pw-input'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
  });
});

// Session restore: token (online) or saved id (offline) survives reload
const savedSid = sessionStorage.getItem('kiritan_sid');
if (savedSid && (API.token || VALID.includes(savedSid))) {
  API.online = !!API.token;
  studentId = savedSid;
  isAdmin = sessionStorage.getItem('kiritan_admin') === '1';
  document.getElementById('gate').classList.add('hidden');
}
