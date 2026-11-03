package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"nekoweb/backend-go/internal/agent"
	"nekoweb/backend-go/internal/config"
	"nekoweb/backend-go/internal/visitor"
)

func visitorTestServer(t *testing.T) (*Server, *config.Config) {
	t.Helper()
	dir := t.TempDir()
	accounts := map[string]any{"visitors": []map[string]any{
		{"username": "alice", "name": "Alice", "password_hash": mustHash(t, "secret"), "apps": []string{"notebook"}},
	}}
	data, _ := json.Marshal(accounts)
	if err := os.WriteFile(filepath.Join(dir, "accounts.json"), data, 0o600); err != nil {
		t.Fatal(err)
	}
	appDir := filepath.Join(dir, "apps", "notebook")
	if err := os.MkdirAll(filepath.Join(appDir, "assets"), 0o700); err != nil {
		t.Fatal(err)
	}
	manifest := map[string]any{
		"apiVersion": 1, "id": "notebook", "title": "Notebook", "entry": "index.html",
		"permissions": []string{"data", "files"}, "icon": "icon.svg",
	}
	manifestData, _ := json.Marshal(manifest)
	if err := os.WriteFile(filepath.Join(appDir, "app.json"), manifestData, 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(appDir, "index.html"), []byte("<html>notebook</html>"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(appDir, "assets", "icon.svg"), []byte("<svg/>"), 0o600); err != nil {
		t.Fatal(err)
	}
	cfg := &config.Config{
		ProjectRoot: dir, Environment: "development", Host: "127.0.0.1", Port: 8011,
		CORSOrigins:              []string{"http://localhost:3011"},
		DSHRequestTimeoutSeconds: 30, DSHInitializeTimeoutSeconds: 5, DSHCleanupTimeoutSeconds: 1,
		DSHMaxTokens: 1024, DSHMaxNotificationEvents: 100, DSHMaxNotificationBytes: 1 << 20, DSHMaxReplyBytes: 65536,
		CHATStreamMaxEvents: 64, CHATStreamMaxBytes: 65536, CHATHeartbeatSeconds: 1,
		CHATSendTimeoutSeconds: 5, CHATBodyMaxBytes: 65536, CHATBodyTimeoutSeconds: 2, CHATMaxConcurrent: 3,
		InternalAPIToken:    strings.Repeat("s", 32),
		VisitorAccountsPath: filepath.Join(dir, "accounts.json"),
		VisitorAppsDir:      filepath.Join(dir, "apps"),
		VisitorAppDataDB:    filepath.Join(dir, "app-data.sqlite"),
		VisitorAppFilesDir:  filepath.Join(dir, "files"),
		VisitorThrottleDB:   filepath.Join(dir, "throttle.sqlite"),
		VisitorMaxFailures:  3, VisitorFailureWindowSeconds: 60,
	}
	manager := agent.NewManager(cfg, nil)
	return NewServer(cfg, manager, nil, nil), cfg
}

func mustHash(t *testing.T, password string) string {
	t.Helper()
	hash, err := visitor.HashPassword(password, 50_000, bytes.Repeat([]byte{9}, 16))
	if err != nil {
		t.Fatal(err)
	}
	return hash
}

func TestVisitorLoginAppsAndStorage(t *testing.T) {
	server, _ := visitorTestServer(t)
	defer server.Close()
	session := strings.Repeat("a", 48)

	login := httptest.NewRequest(http.MethodPost, "/api/visitor/login",
		strings.NewReader(`{"username":"alice","password":"secret"}`))
	login.Header.Set("X-Neko-Session-ID", session)
	loginResponse := httptest.NewRecorder()
	server.Handler().ServeHTTP(loginResponse, login)
	if loginResponse.Code != http.StatusOK {
		t.Fatalf("login: %d %s", loginResponse.Code, loginResponse.Body.String())
	}
	var loginBody map[string]any
	_ = json.Unmarshal(loginResponse.Body.Bytes(), &loginBody)
	if loginBody["proof"] == "" || loginBody["name"] != "Alice" {
		t.Fatalf("login body: %s", loginResponse.Body.String())
	}

	apps := httptest.NewRequest(http.MethodGet, "/api/visitor/apps", nil)
	apps.Header.Set("X-Neko-Visitor", "alice")
	appsResponse := httptest.NewRecorder()
	server.Handler().ServeHTTP(appsResponse, apps)
	if appsResponse.Code != http.StatusOK || !strings.Contains(appsResponse.Body.String(), `"notebook"`) {
		t.Fatalf("apps: %d %s", appsResponse.Code, appsResponse.Body.String())
	}

	shell := httptest.NewRequest(http.MethodGet, "/api/visitor/apps/notebook/shell", nil)
	shell.Header.Set("X-Neko-Visitor", "alice")
	shellResponse := httptest.NewRecorder()
	server.Handler().ServeHTTP(shellResponse, shell)
	if shellResponse.Code != http.StatusOK || !strings.Contains(shellResponse.Body.String(), "notebook") {
		t.Fatalf("shell: %d %s", shellResponse.Code, shellResponse.Body.String())
	}
	if !strings.Contains(shellResponse.Header().Get("Content-Security-Policy"), "frame-ancestors 'self'") {
		t.Fatalf("csp: %s", shellResponse.Header().Get("Content-Security-Policy"))
	}

	putData := httptest.NewRequest(http.MethodPut, "/api/visitor/apps/notebook/data/note", strings.NewReader(`{"text":"hello"}`))
	putData.Header.Set("X-Neko-Visitor", "alice")
	putDataResponse := httptest.NewRecorder()
	server.Handler().ServeHTTP(putDataResponse, putData)
	if putDataResponse.Code != http.StatusOK {
		t.Fatalf("put data: %d %s", putDataResponse.Code, putDataResponse.Body.String())
	}
	getData := httptest.NewRequest(http.MethodGet, "/api/visitor/apps/notebook/data", nil)
	getData.Header.Set("X-Neko-Visitor", "alice")
	getDataResponse := httptest.NewRecorder()
	server.Handler().ServeHTTP(getDataResponse, getData)
	if getDataResponse.Code != http.StatusOK || !strings.Contains(getDataResponse.Body.String(), `"text":"hello"`) {
		t.Fatalf("get data: %d %s", getDataResponse.Code, getDataResponse.Body.String())
	}

	putFile := httptest.NewRequest(http.MethodPut, "/api/visitor/apps/notebook/files/note.txt", strings.NewReader("fixture"))
	putFile.Header.Set("X-Neko-Visitor", "alice")
	putFileResponse := httptest.NewRecorder()
	server.Handler().ServeHTTP(putFileResponse, putFile)
	if putFileResponse.Code != http.StatusCreated {
		t.Fatalf("put file: %d %s", putFileResponse.Code, putFileResponse.Body.String())
	}
	getFile := httptest.NewRequest(http.MethodGet, "/api/visitor/apps/notebook/files/note.txt?inline=1", nil)
	getFile.Header.Set("X-Neko-Visitor", "alice")
	getFileResponse := httptest.NewRecorder()
	server.Handler().ServeHTTP(getFileResponse, getFile)
	if getFileResponse.Code != http.StatusOK || getFileResponse.Body.String() != "fixture" {
		t.Fatalf("get file: %d %q", getFileResponse.Code, getFileResponse.Body.String())
	}
}

func TestVisitorUnauthorizedAndUnentitled(t *testing.T) {
	server, _ := visitorTestServer(t)
	defer server.Close()
	unauthorized := httptest.NewRecorder()
	server.Handler().ServeHTTP(unauthorized, httptest.NewRequest(http.MethodGet, "/api/visitor/apps", nil))
	if unauthorized.Code != http.StatusUnauthorized {
		t.Fatalf("unauthorized: %d", unauthorized.Code)
	}
	unentitled := httptest.NewRequest(http.MethodGet, "/api/visitor/apps/tomato/shell", nil)
	unentitled.Header.Set("X-Neko-Visitor", "alice")
	response := httptest.NewRecorder()
	server.Handler().ServeHTTP(response, unentitled)
	if response.Code != http.StatusForbidden {
		t.Fatalf("unentitled: %d %s", response.Code, response.Body.String())
	}
}
