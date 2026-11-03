package agent

import (
	"context"
	"os"
	"testing"
)

func TestManagerShutdownRemovesPreparedPatches(t *testing.T) {
	cfg := testConfig(t)
	manager := NewManager(cfg, nil)
	if err := manager.Prepare(); err != nil {
		t.Fatal(err)
	}
	manager.mu.Lock()
	patch := manager.prepared.Patch
	progressive := manager.prepared.ProgressivePatch
	manager.mu.Unlock()

	manager.Shutdown(context.Background())

	for _, path := range []string{patch, progressive} {
		if _, err := os.Stat(path); !os.IsNotExist(err) {
			t.Fatalf("patch not removed: %s (%v)", path, err)
		}
	}
	if manager.Ready() {
		t.Fatal("manager must not be ready after shutdown")
	}
}
