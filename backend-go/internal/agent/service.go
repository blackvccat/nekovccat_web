package agent

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"nekoweb/backend-go/internal/chat"
	"nekoweb/backend-go/internal/config"
	"nekoweb/backend-go/internal/harness"
	"nekoweb/backend-go/internal/jsonutil"
	"nekoweb/backend-go/internal/observability"
)

type Reply struct {
	Content       string
	DesktopAction string
}

type Service struct {
	config  *config.Config
	manager *Manager
	logger  *slog.Logger
}

type inputEnvelope struct {
	PreviousContext []chat.Message `json:"previous_context"`
	Input           string         `json:"input"`
}

type streamResult struct {
	Content string
	Action  string
}

func NewService(cfg *config.Config, manager *Manager, logger *slog.Logger) *Service {
	return &Service{config: cfg, manager: manager, logger: logger}
}

func (s *Service) CheckConfiguration() error {
	if s.config.DeepSeekAPIKey == "" {
		return NewAgentError("DeepSeek 尚未配置，请联系站点管理员。", 503, "configuration")
	}
	return s.manager.CheckAvailable()
}

func (s *Service) GenerateReply(ctx context.Context, messages []chat.Message) (Reply, error) {
	if err := s.CheckConfiguration(); err != nil {
		return Reply{}, err
	}
	sessionID := "site-" + randomHex(16)
	started := time.Now()
	runCtx, cancel := context.WithTimeout(ctx, seconds(s.config.DSHRequestTimeoutSeconds))
	defer cancel()

	lease, err := s.manager.Acquire(false)
	if err != nil {
		return Reply{}, SafeError(err)
	}
	defer lease.Close(context.Background())

	if err := lease.Start(runCtx); err != nil {
		return Reply{}, SafeError(err)
	}
	observability.LogEvent(ctx, s.logger, "agent_stage", "stage", "runtime_started",
		"duration_ms", float64(time.Since(started).Microseconds())/1000.0)
	if err := lease.Initialize(runCtx); err != nil {
		return Reply{}, SafeError(err)
	}
	result, err := lease.Run(runCtx, sessionID, s.buildInput(messages), nil)
	if err != nil {
		return Reply{}, SafeError(err)
	}
	content, err := s.validateResult(result)
	if err != nil {
		return Reply{}, err
	}
	action := s.desktopAction(result, sessionID)
	observability.LogEvent(ctx, s.logger, "agent_turn",
		"outcome", "completed",
		"duration_ms", float64(time.Since(started).Microseconds())/1000.0,
	)
	return Reply{Content: content, DesktopAction: action}, nil
}

