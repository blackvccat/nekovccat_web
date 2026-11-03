package api

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"strings"

	"nekoweb/backend-go/internal/visitor"
)

const (
	maxVisitorLoginBody = 16 * 1024
)

func (s *Server) registerVisitorRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/visitor/login", s.visitorLogin)
	mux.HandleFunc("GET /api/visitor/apps", s.visitorApps)
	mux.HandleFunc("GET /api/visitor/apps/{appID}/assets/{kind}", s.visitorAsset)
	mux.HandleFunc("GET /api/visitor/apps/{appID}/shell", s.visitorShell)
	mux.HandleFunc("GET /api/visitor/apps/{appID}/data", s.visitorDataList)
	mux.HandleFunc("PUT /api/visitor/apps/{appID}/data/{key}", s.visitorDataSet)
	mux.HandleFunc("DELETE /api/visitor/apps/{appID}/data/{key}", s.visitorDataDelete)
	mux.HandleFunc("GET /api/visitor/apps/{appID}/files", s.visitorFilesList)
	mux.HandleFunc("PUT /api/visitor/apps/{appID}/files/{name}", s.visitorFilePut)
	mux.HandleFunc("GET /api/visitor/apps/{appID}/files/{name}", s.visitorFileGet)
	mux.HandleFunc("DELETE /api/visitor/apps/{appID}/files/{name}", s.visitorFileDelete)
	mux.HandleFunc("GET /api/visitor/apps/{appID}/{assetPath...}", s.visitorStatic)
}

func (s *Server) visitorLogin(w http.ResponseWriter, r *http.Request) {
	if err := s.guardVisitorProxy(r); err != nil {
		writeProtectionError(w, err)
		return
	}
	body, err := readLimitedBody(w, r, maxVisitorLoginBody)
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	decoder := json.NewDecoder(strings.NewReader(string(body)))
	decoder.DisallowUnknownFields()
	var request struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := decoder.Decode(&request); err != nil || request.Username == "" || request.Password == "" {
		writeVisitorError(w, &apiError{Status: http.StatusUnprocessableEntity, Message: "访客名或密码格式无效。"})
		return
	}
	account, proof, err := s.visitor.Login(r.Context(), request.Username, request.Password, sessionNonce(r))
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	apps := account.Apps
	if apps == nil {
		apps = []string{}
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, http.StatusOK, map[string]any{
		"ok": true, "name": account.Name, "username": account.Username,
		"apps": apps, "proof": proof,
	})
}

func (s *Server) visitorApps(w http.ResponseWriter, r *http.Request) {
	if err := s.guardVisitorProxy(r); err != nil {
		writeProtectionError(w, err)
		return
	}
	account, err := s.visitor.FindAccount(r.Context(), visitorUsername(r))
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	apps, err := s.visitor.Apps()
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	metadata := make([]visitor.Metadata, 0, len(account.Apps))
	for _, appID := range account.Apps {
		if app, ok := apps[appID]; ok {
			metadata = append(metadata, app.Metadata())
		}
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, http.StatusOK, map[string]any{"name": account.Name, "apps": metadata})
}

func (s *Server) visitorAsset(w http.ResponseWriter, r *http.Request) {
	_, app, err := s.authorisedApp(r)
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	path, err := visitor.AssetFile(s.config.VisitorAppsDir, app, r.PathValue("kind"))
	if err != nil {
		writeVisitorError(w, &apiError{Status: http.StatusNotFound, Message: "素材不存在。"})
		return
	}
	s.serveVisitorFile(w, r, path, false)
}

func (s *Server) visitorShell(w http.ResponseWriter, r *http.Request) {
	_, app, err := s.authorisedApp(r)
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	path, err := visitor.EntryFile(s.config.VisitorAppsDir, app)
	if err != nil {
		writeVisitorError(w, &apiError{Status: http.StatusNotFound, Message: "应用界面暂时不可用。"})
		return
	}
	html, err := os.ReadFile(path)
	if err != nil {
		writeVisitorError(w, &apiError{Status: http.StatusNotFound, Message: "应用界面暂时不可用。"})
		return
	}
	frameSources := append([]string{"'self'"}, app.Embeds...)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "private, no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Content-Security-Policy", "frame-src "+strings.Join(frameSources, " ")+"; frame-ancestors 'self'")
	_, _ = w.Write(html)
}

