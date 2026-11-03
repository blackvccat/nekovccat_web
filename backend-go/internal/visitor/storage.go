package visitor

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	_ "modernc.org/sqlite"
)

const (
	MaxDataKeys    = 200
	MaxDataKeySize = 64
	MaxValueBytes  = 64 * 1024
	MaxFiles       = 200
	MaxFileBytes   = 8 * 1024 * 1024
)

var (
	dataKeyPattern  = regexp.MustCompile(`^[A-Za-z0-9._:-]{1,64}$`)
	fileNamePattern = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._ -]{0,127}$`)
	safeSegment     = regexp.MustCompile(`^[A-Za-z0-9._-]{1,64}$`)
)

type StorageError struct {
	Status  int
	Message string
}

func (e *StorageError) Error() string { return e.Message }

func storageError(status int, message string) error {
	return &StorageError{Status: status, Message: message}
}

type Storage struct {
	dbPath   string
	filesDir string

	mu          sync.Mutex
	db          *sql.DB
	initialized bool
}

func NewStorage(dbPath, filesDir string) *Storage {
	return &Storage{dbPath: dbPath, filesDir: filesDir}
}

func (s *Storage) initialize(ctx context.Context) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.initialized {
		return nil
	}
	if err := os.MkdirAll(filepath.Dir(s.dbPath), 0o700); err != nil {
		return err
	}
	dsn := "file:" + filepath.ToSlash(s.dbPath) + "?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)"
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return err
	}
	db.SetMaxOpenConns(1)
	if _, err := db.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS visitor_app_data (
		app_id TEXT NOT NULL,
		username TEXT NOT NULL,
		key TEXT NOT NULL,
		value TEXT NOT NULL,
		updated_at INTEGER NOT NULL,
		PRIMARY KEY (app_id, username, key)
	)`); err != nil {
		_ = db.Close()
		return err
	}
	s.db = db
	s.initialized = true
	return nil
}

func (s *Storage) Close() error {
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

func (s *Storage) DataAll(ctx context.Context, appID, username string) (map[string]json.RawMessage, error) {
	if err := s.initialize(ctx); err != nil {
		return nil, err
	}
	rows, err := s.db.QueryContext(ctx,
		`SELECT key, value FROM visitor_app_data WHERE app_id=? AND username=?`, appID, username)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	data := make(map[string]json.RawMessage)
	for rows.Next() {
		var key, raw string
		if err := rows.Scan(&key, &raw); err != nil {
			return nil, err
		}
		if json.Valid([]byte(raw)) {
			data[key] = json.RawMessage(raw)
		}
	}
	return data, rows.Err()
}

func (s *Storage) DataSet(ctx context.Context, appID, username, key string, value json.RawMessage) error {
	if !dataKeyPattern.MatchString(key) {
		return storageError(400, "键名不合法。")
	}
	if !json.Valid(value) {
		return storageError(400, "值必须是可序列化的 JSON。")
	}
	if len(value) > MaxValueBytes {
		return storageError(413, "这条数据太大了。")
	}
	if err := s.initialize(ctx); err != nil {
		return err
	}
	var exists int
	err := s.db.QueryRowContext(ctx,
		`SELECT 1 FROM visitor_app_data WHERE app_id=? AND username=? AND key=?`,
		appID, username, key).Scan(&exists)
	if errors.Is(err, sql.ErrNoRows) {
		var count int
		if err := s.db.QueryRowContext(ctx,
			`SELECT COUNT(*) FROM visitor_app_data WHERE app_id=? AND username=?`,
			appID, username).Scan(&count); err != nil {
			return err
		}
		if count >= MaxDataKeys {
			return storageError(409, "这个应用的数据条数已达上限。")
		}
	} else if err != nil {
		return err
	}
	_, err = s.db.ExecContext(ctx,
		`INSERT INTO visitor_app_data (app_id, username, key, value, updated_at) VALUES (?,?,?,?,?)
		 ON CONFLICT (app_id, username, key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`,
		appID, username, key, string(value), time.Now().Unix())
	return err
}

func (s *Storage) DataDelete(ctx context.Context, appID, username, key string) (bool, error) {
	if !dataKeyPattern.MatchString(key) {
		return false, storageError(400, "键名不合法。")
	}
	if err := s.initialize(ctx); err != nil {
		return false, err
	}
	result, err := s.db.ExecContext(ctx,
		`DELETE FROM visitor_app_data WHERE app_id=? AND username=? AND key=?`, appID, username, key)
	if err != nil {
		return false, err
	}
	affected, err := result.RowsAffected()
	return affected > 0, err
}

type FileInfo struct {
	Name      string `json:"name"`
	Size      int64  `json:"size"`
	UpdatedAt int64  `json:"updatedAt"`
}

func (s *Storage) visitorDir(appID, username string) (string, error) {
	if !appIDPattern.MatchString(appID) {
		return "", storageError(400, "应用标识不合法。")
	}
	segment := username
	if !safeSegment.MatchString(segment) {
		sum := sha256.Sum256([]byte(username))
		segment = hex.EncodeToString(sum[:])
	}
	base, err := filepath.Abs(s.filesDir)
	if err != nil {
		return "", err
	}
	dir := filepath.Join(base, appID, segment)
	if !strings.HasPrefix(dir, base+string(os.PathSeparator)) {
		return "", storageError(400, "文件路径不合法。")
	}
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return "", err
	}
	return dir, nil
}

