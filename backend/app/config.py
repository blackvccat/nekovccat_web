"""Application configuration; credentials never appear in model repr output."""
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    DATABASE_ENABLED: bool = False
    DATABASE_URL: str = Field(default="postgresql://postgres:changeme@localhost:5432/nekovccat_app", repr=False)
    CORS_ORIGINS: list[str] = ["http://localhost:3010", "http://127.0.0.1:3010"]

    DEEPSEEK_API_KEY: str | None = Field(default=None, repr=False)
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    DEEPSEEK_MODEL: str = "deepseek-v4-pro"
    DEEPSEEK_REASONING_EFFORT: str = "low"
    DSH_HOME: str = str(PROJECT_ROOT / "work/deepseek-harness-home")
    DSH_PATCH_PATH: str = str(PROJECT_ROOT / "agent/website.patch.yml")
    DSH_REQUEST_TIMEOUT_SECONDS: float = Field(default=180.0, gt=0)
    DSH_INITIALIZE_TIMEOUT_SECONDS: float = Field(default=30.0, gt=0)
    DSH_CLEANUP_TIMEOUT_SECONDS: float = Field(default=5.0, gt=0)
    DSH_MAX_TOKENS: int = Field(default=4096, gt=0)
    DSH_MAX_NOTIFICATION_EVENTS: int = Field(default=4096, gt=0)
    DSH_MAX_NOTIFICATION_BYTES: int = Field(default=2097152, ge=1024)
    DSH_MAX_REPLY_BYTES: int = Field(default=65536, ge=1024)
    CHAT_STREAM_MAX_EVENTS: int = Field(default=128, ge=2)
    CHAT_STREAM_MAX_BYTES: int = Field(default=65536, ge=1024)
    CHAT_HEARTBEAT_SECONDS: float = Field(default=15.0, gt=0)
    CHAT_SEND_TIMEOUT_SECONDS: float = Field(default=10.0, gt=0)
    RELATIONSHIP_PRIVATE_PATH: str = str(PROJECT_ROOT / "work/relationship-private.json")

    INTERNAL_API_TOKEN: str | None = Field(default=None, repr=False)
    CHAT_LIMIT_DB: str = str(PROJECT_ROOT / "work/chat-limits.sqlite")
    CHAT_DAILY_LIMIT: int = Field(default=400, gt=0)
    CHAT_MAX_CONCURRENT: int = Field(default=3, gt=0)
    CHAT_QUEUE_MAX_SIZE: int = Field(default=12, ge=0, le=1000)
    CHAT_QUEUE_WAIT_SECONDS: float = Field(default=8.0, gt=0, le=8)
    CHAT_IP_MINUTE_LIMIT: int = Field(default=6, gt=0)
    CHAT_IP_HOUR_LIMIT: int = Field(default=30, gt=0)
    CHAT_IP_DAILY_LIMIT: int = Field(default=60, gt=0)
    CHAT_BODY_MAX_BYTES: int = Field(default=65536, ge=1024, le=1048576)
    CHAT_BODY_TIMEOUT_SECONDS: float = Field(default=2.0, gt=0, le=2)
    CHAT_ATTEMPT_BURST: int = Field(default=4, gt=0)
    CHAT_ATTEMPT_REFILL_SECONDS: float = Field(default=10.0, gt=0)
    CHAT_ABUSE_COOLDOWN_SECONDS: float = Field(default=30.0, gt=0)
    CHAT_ABUSE_MAX_COOLDOWN_SECONDS: float = Field(default=900.0, gt=0)
    CHAT_ATTEMPT_CACHE_SIZE: int = Field(default=4096, gt=0)
    CHAT_ATTEMPT_CACHE_TTL_SECONDS: float = Field(default=1800.0, gt=0)
    CHAT_GLOBAL_ATTEMPT_BURST: int = Field(default=60, gt=0)
    CHAT_GLOBAL_ATTEMPTS_PER_SECOND: float = Field(default=20.0, gt=0)
    CHAT_SQLITE_TIMEOUT_SECONDS: float = Field(default=1.0, gt=0, le=10)
    CHAT_QUOTA_CLEANUP_SECONDS: float = Field(default=300.0, gt=0)

    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8010

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
