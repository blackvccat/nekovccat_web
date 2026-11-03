package api

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"nekoweb/backend-go/internal/agent"
	"nekoweb/backend-go/internal/config"
)

func testServer(t *testing.T) *Server {
	t.Helper()
	cfg := &config.Config{
		ProjectRoot:                 t.TempDir(),
		Environment:                 "development",
		Host:                        "127.0.0.1",
		Port:                        8011,
		CORSOrigins:                 []string{"http://localhost:3011"},
		DSHRequestTimeoutSeconds:    180,
		DSHInitializeTimeoutSeconds: 30,
		DSHCleanupTimeoutSeconds:    5,
		DSHMaxTokens:                4096,
		DSHMaxNotificationEvents:    4096,
		DSHMaxNotificationBytes:     1 << 20,
		DSHMaxReplyBytes:            65536,
		CHATStreamMaxEvents:         128,
		CHATStreamMaxBytes:          65536,
		CHATHeartbeatSeconds:        15,
		CHATSendTimeoutSeconds:      10,
		CHATBodyMaxBytes:            65536,
		CHATBodyTimeoutSeconds:      2,
		CHATMaxConcurrent:           3,
	}
	manager := agent.NewManager(cfg, nil)
	return NewServer(cfg, manager, nil)
}

func TestHealthAndRoot(t *testing.T) {
	server := testServer(t)
	for _, path := range []string{"/health", "/api/health", "/"} {
		response := httptest.NewRecorder()
		server.Handler().ServeHTTP(response, httptest.NewRequest(http.MethodGet, path, nil))
		if response.Code != http.StatusOK {
			t.Fatalf("%s: %d", path, response.Code)
		}
	}
}

func TestReadyIsUnavailableUntilPrepared(t *testing.T) {
	server := testServer(t)
	response := httptest.NewRecorder()
	server.Handler().ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/ready", nil))
	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("ready status: %d", response.Code)
	}
	if !strings.Contains(response.Body.String(), `"agent_configuration":false`) {
		t.Fatalf("unexpected ready body: %s", response.Body.String())
	}
}

func TestChatRejectsInvalidContentTypeAndBody(t *testing.T) {
	server := testServer(t)
	cases := []struct {
		contentType string
		body        string
		status      int
	}{
		{"text/plain", "x", http.StatusUnsupportedMediaType},
		{"application/json", `{"messages":[]}`, http.StatusUnprocessableEntity},
		{"application/json", `{"messages":[{"role":"user","content":"hi","extra":1}]}`, http.StatusUnprocessableEntity},
	}
	for _, item := range cases {
		request := httptest.NewRequest(http.MethodPost, "/api/chat/", strings.NewReader(item.body))
		request.Header.Set("Content-Type", item.contentType)
		response := httptest.NewRecorder()
		server.Handler().ServeHTTP(response, request)
		if response.Code != item.status {
			t.Fatalf("content-type=%s body=%s: got %d want %d", item.contentType, item.body, response.Code, item.status)
		}
	}
}
