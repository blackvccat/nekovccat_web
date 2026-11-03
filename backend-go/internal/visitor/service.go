package visitor

import (
	"context"
	"errors"
	"os"
	"strings"
	"time"
)

type AccountSource interface {
	LoadVisitorAccounts(ctx context.Context) (map[string]Account, error)
}

type Service struct {
	Config        Config
	AccountSource AccountSource
	Storage       *Storage
	Failures      *FailureStore
	Now           func() time.Time
}

type Config struct {
	AccountsPath         string
	AppsDir              string
	AppDataDB            string
	AppFilesDir          string
	ThrottleDB           string
	MaxFailures          int
	FailureWindowSeconds int
	InternalToken        string
}

type AuthError struct {
	Status     int
	Message    string
	RetryAfter int
}

func (e *AuthError) Error() string { return e.Message }

func NewService(cfg Config, source AccountSource) *Service {
	return &Service{
		Config:        cfg,
		AccountSource: source,
		Storage:       NewStorage(cfg.AppDataDB, cfg.AppFilesDir),
		Failures:      NewFailureStore(cfg.ThrottleDB, cfg.MaxFailures, cfg.FailureWindowSeconds),
		Now:           time.Now,
	}
}

func (s *Service) Close() {
	_ = s.Storage.Close()
	_ = s.Failures.Close()
}

func (s *Service) LoadAccounts(ctx context.Context) (map[string]Account, error) {
	accounts := make(map[string]Account)
	hasDatabaseAccounts := false
	if s.AccountSource != nil {
		databaseAccounts, err := s.AccountSource.LoadVisitorAccounts(ctx)
		if err != nil {
			return nil, ErrAccountsUnavailable
		}
		if len(databaseAccounts) > 0 {
			hasDatabaseAccounts = true
			for key, account := range databaseAccounts {
				accounts[key] = account
			}
		}
	}
	if info, err := os.Stat(s.Config.AccountsPath); err == nil && !info.IsDir() {
		fileAccounts, err := LoadAccounts(s.Config.AccountsPath)
		if err != nil {
			return nil, err
		}
		for key, account := range fileAccounts {
			if _, exists := accounts[key]; exists {
				return nil, ErrAccountsInvalid
			}
			accounts[key] = account
		}
	}
	active := false
	for _, account := range accounts {
		if !account.Disabled {
			active = true
			break
		}
	}
	if !active && !hasDatabaseAccounts {
		return nil, ErrAccountsNotReady
	}
	if !active {
		return nil, ErrAccountsNotReady
	}
	return accounts, nil
}

func (s *Service) FindAccount(ctx context.Context, username string) (Account, error) {
	accounts, err := s.LoadAccounts(ctx)
	if err != nil {
		return Account{}, err
	}
	account, ok := FindAccount(accounts, username)
	if !ok || account.Disabled {
		return Account{}, &AuthError{Status: 401, Message: "请先登录访客模式。"}
	}
	return account, nil
}

func (s *Service) Login(ctx context.Context, username, password, sessionNonce string) (Account, string, error) {
	key := NormalizeUsername(username)
	if key == "" || len(key) > MaxUsernameLength {
		return Account{}, "", &AuthError{Status: 401, Message: "访客名或密码不正确。"}
	}
	locked, err := s.Failures.Locked(ctx, key)
	if err != nil {
		return Account{}, "", &AuthError{Status: 503, Message: "访客模式暂时不可用，请稍后再试。"}
	}
	if locked {
		retry, _ := s.Failures.RetryAfter(ctx, key)
		return Account{}, "", &AuthError{Status: 429, Message: "尝试次数过多，请稍后再试。", RetryAfter: retry}
	}
	accounts, err := s.LoadAccounts(ctx)
	if err != nil {
		if errors.Is(err, ErrAccountsNotReady) || errors.Is(err, ErrAccountsInvalid) {
			return Account{}, "", &AuthError{Status: 503, Message: "访客模式尚未配置，请联系站点管理员。"}
		}
		return Account{}, "", &AuthError{Status: 503, Message: "访客模式暂时不可用，请稍后再试。"}
	}
	account, ok := Authenticate(accounts, username, password)
	if !ok {
		_ = s.Failures.RecordFailure(ctx, key)
		return Account{}, "", &AuthError{Status: 401, Message: "访客名或密码不正确。"}
	}
	proof := CreateVisitorProof(sessionNonce, s.Config.InternalToken, s.Now())
	if proof == "" {
		return Account{}, "", &AuthError{Status: 503, Message: "访客模式尚未就绪，请联系站点管理员。"}
	}
	_ = s.Failures.Clear(ctx, key)
	return account, proof, nil
}

func (s *Service) Apps() (map[string]App, error) {
	apps, err := LoadApps(s.Config.AppsDir)
	if err != nil {
		return nil, err
	}
	return apps, nil
}

func (s *Service) AuthorisedApp(ctx context.Context, username, appID string) (Account, App, error) {
	account, err := s.FindAccount(ctx, username)
	if err != nil {
		return Account{}, App{}, err
	}
	apps, err := s.Apps()
	if err != nil {
		return Account{}, App{}, &AuthError{Status: 503, Message: "访客应用暂时不可用，请稍后再试。"}
	}
	app, ok := apps[appID]
	if !ok || !app.EntitledTo(account) {
		return Account{}, App{}, &AuthError{Status: 403, Message: "这个应用没有对你开放。"}
	}
	return account, app, nil
}

func NormalizeVisitorHeader(value string) string {
	return strings.TrimSpace(value)
}
