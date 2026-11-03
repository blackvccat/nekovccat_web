package admission

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"nekoweb/backend-go/internal/config"
)

type RedisGate struct {
	client *redis.Client
	script *redis.Script
	lease  time.Duration
}

func NewRedisGate(ctx context.Context, cfg *config.Config, lease time.Duration) (*RedisGate, error) {
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
	return &RedisGate{client: client, script: redis.NewScript(redisGateLua), lease: lease}, nil
}

func (g *RedisGate) Acquire(ctx context.Context, key, member string, limit int, now time.Time) (bool, int, error) {
	values, err := g.script.Run(ctx, g.client, []string{key},
		now.UnixMilli(), limit, now.Add(g.lease).UnixMilli(), member, g.lease.Milliseconds()).Slice()
	if err != nil {
		return false, 0, err
	}
	if len(values) < 2 {
		return false, 0, fmt.Errorf("unexpected gate response")
	}
	if asInt64(values[0]) == 1 {
		return true, 0, nil
	}
	retry := int(asInt64(values[1]))
	if retry <= 0 {
		retry = 10
	}
	return false, retry, nil
}

func (g *RedisGate) Release(ctx context.Context, key, member string) error {
	return g.client.ZRem(ctx, key, member).Err()
}

func (g *RedisGate) Ready(ctx context.Context) bool {
	timeoutCtx, cancel := context.WithTimeout(ctx, 500*time.Millisecond)
	defer cancel()
	return g.client.Ping(timeoutCtx).Err() == nil
}

func (g *RedisGate) Close() error { return g.client.Close() }

const redisGateLua = `
local now = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local expires = tonumber(ARGV[3])
local member = ARGV[4]
local ttl = tonumber(ARGV[5])
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now)
local count = redis.call('ZCARD', KEYS[1])
if count >= limit then
  local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
  local wait = 1
  if oldest[2] then wait = math.max(1, math.ceil((tonumber(oldest[2]) - now) / 1000)) end
  return {0, wait}
end
redis.call('ZADD', KEYS[1], expires, member)
redis.call('PEXPIRE', KEYS[1], ttl + 10000)
return {1, 0}
`
