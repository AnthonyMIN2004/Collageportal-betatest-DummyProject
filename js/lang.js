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
      "gate-label": "Enter Student ID to Begin",
      "task-input-placeholder": "New quick task...",
      "tasks-title": "Urgent Tasks",
      "breadcrumb-workspace": "Collegiate Workspace",
      "today-classes-title": "Today's Class Schedule",
      "today-classes-subtitle": "CORE DAILY PERIODS",
      "view-grid-lbl": "Full Week Grid ➔",
      "click-tip-lbl":
        "Click any class block to view syllabus, assignment targets, and professor logs.",
      "events-card-title": "Live Campus Events",

      "exams-card-title": "Upcoming Exams",
      "all-classes-header": "All Enrolled Classes",
      "all-classes-sub":
        "Click on a card below to enter class detail modes, check scripts, or review live shared materials.",
      "weekly-schedule-header": "Weekly Timetable Layout",
      "weekly-schedule-sub":
        "Your structured curriculum planner for the active collegiate semester.",
      "reviews-header": "Anonymous Course Reviews",
      "reviews-sub":
        "Submit honest course descriptions. Everything is verified strictly through local student ID sandboxing.",
      "anon-lock-shield": "Strict Privacy Lock Active",
      "feedback-form-title": "Write Class Feedback",
      "rv-body-placeholder": "How was this class for you? Add details...",
      "reminder-card-title": "Don't Forget Today!",
      "reminder-card-subtitle": "ITEMS TO BRING FOR TODAY'S CLASSES",
    },
    ja: {
      "gate-label": "学籍番号を入力してください",
      "task-input-placeholder": "新しいクイックタスク...",
      "tasks-title": "緊急タスク",
      "breadcrumb-workspace": "コレギエイト講義ポータル",
      "today-classes-title": "本日の講義時間割",
      "today-classes-subtitle": "今日の授業日程",
      "view-grid-lbl": "週間の時間割を表示 ➔",
      "click-tip-lbl":
        "時間割ブロックを選択すると、講義詳細、シラバス、課題、コード共有等を表示できます。",
      "events-card-title": "学内イベント最新情報",

      "exams-card-title": "近日の試験一覧",
      "all-classes-header": "履修授業一覧",
      "all-classes-sub":
        "ブロックを選択すると、コードスニペットの共有や実習生同士のリアルタイム通信が可能です。",
      "weekly-schedule-header": "週間タイムテーブル",
      "weekly-schedule-sub": "今期セメスターの曜日ごとの時間割一覧。",
      "reviews-header": "匿名講義レビュー",
      "reviews-sub":
        "他の学生のために講義の評価・感想を登録できます。登録は完全に匿名で保護されています。",
      "anon-lock-shield": "匿名接続保護中",
      "feedback-form-title": "新規レビュー投稿",
      "rv-body-placeholder":
        "課題量、単位取得難易度、授業内容の感想を書いてください...",
      "reminder-card-title": "今日の持ち物チェック！",
      "reminder-card-subtitle": "本日の授業に必要な持ち物",
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
  setPlaceholder("task-input", s["task-input-placeholder"]);
  setTxt("tasks-title", s["tasks-title"]);
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
