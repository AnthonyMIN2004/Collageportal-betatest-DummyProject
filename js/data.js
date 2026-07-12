// ── COLLEGIATE PORTAL | DATA.JS ──
// Fallback sample data for offline mode. When the backend is reachable,
// syncFromServer() (js/api.js) replaces all of these with live data —
// that's why they are `let`, not `const`.

let PERIODS = [
  { num: 1, start: '09:00', end: '10:30' },
  { num: 2, start: '10:40', end: '12:10' },
  { num: 3, start: '13:10', end: '14:40' },
  { num: 4, start: '14:50', end: '16:20' },
  { num: 5, start: '16:30', end: '18:00' }
];

let SCHEDULE = {
  Mon: [
    { period: 1, name: 'DX社会学', room: '023', type: 'general' },
    { period: 2, name: '教育テック実学', room: '023', type: 'general' },
    { period: 3, name: '保育原理', room: '022', type: 'general' },
    { period: 4, name: '地域協働実践', room: '025', type: 'general' }
  ],
  Tue: [
    { period: 2, name: 'ゼミ', room: 'TBD', type: 'seminar' }
  ],
  Wed: [
    { period: 4, name: 'クラウドとビッグデータ', room: '023', type: 'code' },
    { period: 5, name: '聖書と現代人', room: '022', type: 'general' }
  ],
  Thu: [
    { period: 1, name: 'スポーツ実技', room: '体育館', type: 'sport' },
    { period: 4, name: 'WebUIデザイン html/css', room: '821', type: 'code' },
    { period: 5, name: 'WebスクリプトJS', room: '821', type: 'code' }
  ],
  Fri: [
    { period: 1, name: '並列計算', room: '023', type: 'code' },
    { period: 2, name: '生成AIによるpython', room: '821', type: 'code' }
  ],
  
};

let ALL_CLASSES = [...new Set(Object.values(SCHEDULE).flat().map(c => c.name))];

let EXAMS = [
  { name: 'WebUIデザイン html/css', date: '2026-07-10', room: '821', topics: 'HTML構造・CSSレイアウト・Flexbox' },
  { name: 'WebスクリプトJS', date: '2026-07-14', room: '821', topics: 'DOM操作・イベント・非同期処理' },
  { name: '生成AIによるpython', date: '2026-07-16', room: '821', topics: '基本構文・関数・APIコール' },
  { name: '並列計算', date: '2026-07-20', room: '023', topics: 'スレッド・並列処理の概念' },
];

let EVENTS = [
  { month: 'JUN', day: '20', name: 'オープンキャンパス', detail: 'メインホール 10:00〜' },
  { month: 'JUL', day: '10', name: '前期試験開始', detail: '時間割を確認すること' },
  { month: 'JUL', day: '25', name: '夏休み開始', detail: '良い夏を！🎉' },
];

let CLASS_INFO = {
  'DX社会学':               { icon: '🌐', desc: 'デジタル社会と社会学の交差点を探求します。', exam: null },
  '教育テック実学':          { icon: '🎓', desc: '教育テクノロジーの実践的な活用方法を学びます。', exam: null },
  '保育原理':                { icon: '👶', desc: '保育の基本原理と子どもの発達を学びます。', exam: null },
  '地域協働実践':            { icon: '🤝', desc: '地域社会との協働プロジェクトを実践します。', exam: null },
  'ゼミ':                    { icon: '💡', desc: '自由研究・プロジェクト発表のゼミです。', exam: null },
  'クラウドとビッグデータ':  { icon: '☁️', desc: 'クラウドインフラとデータ処理の基礎を学びます。', exam: null },
  '聖書と現代人':            { icon: '📖', desc: '聖書の教えと現代社会との関係を考察します。', exam: null },
  'スポーツ実技':            { icon: '⚽', desc: '体育館でのスポーツ実技。動きやすい服装で来ること！', exam: null },
  'WebUIデザイン html/css':  { icon: '🎨', desc: 'HTML・CSSを使ったWebデザインの基礎を学びます。', exam: EXAMS[0] },
  'WebスクリプトJS':         { icon: '⚡', desc: 'JavaScriptによるインタラクティブなWeb開発。', exam: EXAMS[1] },
  '並列計算':                { icon: '🔢', desc: '並列処理・マルチスレッドプログラミングを学びます。', exam: EXAMS[3] },
  '生成AIによるpython':      { icon: '🤖', desc: '生成AIとPythonプログラミングを組み合わせた実践。', exam: EXAMS[2] },
  
};

// ── BRING ITEMS REMINDER DATA ──
// Each class maps to items the student should bring
let CLASS_BRING_ITEMS = {
  'DX社会学':               [{ icon: '📓', item: 'Notebook' }, { icon: '✏️', item: 'Pen' }],
  '教育テック実学':          [{ icon: '💻', item: 'Laptop' }, { icon: '🔌', item: 'Charger' }, { icon: '📓', item: 'Notebook' }],
  '保育原理':                [{ icon: '📕', item: 'Textbook' }, { icon: '📓', item: 'Notebook' }, { icon: '✏️', item: 'Pen' }],
  '地域協働実践':            [{ icon: '📓', item: 'Notebook' }, { icon: '✏️', item: 'Pen' }, { icon: '📋', item: 'Project materials' }],
  'ゼミ':                    [{ icon: '💻', item: 'Laptop' }, { icon: '🔌', item: 'Charger' }, { icon: '💾', item: 'USB Drive' }, { icon: '📋', item: 'Research notes' }],
  'クラウドとビッグデータ':  [{ icon: '💻', item: 'Laptop' }, { icon: '🔌', item: 'Charger' }, { icon: '📓', item: 'Notebook' }],
  '聖書と現代人':            [{ icon: '📖', item: 'Bible' }, { icon: '📓', item: 'Notebook' }, { icon: '✏️', item: 'Pen' }],
  'スポーツ実技':            [{ icon: '👟', item: 'Sports shoes' }, { icon: '👕', item: 'Sports clothes' }, { icon: '🧴', item: 'Towel' }, { icon: '💧', item: 'Water bottle' }],
  'WebUIデザイン html/css':  [{ icon: '💻', item: 'Laptop' }, { icon: '🔌', item: 'Charger' }, { icon: '💾', item: 'USB Drive' }],
  'WebスクリプトJS':         [{ icon: '💻', item: 'Laptop' }, { icon: '🔌', item: 'Charger' }, { icon: '💾', item: 'USB Drive' }],
  '並列計算':                [{ icon: '💻', item: 'Laptop' }, { icon: '🔌', item: 'Charger' }, { icon: '📓', item: 'Notebook' }],
  '生成AIによるpython':      [{ icon: '💻', item: 'Laptop' }, { icon: '🔌', item: 'Charger' }, { icon: '💾', item: 'USB Drive' }],
  
};
