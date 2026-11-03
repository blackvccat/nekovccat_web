package admission

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/netip"
	"strings"
	"time"

	"nekoweb/backend-go/internal/chat"
	"nekoweb/backend-go/internal/config"
	"nekoweb/backend-go/internal/jsonutil"
	"nekoweb/backend-go/internal/observability"
)

func (s *Stack) Wrap(next http.Handler) http.Handler {
	if s == nil {
		return next
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !s.Config.Production() || (r.URL.Path != "/api/chat" && r.URL.Path != "/api/chat/") || r.Method != http.MethodPost {
			next.ServeHTTP(w, r)
			return
		}
		if rejection := s.authorize(r); rejection != nil {
			writeRejection(w, rejection)
			return
		}
		ip, _ := clientIdentity(r)
		identity := identityHash(s.Config.InternalAPIToken, ip)
		if rejection := s.Attempt.Check(identity, nowSeconds()); rejection != nil {
			writeRejection(w, rejection)
			return
		}
		ticket, rejection := s.Limiter.Enter(identity, time.Now())
		if rejection != nil {
			writeRejection(w, rejection)
			return
		}
		defer s.Limiter.Release(ticket)

		body, rejection := readChatBody(w, r, s.Config)
		if rejection != nil {
			writeRejection(w, rejection)
			return
		}
		if rejection := s.Limiter.Wait(r.Context(), ticket); rejection != nil {
			writeRejection(w, rejection)
			return
		}
		requestID := observability.RequestID(r.Context())
		quotaCtx, cancel := context.WithTimeout(context.WithoutCancel(r.Context()), 3*time.Second)
		rejection, err := s.Quota.Consume(quotaCtx, identity, requestID, time.Now())
		cancel()
		if err != nil {
			writeRejection(w, &Rejection{"站内 Agent 正在维护，请稍后再试。", 10, "quota_storage"})
			return
		}
		if rejection != nil {
			writeRejection(w, rejection)
			return
		}
		r.Body = io.NopCloser(bytes.NewReader(body))
		r.ContentLength = int64(len(body))
		next.ServeHTTP(w, r)
	})
}

func (s *Stack) authorize(r *http.Request) *Rejection {
	expected := s.Config.InternalAPIToken
	provided := r.Header.Get("X-Neko-Internal-Token")
	if len(expected) < 32 {
		return &Rejection{"站内 Agent 正在维护。", 0, "configuration"}
	}
	if !hmac.Equal([]byte(expected), []byte(provided)) {
		return &Rejection{"请通过本站 Agent 访问。", 0, "unauthorized"}
	}
	if _, err := clientIdentity(r); err != nil {
		return &Rejection{"请从本站公网入口访问 Agent。", 0, "unauthorized"}
	}
	return nil
}

func clientIdentity(r *http.Request) (string, error) {
	raw := r.Header.Get("X-Neko-Client-IP")
	if raw == "local" {
		return "local", nil
	}
	if raw == "" || strings.Contains(raw, "%") {
		return "", errors.New("invalid address")
	}
	addr, err := netip.ParseAddr(raw)
	if err != nil {
		return "", err
	}
	addr = addr.Unmap()
	if addr.Is6() {
		prefix, err := addr.Prefix(64)
		if err != nil {
			return "", err
		}
		addr = prefix.Masked().Addr()
	}
	return addr.String(), nil
}

func identityHash(secret, identity string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(identity))
	return hex.EncodeToString(mac.Sum(nil))
}

func readChatBody(w http.ResponseWriter, r *http.Request, cfg *config.Config) ([]byte, *Rejection) {
	if !strings.HasPrefix(strings.ToLower(r.Header.Get("Content-Type")), "application/json") {
		return nil, &Rejection{"请求格式不支持。", 0, "invalid_request"}
	}
	if r.ContentLength > cfg.CHATBodyMaxBytes {
		return nil, &Rejection{"消息太长或格式无效，请缩短消息或开启新对话。", 0, "invalid_request"}
	}
	controller := http.NewResponseController(w)
	_ = controller.SetReadDeadline(time.Now().Add(time.Duration(cfg.CHATBodyTimeoutSeconds * float64(time.Second))))
	defer controller.SetReadDeadline(time.Time{})
	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, cfg.CHATBodyMaxBytes))
	if err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			return nil, &Rejection{"消息太长或格式无效，请缩短消息或开启新对话。", 0, "invalid_request"}
		}
		if strings.Contains(strings.ToLower(err.Error()), "timeout") {
			return nil, &Rejection{"读取消息超时，请稍后再试。", 1, "body_timeout"}
		}
		return nil, &Rejection{"消息太长或格式无效，请缩短消息或开启新对话。", 0, "invalid_request"}
	}
	if _, err := chat.DecodeRequest(body); err != nil {
		return nil, &Rejection{"消息太长或格式无效，请缩短消息或开启新对话。", 0, "invalid_request"}
	}
	return body, nil
}

func writeRejection(w http.ResponseWriter, rejection *Rejection) {
	status := http.StatusTooManyRequests
	switch rejection.Code {
	case "unauthorized":
		status = http.StatusForbidden
	case "configuration", "quota_storage":
		status = http.StatusServiceUnavailable
	case "invalid_request":
		status = http.StatusUnprocessableEntity
	case "body_timeout":
		status = http.StatusRequestTimeout
	case "cancelled":
		status = 499
	}
	if rejection.RetryAfter > 0 {
		w.Header().Set("Retry-After", fmt.Sprintf("%d", rejection.RetryAfter))
	}
	w.Header().Set("Cache-Control", "no-store")
	data, _ := jsonutil.Marshal(map[string]any{
		"detail": rejection.Message, "code": rejection.Code, "retry_after": rejection.RetryAfter,
	})
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write(data)
}
