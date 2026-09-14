# Production deployment

The production site requires a Next.js server and the FastAPI / DeepSeek Harness backend. GitHub Pages and other static-only hosts cannot run its API routes or protected relationship endpoints.

## Public repository boundary

Commit application source, tests, public assets, dependency lockfiles, systemd templates, and environment variable examples. Never commit real `.env` files, model credentials, internal tokens, SSH material, tunnel credentials, private relationship JSON, the protected wallpaper, raw resume material, logs, runtime databases, build outputs, or release archives.

Keep the following production-only files outside the checkout with owner-only permissions:

- Backend and frontend environment files containing the shared internal token.
- Tunnel or reverse-proxy credentials.
- The private relationship JSON and protected wallpaper.
- Harness runtime state and rate-limit database.

The repository `.gitignore` blocks the common local forms of these files. Always inspect `git diff --cached` and run a secret scan before pushing.

## Layout

Use a versioned release directory and switch a stable `current` symlink only after the build succeeds. Install the files in `deployment/` as templates and adjust users, paths, ports, and environment-file locations for the target host.

Run the frontend and backend as dedicated non-root users. Bind both services to loopback and expose only the frontend through a trusted HTTPS reverse proxy or managed tunnel. The backend must accept chat requests only from the frontend through a long random `INTERNAL_API_TOKEN` shared by their server-only environment files.

## Build

Requirements: Node.js 20.9 or newer and Python 3.11 or 3.12.

```bash
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
cd frontend
npm ci
NEXT_TELEMETRY_DISABLED=1 npm run build
mkdir -p .next/standalone/public .next/standalone/.next/static
cp -R public/. .next/standalone/public/
cp -R .next/static/. .next/standalone/.next/static/
```

Set `PYTHON_API_URL` to the loopback FastAPI endpoint. Set `SITE_ORIGIN` to the exact public HTTPS origin and enable trusted-proxy handling only when requests can reach the app exclusively through that proxy. Do not place a model key or internal token in any `NEXT_PUBLIC_*` variable.

## Private relationship data

Create the relationship JSON and wallpaper directly on the server outside the release directory. Point `RELATIONSHIP_PRIVATE_PATH` and `RELATIONSHIP_WALLPAPER_PATH` at those files. The service user needs read access; other users should have no access. These files must never be copied into `frontend/public`, `.next/static`, a release archive, or Git.

## Verification

Before switching the current release, run the repository tests and type checks. After the services restart, verify:

```bash
curl -fsS http://127.0.0.1:<backend-port>/health
curl -fsS http://127.0.0.1:<frontend-port>/api/health
curl -fI https://<public-host>/my-world
curl -I https://<public-host>/api/relationship/content
curl -I https://<public-host>/api/relationship/wallpaper
```

Both unauthenticated relationship requests must return `403`. Confirm HTTPS without bypassing certificate checks, then verify a real Agent conversation and the complete authorized relationship flow in a fresh browser session.

Rollback by switching the stable symlink to a previously verified release and restarting only this project's frontend and backend services. Do not modify unrelated sites, tunnels, firewall rules, or game services.

## Performance release verification

Build each release in its own directory. Keep credentials, private content, quota state, and Harness state at their existing external locations. Reuse the installed toolchain, and verify lockfiles before reusing a copy of dependencies. Never copy a developer `.env.local`, virtual environment, or local `.next` build from macOS to the Linux release.

Run all frontend tests with `npx tsx --test tests/*.test.ts`, the backend unittest suite, the agent tests, and the production build. The backend tests use synthetic private fixtures and do not require personal files or paid model requests. A second release can be checked on loopback ports 3011/8011 before changing `current`; use the same systemd environment files and explicit alternate ports, with the candidate backend's patch path.

For progressive replies, include `backend/app/services/progressive_bridge.mjs` and run `node --test backend/tests/*.test.mjs` from the repository root. The Python suite also runs the pinned SDK against an offline streaming provider and requires the first delta before the provider is allowed to finish. New clients negotiate `protocol=v2` through the frontend proxy; old requests retain the append-only protocol. In the public smoke test, verify multiple `reply/delta` events arrive before `reply/final` and `done`, then confirm the final text is not duplicated. Runtime upgrades require rerunning the bridge and real-SDK tests on the target OS.

Before and after changing `current`, check frontend `/api/health`, backend `/health` and `/api/ready`, and unauthorized relationship content and wallpaper (`403`). Complete one real chat through the public origin and check SSE completion plus the request ID. Keep the previous release intact for rollback. Request logs distinguish runtime startup, first text, completion and cleanup; readiness alone does not verify the model provider.

The frontend proxy defaults to a 215-second overall deadline, 15 seconds for streaming response headers, and 45 seconds of stream inactivity. The backend defaults to 180 seconds per turn, a 15-second heartbeat, and 10 seconds per ASGI send. Admission may wait up to 8 seconds before response headers. If changing these budgets, keep the proxy header deadline above admission plus quota storage time, and the overall deadline above admission, model execution and cleanup. Explicit environment settings override the defaults, so update an existing `CHAT_PROXY_TIMEOUT_MS=200000` when deploying this protection. Settings and tool templates are cached until backend restart.

Keep one backend worker: SQLite quotas are atomic across connections, but active-request slots are process-local. Runtime pooling and multiple hosts require separate capacity and isolation validation.

## Agent traffic protection

See [agent-protection.md](agent-protection.md) for admission limits, quota accounting, attack handling and the Cloudflare boundary. Deploy frontend and backend together: the frontend normalizes trusted client addresses and rejects abusive traffic before reading a body, while the backend owns the bounded queue and persistent usage counters. Keep the existing quota database; a release must not clear already-consumed usage.
