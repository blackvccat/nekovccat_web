package harness

import (
	"context"
	"errors"
	"sync"
)

var ErrNotificationLimit = errors.New("harness notification limit exceeded")

type Notification struct {
	Method  string
	Payload map[string]any
}

type notificationQueue struct {
	mu        sync.Mutex
	items     []Notification
	bytes     int
	maxEvents int
	maxBytes  int
	err       error
	wake      chan struct{}
}

func newNotificationQueue(maxEvents, maxBytes int) *notificationQueue {
	return &notificationQueue{
		maxEvents: maxEvents,
		maxBytes:  maxBytes,
		wake:      make(chan struct{}, 1),
	}
}

func (q *notificationQueue) reset() {
	q.mu.Lock()
	q.items = nil
	q.bytes = 0
	q.err = nil
	q.mu.Unlock()
}

func (q *notificationQueue) push(notification Notification, size int) error {
	q.mu.Lock()
	if q.err != nil {
		err := q.err
		q.mu.Unlock()
		return err
	}
	if len(q.items) >= q.maxEvents || q.bytes+size > q.maxBytes {
		q.err = ErrNotificationLimit
		q.items = nil
		q.bytes = 0
		q.mu.Unlock()
		q.signal()
		return ErrNotificationLimit
	}
	q.items = append(q.items, notification)
	q.bytes += size
	q.mu.Unlock()
	q.signal()
	return nil
}

func (q *notificationQueue) fail(err error) {
	q.mu.Lock()
	if q.err == nil {
		q.err = err
	}
	q.mu.Unlock()
	q.signal()
}

func (q *notificationQueue) pop(ctx context.Context) (Notification, error) {
	for {
		q.mu.Lock()
		if len(q.items) > 0 {
			item := q.items[0]
			q.items = q.items[1:]
			q.bytes -= notificationSize(item)
			q.mu.Unlock()
			return item, nil
		}
		if q.err != nil {
			err := q.err
			q.mu.Unlock()
			return Notification{}, err
		}
		q.mu.Unlock()

		select {
		case <-ctx.Done():
			return Notification{}, ctx.Err()
		case <-q.wake:
		}
	}
}

func (q *notificationQueue) signal() {
	select {
	case q.wake <- struct{}{}:
	default:
	}
}

func notificationSize(notification Notification) int {
	data, err := marshalNoEscape(notification.Payload)
	if err != nil {
		return 0
	}
	return len(data)
}
