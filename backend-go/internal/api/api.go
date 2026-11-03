package api

import (
	"context"
	"crypto/hmac"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/netip"
	"strings"
	"time"

	"nekoweb/backend-go/internal/agent"
	"nekoweb/backend-go/internal/chat"
	"nekoweb/backend-go/internal/config"
	"nekoweb/backend-go/internal/jsonutil"
	"nekoweb/backend-go/internal/observability"
	"nekoweb/backend-go/internal/relationship"
)

type Server struct {
	config  *config.Config
	manager *agent.Manager
	service *agent.Service
	logger  *slog.Logger
}

func NewServer(cfg *config.Config, manager *agent.Manager, logger *slog.Logger) *Server {
	return &Server{
		config:  cfg,
		manager: manager,
		service: agent.NewService(cfg, manager, logger),
		logger:  logger,
	}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /", s.root)
	mux.HandleFunc("GET /health", s.health)
	mux.HandleFunc("GET /api/health", s.health)
	mux.HandleFunc("GET /api/ready", s.ready)
	mux.HandleFunc("POST /api/chat/", s.chat)
	mux.HandleFunc("POST /api/chat", s.chat)
	return observability.Telemetry(s.logger, s.cors(mux))
}

func (s *Server) root(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"message":     "Nekovccat Agent API",
		"version":     "1.0.0",
		"environment": s.config.Environment,
	})
}

func (s *Server) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "ok",
		"service": "backend",
		"message": "Backend service is running",
	})
}

func (s *Server) ready(w http.ResponseWriter, _ *http.Request) {
	production := s.config.Production()
	checks := map[string]bool{
		"agent_configuration":  s.manager.Ready(),
		"proxy_authentication": !production || len(s.config.InternalAPIToken) >= 32,
		"quota_storage":        !production,
		"application_database": true,
	}
	available := true
	for _, value := range checks {
		if !value {
			available = false
		}
	}
	status := http.StatusOK
	if !available {
		status = http.StatusServiceUnavailable
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, status, map[string]any{
		"status": map[bool]string{true: "ready", false: "unavailable"}[available],
		"checks": checks,
	})
}

func (s *Server) chat(w http.ResponseWriter, r *http.Request) {
	stream := strings.EqualFold(r.URL.Query().Get("stream"), "true")
	progressive := stream && r.URL.Query().Get("protocol") == "v2"

	if err := s.guard(r); err != nil {
		writeProtectionError(w, err)
		return
	}
	request, err := s.readRequest(w, r)
	if err != nil {
		writeRouteError(w, err)
		return
	}
	if !stream {
		reply, err := s.service.GenerateReply(r.Context(), request.Messages)
		if err != nil {
			writeRouteError(w, err)
			return
		}
		response := chat.Response{
			Role:      "assistant",
			Content:   reply.Content,
			Timestamp: timestamp(),
		}
		if reply.DesktopAction != "" {
			proof := relationship.CreateUnlockProof(r.Header.Get("X-Neko-Session-ID"), s.config.InternalAPIToken, time.Now())
			if proof == "" {
				reply.DesktopAction = ""
			} else {
				action := reply.DesktopAction
				response.DesktopAction = &action
				response.DesktopProof = &proof
			}
		}
		writeJSON(w, http.StatusOK, response)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("X-Accel-Buffering", "no")
	controller := http.NewResponseController(w)
	emit := func(event chat.Event) error {
		if event["event"] == "heartbeat" {
			if err := setWriteDeadline(controller, s.config.CHATSendTimeoutSeconds); err != nil {
				return err
			}
			if _, err := io.WriteString(w, ": keep-alive\n\n"); err != nil {
				return err
			}
			return controller.Flush()
		}
		if event["event"] == "desktop" {
			proof := relationship.CreateUnlockProof(r.Header.Get("X-Neko-Session-ID"), s.config.InternalAPIToken, time.Now())
			if proof == "" {
				return nil
			}
			event = cloneEvent(event)
			event["proof"] = proof
		}
		data, err := jsonutil.Marshal(event)
		if err != nil {
			return err
		}
		if err := setWriteDeadline(controller, s.config.CHATSendTimeoutSeconds); err != nil {
			return err
		}
		if _, err := fmt.Fprintf(w, "data: %s\n\n", data); err != nil {
			return err
		}
		return controller.Flush()
	}

	err = s.service.Stream(r.Context(), request.Messages, progressive, emit)
	if err != nil {
		safe := agent.SafeError(err)
		payload := chat.Event{"error": safe.Message, "done": true}
		data, _ := jsonutil.Marshal(payload)
		if writeErr := setWriteDeadline(controller, s.config.CHATSendTimeoutSeconds); writeErr == nil {
			_, _ = fmt.Fprintf(w, "data: %s\n\n", data)
			_ = controller.Flush()
		}
		observability.LogEvent(r.Context(), s.logger, "chat_stream", "outcome", safe.Code)
	}
}

func (s *Server) readRequest(w http.ResponseWriter, r *http.Request) (chat.Request, error) {
	if !strings.HasPrefix(strings.ToLower(r.Header.Get("Content-Type")), "application/json") {
		return chat.Request{}, &apiError{Status: http.StatusUnsupportedMediaType, Message: "请求格式不支持。", Code: "invalid_request"}
	}
	controller := http.NewResponseController(w)
	_ = controller.SetReadDeadline(time.Now().Add(time.Duration(s.config.CHATBodyTimeoutSeconds * float64(time.Second))))
	defer controller.SetReadDeadline(time.Time{})

	body := http.MaxBytesReader(w, r.Body, s.config.CHATBodyMaxBytes)
	data, err := io.ReadAll(body)
	if err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			return chat.Request{}, &apiError{Status: http.StatusRequestEntityTooLarge, Message: "消息太长或格式无效，请缩短消息或开启新对话。", Code: "invalid_request"}
		}
		if errors.Is(err, context.DeadlineExceeded) || strings.Contains(strings.ToLower(err.Error()), "timeout") {
			return chat.Request{}, &apiError{Status: http.StatusRequestTimeout, Message: "读取消息超时，请稍后再试。", Code: "body_timeout", RetryAfter: 1}
		}
		return chat.Request{}, &apiError{Status: http.StatusBadRequest, Message: "消息太长或格式无效，请缩短消息或开启新对话。", Code: "invalid_request"}
	}
	request, err := chat.DecodeRequest(data)
	if err != nil {
		return chat.Request{}, &apiError{Status: http.StatusUnprocessableEntity, Message: "消息太长或格式无效，请缩短消息或开启新对话。", Code: "invalid_request"}
	}
	return request, nil
}

