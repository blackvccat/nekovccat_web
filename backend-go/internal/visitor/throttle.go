package visitor

import (
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"sync"
	"time"

	_ "modernc.org/sqlite"
)

type FailureStore struct {
	path        string
	maxFailures int
	window      time.Duration
	Now         func() time.Time

	mu          sync.Mutex
	db          *sql.DB
	initialized bool
}

func NewFailureStore(path string, maxFailures, windowSeconds int) *FailureStore {
	return &FailureStore{
		path:        path,
		maxFailures: maxFailures,
		window:      time.Duration(windowSeconds) * time.Second,
		Now:         time.Now,
	}
}

func (s *FailureStore) initialize(ctx context.Context) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.initialized {
		return nil
	}
	if err := os.MkdirAll(filepath.Dir(s.path), 0o700); err != nil {
		return err
	}
	dsn := "file:" + filepath.ToSlash(s.path) + "?_pragma=busy_timeout(3000)&_pragma=journal_mode(WAL)"
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return err
	}
	db.SetMaxOpenConns(1)
	if _, err := db.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS login_failures (
		username TEXT NOT NULL,
		ts REAL NOT NULL
	)`); err != nil {
		_ = db.Close()
		return err
	}
	if _, err := db.ExecContext(ctx, `CREATE INDEX IF NOT EXISTS login_failures_username_ts ON login_failures (username, ts)`); err != nil {
		_ = db.Close()
		return err
	}
	s.db = db
	s.initialized = true
	return nil
}

func (s *FailureStore) recent(ctx context.Context, username string) ([]float64, error) {
	if err := s.initialize(ctx); err != nil {
		return nil, err
	}
	cutoff := float64(s.Now().Add(-s.window).UnixNano()) / 1e9
	rows, err := s.db.QueryContext(ctx,
		`SELECT ts FROM login_failures WHERE username=? AND ts>? ORDER BY ts`, username, cutoff)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var values []float64
	for rows.Next() {
		var value float64
		if err := rows.Scan(&value); err != nil {
			return nil, err
		}
		values = append(values, value)
	}
	return values, rows.Err()
}

func (s *FailureStore) Locked(ctx context.Context, username string) (bool, error) {
	recent, err := s.recent(ctx, username)
	if err != nil {
		return false, err
	}
	return len(recent) >= s.maxFailures, nil
}

func (s *FailureStore) RetryAfter(ctx context.Context, username string) (int, error) {
	recent, err := s.recent(ctx, username)
	if err != nil {
		return 0, err
	}
	if len(recent) < s.maxFailures {
		return 0, nil
	}
	oldest := recent[len(recent)-s.maxFailures]
	remaining := oldest + s.window.Seconds() - float64(s.Now().UnixNano())/1e9
	if remaining < 1 {
		return 1, nil
	}
	return int(remaining) + 1, nil
}

func (s *FailureStore) RecordFailure(ctx context.Context, username string) error {
	if err := s.initialize(ctx); err != nil {
		return err
	}
	now := float64(s.Now().UnixNano()) / 1e9
	cutoff := now - s.window.Seconds()
	if _, err := s.db.ExecContext(ctx, `DELETE FROM login_failures WHERE ts < ?`, cutoff); err != nil {
		return err
	}
	_, err := s.db.ExecContext(ctx, `INSERT INTO login_failures (username, ts) VALUES (?, ?)`, username, now)
	return err
}

func (s *FailureStore) Clear(ctx context.Context, username string) error {
	if err := s.initialize(ctx); err != nil {
		return err
	}
	_, err := s.db.ExecContext(ctx, `DELETE FROM login_failures WHERE username=?`, username)
	return err
}

func (s *FailureStore) Close() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.db == nil {
		return nil
	}
	err := s.db.Close()
	s.db = nil
	s.initialized = false
	return err
}
