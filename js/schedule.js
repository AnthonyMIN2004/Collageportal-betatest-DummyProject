// ── COLLEGIATE PORTAL | SCHEDULE.JS ──
// Today's classes, weekly timetable, next class timer, mascot speech

function updateGreeting() {
  document.getElementById("welcome-msg").textContent =
    lang === "en"
      ? "Collegiate Portal System"
      : "大阪キリスト教短期大学 ポータル";
  document.getElementById("dashboard-banner-title").textContent =
    lang === "en"
      ? `Welcome Back, Student #${studentId}!`
      : `おかえりなさい、学生 #${studentId} さん✨`;
  document.getElementById("user-id-lbl").textContent = `Student #${studentId}`;
  document.getElementById("user-avatar").textContent = studentId.slice(-1);
}

function renderMascotSpeech() {
  const h = new Date().getHours();
  const cls = SCHEDULE[TODAY] || [];
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const upcoming = cls.filter((c) => {
    const p = PERIODS[c.period - 1];
    return timeToMins(p.start) > now;
  });
  const nearExam = EXAMS.find((e) => {
    const d = Math.ceil((new Date(e.date) - new Date()) / 86400000);
    return d >= 0 && d <= 7;
  });

  let msg = "";
  if (lang === "en") {
    if (nearExam)
      msg = `⚠️ ${nearExam.name} test is in ${Math.ceil((new Date(nearExam.date) - new Date()) / 86400000)} days! Start studying early!`;
    else if (upcoming.length)
      msg = `Next Class: ${upcoming[0].name} at ${PERIODS[upcoming[0].period - 1].start}. Get ready! 📖`;
    else if (!cls.length)
      msg = "Sweet! No classes on today's program. Enjoy your freedom! 🏝️";
    else if (h < 12)
      msg = "Good morning! Grab a coffee and review your tasks for today. ☕";
    else if (h > 18)
      msg = "Fantastic job today! Unwind and get some well-deserved sleep. 🌙";
    else
      msg = "Keep pushing forward! You're making excellent progress today! ✨";
  } else {
    if (nearExam)
      msg = `⚠️「${nearExam.name}」のテストまであと ${Math.ceil((new Date(nearExam.date) - new Date()) / 86400000)} 日だよ！試験対策を忘れずにね。`;
    else if (upcoming.length)
      msg = `次は ${PERIODS[upcoming[0].period - 1].start} から「${upcoming[0].name}」が始まるよ！準備しよ！📖`;
    else if (!cls.length)
      msg =
        "今日の授業時間割は全部お休み！自分の好きな勉強や趣味を楽しもう！🎉";
    else if (h < 12)
      msg =
        "おはよう！今日も素晴らしい一日になりますように。朝ごはんは食べた？🍳";
    else if (h > 18)
      msg = "今日もお疲れ様！温かいお風呂に浸かって、ゆっくり脳を休めてね。🌙";
    else
      msg =
        "自分のペースで進もう。きりたんはいつでも君の学びをサポートしているよ！✨";
  }

  document.getElementById("mascot-speech-lbl").textContent = msg;
}

