package agent

import (
	"context"
	"testing"
	"time"

	"nekoweb/backend-go/internal/chat"
)

func TestStreamBufferCoalescesTextAndFindsTerminal(t *testing.T) {
	buffer := NewStreamBuffer(4, 4096)
	for _, text := range []string{"你", "好", "！"} {
		if err := buffer.Publish(chat.Event{"content": text, "done": false}); err != nil {
			t.Fatal(err)
		}
	}
	buffer.Finish("result", streamResult{Content: "你好！"})
	kind, payload, err := buffer.Get(context.Background(), time.Second)
	if err != nil || kind != "event" {
		t.Fatalf("event: %v %v %v", kind, payload, err)
	}
	if payload.(chat.Event)["content"] != "你好！" {
		t.Fatalf("unexpected coalesced event: %+v", payload)
	}
	kind, payload, err = buffer.Get(context.Background(), time.Second)
	if err != nil || kind != "result" {
		t.Fatalf("result: %v %v %v", kind, payload, err)
	}
}

func TestStreamBufferSlowConsumerFailsVisible(t *testing.T) {
	buffer := NewStreamBuffer(1, 4096)
	if err := buffer.Publish(chat.Event{"event": "tool", "name": "one"}); err != nil {
		t.Fatal(err)
	}
	if err := buffer.Publish(chat.Event{"event": "tool", "name": "two"}); err == nil {
		t.Fatal("expected slow consumer error")
	}
	buffer.Finish("result", streamResult{Content: "should not win"})
	kind, payload, err := buffer.Get(context.Background(), time.Second)
	if err != nil || kind != "error" {
		t.Fatalf("expected error terminal: %v %v %v", kind, payload, err)
	}
}
