package agent

import (
	"context"
	"sync"
	"time"

	"nekoweb/backend-go/internal/chat"
	"nekoweb/backend-go/internal/jsonutil"
)

type bufferedEvent struct {
	event chat.Event
	size  int
}

type terminalResult struct {
	kind    string
	payload any
}

type StreamBuffer struct {
	mu        sync.Mutex
	items     []bufferedEvent
	bytes     int
	maxEvents int
	maxBytes  int
	peakBytes int
	terminal  *terminalResult
	stopped   bool
	wake      chan struct{}
}

func NewStreamBuffer(maxEvents, maxBytes int) *StreamBuffer {
	return &StreamBuffer{
		maxEvents: maxEvents,
		maxBytes:  maxBytes,
		wake:      make(chan struct{}, 1),
	}
}

func (b *StreamBuffer) PeakBytes() int {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.peakBytes
}

func (b *StreamBuffer) Publish(event chat.Event) error {
	data, err := jsonutil.Marshal(event)
	if err != nil {
		return err
	}
	size := len(data)
	b.mu.Lock()
	if b.stopped {
		b.mu.Unlock()
		return NewAgentError("请求已取消。", 499, "cancelled")
	}
	if len(b.items) > 0 && event["content"] != nil {
		previous := &b.items[len(b.items)-1]
		sameReply := event["event"] == previous.event["event"] &&
			event["phase"] == previous.event["phase"] &&
			event["message_id"] == previous.event["message_id"] &&
			event["phase"] != "final"
		if sameReply && previous.event["content"] != nil && previous.size+size <= 4096 && b.bytes+size <= b.maxBytes {
			previous.event["content"] = stringValue(previous.event["content"]) + stringValue(event["content"])
			previous.size += size
			b.bytes += size
			if b.bytes > b.peakBytes {
				b.peakBytes = b.bytes
			}
			b.mu.Unlock()
			return nil
		}
	}
	if len(b.items) >= b.maxEvents || b.bytes+size > b.maxBytes {
		failure := NewAgentError("连接接收较慢，请重新发送消息。", 503, "slow_consumer")
		b.terminal = &terminalResult{kind: "error", payload: failure}
		b.items = nil
		b.bytes = 0
		b.stopped = true
		b.mu.Unlock()
		b.signal()
		return failure
	}
	b.items = append(b.items, bufferedEvent{event: event, size: size})
	b.bytes += size
	if b.bytes > b.peakBytes {
		b.peakBytes = b.bytes
	}
	b.mu.Unlock()
	b.signal()
	return nil
}

func (b *StreamBuffer) Finish(kind string, payload any) {
	b.mu.Lock()
	if b.terminal != nil || b.stopped {
		b.mu.Unlock()
		return
	}
	b.terminal = &terminalResult{kind: kind, payload: payload}
	if kind == "error" {
		b.items = nil
		b.bytes = 0
	}
	b.mu.Unlock()
	b.signal()
}

func (b *StreamBuffer) Get(ctx context.Context, timeout time.Duration) (string, any, error) {
	timer := time.NewTimer(timeout)
	defer timer.Stop()
	for {
		b.mu.Lock()
		if len(b.items) > 0 {
			item := b.items[0]
			b.items = b.items[1:]
			b.bytes -= item.size
			b.mu.Unlock()
			return "event", item.event, nil
		}
		if b.terminal != nil {
			terminal := b.terminal
			b.mu.Unlock()
			return terminal.kind, terminal.payload, nil
		}
		b.mu.Unlock()

		select {
		case <-ctx.Done():
			return "", nil, ctx.Err()
		case <-timer.C:
			return "", nil, context.DeadlineExceeded
		case <-b.wake:
		}
	}
}

func (b *StreamBuffer) Stop() {
	b.mu.Lock()
	b.stopped = true
	b.items = nil
	b.bytes = 0
	b.mu.Unlock()
	b.signal()
}

func (b *StreamBuffer) signal() {
	select {
	case b.wake <- struct{}{}:
	default:
	}
}
