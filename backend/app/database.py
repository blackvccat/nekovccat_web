"""数据库连接配置"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

# 将 PostgreSQL URL 转换为异步 URL
database_url = settings.DATABASE_URL.replace(
    "postgresql://", 
    "postgresql+asyncpg://"
)

# 创建异步引擎
engine = create_async_engine(
    database_url,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,  # 连接前检查连接是否有效
    pool_size=10,  # 连接池大小
    max_overflow=20,  # 最大溢出连接数
)

# 创建异步会话工厂
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# 声明式基类
Base = declarative_base()


async def get_db():
    """获取数据库会话依赖"""
    try:
        async with AsyncSessionLocal() as session:
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
        print(f"警告: 数据库会话创建失败: {str(e)}")
        yield None


async def init_db():
    """初始化数据库（创建表）"""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("数据库初始化成功")
    except Exception as e:
        print(f"警告: 数据库连接失败，将使用无数据库模式: {str(e)}")
        print("提示: Gemini API 功能不需要数据库，服务将继续运行")


async def close_db():
    """关闭数据库连接"""
    await engine.dispose()

