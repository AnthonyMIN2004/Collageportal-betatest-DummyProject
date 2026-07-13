// ── COLLEGIATE PORTAL | CLASSES.JS ──
// Classes grid, detail view, code snippets, live session.
// Snippets + live sessions go through the backend when online (shared
// between devices); offline they fall back to this device's storage.

let currentClass = null;
let currentTab = 'info';
let snippets = {};
let reviews = [];

// ライブセッションの状態(今開いてるクラスの分だけ)。
// Liveタブを開いてる間、5秒おきにサーバーへ取りに行く「ポーリング」方式。
// WebSocketにしなかった理由: この規模なら5秒ポーリングで十分だし、
// Nginxの設定もサーバーのコードもずっと単純に済むから。
let liveState = { active: false, posts: [] };
let livePoll = null;

// ポーリング停止。タブを離れる時・クラス詳細を閉じる時に必ず呼ぶこと。
// これを忘れるとタイマーが増殖して裏で無限にAPIを叩き続ける(こわい)
function stopLivePoll() {
  if (livePoll) {
    clearInterval(livePoll);
    livePoll = null;
  }
}

// オフライン時のデータ置き場はlocalStorage。
// オンライン時はサーバーから取るのでここは初期値になるだけ。
function loadLocalDatabase() {
  const sn = localStorage.getItem('kiritan_snippets');
  const rv = localStorage.getItem('kiritan_reviews');
  snippets = sn ? JSON.parse(sn) : {};
  reviews = rv ? JSON.parse(rv) : [];
}

function saveLocalDatabase() {
  localStorage.setItem('kiritan_snippets', JSON.stringify(snippets));
  localStorage.setItem('kiritan_reviews', JSON.stringify(reviews));
}

