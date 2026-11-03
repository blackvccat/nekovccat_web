package agent

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"nekoweb/backend-go/internal/chat"
	"nekoweb/backend-go/internal/config"
	"nekoweb/backend-go/internal/harness"
)

type fakeRuntime struct {
	result harness.RunResult
}

func (f *fakeRuntime) Start(context.Context) error      { return nil }
func (f *fakeRuntime) Initialize(context.Context) error { return nil }
func (f *fakeRuntime) Close(context.Context) error      { return nil }
func (f *fakeRuntime) Run(_ context.Context, sessionID, _ string, _ func(harness.Notification) error) (harness.RunResult, error) {
	result := f.result
	result.SessionID = sessionID
	return result, nil
}

func testConfig(t *testing.T) *config.Config {
	t.Helper()
	dir := t.TempDir()
	patch := filepath.Join(dir, "website.patch.yml")
	if err := os.WriteFile(patch, []byte("[]"), 0o600); err != nil {
		t.Fatal(err)
	}
	private := filepath.Join(dir, "private.json")
	answers := map[string]any{"quiz_answers": map[string][]string{
		"anime": {"x"}, "birthday": {"01-02"}, "cat_name": {"cat"}, "mbti": {"xxxx"}, "initials": {"zz"},
	}}
	data, _ := json.Marshal(answers)
	if err := os.WriteFile(private, data, 0o600); err != nil {
		t.Fatal(err)
	}
	return &config.Config{
		ProjectRoot:                 dir,
		Environment:                 "development",
		DeepSeekAPIKey:              "placeholder-key",
		DeepSeekModel:               "deepseek-v4-pro",
		DSHBin:                      "fake-runtime",
		DSHHome:                     filepath.Join(dir, "home"),
		DSHPatchPath:                patch,
		RelationshipPrivatePath:     private,
		DSHRequestTimeoutSeconds:    30,
		DSHInitializeTimeoutSeconds: 5,
		DSHCleanupTimeoutSeconds:    1,
		DSHMaxTokens:                1024,
		DSHMaxNotificationEvents:    100,
		DSHMaxNotificationBytes:     1 << 20,
		DSHMaxReplyBytes:            65536,
		CHATStreamMaxEvents:         64,
		CHATStreamMaxBytes:          65536,
		CHATHeartbeatSeconds:        1,
		CHATSendTimeoutSeconds:      5,
		CHATMaxConcurrent:           3,
	}
}

func girlfriendResult() harness.RunResult {
	return harness.RunResult{
		FinalResponse: "问答验证结束。",
		FinishReason:  "completed",
		Events: []map[string]any{
			{"type": "tool/call", "data": map[string]any{"callId": "egg-1", "name": "girlfriend_mode"}},
			{"type": "tool/result", "data": map[string]any{"message": map[string]any{"content": []any{
				map[string]any{"type": "tool-result", "toolCallId": "egg-1", "content": []any{
					map[string]any{"type": "text", "text": `{"unlocked":true,"progress":5,"next_question":null}`},
				}},
			}}}},
			{"type": "turn/end", "data": map[string]any{"reason": map[string]any{"kind": "completed"}}},
		},
	}
}

func newFakeService(t *testing.T) (*Service, *fakeRuntime) {
	t.Helper()
	cfg := testConfig(t)
	manager := NewManager(cfg, nil)
	runtime := &fakeRuntime{result: girlfriendResult()}
	manager.NewRuntime = func(*PreparedRuntime, bool) (Runtime, error) { return runtime, nil }
	return NewService(cfg, manager, nil), runtime
}

func TestGenerateReplyDetectsVerifiedDesktopAction(t *testing.T) {
	service, _ := newFakeService(t)
	reply, err := service.GenerateReply(context.Background(), []chat.Message{{Role: "user", Content: "fixture"}})
	if err != nil {
		t.Fatal(err)
	}
	if reply.Content != "问答验证结束。" || reply.DesktopAction != "unlock-girlfriend" {
		t.Fatalf("unexpected reply: %+v", reply)
	}
}

func TestStreamProgressiveEmitsFinalDesktopAndDone(t *testing.T) {
	service, _ := newFakeService(t)
	var events []chat.Event
	err := service.Stream(context.Background(), []chat.Message{{Role: "user", Content: "fixture"}}, true, func(event chat.Event) error {
		events = append(events, event)
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(events) < 3 {
		t.Fatalf("not enough events: %+v", events)
	}
	if events[len(events)-3]["phase"] != "final" {
		t.Fatalf("final not before desktop: %+v", events)
	}
	if events[len(events)-2]["action"] != "unlock-girlfriend" {
		t.Fatalf("desktop missing: %+v", events)
	}
	if events[len(events)-1]["done"] != true {
		t.Fatalf("done missing: %+v", events)
	}
}
