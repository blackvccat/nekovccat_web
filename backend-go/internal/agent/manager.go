package agent

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"nekoweb/backend-go/internal/config"
	"nekoweb/backend-go/internal/harness"
	"nekoweb/backend-go/internal/jsonutil"
	"nekoweb/backend-go/internal/observability"
)

type Runtime interface {
	Start(ctx context.Context) error
	Initialize(ctx context.Context) error
	Run(ctx context.Context, sessionID, input string, onNotification func(harness.Notification) error) (harness.RunResult, error)
	Close(ctx context.Context) error
}

type PreparedRuntime struct {
	Home             string
	Workspace        string
	Patch            string
	ProgressivePatch string
	QuizAnswers      string
}

type Manager struct {
	config     *config.Config
	logger     *slog.Logger
	NewRuntime func(*PreparedRuntime, bool) (Runtime, error)

	mu       sync.Mutex
	prepared *PreparedRuntime
	leases   map[*Lease]struct{}
	closing  bool
	failure  *AgentError
}

type Lease struct {
	manager *Manager
	runtime Runtime
	once    sync.Once
}

func NewManager(cfg *config.Config, logger *slog.Logger) *Manager {
	manager := &Manager{
		config: cfg,
		logger: logger,
		leases: make(map[*Lease]struct{}),
	}
	manager.NewRuntime = manager.defaultRuntime
	return manager
}

func (m *Manager) defaultRuntime(prepared *PreparedRuntime, progressive bool) (Runtime, error) {
	patches := []string{prepared.Patch}
	if progressive {
		patches = append(patches, prepared.ProgressivePatch)
	}
	env := map[string]string{
		"DEEPSEEK_API_KEY":        m.config.DeepSeekAPIKey,
		"DEEPSEEK_BASE_URL":       m.config.DeepSeekBaseURL,
		"DSH_HOME":                prepared.Home,
		"GIRLFRIEND_QUIZ_ANSWERS": prepared.QuizAnswers,
		"DSH_SYSTEM_PROMPT":       SystemPrompt,
		"NEKO_PROGRESSIVE_STREAM": "0",
	}
	if progressive {
		env["NEKO_PROGRESSIVE_STREAM"] = "1"
	}
	return harness.NewClient(harness.Config{
		DSHBin:                m.config.DSHBin,
		Profile:               "sdk-minimal",
		Patches:               patches,
		DSHHome:               prepared.Home,
		RuntimeCWD:            prepared.Home,
		WorkspaceCWD:          prepared.Workspace,
		Env:                   env,
		Model:                 m.config.DeepSeekModel,
		ReasoningEffort:       m.config.DeepSeekReasoningEffort,
		MaxTokens:             m.config.DSHMaxTokens,
		InitializeTimeout:     seconds(m.config.DSHInitializeTimeoutSeconds),
		RequestTimeout:        seconds(m.config.DSHRequestTimeoutSeconds),
		ShutdownTimeout:       seconds(m.config.DSHCleanupTimeoutSeconds),
		MaxNotificationEvents: m.config.DSHMaxNotificationEvents,
		MaxNotificationBytes:  m.config.DSHMaxNotificationBytes,
	}), nil
}

func (m *Manager) Initialize(ctx context.Context) bool {
	if err := m.Prepare(); err != nil {
		return false
	}
	return true
}

func (m *Manager) Prepare() error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.prepared != nil {
		return nil
	}
	if m.failure != nil {
		return m.failure
	}
	if m.closing {
		return NewAgentError("站内 Agent 正在维护，请稍后再试。", 503, "runtime_closed")
	}

	started := time.Now()
	if m.config.DeepSeekAPIKey == "" {
		return m.fail(NewAgentError("DeepSeek 尚未配置，请联系站点管理员。", 503, "configuration"))
	}
	if m.config.DSHBin == "" {
		return m.fail(NewAgentError("站内 Agent 的运行时尚未就绪，请联系站点管理员。", 503, "configuration"))
	}
	template, err := os.ReadFile(m.config.DSHPatchPath)
	if err != nil {
		return m.fail(NewAgentError("站内 Agent 的工具配置尚未就绪，请联系站点管理员。", 503, "configuration"))
	}
	answers, err := loadQuizAnswers(m.config.RelationshipPrivatePath)
	if err != nil {
		return m.fail(NewAgentError("伴侣模式正在维护，请稍后再试。", 503, "configuration"))
	}

	home, err := filepath.Abs(m.config.DSHHome)
	if err != nil {
		return m.fail(NewAgentError("站内 Agent 的运行时路径无效。", 503, "configuration"))
	}
	workspace := filepath.Join(home, "workspace")
	if err := os.MkdirAll(workspace, 0o700); err != nil {
		return m.fail(NewAgentError("站内 Agent 的运行时路径不可用。", 503, "configuration"))
	}
	if err := os.MkdirAll(home, 0o700); err != nil {
		return m.fail(NewAgentError("站内 Agent 的运行时路径不可用。", 503, "configuration"))
	}

	toolsPath := filepath.Join(m.config.ProjectRoot, "agent/website-tools.mjs")
	quotedTools, err := jsonutil.Marshal(toolsPath)
	if err != nil {
		return m.fail(SafeError(err))
	}
	patchName := "website-" + randomHex(16) + ".patch.yml"
	patchPath := filepath.Join(home, patchName)
	patchContent := strings.ReplaceAll(string(template), "__WEBSITE_TOOLS_MODULE__", string(quotedTools))
	if err := os.WriteFile(patchPath, []byte(patchContent), 0o600); err != nil {
		return m.fail(NewAgentError("站内 Agent 的工具配置不可写。", 503, "configuration"))
	}

	bridgePath := filepath.Join(m.config.ProjectRoot, "backend-go/internal/agent/progressive_bridge.mjs")
	if _, err := os.Stat(bridgePath); err != nil {
		bridgePath = filepath.Join(m.config.ProjectRoot, "backend/app/services/progressive_bridge.mjs")
	}
	quotedBridge, err := jsonutil.Marshal(bridgePath)
	if err != nil {
		return m.fail(SafeError(err))
	}
	progressiveName := "website-" + randomHex(16) + ".progress.patch.yml"
	progressivePath := filepath.Join(home, progressiveName)
	progressiveContent := "- insert:\n    - id: neko-progressive-stream\n      name: " + string(quotedBridge) + "\n"
	if err := os.WriteFile(progressivePath, []byte(progressiveContent), 0o600); err != nil {
		_ = os.Remove(patchPath)
		return m.fail(NewAgentError("站内 Agent 的工具配置不可写。", 503, "configuration"))
	}

	m.prepared = &PreparedRuntime{
		Home:             home,
		Workspace:        workspace,
		Patch:            patchPath,
		ProgressivePatch: progressivePath,
		QuizAnswers:      answers,
	}
	observability.LogEvent(context.Background(), m.logger, "agent_configuration",
		"outcome", "ready",
		"duration_ms", float64(time.Since(started).Microseconds())/1000.0,
	)
	return nil
}

