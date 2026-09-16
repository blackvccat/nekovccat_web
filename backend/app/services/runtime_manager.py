"""Own immutable startup configuration and isolated per-request SDK subprocesses.

Configuration is refreshed by restarting the application. A manager never swaps
what an active request is using, and never calls a model during startup/readiness
checks. Runtime instances are not pooled or shared -- 每轮仍是一个独立子进程。

搬到本项目时改动了两处：去掉另一条分支的伴侣模式题库（这里没有那个功能），
以及把补丁的生成从「每轮写一次、用完就删」改成「准备一次、整进程复用」。
后者才是这个模块在本项目里的实际收益：原来每个付费轮次都要读模板、替换占位符、
写一个临时 yml 再删掉，现在只在首次请求时写一次。
"""
import asyncio
from contextlib import suppress
from dataclasses import dataclass
import json
from pathlib import Path
import threading
import time
from uuid import uuid4

from app.config import PROJECT_ROOT, Settings
from app.observability import log_event
from app.services.agent_prompt import SYSTEM_PROMPT
from app.services.ai_errors import AIServiceError, safe_error
from app.services.harness_adapter import SiteHarness


@dataclass(frozen=True, repr=False)
class PreparedRuntime:
    home: Path
    workspace: Path
    patch: Path
    progressive_patch: Path


class RuntimeLease:
    """一次请求对运行时的独占使用；引用计数保证「取消」不会把进程漏在外面。

    SDK 在 run 内部还可能自己 start 一次，所以 close 与 run 会赛跑：close 只标记，
    等在飞的使用结束（`_end_use`）才真正回收，晚到的那次 start 也就有地方收尸。
    """

    def __init__(self, manager, harness):
        self.manager = manager
        self.harness = harness
        self._close_lock = threading.Lock()
        self._state_lock = threading.Lock()
        self._closed = False
        self._in_flight = 0

    def _begin_use(self):
        with self._state_lock:
            if self._closed:
                raise AIServiceError("请求已取消。", 499, "cancelled")
            self._in_flight += 1

    def _end_use(self):
        with self._state_lock:
            self._in_flight -= 1
            final_close = self._closed and self._in_flight == 0
        if final_close:
            # SDK run can call start internally after a racing cancellation has
            # already closed its old process. Reap that late process before the
            # lease can leave the manager's active set.
            self.close(final=True)

    def start(self):
        self._begin_use()
        try:
            self.harness.start()
        finally:
            self._end_use()

    def run(self, *args, **kwargs):
        self._begin_use()
        try:
            # 阻塞的 run 期间不持关闭锁：取消必须还能立刻终止当前这个子进程。
            return self.harness.run(*args, **kwargs)
        finally:
            self._end_use()

    def close(self, *, final=False):
        with self._close_lock:
            with self._state_lock:
                if self._closed and not final:
                    return
                self._closed = True
                in_flight = self._in_flight
            try:
                self.harness.close()
            finally:
                if not in_flight:
                    self.manager.release(self)


