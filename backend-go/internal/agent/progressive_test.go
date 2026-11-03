package agent

import (
	"strings"
	"testing"

	"nekoweb/backend-go/internal/harness"
)

func frame(kind, attempt string, fields map[string]any) harness.Notification {
	payload := map[string]any{"sessionId": "owned", "frame": map[string]any{"type": kind, "attemptId": attempt}}
	for key, value := range fields {
		payload["frame"].(map[string]any)[key] = value
	}
	return harness.Notification{Method: "site.assistant", Payload: payload}
}

func TestProgressiveReplyReplacesDraftAndKeepsMessageID(t *testing.T) {
	projection := NewProgressiveReply("owned", nil, 65536)
	if events, err := projection.Feed(frame("start", "attempt-1", nil)); err != nil || len(events) != 1 {
		t.Fatalf("start: %v %v", events, err)
	}
	events, err := projection.Feed(frame("text", "attempt-1", map[string]any{"index": 0, "text": "draft"}))
	if err != nil || len(events) == 0 {
		t.Fatalf("text: %v %v", events, err)
	}
	firstID := events[len(events)-1]["message_id"]
	if got := projection.Final("canonical"); got["phase"] != "final" || got["message_id"] != firstID || got["content"] != "canonical" {
		t.Fatalf("unexpected final: %+v", got)
	}
}

func TestProgressiveReplyIgnoresForeignAndRepeatedChunks(t *testing.T) {
	projection := NewProgressiveReply("owned", nil, 65536)
	_, _ = projection.Feed(frame("start", "attempt-1", nil))
	events, err := projection.Feed(frame("text", "attempt-1", map[string]any{"index": 0, "text": "one"}))
	if err != nil || len(events) == 0 {
		t.Fatalf("first text: %v %v", events, err)
	}
	if events, err := projection.Feed(frame("text", "attempt-1", map[string]any{"index": 0, "text": "duplicate"})); err != nil || len(events) != 0 {
		t.Fatalf("duplicate must be ignored: %v %v", events, err)
	}
	foreign := frame("text", "attempt-1", map[string]any{"index": 1, "text": "foreign"})
	foreign.Payload["sessionId"] = "foreign"
	if events, err := projection.Feed(foreign); err != nil || len(events) != 0 {
		t.Fatalf("foreign must be ignored: %v %v", events, err)
	}
}

func TestSecretRedactorHandlesEverySplitBoundary(t *testing.T) {
	secret := "fictional-api-key-12345"
	raw := "before " + secret + " after"
	for boundary := 1; boundary < len(raw); boundary++ {
		redactor := NewSecretRedactor([]string{secret, "another-secret"})
		output := redactor.Feed(raw[:boundary]) + redactor.Feed(raw[boundary:])
		if output != "before [已隐藏] after" {
			t.Fatalf("boundary %d: %q", boundary, output)
		}
	}
}

func TestProgressiveReplyEnforcesByteLimit(t *testing.T) {
	projection := NewProgressiveReply("owned", nil, 5)
	_, _ = projection.Feed(frame("start", "attempt-1", nil))
	_, err := projection.Feed(frame("text", "attempt-1", map[string]any{"index": 0, "text": strings.Repeat("猫", 3)}))
	if err == nil {
		t.Fatal("expected response limit error")
	}
}