func (s *Server) visitorDataList(w http.ResponseWriter, r *http.Request) {
	account, app, err := s.authorisedApp(r)
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	if !app.HasPermission("data") {
		writeVisitorError(w, &apiError{Status: http.StatusForbidden, Message: "这个应用没有申请该能力。"})
		return
	}
	data, err := s.visitor.Storage.DataAll(r.Context(), app.ID, account.Username)
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

func (s *Server) visitorDataSet(w http.ResponseWriter, r *http.Request) {
	account, app, err := s.authorisedApp(r)
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	if !app.HasPermission("data") {
		writeVisitorError(w, &apiError{Status: http.StatusForbidden, Message: "这个应用没有申请该能力。"})
		return
	}
	body, err := readLimitedBody(w, r, visitor.MaxValueBytes)
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	if !json.Valid(body) {
		writeVisitorError(w, &apiError{Status: http.StatusBadRequest, Message: "值必须是可序列化的 JSON。"})
		return
	}
	if err := s.visitor.Storage.DataSet(r.Context(), app.ID, account.Username, r.PathValue("key"), body); err != nil {
		writeVisitorError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (s *Server) visitorDataDelete(w http.ResponseWriter, r *http.Request) {
	account, app, err := s.authorisedApp(r)
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	if !app.HasPermission("data") {
		writeVisitorError(w, &apiError{Status: http.StatusForbidden, Message: "这个应用没有申请该能力。"})
		return
	}
	removed, err := s.visitor.Storage.DataDelete(r.Context(), app.ID, account.Username, r.PathValue("key"))
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	if !removed {
		writeVisitorError(w, &apiError{Status: http.StatusNotFound, Message: "这条数据不存在。"})
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, http.StatusOK, map[string]any{"removed": true})
}

func (s *Server) visitorFilesList(w http.ResponseWriter, r *http.Request) {
	account, app, err := s.authorisedApp(r)
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	if !app.HasPermission("files") {
		writeVisitorError(w, &apiError{Status: http.StatusForbidden, Message: "这个应用没有申请该能力。"})
		return
	}
	files, err := s.visitor.Storage.ListFiles(r.Context(), app.ID, account.Username)
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, http.StatusOK, map[string]any{"files": files})
}

func (s *Server) visitorFilePut(w http.ResponseWriter, r *http.Request) {
	account, app, err := s.authorisedApp(r)
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	if !app.HasPermission("files") {
		writeVisitorError(w, &apiError{Status: http.StatusForbidden, Message: "这个应用没有申请该能力。"})
		return
	}
	body, err := readLimitedBody(w, r, visitor.MaxFileBytes)
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	if len(body) == 0 {
		writeVisitorError(w, &apiError{Status: http.StatusBadRequest, Message: "空文件。"})
		return
	}
	saved, err := s.visitor.Storage.WriteFile(r.Context(), app.ID, account.Username, r.PathValue("name"), body)
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, http.StatusCreated, saved)
}

func (s *Server) visitorFileGet(w http.ResponseWriter, r *http.Request) {
	account, app, err := s.authorisedApp(r)
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	if !app.HasPermission("files") {
		writeVisitorError(w, &apiError{Status: http.StatusForbidden, Message: "这个应用没有申请该能力。"})
		return
	}
	path, err := s.visitor.Storage.FilePath(r.Context(), app.ID, account.Username, r.PathValue("name"))
	if err != nil {
		writeVisitorError(w, &apiError{Status: http.StatusNotFound, Message: "文件不存在。"})
		return
	}
	inline := r.URL.Query().Get("inline") == "1" || r.URL.Query().Get("inline") == "true"
	s.serveVisitorFile(w, r, path, !inline)
}

func (s *Server) visitorFileDelete(w http.ResponseWriter, r *http.Request) {
	account, app, err := s.authorisedApp(r)
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	if !app.HasPermission("files") {
		writeVisitorError(w, &apiError{Status: http.StatusForbidden, Message: "这个应用没有申请该能力。"})
		return
	}
	removed, err := s.visitor.Storage.DeleteFile(r.Context(), app.ID, account.Username, r.PathValue("name"))
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	if !removed {
		writeVisitorError(w, &apiError{Status: http.StatusNotFound, Message: "文件不存在。"})
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, http.StatusOK, map[string]any{"removed": true})
}

func (s *Server) visitorStatic(w http.ResponseWriter, r *http.Request) {
	_, app, err := s.authorisedApp(r)
	if err != nil {
		writeVisitorError(w, err)
		return
	}
	path, err := visitor.StaticFile(s.config.VisitorAppsDir, app, r.PathValue("assetPath"))
	if err != nil {
		writeVisitorError(w, &apiError{Status: http.StatusNotFound, Message: "文件不存在。"})
		return
	}
	s.serveVisitorFile(w, r, path, false)
}

func (s *Server) authorisedApp(r *http.Request) (visitor.Account, visitor.App, error) {
	if err := s.guardVisitorProxy(r); err != nil {
		return visitor.Account{}, visitor.App{}, err
	}
	return s.visitor.AuthorisedApp(r.Context(), visitorUsername(r), r.PathValue("appID"))
}

func (s *Server) serveVisitorFile(w http.ResponseWriter, r *http.Request, path string, attachment bool) {
	file, err := os.Open(path)
	if err != nil {
		writeVisitorError(w, &apiError{Status: http.StatusNotFound, Message: "文件不存在。"})
		return
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil || info.IsDir() {
		writeVisitorError(w, &apiError{Status: http.StatusNotFound, Message: "文件不存在。"})
		return
	}
	w.Header().Set("Content-Type", visitor.MediaType(path))
	w.Header().Set("Cache-Control", "private, no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	if attachment {
		w.Header().Set("Content-Disposition", "attachment; filename=\""+info.Name()+"\"")
	}
	http.ServeContent(w, r, info.Name(), info.ModTime(), file)
}

func (s *Server) guardVisitorProxy(r *http.Request) *apiError {
	if !s.config.Production() {
		return nil
	}
	if len(s.config.InternalAPIToken) < 32 {
		return &apiError{Status: http.StatusServiceUnavailable, Message: "站内 Agent 正在维护。", Code: "configuration"}
	}
	if !subtleCompare(r.Header.Get("X-Neko-Internal-Token"), s.config.InternalAPIToken) {
		return &apiError{Status: http.StatusForbidden, Message: "请通过本站 Agent 访问。", Code: "unauthorized"}
	}
	return nil
}

func readLimitedBody(w http.ResponseWriter, r *http.Request, limit int64) ([]byte, error) {
	if r.ContentLength > limit {
		return nil, &apiError{Status: http.StatusRequestEntityTooLarge, Message: "文件太大。"}
	}
	body := http.MaxBytesReader(w, r.Body, limit)
	data, err := io.ReadAll(body)
	if err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			return nil, &apiError{Status: http.StatusRequestEntityTooLarge, Message: "文件太大。"}
		}
		return nil, &apiError{Status: http.StatusBadRequest, Message: "请求体无效。"}
	}
	return data, nil
}

