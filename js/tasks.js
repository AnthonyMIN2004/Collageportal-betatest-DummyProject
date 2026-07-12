// ── COLLEGIATE PORTAL | TASKS.JS ──
// Quick tasks sidebar checklist

let quickTasks = [];

function loadQuickTasks() {
  const saved = localStorage.getItem('kiritan_dashboard_tasks');
  if (saved) {
    quickTasks = JSON.parse(saved);
  } else {
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
  const input = document.getElementById('task-input');
  const text = input.value.trim();
  if (!text) return;
  quickTasks.push({ id: Date.now().toString(), text, done: false });
  input.value = '';
  saveQuickTasks();
  showToast(lang === 'en' ? 'Quick task added!' : 'タスクを追加しました！');
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
  const listEl = document.getElementById('quick-tasks-list');
  listEl.innerHTML = '';
  let completedCount = 0;

  quickTasks.forEach(task => {
    if (task.done) completedCount++;
    const card = document.createElement('div');
    card.className = 'flex items-center justify-between gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/60 transition-colors';
    card.innerHTML = `
      <div class="flex items-center gap-2 min-w-0">
        <input type="checkbox" ${task.done ? 'checked' : ''} onchange="toggleQuickTask('${task.id}')" class="rounded border-slate-300 text-brand-500 focus:ring-brand-500 w-3 h-3">
        <span class="text-[10px] font-bold ${task.done ? 'line-through text-slate-400' : 'text-slate-700'} truncate">${escHtml(task.text)}</span>
      </div>
      <button onclick="deleteQuickTask('${task.id}')" class="text-slate-400 hover:text-rose-500 text-[10px] font-black leading-none p-1 transition-colors">✕</button>
    `;
    listEl.appendChild(card);
  });

  document.getElementById('task-completed-ratio').textContent = `${completedCount}/${quickTasks.length}`;
}

// Allow Enter key to add task
document.getElementById('task-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addQuickTask();
});
