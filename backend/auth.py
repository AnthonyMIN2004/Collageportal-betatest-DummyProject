# ── COLLEGIATE PORTAL | AUTH.PY ──
# Password hashing (bcrypt) + JWT token issue/verify + FastAPI guards.

import os
import datetime

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException, status

# SECRET_KEY signs the JWTs. MUST be set via env in production —
# anyone who knows it can forge tokens.
SECRET_KEY = os.environ.get("PORTAL_SECRET", "dev-secret-change-me-before-deploy")
ALGORITHM = "HS256"
TOKEN_TTL_HOURS = 24


# ── パスワードのハッシュ化 ──
# bcryptは「一方通行」: ハッシュから元のパスワードは誰にも復元できない。
# DBが丸ごと盗まれても平文パスワードは漏れない、というのが狙い。
# gensalt()が毎回違うソルトを混ぜるので、同じパスワードでもハッシュは毎回変わる。
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


# 照合はcheckpwに任せる。自分で==比較しないこと(タイミング攻撃対策込みでやってくれる)。
# 変なデータが渡ってきて例外が出たら、素直にFalse=ログイン失敗として扱う。
def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# ── JWTトークン ──
# JWT = 「サーバーの署名付き身分証」。中身は誰でも読めるが、SECRET_KEYが無いと
# 偽造・改ざんはできない(署名が合わなくなる)。だからサーバー側にセッション保存が不要。
# payloadの各フィールド:
#   sub   … 誰か(学籍番号)
#   admin … 管理者フラグ。ここに入ってるからクライアントで偽装しても無意味
#   iat   … 発行時刻 / exp … 失効時刻(24時間後)。期限切れは自動で401になる
def create_token(student_id: str, is_admin: bool) -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": student_id,
        "admin": bool(is_admin),
        "iat": now,
        "exp": now + datetime.timedelta(hours=TOKEN_TTL_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


# ── FastAPIの依存性(ルートの門番) ──
# ルート関数の引数に Depends(get_current_user) と書くだけで
# 「トークン必須」になる仕組み。FastAPIが呼び出し前にここを通してくれる。
# トークンが無い/壊れてる/期限切れ → この時点で401が返り、ルート本体は実行されない。
def get_current_user(authorization: str = Header(None)) -> dict:
    """Require a valid Bearer token. Returns {sub, admin}."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header",
        )
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired — please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"sub": payload["sub"], "admin": payload.get("admin", False)}


# 管理者版の門番。get_current_userの上に乗ってるので、
# 「まずトークンチェック(401) → 次に管理者チェック(403)」の二段構え。
# 401と403を使い分けてるのは意図的: 401=誰か分からない、403=誰かは分かるが権限が無い。
def get_current_admin(user: dict = Depends(get_current_user)) -> dict:
    """Require an admin token."""
    if not user.get("admin"):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user
