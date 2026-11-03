package admission

import (
	"context"
	"sync"
	"time"
)

type admissionTicket struct {
	identity string
	ready    chan *Rejection
	deadline time.Time
	queued   bool
}

type Limiter struct {
	mu       sync.Mutex
	maximum  int
	queueMax int
	wait     time.Duration
	active   map[string]*admissionTicket
	waiting  map[string]*admissionTicket
	order    []string
}

func NewLimiter(maximum, queueMax int, waitSeconds float64) *Limiter {
	return &Limiter{
		maximum: maximum, queueMax: queueMax,
		wait:   time.Duration(waitSeconds * float64(time.Second)),
		active: make(map[string]*admissionTicket), waiting: make(map[string]*admissionTicket),
	}
}

func (l *Limiter) Enter(identity string, now time.Time) (*admissionTicket, *Rejection) {
	l.mu.Lock()
	defer l.mu.Unlock()
	if _, ok := l.active[identity]; ok {
		return nil, &Rejection{"当前网络已有一条消息正在回复或排队，请等待完成。", 10, "concurrency"}
	}
	if _, ok := l.waiting[identity]; ok {
		return nil, &Rejection{"当前网络已有一条消息正在回复或排队，请等待完成。", 10, "concurrency"}
	}
	l.promoteLocked(now)
	queued := len(l.active) >= l.maximum || len(l.waiting) > 0
	if queued && len(l.waiting) >= l.queueMax {
		return nil, &Rejection{"Agent 当前排队人数较多，请稍后手动重试。", 10, "queue_full"}
	}
	ticket := &admissionTicket{identity: identity, ready: make(chan *Rejection, 1), deadline: now.Add(l.wait)}
	if queued {
		ticket.queued = true
		l.waiting[identity] = ticket
		l.order = append(l.order, identity)
	} else {
		l.active[identity] = ticket
		ticket.ready <- nil
	}
	return ticket, nil
}

func (l *Limiter) Wait(ctx context.Context, ticket *admissionTicket) *Rejection {
	if ticket == nil {
		return nil
	}
	l.mu.Lock()
	queued := ticket.queued
	l.mu.Unlock()
	if !queued {
		select {
		case rejection := <-ticket.ready:
			if ctx.Err() != nil {
				l.Release(ticket)
				return &Rejection{"请求已取消。", 0, "cancelled"}
			}
			return rejection
		case <-ctx.Done():
			l.Release(ticket)
			return &Rejection{"请求已取消。", 0, "cancelled"}
		}
	}
	timer := time.NewTimer(time.Until(ticket.deadline))
	defer timer.Stop()
	select {
	case rejection := <-ticket.ready:
		if ctx.Err() != nil {
			l.Release(ticket)
			return &Rejection{"请求已取消。", 0, "cancelled"}
		}
		return rejection
	case <-ctx.Done():
		l.Release(ticket)
		return &Rejection{"请求已取消。", 0, "cancelled"}
	case <-timer.C:
		select {
		case rejection := <-ticket.ready:
			return rejection
		default:
		}
		l.Release(ticket)
		return &Rejection{"Agent 暂时繁忙，排队等待已结束，请稍后手动重试。", 10, "queue_timeout"}
	}
}

func (l *Limiter) Release(ticket *admissionTicket) {
	if ticket == nil {
		return
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	if l.active[ticket.identity] == ticket {
		delete(l.active, ticket.identity)
	}
	if l.waiting[ticket.identity] == ticket {
		delete(l.waiting, ticket.identity)
		l.removeOrder(ticket.identity)
	}
	l.promoteLocked(time.Now())
}

func (l *Limiter) promoteLocked(now time.Time) {
	for len(l.order) > 0 {
		identity := l.order[0]
		ticket, ok := l.waiting[identity]
		if !ok {
			l.order = l.order[1:]
			continue
		}
		if now.After(ticket.deadline) {
			delete(l.waiting, identity)
			l.order = l.order[1:]
			ticket.ready <- &Rejection{"Agent 暂时繁忙，排队等待已结束，请稍后手动重试。", 10, "queue_timeout"}
			continue
		}
		if len(l.active) >= l.maximum {
			break
		}
		delete(l.waiting, identity)
		l.order = l.order[1:]
		l.active[identity] = ticket
		ticket.queued = false
		ticket.ready <- nil
	}
}

func (l *Limiter) removeOrder(identity string) {
	for i, key := range l.order {
		if key == identity {
			copy(l.order[i:], l.order[i+1:])
			l.order = l.order[:len(l.order)-1]
			return
		}
	}
}

func (l *Limiter) Active() int {
	l.mu.Lock()
	defer l.mu.Unlock()
	return len(l.active)
}

func (l *Limiter) Waiting() int {
	l.mu.Lock()
	defer l.mu.Unlock()
	return len(l.waiting)
}
