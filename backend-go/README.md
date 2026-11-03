# Nekoweb Go backend

Local-first Go implementation of the site backend. It speaks JSON-RPC to the
official DeepSeek Harness `dsh` runtime over stdio and keeps the existing
HTTP/SSE contract used by the Next.js frontend.

Open [`docs/architecture.html`](docs/architecture.html) in a browser for the
visual architecture, request lifecycle, cancellation flow, and code map.

This directory is an isolated prototype on `feat/go-backend`. It does not modify
`backend/`, `frontend/`, or `agent/`, and it is not ready for production.

## Local run

Requirements: Go 1.23+ and the existing macOS/Linux dsh runtime from
`backend/.venv`. The Go service does not run Python.

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

Point the frontend proxy at this service without changing frontend code:

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

The Go service reuses `work/deepseek-harness-home`,
`work/relationship-private.json`, `agent/website.patch.yml`, and
`agent/website-tools.mjs`. It creates random per-start patch files in the dsh
home and removes them on graceful shutdown.

`internal/agent/progressive_bridge.mjs` is a local copy of
`backend/app/services/progressive_bridge.mjs`. Keep them in sync until the
Python backend is removed.

## Tests

```bash
go test ./... -race
go vet ./...
```

The current local scope intentionally omits the production SQLite quota store,
FIFO admission, systemd units, Docker images, and runtime distribution. Those
remain in the Python reference until the Go service passes parity.

## Conventions

- All blocking work takes `context.Context`; no `context.Background()` in request paths.
- Return typed `agent.AgentError` for public HTTP errors; never expose provider diagnostics.
- Keep the JSON/SSE contract exact; do not add fields or reorder the v2 lifecycle.
- One dsh process per request. `Close` must be idempotent and must reap the process group.
- Tests use fake runtimes or an offline provider; do not require paid model calls.
