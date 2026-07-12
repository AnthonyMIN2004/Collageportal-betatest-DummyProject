// ── COLLEGIATE PORTAL | LANG.JS ──
// Bilingual EN/JA toggle system

let lang = "en";

function toggleLang() {
  lang = lang === "en" ? "ja" : "en";
  document.getElementById("lang-btn-lbl").textContent =
    lang === "en" ? "🌐 日本語" : "🌐 English";

  document.querySelectorAll(".lbl-txt").forEach((el) => {
    el.textContent = lang === "en" ? el.dataset.en : el.dataset.ja;
  });
  const gateLangBtn = document.getElementById("gate-lang-btn");
  if (gateLangBtn)
    gateLangBtn.textContent = lang === "en" ? "🌐 日本語" : "🌐 English";
  const strings = {
    en: {
      "gate-label": "Sign in with your Student ID",
      "gate-hint": "Default password = your student ID",
      "task-input-placeholder": "New task...",
      "tasks-title": "Quick Tasks",
      "breadcrumb-workspace": "Student Workspace",
      "today-classes-title": "Today's Classes",
      "today-classes-subtitle": "TODAY'S PERIODS",
      "view-grid-lbl": "Full Week ➔",
      "click-tip-lbl":
        "Tap a class to see its syllabus, exam info, and shared code.",
      "events-card-title": "Campus Events",

      "exams-card-title": "Upcoming Exams",
      "all-classes-header": "My Classes",
      "all-classes-sub":
        "Tap a card to see the syllabus, exam info, and shared code snippets.",
      "weekly-schedule-header": "Weekly Timetable",
      "weekly-schedule-sub": "Your class schedule for this semester.",
      "reviews-header": "Anonymous Course Reviews",
      "reviews-sub":
        "Share honest feedback about your classes. Posts are completely anonymous.",
      "anon-lock-shield": "100% Anonymous",
      "feedback-form-title": "Write a Review",
      "rv-body-placeholder": "How was this class for you?",
      "reminder-card-title": "Don't Forget Today!",
      "reminder-card-subtitle": "THINGS TO BRING FOR TODAY'S CLASSES",
    },
    ja: {
      "gate-label": "学籍番号でログイン",
      "gate-hint": "初期パスワードは学籍番号と同じです",
      "task-input-placeholder": "新しいタスク...",
      "tasks-title": "クイックタスク",
      "breadcrumb-workspace": "学生ワークスペース",
      "today-classes-title": "今日の授業",
      "today-classes-subtitle": "本日の時間割",
      "view-grid-lbl": "週間時間割を見る ➔",
      "click-tip-lbl":
        "授業をタップすると、シラバスや試験情報、共有コードが見られます。",
      "events-card-title": "キャンパスイベント",

      "exams-card-title": "近日の試験",
      "all-classes-header": "履修中の授業",
      "all-classes-sub":
        "カードをタップすると、シラバスや試験情報、共有コードが見られます。",
      "weekly-schedule-header": "週間時間割",
      "weekly-schedule-sub": "今学期の授業スケジュールです。",
      "reviews-header": "匿名レビュー",
      "reviews-sub":
        "授業の正直な感想をシェアしよう。投稿は完全に匿名です。",
      "anon-lock-shield": "完全匿名",
      "feedback-form-title": "レビューを書く",
      "rv-body-placeholder": "この授業はどうでしたか？",
      "reminder-card-title": "今日の持ち物チェック！",
      "reminder-card-subtitle": "今日の授業に必要な持ち物",
    },
  };

  const s = strings[lang];

  // Apply text content
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  const setPlaceholder = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.placeholder = val;
  };

  setTxt("gate-label", s["gate-label"]);
  setTxt("gate-hint", s["gate-hint"]);
  // Task input + title exist on both desktop and mobile
  document.querySelectorAll('[data-role="task-input"]').forEach((el) => {
    el.placeholder = s["task-input-placeholder"];
  });
  setTxt("tasks-title", s["tasks-title"]);
  setTxt("tasks-title-mobile", s["tasks-title"]);
  setTxt("today-classes-title", s["today-classes-title"]);
  setTxt("today-classes-subtitle", s["today-classes-subtitle"]);
  setTxt("view-grid-lbl", s["view-grid-lbl"]);
  setTxt("click-tip-lbl", s["click-tip-lbl"]);
  setTxt("events-card-title", s["events-card-title"]);

  setTxt("exams-card-title", s["exams-card-title"]);
  setTxt("all-classes-header", s["all-classes-header"]);
  setTxt("all-classes-sub", s["all-classes-sub"]);
  setTxt("weekly-schedule-header", s["weekly-schedule-header"]);
  setTxt("weekly-schedule-sub", s["weekly-schedule-sub"]);
  setTxt("reviews-header", s["reviews-header"]);
  setTxt("reviews-sub", s["reviews-sub"]);
  setTxt("anon-lock-shield", s["anon-lock-shield"]);
  setTxt("feedback-form-title", s["feedback-form-title"]);
  setTxt("reminder-card-title", s["reminder-card-title"]);
  setTxt("reminder-card-subtitle", s["reminder-card-subtitle"]);
  setPlaceholder("rv-body", s["rv-body-placeholder"]);

  const breadcrumbFirst = document.querySelector(
    "#breadcrumb-sub span:first-child",
  );
  if (breadcrumbFirst) breadcrumbFirst.textContent = s["breadcrumb-workspace"];

  // Re-render all dynamic components
  updateGreeting();
  renderTodayClasses();
  renderBringReminder();
  renderBlockGrid();
  renderFullSchedule();
  renderReviews();
  renderExams();
  renderEvents();
  renderMascotSpeech();
  updateNextClassTimer();
}
