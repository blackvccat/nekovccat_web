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
