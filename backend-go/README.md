# Nekoweb Go backend

Production Go control plane for the site backend. It speaks JSON-RPC to the
official DeepSeek Harness `dsh` runtime over stdio and keeps the existing
HTTP/SSE contract used by the Next.js frontend.

Open [`docs/architecture.html`](docs/architecture.html) in a browser for the
visual architecture, request lifecycle, cancellation flow, and code map.

The Python FastAPI backend remains in `backend/` as a rollback and protocol
reference. The Neko desktop visitor entry, login UI, Next `/api/visitor` proxy,
and iframe app host are implemented.

## Local run

Requirements: Go 1.26+ and the macOS/Linux dsh runtime. `backend/.venv` is
only a local fallback for locating the runtime; production uses
`/srv/nekoweb/tools/dsh` via `DSH_BIN`. The Go service does not run Python.

On this checkout the local toolchain can be used without changing the system
PATH:

```bash
export PATH="$PWD/../work/toolchain/go/bin:$PATH"
```

```bash
cd backend-go

NEKO_ENV_FILE=../backend/.env \
NEKO_ROOT=.. \
PORT=8011 \
ENVIRONMENT=development \
DSH_BIN=../backend/.venv/lib/python3.12/site-packages/deepseek_harness_runtime/runtime/deepseek-harness-sdk-runtime-macos-arm64 \
go run ./cmd/neko-backend
```

`DSH_BIN` is auto-detected from `backend/.venv` when omitted. `NEKO_ROOT`
defaults to the nearest parent containing `agent/website.patch.yml`.

Point the frontend proxy at this service:

```bash
cd frontend
PYTHON_API_URL=http://127.0.0.1:8011 \
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3011 \
npm run dev -- --hostname 127.0.0.1 --port 3011
```

## Endpoints

- `GET /health`, `GET /api/health`
- `GET /api/ready`
- `POST /api/chat/` (JSON)
- `POST /api/chat/?stream=true` (legacy SSE)
- `POST /api/chat/?stream=true&protocol=v2` (progressive SSE)

Visitor backend (ported from `MK`; the Neko desktop entry and Next proxy are
wired):

- `POST /api/visitor/login`
- `GET /api/visitor/apps`
- `GET /api/visitor/apps/{id}/shell`
- `GET /api/visitor/apps/{id}/assets/{kind}`
- `GET|PUT|DELETE /api/visitor/apps/{id}/data[/{key}]`
- `GET|PUT|DELETE /api/visitor/apps/{id}/files[/{name}]`
- `GET /api/visitor/apps/{id}/{assetPath...}`

Visitor routes trust `X-Neko-Visitor` and `X-Neko-Session-ID` from the Next
proxy; in production they also require the shared `X-Neko-Internal-Token`.

The Go service reuses `work/deepseek-harness-home`,
`work/relationship-private.json`, `agent/website.patch.yml`, and
`agent/website-tools.mjs`. It creates random per-start patch files in the dsh
home and removes them on graceful shutdown.

`internal/agent/progressive_bridge.mjs` is a local copy of
`backend/app/services/progressive_bridge.mjs`. Keep them in sync until the
Python backend is removed.

## Visitor mode

Visitor accounts are PBKDF2-SHA256 only. The source of truth can be the local
JSON file and/or PostgreSQL; duplicate usernames fail closed.

Local defaults are shown below; production paths are in
`deployment/backend-go.env.example`.

- Accounts: `work/visitor-accounts.json`
- Apps: `work/visitor-apps/<id>/app.json`
- App data: `work/visitor-app-data.sqlite`
- Uploaded files: `work/visitor-app-files/`
- Login failure lockout: `work/visitor-login-failures.sqlite`

Useful commands:

```bash
# Hash a password from stdin, never echo the plaintext into a file.
printf 'your-password\n' | go run ./cmd/visitor-hash

# Upsert the JSON accounts into PostgreSQL (DATABASE_ENABLED=true).
go run ./cmd/visitor-sync -accounts ../work/visitor-accounts.json
```

## PostgreSQL (pgdata)

Users and Agent interactions live in PostgreSQL. Chat quotas, FIFO admission,
global slots, and burst cooldowns live in Redis. Visitor app data/files and
login failure counters stay in their local operational stores.

```dotenv
DATABASE_ENABLED=true
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/nekovccat_app
DATABASE_MAX_CONNS=5
```

Migrations are embedded and run on startup. The business tables are documented
in [`docs/database.md`](docs/database.md): `visitor_accounts`,
`visitor_account_apps`, `agent_conversations`, `agent_turns`, and
`schema_migrations`. Chat content is stored only as the final user/assistant
turn; intermediate deltas and tool arguments are never persisted.

## Redis rate-limit cache

Rolling chat quotas are shared through Redis when enabled. Production requires
Redis; local development falls back to a process-local memory quota when
`REDIS_ENABLED=false`.

```dotenv
REDIS_ENABLED=true
REDIS_URL=redis://127.0.0.1:6379/0
REDIS_PREFIX=neko:
REDIS_TIMEOUT_MS=500
```

Redis holds the shared FIFO waiting room, global concurrency slot, rolling quota,
and burst-attempt cooldown, so multiple backend instances share the same
admission state.

## Tests

```bash
go test ./... -race
go vet ./...
```

Production deployment uses Redis-backed FIFO admission and rolling quotas,
PostgreSQL persistence, systemd units, embedded migrations, and daily backups.
Remaining limitations: Docker images are not built, and the dsh runtime binary
is provisioned by the release script rather than embedded in the Go binary.

## Conventions

- All blocking work takes `context.Context`; no `context.Background()` in request paths.
- Return typed `agent.AgentError` for public HTTP errors; never expose provider diagnostics.
- Keep the JSON/SSE contract exact; do not add fields or reorder the v2 lifecycle.
- One dsh process per request. `Close` must be idempotent and must reap the process group.
- Tests use fake runtimes or an offline provider; do not require paid model calls.
