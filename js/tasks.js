// ── COLLEGIATE PORTAL | TASKS.JS ──
// Quick tasks checklist. The same list is shown in two places
// (desktop sidebar + mobile card), so we render into every element
// tagged with data-role instead of relying on a single id.

let quickTasks = [];

function loadQuickTasks() {
  const saved = localStorage.getItem('kiritan_dashboard_tasks');
  if (saved) {
    quickTasks = JSON.parse(saved);
  } else {
    // First visit: give the student a few sample tasks so the card isn't empty
    quickTasks = [
      { id: '1', text: 'Finish DX社会学 homework', done: false },
      { id: '2', text: 'Review Python API connection codes', done: false },
      { id: '3', text: 'Check campus open day guide', done: true }
    ];
    saveQuickTasks();
  }
}

function saveQuickTasks() {
  localStorage.setItem('kiritan_dashboard_tasks', JSON.stringify(quickTasks));
  renderQuickTasks();
}

function addQuickTask() {
  // Two inputs exist (desktop + mobile) — take whichever one has text
  const input = [...document.querySelectorAll('[data-role="task-input"]')]
    .find(i => i.value.trim());
  if (!input) return;
  const text = input.value.trim();
  quickTasks.push({ id: Date.now().toString(), text, done: false });
  input.value = '';
  saveQuickTasks();
  showToast(lang === 'en' ? 'Task added!' : 'タスクを追加しました！');
}

function toggleQuickTask(id) {
  quickTasks = quickTasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveQuickTasks();
}

function deleteQuickTask(id) {
  quickTasks = quickTasks.filter(t => t.id !== id);
  saveQuickTasks();
  showToast(lang === 'en' ? 'Task deleted.' : 'タスクを削除しました。');
}

function renderQuickTasks() {
  const completedCount = quickTasks.filter(t => t.done).length;

  const cardsHtml = quickTasks.map(task => `
    <div class="flex items-center justify-between gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/60 transition-colors">
      <div class="flex items-center gap-2 min-w-0">
        <input type="checkbox" ${task.done ? 'checked' : ''} onchange="toggleQuickTask('${task.id}')" class="rounded border-slate-300 text-brand-500 focus:ring-brand-500 w-3 h-3">
        <span class="text-[10px] font-bold ${task.done ? 'line-through text-slate-400' : 'text-slate-700'} truncate">${escHtml(task.text)}</span>
      </div>
      <button onclick="deleteQuickTask('${task.id}')" class="text-slate-400 hover:text-rose-500 text-[10px] font-black leading-none p-1 transition-colors">✕</button>
    </div>
  `).join('');

  document.querySelectorAll('[data-role="task-list"]').forEach(el => {
    el.innerHTML = cardsHtml;
  });
  document.querySelectorAll('[data-role="task-ratio"]').forEach(el => {
    el.textContent = `${completedCount}/${quickTasks.length}`;
  });
}

// Enter key adds the task, from either input
document.querySelectorAll('[data-role="task-input"]').forEach(input => {
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') addQuickTask();
  });
});
