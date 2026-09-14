"""Public error categories; original provider diagnostics must stay private."""


class AIServiceError(Exception):
    def __init__(self, message: str, status_code: int = 502, code: str = "upstream_error"):
        super().__init__(message)
        self.status_code = status_code
        self.code = code


def safe_error(error: object) -> AIServiceError:
    if isinstance(error, AIServiceError):
        return error
    message = str(error).lower()
    if isinstance(error, TimeoutError) or "timeout" in message or "timed out" in message:
        return AIServiceError("站内 Agent 响应超时，请稍后再试。", 504, "timeout")
    if "401" in message or "unauthorized" in message or "authentication" in message or "invalid api key" in message:
        return AIServiceError("DeepSeek 认证失败，请联系站点管理员。", 503, "authentication")
    if "402" in message or "insufficient balance" in message:
        return AIServiceError("DeepSeek 余额不足，请联系站点管理员。", 503, "balance")
    if "429" in message or "rate limit" in message:
        return AIServiceError("当前请求较多，请稍后再试。", 429, "rate_limit")
    return AIServiceError("站内 Agent 暂时不可用，请稍后再试。", 502, "upstream_error")
