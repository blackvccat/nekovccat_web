package admission

import (
	"math"
	"sync"
	"time"

	"nekoweb/backend-go/internal/config"
)

type attemptState struct {
	tokens        float64
	updated       float64
	lastSeen      float64
	strikes       int
	cooldownUntil float64
}

type AttemptGuard struct {
	config     *config.Config
	mu         sync.Mutex
	identities map[string]*attemptState
	order      []string
	global     float64
	globalSeen float64
}

func NewAttemptGuard(cfg *config.Config) *AttemptGuard {
	return &AttemptGuard{
		config:     cfg,
		identities: make(map[string]*attemptState),
		global:     float64(cfg.CHATGlobalAttemptBurst),
		globalSeen: nowSeconds(),
	}
}

func (g *AttemptGuard) Check(identity string, now float64) *Rejection {
	g.mu.Lock()
	defer g.mu.Unlock()
	if now <= 0 {
		now = nowSeconds()
	}

	g.global = math.Min(float64(g.config.CHATGlobalAttemptBurst),
		g.global+math.Max(0, now-g.globalSeen)*g.config.CHATGlobalAttemptsPerSecond)
	g.globalSeen = now
	if g.global < 1 {
		retry := int(math.Max(1, math.Ceil((1-g.global)/g.config.CHATGlobalAttemptsPerSecond)))
		return &Rejection{"Agent 当前请求较多，请稍后再试。", retry, "protection_busy"}
	}
	g.global--

	ttl := math.Max(g.config.CHATAttemptCacheTTLSeconds, g.config.CHATAbuseMaxCooldownSeconds)
	for i := 0; i < 16 && len(g.order) > 0; i++ {
		key := g.order[0]
		state, ok := g.identities[key]
		if !ok {
			g.order = g.order[1:]
			continue
		}
		if now-state.lastSeen < ttl {
			break
		}
		delete(g.identities, key)
		g.order = g.order[1:]
	}

	state, ok := g.identities[identity]
	if !ok {
		if len(g.identities) >= g.config.CHATAttemptCacheSize {
			return &Rejection{"Agent 当前请求较多，请稍后再试。", 60, "protection_busy"}
		}
		state = &attemptState{tokens: float64(g.config.CHATAttemptBurst), updated: now, lastSeen: now}
		g.identities[identity] = state
	}
	state.lastSeen = now
	g.touch(identity)
	if state.cooldownUntil > now {
		retry := int(math.Max(1, math.Ceil(state.cooldownUntil-now)))
		return &Rejection{"当前网络短时间请求过多，已暂时冷却，请等待后再试。", retry, "burst_limit"}
	}
	state.tokens = math.Min(float64(g.config.CHATAttemptBurst),
		state.tokens+math.Max(0, now-state.updated)/g.config.CHATAttemptRefillSeconds)
	state.updated = now
	if state.tokens >= 1 {
		state.tokens--
		return nil
	}
	state.strikes++
	if state.strikes > 32 {
		state.strikes = 32
	}
	cooldown := math.Min(g.config.CHATAbuseMaxCooldownSeconds,
		g.config.CHATAbuseCooldownSeconds*math.Pow(2, float64(minInt(state.strikes-1, 20))))
	state.cooldownUntil = now + cooldown
	return &Rejection{"当前网络短时间请求过多，已暂时冷却，请等待后再试。", int(math.Max(1, cooldown)), "burst_limit"}
}

func (g *AttemptGuard) touch(identity string) {
	for i, key := range g.order {
		if key == identity {
			copy(g.order[i:], g.order[i+1:])
			g.order = g.order[:len(g.order)-1]
			break
		}
	}
	g.order = append(g.order, identity)
}

func nowSeconds() float64 { return float64(time.Now().UnixNano()) / 1e9 }

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}