func (s *Service) Stream(ctx context.Context, messages []chat.Message, progressive bool, emit func(chat.Event) error) error {
	if err := s.CheckConfiguration(); err != nil {
		return err
	}
	sessionID := "site-" + randomHex(16)
	started := time.Now()
	runCtx, cancel := context.WithTimeout(ctx, seconds(s.config.DSHRequestTimeoutSeconds))
	defer cancel()

	buffer := NewStreamBuffer(s.config.CHATStreamMaxEvents, s.config.CHATStreamMaxBytes)
	secrets := []string{s.config.DeepSeekAPIKey, s.config.InternalAPIToken}
	projection := NewProgressiveReply(sessionID, secrets, s.config.DSHMaxReplyBytes)
	toolCalls := map[string]string{}
	notificationCount := 0
	notificationBytes := 0
	firstEvent := false
	firstText := false
	workerDone := make(chan struct{})

	go func() {
		defer close(workerDone)
		outcome := "cancelled"
		var lease *Lease
		defer func() {
			if lease != nil {
				lease.Close(context.Background())
			}
			observability.LogEvent(ctx, s.logger, "agent_turn",
				"outcome", outcome,
				"duration_ms", float64(time.Since(started).Microseconds())/1000.0,
				"peak_buffer_bytes", buffer.PeakBytes(),
				"active", s.manager.ActiveCount(),
				"notification_count", notificationCount,
				"notification_bytes", notificationBytes,
			)
			buffer.Stop()
		}()

		if progressive {
			for _, event := range projection.Progress("preparing", "正在准备站内助手…") {
				if err := buffer.Publish(event); err != nil {
					buffer.Finish("error", SafeError(err))
					outcome = "slow_consumer"
					return
				}
			}
		}
		var err error
		lease, err = s.manager.Acquire(progressive)
		if err != nil {
			outcome = SafeError(err).Code
			buffer.Finish("error", SafeError(err))
			return
		}
		if err := lease.Start(runCtx); err != nil {
			safe := SafeError(err)
			outcome = safe.Code
			buffer.Finish("error", safe)
			return
		}
		observability.LogEvent(ctx, s.logger, "agent_stage", "stage", "runtime_started",
			"duration_ms", float64(time.Since(started).Microseconds())/1000.0)
		if err := lease.Initialize(runCtx); err != nil {
			safe := SafeError(err)
			outcome = safe.Code
			buffer.Finish("error", safe)
			return
		}
		if progressive {
			for _, event := range projection.Progress("analyzing", "正在处理你的问题…") {
				if err := buffer.Publish(event); err != nil {
					buffer.Finish("error", SafeError(err))
					outcome = "slow_consumer"
					return
				}
			}
		}

		callback := func(notification harness.Notification) error {
			notificationCount++
			if notificationCount > s.config.DSHMaxNotificationEvents {
				return NewAgentError("站内 Agent 的回复超出处理范围，请缩短问题后重试。", 502, "response_limit")
			}
			if data, marshalErr := jsonutil.Marshal(notification.Payload); marshalErr == nil {
				notificationBytes += len(data)
			}
			if notificationBytes > s.config.DSHMaxNotificationBytes {
				return NewAgentError("站内 Agent 的回复超出处理范围，请缩短问题后重试。", 502, "response_limit")
			}
			if progressive {
				events, feedErr := projection.Feed(notification)
				if feedErr != nil {
					return feedErr
				}
				for _, event := range events {
					if err := buffer.Publish(event); err != nil {
						return err
					}
				}
			}
			if event := toolEvent(notification, sessionID, toolCalls); event != nil {
				if !firstEvent {
					firstEvent = true
					observability.LogEvent(ctx, s.logger, "agent_stage", "stage", "first_event",
						"duration_ms", float64(time.Since(started).Microseconds())/1000.0)
				}
				return buffer.Publish(event)
			}
			return nil
		}

		result, err := lease.Run(runCtx, sessionID, s.buildInput(messages), callback)
		if err != nil {
			safe := SafeError(err)
			outcome = safe.Code
			buffer.Finish("error", safe)
			return
		}
		content, err := s.validateResult(result)
		if err != nil {
			safe := SafeError(err)
			outcome = safe.Code
			buffer.Finish("error", safe)
			return
		}
		if len(content) > s.config.DSHMaxReplyBytes {
			safe := NewAgentError("站内 Agent 的回复较长，请缩短问题后重试。", 502, "response_limit")
			outcome = safe.Code
			buffer.Finish("error", safe)
			return
		}
		content = NewSecretRedactor(secrets).Redact(content)
		if progressive {
			for _, event := range projection.Progress("finalizing", "正在整理最终回复…") {
				if err := buffer.Publish(event); err != nil {
					safe := SafeError(err)
					outcome = safe.Code
					buffer.Finish("error", safe)
					return
				}
			}
		}
		outcome = "completed"
		buffer.Finish("result", streamResult{
			Content: content,
			Action:  s.desktopAction(result, sessionID),
		})
	}()

	defer func() {
		cancel()
		buffer.Stop()
		select {
		case <-workerDone:
		case <-time.After(seconds(s.config.DSHCleanupTimeoutSeconds)):
		}
	}()

	deadline := time.Now().Add(seconds(s.config.DSHRequestTimeoutSeconds))
	for {
		if err := ctx.Err(); err != nil {
			cancel()
			return SafeError(err)
		}
		remaining := time.Until(deadline)
		if remaining <= 0 {
			cancel()
			return NewAgentError("站内 Agent 响应超时，请稍后再试。", 504, "timeout")
		}
		wait := time.Duration(s.config.CHATHeartbeatSeconds * float64(time.Second))
		if remaining < wait {
			wait = remaining
		}
		kind, payload, err := buffer.Get(ctx, wait)
		if err != nil {
			if ctx.Err() != nil {
				cancel()
				return SafeError(ctx.Err())
			}
			if time.Now().After(deadline) {
				cancel()
				return NewAgentError("站内 Agent 响应超时，请稍后再试。", 504, "timeout")
			}
			if emitErr := emit(chat.Event{"event": "heartbeat"}); emitErr != nil {
				cancel()
				return emitErr
			}
			continue
		}
		switch kind {
		case "error":
			safe := SafeError(payload.(error))
			cancel()
			return safe
		case "result":
			result := payload.(streamResult)
			if progressive {
				if err := emit(projection.Final(result.Content)); err != nil {
					cancel()
					return err
				}
			} else {
				if err := emit(chat.Event{"content": result.Content, "done": false}); err != nil {
					cancel()
					return err
				}
			}
			if result.Action != "" {
				if err := emit(chat.Event{"event": "desktop", "action": result.Action}); err != nil {
					cancel()
					return err
				}
			}
			done := chat.Event{"done": true}
			if !progressive {
				done = chat.Event{"content": "", "done": true}
			}
			if err := emit(done); err != nil {
				cancel()
				return err
			}
			return nil
		case "event":
			event := payload.(chat.Event)
			if event["event"] == "reply" && event["content"] != nil && !firstText {
				firstText = true
				observability.LogEvent(ctx, s.logger, "agent_stage", "stage", "first_text",
					"duration_ms", float64(time.Since(started).Microseconds())/1000.0)
			}
			if err := emit(event); err != nil {
				cancel()
				return err
			}
		}
	}
}

