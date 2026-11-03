package config

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
)

type Config struct {
	ProjectRoot string

	Environment string
	Debug       bool
	Host        string
	Port        int
	CORSOrigins []string

	DeepSeekAPIKey          string
	DeepSeekBaseURL         string
	DeepSeekModel           string
	DeepSeekReasoningEffort string

	DSHBin                      string
	DSHHome                     string
	DSHPatchPath                string
	DSHRequestTimeoutSeconds    float64
	DSHInitializeTimeoutSeconds float64
	DSHCleanupTimeoutSeconds    float64
	DSHMaxTokens                int
	DSHMaxNotificationEvents    int
	DSHMaxNotificationBytes     int
	DSHMaxReplyBytes            int
	CHATStreamMaxEvents         int
	CHATStreamMaxBytes          int
	CHATHeartbeatSeconds        float64
	CHATSendTimeoutSeconds      float64
	CHATBodyMaxBytes            int64
	CHATBodyTimeoutSeconds      float64
	CHATMaxConcurrent           int
	RelationshipPrivatePath     string
	InternalAPIToken            string
}

func Load() (*Config, error) {
	loadDotEnv()

	root, err := projectRoot()
	if err != nil {
		return nil, err
	}

	cfg := &Config{
		ProjectRoot:                 root,
		Environment:                 env("ENVIRONMENT", "development"),
		Debug:                       envBool("DEBUG", true),
		Host:                        env("HOST", "127.0.0.1"),
		Port:                        envInt("PORT", 8010),
		DeepSeekAPIKey:              os.Getenv("DEEPSEEK_API_KEY"),
		DeepSeekBaseURL:             env("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
		DeepSeekModel:               env("DEEPSEEK_MODEL", "deepseek-v4-pro"),
		DeepSeekReasoningEffort:     env("DEEPSEEK_REASONING_EFFORT", "low"),
		DSHBin:                      os.Getenv("DSH_BIN"),
		DSHHome:                     env("DSH_HOME", filepath.Join(root, "work/deepseek-harness-home")),
		DSHPatchPath:                env("DSH_PATCH_PATH", filepath.Join(root, "agent/website.patch.yml")),
		DSHRequestTimeoutSeconds:    envFloat("DSH_REQUEST_TIMEOUT_SECONDS", 180),
		DSHInitializeTimeoutSeconds: envFloat("DSH_INITIALIZE_TIMEOUT_SECONDS", 30),
		DSHCleanupTimeoutSeconds:    envFloat("DSH_CLEANUP_TIMEOUT_SECONDS", 5),
		DSHMaxTokens:                envInt("DSH_MAX_TOKENS", 4096),
		DSHMaxNotificationEvents:    envInt("DSH_MAX_NOTIFICATION_EVENTS", 4096),
		DSHMaxNotificationBytes:     envInt("DSH_MAX_NOTIFICATION_BYTES", 2097152),
		DSHMaxReplyBytes:            envInt("DSH_MAX_REPLY_BYTES", 65536),
		CHATStreamMaxEvents:         envInt("CHAT_STREAM_MAX_EVENTS", 128),
		CHATStreamMaxBytes:          envInt("CHAT_STREAM_MAX_BYTES", 65536),
		CHATHeartbeatSeconds:        envFloat("CHAT_HEARTBEAT_SECONDS", 15),
		CHATSendTimeoutSeconds:      envFloat("CHAT_SEND_TIMEOUT_SECONDS", 10),
		CHATBodyMaxBytes:            int64(envInt("CHAT_BODY_MAX_BYTES", 65536)),
		CHATBodyTimeoutSeconds:      envFloat("CHAT_BODY_TIMEOUT_SECONDS", 2),
		CHATMaxConcurrent:           envInt("CHAT_MAX_CONCURRENT", 3),
		RelationshipPrivatePath:     env("RELATIONSHIP_PRIVATE_PATH", filepath.Join(root, "work/relationship-private.json")),
		InternalAPIToken:            os.Getenv("INTERNAL_API_TOKEN"),
	}

	origins, err := envList("CORS_ORIGINS", []string{"http://localhost:3010", "http://127.0.0.1:3010"})
	if err != nil {
		return nil, err
	}
	cfg.CORSOrigins = origins

	if cfg.DSHBin == "" {
		cfg.DSHBin = resolveDSHBin(root)
	}
	if cfg.DSHBin != "" {
		if absolute, err := filepath.Abs(cfg.DSHBin); err == nil {
			cfg.DSHBin = absolute
		}
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}
	return cfg, nil
}

func (c *Config) Production() bool { return c.Environment == "production" }

func (c *Config) Addr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

func (c *Config) validate() error {
	if c.Port <= 0 || c.Port > 65535 {
		return fmt.Errorf("PORT must be between 1 and 65535")
	}
	if c.DSHRequestTimeoutSeconds <= 0 || c.DSHInitializeTimeoutSeconds <= 0 || c.DSHCleanupTimeoutSeconds <= 0 {
		return errors.New("DSH timeout values must be positive")
	}
	if c.DSHMaxTokens <= 0 || c.DSHMaxNotificationEvents <= 0 || c.DSHMaxNotificationBytes < 1024 || c.DSHMaxReplyBytes < 1024 {
		return errors.New("DSH limits are invalid")
	}
	if c.CHATStreamMaxEvents < 2 || c.CHATStreamMaxBytes < 1024 {
		return errors.New("CHAT_STREAM limits are invalid")
	}
	if c.CHATHeartbeatSeconds <= 0 || c.CHATSendTimeoutSeconds <= 0 {
		return errors.New("CHAT timeout values must be positive")
	}
	if c.CHATBodyMaxBytes < 1024 || c.CHATBodyTimeoutSeconds <= 0 {
		return errors.New("CHAT body limits are invalid")
	}
	if c.CHATMaxConcurrent <= 0 {
		return errors.New("CHAT_MAX_CONCURRENT must be positive")
	}
	return nil
}

func projectRoot() (string, error) {
	if value := strings.TrimSpace(os.Getenv("NEKO_ROOT")); value != "" {
		return filepath.Abs(value)
	}
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	dir, err := filepath.Abs(cwd)
	if err != nil {
		return "", err
	}
	for i := 0; i < 6; i++ {
		if _, err := os.Stat(filepath.Join(dir, "agent/website.patch.yml")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return "", errors.New("cannot locate project root; set NEKO_ROOT")
}

func resolveDSHBin(root string) string {
	name := runtimeBinaryName()
	candidates := []string{
		filepath.Join(root, ".dsh-runtime", name),
		filepath.Join(root, "work/toolchain", name),
	}
	patterns := []string{
		filepath.Join(root, "backend/.venv/lib/python*/site-packages/deepseek_harness_runtime/runtime", name),
		filepath.Join(root, ".venv/lib/python*/site-packages/deepseek_harness_runtime/runtime", name),
	}
	for _, pattern := range patterns {
		matches, _ := filepath.Glob(pattern)
		candidates = append(candidates, matches...)
	}
	for _, candidate := range candidates {
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			return candidate
		}
	}
	return ""
}

func runtimeBinaryName() string {
	osName := runtime.GOOS
	if osName == "darwin" {
		osName = "macos"
	}
	if osName == "windows" {
		osName = "win"
	}
	arch := runtime.GOARCH
	switch arch {
	case "amd64":
		arch = "x64"
	case "arm64":
		arch = "arm64"
	}
	ext := ""
	if runtime.GOOS == "windows" {
		ext = ".exe"
	}
	return fmt.Sprintf("deepseek-harness-sdk-runtime-%s-%s%s", osName, arch, ext)
}

func loadDotEnv() {
	path := os.Getenv("NEKO_ENV_FILE")
	if path == "" {
		if _, err := os.Stat(".env"); err == nil {
			path = ".env"
		}
	}
	if path == "" {
		return
	}
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		line = strings.TrimPrefix(line, "export ")
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		if key == "" {
			continue
		}
		if _, exists := os.LookupEnv(key); exists {
			continue
		}
		value = strings.TrimSpace(value)
		if len(value) >= 2 {
			if (value[0] == '"' && value[len(value)-1] == '"') || (value[0] == '\'' && value[len(value)-1] == '\'') {
				value = value[1 : len(value)-1]
			}
		}
		_ = os.Setenv(key, value)
	}
}

func env(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func envInt(key string, fallback int) int {
	value, ok := os.LookupEnv(key)
	if !ok || strings.TrimSpace(value) == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil {
		return fallback
	}
	return parsed
}

func envFloat(key string, fallback float64) float64 {
	value, ok := os.LookupEnv(key)
	if !ok || strings.TrimSpace(value) == "" {
		return fallback
	}
	parsed, err := strconv.ParseFloat(strings.TrimSpace(value), 64)
	if err != nil {
		return fallback
	}
	return parsed
}

func envBool(key string, fallback bool) bool {
	value, ok := os.LookupEnv(key)
	if !ok {
		return fallback
	}
	parsed, err := strconv.ParseBool(strings.TrimSpace(value))
	if err != nil {
		return fallback
	}
	return parsed
}

func envList(key string, fallback []string) ([]string, error) {
	value, ok := os.LookupEnv(key)
	if !ok || strings.TrimSpace(value) == "" {
		return fallback, nil
	}
	var parsed []string
	if err := json.Unmarshal([]byte(value), &parsed); err == nil {
		return parsed, nil
	}
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			out = append(out, trimmed)
		}
	}
	if len(out) == 0 {
		return nil, fmt.Errorf("%s must be a JSON array of origins", key)
	}
	return out, nil
}
