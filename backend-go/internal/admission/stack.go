package admission

import (
	"context"
	"errors"
	"sync"
	"time"

	"nekoweb/backend-go/internal/config"
)

type Stack struct {
	Config  *config.Config
	Attempt *AttemptGuard
	Limiter *Limiter
	Quota   Quota
	Gate    *RedisGate

	initErr error
	mu      sync.Mutex
	closed  bool
}

func NewStack(ctx context.Context, cfg *config.Config) *Stack {
	stack := &Stack{
		Config:  cfg,
		Attempt: NewAttemptGuard(cfg),
		Limiter: NewLimiter(cfg.CHATMaxConcurrent, cfg.CHATQueueMaxSize, cfg.CHATQueueWaitSeconds),
	}
	if cfg.RedisEnabled {
		quota, err := NewRedisQuota(ctx, cfg)
		if err != nil {
			stack.initErr = err
			stack.Quota = &unavailableQuota{err: err}
			return stack
		}
		gate, gateErr := NewRedisGate(ctx, cfg, time.Duration(cfg.DSHRequestTimeoutSeconds+30)*time.Second)
		if gateErr != nil {
			_ = quota.Close()
			stack.initErr = gateErr
			stack.Quota = &unavailableQuota{err: gateErr}
			return stack
		}
		stack.Quota = quota
		stack.Gate = gate
		return stack
	}
	if cfg.Production() {
		stack.initErr = errors.New("REDIS_ENABLED must be true in production")
		stack.Quota = &unavailableQuota{err: stack.initErr}
		return stack
	}
	stack.Quota = NewMemoryQuota(cfg)
	return stack
}

func (s *Stack) Ready(ctx context.Context) bool {
	if s == nil {
		return true
	}
	if s.initErr != nil {
		return false
	}
	if s.Config.Production() && !s.Config.RedisEnabled {
		return false
	}
	return s.Quota != nil && s.Quota.Ready(ctx)
}

func (s *Stack) Close() {
	if s == nil {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.closed {
		return
	}
	s.closed = true
	if s.Gate != nil {
		_ = s.Gate.Close()
	}
	if s.Quota != nil {
		_ = s.Quota.Close()
	}
}

func (s *Stack) Error() error { return s.initErr }
