// ── COLLEGIATE PORTAL | AUTH.JS ──
// Student authentication and session management

const VALID = Array.from({ length: 10 }, (_, i) => String(25501 + i));
let studentId = null;

function login() {
  const inputVal = String(document.getElementById('sid-input').value).trim();

  if (VALID.includes(inputVal)) {
    studentId = inputVal;
    sessionStorage.setItem('kiritan_sid', inputVal);
    document.getElementById('gate').classList.add('hidden');
    try {
      init();
      showToast(lang === 'en' ? 'Secured verification authenticated!' : 'ポータルの認証に成功しました！');
    } catch (e) {
      console.error('Init error:', e);
      document.getElementById('gate-error').textContent = '❌ Error: ' + e.message;
    }
  } else {
    document.getElementById('gate-error').textContent = '❌ 学籍番号が正しくありません ';
  }
}

document.getElementById('sid-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') login();
});

// Auto-login from session
const savedSid = sessionStorage.getItem('kiritan_sid');
if (savedSid && VALID.includes(savedSid)) {
  studentId = savedSid;
  document.getElementById('gate').classList.add('hidden');
}
