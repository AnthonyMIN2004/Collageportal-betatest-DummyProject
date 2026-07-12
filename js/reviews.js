// ── COLLEGIATE PORTAL | REVIEWS.JS ──
// Anonymous course review board

function populateReviewSelect() {
  document.getElementById('rv-class').innerHTML = ALL_CLASSES
    .map(n => `<option value="${n}">${n}</option>`)
    .join('');
}

function renderReviews() {
  const container = document.getElementById('reviews-list');
  if (!reviews.length) {
    const msg = lang === 'en'
      ? 'No reviews posted yet.'
      : 'まだ講義レビューはありません。最初の評価を登録しましょう！';
    container.innerHTML = `
      <div class="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm text-center space-y-2">
        <span class="text-3xl block">💬</span>
        <p class="text-xs font-bold text-slate-500">${msg}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = reviews.map(r => `
    <div class="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h4 class="text-xs font-black text-slate-800">${r.class_name || 'Unknown'}</h4>
          <div class="text-[10px] text-slate-400 font-bold mt-0.5">🔒 OCC Identity Verified &bull; ${timeAgo(r.ts)}</div>
        </div>
        <span class="text-xs text-yellow-400 tracking-wider font-bold">${'★'.repeat(r.stars || 0)}</span>
      </div>
      <p class="text-xs text-slate-600 font-semibold leading-relaxed">${escHtml(r.body || '')}</p>
      <div class="flex justify-between items-center pt-2 border-t border-slate-50">
        <span class="bg-brand-50 text-brand-600 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">VERIFIED ENROLLEE</span>
        <span class="text-[9px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
          ${r.diff === 'easy' ? 'Easy' : r.diff === 'ok' ? 'Ok' : 'Hard'}
        </span>
      </div>
    </div>
  `).join('');
}

function postReview() {
  const class_name = document.getElementById('rv-class').value;
  const stars = parseInt(document.getElementById('rv-stars').value);
  const diff = document.getElementById('rv-diff').value;
  const body = document.getElementById('rv-body').value.trim();

  if (!body) {
    showCustomAlert('Error', 'Please share your experience about this course first.');
    return;
  }

  reviews.unshift({ class_name, stars, diff, body, ts: Date.now() });
  saveLocalDatabase();
  document.getElementById('rv-body').value = '';
  renderReviews();
  showToast(lang === 'en' ? 'Review uploaded anonymously!' : 'コース評価を匿名投稿しました！');
}