func writeVisitorError(w http.ResponseWriter, err error) {
	var authErr *visitor.AuthError
	if errors.As(err, &authErr) {
		if authErr.RetryAfter > 0 {
			w.Header().Set("Retry-After", intString(authErr.RetryAfter))
		}
		w.Header().Set("Cache-Control", "no-store")
		writeJSON(w, authErr.Status, map[string]any{"detail": authErr.Message})
		return
	}
	var storageErr *visitor.StorageError
	if errors.As(err, &storageErr) {
		writeJSON(w, storageErr.Status, map[string]any{"detail": storageErr.Message})
		return
	}
	var routeErr *apiError
	if errors.As(err, &routeErr) {
		writeJSON(w, routeErr.Status, map[string]any{"detail": routeErr.Message})
		return
	}
	switch {
	case errors.Is(err, visitor.ErrAppsUnavailable), errors.Is(err, visitor.ErrAccountsUnavailable):
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{"detail": "访客功能暂时不可用，请稍后再试。"})
	case errors.Is(err, visitor.ErrAccountsNotReady), errors.Is(err, visitor.ErrAccountsInvalid):
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{"detail": "访客模式尚未配置，请联系站点管理员。"})
	default:
		writeJSON(w, http.StatusInternalServerError, map[string]any{"detail": "服务器暂时不可用。"})
	}
}

func intString(value int) string {
	if value <= 0 {
		return "1"
	}
	var digits [20]byte
	i := len(digits)
	for value > 0 {
		i--
		digits[i] = byte('0' + value%10)
		value /= 10
	}
	return string(digits[i:])
}