class AgentRuntimeManager:
    def __init__(self, config: Settings, harness_factory=None):
        self.config = config
        self.harness_factory = harness_factory or SiteHarness
        self._lock = threading.RLock()
        self._prepared: PreparedRuntime | None = None
        self._leases: set[RuntimeLease] = set()
        self._closing = False
        self._failure: AIServiceError | None = None

    @property
    def active_count(self) -> int:
        with self._lock:
            return len(self._leases)

    @property
    def ready(self) -> bool:
        with self._lock:
            return self._prepared is not None and not self._closing and self._failure is None

    def check_available(self):
        if self._failure:
            raise self._failure
        if self._closing:
            raise AIServiceError("站内 Agent 正在维护，请稍后再试。", 503, "runtime_closed")

    def prepare(self) -> PreparedRuntime:
        started = time.monotonic()
        with self._lock:
            self.check_available()
            if self._prepared is not None:
                return self._prepared
            try:
                if not self.config.DEEPSEEK_API_KEY:
                    raise AIServiceError("DeepSeek 尚未配置，请联系站点管理员。", 503, "configuration")
                try:
                    template = Path(self.config.DSH_PATCH_PATH).read_text(encoding="utf-8")
                except OSError:
                    raise AIServiceError("站内 Agent 的工具配置尚未就绪，请联系站点管理员。", 503, "configuration") from None
                home = Path(self.config.DSH_HOME).resolve()
                workspace = home / "workspace"
                workspace.mkdir(parents=True, exist_ok=True, mode=0o700)
                patch = home / f"website-{uuid4().hex}.patch.yml"
                patch.write_text(template.replace("__WEBSITE_TOOLS_MODULE__",
                                                   json.dumps(str(PROJECT_ROOT / "agent/website-tools.mjs"))), encoding="utf-8")
                # 钉住的 SDK 只上报持久化事件，逐 token 的瞬态帧要靠这个补丁从子进程里桥出来。
                # 补丁文件一直放着，但只有 v2 请求会把它挂进 patches：老协议下 SDK 侧连监听都不注册。
                progressive_patch = home / f"website-{uuid4().hex}.progress.patch.yml"
                progressive_patch.write_text('- insert:\n    - id: marcus-progressive-stream\n      name: '
                                             + json.dumps(str(Path(__file__).with_name('progressive_bridge.mjs'))) + '\n',
                                             encoding='utf-8')
                self._prepared = PreparedRuntime(home, workspace, patch, progressive_patch)
                log_event("agent_configuration", outcome="ready", duration_ms=round((time.monotonic() - started) * 1000, 2))
                return self._prepared
            except Exception as exc:
                self._failure = safe_error(exc)
                log_event("agent_configuration", outcome="unavailable", code=self._failure.code)
                raise self._failure from None

    async def initialize(self) -> bool:
        """就绪探针用：不碰模型，只确认配置能准备好。返回是否可用，不抛异常。"""
        try:
            await asyncio.to_thread(self.prepare)
            return True
        except AIServiceError:
            return False

    def acquire(self, *, progressive=False) -> RuntimeLease:
        with self._lock:
            prepared = self.prepare()
            # 中间件已经按身份拦过一道，这里按「真实存活的租约数」再拦一道：
            # 后者才对应内存，也是最后的保险。
            if len(self._leases) >= self.config.CHAT_MAX_CONCURRENT:
                raise AIServiceError("Agent 正在回复，请稍后再发消息。", 429, "concurrency")
            try:
                harness = self.harness_factory(
                    provider="deepseek-official", model=self.config.DEEPSEEK_MODEL,
                    api_key=self.config.DEEPSEEK_API_KEY, base_url=self.config.DEEPSEEK_BASE_URL,
                    reasoning_effort=self.config.DEEPSEEK_REASONING_EFFORT,
                    max_tokens=self.config.DSH_MAX_TOKENS, profile="sdk-minimal",
                    patches=tuple(str(path) for path in ([prepared.patch, prepared.progressive_patch] if progressive else [prepared.patch])),
                    dsh_home=str(prepared.home),
                    runtime_cwd=str(prepared.home), cwd=str(prepared.workspace),
                    initialize_timeout_seconds=self.config.DSH_INITIALIZE_TIMEOUT_SECONDS,
                    request_timeout_seconds=self.config.DSH_REQUEST_TIMEOUT_SECONDS,
                    shutdown_timeout_seconds=1.0,
                    env={"DSH_SYSTEM_PROMPT": SYSTEM_PROMPT,
                         "MARCUS_PROGRESSIVE_STREAM": "1" if progressive else "0"},
                )
            except Exception as exc:
                raise safe_error(exc) from None
            lease = RuntimeLease(self, harness)
            self._leases.add(lease)
            return lease

    def release(self, lease: RuntimeLease):
        with self._lock:
            self._leases.discard(lease)
            self._remove_patch_if_closed()

    def _remove_patch_if_closed(self):
        if self._closing and not self._leases and self._prepared:
            with suppress(OSError):
                self._prepared.patch.unlink(missing_ok=True)
                self._prepared.progressive_patch.unlink(missing_ok=True)

    def close(self):
        with self._lock:
            self._closing = True
            leases = tuple(self._leases)
        for lease in leases:
            with suppress(Exception):
                lease.close()
        with self._lock:
            self._remove_patch_if_closed()

    async def shutdown(self):
        cleanup = asyncio.create_task(asyncio.to_thread(self.close))
        try:
            await asyncio.wait_for(asyncio.shield(cleanup), timeout=self.config.DSH_CLEANUP_TIMEOUT_SECONDS)
        except TimeoutError:
            log_event("agent_shutdown", outcome="cleanup_timeout", active=self.active_count)
