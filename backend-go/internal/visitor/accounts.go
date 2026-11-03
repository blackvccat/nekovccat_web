package visitor

import (
	"crypto/pbkdf2"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"regexp"
	"strconv"
	"strings"

	"golang.org/x/text/cases"
	"golang.org/x/text/unicode/norm"
)

const (
	PBKDF2Scheme      = "pbkdf2_sha256"
	PBKDF2Iterations  = 600_000
	MinIterations     = 50_000
	MaxIterations     = 2_000_000
	MaxUsernameLength = 64
	MaxNameLength     = 64
	MaxPasswordLength = 200
	MaxAccountApps    = 32
)

var (
	ErrAccountsUnavailable = errors.New("访客名单暂时不可用，请稍后再试。")
	ErrAccountsInvalid     = errors.New("访客名单配置无效，请联系站点管理员。")
	ErrAccountsNotReady    = errors.New("访客模式尚未配置，请联系站点管理员。")
	appIDPattern           = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{0,31}$`)
)

const dummyHash = "pbkdf2_sha256$600000$wG4oAT/sGNnMKm5QPi3xyw==$3WQG449xA2aGAlsD0g3GdKu8wkaohHxIZnKd17ACtt8="

type Account struct {
	ID           string
	Username     string
	Name         string
	PasswordHash string
	Apps         []string
	Disabled     bool
}

func NormalizeUsername(value string) string {
	return cases.Fold().String(norm.NFKC.String(strings.TrimSpace(value)))
}

func ParseHash(stored string) (iterations int, salt, digest []byte, ok bool) {
	parts := strings.Split(stored, "$")
	if len(parts) != 4 || parts[0] != PBKDF2Scheme {
		return 0, nil, nil, false
	}
	parsed, err := strconv.Atoi(parts[1])
	if err != nil {
		return 0, nil, nil, false
	}
	iterations = parsed
	salt, err = base64.StdEncoding.DecodeString(parts[2])
	if err != nil || len(salt) == 0 {
		return 0, nil, nil, false
	}
	digest, err = base64.StdEncoding.DecodeString(parts[3])
	if err != nil || len(digest) != 32 {
		return 0, nil, nil, false
	}
	if iterations < MinIterations || iterations > MaxIterations {
		return 0, nil, nil, false
	}
	return iterations, salt, digest, true
}

func HashPassword(password string, iterations int, salt []byte) (string, error) {
	if password == "" {
		return "", errors.New("password must not be empty")
	}
	if iterations == 0 {
		iterations = PBKDF2Iterations
	}
	if len(salt) == 0 {
		salt = make([]byte, 16)
		if _, err := rand.Read(salt); err != nil {
			return "", err
		}
	}
	key, err := pbkdf2.Key(sha256.New, password, salt, iterations, 32)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s$%d$%s$%s", PBKDF2Scheme, iterations,
		base64.StdEncoding.EncodeToString(salt),
		base64.StdEncoding.EncodeToString(key)), nil
}

func VerifyPassword(password, stored string) bool {
	iterations, salt, expected, ok := ParseHash(stored)
	if !ok {
		return false
	}
	candidate, err := pbkdf2.Key(sha256.New, password, salt, iterations, len(expected))
	if err != nil {
		return false
	}
	return subtle.ConstantTimeCompare(candidate, expected) == 1
}

type rawAccount struct {
	Username     string          `json:"username"`
	Name         string          `json:"name"`
	PasswordHash string          `json:"password_hash"`
	Apps         json.RawMessage `json:"apps"`
	Disabled     bool            `json:"disabled"`
}

type accountDocument struct {
	Visitors []rawAccount `json:"visitors"`
}

func LoadAccounts(path string) (map[string]Account, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, ErrAccountsNotReady
		}
		return nil, ErrAccountsUnavailable
	}
	return ParseAccounts(data)
}

func ParseAccounts(data []byte) (map[string]Account, error) {
	var document accountDocument
	decoder := json.NewDecoder(strings.NewReader(string(data)))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&document); err != nil {
		return nil, ErrAccountsInvalid
	}
	accounts := make(map[string]Account)
	active := false
	for _, raw := range document.Visitors {
		key := NormalizeUsername(raw.Username)
		if key == "" || len(key) > MaxUsernameLength || strings.TrimSpace(raw.Name) == "" || len(strings.TrimSpace(raw.Name)) > MaxNameLength {
			return nil, ErrAccountsInvalid
		}
		if _, _, _, ok := ParseHash(raw.PasswordHash); !ok {
			return nil, ErrAccountsInvalid
		}
		apps, err := parseAppIDs(raw.Apps)
		if err != nil {
			return nil, err
		}
		if _, exists := accounts[key]; exists {
			return nil, ErrAccountsInvalid
		}
		accounts[key] = Account{
			Username:     key,
			Name:         strings.TrimSpace(raw.Name),
			PasswordHash: raw.PasswordHash,
			Apps:         apps,
			Disabled:     raw.Disabled,
		}
		if !raw.Disabled {
			active = true
		}
	}
	if !active {
		return nil, ErrAccountsNotReady
	}
	return accounts, nil
}

func parseAppIDs(raw json.RawMessage) ([]string, error) {
	if len(raw) == 0 || string(raw) == "null" {
		return nil, nil
	}
	var list []string
	if err := json.Unmarshal(raw, &list); err != nil {
		var text string
		if err := json.Unmarshal(raw, &text); err != nil {
			return nil, ErrAccountsInvalid
		}
		for _, item := range strings.Split(text, ",") {
			if item = strings.TrimSpace(item); item != "" {
				list = append(list, item)
			}
		}
	}
	ids := make([]string, 0, len(list))
	seen := map[string]bool{}
	for _, item := range list {
		if !appIDPattern.MatchString(item) || seen[item] {
			return nil, ErrAccountsInvalid
		}
		seen[item] = true
		ids = append(ids, item)
	}
	if len(ids) > MaxAccountApps {
		return nil, ErrAccountsInvalid
	}
	return ids, nil
}

func FindAccount(accounts map[string]Account, username string) (Account, bool) {
	if strings.TrimSpace(username) == "" || len(username) > MaxUsernameLength {
		return Account{}, false
	}
	account, ok := accounts[NormalizeUsername(username)]
	return account, ok
}

func Authenticate(accounts map[string]Account, username, password string) (Account, bool) {
	if len(username) > MaxUsernameLength || len(password) == 0 || len(password) > MaxPasswordLength {
		_ = VerifyPassword(password, dummyHash)
		return Account{}, false
	}
	account, ok := FindAccount(accounts, username)
	hash := dummyHash
	if ok {
		hash = account.PasswordHash
	}
	matched := VerifyPassword(password, hash)
	if !ok || account.Disabled || !matched {
		return Account{}, false
	}
	return account, true
}
