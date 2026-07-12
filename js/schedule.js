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
  document.getElementById("full-schedule").innerHTML = days
    .map((day) => {
      const cls = SCHEDULE[day] || [];
      const isToday = day === TODAY;
      if (!cls.length) return "";
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
              <div class="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                <span class="text-[9px] font-black tracking-wide text-brand-600 block mb-0.5">${p.start} - ${p.end}</span>
                <span class="text-xs font-black text-slate-800 block">${c.name}</span>
                <span class="text-[9px] text-slate-400 font-bold block mt-0.5">📍 Room ${c.room} &bull; Period ${c.period}</span>
              </div>
            `;
                  })
                  .join("")
              : `<p class="text-[10px] text-slate-400 font-bold text-center py-6 bg-slate-50/50 rounded-xl">No classes 🎉</p>`
          }
        </div>
      </div>
    `;
    })
    .join("");
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

      return `
      <div onclick="switchTab('classes'); showClassDetail('${e.name.replace(/'/g, "\\'")}')"
     class="p-3 bg-slate-50 border border-slate-200/50 rounded-2xl flex items-center justify-between gap-3 cursor-pointer hover:border-brand-500 hover:shadow-md transition-all">
        <div class="min-w-0">
          <h4 class="text-xs font-black text-slate-800 truncate">${e.name}</h4>
          <span class="text-[10px] text-slate-400 font-bold block mt-0.5">📅 ${e.date} &bull; Room ${e.room}</span>
        </div>
        <span class="px-2 py-1 text-[9px] font-black rounded-lg ${pillColor} flex-shrink-0">${leftText}</span>
      </div>
    `;
    })
    .join("");
}

function renderEvents() {
  const list = document.getElementById("events-feed");
  list.innerHTML = EVENTS.map(
    (e) => `
    <div class="flex items-start gap-3">
      <div class="bg-brand-50 border border-brand-100 text-brand-600 font-black rounded-xl p-2 text-center min-w-[45px]">
        <span class="text-[8px] tracking-wider uppercase block">${e.month}</span>
        <span class="text-sm font-black leading-none block mt-0.5">${e.day}</span>
      </div>
      <div class="min-w-0">
        <h4 class="text-xs font-black text-slate-800 truncate">${e.name}</h4>
        <p class="text-[10px] text-slate-400 font-bold mt-0.5 truncate">${e.detail}</p>
      </div>
    </div>
  `,
  ).join("");
}
