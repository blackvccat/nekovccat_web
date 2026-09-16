"""Cheap attempt limits, including rejected requests, before any body/DB work.

搬自另一条分支的 `attempt_guard.py`。它是本项目原来唯一缺的那一层：`requests` 表只在
放行之后才 INSERT 一行，所以「一直被拒还在打」的人不会在任何计数上累积，而每一次被拒
仍然要开一次 sqlite 事务。这里的令牌桶把被拒的尝试也计入，并且用尽后进冷却、冷却时间
按连续用尽的次数翻倍，也就是越打越久不能打。

纯内存、无 I/O、不落库：它是第二道闸（第一道是安全中间件的令牌校验），
代价必须是「一次字典查找」，任何 sqlite 或磁盘工作都不能出现在它之前。
"""
from collections import OrderedDict
from dataclasses import dataclass
import math
import time

from app.config import Settings


@dataclass
class QuotaRejection:
    message: str
    retry_after: int
    code: str


@dataclass
class AttemptState:
    tokens: float
    updated: float
    last_seen: float
    strikes: int = 0
    cooldown_until: float = 0.0


class AttemptGuard:
    def __init__(self, config: Settings):
        self.config = config
        self.identities: OrderedDict[str, AttemptState] = OrderedDict()
        self.global_tokens = float(config.CHAT_GLOBAL_ATTEMPT_BURST)
        self.global_updated = time.monotonic()

    def check(self, identity: str, now: float | None = None) -> QuotaRejection | None:
        now = time.monotonic() if now is None else now
        self.global_tokens = min(self.config.CHAT_GLOBAL_ATTEMPT_BURST,
                                 self.global_tokens + max(0, now - self.global_updated)
                                 * self.config.CHAT_GLOBAL_ATTEMPTS_PER_SECOND)
        self.global_updated = now
        if self.global_tokens < 1:
            retry = max(1, math.ceil((1 - self.global_tokens) / self.config.CHAT_GLOBAL_ATTEMPTS_PER_SECOND))
            return QuotaRejection("Agent 当前请求较多，请稍后再试。", retry, "protection_busy")
        self.global_tokens -= 1

        # Do bounded cleanup. Never evict an unexpired cooldown just because an
        # attacker rotates identities; a full table fails closed for newcomers.
        ttl = max(self.config.CHAT_ATTEMPT_CACHE_TTL_SECONDS,
                  self.config.CHAT_ABUSE_MAX_COOLDOWN_SECONDS)
        for _ in range(16):
            if not self.identities:
                break
            oldest, state = next(iter(self.identities.items()))
            if now - state.last_seen < ttl:
                break
            self.identities.pop(oldest)
        state = self.identities.get(identity)
        if state is None:
            if len(self.identities) >= self.config.CHAT_ATTEMPT_CACHE_SIZE:
                return QuotaRejection("Agent 当前请求较多，请稍后再试。", 60, "protection_busy")
            state = AttemptState(float(self.config.CHAT_ATTEMPT_BURST), now, now)
            self.identities[identity] = state
        state.last_seen = now
        self.identities.move_to_end(identity)
        if state.cooldown_until > now:
            return QuotaRejection("当前网络短时间请求过多，已暂时冷却，请等待后再试。",
                                  max(1, math.ceil(state.cooldown_until - now)), "burst_limit")
        state.tokens = min(self.config.CHAT_ATTEMPT_BURST,
                           state.tokens + max(0, now - state.updated) / self.config.CHAT_ATTEMPT_REFILL_SECONDS)
        state.updated = now
        if state.tokens >= 1:
            state.tokens -= 1
            return None
        state.strikes = min(state.strikes + 1, 32)
        cooldown = min(self.config.CHAT_ABUSE_MAX_COOLDOWN_SECONDS,
                       self.config.CHAT_ABUSE_COOLDOWN_SECONDS * 2 ** min(state.strikes - 1, 20))
        state.cooldown_until = now + cooldown
        return QuotaRejection("当前网络短时间请求过多，已暂时冷却，请等待后再试。",
                              max(1, math.ceil(cooldown)), "burst_limit")
