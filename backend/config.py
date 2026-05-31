from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/smart_quran"
    secret_key: str = "dev-secret-change-in-production"
    telegram_bot_token: str = ""
    quran_api_base: str = "https://api.quran.com/api/v4"
    anthropic_api_key: str = ""
    allowed_origins: str = "http://localhost:3000"
    environment: str = "development"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 30  # 30 days

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
