package observability

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log/slog"
	"net/http"
	"os"
	"regexp"
	"time"
)

type requestIDKey struct{}

var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

func NewLogger() *slog.Logger {
	handler := slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelInfo})
	return slog.New(handler)
}

func WithRequestID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, requestIDKey{}, id)
}

func RequestID(ctx context.Context) string {
	value, _ := ctx.Value(requestIDKey{}).(string)
	return value
}

func LogEvent(ctx context.Context, logger *slog.Logger, event string, args ...any) {
	if logger == nil {
		return
	}
	fields := []any{"event", event, "request_id", RequestID(ctx)}
	fields = append(fields, args...)
	logger.Info("", fields...)
}

func NewRequestID(supplied string) string {
	if uuidPattern.MatchString(supplied) {
		return supplied
	}
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "00000000-0000-4000-8000-000000000000"
	}
	buf[6] = (buf[6] & 0x0f) | 0x40
	buf[8] = (buf[8] & 0x3f) | 0x80
	encoded := hex.EncodeToString(buf)
	return encoded[0:8] + "-" + encoded[8:12] + "-" + encoded[12:16] + "-" + encoded[16:20] + "-" + encoded[20:32]
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	if r.status == 0 {
		r.status = status
	}
	r.ResponseWriter.WriteHeader(status)
}

func (r *statusRecorder) Write(data []byte) (int, error) {
	if r.status == 0 {
		r.status = http.StatusOK
	}
	return r.ResponseWriter.Write(data)
}

func (r *statusRecorder) Flush() {
	if flusher, ok := r.ResponseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
}

func (r *statusRecorder) Unwrap() http.ResponseWriter { return r.ResponseWriter }

func Telemetry(logger *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := NewRequestID(r.Header.Get("X-Request-ID"))
		ctx := WithRequestID(r.Context(), requestID)
		started := time.Now()
		recorder := &statusRecorder{ResponseWriter: w}
		recorder.Header().Set("X-Request-ID", requestID)
		outcome := "completed"
		defer func() {
			if recovered := recover(); recovered != nil {
				outcome = "server_error"
				panic(recovered)
			}
			if recorder.status == 0 {
				recorder.status = http.StatusOK
			}
			route := "other"
			if r.URL.Path == "/api/chat" || r.URL.Path == "/api/chat/" {
				route = "chat"
			} else if r.URL.Path == "/health" || r.URL.Path == "/api/health" || r.URL.Path == "/api/ready" {
				route = "health"
			}
			LogEvent(ctx, logger, "http_request",
				"route", route,
				"status", recorder.status,
				"outcome", outcome,
				"duration_ms", float64(time.Since(started).Microseconds())/1000.0,
			)
		}()
		next.ServeHTTP(recorder, r.WithContext(ctx))
	})
}
