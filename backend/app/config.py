import os
from dotenv import load_dotenv

load_dotenv()


def _normalize_db_url(url: str) -> str:
    """requirements.txt installs psycopg 3, not psycopg2, but a plain
    "postgresql://" URL makes SQLAlchemy look for psycopg2 and crash at
    startup with "No module named 'psycopg2'". Hosting providers also often
    hand out "postgres://..." URLs. Both are rewritten to the psycopg 3
    dialect; a URL that already names a driver (postgresql+xxx://) is left
    exactly as written."""
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


class Settings:
    DATABASE_URL: str = _normalize_db_url(
        os.getenv(
            "DATABASE_URL", "postgresql://ats_user:ats_password@localhost:5432/ats_resume_db"
        )
    )
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-do-not-use-in-prod")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    # Gemini model ids change/retire often (2.5 models are slated to shut down
    # Oct 2026) - keep this overridable via .env so a retirement doesn't
    # require a code change.
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

    # Password reset
    RESET_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "30"))

    # SMTP - if any of these are blank, reset emails are logged to the
    # backend console instead of actually sent (dev-friendly placeholder,
    # per the spec's "keep email sending as a placeholder if SMTP isn't
    # configured"). Nothing about the API response changes either way.
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "no-reply@hiremate.ai")


settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
