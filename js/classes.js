// ── COLLEGIATE PORTAL | CLASSES.JS ──
// Classes grid, detail view, code snippets, live session

let currentClass = null;
let currentTab = 'info';
let snippets = {};
let reviews = [];

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
        <p class="text-xs text-brand-100 font-semibold mt-1">📍 Room ${allC[0]?.room || 'TBD'} &bull; Osaka Academic Workspace</p>
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
}

function renderClassTabContent() {
  const output = document.getElementById('class-tab-interior-content');
  if (!output) return;
  const info = CLASS_INFO[currentClass] || {};

  if (currentTab === 'info') {
    const exam = info.exam;
    output.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div class="md:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <h4 class="font-extrabold text-slate-900 text-sm mb-3">${lang === 'en' ? 'Syllabus Description' : '講義概要'}</h4>
          <p class="text-xs text-slate-600 font-semibold leading-relaxed">${info.desc || 'No syllabus uploaded.'}</p>
        </div>
        <div class="md:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <h4 class="font-extrabold text-slate-900 text-sm mb-3">${lang === 'en' ? 'Test Schedule' : '試験情報'}</h4>
          ${exam ? `
            <div class="space-y-3">
              <span class="bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black px-2.5 py-1 rounded-lg inline-block uppercase">TEST ASSIGNED</span>
              <h5 class="text-xs font-black text-slate-900">${exam.name}</h5>
              <p class="text-[10px] text-slate-500 font-bold">📅 ${exam.date} &bull; Room ${exam.room}</p>
              <p class="text-[10px] text-brand-600 font-extrabold">📝 ${exam.topics}</p>
            </div>
          ` : `<p class="text-xs font-semibold text-slate-400 text-center py-4">No exam scheduled for this segment.</p>`}
        </div>
      </div>
    `;
    return;
  }

  if (currentTab === 'snippets') {
    const mySnippets = snippets[currentClass] || [];
    output.innerHTML = `
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-semibold text-amber-800 mb-4 flex items-center gap-2">
        <span>⚠️</span>
        <span>Local sandbox emulated. Live server compilation connection requires Pi network deployment.</span>
      </div>
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
            ${mySnippets.length ? mySnippets.map((s, i) => `
              <div class="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs font-black text-slate-800">${escHtml(s.title)}</h4>
                  <span class="text-[10px] text-slate-400 font-bold">${timeAgo(s.ts)}</span>
                </div>
                <pre class="bg-[#1E1E2E] text-[#CDD6F4] font-mono text-xs p-3.5 rounded-xl overflow-x-auto max-h-[180px] border border-[#313244]">${escHtml(s.code)}</pre>
                <div class="flex justify-end gap-2">
                  <button onclick="copySnippet(${i})" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-black text-slate-700 transition-all">Copy</button>
                  <button onclick="deleteSnippet(${i})" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black transition-all">Delete</button>
                </div>
              </div>
            `).join('') : `<p class="text-xs font-bold text-slate-400 text-center py-10 bg-white border border-slate-200 rounded-3xl">Be the first to post a study sandbox block! 💻</p>`}
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (currentTab === 'live') {
    const session = JSON.parse(sessionStorage.getItem('kiritan_live_' + currentClass) || 'null');
    if (session?.active) {
      const posts = session.posts || [];
      output.innerHTML = `
        <div class="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs font-semibold text-emerald-800 mb-4 flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Class Room Session is running dynamically.</span>
          </div>
          <button onclick="endLiveSession()" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black transition-all">Force Stop</button>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-8 space-y-4">
            <div class="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
              <h4 class="font-extrabold text-slate-900 text-sm mb-3">Feed Update Streams</h4>
              <div class="space-y-3" id="live-feed-streams">
                ${posts.length ? posts.map(p => `
                  <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div class="flex justify-between items-center mb-1.5">
                      <span class="text-[10px] text-brand-600 font-extrabold">Student #${p.sid}</span>
                      <span class="text-[9px] text-slate-400 font-bold">${timeAgo(p.ts)}</span>
                    </div>
                    <pre class="bg-[#1E1E2E] text-[#CDD6F4] font-mono text-xs p-3.5 rounded-xl border border-[#313244] overflow-x-auto">${escHtml(p.code)}</pre>
                  </div>
                `).join('') : `<p class="text-xs font-bold text-slate-400 text-center py-6">Waiting for stream uploads...</p>`}
              </div>
            </div>
          </div>
          <div class="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-3 self-start">
            <h4 class="font-extrabold text-slate-900 text-sm">Post to Shared Stream</h4>
            <textarea id="live-input" placeholder="// Type code snippet..." class="w-full p-3 rounded-xl border border-slate-200 outline-none text-xs font-mono bg-[#1E1E2E] text-[#CDD6F4] min-h-[140px] focus:border-brand-500"></textarea>
            <button onclick="postLocalLive()" class="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs rounded-xl transition-all">⚡ Push Stream</button>
          </div>
        </div>
      `;
    } else {
      output.innerHTML = `
        <div class="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm text-center max-w-md mx-auto my-6 space-y-4">
          <span class="text-4xl block">⚡</span>
          <div>
            <h4 class="font-extrabold text-slate-900 text-sm">No Active Real-Time Session</h4>
            <p class="text-xs text-slate-400 font-bold mt-1">Simulate or start a lecture-wide synchronized stream session.</p>
          </div>
          <button onclick="startLiveSession()" class="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-black rounded-xl transition-all shadow-md">Initialize Demo Session</button>
        </div>
      `;
    }
  }
}

function postSnippet() {
  const title = document.getElementById('sn-title').value.trim();
  const code = document.getElementById('sn-code').value.trim();
  if (!title || !code) {
    showCustomAlert('Error', 'Please enter both a title and code.');
    return;
  }
  if (!snippets[currentClass]) snippets[currentClass] = [];
  snippets[currentClass].unshift({ title, class_name: currentClass, code, ts: Date.now() });
  saveLocalDatabase();
  renderClassTabContent();
  showToast(lang === 'en' ? 'Uploaded to local workspace!' : 'コードを保存しました！');
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
  const allow = await showCustomConfirm('Delete Script', 'Are you sure you want to delete this shared script block?', 'Delete', 'Cancel');
  if (!allow) return;
  snippets[currentClass].splice(i, 1);
  saveLocalDatabase();
  renderClassTabContent();
  showToast('Deleted item successfully.');
}

function startLiveSession() {
  sessionStorage.setItem('kiritan_live_' + currentClass, JSON.stringify({ active: true, posts: [] }));
  renderClassTabContent();
  showToast('Live stream initialized.');
}

async function endLiveSession() {
  const allow = await showCustomConfirm('End Stream Session', 'Stop simulated classroom stream session?', 'End Session', 'Dismiss');
  if (!allow) return;
  sessionStorage.removeItem('kiritan_live_' + currentClass);
  renderClassTabContent();
  showToast('Stream closed.');
}

function postLocalLive() {
  const code = document.getElementById('live-input').value.trim();
  if (!code) return;
  const session = JSON.parse(sessionStorage.getItem('kiritan_live_' + currentClass) || 'null');
  if (!session) return;
  session.posts.push({ sid: studentId, code, ts: Date.now() });
  sessionStorage.setItem('kiritan_live_' + currentClass, JSON.stringify(session));
  renderClassTabContent();
  showToast('Stream updated!');
}
