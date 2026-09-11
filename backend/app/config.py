"""Application configuration; credentials never appear in model repr output."""
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    DATABASE_ENABLED: bool = False
    DATABASE_URL: str = "postgresql://postgres:changeme@localhost:5432/nekovccat_app"
    CORS_ORIGINS: list[str] = ["http://localhost:3010", "http://127.0.0.1:3010"]

    DEEPSEEK_API_KEY: str | None = Field(default=None, repr=False)
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    DEEPSEEK_MODEL: str = "deepseek-v4-pro"
    DEEPSEEK_REASONING_EFFORT: str = "low"
    DSH_HOME: str = str(PROJECT_ROOT / "work/deepseek-harness-home")
    DSH_PATCH_PATH: str = str(PROJECT_ROOT / "agent/website.patch.yml")
    DSH_REQUEST_TIMEOUT_SECONDS: float = Field(default=180.0, gt=0)
    DSH_MAX_TOKENS: int = Field(default=4096, gt=0)
    RELATIONSHIP_PRIVATE_PATH: str = str(PROJECT_ROOT / "work/relationship-private.json")

    INTERNAL_API_TOKEN: str | None = Field(default=None, repr=False)
    CHAT_LIMIT_DB: str = str(PROJECT_ROOT / "work/chat-limits.sqlite")
    CHAT_DAILY_LIMIT: int = Field(default=400, gt=0)

    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8010

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