func (s *Storage) ListFiles(_ context.Context, appID, username string) ([]FileInfo, error) {
	dir, err := s.visitorDir(appID, username)
	if err != nil {
		return nil, err
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	files := make([]FileInfo, 0, len(entries))
	for _, entry := range entries {
		if !entry.Type().IsRegular() {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			continue
		}
		files = append(files, FileInfo{Name: entry.Name(), Size: info.Size(), UpdatedAt: info.ModTime().Unix()})
	}
	sort.Slice(files, func(i, j int) bool { return files[i].Name < files[j].Name })
	return files, nil
}

func validFileName(name string) bool {
	return fileNamePattern.MatchString(name) && name != "." && name != ".."
}

func (s *Storage) WriteFile(_ context.Context, appID, username, name string, payload []byte) (FileInfo, error) {
	if !validFileName(name) {
		return FileInfo{}, storageError(400, "文件名不合法。")
	}
	if len(payload) > MaxFileBytes {
		return FileInfo{}, storageError(413, "文件太大。")
	}
	dir, err := s.visitorDir(appID, username)
	if err != nil {
		return FileInfo{}, err
	}
	target := filepath.Join(dir, name)
	if filepath.Dir(target) != dir {
		return FileInfo{}, storageError(400, "文件名不合法。")
	}
	if _, err := os.Stat(target); errors.Is(err, os.ErrNotExist) {
		files, err := s.ListFiles(context.Background(), appID, username)
		if err != nil {
			return FileInfo{}, err
		}
		if len(files) >= MaxFiles {
			return FileInfo{}, storageError(409, "这个应用的文件数已达上限。")
		}
	}
	if err := os.WriteFile(target, payload, 0o600); err != nil {
		return FileInfo{}, err
	}
	return FileInfo{Name: name, Size: int64(len(payload)), UpdatedAt: time.Now().Unix()}, nil
}

func (s *Storage) FilePath(_ context.Context, appID, username, name string) (string, error) {
	if !validFileName(name) {
		return "", storageError(400, "文件名不合法。")
	}
	dir, err := s.visitorDir(appID, username)
	if err != nil {
		return "", err
	}
	target := filepath.Join(dir, name)
	if filepath.Dir(target) != dir {
		return "", storageError(400, "文件名不合法。")
	}
	info, err := os.Stat(target)
	if err != nil || info.IsDir() {
		return "", os.ErrNotExist
	}
	return target, nil
}

func (s *Storage) DeleteFile(_ context.Context, appID, username, name string) (bool, error) {
	path, err := s.FilePath(context.Background(), appID, username, name)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return false, nil
		}
		return false, err
	}
	if err := os.Remove(path); err != nil {
		return false, err
	}
	return true, nil
}
