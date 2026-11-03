package admission

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"nekoweb/backend-go/internal/config"
)

type DistributedAttemptGuard struct {
	client *redis.Client
	config *config.Config
	script *redis.Script
}

func NewDistributedAttemptGuard(ctx context.Context, cfg *config.Config) (*DistributedAttemptGuard, error) {
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
	return &DistributedAttemptGuard{client: client, config: cfg, script: redis.NewScript(distributedAttemptLua)}, nil
}

func (g *DistributedAttemptGuard) Check(ctx context.Context, identity string, now time.Time) (*Rejection, error) {
	prefix := g.config.RedisPrefix
	values, err := g.script.Run(ctx, g.client,
		[]string{prefix + "attempt:" + identity, prefix + "attempt:global"},
		float64(now.UnixNano())/1e9,
		g.config.CHATAttemptBurst, g.config.CHATAttemptRefillSeconds,
		g.config.CHATAbuseCooldownSeconds, g.config.CHATAbuseMaxCooldownSeconds,
		g.config.CHATAttemptCacheTTLSeconds,
		g.config.CHATGlobalAttemptBurst, g.config.CHATGlobalAttemptsPerSecond,
	).Slice()
	if err != nil {
		return nil, err
	}
	if len(values) < 3 {
		return nil, fmt.Errorf("unexpected attempt response")
	}
	if asInt64(values[0]) == 1 {
		return nil, nil
	}
	code, _ := values[2].(string)
	retry := int(asInt64(values[1]))
	if retry <= 0 {
		retry = 1
	}
	message := "当前网络短时间请求过多，已暂时冷却，请等待后再试。"
	if code == "protection_busy" {
		message = "Agent 当前请求较多，请稍后再试。"
	}
	return &Rejection{message, retry, code}, nil
}

func (g *DistributedAttemptGuard) Ready(ctx context.Context) bool {
	timeoutCtx, cancel := context.WithTimeout(ctx, 500*time.Millisecond)
	defer cancel()
	return g.client.Ping(timeoutCtx).Err() == nil
}

func (g *DistributedAttemptGuard) Close() error { return g.client.Close() }

const distributedAttemptLua = `
local now = tonumber(ARGV[1])
local burst = tonumber(ARGV[2])
local refill = tonumber(ARGV[3])
local cooldownBase = tonumber(ARGV[4])
local cooldownMax = tonumber(ARGV[5])
local cacheTTL = tonumber(ARGV[6])
local globalBurst = tonumber(ARGV[7])
local globalRate = tonumber(ARGV[8])

local g = redis.call('HMGET', KEYS[2], 'tokens', 'updated')
local gt = tonumber(g[1]) or globalBurst
local gu = tonumber(g[2]) or now
gt = math.min(globalBurst, gt + math.max(0, now - gu) * globalRate)
if gt < 1 then
  local retry = math.max(1, math.ceil((1 - gt) / globalRate))
  redis.call('HSET', KEYS[2], 'tokens', gt, 'updated', now)
  redis.call('PEXPIRE', KEYS[2], math.ceil(cacheTTL * 1000))
  return {0, retry, 'protection_busy'}
end
gt = gt - 1
redis.call('HSET', KEYS[2], 'tokens', gt, 'updated', now)
redis.call('PEXPIRE', KEYS[2], math.ceil(cacheTTL * 1000))

local cooldown = tonumber(redis.call('HGET', KEYS[1], 'cooldown') or '0')
if cooldown > now then
  redis.call('PEXPIRE', KEYS[1], math.ceil(math.max(cacheTTL, cooldownMax) * 1000))
  return {0, math.max(1, math.ceil(cooldown - now)), 'burst_limit'}
end
local tokens = tonumber(redis.call('HGET', KEYS[1], 'tokens') or tostring(burst))
local updated = tonumber(redis.call('HGET', KEYS[1], 'updated') or tostring(now))
tokens = math.min(burst, tokens + math.max(0, now - updated) / refill)
if tokens >= 1 then
  tokens = tokens - 1
  redis.call('HSET', KEYS[1], 'tokens', tokens, 'updated', now)
  redis.call('PEXPIRE', KEYS[1], math.ceil(math.max(cacheTTL, cooldownMax) * 1000))
  return {1, 0, ''}
end
local strikes = tonumber(redis.call('HGET', KEYS[1], 'strikes') or '0') + 1
if strikes > 32 then strikes = 32 end
local cooldownSeconds = math.min(cooldownMax, cooldownBase * (2 ^ math.min(strikes - 1, 20)))
redis.call('HSET', KEYS[1], 'tokens', 0, 'updated', now, 'strikes', strikes, 'cooldown', now + cooldownSeconds)
redis.call('PEXPIRE', KEYS[1], math.ceil(math.max(cacheTTL, cooldownMax) * 1000))
return {0, math.max(1, math.ceil(cooldownSeconds)), 'burst_limit'}
`
