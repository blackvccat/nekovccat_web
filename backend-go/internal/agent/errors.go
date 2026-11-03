package agent

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"nekoweb/backend-go/internal/harness"
)

type AgentError struct {
	Message string
	Status  int
	Code    string
}

func (e *AgentError) Error() string { return e.Message }

func NewAgentError(message string, status int, code string) *AgentError {
	return &AgentError{Message: message, Status: status, Code: code}
}

func SafeError(err error) *AgentError {
	var agentErr *AgentError
	if errors.As(err, &agentErr) {
		return agentErr
	}
	if errors.Is(err, harness.ErrNotificationLimit) {
		return NewAgentError("站内 Agent 的回复超出处理范围，请缩短问题后重试。", 502, "response_limit")
	}
	if errors.Is(err, context.Canceled) {
		return NewAgentError("请求已取消。", 499, "cancelled")
	}
	if errors.Is(err, context.DeadlineExceeded) {
		return NewAgentError("站内 Agent 响应超时，请稍后再试。", 504, "timeout")
	}
	message := strings.ToLower(err.Error())
	switch {
	case strings.Contains(message, "timeout") || strings.Contains(message, "timed out"):
		return NewAgentError("站内 Agent 响应超时，请稍后再试。", 504, "timeout")
	case strings.Contains(message, "401") || strings.Contains(message, "unauthorized") ||
		strings.Contains(message, "authentication") || strings.Contains(message, "invalid api key"):
		return NewAgentError("DeepSeek 认证失败，请联系站点管理员。", 503, "authentication")
	case strings.Contains(message, "402") || strings.Contains(message, "insufficient balance"):
		return NewAgentError("DeepSeek 余额不足，请联系站点管理员。", 503, "balance")
	case strings.Contains(message, "429") || strings.Contains(message, "rate limit"):
		return NewAgentError("当前请求较多，请稍后再试。", 429, "rate_limit")
	default:
		return NewAgentError("站内 Agent 暂时不可用，请稍后再试。", 502, "upstream_error")
	}
}

func errorJSON(err error) string {
	return fmt.Sprintf("%v", err)
}
