package admission

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"

	"nekoweb/backend-go/internal/config"
)

func admissionConfig() *config.Config {
	return &config.Config{
		Environment: "production", InternalAPIToken: strings.Repeat("t", 32),
		CHATMaxConcurrent: 1, CHATQueueMaxSize: 2, CHATQueueWaitSeconds: 0.05,
		CHATDailyLimit: 100, CHATIPMinuteLimit: 10, CHATIPHourLimit: 20, CHATIPDailyLimit: 30,
		CHATAttemptBurst: 4, CHATAttemptRefillSeconds: 10,
		CHATAbuseCooldownSeconds: 1, CHATAbuseMaxCooldownSeconds: 4,
		CHATAttemptCacheSize: 16, CHATAttemptCacheTTLSeconds: 60,
		CHATGlobalAttemptBurst: 1000, CHATGlobalAttemptsPerSecond: 1000,
		CHATBodyMaxBytes: 65536, CHATBodyTimeoutSeconds: 1,
	}
}

func TestAttemptGuardCooldown(t *testing.T) {
	guard := NewAttemptGuard(admissionConfig())
	now := 1000.0
	for i := 0; i < 4; i++ {
		if rejection := guard.Check("one", now); rejection != nil {
			t.Fatalf("attempt %d: %+v", i, rejection)
		}
	}
	if rejection := guard.Check("one", now); rejection == nil || rejection.Code != "burst_limit" {
		t.Fatalf("expected cooldown: %+v", rejection)
	}
	if rejection := guard.Check("one", now+1); rejection == nil || rejection.RetryAfter < 1 {
		t.Fatalf("expected retry: %+v", rejection)
	}
}

func TestLimiterFIFOAndQueueFull(t *testing.T) {
	limiter := NewLimiter(1, 1, 1)
	now := time.Now()
	first, rejection := limiter.Enter("a", now)
	if rejection != nil || first == nil {
		t.Fatalf("first: %+v %+v", first, rejection)
	}
	second, rejection := limiter.Enter("b", now)
	if rejection != nil || second == nil {
		t.Fatalf("second: %+v %+v", second, rejection)
	}
	if _, rejection := limiter.Enter("c", now); rejection == nil || rejection.Code != "queue_full" {
		t.Fatalf("queue full: %+v", rejection)
	}
	go func() {
		time.Sleep(20 * time.Millisecond)
		limiter.Release(first)
	}()
	if rejection := limiter.Wait(context.Background(), second); rejection != nil {
		t.Fatalf("wait: %+v", rejection)
	}
	limiter.Release(second)
	if limiter.Active() != 0 || limiter.Waiting() != 0 {
		t.Fatalf("active=%d waiting=%d", limiter.Active(), limiter.Waiting())
	}
}

func TestLimiterQueueTimeoutAndCancel(t *testing.T) {
	limiter := NewLimiter(1, 2, 0.02)
	first, _ := limiter.Enter("a", time.Now())
	second, _ := limiter.Enter("b", time.Now())
	if rejection := limiter.Wait(context.Background(), second); rejection == nil || rejection.Code != "queue_timeout" {
		t.Fatalf("timeout: %+v", rejection)
	}
	limiter.Release(first)
	third, _ := limiter.Enter("c", time.Now())
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if rejection := limiter.Wait(ctx, third); rejection == nil || rejection.Code != "cancelled" {
		t.Fatalf("cancel: %+v", rejection)
	}
}

func TestMemoryQuotaWindows(t *testing.T) {
	cfg := admissionConfig()
	cfg.CHATIPMinuteLimit = 2
	quota := NewMemoryQuota(cfg)
	now := time.Unix(1_700_000_000, 0)
	if rejection, err := quota.Consume(context.Background(), "a", "1", now); err != nil || rejection != nil {
		t.Fatalf("first: %+v %v", rejection, err)
	}
	if rejection, err := quota.Consume(context.Background(), "a", "2", now.Add(10*time.Second)); err != nil || rejection != nil {
		t.Fatalf("second: %+v %v", rejection, err)
	}
	if rejection, err := quota.Consume(context.Background(), "a", "3", now.Add(20*time.Second)); err != nil || rejection == nil || rejection.Code != "frequency_quota" {
		t.Fatalf("third: %+v %v", rejection, err)
	}
	if rejection, err := quota.Consume(context.Background(), "a", "4", now.Add(61*time.Second)); err != nil || rejection != nil {
		t.Fatalf("after window: %+v %v", rejection, err)
	}
}

func TestStackProductionRequiresRedis(t *testing.T) {
	cfg := admissionConfig()
	stack := NewStack(context.Background(), cfg)
	if stack.Ready(context.Background()) {
		t.Fatal("production without Redis must not be ready")
	}
	cfg.Environment = "development"
	stack = NewStack(context.Background(), cfg)
	if !stack.Ready(context.Background()) {
		t.Fatal("development memory quota should be ready")
	}
}