function renderTodayClasses() {
  const container = document.getElementById("today-classes-container");
  const cls = SCHEDULE[TODAY] || [];

  if (!cls.length) {
    const msg =
      lang === "en"
        ? "No classes scheduled today! Rest, relax and recharge."
        : "本日は時間割に講義がありません。ゆっくり休みましょう！🏝️";
    container.innerHTML = `
      <div class="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center">
        <span class="text-3xl block mb-2">🏝️</span>
        <p class="text-xs font-bold text-slate-500">${msg}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = cls
    .map((c) => {
      const p = PERIODS[c.period - 1];
      const status = getStatus(p.start, p.end);

      let borderStyle = "border-slate-200/80";
      let pillClass = "bg-slate-100 text-slate-500";
      let statusPill = "";

      if (status === "now") {
        borderStyle = "border-brand-500 shadow-md shadow-brand-500/5";
        pillClass = "bg-brand-500 text-white";
        statusPill = `<span class="bg-brand-500 text-white text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase ml-2 animate-pulse">${lang === "en" ? "ACTIVE NOW" : "授業中"}</span>`;
      } else if (status === "done") {
        borderStyle = "border-slate-100 opacity-60";
        pillClass = "bg-slate-100 text-slate-400";
      }

      return `
      <div onclick="switchTab('classes'); showClassDetail('${c.name.replace(/'/g, "\\'")}')"
           class="p-4 bg-white border ${borderStyle} hover:border-brand-500 hover:shadow-md hover:-translate-y-0.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all cursor-pointer">
        <div class="flex items-center gap-3">
          <div class="px-3 py-1.5 rounded-xl font-mono font-black text-xs ${pillClass}">
            ${p.start} - ${p.end}
          </div>
          <div>
            <h4 class="text-xs font-black text-slate-900 flex items-center">${c.name} ${statusPill}</h4>
            <p class="text-[10px] font-bold text-slate-400 mt-0.5">📍 Room ${c.room} &bull; Period ${c.period}</p>
          </div>
        </div>
        <button class="px-3 py-1.5 bg-slate-100 hover:bg-brand-500 hover:text-white rounded-lg text-[10px] font-black text-slate-700 transition-all sm:self-auto">
          ${lang === "en" ? "View Details" : "詳細表示"}
        </button>
      </div>
    `;
    })
    .join("");
}

function updateNextClassTimer() {
  const container = document.getElementById("next-class-countdown");
  const cls = SCHEDULE[TODAY] || [];
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const nextClass = cls.find((c) => {
    const p = PERIODS[c.period - 1];
    return timeToMins(p.start) > currentMinutes;
  });

  if (nextClass) {
    const p = PERIODS[nextClass.period - 1];
    const diff = timeToMins(p.start) - currentMinutes;
    container.textContent =
      lang === "en"
        ? `Next class starts in ${diff} minutes`
        : `次の授業まであと ${diff} 分`;
  } else {
    container.textContent =
      lang === "en"
        ? "All periods completed today!"
        : "今日のすべての授業時限が終了しました！";
  }
}

function renderFullSchedule() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const canEdit = isAdmin && API.online;

  document.getElementById("full-schedule").innerHTML = days
    .map((day) => {
      const cls = SCHEDULE[day] || [];
      const isToday = day === TODAY;
      // Admin sees every weekday (needs the empty ones to add classes);
      // students only see days that have classes.
      if (!cls.length && !(canEdit && day !== "Sat")) return "";
      const dayDisplay = isToday
        ? lang === "en"
          ? `${day} (Today)`
          : `${day} (本日)`
        : day;

      return `
      <div class="bg-white border ${isToday ? "border-brand-500 shadow-md shadow-brand-500/5 ring-1 ring-brand-100" : "border-slate-200/80"} rounded-3xl p-5 shadow-sm space-y-3">
        <h3 class="font-extrabold text-xs tracking-wider uppercase ${isToday ? "text-brand-600" : "text-slate-400"}">${dayDisplay}</h3>
        <div class="space-y-2">
          ${
            cls.length
              ? cls
                  .map((c) => {
                    const p = PERIODS[c.period - 1];
                    return `
              <div class="p-3 bg-slate-50 border border-slate-150 rounded-xl relative">
                ${canEdit && c.id != null ? `<button onclick="adminDeleteMeeting(${c.id})" title="Remove from timetable" class="absolute top-2 right-2 text-rose-400 hover:text-rose-600 font-black text-xs px-1 transition-all">✕</button>` : ''}
                <span class="text-[9px] font-black tracking-wide text-brand-600 block mb-0.5">${p.start} - ${p.end}</span>
                <span class="text-xs font-black text-slate-800 block">${escHtml(c.name)}</span>
                <span class="text-[9px] text-slate-400 font-bold block mt-0.5">📍 Room ${escHtml(c.room)} &bull; Period ${c.period}</span>
              </div>
            `;
                  })
                  .join("")
              : `<p class="text-[10px] text-slate-400 font-bold text-center py-6 bg-slate-50/50 rounded-xl">No classes 🎉</p>`
          }
          ${canEdit && day !== "Sat" ? `
            <div class="border-t border-slate-100 pt-2 space-y-1.5">
              <input type="text" id="mt-name-${day}" placeholder="${lang === 'en' ? 'Class name' : '講義名'}" class="w-full text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-brand-500 font-semibold bg-slate-50/50">
              <div class="flex gap-1.5">
                <select id="mt-period-${day}" class="flex-1 text-[10px] px-1.5 py-1.5 rounded-lg border border-slate-200 outline-none font-semibold bg-slate-50/50">
                  ${PERIODS.map(p => `<option value="${p.num}">P${p.num} ${p.start}</option>`).join('')}
                </select>
                <input type="text" id="mt-room-${day}" placeholder="Room" class="w-14 text-[10px] px-2 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-brand-500 font-semibold bg-slate-50/50">
              </div>
              <div class="flex gap-1.5">
                <select id="mt-type-${day}" class="flex-1 text-[10px] px-1.5 py-1.5 rounded-lg border border-slate-200 outline-none font-semibold bg-slate-50/50">
                  <option value="general">📚 Lecture</option>
                  <option value="code">💻 Code</option>
                  <option value="seminar">💡 Seminar</option>
                  <option value="sport">⚽ Sport</option>
                </select>
                <button onclick="adminAddMeeting('${day}')" class="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-black text-[10px] transition-all">＋</button>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    })
    .join("");
}

async function adminAddMeeting(day) {
  const name = document.getElementById('mt-name-' + day).value.trim();
  const period = parseInt(document.getElementById('mt-period-' + day).value);
  const room = document.getElementById('mt-room-' + day).value.trim() || 'TBD';
  const type = document.getElementById('mt-type-' + day).value;
  if (!name) {
    showToast(lang === 'en' ? '⚠️ Enter a class name.' : '⚠️ 講義名を入力してください。');
    return;
  }
  try {
    await apiFetch('/admin/meetings', {
      method: 'POST',
      body: JSON.stringify({ day, period, name, room, type }),
    });
    await refreshCurriculum();
    showToast(lang === 'en' ? '📅 Class added to the timetable!' : '📅 時間割に追加しました！');
  } catch (e) {
    showToast('⚠️ ' + e.message);
  }
}

async function adminDeleteMeeting(id) {
  const allow = await showCustomConfirm(
    lang === 'en' ? 'Remove Class' : '授業を削除',
    lang === 'en' ? 'Remove this class from the weekly timetable?' : 'この授業を時間割から削除しますか？',
    lang === 'en' ? 'Remove' : '削除する',
    lang === 'en' ? 'Cancel' : 'キャンセル'
  );
  if (!allow) return;
  try {
    await apiFetch('/admin/meetings/' + id, { method: 'DELETE' });
    await refreshCurriculum();
    showToast(lang === 'en' ? 'Class removed.' : '授業を削除しました。');
  } catch (e) {
    showToast('⚠️ ' + e.message);
  }
}

function renderExams() {
  const list = document.getElementById("exams-feed");
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const validExams = EXAMS.filter((e) => {
    const diff = Math.ceil((new Date(e.date) - now) / 86400000);
    return diff >= 0;
  });

  list.innerHTML = validExams
    .map((e) => {
      const diff = Math.ceil((new Date(e.date) - now) / 86400000);
      const pillColor =
        diff <= 7
          ? "bg-rose-50 text-rose-600 border border-rose-100"
          : "bg-blue-50 text-blue-600 border border-blue-100";
      const leftText = lang === "en" ? `${diff} days left` : `あと ${diff} 日`;

      // stopPropagation: the ✕ sits inside a clickable card — without it
      // deleting an exam would also open the class detail view
      const deleteBtn = isAdmin && API.online && e.id != null
        ? `<button onclick="event.stopPropagation(); adminDeleteExam(${e.id})" title="Delete exam" class="text-rose-400 hover:text-rose-600 font-black text-xs px-1.5 flex-shrink-0 transition-all">✕</button>`
        : '';

      return `
      <div onclick="switchTab('classes'); showClassDetail('${e.name.replace(/'/g, "\\'")}')"
     class="p-3 bg-slate-50 border border-slate-200/50 rounded-2xl flex items-center justify-between gap-3 cursor-pointer hover:border-brand-500 hover:shadow-md transition-all">
        <div class="min-w-0">
          <h4 class="text-xs font-black text-slate-800 truncate">${escHtml(e.name)}</h4>
          <span class="text-[10px] text-slate-400 font-bold block mt-0.5">📅 ${e.date} &bull; Room ${escHtml(e.room || 'TBD')}</span>
        </div>
        <span class="px-2 py-1 text-[9px] font-black rounded-lg ${pillColor} flex-shrink-0">${leftText}</span>
        ${deleteBtn}
      </div>
    `;
    })
    .join("");

  // Admin: schedule a new exam (class picker keeps names consistent
  // with the timetable, since exams join to classes by name)
  if (isAdmin && API.online) {
    list.innerHTML += `
      <div class="border-t border-slate-100 pt-3 space-y-2">
        <select id="ex-class" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-brand-500 font-semibold bg-slate-50/50">
          ${ALL_CLASSES.map(n => `<option value="${escHtml(n)}">${escHtml(n)}</option>`).join('')}
        </select>
        <div class="flex gap-2">
          <input type="date" id="ex-date" class="flex-1 min-w-0 text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-brand-500 font-semibold bg-slate-50/50">
          <input type="text" id="ex-room" placeholder="Room" class="w-20 text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-brand-500 font-semibold bg-slate-50/50">
          <button onclick="adminAddExam()" class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-black text-xs transition-all">＋</button>
        </div>
        <input type="text" id="ex-topics" placeholder="${lang === 'en' ? 'Topics (optional)' : '出題範囲（任意）'}" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-brand-500 font-semibold bg-slate-50/50">
      </div>
    `;
  }
}

async function adminAddExam() {
  const name = document.getElementById('ex-class').value;
  const date = document.getElementById('ex-date').value;
  const room = document.getElementById('ex-room').value.trim() || 'TBD';
  const topics = document.getElementById('ex-topics').value.trim();
  if (!date) {
    showToast(lang === 'en' ? '⚠️ Pick an exam date.' : '⚠️ 試験日を選んでください。');
    return;
  }
  try {
    await apiFetch('/admin/exams', {
      method: 'POST',
      body: JSON.stringify({ name, date, room, topics }),
    });
    await refreshCurriculum();
    showToast(lang === 'en' ? '📝 Exam scheduled!' : '📝 試験を登録しました！');
  } catch (e) {
    showToast('⚠️ ' + e.message);
  }
}

async function adminDeleteExam(id) {
  const allow = await showCustomConfirm(
    lang === 'en' ? 'Delete Exam' : '試験を削除',
    lang === 'en' ? 'Remove this exam from the countdown?' : 'この試験を削除しますか？',
    lang === 'en' ? 'Delete' : '削除する',
    lang === 'en' ? 'Cancel' : 'キャンセル'
  );
  if (!allow) return;
  try {
    await apiFetch('/admin/exams/' + id, { method: 'DELETE' });
    await refreshCurriculum();
    showToast(lang === 'en' ? 'Exam deleted.' : '試験を削除しました。');
  } catch (e) {
    showToast('⚠️ ' + e.message);
  }
}

function renderEvents() {
  const list = document.getElementById("events-feed");
  const canModerate = isAdmin && API.online;

  list.innerHTML = EVENTS.map(
    (e) => `
    <div class="flex items-start gap-3">
      <div class="bg-brand-50 border border-brand-100 text-brand-600 font-black rounded-xl p-2 text-center min-w-[45px]">
        <span class="text-[8px] tracking-wider uppercase block">${e.month}</span>
        <span class="text-sm font-black leading-none block mt-0.5">${e.day}</span>
      </div>
      <div class="min-w-0 flex-1">
        <h4 class="text-xs font-black text-slate-800 truncate">${escHtml(e.name)}</h4>
        <p class="text-[10px] text-slate-400 font-bold mt-0.5 truncate">${escHtml(e.detail)}</p>
      </div>
      ${canModerate && e.id != null ? `<button onclick="adminDeleteEvent(${e.id})" title="Delete event" class="text-rose-400 hover:text-rose-600 font-black text-xs px-1.5 transition-all">✕</button>` : ''}
    </div>
  `,
  ).join("");

  // Admin: quick add form at the bottom of the events card
  if (canModerate) {
    list.innerHTML += `
      <div class="border-t border-slate-100 pt-3 space-y-2">
        <input type="text" id="ev-name" placeholder="${lang === 'en' ? 'Event name' : 'イベント名'}" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-brand-500 font-semibold bg-slate-50/50">
        <div class="flex gap-2">
          <input type="date" id="ev-date" class="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-brand-500 font-semibold bg-slate-50/50">
          <button onclick="adminAddEvent()" class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-black text-xs transition-all">＋</button>
        </div>
        <input type="text" id="ev-detail" placeholder="${lang === 'en' ? 'Detail (optional)' : '詳細（任意）'}" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-brand-500 font-semibold bg-slate-50/50">
      </div>
    `;
  }
}

// Re-fetch just the events list (after an admin add/delete)
async function reloadEvents() {
  try {
    EVENTS = mapEvents(await apiFetch('/share/events'));
    renderEvents();
  } catch (e) {
    console.warn('Events reload failed:', e);
  }
}

async function adminAddEvent() {
  const name = document.getElementById('ev-name').value.trim();
  const date = document.getElementById('ev-date').value;
  const detail = document.getElementById('ev-detail').value.trim();
  if (!name || !date) {
    showToast(lang === 'en' ? '⚠️ Event needs a name and a date.' : '⚠️ イベント名と日付を入力してください。');
    return;
  }
  try {
    await apiFetch('/share/events', {
      method: 'POST',
      body: JSON.stringify({ name, date, detail: detail || null }),
    });
    await reloadEvents();
    showToast(lang === 'en' ? '📢 Event added!' : '📢 イベントを追加しました！');
  } catch (e) {
    showToast('⚠️ ' + e.message);
  }
}

async function adminDeleteEvent(id) {
  const allow = await showCustomConfirm(
    lang === 'en' ? 'Delete Event' : 'イベントを削除',
    lang === 'en' ? 'Remove this event from the campus feed?' : 'このイベントを削除しますか？',
    lang === 'en' ? 'Delete' : '削除する',
    lang === 'en' ? 'Cancel' : 'キャンセル'
  );
  if (!allow) return;
  try {
    await apiFetch('/share/events/' + id, { method: 'DELETE' });
    await reloadEvents();
    showToast(lang === 'en' ? 'Event deleted.' : 'イベントを削除しました。');
  } catch (e) {
    showToast('⚠️ ' + e.message);
  }
}
