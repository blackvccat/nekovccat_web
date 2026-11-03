package visitor

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

const (
	AppAPIVersion = 1
	MaxApps       = 32
	ManifestFile  = "app.json"
	AssetsDirName = "assets"
)

var (
	ErrAppsUnavailable = errors.New("访客应用尚未配置，请联系站点管理员。")
	ErrAppsInvalid     = errors.New("访客应用配置无效，请联系站点管理员。")
	assetFilePattern   = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`)
	embedOriginPattern = regexp.MustCompile(`^https://[A-Za-z0-9.-]{1,253}$`)
)

var mediaTypes = map[string]string{
	".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png",
	".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
	".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
	".json": "application/json", ".html": "text/html", ".txt": "text/plain",
	".map": "application/json", ".woff2": "font/woff2", ".woff": "font/woff",
	".ico": "image/x-icon", ".mp3": "audio/mpeg", ".mp4": "video/mp4", ".pdf": "application/pdf",
}

type Window struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

type App struct {
	ID          string
	Title       string
	Subtitle    string
	Icon        string
	Wallpaper   string
	Watermark   string
	Entry       string
	Embeds      []string
	Permissions map[string]bool
	Width       int
	Height      int
}

type Metadata struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	Subtitle     string `json:"subtitle"`
	Watermark    string `json:"watermark"`
	HasIcon      bool   `json:"hasIcon"`
	HasWallpaper bool   `json:"hasWallpaper"`
	Window       Window `json:"window"`
}

func (a App) Metadata() Metadata {
	return Metadata{
		ID: a.ID, Title: a.Title, Subtitle: a.Subtitle, Watermark: a.Watermark,
		HasIcon: a.Icon != "", HasWallpaper: a.Wallpaper != "",
		Window: Window{Width: a.Width, Height: a.Height},
	}
}

func (a App) HasPermission(permission string) bool { return a.Permissions[permission] }

func (a App) EntitledTo(account Account) bool {
	for _, id := range account.Apps {
		if id == a.ID {
			return true
		}
	}
	return false
}

type manifest struct {
	APIVersion  int      `json:"apiVersion"`
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Subtitle    string   `json:"subtitle"`
	Icon        *string  `json:"icon"`
	Wallpaper   *string  `json:"wallpaper"`
	Watermark   *string  `json:"watermark"`
	Window      *Window  `json:"window"`
	Entry       string   `json:"entry"`
	Embeds      []string `json:"embeds"`
	Permissions []string `json:"permissions"`
}

func LoadApps(dir string) (map[string]App, error) {
	info, err := os.Stat(dir)
	if err != nil || !info.IsDir() {
		return nil, ErrAppsUnavailable
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, ErrAppsUnavailable
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Name() < entries[j].Name() })
	apps := make(map[string]App)
	for _, entry := range entries {
		name := entry.Name()
		if !entry.IsDir() || strings.HasPrefix(name, ".") || strings.HasPrefix(name, "_") {
			continue
		}
		data, err := os.ReadFile(filepath.Join(dir, name, ManifestFile))
		if err != nil {
			return nil, ErrAppsInvalid
		}
		var version struct {
			APIVersion int `json:"apiVersion"`
		}
		if err := json.Unmarshal(data, &version); err != nil {
			return nil, ErrAppsInvalid
		}
		if version.APIVersion != AppAPIVersion {
			continue
		}
		app, err := parseManifest(data, name)
		if err != nil {
			return nil, err
		}
		if _, exists := apps[app.ID]; exists {
			return nil, ErrAppsInvalid
		}
		apps[app.ID] = app
		if len(apps) > MaxApps {
			return nil, ErrAppsInvalid
		}
	}
	return apps, nil
}

