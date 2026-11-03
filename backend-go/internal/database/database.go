package database

import (
	"context"
	"embed"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"nekoweb/backend-go/internal/config"
	"nekoweb/backend-go/internal/visitor"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

type DB struct {
	Pool    *pgxpool.Pool
	Enabled bool
}

func Open(ctx context.Context, cfg *config.Config) (*DB, error) {
	if !cfg.DatabaseEnabled {
		return nil, nil
	}
	poolConfig, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse DATABASE_URL: %w", err)
	}
	poolConfig.MaxConns = int32(cfg.DatabaseMaxConns)
	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("connect database: %w", err)
	}
	db := &DB{Pool: pool, Enabled: true}
	if err := db.Migrate(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return db, nil
}

func (db *DB) Close() {
	if db != nil && db.Pool != nil {
		db.Pool.Close()
	}
}

func (db *DB) Ready(ctx context.Context) bool {
	if db == nil || db.Pool == nil {
		return false
	}
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	return db.Pool.Ping(ctx) == nil
}

func (db *DB) Migrate(ctx context.Context) error {
	if _, err := db.Pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (
		version INTEGER PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
	)`); err != nil {
		return err
	}
	var applied int
	if err := db.Pool.QueryRow(ctx, `SELECT COALESCE(MAX(version), 0) FROM schema_migrations`).Scan(&applied); err != nil {
		return err
	}
	entries, err := migrationFiles.ReadDir("migrations")
	if err != nil {
		return err
	}
	names := make([]string, 0, len(entries))
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			names = append(names, entry.Name())
		}
	}
	sort.Strings(names)
	for _, name := range names {
		version, err := migrationVersion(name)
		if err != nil {
			return err
		}
		if version <= applied {
			continue
		}
		data, err := migrationFiles.ReadFile("migrations/" + name)
		if err != nil {
			return err
		}
		tx, err := db.Pool.Begin(ctx)
		if err != nil {
			return err
		}
		statements, err := splitStatements(string(data))
		if err != nil {
			_ = tx.Rollback(ctx)
			return err
		}
		for _, statement := range statements {
			if _, err := tx.Exec(ctx, statement); err != nil {
				_ = tx.Rollback(ctx)
				return fmt.Errorf("migration %s: %w", name, err)
			}
		}
		if _, err := tx.Exec(ctx, `INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING`, version); err != nil {
			_ = tx.Rollback(ctx)
			return err
		}
		if err := tx.Commit(ctx); err != nil {
			return err
		}
	}
	return nil
}

func migrationVersion(name string) (int, error) {
	prefix, _, ok := strings.Cut(name, "_")
	if !ok {
		return 0, fmt.Errorf("migration %s has no numeric prefix", name)
	}
	version, err := strconv.Atoi(prefix)
	if err != nil || version <= 0 {
		return 0, fmt.Errorf("migration %s has an invalid version", name)
	}
	return version, nil
}

func splitStatements(sql string) ([]string, error) {
	parts := strings.Split(sql, ";")
	statements := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		// Skip a chunk that is only comments.
		hasCode := false
		for _, line := range strings.Split(part, "\n") {
			line = strings.TrimSpace(line)
			if line != "" && !strings.HasPrefix(line, "--") {
				hasCode = true
				break
			}
		}
		if hasCode {
			statements = append(statements, part)
		}
	}
	return statements, nil
}

func (db *DB) LoadVisitorAccounts(ctx context.Context) (map[string]visitor.Account, error) {
	if db == nil || db.Pool == nil {
		return nil, nil
	}
	rows, err := db.Pool.Query(ctx,
		`SELECT id, username, display_name, password_hash, disabled FROM visitor_accounts`)
	if err != nil {
		return nil, err
	}
	accounts := make(map[string]visitor.Account)
	byID := make(map[string]string)
	for rows.Next() {
		var id pgtype.UUID
		var username, displayName, passwordHash string
		var disabled bool
		if err := rows.Scan(&id, &username, &displayName, &passwordHash, &disabled); err != nil {
			rows.Close()
			return nil, err
		}
		account := visitor.Account{
			ID: id.String(), Username: username, Name: displayName,
			PasswordHash: passwordHash, Disabled: disabled,
		}
		accounts[username] = account
		byID[account.ID] = username
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}

	appRows, err := db.Pool.Query(ctx, `SELECT account_id, app_id FROM visitor_account_apps ORDER BY app_id`)
	if err != nil {
		return nil, err
	}
	defer appRows.Close()
	for appRows.Next() {
		var accountID pgtype.UUID
		var appID string
		if err := appRows.Scan(&accountID, &appID); err != nil {
			return nil, err
		}
		if username, ok := byID[accountID.String()]; ok {
			account := accounts[username]
			account.Apps = append(account.Apps, appID)
			accounts[username] = account
		}
	}
	return accounts, appRows.Err()
}

func (db *DB) FindVisitorAccountID(ctx context.Context, username string) (pgtype.UUID, bool, error) {
	if db == nil || db.Pool == nil || username == "" {
		return pgtype.UUID{}, false, nil
	}
	var id pgtype.UUID
	err := db.Pool.QueryRow(ctx, `SELECT id FROM visitor_accounts WHERE username=$1`, username).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return pgtype.UUID{}, false, nil
		}
		return pgtype.UUID{}, false, err
	}
	return id, true, nil
}

// SyncVisitorAccounts upserts a validated account snapshot into PostgreSQL.
// Existing accounts not present in the snapshot are left untouched.
func (db *DB) SyncVisitorAccounts(ctx context.Context, accounts map[string]visitor.Account) error {
	if db == nil || db.Pool == nil {
		return errors.New("database is not enabled")
	}
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	for key, account := range accounts {
		if key == "" || account.PasswordHash == "" {
			return errors.New("invalid visitor account")
		}
		if _, _, _, ok := visitor.ParseHash(account.PasswordHash); !ok {
			return errors.New("invalid visitor password hash")
		}
		var id pgtype.UUID
		err := tx.QueryRow(ctx,
			`INSERT INTO visitor_accounts (id, username, display_name, password_hash, disabled)
			 VALUES ($1, $2, $3, $4, $5)
			 ON CONFLICT (username) DO UPDATE
			 SET display_name=EXCLUDED.display_name,
			     password_hash=EXCLUDED.password_hash,
			     disabled=EXCLUDED.disabled,
			     updated_at=now()
			 RETURNING id`,
			pgtype.UUID{Bytes: [16]byte(uuid.New()), Valid: true},
			key, account.Name, account.PasswordHash, account.Disabled,
		).Scan(&id)
		if err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `DELETE FROM visitor_account_apps WHERE account_id=$1`, id); err != nil {
			return err
		}
		for _, appID := range account.Apps {
			if _, err := tx.Exec(ctx,
				`INSERT INTO visitor_account_apps (account_id, app_id) VALUES ($1, $2)`, id, appID); err != nil {
				return err
			}
		}
	}
	return tx.Commit(ctx)
}

type TurnRecord struct {
	ClientSessionID  string
	VisitorUsername  string
	RequestID        string
	UserMessage      string
	AssistantMessage string
	Status           string
	ErrorCode        string
	DesktopAction    string
	Model            string
	LatencyMS        int
}

func (db *DB) RecordTurn(ctx context.Context, record TurnRecord) error {
	if db == nil || db.Pool == nil {
		return nil
	}
	if record.ClientSessionID == "" {
		record.ClientSessionID = "request:" + record.RequestID
	}
	var visitorID pgtype.UUID
	if record.VisitorUsername != "" {
		id, ok, err := db.FindVisitorAccountID(ctx, record.VisitorUsername)
		if err != nil {
			return err
		}
		if ok {
			visitorID = id
		}
	}

	conversationID := pgtype.UUID{Bytes: [16]byte(uuid.New()), Valid: true}
	err := db.Pool.QueryRow(ctx,
		`INSERT INTO agent_conversations (id, client_session_id, visitor_account_id)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (client_session_id) DO UPDATE
		 SET last_active_at=now(),
		     visitor_account_id=COALESCE(EXCLUDED.visitor_account_id, agent_conversations.visitor_account_id)
		 RETURNING id`,
		conversationID, record.ClientSessionID, visitorID,
	).Scan(&conversationID)
	if err != nil {
		return err
	}

	var assistant any
	if record.AssistantMessage != "" {
		assistant = record.AssistantMessage
	}
	var errorCode any
	if record.ErrorCode != "" {
		errorCode = record.ErrorCode
	}
	var desktopAction any
	if record.DesktopAction != "" {
		desktopAction = record.DesktopAction
	}
	var model any
	if record.Model != "" {
		model = record.Model
	}
	_, err = db.Pool.Exec(ctx,
		`INSERT INTO agent_turns
		 (id, conversation_id, request_id, user_message, assistant_message, status, error_code,
		  desktop_action, model, latency_ms, finished_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now())
		 ON CONFLICT (request_id) DO NOTHING`,
		pgtype.UUID{Bytes: [16]byte(uuid.New()), Valid: true},
		conversationID, record.RequestID, record.UserMessage, assistant,
		record.Status, errorCode, desktopAction, model, record.LatencyMS,
	)
	return err
}
