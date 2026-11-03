package agent

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"nekoweb/backend-go/internal/chat"
	"nekoweb/backend-go/internal/harness"
)

func OpaqueID(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])[:24]
}

type SecretRedactor struct {
	secrets []string
	pending string
}

func NewSecretRedactor(secrets []string) *SecretRedactor {
	values := make([]string, 0, len(secrets))
	seen := map[string]bool{}
	for _, secret := range secrets {
		if secret != "" && !seen[secret] {
			seen[secret] = true
			values = append(values, secret)
		}
	}
	sort.SliceStable(values, func(i, j int) bool { return len(values[i]) > len(values[j]) })
	return &SecretRedactor{secrets: values}
}

func (r *SecretRedactor) Redact(text string) string {
	for _, secret := range r.secrets {
		text = strings.ReplaceAll(text, secret, "[已隐藏]")
	}
	return text
}

func (r *SecretRedactor) Feed(text string) string {
	safe := r.Redact(r.pending + text)
	held := 0
	for _, secret := range r.secrets {
		limit := len(secret) - 1
		if len(safe) < limit {
			limit = len(safe)
		}
		for length := limit; length > held; length-- {
			if strings.HasSuffix(safe, secret[:length]) {
				held = length
				break
			}
		}
	}
	if held > 0 {
		r.pending = safe[len(safe)-held:]
		return safe[:len(safe)-held]
	}
	r.pending = ""
	return safe
}

func (r *SecretRedactor) Reset() { r.pending = "" }

type ProgressiveReply struct {
	sessionID     string
	redactor      *SecretRedactor
	maxReplyBytes int
	attemptID     string
	messageID     string
	index         int
	ended         bool
	replyBytes    int
	lastProgress  string
	legacyGen     int
	liveSeen      bool
}

func NewProgressiveReply(sessionID string, secrets []string, maxReplyBytes int) *ProgressiveReply {
	return &ProgressiveReply{
		sessionID:     sessionID,
		redactor:      NewSecretRedactor(secrets),
		maxReplyBytes: maxReplyBytes,
		messageID:     "reply-" + OpaqueID(sessionID+":final"),
		index:         -1,
	}
}

func (p *ProgressiveReply) Progress(stage, message string) []chat.Event {
	key := stage + "\x00" + message
	if key == p.lastProgress {
		return nil
	}
	p.lastProgress = key
	return []chat.Event{{"event": "progress", "stage": stage, "message": message}}
}

func (p *ProgressiveReply) start(attempt string) []chat.Event {
	if p.attemptID == attempt {
		return nil
	}
	p.attemptID = attempt
	p.messageID = "reply-" + OpaqueID(p.sessionID+":"+attempt)
	p.redactor.Reset()
	p.replyBytes = 0
	p.index = -1
	p.ended = false
	return p.Progress("analyzing", "正在处理你的问题…")
}

func (p *ProgressiveReply) text(text string) ([]chat.Event, error) {
	p.replyBytes += len(text)
	if p.replyBytes > p.maxReplyBytes {
		return nil, NewAgentError("站内 Agent 的回复较长，请缩短问题后重试。", 502, "response_limit")
	}
	safe := p.redactor.Feed(text)
	events := p.Progress("answering", "正在生成回复…")
	if safe != "" {
		events = append(events, chat.Event{
			"event": "reply", "phase": "delta", "message_id": p.messageID, "content": safe,
		})
	}
	return events, nil
}

func (p *ProgressiveReply) Feed(notification harness.Notification) ([]chat.Event, error) {
	if stringValue(notification.Payload["sessionId"]) != p.sessionID {
		return nil, nil
	}
	if notification.Method == "site.assistant" {
		frame, _ := notification.Payload["frame"].(map[string]any)
		if frame == nil {
			return nil, nil
		}
		attempt := stringValue(frame["attemptId"])
		if attempt == "" || len(attempt) > 256 {
			return nil, nil
		}
		kind := stringValue(frame["type"])
		if kind == "start" {
			p.liveSeen = true
			return p.start(attempt), nil
		}
		if attempt != p.attemptID || p.ended {
			return nil, nil
		}
		if kind == "end" {
			p.ended = true
			return nil, nil
		}
		index, ok := intValue(frame["index"])
		if !ok || index <= p.index {
			return nil, nil
		}
		p.index = index
		switch kind {
		case "analyzing":
			return p.Progress("analyzing", "正在分析问题…"), nil
		case "text":
			text := stringValue(frame["text"])
			if text == "" {
				return nil, nil
			}
			return p.text(text)
		}
		return nil, nil
	}

	if notification.Method != "session.event" {
		return nil, nil
	}
	event, _ := notification.Payload["event"].(map[string]any)
	data, _ := event["data"].(map[string]any)
	eventType := stringValue(event["type"])
	if !p.liveSeen {
		switch eventType {
		case "step/start", "llm/retry-started", "tool/call":
			p.legacyGen++
		}
	}
	if eventType != "assistant/chunk" || p.liveSeen {
		return nil, nil
	}
	chunk, _ := data["chunk"].(map[string]any)
	switch stringValue(chunk["type"]) {
	case "reasoning-delta":
		return p.Progress("analyzing", "正在分析问题…"), nil
	case "text-delta":
		text := stringValue(chunk["text"])
		if text == "" {
			return nil, nil
		}
		coordinates := fmt.Sprintf("%v:%v:%d", data["turn"], data["step"], p.legacyGen)
		events := p.start("legacy:" + coordinates)
		textEvents, err := p.text(text)
		if err != nil {
			return nil, err
		}
		return append(events, textEvents...), nil
	}
	return nil, nil
}

func (p *ProgressiveReply) Final(canonical string) chat.Event {
	p.redactor.Reset()
	return chat.Event{
		"event": "reply", "phase": "final", "message_id": p.messageID,
		"content": p.redactor.Redact(canonical),
	}
}

func stringValue(value any) string {
	text, _ := value.(string)
	return text
}

func intValue(value any) (int, bool) {
	switch typed := value.(type) {
	case json.Number:
		parsed, err := typed.Int64()
		if err != nil {
			return 0, false
		}
		return int(parsed), true
	case float64:
		if typed != float64(int(typed)) {
			return 0, false
		}
		return int(typed), true
	case int:
		return typed, true
	default:
		return 0, false
	}
}
