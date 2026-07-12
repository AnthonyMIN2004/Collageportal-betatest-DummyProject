# ── COLLEGIATE PORTAL | DATABASE.PY ──
# SQLite setup: connection helper, table creation, and seeding.
# SECURITY: every query in the app uses parameterized (?) placeholders —
# never string-formatted SQL — so user input can't inject.

import os
import sqlite3

import auth
import seed_data

# portal.db lives next to this file
DB_PATH = os.environ.get("PORTAL_DB", os.path.join(os.path.dirname(__file__), "portal.db"))


def get_db():
    """Open a connection with row access by column name. Caller closes it."""
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
        """
    )

    _seed_users(cur)
    _seed_exams(cur)
    _seed_events(cur)

    conn.commit()
    conn.close()


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
