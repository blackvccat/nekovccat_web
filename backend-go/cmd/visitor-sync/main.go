package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"time"

	"nekoweb/backend-go/internal/config"
	"nekoweb/backend-go/internal/database"
	"nekoweb/backend-go/internal/visitor"
)

func main() {
	accountsPath := flag.String("accounts", "", "visitor accounts JSON (default VISITOR_ACCOUNTS_PATH)")
	flag.Parse()

	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	if !cfg.DatabaseEnabled {
		fmt.Fprintln(os.Stderr, "DATABASE_ENABLED must be true")
		os.Exit(1)
	}
	if *accountsPath != "" {
		cfg.VisitorAccountsPath = *accountsPath
	}
	accounts, err := visitor.LoadAccounts(cfg.VisitorAccountsPath)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	db, err := database.Open(ctx, cfg)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	defer db.Close()
	if err := db.SyncVisitorAccounts(ctx, accounts); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Printf("synced %d visitor accounts\n", len(accounts))
}
