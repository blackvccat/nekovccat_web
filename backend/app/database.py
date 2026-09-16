"""数据库连接配置。

DATABASE_ENABLED 打开时，访客名单（见 app/models/visitor.py）等数据来自数据库，
本地的 visitor-accounts.json 同时继续生效，两份合并后按名字去重（重名直接拒绝）；
引擎按需创建，缺少驱动只会影响开启数据库的部署，不会拦住站内聊天。
"""
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.config import settings

Base = declarative_base()

_engine = None
_sessionmaker = None

# 同步 URL → 对应异步驱动；MySQL 与 PostgreSQL 都支持。
URL_PREFIXES = (
    ("postgresql://", "postgresql+asyncpg://"),
    ("postgres://", "postgresql+asyncpg://"),
    ("mysql://", "mysql+aiomysql://"),
    ("mysql+pymysql://", "mysql+aiomysql://"),
)


def normalize_database_url(url: str) -> str:
    for prefix, replacement in URL_PREFIXES:
        if url.startswith(prefix):
            return url.replace(prefix, replacement, 1)
    return url


def get_engine():
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            normalize_database_url(settings.DATABASE_URL),
            echo=settings.DEBUG,
            future=True,
            pool_pre_ping=True,  # 连接前检查连接是否有效
            pool_size=10,  # 连接池大小
            max_overflow=20,  # 最大溢出连接数
        )
    return _engine


def get_sessionmaker():
    global _sessionmaker
    if _sessionmaker is None:
        _sessionmaker = async_sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
    return _sessionmaker


async def get_db():
    """获取数据库会话依赖"""
    try:
        async with get_sessionmaker()() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    except Exception as e:
        # 如果数据库不可用，返回 None（聊天服务实际上不使用数据库）
        print(f"警告: 数据库会话创建失败: {type(e).__name__}")
        yield None


async def init_db():
    """初始化数据库（创建表）"""
    from app.models import visitor  # noqa: F401  注册表结构，create_all 才能看到它

    try:
        async with get_engine().begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("数据库初始化成功")
    except Exception as e:
        print(f"警告: 数据库连接失败，将使用无数据库模式: {type(e).__name__}")
        print("提示: DATABASE_ENABLED=false 时访客名单来自本地 JSON 文件，服务可继续运行")


async def close_db():
    """关闭数据库连接"""
    global _engine, _sessionmaker
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _sessionmaker = None


async def database_ready() -> bool:
    """就绪探针：不开数据库就算就绪；开着就真连一次（不建表、不写数据）。

    没有这一步时，DATABASE_URL 写错只会在启动日志里留一行警告，访客登录要到
    第一个真实请求才 503 —— 发布检查本该在那之前就发现。
    """
    if not settings.DATABASE_ENABLED:
        return True
    from sqlalchemy import text

    try:
        async with get_engine().connect() as connection:
            await connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
