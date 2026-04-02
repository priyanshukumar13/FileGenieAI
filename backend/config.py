from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()


BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
    env_file=BASE_DIR / ".env",
    env_file_encoding="utf-8",
    extra="ignore"
)

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    # Google AI Studio / Gemini — set GEMINI_API_KEY in .env (never commit real keys)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    # Contact form → email (configure SMTP to enable sending)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_use_tls: bool = True
    smtp_user: str = ""
    smtp_password: str = ""
    contact_notify_email: str = ""
    contact_from_email: str = ""
    max_upload_mb: int = 20
    upload_dir: Path = BASE_DIR / "uploads"
    temp_dir: Path = BASE_DIR / "temp"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    download_ttl_seconds: int = 3600
    
    mongodb_uri: str = ""
    jwt_secret: str = "supersecretjwtkeyforcookies"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    s.upload_dir.mkdir(parents=True, exist_ok=True)
    s.temp_dir.mkdir(parents=True, exist_ok=True)
    return s


def cors_origins_list() -> list[str]:
    return [o.strip() for o in get_settings().cors_origins.split(",") if o.strip()]
