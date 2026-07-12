// ── COLLEGIATE PORTAL | REMINDER.JS ──
// "Don't Forget Today!" bring items checklist.
// Checked state renders from sessionStorage (fast, works offline);
// when online it also syncs with /my/checklist so it follows the
// student across devices.

async function syncChecklistFromServer() {
  if (!API.online) return;
  try {
    const rows = await apiFetch('/my/checklist?day=' + TODAY);
    const storageKey = `kiritan_reminder_${new Date().toDateString()}`;
    const checked = rows.filter(r => r.checked).map(r => r.item);
    sessionStorage.setItem(storageKey, JSON.stringify(checked));
    renderBringReminder();
  } catch (e) {
    console.warn('Checklist sync failed, using local state:', e);
  }
}

function renderBringReminder() {
  const container = document.getElementById('bring-reminder-container');
  if (!container) return;

  const todayClasses = SCHEDULE[TODAY] || [];

  if (!todayClasses.length) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-6 text-center gap-2">
        <span class="text-3xl">🏝️</span>
        <p class="text-xs font-bold text-slate-400">${lang === 'en' ? 'No classes today — nothing to bring!' : '今日は授業なし。何も持たなくていい！'}</p>
      </div>
    `;
    return;
  }

  // Collect all unique items across today's classes, grouped by class
  const classGroups = todayClasses.map(c => {
    const items = CLASS_BRING_ITEMS[c.name] || [{ icon: '📓', item: 'Notebook' }, { icon: '✏️', item: 'Pen' }];
    const period = PERIODS[c.period - 1];
    const status = getStatus(period.start, period.end);
    return { class: c, items, period, status };
  });

  // Build a deduplicated master checklist with source class tags
  const masterMap = new Map();
  classGroups.forEach(group => {
    group.items.forEach(item => {
      const key = item.item;
      if (!masterMap.has(key)) {
        masterMap.set(key, { ...item, classes: [group.class.name] });
      } else {
        const existing = masterMap.get(key);
        if (!existing.classes.includes(group.class.name)) {
          existing.classes.push(group.class.name);
        }
      }
    });
  });

  const masterItems = Array.from(masterMap.values());

  // Load checked state from sessionStorage (resets each day)
  const storageKey = `kiritan_reminder_${new Date().toDateString()}`;
  let checkedItems = JSON.parse(sessionStorage.getItem(storageKey) || '[]');

  const allChecked = masterItems.every(i => checkedItems.includes(i.item));

  container.innerHTML = `
    <!-- Master checklist -->
    <div class="space-y-2" id="reminder-checklist">
      ${masterItems.map(item => {
        const isChecked = checkedItems.includes(item.item);
        const classTag = item.classes.length === 1
          ? `<span class="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">${item.classes[0]}</span>`
          : `<span class="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">${item.classes.length} classes</span>`;

        return `
          <div onclick="toggleReminderItem('${item.item.replace(/'/g, "\\'")}')"
               class="reminder-item flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none
               ${isChecked
                 ? 'bg-emerald-50 border-emerald-200 opacity-70'
                 : 'bg-white border-slate-200 hover:border-brand-400 hover:bg-brand-50/30'
               }">
            <div class="w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all
              ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}">
              ${isChecked ? '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : ''}
            </div>
            <span class="text-base">${item.icon}</span>
            <span class="text-xs font-bold flex-1 ${isChecked ? 'line-through text-slate-400' : 'text-slate-700'}">${item.item}</span>
            ${classTag}
          </div>
        `;
      }).join('')}
    </div>

    <!-- Progress bar -->
    <div class="mt-4 pt-4 border-t border-slate-100">
      <div class="flex items-center justify-between mb-2">
        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          ${lang === 'en' ? 'Packed' : '準備完了'}
        </span>
        <span class="text-[10px] font-black ${allChecked ? 'text-emerald-600' : 'text-brand-600'}">
          ${checkedItems.filter(c => masterItems.find(m => m.item === c)).length}/${masterItems.length}
        </span>
      </div>
      <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div class="h-2 rounded-full transition-all duration-500 ${allChecked ? 'bg-emerald-500' : 'bg-brand-500'}"
             style="width: ${masterItems.length ? (checkedItems.filter(c => masterItems.find(m => m.item === c)).length / masterItems.length * 100) : 0}%">
        </div>
      </div>
      ${allChecked ? `
        <div class="mt-3 text-center">
          <span class="text-xs font-black text-emerald-600">
            ${lang === 'en' ? '🎒 All packed! Ready for class!' : '🎒 準備完了！いってらっしゃい！'}
          </span>
        </div>
      ` : ''}
    </div>

    <!-- Per-class breakdown (collapsible) -->
    <div class="mt-4 pt-4 border-t border-slate-100 space-y-2">
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
        ${lang === 'en' ? 'By Class' : '授業ごとの持ち物'}
      </p>
      ${classGroups.map(group => {
        const statusDot = group.status === 'now'
          ? '<span class="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse inline-block"></span>'
          : group.status === 'done'
          ? '<span class="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block"></span>'
          : '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>';

        return `
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div class="flex items-center gap-2 mb-2">
              ${statusDot}
              <span class="text-[10px] font-black text-slate-700">${group.class.name}</span>
              <span class="text-[9px] font-bold text-slate-400 ml-auto">${group.period.start}</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              ${group.items.map(i => `
                <span class="text-[9px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-slate-600">
                  ${i.icon} ${i.item}
                </span>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function toggleReminderItem(itemName) {
  const storageKey = `kiritan_reminder_${new Date().toDateString()}`;
  let checkedItems = JSON.parse(sessionStorage.getItem(storageKey) || '[]');

  let nowChecked;
  if (checkedItems.includes(itemName)) {
    checkedItems = checkedItems.filter(i => i !== itemName);
    nowChecked = false;
  } else {
    checkedItems.push(itemName);
    nowChecked = true;
    showToast(lang === 'en' ? `✓ ${itemName} packed!` : `✓ ${itemName} チェック！`);
  }

  sessionStorage.setItem(storageKey, JSON.stringify(checkedItems));
  renderBringReminder();

  // Mirror to the server in the background (fine if it fails — local wins)
  if (API.online) {
    apiFetch('/my/checklist', {
      method: 'POST',
      body: JSON.stringify({ item: itemName, day: TODAY, checked: nowChecked }),
    }).catch(e => console.warn('Checklist save failed:', e));
  }
}
