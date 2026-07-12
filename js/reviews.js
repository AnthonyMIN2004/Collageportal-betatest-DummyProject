// ── COLLEGIATE PORTAL | REVIEWS.JS ──
// Anonymous course review board. Online → shared with everyone through
// /share/reviews. Offline → kept in localStorage on this device only.

function populateReviewSelect() {
  document.getElementById('rv-class').innerHTML = ALL_CLASSES
    .map(n => `<option value="${n}">${n}</option>`)
    .join('');
}

async function loadReviews() {
  if (!API.online) return; // offline: loadLocalDatabase() already filled `reviews`
  try {
    const rows = await apiFetch('/share/reviews');
    // Normalize the backend row shape to what renderReviews expects
    reviews = rows.map(r => ({
      id: r.id,
      class_name: r.class,
      stars: r.stars,
      diff: r.difficulty,
      body: r.body,
      ts: r.ts,
    }));
    renderReviews();
  } catch (e) {
    console.warn('Reviews API failed, showing local reviews:', e);
  }
}

function renderReviews() {
  const container = document.getElementById('reviews-list');
  if (!reviews.length) {
    const msg = lang === 'en'
      ? 'No reviews yet. Be the first to write one!'
      : 'まだレビューはありません。最初のレビューを書いてみましょう！';
    container.innerHTML = `
      <div class="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm text-center space-y-2">
        <span class="text-3xl block">💬</span>
        <p class="text-xs font-bold text-slate-500">${msg}</p>
      </div>
    `;
    return;
  }

  const diffLabel = d =>
    d === 'easy' ? (lang === 'en' ? 'Easy' : '簡単')
    : d === 'hard' ? (lang === 'en' ? 'Hard' : '難しい')
    : (lang === 'en' ? 'Normal' : '普通');

  // Admin moderation: delete inappropriate reviews (server checks the token too)
  const canModerate = isAdmin && API.online;

  container.innerHTML = reviews.map(r => `
    <div class="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h4 class="text-xs font-black text-slate-800">${escHtml(r.class_name || 'Unknown')}</h4>
          <div class="text-[10px] text-slate-400 font-bold mt-0.5">${lang === 'en' ? 'Anonymous' : '匿名'} &bull; ${timeAgo(r.ts)}</div>
        </div>
        <span class="text-xs text-yellow-400 tracking-wider font-bold">${'★'.repeat(r.stars || 0)}</span>
      </div>
      <p class="text-xs text-slate-600 font-semibold leading-relaxed">${escHtml(r.body || '')}</p>
      <div class="flex justify-between items-center pt-2 border-t border-slate-50">
        <span class="bg-brand-50 text-brand-600 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">${lang === 'en' ? 'Student Review' : '学生レビュー'}</span>
        <div class="flex items-center gap-2">
          <span class="text-[9px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">${diffLabel(r.diff)}</span>
          ${canModerate && r.id != null ? `<button onclick="adminDeleteReview(${r.id})" class="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md text-[9px] font-black transition-all">${lang === 'en' ? 'Delete' : '削除'}</button>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

async function adminDeleteReview(id) {
  const allow = await showCustomConfirm(
    lang === 'en' ? 'Delete Review' : 'レビューを削除',
    lang === 'en' ? 'Remove this review for everyone?' : 'このレビューを全員から削除しますか？',
    lang === 'en' ? 'Delete' : '削除する',
    lang === 'en' ? 'Cancel' : 'キャンセル'
  );
  if (!allow) return;
  try {
    await apiFetch('/admin/reviews/' + id, { method: 'DELETE' });
    await loadReviews();
    showToast(lang === 'en' ? 'Review deleted.' : 'レビューを削除しました。');
  } catch (e) {
    showToast('⚠️ ' + e.message);
  }
}

async function postReview() {
  const class_name = document.getElementById('rv-class').value;
  const stars = parseInt(document.getElementById('rv-stars').value);
  const diff = document.getElementById('rv-diff').value;
  const body = document.getElementById('rv-body').value.trim();

  if (!body) {
    showCustomAlert(
      lang === 'en' ? 'Empty review' : 'レビューが空です',
      lang === 'en' ? 'Please write your thoughts about the class first.' : '授業の感想を書いてから投稿してください。'
    );
    return;
  }

  if (API.online) {
    try {
      await apiFetch('/share/reviews', {
        method: 'POST',
        body: JSON.stringify({ class: class_name, stars, difficulty: diff, body }),
      });
      await loadReviews(); // re-fetch so we show the shared list
    } catch (e) {
      showToast('⚠️ ' + e.message);
      return;
    }
  } else {
    reviews.unshift({ class_name, stars, diff, body, ts: Date.now() });
    saveLocalDatabase();
    renderReviews();
  }

  document.getElementById('rv-body').value = '';
  showToast(lang === 'en' ? 'Review posted anonymously!' : 'レビューを匿名で投稿しました！');
}
