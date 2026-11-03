package admission

import (
	"context"
	"errors"
	"fmt"
	"math"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"

	"nekoweb/backend-go/internal/config"
)

type Quota interface {
	Consume(ctx context.Context, identity, member string, now time.Time) (*Rejection, error)
	Ready(ctx context.Context) bool
	Close() error
}

type MemoryQuota struct {
	cfg    *config.Config
	mu     sync.Mutex
	global []float64
	byIP   map[string][]float64
}

func NewMemoryQuota(cfg *config.Config) *MemoryQuota {
	return &MemoryQuota{cfg: cfg, byIP: make(map[string][]float64)}
}

func (q *MemoryQuota) Consume(_ context.Context, identity, _ string, now time.Time) (*Rejection, error) {
	nowSecondsValue := float64(now.UnixNano()) / 1e9
	q.mu.Lock()
	defer q.mu.Unlock()

	global := prune(q.global, nowSecondsValue-86400)
	ip := prune(q.byIP[identity], nowSecondsValue-86400)
	ipMinute := prune(ip, nowSecondsValue-60)
	ipHour := prune(ip, nowSecondsValue-3600)
	blocks := []windowBlock{
		{period: 86400, limit: q.cfg.CHATDailyLimit, count: len(global), rows: global, code: "daily_quota",
			message: "全站最近 24 小时的 Agent 使用额度已达上限，额度会随旧请求到期逐步恢复。"},
		{period: 60, limit: q.cfg.CHATIPMinuteLimit, count: len(ipMinute), rows: ipMinute, code: "frequency_quota",
			message: "当前网络最近 1 分钟的消息有些频繁，请稍后再试。"},
		{period: 3600, limit: q.cfg.CHATIPHourLimit, count: len(ipHour), rows: ipHour, code: "frequency_quota",
			message: "当前网络最近 1 小时的 Agent 使用次数已达上限，请稍后再试。"},
		{period: 86400, limit: q.cfg.CHATIPDailyLimit, count: len(ip), rows: ip, code: "frequency_quota",
			message: "当前网络最近 24 小时的 Agent 使用次数已达上限，额度会逐步恢复。"},
	}
	var latest *Rejection
	for _, block := range blocks {
		if block.count < block.limit {
			continue
		}
		retryAt := block.rows[len(block.rows)-block.limit] + float64(block.period)
		retry := int(math.Max(1, math.Ceil(retryAt-nowSecondsValue)))
		rejection := &Rejection{block.message, retry, block.code}
		if latest == nil || retry > latest.RetryAfter {
			latest = rejection
		}
	}
	if latest != nil {
		q.global = global
		q.byIP[identity] = ip
		return latest, nil
	}
	q.global = append(global, nowSecondsValue)
	q.byIP[identity] = append(ip, nowSecondsValue)
	return nil, nil
}

func (q *MemoryQuota) Ready(context.Context) bool { return true }
func (q *MemoryQuota) Close() error               { return nil }

type windowBlock struct {
	key     string
	period  int
	limit   int
	count   int
	rows    []float64
	code    string
	message string
}

func prune(values []float64, cutoff float64) []float64 {
	index := 0
	for index < len(values) && values[index] <= cutoff {
		index++
	}
	return append([]float64(nil), values[index:]...)
}

type redisQuota struct {
	client *redis.Client
	cfg    *config.Config
	script *redis.Script
}

func NewRedisQuota(ctx context.Context, cfg *config.Config) (*redisQuota, error) {
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
	return &redisQuota{client: client, cfg: cfg, script: redis.NewScript(redisQuotaLua)}, nil
}

func (q *redisQuota) Consume(ctx context.Context, identity, member string, now time.Time) (*Rejection, error) {
	prefix := q.cfg.RedisPrefix
	keys := []string{
		prefix + "quota:global:day",
		prefix + "quota:ip:" + identity + ":minute",
		prefix + "quota:ip:" + identity + ":hour",
		prefix + "quota:ip:" + identity + ":day",
	}
	if member == "" {
		member = fmt.Sprintf("%d", now.UnixNano())
	}
	values, err := q.script.Run(ctx, q.client, keys,
		now.UnixMilli(), q.cfg.CHATDailyLimit, q.cfg.CHATIPMinuteLimit,
		q.cfg.CHATIPHourLimit, q.cfg.CHATIPDailyLimit, member).Slice()
	if err != nil {
		return nil, err
	}
	if len(values) < 3 {
		return nil, errors.New("unexpected quota response")
	}
	allowed := asInt64(values[0])
	if allowed == 1 {
		return nil, nil
	}
	retry := int(asInt64(values[1]))
	if retry <= 0 {
		retry = 60
	}
	code, _ := values[2].(string)
	message := "当前网络最近的使用次数已达上限，请稍后再试。"
	switch code {
	case "daily_quota":
		message = "全站最近 24 小时的 Agent 使用额度已达上限，额度会随旧请求到期逐步恢复。"
	case "frequency_quota":
		message = "当前网络最近的使用次数已达上限，额度会逐步恢复。"
	}
	return &Rejection{message, retry, code}, nil
}

func asInt64(value any) int64 {
	switch typed := value.(type) {
	case int64:
		return typed
	case int:
		return int64(typed)
	case float64:
		return int64(typed)
	case string:
		var parsed int64
		_, _ = fmt.Sscan(typed, &parsed)
		return parsed
	default:
		return 0
	}
}

func (q *redisQuota) Ready(ctx context.Context) bool {
	timeout := time.Duration(q.cfg.RedisTimeoutMS) * time.Millisecond
	if timeout <= 0 {
		timeout = 500 * time.Millisecond
	}
	pingCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	return q.client.Ping(pingCtx).Err() == nil
}

func (q *redisQuota) Close() error { return q.client.Close() }

const redisQuotaLua = `
local now = tonumber(ARGV[1])
local limits = {tonumber(ARGV[2]), tonumber(ARGV[3]), tonumber(ARGV[4]), tonumber(ARGV[5])}
local member = ARGV[6]
local windows = {86400000, 60000, 3600000, 86400000}
local retry = 0
local code = 'frequency_quota'
for i = 1, 4 do
  local key = KEYS[i]
  redis.call('ZREMRANGEBYSCORE', key, '-inf', now - windows[i])
  local count = redis.call('ZCARD', key)
  if count >= limits[i] then
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local retryAt = tonumber(oldest[2]) + windows[i]
    if retryAt - now > retry then
      retry = retryAt - now
    end
    if i == 1 then
      code = 'daily_quota'
    end
  end
end
if retry > 0 then
  return {0, math.ceil(retry / 1000), code}
end
for i = 1, 4 do
  redis.call('ZADD', KEYS[i], now, member)
  redis.call('PEXPIRE', KEYS[i], windows[i])
end
return {1, 0, ''}
`

type unavailableQuota struct{ err error }

func (q *unavailableQuota) Consume(context.Context, string, string, time.Time) (*Rejection, error) {
	return nil, q.err
}
func (q *unavailableQuota) Ready(context.Context) bool { return false }
func (q *unavailableQuota) Close() error               { return nil }