func (m *Manager) Acquire(progressive bool) (*Lease, error) {
	if err := m.Prepare(); err != nil {
		return nil, err
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.closing {
		return nil, NewAgentError("站内 Agent 正在维护，请稍后再试。", 503, "runtime_closed")
	}
	if m.failure != nil {
		return nil, m.failure
	}
	if len(m.leases) >= m.config.CHATMaxConcurrent {
		return nil, NewAgentError("Agent 正在回复，请稍后再发消息。", 429, "concurrency")
	}
	runtime, err := m.NewRuntime(m.prepared, progressive)
	if err != nil {
		return nil, SafeError(err)
	}
	lease := &Lease{manager: m, runtime: runtime}
	m.leases[lease] = struct{}{}
	return lease, nil
}

func (l *Lease) Start(ctx context.Context) error      { return l.runtime.Start(ctx) }
func (l *Lease) Initialize(ctx context.Context) error { return l.runtime.Initialize(ctx) }

func (l *Lease) Run(ctx context.Context, sessionID, input string, onNotification func(harness.Notification) error) (harness.RunResult, error) {
	return l.runtime.Run(ctx, sessionID, input, onNotification)
}

func (l *Lease) Close(ctx context.Context) {
	l.once.Do(func() {
		cleanupCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), seconds(l.manager.config.DSHCleanupTimeoutSeconds))
		defer cancel()
		_ = l.runtime.Close(cleanupCtx)
		l.manager.release(l)
	})
}

func (m *Manager) release(lease *Lease) {
	m.mu.Lock()
	delete(m.leases, lease)
	m.removePatchesLocked()
	m.mu.Unlock()
}

func (m *Manager) Ready() bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.prepared != nil && !m.closing && m.failure == nil
}

func (m *Manager) ActiveCount() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.leases)
}

func (m *Manager) CheckAvailable() error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.failure != nil {
		return m.failure
	}
	if m.closing {
		return NewAgentError("站内 Agent 正在维护，请稍后再试。", 503, "runtime_closed")
	}
	return nil
}

func (m *Manager) Shutdown(ctx context.Context) {
	m.mu.Lock()
	m.closing = true
	leases := make([]*Lease, 0, len(m.leases))
	for lease := range m.leases {
		leases = append(leases, lease)
	}
	m.mu.Unlock()
	for _, lease := range leases {
		lease.Close(ctx)
	}
	m.mu.Lock()
	m.removePatchesLocked()
	m.mu.Unlock()
}

func (m *Manager) fail(err *AgentError) error {
	m.failure = err
	observability.LogEvent(context.Background(), m.logger, "agent_configuration",
		"outcome", "unavailable", "code", err.Code)
	return err
}

func (m *Manager) removePatchesLocked() {
	if !m.closing || len(m.leases) > 0 || m.prepared == nil {
		return
	}
	_ = os.Remove(m.prepared.Patch)
	_ = os.Remove(m.prepared.ProgressivePatch)
}

func loadQuizAnswers(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	var payload struct {
		QuizAnswers map[string][]string `json:"quiz_answers"`
	}
	decoder := json.NewDecoder(strings.NewReader(string(data)))
	if err := decoder.Decode(&payload); err != nil {
		return "", err
	}
	required := []string{"anime", "birthday", "cat_name", "mbti", "initials"}
	if len(payload.QuizAnswers) != len(required) {
		return "", fmt.Errorf("invalid quiz answers")
	}
	for _, key := range required {
		values, ok := payload.QuizAnswers[key]
		if !ok || len(values) == 0 {
			return "", fmt.Errorf("invalid quiz answers")
		}
		for _, value := range values {
			if strings.TrimSpace(value) == "" {
				return "", fmt.Errorf("invalid quiz answers")
			}
		}
	}
	encoded, err := jsonutil.Marshal(payload.QuizAnswers)
	if err != nil {
		return "", err
	}
	return string(encoded), nil
}

func randomHex(bytes int) string {
	buf := make([]byte, bytes)
	if _, err := rand.Read(buf); err != nil {
		return fmt.Sprintf("%x", time.Now().UnixNano())
	}
	return hex.EncodeToString(buf)
}

func seconds(value float64) time.Duration {
	return time.Duration(value * float64(time.Second))
}
