package admission

import (
	"context"
	"errors"
	"sync"
	"time"

	"nekoweb/backend-go/internal/config"
)

type Stack struct {
	Config       *config.Config
	Attempt      *AttemptGuard
	Limiter      *Limiter
	Quota        Quota
	RedisLimiter *DistributedLimiter
	RedisAttempt *DistributedAttemptGuard

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
		limiter, limiterErr := NewDistributedLimiter(ctx, cfg, time.Duration(cfg.DSHRequestTimeoutSeconds+30)*time.Second)
		if limiterErr != nil {
			_ = quota.Close()
			stack.initErr = limiterErr
			stack.Quota = &unavailableQuota{err: limiterErr}
			return stack
		}
		attempt, attemptErr := NewDistributedAttemptGuard(ctx, cfg)
		if attemptErr != nil {
			_ = limiter.Close()
			_ = quota.Close()
			stack.initErr = attemptErr
			stack.Quota = &unavailableQuota{err: attemptErr}
			return stack
		}
		stack.Quota = quota
		stack.RedisLimiter = limiter
		stack.RedisAttempt = attempt
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
	if s.Quota == nil || !s.Quota.Ready(ctx) {
		return false
	}
	if s.RedisLimiter != nil && !s.RedisLimiter.Ready(ctx) {
		return false
	}
	if s.RedisAttempt != nil && !s.RedisAttempt.Ready(ctx) {
		return false
	}
	return true
}

func (s *Stack) CheckAttempt(ctx context.Context, identity string, now time.Time) (*Rejection, error) {
	if s.RedisAttempt != nil {
		return s.RedisAttempt.Check(ctx, identity, now)
	}
	return s.Attempt.Check(identity, nowSeconds()), nil
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
	if s.RedisAttempt != nil {
		_ = s.RedisAttempt.Close()
	}
	if s.RedisLimiter != nil {
		_ = s.RedisLimiter.Close()
	}
	if s.Quota != nil {
		_ = s.Quota.Close()
	}
}

func (s *Stack) Error() error { return s.initErr }