function renderBlockGrid() {
  const grid = document.getElementById('block-grid');
  const typeTag = {
    code: 'bg-purple-50 text-purple-600 border border-purple-200',
    sport: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    seminar: 'bg-amber-50 text-amber-600 border border-amber-200',
    general: 'bg-slate-50 text-slate-600 border border-slate-200'
  };
  const typeLabel = {
    code: '💻 Practical Code',
    sport: '⚽ Gym Class',
    seminar: '💡 Active Seminar',
    general: '📚 Theoretical Lecture'
  };

  grid.innerHTML = ALL_CLASSES.map(name => {
    const info = CLASS_INFO[name] || { icon: '📚' };
    const allC = Object.values(SCHEDULE).flat().filter(c => c.name === name);
    const type = allC[0]?.type || 'general';
    const tagClass = typeTag[type] || typeTag.general;
    const tagText = typeLabel[type] || 'Lecture';

    return `
      <div onclick="showClassDetail('${name.replace(/'/g, "\\'")}')"
           class="bg-white border border-slate-200/85 hover:border-brand-500 hover:shadow-lg hover:-translate-y-0.5 rounded-3xl p-5 cursor-pointer transition-all flex flex-col justify-between min-h-[160px]">
        <div>
          <span class="text-3xl block mb-2">${info.icon}</span>
          <h3 class="text-xs font-black text-slate-900 leading-snug line-clamp-2">${name}</h3>
          <span class="text-[10px] font-bold text-slate-400 block mt-1">📍 Room ${allC[0]?.room || 'TBD'}</span>
        </div>
        <div class="flex flex-wrap gap-1.5 mt-3">
          <span class="text-[9px] font-black px-2.5 py-0.5 rounded-lg ${tagClass}">${tagText}</span>
          ${info.exam ? `<span class="bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black px-2 py-0.5 rounded-lg">${lang === 'en' ? '📝 Exam' : '📝 試験あり'}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function showClassDetail(name) {
  currentClass = name;
  currentTab = 'info';
  liveState = { active: false, posts: [] }; // don't show another class's stream
  document.getElementById('classes-index').classList.add('hidden');
  const container = document.getElementById('class-detail');
  container.classList.remove('hidden');

  const info = CLASS_INFO[name] || { icon: '📚', desc: '', exam: null };
  const allC = Object.values(SCHEDULE).flat().filter(c => c.name === name);
  const type = allC[0]?.type || 'general';
  const isPractical = type === 'code' || type === 'seminar';

  const menuTabs = isPractical
    ? `<div class="flex gap-2 flex-wrap">
        <button onclick="switchClassTab('info')" id="ctab-info" class="ctab active px-4 py-2 text-xs font-extrabold rounded-xl transition-all bg-brand-500 text-white shadow-sm">📋 Info</button>
        <button onclick="switchClassTab('snippets')" id="ctab-snippets" class="ctab px-4 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl transition-all bg-white border border-slate-200">💻 Shared Code</button>
        <button onclick="switchClassTab('live')" id="ctab-live" class="ctab px-4 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl transition-all bg-white border border-slate-200">⚡ Live Stream</button>
       </div>`
    : `<div class="flex gap-2">
        <button onclick="switchClassTab('info')" id="ctab-info" class="ctab active px-4 py-2 text-xs font-extrabold rounded-xl transition-all bg-brand-500 text-white shadow-sm">📋 Info</button>
       </div>`;

  const backLabel = lang === 'en' ? '← Back to Classes' : '← 全ての講義に戻る';

  container.innerHTML = `
    <button onclick="hideClassDetail()" class="text-xs font-black text-brand-500 hover:text-brand-600 transition-all flex items-center gap-1.5 mb-4">${backLabel}</button>
    <div class="bg-gradient-to-br from-[#1E3A8A] via-[#2E48A0] to-slate-900 rounded-3xl p-6 text-white mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <span class="text-3xl block mb-2">${info.icon}</span>
        <h2 class="text-lg font-black">${name}</h2>
        <p class="text-xs text-brand-100 font-semibold mt-1">📍 Room ${allC[0]?.room || 'TBD'} &bull; Osaka Christian College</p>
      </div>
    </div>
    <div class="space-y-4">
      ${menuTabs}
      <div id="class-tab-interior-content" class="min-h-[200px]"></div>
    </div>
  `;
  renderClassTabContent();
}

function hideClassDetail() {
  stopLivePoll();
  document.getElementById('classes-index').classList.remove('hidden');
  document.getElementById('class-detail').classList.add('hidden');
}

function switchClassTab(tabName) {
  currentTab = tabName;
  document.querySelectorAll('.ctab').forEach(btn => {
    btn.className = 'ctab px-4 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl transition-all bg-white border border-slate-200';
  });
  const activeBtn = document.getElementById('ctab-' + tabName);
  if (activeBtn) {
    activeBtn.className = 'ctab active px-4 py-2 text-xs font-extrabold rounded-xl transition-all bg-brand-500 text-white shadow-sm';
  }
  renderClassTabContent();
  // Online: render the cached copy above, then fetch a fresh one
  if (tabName === 'snippets') loadSnippets();
  if (tabName === 'live') loadLive();
}

function renderClassTabContent() {
  const output = document.getElementById('class-tab-interior-content');
  if (!output) return;
  stopLivePoll(); // restarted below if the Live tab is showing
  const info = CLASS_INFO[currentClass] || {};

  if (currentTab === 'info') {
    const exam = info.exam;
    const canEdit = isAdmin && API.online;
    const bringItems = CLASS_BRING_ITEMS[currentClass] || [];

    // Admin: edit syllabus icon/text + manage the bring-items list.
    // Everything saves straight to the server and re-renders.
    const adminPanel = !canEdit ? '' : `
      <div class="md:col-span-12 bg-white border border-brand-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h4 class="font-extrabold text-brand-600 text-sm">🛠️ ${lang === 'en' ? 'Edit Class (Admin)' : 'クラス編集（管理者）'}</h4>
        <div class="flex gap-2">
          <input type="text" id="ci-icon" value="${escHtml(info.icon || '📚')}" class="w-16 text-center text-base px-2 py-2 rounded-xl border border-slate-200 outline-none focus:border-brand-500 bg-slate-50">
          <button onclick="adminSaveClassInfo()" class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-black text-xs transition-all ml-auto">${lang === 'en' ? 'Save' : '保存'}</button>
        </div>
        <textarea id="ci-desc" class="w-full p-3 rounded-xl border border-slate-200 outline-none text-xs font-semibold bg-slate-50 min-h-[80px] focus:border-brand-500">${escHtml(info.desc || '')}</textarea>
        <div class="border-t border-slate-100 pt-3 space-y-2">
          <h5 class="text-xs font-extrabold text-slate-900">🎒 ${lang === 'en' ? 'Things to Bring' : '持ち物リスト'}</h5>
          <div class="flex flex-wrap gap-2">
            ${bringItems.map(b => `
              <span class="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-bold text-slate-700">
                ${escHtml(b.icon)} ${escHtml(b.item)}
                ${b.id != null ? `<button onclick="adminDeleteBring(${b.id})" class="text-rose-400 hover:text-rose-600 font-black transition-all">✕</button>` : ''}
              </span>
            `).join('') || `<span class="text-[10px] font-bold text-slate-400">${lang === 'en' ? 'Nothing yet.' : 'まだありません。'}</span>`}
          </div>
          <div class="flex gap-2">
            <input type="text" id="br-icon" placeholder="📓" class="w-14 text-center text-xs px-2 py-2 rounded-xl border border-slate-200 outline-none focus:border-brand-500 bg-slate-50/50">
            <input type="text" id="br-item" placeholder="${lang === 'en' ? 'Item name' : '持ち物の名前'}" class="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-brand-500 font-semibold bg-slate-50/50">
            <button onclick="adminAddBring()" class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-black text-xs transition-all">＋</button>
          </div>
        </div>
      </div>
    `;

    output.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div class="md:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <h4 class="font-extrabold text-slate-900 text-sm mb-3">${lang === 'en' ? 'Syllabus Description' : '講義概要'}</h4>
          <p class="text-xs text-slate-600 font-semibold leading-relaxed">${escHtml(info.desc || '') || 'No syllabus uploaded.'}</p>
        </div>
        <div class="md:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <h4 class="font-extrabold text-slate-900 text-sm mb-3">${lang === 'en' ? 'Test Schedule' : '試験情報'}</h4>
          ${exam ? `
            <div class="space-y-3">
              <span class="bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black px-2.5 py-1 rounded-lg inline-block uppercase">TEST ASSIGNED</span>
              <h5 class="text-xs font-black text-slate-900">${escHtml(exam.name)}</h5>
              <p class="text-[10px] text-slate-500 font-bold">📅 ${exam.date} &bull; Room ${escHtml(exam.room || 'TBD')}</p>
              <p class="text-[10px] text-brand-600 font-extrabold">📝 ${escHtml(exam.topics || '')}</p>
            </div>
          ` : `<p class="text-xs font-semibold text-slate-400 text-center py-4">No exam scheduled for this segment.</p>`}
        </div>
        ${adminPanel}
      </div>
    `;
    return;
  }

  if (currentTab === 'snippets') {
    const mySnippets = snippets[currentClass] || [];
    // Offline only: warn that snippets won't reach other devices
    const offlineBanner = API.online ? '' : `
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-semibold text-amber-800 mb-4 flex items-center gap-2">
        <span>⚠️</span>
        <span>${lang === 'en' ? 'Offline mode — snippets are saved on this device only.' : 'オフラインモード：スニペットはこの端末にのみ保存されます。'}</span>
      </div>`;
    output.innerHTML = `
      ${offlineBanner}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4 self-start">
          <h4 class="font-extrabold text-slate-900 text-sm">Post Code Material</h4>
          <div>
            <label class="text-[10px] font-black text-slate-400 block uppercase tracking-widest mb-1">Snippet Title</label>
            <input type="text" id="sn-title" placeholder="e.g., Bubble Sort in JavaScript" class="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs font-semibold bg-slate-50 focus:border-brand-500">
          </div>
          <div>
            <label class="text-[10px] font-black text-slate-400 block uppercase tracking-widest mb-1">Script Source</label>
            <textarea id="sn-code" placeholder="// Write or paste code here..." class="w-full p-3 rounded-xl border border-slate-200 outline-none text-xs font-mono bg-[#1E1E2E] text-[#CDD6F4] min-h-[120px] focus:border-brand-500"></textarea>
          </div>
          <button onclick="postSnippet()" class="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs rounded-xl transition-all">✨ Upload to Sandbox</button>
        </div>
        <div class="lg:col-span-7 space-y-4">
          <div id="snippets-feed" class="space-y-3">
            ${mySnippets.length ? mySnippets.map((s, i) => {
              // You can delete your own posts; admin can delete anything.
              // Offline snippets live on this device, so they're always yours.
              const canDelete = !API.online || s.author === studentId || isAdmin;
              const byline = API.online && s.author ? ` &bull; ${escHtml(String(s.author))}` : '';
              return `
              <div class="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs font-black text-slate-800">${escHtml(s.title)}</h4>
                  <span class="text-[10px] text-slate-400 font-bold">${timeAgo(s.ts)}${byline}</span>
                </div>
                <pre class="bg-[#1E1E2E] text-[#CDD6F4] font-mono text-xs p-3.5 rounded-xl overflow-x-auto max-h-[180px] border border-[#313244]">${escHtml(s.code)}</pre>
                <div class="flex justify-end gap-2">
                  <button onclick="copySnippet(${i})" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-black text-slate-700 transition-all">Copy</button>
                  ${canDelete ? `<button onclick="deleteSnippet(${i})" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black transition-all">Delete</button>` : ''}
                </div>
              </div>
            `;}).join('') : `<p class="text-xs font-bold text-slate-400 text-center py-10 bg-white border border-slate-200 rounded-3xl">Be the first to post a study sandbox block! 💻</p>`}
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (currentTab === 'live') {
    // Online: server state shared by every device (kept fresh by polling).
    // Offline: sessionStorage demo, this device only.
    const session = API.online
      ? liveState
      : JSON.parse(sessionStorage.getItem('kiritan_live_' + currentClass) || 'null');
    if (session?.active) {
      // Stopping a session is for whoever started it (or admin) — the
      // server enforces this too; hiding the button just avoids a 403.
      const canStop = !API.online || session.started_by === studentId || isAdmin;
      output.innerHTML = `
        <div class="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs font-semibold text-emerald-800 mb-4 flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>${lang === 'en' ? 'Live session is running.' : 'ライブセッション実行中です。'}</span>
          </div>
          ${canStop ? `<button onclick="endLiveSession()" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black transition-all">${lang === 'en' ? 'End Session' : 'セッション終了'}</button>` : ''}
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-8 space-y-4">
            <div class="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
              <h4 class="font-extrabold text-slate-900 text-sm mb-3">${lang === 'en' ? 'Shared Code Feed' : '共有コードフィード'}</h4>
              <div class="space-y-3" id="live-feed-streams">${renderLivePosts(session.posts || [])}</div>
            </div>
          </div>
          <div class="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-3 self-start">
            <h4 class="font-extrabold text-slate-900 text-sm">${lang === 'en' ? 'Share Your Code' : 'コードをシェア'}</h4>
            <textarea id="live-input" placeholder="// Type code snippet..." class="w-full p-3 rounded-xl border border-slate-200 outline-none text-xs font-mono bg-[#1E1E2E] text-[#CDD6F4] min-h-[140px] focus:border-brand-500"></textarea>
            <button onclick="postLocalLive()" class="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs rounded-xl transition-all">⚡ Push Stream</button>
          </div>
        </div>
      `;
    } else {
      const startLabel = API.online
        ? (lang === 'en' ? 'Start Live Session' : 'ライブセッション開始')
        : (lang === 'en' ? 'Start Demo Session' : 'デモセッション開始');
      output.innerHTML = `
        <div class="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm text-center max-w-md mx-auto my-6 space-y-4">
          <span class="text-4xl block">⚡</span>
          <div>
            <h4 class="font-extrabold text-slate-900 text-sm">${lang === 'en' ? 'No live session right now' : 'ライブセッションはありません'}</h4>
            <p class="text-xs text-slate-400 font-bold mt-1">${lang === 'en' ? 'Start a session and everyone in this class can share code in real time.' : 'セッションを始めると、このクラスのみんなとリアルタイムでコードを共有できます。'}</p>
          </div>
          <button onclick="startLiveSession()" class="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-black rounded-xl transition-all shadow-md">${startLabel}</button>
        </div>
      `;
    }
    // Keep the feed fresh while the tab is open — light polling, no websockets
    if (API.online) {
      livePoll = setInterval(() => loadLive(false), 5000);
    }
  }
}

function renderLivePosts(posts) {
  if (!posts.length) {
    return `<p class="text-xs font-bold text-slate-400 text-center py-6">Waiting for stream uploads...</p>`;
  }
  return posts.map(p => `
    <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
      <div class="flex justify-between items-center mb-1.5">
        <span class="text-[10px] text-brand-600 font-extrabold">${escHtml(String(p.sid))}</span>
        <span class="text-[9px] text-slate-400 font-bold">${timeAgo(p.ts)}</span>
      </div>
      <pre class="bg-[#1E1E2E] text-[#CDD6F4] font-mono text-xs p-3.5 rounded-xl border border-[#313244] overflow-x-auto">${escHtml(p.code)}</pre>
    </div>
  `).join('');
}

// ── Admin: class info + bring items editing ──
async function adminSaveClassInfo() {
  const icon = document.getElementById('ci-icon').value.trim() || '📚';
  const desc = document.getElementById('ci-desc').value.trim();
  try {
    await apiFetch('/admin/classes/' + encodeURIComponent(currentClass), {
      method: 'PUT',
      body: JSON.stringify({ icon, desc }),
    });
    await refreshCurriculum();
    showClassDetail(currentClass); // repaint the header + info tab
    showToast(lang === 'en' ? '💾 Class info saved!' : '💾 クラス情報を保存しました！');
  } catch (e) {
    showToast('⚠️ ' + e.message);
  }
}

async function adminAddBring() {
  const icon = document.getElementById('br-icon').value.trim() || '📓';
  const item = document.getElementById('br-item').value.trim();
  if (!item) {
    showToast(lang === 'en' ? '⚠️ Enter an item name.' : '⚠️ 持ち物の名前を入力してください。');
    return;
  }
  try {
    await apiFetch('/admin/bring', {
      method: 'POST',
      body: JSON.stringify({ class: currentClass, icon, item }),
    });
    await refreshCurriculum();
    renderClassTabContent();
    showToast(lang === 'en' ? '🎒 Item added!' : '🎒 持ち物を追加しました！');
  } catch (e) {
    showToast('⚠️ ' + e.message);
  }
}

async function adminDeleteBring(id) {
  try {
    await apiFetch('/admin/bring/' + id, { method: 'DELETE' });
    await refreshCurriculum();
    renderClassTabContent();
    showToast(lang === 'en' ? 'Item removed.' : '持ち物を削除しました。');
  } catch (e) {
    showToast('⚠️ ' + e.message);
  }
}

// Pull this class's snippets from the server, then re-render if the
// user is still looking at the snippets tab.
async function loadSnippets() {
  if (!API.online || !currentClass) return;
  try {
    const rows = await apiFetch('/share/snippets?class=' + encodeURIComponent(currentClass));
    snippets[currentClass] = rows.map(r => ({
      id: r.id, title: r.title, code: r.code, author: r.author, ts: r.ts,
    }));
    if (currentTab === 'snippets') renderClassTabContent();
  } catch (e) {
    console.warn('Snippets API failed, showing local copies:', e);
  }
}

// ライブの状態をサーバーから取得。引数rerenderの意味が大事:
//   rerender=true  … タブを開いた直後。画面まるごと描き直してOK
//   rerender=false … ポーリング(5秒おき)の時。まるごと描き直すと
//                    入力途中のtextareaまで消えてしまう(やらかした)ので、
//                    フィード部分のinnerHTMLだけ差し替える
// ただしactiveがfalse→trueに変わった時(誰かが開始した)は全体を描き直す。
async function loadLive(rerender = true) {
  if (!API.online || !currentClass) return;
  try {
    const st = await apiFetch('/share/live/' + encodeURIComponent(currentClass));
    const flipped = st.active !== liveState.active;
    liveState = st;
    if (currentTab !== 'live') return;
    if (rerender || flipped) {
      renderClassTabContent();
    } else {
      const feed = document.getElementById('live-feed-streams');
      if (feed) feed.innerHTML = renderLivePosts(st.posts || []);
    }
  } catch (e) {
    console.warn('Live session poll failed:', e);
  }
}

async function postSnippet() {
  const title = document.getElementById('sn-title').value.trim();
  const code = document.getElementById('sn-code').value.trim();
  if (!title || !code) {
    showCustomAlert('Error', 'Please enter both a title and code.');
    return;
  }
  if (API.online) {
    try {
      await apiFetch('/share/snippets', {
        method: 'POST',
        body: JSON.stringify({ class: currentClass, title, code }),
      });
      await loadSnippets();
    } catch (e) {
      showToast('⚠️ ' + e.message);
      return;
    }
  } else {
    if (!snippets[currentClass]) snippets[currentClass] = [];
    snippets[currentClass].unshift({ title, class_name: currentClass, code, ts: Date.now() });
    saveLocalDatabase();
    renderClassTabContent();
  }
  showToast(lang === 'en' ? 'Snippet shared with the class!' : 'コードをクラスに共有しました！');
}

function copySnippet(i) {
  const item = (snippets[currentClass] || [])[i];
  if (!item) return;
  const copied = safeCopyToClipboard(item.code);
  showToast(copied
    ? (lang === 'en' ? 'Copied script to clipboard!' : 'クリップボードにコピー完了！')
    : (lang === 'en' ? 'Copy error.' : 'コピーに失敗しました。')
  );
}

async function deleteSnippet(i) {
  const item = (snippets[currentClass] || [])[i];
  if (!item) return;
  const allow = await showCustomConfirm('Delete Script', 'Are you sure you want to delete this shared script block?', 'Delete', 'Cancel');
  if (!allow) return;
  if (API.online && item.id != null) {
    try {
      await apiFetch('/share/snippets/' + item.id, { method: 'DELETE' });
      await loadSnippets();
    } catch (e) {
      showToast('⚠️ ' + e.message);
      return;
    }
  } else {
    snippets[currentClass].splice(i, 1);
    saveLocalDatabase();
    renderClassTabContent();
  }
  showToast('Deleted item successfully.');
}

async function startLiveSession() {
  if (API.online) {
    try {
      await apiFetch('/share/live/' + encodeURIComponent(currentClass) + '/start', { method: 'POST' });
      await loadLive();
    } catch (e) {
      showToast('⚠️ ' + e.message);
      return;
    }
  } else {
    sessionStorage.setItem('kiritan_live_' + currentClass, JSON.stringify({ active: true, posts: [] }));
    renderClassTabContent();
  }
  showToast(lang === 'en' ? 'Live session started!' : 'ライブセッションを開始しました！');
}

async function endLiveSession() {
  const allow = await showCustomConfirm('End Live Session', 'Stop the shared code session for everyone?', 'End Session', 'Dismiss');
  if (!allow) return;
  if (API.online) {
    try {
      await apiFetch('/share/live/' + encodeURIComponent(currentClass) + '/stop', { method: 'POST' });
      await loadLive();
    } catch (e) {
      showToast('⚠️ ' + e.message);
      return;
    }
  } else {
    sessionStorage.removeItem('kiritan_live_' + currentClass);
    renderClassTabContent();
  }
  showToast(lang === 'en' ? 'Session closed.' : 'セッションを終了しました。');
}

async function postLocalLive() {
  const code = document.getElementById('live-input').value.trim();
  if (!code) return;
  if (API.online) {
    try {
      await apiFetch('/share/live/' + encodeURIComponent(currentClass) + '/post', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      await loadLive();
    } catch (e) {
      showToast('⚠️ ' + e.message);
      return;
    }
  } else {
    const session = JSON.parse(sessionStorage.getItem('kiritan_live_' + currentClass) || 'null');
    if (!session) return;
    session.posts.push({ sid: studentId, code, ts: Date.now() });
    sessionStorage.setItem('kiritan_live_' + currentClass, JSON.stringify(session));
    renderClassTabContent();
  }
  showToast(lang === 'en' ? 'Code pushed to the stream!' : 'コードを送信しました！');
}
