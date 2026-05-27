import functools
import os
import secrets
import tempfile
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


def _default_db_path() -> str:
    return os.path.join(tempfile.gettempdir(), "prelegal.db")


# Load .env from the project root (two levels up from this file: backend/src/prelegal -> project root).
# override=False so explicit shell/Docker env wins over the file.
load_dotenv(Path(__file__).resolve().parents[3] / ".env", override=False)


@dataclass(frozen=True)
class Settings:
    jwt_secret: str
    jwt_algorithm: str
    jwt_expiry_hours: int
    db_path: str
    auth_cookie_name: str
    static_dir: str | None
    cookie_secure: bool
    openrouter_api_key: str | None


@functools.lru_cache(maxsize=1)
def load_settings() -> Settings:
    static_dir = os.environ.get("PRELEGAL_STATIC_DIR") or None
    return Settings(
        jwt_secret=os.environ.get("PRELEGAL_JWT_SECRET") or secrets.token_urlsafe(32),
        jwt_algorithm="HS256",
        jwt_expiry_hours=24 * 7,
        db_path=os.environ.get("PRELEGAL_DB_PATH") or _default_db_path(),
        auth_cookie_name="prelegal_auth",
        static_dir=static_dir,
        cookie_secure=os.environ.get("PRELEGAL_COOKIE_SECURE", "false").lower() == "true",
        openrouter_api_key=os.environ.get("OPENROUTER_API_KEY") or None,
    )
