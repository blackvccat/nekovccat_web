"""Application configuration; credentials never appear in model repr output."""
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    DATABASE_ENABLED: bool = False
    DATABASE_URL: str = "postgresql://postgres:changeme@localhost:5432/marcus_app"
    CORS_ORIGINS: list[str] = ["http://localhost:3010", "http://127.0.0.1:3010"]

    DEEPSEEK_API_KEY: str | None = Field(default=None, repr=False)
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    DEEPSEEK_MODEL: str = "deepseek-v4-pro"
    DEEPSEEK_REASONING_EFFORT: str = "low"
    DSH_HOME: str = str(PROJECT_ROOT / "work/deepseek-harness-home")
    DSH_PATCH_PATH: str = str(PROJECT_ROOT / "agent/website.patch.yml")
    DSH_REQUEST_TIMEOUT_SECONDS: float = Field(default=180.0, gt=0)
    DSH_MAX_TOKENS: int = Field(default=4096, gt=0)
    # 拉起 Harness 子进程的上限与收尾上限。原来硬编码在 ai_service 里，挪出来是为了让
    # 「子进程起不来」和「清理卡住」这两件事能在运维侧调，而不是改一次代码发一次版。
    DSH_INITIALIZE_TIMEOUT_SECONDS: float = Field(default=30.0, gt=0)
    DSH_CLEANUP_TIMEOUT_SECONDS: float = Field(default=5.0, gt=0)
    # 一轮的体积上限。SDK 回调挡不住它先解析一条超大通知，所以这是止损而不是预防；
    # 但没有它时一轮失控的会话能把整台机器（1.6GB）吃满，所以两条都要有。
    DSH_MAX_NOTIFICATION_EVENTS: int = Field(default=4096, gt=0)
    DSH_MAX_NOTIFICATION_BYTES: int = Field(default=2 * 1024 * 1024, ge=1024)
    DSH_MAX_REPLY_BYTES: int = Field(default=65536, ge=1024)
    # 静默期发注释心跳的间隔。前端代理的空闲超时与家用路由/NAT 都靠它才不会被误判成断流。
    CHAT_HEARTBEAT_SECONDS: float = Field(default=15.0, gt=0)
    # 访客应用的视图数据与私有素材：只经后端授权接口返回，前端不接触。
    VISITOR_APPS_PATH: str = str(PROJECT_ROOT / "work/visitor-apps.json")
    VISITOR_ASSETS_DIR: str = str(PROJECT_ROOT / "work/visitor-assets")
    # 访客名与密码哈希；DATABASE_ENABLED=true 时这份文件与 visitor_accounts 表一起读（同名则拒绝）。
    VISITOR_ACCOUNTS_PATH: str = str(PROJECT_ROOT / "work/visitor-accounts.json")
    VISITOR_LOGIN_PER_MINUTE: int = Field(default=6, gt=0)
    VISITOR_LOGIN_PER_HOUR: int = Field(default=30, gt=0)
    VISITOR_MAX_FAILURES: int = Field(default=10, gt=0)
    VISITOR_FAILURE_WINDOW_SECONDS: int = Field(default=900, gt=0)

    INTERNAL_API_TOKEN: str | None = Field(default=None, repr=False)
    CHAT_LIMIT_DB: str = str(PROJECT_ROOT / "work/chat-limits.sqlite")
    # 配额库的写锁等待上限（秒）。并发高时拿不到锁就让这一轮失败，不要拖住事件循环。
    CHAT_SQLITE_TIMEOUT_SECONDS: float = Field(default=3.0, gt=0, le=10)
    # 付费轮次的额度都按滚动窗口算（不按自然日切，免得在 11:59 和 12:01 各刷一轮）：
    # 匿名按设备分桶，IP 上再压一个更高的聚合上限（清 cookie 翻不了倍），登录访客按账号分桶。
    CHAT_WINDOW_SECONDS: int = Field(default=12 * 3600, gt=0)
    CHAT_ANON_DEVICE_LIMIT: int = Field(default=20, gt=0)
    CHAT_ANON_IP_LIMIT: int = Field(default=100, gt=0)
    # 同一出口地址在滚动 24 小时内的总量：12 小时那一档管不住「两段各刷满」（100 + 100）。
    # 这一档只压在 IP 兜底上：正常用户有自己的设备桶、碰不到它，清 cookie 的人会立刻撞上。
    CHAT_ANON_IP_DAILY_LIMIT: int = Field(default=150, gt=0)
    CHAT_VISITOR_LIMIT: int = Field(default=100, gt=0)
    # 全站硬顶，最后的钱包保险。按登录账号 100 条/12 小时算，两个重度访客一天就能顶到 400。
    CHAT_DAILY_LIMIT: int = Field(default=800, gt=0)
    # 同时在跑的付费轮次（每次请求都会拉起一个 Harness 子进程，这台机器内存很紧）。
    # 中间件按身份数和它比较，RuntimeManager 按真实存活租约再比一次，两处共用这个键。
    CHAT_MAX_CONCURRENT: int = Field(default=3, gt=0)
    # 后端 → 浏览器的出站队列水位。队列一满就整轮失败（503 slow_consumer），绝不静默丢正文：
    # 上面的 DSH_MAX_NOTIFICATION_* 管的是「SDK → 后端」的整轮累计，这里管的是「还没被浏览器取走」的水位。
    CHAT_STREAM_MAX_EVENTS: int = Field(default=128, ge=2)
    CHAT_STREAM_MAX_BYTES: int = Field(default=65536, ge=1024)
    # 中间件前置校验：畸形请求挡在配额与 sqlite 之前（超长、格式错都不该扣用户的额度）。
    CHAT_BODY_MAX_BYTES: int = Field(default=65536, ge=1024, le=1048576)
    CHAT_BODY_TIMEOUT_SECONDS: float = Field(default=2.0, gt=0, le=2)
    # 廉价试次闸门（纯内存，早于读 body 与 sqlite）。这是唯一会惩罚「被拒后继续打」的一层：
    # 令牌桶按身份算，用尽即进冷却，冷却按连续用尽的次数翻倍（30 秒 → 上限 900 秒）。
    CHAT_ATTEMPT_BURST: int = Field(default=4, gt=0)
    CHAT_ATTEMPT_REFILL_SECONDS: float = Field(default=10.0, gt=0)
    CHAT_ABUSE_COOLDOWN_SECONDS: float = Field(default=30.0, gt=0)
    CHAT_ABUSE_MAX_COOLDOWN_SECONDS: float = Field(default=900.0, gt=0)
    # 身份表的上限与过期时间。表满时对新身份失败关闭（宁可拒新的，也不挤出正在冷却的老身份）。
    CHAT_ATTEMPT_CACHE_SIZE: int = Field(default=4096, gt=0)
    CHAT_ATTEMPT_CACHE_TTL_SECONDS: float = Field(default=1800.0, gt=0)
    # 全站令牌桶：单身份闸门挡不住「换身份打」，这一层挡的是整台机器的入站速率。
    CHAT_GLOBAL_ATTEMPT_BURST: int = Field(default=60, gt=0)
    CHAT_GLOBAL_ATTEMPTS_PER_SECOND: float = Field(default=20.0, gt=0)

    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8010

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
