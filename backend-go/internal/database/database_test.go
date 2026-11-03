package database

import (
	"context"
	"os"
	"strings"
	"testing"
	"time"

	"nekoweb/backend-go/internal/config"
	"nekoweb/backend-go/internal/visitor"
)

func TestMigrationContainsBusinessTables(t *testing.T) {
	data, err := migrationFiles.ReadFile("migrations/0001_initial.sql")
	if err != nil {
		t.Fatal(err)
	}
	sql := string(data)
	for _, table := range []string{"visitor_accounts", "visitor_account_apps", "agent_conversations", "agent_turns", "schema_migrations"} {
		if !strings.Contains(sql, "CREATE TABLE IF NOT EXISTS "+table) {
			t.Fatalf("missing table %s", table)
		}
	}
	statements, err := splitStatements(sql)
	if err != nil || len(statements) < 7 {
		t.Fatalf("statements=%d err=%v", len(statements), err)
	}
}

func TestSplitStatementsSkipsCommentsOnly(t *testing.T) {
	statements, err := splitStatements("-- comment;\nCREATE TABLE x (id INT);\n-- tail")
	if err != nil || len(statements) != 1 || !strings.Contains(statements[0], "CREATE TABLE") {
		t.Fatalf("statements=%+v err=%v", statements, err)
	}
}

func TestDatabaseDisabledIsNoop(t *testing.T) {
	db, err := Open(context.Background(), &config.Config{DatabaseEnabled: false})
	if err != nil || db != nil {
		t.Fatalf("db=%v err=%v", db, err)
	}
}

func TestPostgresIntegration(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("set TEST_DATABASE_URL to run PostgreSQL integration test")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	cfg := &config.Config{DatabaseEnabled: true, DatabaseURL: dsn, DatabaseMaxConns: 3}
	db, err := Open(ctx, cfg)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	hash, err := visitor.HashPassword("integration-secret", 50_000, []byte("0123456789abcdef"))
	if err != nil {
		t.Fatal(err)
	}
	accounts := map[string]visitor.Account{
		"integration-alice": {
			Username: "integration-alice", Name: "Integration Alice",
			PasswordHash: hash, Apps: []string{"notebook"},
		},
	}
	if err := db.SyncVisitorAccounts(ctx, accounts); err != nil {
		t.Fatal(err)
	}
	loaded, err := db.LoadVisitorAccounts(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if account, ok := loaded["integration-alice"]; !ok || len(account.Apps) != 1 {
		t.Fatalf("loaded account: %+v %v", account, ok)
	}
	requestID := "integration-" + time.Now().Format("20060102150405.000000000")
	if err := db.RecordTurn(ctx, TurnRecord{
		ClientSessionID: "integration-session", VisitorUsername: "integration-alice",
		RequestID: requestID, UserMessage: "hello", AssistantMessage: "world",
		Status: "completed", Model: "fixture", LatencyMS: 12,
	}); err != nil {
		t.Fatal(err)
	}
	var count int
	if err := db.Pool.QueryRow(ctx, `SELECT count(*) FROM agent_turns WHERE request_id=$1`, requestID).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != 1 {
		t.Fatalf("turn count: %d", count)
	}
	_, _ = db.Pool.Exec(ctx, `DELETE FROM visitor_accounts WHERE username='integration-alice'`)
}