func TestMiddlewareAdmitsValidRequestAndRejectsToken(t *testing.T) {
	cfg := admissionConfig()
	cfg.CHATMaxConcurrent = 3
	cfg.CHATQueueMaxSize = 3
	stack := &Stack{Config: cfg, Attempt: NewAttemptGuard(cfg), Limiter: NewLimiter(3, 3, 1), Quota: NewMemoryQuota(cfg)}
	var called bool
	handler := stack.Wrap(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		body := make([]byte, r.ContentLength)
		_, _ = r.Body.Read(body)
		w.WriteHeader(http.StatusOK)
	}))
	request := httptest.NewRequest(http.MethodPost, "/api/chat/", strings.NewReader(`{"messages":[{"role":"user","content":"hi"}]}`))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Neko-Internal-Token", cfg.InternalAPIToken)
	request.Header.Set("X-Neko-Client-IP", "1.2.3.4")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusOK || !called {
		t.Fatalf("valid request: %d called=%v body=%s", response.Code, called, response.Body.String())
	}

	bad := httptest.NewRequest(http.MethodPost, "/api/chat/", strings.NewReader(`{}`))
	bad.Header.Set("Content-Type", "application/json")
	bad.Header.Set("X-Neko-Client-IP", "1.2.3.4")
	badResponse := httptest.NewRecorder()
	handler.ServeHTTP(badResponse, bad)
	if badResponse.Code != http.StatusForbidden {
		t.Fatalf("bad token: %d %s", badResponse.Code, badResponse.Body.String())
	}
}

func TestRedisQuotaRollingWindow(t *testing.T) {
	server := miniredis.RunT(t)
	cfg := admissionConfig()
	cfg.RedisEnabled = true
	cfg.RedisURL = "redis://" + server.Addr() + "/0"
	cfg.RedisPrefix = "test:"
	cfg.CHATIPMinuteLimit = 2
	cfg.CHATDailyLimit = 10
	ctx := context.Background()
	quota, err := NewRedisQuota(ctx, cfg)
	if err != nil {
		t.Fatal(err)
	}
	defer quota.Close()
	now := time.Unix(1_700_000_000, 0)
	for i := 0; i < 2; i++ {
		if rejection, err := quota.Consume(ctx, "identity", "member-"+string(rune('a'+i)), now); err != nil || rejection != nil {
			t.Fatalf("consume %d: %+v %v", i, rejection, err)
		}
	}
	if rejection, err := quota.Consume(ctx, "identity", "member-c", now); err != nil || rejection == nil || rejection.Code != "frequency_quota" {
		t.Fatalf("expected rejection: %+v %v", rejection, err)
	}
	if rejection, err := quota.Consume(ctx, "identity", "member-d", now.Add(61*time.Second)); err != nil || rejection != nil {
		t.Fatalf("after window: %+v %v", rejection, err)
	}
}

func TestDistributedLimiterSharesFIFOAndSlots(t *testing.T) {
	server := miniredis.RunT(t)
	cfg := admissionConfig()
	cfg.RedisEnabled = true
	cfg.RedisURL = "redis://" + server.Addr() + "/0"
	cfg.RedisPrefix = "test:"
	cfg.RedisTimeoutMS = 500
	cfg.CHATMaxConcurrent = 1
	cfg.CHATQueueMaxSize = 2
	cfg.CHATQueueWaitSeconds = 1
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	limiter, err := NewDistributedLimiter(ctx, cfg, time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	defer limiter.Close()

	first, rejection, err := limiter.Enter(ctx, "first")
	if err != nil || rejection != nil || first == nil {
		t.Fatalf("first enter: %+v %+v %v", first, rejection, err)
	}
	if rejection := limiter.Wait(ctx, first); rejection != nil {
		t.Fatalf("first wait: %+v", rejection)
	}
	second, rejection, err := limiter.Enter(ctx, "second")
	if err != nil || rejection != nil || second == nil {
		t.Fatalf("second enter: %+v %+v %v", second, rejection, err)
	}
	done := make(chan *Rejection, 1)
	go func() { done <- limiter.Wait(ctx, second) }()
	time.Sleep(60 * time.Millisecond)
	select {
	case rejection := <-done:
		t.Fatalf("second granted early: %+v", rejection)
	default:
	}
	limiter.Release(ctx, first)
	select {
	case rejection := <-done:
		if rejection != nil {
			t.Fatalf("second wait: %+v", rejection)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("second was not promoted")
	}
	limiter.Release(ctx, second)

	if _, rejection, err := limiter.Enter(ctx, "first"); err != nil || rejection != nil {
		t.Fatalf("reuse after release: %+v %v", rejection, err)
	}
}

func TestDistributedLimiterDuplicateAndTimeout(t *testing.T) {
	server := miniredis.RunT(t)
	cfg := admissionConfig()
	cfg.RedisEnabled = true
	cfg.RedisURL = "redis://" + server.Addr() + "/0"
	cfg.RedisPrefix = "test:"
	cfg.RedisTimeoutMS = 500
	cfg.CHATMaxConcurrent = 1
	cfg.CHATQueueMaxSize = 2
	cfg.CHATQueueWaitSeconds = 0.05
	ctx := context.Background()
	limiter, err := NewDistributedLimiter(ctx, cfg, time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	defer limiter.Close()
	first, _, _ := limiter.Enter(ctx, "same")
	_, rejection, _ := limiter.Enter(ctx, "same")
	if rejection == nil || rejection.Code != "concurrency" {
		t.Fatalf("duplicate: %+v", rejection)
	}
	second, rejection, _ := limiter.Enter(ctx, "other")
	if rejection != nil || second == nil {
		t.Fatalf("second: %+v", rejection)
	}
	if rejection := limiter.Wait(ctx, second); rejection == nil || rejection.Code != "queue_timeout" {
		t.Fatalf("timeout: %+v", rejection)
	}
	limiter.Release(ctx, first)
}