func (s *Server) guard(r *http.Request) *apiError {
	if !s.config.Production() {
		return nil
	}
	if len(s.config.InternalAPIToken) < 32 {
		return &apiError{Status: http.StatusServiceUnavailable, Message: "站内 Agent 正在维护。", Code: "configuration"}
	}
	if subtleCompare(r.Header.Get("X-Neko-Internal-Token"), s.config.InternalAPIToken) == false {
		return &apiError{Status: http.StatusForbidden, Message: "请通过本站 Agent 访问。", Code: "unauthorized"}
	}
	rawIP := r.Header.Get("X-Neko-Client-IP")
	if _, err := canonicalIdentity(rawIP); err != nil {
		return &apiError{Status: http.StatusForbidden, Message: "请从本站公网入口访问 Agent。", Code: "unauthorized"}
	}
	return nil
}

func (s *Server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		allowed := false
		for _, candidate := range s.config.CORSOrigins {
			if origin == candidate {
				allowed = true
				break
			}
		}
		if allowed {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Neko-CSRF, X-Neko-Internal-Token, X-Neko-Client-IP, X-Neko-Session-ID, X-Request-ID")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

type apiError struct {
	Status     int
	Message    string
	Code       string
	RetryAfter int
}

func (e *apiError) Error() string { return e.Message }

func writeRouteError(w http.ResponseWriter, err error) {
	var routeErr *apiError
	if errors.As(err, &routeErr) {
		writeJSON(w, routeErr.Status, map[string]any{"detail": routeErr.Message})
		return
	}
	var agentErr *agent.AgentError
	if errors.As(err, &agentErr) {
		writeJSON(w, agentErr.Status, map[string]any{"detail": agentErr.Message})
		return
	}
	writeJSON(w, http.StatusBadGateway, map[string]any{"detail": "站内 Agent 暂时不可用，请稍后再试。"})
}

func writeProtectionError(w http.ResponseWriter, err *apiError) {
	if err.RetryAfter > 0 {
		w.Header().Set("Retry-After", fmt.Sprintf("%d", err.RetryAfter))
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, err.Status, map[string]any{
		"detail": err.Message, "code": err.Code, "retry_after": err.RetryAfter,
	})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	data, err := jsonutil.Marshal(value)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write(data)
}

func setWriteDeadline(controller *http.ResponseController, seconds float64) error {
	err := controller.SetWriteDeadline(time.Now().Add(time.Duration(seconds * float64(time.Second))))
	if errors.Is(err, http.ErrNotSupported) {
		return nil
	}
	return err
}

func timestamp() string {
	return time.Now().UTC().Format("2006-01-02T15:04:05.000000+00:00")
}

func cloneEvent(event chat.Event) chat.Event {
	out := make(chat.Event, len(event)+1)
	for key, value := range event {
		out[key] = value
	}
	return out
}

func canonicalIdentity(raw string) (string, error) {
	if raw == "local" {
		return "local", nil
	}
	if strings.Contains(raw, "%") {
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

func subtleCompare(left, right string) bool {
	return hmac.Equal([]byte(left), []byte(right))
}
