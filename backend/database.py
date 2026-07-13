# ── COLLEGIATE PORTAL | DATABASE.PY ──
# SQLiteの土台: 接続ヘルパー・テーブル作成・初期データ投入。
#
# SQLiteを選んだ理由: サーバー1台(Pi)・学生10人規模なら、これで全然足りる。
# ファイル1個(portal.db)がDB本体なので、バックアップ = ファイルコピーで済むのも楽。
#
# ⚠️ セキュリティの絶対ルール: SQLは必ず「?」プレースホルダーで書く。
# f文字列や+でSQLを組み立てるとSQLインジェクションで一発アウト。
# このプロジェクトの全クエリは ? 方式で統一してある。守って。

import os
import sqlite3

import auth
import seed_data

# portal.db lives next to this file
DB_PATH = os.environ.get("PORTAL_DB", os.path.join(os.path.dirname(__file__), "portal.db"))


def get_db():
    """接続を開いて返す。閉じるのは呼んだ側の責任(closeを忘れずに)。

    row_factory = sqlite3.Row にしておくと row["name"] みたいに
    カラム名でアクセスできる(デフォルトはタプルで row[0] とかになって読めない)。
    foreign_keys = ON はSQLiteだとデフォルトOFFという罠があるので毎回明示。"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Create tables if missing and seed initial data. Safe to run repeatedly."""
    conn = get_db()
    cur = conn.cursor()

    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id            TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            is_admin      INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS exams (
            id    INTEGER PRIMARY KEY AUTOINCREMENT,
            name  TEXT NOT NULL,
            date  TEXT NOT NULL,
            room  TEXT,
            class TEXT,
            topics TEXT
        );

        CREATE TABLE IF NOT EXISTS events (
            id     INTEGER PRIMARY KEY AUTOINCREMENT,
            name   TEXT NOT NULL,
            date   TEXT NOT NULL,
            detail TEXT
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            content TEXT NOT NULL,
            done    INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            class      TEXT NOT NULL,
            stars      INTEGER NOT NULL DEFAULT 0,
            difficulty TEXT,
            body       TEXT NOT NULL,
            ts         INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS checklist (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            item    TEXT NOT NULL,
            day     TEXT NOT NULL,
            checked INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS snippets (
            id     INTEGER PRIMARY KEY AUTOINCREMENT,
            class  TEXT NOT NULL,
            title  TEXT NOT NULL,
            code   TEXT NOT NULL,
            author TEXT NOT NULL,
            ts     INTEGER NOT NULL
        );

        -- A row here = that class has a live session running right now.
        -- Stopping the session deletes the row and its posts.
        CREATE TABLE IF NOT EXISTS live_sessions (
            class      TEXT PRIMARY KEY,
            started_by TEXT NOT NULL,
            ts         INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS live_posts (
            id    INTEGER PRIMARY KEY AUTOINCREMENT,
            class TEXT NOT NULL,
            sid   TEXT NOT NULL,
            code  TEXT NOT NULL,
            ts    INTEGER NOT NULL
        );

        -- Curriculum lives in the DB so admin can edit it from the portal.
        -- (Was hardcoded in seed_data.py — that's now just the initial seed.)
        CREATE TABLE IF NOT EXISTS class_meetings (
            id     INTEGER PRIMARY KEY AUTOINCREMENT,
            day    TEXT NOT NULL,      -- Mon..Fri
            period INTEGER NOT NULL,   -- 1..5
            name   TEXT NOT NULL,
            room   TEXT NOT NULL DEFAULT 'TBD',
            type   TEXT NOT NULL DEFAULT 'general'
        );

        CREATE TABLE IF NOT EXISTS class_info (
            name TEXT PRIMARY KEY,
            icon TEXT NOT NULL DEFAULT '📚',
            desc TEXT NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS bring_items (
            id    INTEGER PRIMARY KEY AUTOINCREMENT,
            class TEXT NOT NULL,
            icon  TEXT NOT NULL DEFAULT '📓',
            item  TEXT NOT NULL
        );
        """
    )

    _seed_users(cur)
    _seed_exams(cur)
    _seed_events(cur)
    _seed_curriculum(cur)

    conn.commit()
    conn.close()


def _seed_curriculum(cur):
    # First run only: copy the timetable/class info/bring items from
    # seed_data into the DB. After that, the DB is the source of truth
    # and admin edits it through /admin routes.
    cur.execute("SELECT COUNT(*) AS n FROM class_meetings")
    if cur.fetchone()["n"] == 0:
        for day, meetings in seed_data.SCHEDULE.items():
            for m in meetings:
                cur.execute(
                    "INSERT INTO class_meetings (day, period, name, room, type) VALUES (?, ?, ?, ?, ?)",
                    (day, m["period"], m["name"], m["room"], m["type"]),
                )

    cur.execute("SELECT COUNT(*) AS n FROM class_info")
    if cur.fetchone()["n"] == 0:
        for name, info in seed_data.CLASS_INFO.items():
            cur.execute(
                "INSERT INTO class_info (name, icon, desc) VALUES (?, ?, ?)",
                (name, info["icon"], info["desc"]),
            )

    cur.execute("SELECT COUNT(*) AS n FROM bring_items")
    if cur.fetchone()["n"] == 0:
        for name, items in seed_data.CLASS_BRING_ITEMS.items():
            for it in items:
                cur.execute(
                    "INSERT INTO bring_items (class, icon, item) VALUES (?, ?, ?)",
                    (name, it["icon"], it["item"]),
                )


def _seed_users(cur):
    # Seed 10 students (password == student id by default) only if empty.
    cur.execute("SELECT COUNT(*) AS n FROM users")
    if cur.fetchone()["n"] > 0:
        return

    for sid in seed_data.STUDENT_IDS:
        cur.execute(
            "INSERT INTO users (id, password_hash, is_admin) VALUES (?, ?, 0)",
            (sid, auth.hash_password(sid)),
        )
        # Give each fresh student the default quick-tasks
        for text in seed_data.DEFAULT_TASKS:
            cur.execute(
                "INSERT INTO tasks (user_id, content, done) VALUES (?, ?, 0)",
                (sid, text),
            )

    # One admin account. Password from env or a default (CHANGE IT).
    admin_id = os.environ.get("PORTAL_ADMIN_ID", "admin")
    admin_pw = os.environ.get("PORTAL_ADMIN_PW", "admin123")
    cur.execute(
        "INSERT INTO users (id, password_hash, is_admin) VALUES (?, ?, 1)",
        (admin_id, auth.hash_password(admin_pw)),
    )


def _seed_exams(cur):
    cur.execute("SELECT COUNT(*) AS n FROM exams")
    if cur.fetchone()["n"] > 0:
        return
    for e in seed_data.EXAMS:
        cur.execute(
            "INSERT INTO exams (name, date, room, class, topics) VALUES (?, ?, ?, ?, ?)",
            (e["name"], e["date"], e["room"], e["name"], e["topics"]),
        )


def _seed_events(cur):
    cur.execute("SELECT COUNT(*) AS n FROM events")
    if cur.fetchone()["n"] > 0:
        return
    for ev in seed_data.EVENTS:
        cur.execute(
            "INSERT INTO events (name, date, detail) VALUES (?, ?, ?)",
            (ev["name"], ev["date"], ev["detail"]),
        )