// StreamWithFinal is the API-facing wrapper that also returns the canonical
// answer for persistence. The final frame always replaces provisional deltas.
func (s *Service) StreamWithFinal(ctx context.Context, messages []chat.Message, progressive bool, emit func(chat.Event) error) (string, error) {
	var final string
	err := s.Stream(ctx, messages, progressive, func(event chat.Event) error {
		if event["event"] == "reply" && event["phase"] == "final" {
			final = stringValue(event["content"])
		} else if !progressive && event["done"] == false && event["content"] != nil {
			final = stringValue(event["content"])
		}
		return emit(event)
	})
	if err != nil {
		return "", err
	}
	return final, nil
}

func (s *Service) buildInput(messages []chat.Message) string {
	envelope := inputEnvelope{
		PreviousContext: append([]chat.Message(nil), messages[:len(messages)-1]...),
		Input:           messages[len(messages)-1].Content,
	}
	data, _ := jsonutil.Marshal(envelope)
	return string(data)
}

func (s *Service) validateResult(result harness.RunResult) (string, error) {
	if result.FinishReason != "completed" {
		for i := len(result.Events) - 1; i >= 0; i-- {
			event := result.Events[i]
			if stringValue(event["type"]) == "turn/end" {
				data, _ := event["data"].(map[string]any)
				encoded, _ := jsonutil.Marshal(data)
				return "", SafeError(fmt.Errorf("%s", encoded))
			}
		}
		return "", NewAgentError("站内 Agent 回复未完成，请稍后再试。", 502, "upstream_error")
	}
	if strings.TrimSpace(result.FinalResponse) == "" {
		return "", NewAgentError("站内 Agent 暂未返回内容，请稍后再试。", 502, "upstream_error")
	}
	return result.FinalResponse, nil
}

func (s *Service) desktopAction(result harness.RunResult, sessionID string) string {
	if result.SessionID != sessionID || result.FinishReason != "completed" {
		return ""
	}
	calls := map[string]bool{}
	for _, event := range result.Events {
		data, _ := event["data"].(map[string]any)
		switch stringValue(event["type"]) {
		case "tool/call":
			if stringValue(data["name"]) == "girlfriend_mode" {
				if callID := stringValue(data["callId"]); callID != "" {
					calls[callID] = true
				}
			}
		case "tool/result":
			message, _ := data["message"].(map[string]any)
			content, _ := message["content"].([]any)
			for _, item := range content {
				block, _ := item.(map[string]any)
				if block == nil || stringValue(block["type"]) != "tool-result" {
					continue
				}
				callID := stringValue(block["toolCallId"])
				if !calls[callID] {
					continue
				}
				delete(calls, callID)
				if truthy(data["error"]) || truthy(block["isError"]) {
					continue
				}
				values, _ := block["content"].([]any)
				if len(values) != 1 {
					continue
				}
				text, _ := values[0].(map[string]any)
				if text == nil || stringValue(text["type"]) != "text" {
					continue
				}
				var value map[string]any
				if err := jsonutil.DecodeUseNumber([]byte(stringValue(text["text"])), &value); err != nil {
					continue
				}
				progress, ok := intValue(value["progress"])
				if value["unlocked"] == true && ok && progress == 5 && value["next_question"] == nil {
					return "unlock-girlfriend"
				}
			}
		}
	}
	return ""
}

func toolEvent(notification harness.Notification, sessionID string, toolCalls map[string]string) chat.Event {
	if notification.Method != "session.event" || stringValue(notification.Payload["sessionId"]) != sessionID {
		return nil
	}
	event, _ := notification.Payload["event"].(map[string]any)
	data, _ := event["data"].(map[string]any)
	switch stringValue(event["type"]) {
	case "tool/call":
		name := stringValue(data["name"])
		callID := stringValue(data["callId"])
		switch name {
		case "site_info", "desktop_apps", "girlfriend_mode":
			if callID == "" {
				return nil
			}
			toolCalls[callID] = name
			message := "正在查询站内内容…"
			if name == "girlfriend_mode" {
				message = "正在轻轻敲开彩蛋的门…"
			}
			return chat.Event{
				"event": "tool", "name": name, "call_id": OpaqueID(callID),
				"status": "running", "message": message,
			}
		}
	case "tool/result":
		message, _ := data["message"].(map[string]any)
		content, _ := message["content"].([]any)
		for _, item := range content {
			block, _ := item.(map[string]any)
			if block == nil {
				continue
			}
			callID := stringValue(block["toolCallId"])
			name, exists := toolCalls[callID]
			if !exists {
				continue
			}
			delete(toolCalls, callID)
			failed := truthy(data["error"]) || truthy(block["isError"])
			messageText := "站内查询已完成"
			status := "completed"
			if failed {
				messageText = "站内查询失败"
				status = "failed"
			}
			return chat.Event{
				"event": "tool", "name": name, "call_id": OpaqueID(callID),
				"status": status, "message": messageText,
			}
		}
	}
	return nil
}

func truthy(value any) bool {
	switch typed := value.(type) {
	case nil:
		return false
	case bool:
		return typed
	case string:
		return typed != ""
	case map[string]any:
		return len(typed) > 0
	case []any:
		return len(typed) > 0
	default:
		return true
	}
}
