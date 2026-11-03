package admission

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"nekoweb/backend-go/internal/config"
)

type DistributedLimiter struct {
	client    *redis.Client
	config    *config.Config
	queueKey  string
	activeKey string
	script    *redis.Script
	lease     time.Duration
	wait      time.Duration
}

type distributedTicket struct {
	identity    string
	member      string
	identityKey string
	deadline    time.Time
	queued      bool
}

func NewDistributedLimiter(ctx context.Context, cfg *config.Config, lease time.Duration) (*DistributedLimiter, error) {
	options, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		return nil, err
	}
	client := redis.NewClient(options)
	timeout := time.Duration(cfg.RedisTimeoutMS) * time.Millisecond
	if timeout <= 0 {
		timeout = 500 * time.Millisecond
	}
	pingCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	if err := client.Ping(pingCtx).Err(); err != nil {
		_ = client.Close()
		return nil, err
	}
	if lease <= 0 {
		lease = 250 * time.Second
	}
	return &DistributedLimiter{
		client: client, config: cfg,
		queueKey: cfg.RedisPrefix + "waiting", activeKey: cfg.RedisPrefix + "slots:active",
		script: redis.NewScript(distributedLimiterLua), lease: lease,
		wait: time.Duration(cfg.CHATQueueWaitSeconds * float64(time.Second)),
	}, nil
}

func (l *DistributedLimiter) Enter(ctx context.Context, identity string) (*distributedTicket, *Rejection, error) {
	now := time.Now()
	member := fmt.Sprintf("%s:%d", identity, now.UnixNano())
	identityKey := l.config.RedisPrefix + "identity:" + identity
	ok, err := l.client.SetNX(ctx, identityKey, member, l.wait+l.lease+10*time.Second).Result()
	if err != nil {
		return nil, nil, err
	}
	if !ok {
		return nil, &Rejection{"当前网络已有一条消息正在回复或排队，请等待完成。", 10, "concurrency"}, nil
	}
	queueLen, err := l.client.ZCard(ctx, l.queueKey).Result()
	if err != nil {
		_ = l.client.Del(ctx, identityKey).Err()
		return nil, nil, err
	}
	if queueLen >= int64(l.config.CHATQueueMaxSize) {
		_ = l.client.Del(ctx, identityKey).Err()
		return nil, &Rejection{"Agent 当前排队人数较多，请稍后手动重试。", 10, "queue_full"}, nil
	}
	if err := l.client.ZAdd(ctx, l.queueKey, redis.Z{Score: float64(now.UnixNano()), Member: member}).Err(); err != nil {
		_ = l.client.Del(ctx, identityKey).Err()
		return nil, nil, err
	}
	ticket := &distributedTicket{
		identity: identity, member: member, identityKey: identityKey,
		deadline: now.Add(l.wait), queued: true,
	}
	state, err := l.tryAcquire(ctx, ticket)
	if err != nil {
		_ = l.Cancel(context.Background(), ticket)
		return nil, nil, err
	}
	switch state {
	case gateTimedOut:
		_ = l.Cancel(context.Background(), ticket)
		return nil, &Rejection{"Agent 暂时繁忙，排队等待已结束，请稍后手动重试。", 10, "queue_timeout"}, nil
	case gateAcquired:
		ticket.queued = false
	}
	return ticket, nil, nil
}

func (l *DistributedLimiter) Wait(ctx context.Context, ticket *distributedTicket) *Rejection {
	if ticket == nil || !ticket.queued {
		return nil
	}
	ticker := time.NewTicker(50 * time.Millisecond)
	defer ticker.Stop()
	for {
		state, err := l.tryAcquire(ctx, ticket)
		if err != nil {
			return &Rejection{"Agent 暂时繁忙，请稍后手动重试。", 10, "queue_timeout"}
		}
		switch state {
		case gateAcquired:
			ticket.queued = false
			return nil
		case gateTimedOut, gateMissing:
			_ = l.Cancel(context.Background(), ticket)
			return &Rejection{"Agent 暂时繁忙，排队等待已结束，请稍后手动重试。", 10, "queue_timeout"}
		}
		if time.Now().After(ticket.deadline) {
			_ = l.Cancel(context.Background(), ticket)
			return &Rejection{"Agent 暂时繁忙，排队等待已结束，请稍后手动重试。", 10, "queue_timeout"}
		}
		select {
		case <-ctx.Done():
			_ = l.Cancel(context.Background(), ticket)
			return &Rejection{"请求已取消。", 0, "cancelled"}
		case <-ticker.C:
		}
	}
}

type gateAttempt int

const (
	gateWaiting gateAttempt = iota
	gateAcquired
	gateTimedOut
	gateMissing
)

func (l *DistributedLimiter) tryAcquire(ctx context.Context, ticket *distributedTicket) (gateAttempt, error) {
	values, err := l.script.Run(ctx, l.client, []string{l.queueKey, l.activeKey, ticket.identityKey},
		time.Now().UnixMilli(), l.config.CHATMaxConcurrent, ticket.member,
		ticket.deadline.UnixMilli(), l.lease.Milliseconds()).Slice()
	if err != nil {
		return gateWaiting, err
	}
	if len(values) == 0 {
		return gateWaiting, nil
	}
	switch asInt64(values[0]) {
	case 1:
		return gateAcquired, nil
	case 0:
		return gateTimedOut, nil
	case -1:
		return gateMissing, nil
	default:
		return gateWaiting, nil
	}
}

func (l *DistributedLimiter) Release(ctx context.Context, ticket *distributedTicket) {
	if ticket == nil {
		return
	}
	pipe := l.client.Pipeline()
	pipe.ZRem(ctx, l.activeKey, ticket.member)
	pipe.ZRem(ctx, l.queueKey, ticket.member)
	pipe.Del(ctx, ticket.identityKey)
	_, _ = pipe.Exec(ctx)
}

func (l *DistributedLimiter) Cancel(ctx context.Context, ticket *distributedTicket) error {
	l.Release(ctx, ticket)
	return nil
}

func (l *DistributedLimiter) Ready(ctx context.Context) bool {
	timeoutCtx, cancel := context.WithTimeout(ctx, 500*time.Millisecond)
	defer cancel()
	return l.client.Ping(timeoutCtx).Err() == nil
}

func (l *DistributedLimiter) Close() error { return l.client.Close() }

const distributedLimiterLua = `
local now = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local member = ARGV[3]
local deadline = tonumber(ARGV[4])
local lease = tonumber(ARGV[5])
redis.call('ZREMRANGEBYSCORE', KEYS[2], '-inf', now)
if redis.call('ZSCORE', KEYS[2], member) then return {1, 0} end
local score = redis.call('ZSCORE', KEYS[1], member)
if not score then return {-1, 0} end
local first = redis.call('ZRANGE', KEYS[1], 0, 0)[1]
if first ~= member then
  if now >= deadline then
    redis.call('ZREM', KEYS[1], member)
    redis.call('DEL', KEYS[3])
    return {0, 0}
  end
  return {-2, 0}
end
local active = redis.call('ZCARD', KEYS[2])
if active >= limit then
  if now >= deadline then
    redis.call('ZREM', KEYS[1], member)
    redis.call('DEL', KEYS[3])
    return {0, 0}
  end
  return {-2, 0}
end
redis.call('ZREM', KEYS[1], member)
redis.call('ZADD', KEYS[2], now + lease, member)
redis.call('PEXPIRE', KEYS[3], lease + 10000)
return {1, 0}
`
