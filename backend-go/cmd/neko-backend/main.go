package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"nekoweb/backend-go/internal/agent"
	"nekoweb/backend-go/internal/api"
	"nekoweb/backend-go/internal/config"
	"nekoweb/backend-go/internal/database"
	"nekoweb/backend-go/internal/observability"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("configuration failed", "error", err)
		os.Exit(1)
	}
	logger := observability.NewLogger()
	db, err := database.Open(context.Background(), cfg)
	if err != nil {
		logger.Error("database unavailable", "error", err)
		db = nil
	}
	manager := agent.NewManager(cfg, logger)
	go func() {
		if !manager.Initialize(context.Background()) {
			logger.Error("agent configuration unavailable")
		}
	}()

	apiServer := api.NewServer(cfg, manager, logger, db)
	server := &http.Server{
		Addr:              cfg.Addr(),
		Handler:           apiServer.Handler(),
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       120 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}

	shutdownSignal := make(chan os.Signal, 1)
	signal.Notify(shutdownSignal, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-shutdownSignal
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		_ = server.Shutdown(ctx)
	}()

	logger.Info("backend listening", "addr", cfg.Addr(), "environment", cfg.Environment)
	serveErr := server.ListenAndServe()
	if serveErr != nil && !errors.Is(serveErr, http.ErrServerClosed) {
		logger.Error("server failed", "error", serveErr)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	manager.Shutdown(ctx)
	apiServer.Close()
	if db != nil {
		db.Close()
	}
	cancel()
	if serveErr != nil && !errors.Is(serveErr, http.ErrServerClosed) {
		os.Exit(1)
	}
}
