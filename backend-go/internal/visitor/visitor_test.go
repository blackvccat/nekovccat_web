package visitor

import (
	"bytes"
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func testHash(t *testing.T, password string) string {
	t.Helper()
	hash, err := HashPassword(password, 50_000, bytes.Repeat([]byte{7}, 16))
	if err != nil {
		t.Fatal(err)
	}
	return hash
}

func writeAccounts(t *testing.T, path string) {
	t.Helper()
	document := map[string]any{"visitors": []map[string]any{
		{"username": "Alice", "name": "Alice", "password_hash": testHash(t, "secret"), "apps": []string{"notebook"}},
		{"username": "bob", "name": "Bob", "password_hash": testHash(t, "other"), "apps": "notebook,tomato", "disabled": false},
	}}
	data, _ := json.Marshal(document)
	if err := os.WriteFile(path, data, 0o600); err != nil {
		t.Fatal(err)
	}
}

func TestAccountsHashAndAuthenticate(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "accounts.json")
	writeAccounts(t, path)
	accounts, err := LoadAccounts(path)
	if err != nil {
		t.Fatal(err)
	}
	if len(accounts) != 2 {
		t.Fatalf("accounts: %d", len(accounts))
	}
	account, ok := Authenticate(accounts, "ALICE", "secret")
	if !ok || account.Name != "Alice" {
		t.Fatalf("authenticate: %+v %v", account, ok)
	}
	if _, ok := Authenticate(accounts, "alice", "wrong"); ok {
		t.Fatal("wrong password accepted")
	}
	bob, _ := FindAccount(accounts, "bob")
	if len(bob.Apps) != 2 {
		t.Fatalf("apps: %+v", bob.Apps)
	}
}

func TestLoadAppsAndPathSafety(t *testing.T) {
	dir := t.TempDir()
	appDir := filepath.Join(dir, "notebook")
	if err := os.MkdirAll(filepath.Join(appDir, "assets"), 0o700); err != nil {
		t.Fatal(err)
	}
	manifest := map[string]any{
		"apiVersion": 1, "id": "notebook", "title": "Notebook",
		"entry": "index.html", "permissions": []string{"data", "files"},
		"window": map[string]int{"width": 640, "height": 560},
		"icon":   "icon.svg",
	}
	data, _ := json.Marshal(manifest)
	if err := os.WriteFile(filepath.Join(appDir, "app.json"), data, 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(appDir, "index.html"), []byte("<html></html>"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(appDir, "assets", "icon.svg"), []byte("<svg/>"), 0o600); err != nil {
		t.Fatal(err)
	}
	apps, err := LoadApps(dir)
	if err != nil {
		t.Fatal(err)
	}
	app, ok := apps["notebook"]
	if !ok {
		t.Fatal("app missing")
	}
	if !app.HasPermission("data") || !app.HasPermission("files") {
		t.Fatalf("permissions: %+v", app.Permissions)
	}
	if _, err := EntryFile(dir, app); err != nil {
		t.Fatal(err)
	}
	if _, err := AssetFile(dir, app, "icon"); err != nil {
		t.Fatal(err)
	}
	if _, err := StaticFile(dir, app, "../app.json"); err == nil {
		t.Fatal("path traversal accepted")
	}
	if _, err := StaticFile(dir, app, "app.json"); err == nil {
		t.Fatal("manifest exposed")
	}
}

func TestStorageDataAndFiles(t *testing.T) {
	dir := t.TempDir()
	store := NewStorage(filepath.Join(dir, "data.sqlite"), filepath.Join(dir, "files"))
	defer store.Close()
	ctx := context.Background()
	if err := store.DataSet(ctx, "notebook", "alice", "note", json.RawMessage(`{"hello":"world"}`)); err != nil {
		t.Fatal(err)
	}
	data, err := store.DataAll(ctx, "notebook", "alice")
	if err != nil {
		t.Fatal(err)
	}
	if string(data["note"]) != `{"hello":"world"}` {
		t.Fatalf("data: %s", data["note"])
	}
	if removed, err := store.DataDelete(ctx, "notebook", "alice", "note"); err != nil || !removed {
		t.Fatalf("delete: %v %v", removed, err)
	}
	if _, err := store.WriteFile(ctx, "notebook", "alice", "photo.png", []byte("fixture")); err != nil {
		t.Fatal(err)
	}
	files, err := store.ListFiles(ctx, "notebook", "alice")
	if err != nil || len(files) != 1 || files[0].Name != "photo.png" {
		t.Fatalf("files: %+v %v", files, err)
	}
	path, err := store.FilePath(ctx, "notebook", "alice", "photo.png")
	if err != nil {
		t.Fatal(err)
	}
	content, _ := os.ReadFile(path)
	if string(content) != "fixture" {
		t.Fatalf("file content: %q", content)
	}
	if _, err := store.WriteFile(ctx, "notebook", "alice", "../escape", []byte("x")); err == nil {
		t.Fatal("invalid filename accepted")
	}
}

func TestFailureStoreLocksPerUsername(t *testing.T) {
	dir := t.TempDir()
	store := NewFailureStore(filepath.Join(dir, "failures.sqlite"), 2, 60)
	now := time.Unix(1_700_000_000, 0)
	store.Now = func() time.Time { return now }
	defer store.Close()
	ctx := context.Background()
	if locked, _ := store.Locked(ctx, "alice"); locked {
		t.Fatal("unexpected lock")
	}
	_ = store.RecordFailure(ctx, "alice")
	_ = store.RecordFailure(ctx, "alice")
	if locked, err := store.Locked(ctx, "alice"); err != nil || !locked {
		t.Fatalf("locked=%v err=%v", locked, err)
	}
	if retry, _ := store.RetryAfter(ctx, "alice"); retry <= 0 {
		t.Fatalf("retry=%d", retry)
	}
	_ = store.Clear(ctx, "alice")
	if locked, _ := store.Locked(ctx, "alice"); locked {
		t.Fatal("clear failed")
	}
}

func TestServiceLoginAndProof(t *testing.T) {
	dir := t.TempDir()
	accountsPath := filepath.Join(dir, "accounts.json")
	writeAccounts(t, accountsPath)
	service := NewService(Config{
		AccountsPath: accountsPath, AppsDir: filepath.Join(dir, "apps"),
		AppDataDB: filepath.Join(dir, "data.sqlite"), AppFilesDir: filepath.Join(dir, "files"),
		ThrottleDB: filepath.Join(dir, "failures.sqlite"), MaxFailures: 3, FailureWindowSeconds: 60,
		InternalToken: strings.Repeat("s", 32),
	}, nil)
	defer service.Close()
	account, proof, err := service.Login(context.Background(), "alice", "secret", strings.Repeat("a", 48))
	if err != nil {
		t.Fatal(err)
	}
	if account.Name != "Alice" || !strings.HasPrefix(proof, "v1.") {
		t.Fatalf("account=%+v proof=%q", account, proof)
	}
	if _, _, err := service.Login(context.Background(), "alice", "wrong", strings.Repeat("a", 48)); err == nil {
		t.Fatal("wrong password accepted")
	}
}
