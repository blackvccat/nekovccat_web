"""Optional application storage; no engine or connections exist until enabled."""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from app.config import settings
from app.observability import log_event

Base = declarative_base()
engine = None
AsyncSessionLocal = None


async def get_db():
    if AsyncSessionLocal is None:
        raise RuntimeError("Application database is not ready")
    async with AsyncSessionLocal() as session:
        async with session.begin():
            yield session


async def init_db() -> bool:
    global engine, AsyncSessionLocal
    if not settings.DATABASE_ENABLED:
        return True
    try:
        engine = create_async_engine(
            settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1),
            echo=False, pool_pre_ping=True, pool_size=5, max_overflow=5,
        )
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        log_event("database", outcome="ready")
        return True
    except Exception:
        await close_db()
        log_event("database", outcome="unavailable")
        return False


async def close_db():
    global engine, AsyncSessionLocal
    if engine is not None:
        await engine.dispose()
    engine = None
    AsyncSessionLocal = None
