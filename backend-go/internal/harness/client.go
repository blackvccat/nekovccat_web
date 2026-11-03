package harness

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"sort"
	"strings"
	"sync"
	"time"

	"nekoweb/backend-go/internal/jsonutil"
)

var (
	ErrClosed      = errors.New("harness runtime is closed")
	ErrProtocol    = errors.New("harness protocol error")
	ErrRuntimeExit = errors.New("harness runtime exited")
)

const maxLineBytes = 8 << 20

type Config struct {
	DSHBin                string
	Profile               string
	Patches               []string
	DSHHome               string
	RuntimeCWD            string
	WorkspaceCWD          string
	Env                   map[string]string
	Model                 string
	ReasoningEffort       string
	MaxTokens             int
	InitializeTimeout     time.Duration
	RequestTimeout        time.Duration
	ShutdownTimeout       time.Duration
	MaxNotificationEvents int
	MaxNotificationBytes  int
}

type RunResult struct {
	SessionID     string
	FinalResponse string
	FinishReason  string
	Events        []map[string]any
}

type rpcError struct {
	Code    int             `json:"code"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}

type rpcEnvelope struct {
	ID     json.RawMessage `json:"id"`
	Method string          `json:"method"`
	Params json.RawMessage `json:"params"`
	Result json.RawMessage `json:"result"`
	Error  *rpcError       `json:"error"`
}

type rpcResponse struct {
	Result json.RawMessage
	Err    error
}

type pendingRequest struct {
	result chan rpcResponse
}

type Client struct {
	config Config

	writeMu sync.Mutex
	mu      sync.Mutex
	closed  bool

	cmd    *exec.Cmd
	stdin  io.WriteCloser
	stdout io.ReadCloser
	stderr io.ReadCloser

	pending map[string]*pendingRequest
	queue   *notificationQueue

	stderrLines []string

	waitDone  chan struct{}
	waitErr   error
	closeOnce sync.Once
	closeErr  error

	sessionParents map[string]string
}

func NewClient(config Config) *Client {
	if config.Profile == "" {
		config.Profile = "sdk-minimal"
	}
	if config.InitializeTimeout <= 0 {
		config.InitializeTimeout = 30 * time.Second
	}
	if config.RequestTimeout <= 0 {
		config.RequestTimeout = 180 * time.Second
	}
	if config.ShutdownTimeout <= 0 {
		config.ShutdownTimeout = time.Second
	}
	if config.MaxNotificationEvents <= 0 {
		config.MaxNotificationEvents = 4096
	}
	if config.MaxNotificationBytes <= 0 {
		config.MaxNotificationBytes = 2 << 20
	}
	return &Client{
		config:         config,
		pending:        make(map[string]*pendingRequest),
		queue:          newNotificationQueue(config.MaxNotificationEvents, config.MaxNotificationBytes),
		waitDone:       make(chan struct{}),
		sessionParents: make(map[string]string),
	}
}

func (c *Client) Start(ctx context.Context) error {
	c.mu.Lock()
	if c.closed {
		c.mu.Unlock()
		return ErrClosed
	}
	if c.cmd != nil {
		c.mu.Unlock()
		return nil
	}
	c.mu.Unlock()

	if c.config.DSHBin == "" {
		return errors.New("DSH_BIN is not configured and no bundled runtime was found")
	}
	if c.config.DSHHome == "" {
		return errors.New("DSH_HOME is not configured")
	}

	args := []string{c.config.DSHBin, "--profile", c.config.Profile}
	for _, patch := range c.config.Patches {
		args = append(args, "--patch", patch)
	}

	cmd := exec.Command(args[0], args[1:]...)
	if c.config.RuntimeCWD != "" {
		cmd.Dir = c.config.RuntimeCWD
	}
	cmd.Env = mergeEnv(c.config.Env)
	configureProcessGroup(cmd)

	stdin, err := cmd.StdinPipe()
	if err != nil {
		return err
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return err
	}
	if err := cmd.Start(); err != nil {
		return err
	}

	c.mu.Lock()
	if c.closed {
		c.mu.Unlock()
		_ = cmd.Process.Kill()
		_, _ = cmd.Process.Wait()
		return ErrClosed
	}
	c.cmd = cmd
	c.stdin = stdin
	c.stdout = stdout
	c.stderr = stderr
	c.mu.Unlock()

	go c.readLoop(stdout)
	go c.stderrLoop(stderr)
	go c.waitLoop(cmd)
	return nil
}

func (c *Client) Initialize(ctx context.Context) error {
	if c.config.WorkspaceCWD == "" {
		return errors.New("workspace cwd is not configured")
	}
	model := c.config.Model
	if model == "" {
		model = "deepseek-v4-pro"
	}
	params := map[string]any{
		"cwd":      c.config.WorkspaceCWD,
		"provider": "deepseek-official",
		"model":    model,
	}
	if c.config.ReasoningEffort != "" {
		params["reasoningEffort"] = c.config.ReasoningEffort
	}
	if c.config.MaxTokens > 0 {
		params["maxTokens"] = c.config.MaxTokens
	}
	_, err := c.request(ctx, "initialize", params, c.config.InitializeTimeout)
	if err != nil {
		_ = c.Close(context.Background())
		return err
	}
	return nil
}

func (c *Client) Run(ctx context.Context, sessionID, input string, onNotification func(Notification) error) (RunResult, error) {
	c.queue.reset()
	c.mu.Lock()
	c.sessionParents = make(map[string]string)
	c.mu.Unlock()

	params := map[string]any{
		"sessionId": sessionID,
		"contentBlocks": []map[string]any{
			{"type": "text", "text": input},
		},
	}
	var promptResponse struct {
		MessageID string `json:"messageId"`
	}
	result, err := c.request(ctx, "session/prompt", params, c.config.RequestTimeout)
	if err != nil {
		return RunResult{}, err
	}
	if err := json.Unmarshal(result, &promptResponse); err != nil || promptResponse.MessageID == "" {
		return RunResult{}, fmt.Errorf("%w: missing messageId", ErrProtocol)
	}

	var events []map[string]any
	received := false
	for {
		notification, err := c.queue.pop(ctx)
		if err != nil {
			return RunResult{}, err
		}
		c.recordRelationship(notification)
		if !c.belongs(notification, sessionID) {
			continue
		}
		if !received {
			if !isInboxReceipt(notification, sessionID, promptResponse.MessageID) {
				continue
			}
			received = true
		}
		if onNotification != nil {
			if err := onNotification(notification); err != nil {
				return RunResult{}, err
			}
		}
		if notification.Method == "session.event" && stringField(notification.Payload, "sessionId") == sessionID {
			if event, ok := notification.Payload["event"].(map[string]any); ok {
				events = append(events, event)
			}
		}
		if notification.Method == "session.status" &&
			stringField(notification.Payload, "sessionId") == sessionID &&
			stringField(notification.Payload, "status") == "idle" {
			break
		}
	}

	final, err := finalResponse(events)
	if err != nil {
		return RunResult{}, err
	}
	finish, err := finishReason(events)
	if err != nil {
		return RunResult{}, err
	}
	return RunResult{
		SessionID:     sessionID,
		FinalResponse: final,
		FinishReason:  finish,
		Events:        events,
	}, nil
}

func (c *Client) Close(ctx context.Context) error {
	c.closeOnce.Do(func() {
		c.closeErr = c.close(ctx)
	})
	return c.closeErr
}

func (c *Client) close(ctx context.Context) error {
	c.mu.Lock()
	if c.closed {
		c.mu.Unlock()
		return nil
	}
	c.closed = true
	cmd := c.cmd
	stdin := c.stdin
	c.mu.Unlock()

	if cmd == nil {
		c.failAll(ErrClosed)
		c.queue.fail(ErrClosed)
		return nil
	}

	shutdownCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), c.config.ShutdownTimeout)
	_, _ = c.requestRaw(shutdownCtx, "shutdown", nil, c.config.ShutdownTimeout)
	cancel()

	if stdin != nil {
		_ = stdin.Close()
	}

	wait := func(timeout time.Duration) bool {
		select {
		case <-c.waitDone:
			return true
		case <-time.After(timeout):
			return false
		}
	}

	if !wait(c.config.ShutdownTimeout) {
		terminateProcess(cmd)
		if !wait(c.config.ShutdownTimeout) {
			_ = cmd.Process.Kill()
			<-c.waitDone
		}
	}

	c.mu.Lock()
	stdout := c.stdout
	stderr := c.stderr
	c.stdout = nil
	c.stderr = nil
	c.stdin = nil
	c.mu.Unlock()
	if stdout != nil {
		_ = stdout.Close()
	}
	if stderr != nil {
		_ = stderr.Close()
	}

	c.failAll(errors.New("harness runtime closed"))
	c.queue.fail(ErrClosed)
	return nil
}

func (c *Client) Diagnostics() string {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.waitErr != nil {
		return c.waitErr.Error() + "\n" + strings.Join(c.stderrLines, "\n")
	}
	return strings.Join(c.stderrLines, "\n")
}

func (c *Client) request(ctx context.Context, method string, params any, timeout time.Duration) (json.RawMessage, error) {
	c.mu.Lock()
	if c.closed {
		c.mu.Unlock()
		return nil, ErrClosed
	}
	c.mu.Unlock()
	return c.requestRaw(ctx, method, params, timeout)
}

func (c *Client) requestRaw(ctx context.Context, method string, params any, timeout time.Duration) (json.RawMessage, error) {
	id := fmt.Sprintf("go-%d", time.Now().UnixNano())
	waiter := &pendingRequest{result: make(chan rpcResponse, 1)}
	c.mu.Lock()
	c.pending[id] = waiter
	c.mu.Unlock()
	defer func() {
		c.mu.Lock()
		delete(c.pending, id)
		c.mu.Unlock()
	}()

	message := map[string]any{"jsonrpc": "2.0", "id": id, "method": method}
	if params != nil {
		message["params"] = params
	}
	if err := c.writeMessage(message); err != nil {
		return nil, err
	}

	timer := time.NewTimer(timeout)
	defer timer.Stop()
	select {
	case response := <-waiter.result:
		if response.Err != nil {
			return nil, response.Err
		}
		return response.Result, nil
	case <-timer.C:
		return nil, fmt.Errorf("%w: %s timed out", ErrProtocol, method)
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

func (c *Client) writeMessage(message any) error {
	data, err := jsonutil.Marshal(message)
	if err != nil {
		return err
	}
	data = append(data, '\n')

	c.writeMu.Lock()
	defer c.writeMu.Unlock()
	c.mu.Lock()
	stdin := c.stdin
	c.mu.Unlock()
	if stdin == nil {
		return ErrClosed
	}
	_, err = stdin.Write(data)
	return err
}

func (c *Client) readLoop(stdout io.ReadCloser) {
	reader := bufio.NewReaderSize(stdout, 64*1024)
	for {
		line, err := reader.ReadBytes('\n')
		if len(line) > 0 {
			if len(line) > maxLineBytes {
				c.queue.fail(fmt.Errorf("%w: notification line too large", ErrProtocol))
				return
			}
			c.handleLine(bytesTrimSpace(line))
		}
		if err != nil {
			if !errors.Is(err, io.EOF) {
				c.queue.fail(fmt.Errorf("%w: %v", ErrRuntimeExit, err))
			}
			return
		}
	}
}

func (c *Client) handleLine(line []byte) {
	if len(line) == 0 {
		return
	}
	var envelope rpcEnvelope
	if err := json.Unmarshal(line, &envelope); err != nil {
		return
	}
	hasID := len(envelope.ID) > 0 && string(envelope.ID) != "null"
	if hasID && envelope.Method != "" {
		return
	}
	if hasID {
		key := rpcIDKey(envelope.ID)
		c.mu.Lock()
		waiter := c.pending[key]
		c.mu.Unlock()
		if waiter == nil {
			return
		}
		if envelope.Error != nil {
			waiter.result <- rpcResponse{Err: fmt.Errorf("%w: %s", ErrProtocol, envelope.Error.Message)}
		} else {
			waiter.result <- rpcResponse{Result: envelope.Result}
		}
		return
	}
	if envelope.Method == "" {
		return
	}
	var payload map[string]any
	if len(envelope.Params) > 0 {
		if err := jsonutil.DecodeUseNumber(envelope.Params, &payload); err != nil {
			return
		}
	}
	if payload == nil {
		payload = map[string]any{}
	}
	notification := Notification{Method: envelope.Method, Payload: payload}
	size := notificationSize(notification)
	if err := c.queue.push(notification, size); err != nil {
		return
	}
}

func (c *Client) stderrLoop(stderr io.ReadCloser) {
	scanner := bufio.NewScanner(stderr)
	scanner.Buffer(make([]byte, 0, 4096), 256*1024)
	for scanner.Scan() {
		line := scanner.Text()
		c.mu.Lock()
		c.stderrLines = append(c.stderrLines, line)
		if len(c.stderrLines) > 400 {
			c.stderrLines = c.stderrLines[len(c.stderrLines)-400:]
		}
		c.mu.Unlock()
	}
}

func (c *Client) waitLoop(cmd *exec.Cmd) {
	err := cmd.Wait()
	c.mu.Lock()
	c.waitErr = err
	c.mu.Unlock()
	close(c.waitDone)
	c.failAll(fmt.Errorf("%w: %v", ErrRuntimeExit, err))
	c.queue.fail(fmt.Errorf("%w: %v", ErrRuntimeExit, err))
}

func (c *Client) failAll(err error) {
	c.mu.Lock()
	pending := make([]*pendingRequest, 0, len(c.pending))
	for _, waiter := range c.pending {
		pending = append(pending, waiter)
	}
	c.pending = make(map[string]*pendingRequest)
	c.mu.Unlock()
	for _, waiter := range pending {
		select {
		case waiter.result <- rpcResponse{Err: err}:
		default:
		}
	}
}

func (c *Client) recordRelationship(notification Notification) {
	if notification.Method != "subagent.started" {
		return
	}
	parent := stringField(notification.Payload, "parentSessionId")
	child := stringField(notification.Payload, "childSessionId")
	if parent == "" || child == "" || parent == child {
		return
	}
	c.mu.Lock()
	c.sessionParents[child] = parent
	c.mu.Unlock()
}

func (c *Client) belongs(notification Notification, root string) bool {
	if notification.Method == "subagent.started" || notification.Method == "subagent.finished" {
		parent := stringField(notification.Payload, "parentSessionId")
		child := stringField(notification.Payload, "childSessionId")
		return child == root || c.isDescendant(parent, root)
	}
	return c.isDescendant(stringField(notification.Payload, "sessionId"), root)
}

func (c *Client) isDescendant(sessionID, root string) bool {
	if sessionID == "" {
		return false
	}
	visited := map[string]bool{}
	current := sessionID
	for !visited[current] {
		if current == root {
			return true
		}
		visited[current] = true
		c.mu.Lock()
		parent, ok := c.sessionParents[current]
		c.mu.Unlock()
		if !ok {
			return false
		}
		current = parent
	}
	return false
}

func isInboxReceipt(notification Notification, sessionID, messageID string) bool {
	if notification.Method != "session.event" || stringField(notification.Payload, "sessionId") != sessionID {
		return false
	}
	event, _ := notification.Payload["event"].(map[string]any)
	if event == nil || stringField(event, "type") != "agent/inbox/spliced" {
		return false
	}
	data, _ := event["data"].(map[string]any)
	inserted, _ := data["inserted"].([]any)
	for _, item := range inserted {
		message, _ := item.(map[string]any)
		if stringField(message, "id") == messageID {
			return true
		}
	}
	return false
}

func finalResponse(events []map[string]any) (string, error) {
	for i := len(events) - 1; i >= 0; i-- {
		event := events[i]
		if stringField(event, "type") != "assistant/message" {
			continue
		}
		data, _ := event["data"].(map[string]any)
		if data == nil {
			continue
		}
		owner := data
		if message, ok := data["message"].(map[string]any); ok {
			owner = message
		}
		content, _ := owner["content"].([]any)
		var parts []string
		for _, item := range content {
			block, _ := item.(map[string]any)
			if block != nil && stringField(block, "type") == "text" {
				parts = append(parts, stringField(block, "text"))
			}
		}
		return strings.Join(parts, ""), nil
	}
	return "", nil
}

func finishReason(events []map[string]any) (string, error) {
	for i := len(events) - 1; i >= 0; i-- {
		event := events[i]
		if stringField(event, "type") != "turn/end" {
			continue
		}
		data, _ := event["data"].(map[string]any)
		reason, _ := data["reason"].(map[string]any)
		kind := stringField(reason, "kind")
		if kind == "" {
			return "", fmt.Errorf("%w: turn/end event requires data.reason.kind", ErrProtocol)
		}
		return kind, nil
	}
	return "", nil
}

func rpcIDKey(raw json.RawMessage) string {
	var text string
	if err := json.Unmarshal(raw, &text); err == nil {
		return text
	}
	return string(raw)
}

func stringField(value map[string]any, key string) string {
	if value == nil {
		return ""
	}
	text, _ := value[key].(string)
	return text
}

func mergeEnv(overrides map[string]string) []string {
	values := make(map[string]string)
	for _, entry := range os.Environ() {
		key, value, ok := strings.Cut(entry, "=")
		if ok {
			values[key] = value
		}
	}
	for key, value := range overrides {
		values[key] = value
	}
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	env := make([]string, 0, len(keys))
	for _, key := range keys {
		env = append(env, key+"="+values[key])
	}
	return env
}

func bytesTrimSpace(value []byte) []byte {
	start, end := 0, len(value)
	for start < end && (value[start] == ' ' || value[start] == '\t' || value[start] == '\r' || value[start] == '\n') {
		start++
	}
	for end > start && (value[end-1] == ' ' || value[end-1] == '\t' || value[end-1] == '\r' || value[end-1] == '\n') {
		end--
	}
	return value[start:end]
}

func marshalNoEscape(value any) ([]byte, error) {
	return jsonutil.Marshal(value)
}
