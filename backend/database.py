from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from config import get_settings
import urllib.parse
import logging

settings = get_settings()
logger = logging.getLogger("smart_quran.database")


def _normalize_database_url(url: str) -> str:
    """Normalize common Postgres/Supabase URLs to a SQLAlchemy asyncpg-compatible URL.

    - Convert postgres:// or postgresql:// to postgresql+asyncpg://
    - If the host looks like Supabase and sslmode is not present, append sslmode=require
    """
    if not url:
        return url

    parsed = urllib.parse.urlparse(url)
    scheme = parsed.scheme

    # Convert schemes to SQLAlchemy asyncpg form
    if scheme == "postgres":
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif scheme == "postgresql":
        # If it isn't already the asyncpg scheme, replace once
        if not url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # Add sslmode=require for Supabase hosts if not present
    if "supabase.co" in url and "sslmode" not in url:
        if "?" in url:
            url = url + "&sslmode=require"
        else:
            url = url + "?sslmode=require"

    return url


DATABASE_URL = _normalize_database_url(settings.database_url)

# Create async engine. Avoid passing pool_size/max_overflow here to keep defaults
# compatible with SQLAlchemy's async engine and the underlying asyncpg driver.
engine = create_async_engine(
    DATABASE_URL,
    echo=(settings.environment == "development"),
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """Initialize DB schema and perform a lightweight connectivity check.

    This function attempts to create tables (if they don't exist) and then runs
    a simple SELECT 1 to verify the connection. On failure it will log a helpful
    message including a masked form of the DB host so debugging is easier.
    """
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Lightweight connection check
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))

        logger.info("Database initialized and reachable")
    except Exception:
        # Log the exception and re-raise so the application startup fails loudly.
        try:
            parsed = urllib.parse.urlparse(settings.database_url or "")
            host = parsed.hostname or "<unknown>"
        except Exception:
            host = "<unknown>"
        logger.exception(
            "Database initialization failed (host=%s). Check DATABASE_URL and network access.",
            host,
        )
        raise