func parseManifest(data []byte, folder string) (App, error) {
	var raw manifest
	decoder := json.NewDecoder(strings.NewReader(string(data)))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&raw); err != nil {
		return App{}, ErrAppsInvalid
	}
	if raw.APIVersion != AppAPIVersion || raw.ID != folder || !appIDPattern.MatchString(raw.ID) {
		return App{}, ErrAppsInvalid
	}
	title := strings.TrimSpace(raw.Title)
	if title == "" || len(title) > 120 || len(strings.TrimSpace(raw.Subtitle)) > 200 || len(strings.TrimSpace(raw.WatermarkString())) > 120 {
		return App{}, ErrAppsInvalid
	}
	if raw.Icon != nil && !assetFilePattern.MatchString(*raw.Icon) {
		return App{}, ErrAppsInvalid
	}
	if raw.Wallpaper != nil && !assetFilePattern.MatchString(*raw.Wallpaper) {
		return App{}, ErrAppsInvalid
	}
	if !assetFilePattern.MatchString(raw.Entry) || !strings.HasSuffix(strings.ToLower(raw.Entry), ".html") {
		return App{}, ErrAppsInvalid
	}
	if len(raw.Embeds) > 12 {
		return App{}, ErrAppsInvalid
	}
	embeds := make([]string, 0, len(raw.Embeds))
	for _, origin := range raw.Embeds {
		if !embedOriginPattern.MatchString(origin) {
			return App{}, ErrAppsInvalid
		}
		embeds = append(embeds, origin)
	}
	permissions := map[string]bool{}
	for _, permission := range raw.Permissions {
		if permission != "files" && permission != "data" {
			return App{}, ErrAppsInvalid
		}
		permissions[permission] = true
	}
	width, height := 560, 580
	if raw.Window != nil {
		if raw.Window.Width < 320 || raw.Window.Width > 1600 || raw.Window.Height < 320 || raw.Window.Height > 1200 {
			return App{}, ErrAppsInvalid
		}
		width, height = raw.Window.Width, raw.Window.Height
	}
	app := App{
		ID: raw.ID, Title: title, Subtitle: strings.TrimSpace(raw.Subtitle),
		Watermark: strings.TrimSpace(raw.WatermarkString()), Entry: raw.Entry,
		Embeds: embeds, Permissions: permissions, Width: width, Height: height,
	}
	if raw.Icon != nil {
		app.Icon = *raw.Icon
	}
	if raw.Wallpaper != nil {
		app.Wallpaper = *raw.Wallpaper
	}
	return app, nil
}

func (m manifest) WatermarkString() string {
	if m.Watermark == nil {
		return ""
	}
	return *m.Watermark
}

func appDir(base, appID string) (string, error) {
	if !appIDPattern.MatchString(appID) {
		return "", ErrAppsInvalid
	}
	root, err := filepath.Abs(base)
	if err != nil {
		return "", ErrAppsInvalid
	}
	dir := filepath.Join(root, appID)
	if filepath.Dir(dir) != root {
		return "", ErrAppsInvalid
	}
	return dir, nil
}

func EntryFile(base string, app App) (string, error) {
	dir, err := appDir(base, app.ID)
	if err != nil {
		return "", err
	}
	candidate := filepath.Join(dir, app.Entry)
	if filepath.Dir(candidate) != dir {
		return "", fmt.Errorf("invalid entry")
	}
	info, err := os.Stat(candidate)
	if err != nil || info.IsDir() {
		return "", fmt.Errorf("entry unavailable")
	}
	return candidate, nil
}

func StaticFile(base string, app App, relative string) (string, error) {
	dir, err := appDir(base, app.ID)
	if err != nil {
		return "", err
	}
	parts := strings.Split(relative, "/")
	cleaned := make([]string, 0, len(parts))
	for _, part := range parts {
		if part == "" || part == "." || part == ".." {
			continue
		}
		cleaned = append(cleaned, part)
	}
	if len(cleaned) == 0 {
		return "", fmt.Errorf("file unavailable")
	}
	candidate := filepath.Join(append([]string{dir}, cleaned...)...)
	resolved, err := filepath.Abs(candidate)
	if err != nil || !strings.HasPrefix(resolved, dir+string(os.PathSeparator)) {
		return "", fmt.Errorf("file unavailable")
	}
	if filepath.Base(resolved) == ManifestFile {
		return "", fmt.Errorf("file unavailable")
	}
	info, err := os.Stat(resolved)
	if err != nil || info.IsDir() {
		return "", fmt.Errorf("file unavailable")
	}
	return resolved, nil
}

func AssetFile(base string, app App, kind string) (string, error) {
	var name string
	switch kind {
	case "icon":
		name = app.Icon
	case "wallpaper":
		name = app.Wallpaper
	default:
		return "", fmt.Errorf("asset unavailable")
	}
	if name == "" || !assetFilePattern.MatchString(name) {
		return "", fmt.Errorf("asset unavailable")
	}
	dir, err := appDir(base, app.ID)
	if err != nil {
		return "", err
	}
	assets := filepath.Join(dir, AssetsDirName)
	candidate := filepath.Join(assets, name)
	if filepath.Dir(candidate) != assets {
		return "", fmt.Errorf("asset unavailable")
	}
	info, err := os.Stat(candidate)
	if err != nil || info.IsDir() {
		return "", fmt.Errorf("asset unavailable")
	}
	return candidate, nil
}

func MediaType(path string) string {
	if value, ok := mediaTypes[strings.ToLower(filepath.Ext(path))]; ok {
		return value
	}
	return "application/octet-stream"
}
