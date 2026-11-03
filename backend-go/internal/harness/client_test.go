package harness

import (
	"encoding/json"
	"testing"
)

func TestRPCIDKeyUnquotesStrings(t *testing.T) {
	if got := rpcIDKey(json.RawMessage(`"go-1"`)); got != "go-1" {
		t.Fatalf("unexpected key: %q", got)
	}
	if got := rpcIDKey(json.RawMessage(`7`)); got != "7" {
		t.Fatalf("unexpected key: %q", got)
	}
}

func TestFinalResponseAndFinishReason(t *testing.T) {
	events := []map[string]any{
		{"type": "assistant/message", "data": map[string]any{"content": []any{
			map[string]any{"type": "text", "text": "hello"},
			map[string]any{"type": "text", "text": " world"},
		}}},
		{"type": "turn/end", "data": map[string]any{"reason": map[string]any{"kind": "completed"}}},
	}
	content, err := finalResponse(events)
	if err != nil || content != "hello world" {
		t.Fatalf("content=%q err=%v", content, err)
	}
	reason, err := finishReason(events)
	if err != nil || reason != "completed" {
		t.Fatalf("reason=%q err=%v", reason, err)
	}
}

func TestInboxReceipt(t *testing.T) {
	notification := Notification{Method: "session.event", Payload: map[string]any{
		"sessionId": "site-1",
		"event": map[string]any{
			"type": "agent/inbox/spliced",
			"data": map[string]any{"inserted": []any{map[string]any{"id": "message-1"}}},
		},
	}}
	if !isInboxReceipt(notification, "site-1", "message-1") {
		t.Fatal("receipt not recognized")
	}
	if isInboxReceipt(notification, "site-2", "message-1") {
		t.Fatal("foreign receipt accepted")
	}
}
