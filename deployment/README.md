# Production deployment

The production site requires a Next.js server and the FastAPI / DeepSeek Harness backend. GitHub Pages and other static-only hosts cannot run its API routes or the protected visitor endpoints.

## Public repository boundary

Commit application source, tests, public assets, dependency lockfiles, systemd templates, and environment variable examples. Never commit real `.env` files, model credentials, internal tokens, SSH material, tunnel credentials, private relationship JSON, the protected wallpaper, raw resume material, logs, runtime databases, build outputs, or release archives.

Keep the following production-only files outside the checkout with owner-only permissions:

- Backend and frontend environment files containing the shared internal token.
- Tunnel or reverse-proxy credentials.
- The visitor account list (or database credentials), the private content JSON, and the protected wallpaper.
- Harness runtime state and rate-limit database.

The repository `.gitignore` blocks the common local forms of these files. Always inspect `git diff --cached` and run a secret scan before pushing.

Same-host prerequisites: Node.js 20.9 or newer and Python 3.11 or 3.12 (see Build), plus outbound access to the model API and to the package registries. Build the frontend on a Linux machine — or cross-build it and ship only the artifact, which is what a small host requires.

## Layout

Use a versioned release directory and switch a stable `current` symlink only after the build succeeds. Install the files in `deployment/` as templates and adjust users, paths, ports, and environment-file locations for the target host.

Day-to-day operation: restart both services after any code or environment change, and roll back by switching the `current` symlink back to the previous release and restarting them. Keep the credentials outside the release directory (see the boundary list above).

Known gaps: the agent-side items and the backend rate-limit / anti-bypass fixes identified when comparing this line against the other branch are not all adopted. Two decisions remain open — the per-identity daily cap value, and whether to adopt the progressive reply protocol.

Run the frontend and backend as dedicated non-root users. Bind both services to loopback and expose only the frontend through a trusted HTTPS reverse proxy or managed tunnel — either the host's own nginx (`nginx-example.com.conf` has the location list and `nginx-marcusweb-proxy.conf` the shared proxy headers) or a Cloudflare tunnel. The backend must accept chat requests only from the frontend through a long random `INTERNAL_API_TOKEN` shared by their server-only environment files.

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

Set `PYTHON_API_URL` to the loopback FastAPI endpoint. Set `SITE_ORIGIN` to the exact public HTTPS origin — scheme and host only, never a path, because browser `Origin` headers carry no path and the same-origin check compares them literally; `CORS_ORIGINS` follows the same rule. Set `NEXT_PUBLIC_APP_URL` to the site's own address `https://example.com/terminal` **before building**, since `NEXT_PUBLIC_*` values are compiled into the bundle. The desktop lives at `/terminal` and the domain root belongs to the main site, so the reverse proxy or tunnel must forward `/terminal`, the app's API routes, and its asset paths (`/_next/*`, `/images/*`, `/icons-svg/*`, `/fonts/*`, `/favicon.ico`) to Next while leaving `/` with the main site. Enable exactly one trusted client-address mode — `TRUST_PROXY_IP` behind nginx (which rewrites `X-Real-IP`) or `TRUST_CLOUDFLARE` behind the tunnel — and only when requests can reach the app exclusively through that proxy; with neither set, every visitor shares a single rate-limit bucket. Do not place a model key or internal token in any `NEXT_PUBLIC_*` variable.

## Private visitor data

Everything visitors may see lives behind the backend: the account list (with each visitor's granted app ids), the app registry, and the private assets. Create them directly on the server outside the release directory and point `VISITOR_ACCOUNTS_PATH`, `VISITOR_APPS_PATH`, and `VISITOR_ASSETS_DIR` (all backend-side) at them — the frontend only holds a signed cookie and needs no private paths.

Manage accounts with `python scripts/add-visitor.py <name> --generate --apps <app-id>` (grants can be changed later with `--apps a,b` or `--apps none`); never edit plaintext passwords into the file. When the accounts should also live in MySQL or PostgreSQL, set `DATABASE_ENABLED=true` and `DATABASE_URL` (MySQL needs the `aiomysql` driver for the app and `PyMySQL` for the script — both in `requirements.txt`), then write rows directly with `--db` (it hashes the password itself: `add-visitor.py <name> --ask-password --apps <app-id> --db`, plus `--db --list/--disable/--enable/--remove`); the table `visitor_accounts` is created on startup. **Full detail — schema, the `--db` flag rules, adding apps — is in [DATABASE.md](./DATABASE.md).** Passwords are only ever stored as PBKDF2 hashes — keep it that way, because anything that can read the database (a same-host WordPress, a panel-exported `.sql`, a backup file) would otherwise hold every visitor's password. Both sources are read and merged, so the accounts in the JSON file keep working; a name present in both is refused rather than resolved, and a missing file simply means database-only.

New applications are added by extending `visitor-apps.json`: one entry of `{id, title, subtitle, view: [...], wallpaper?, watermark?}` per app, using the block types the backend validates (`heading`, `text`, `letter`, `counter`, `checklist`, `footer`, `link`, `image`, `notice`), plus an asset file in `VISITOR_ASSETS_DIR` if it needs a wallpaper or icon. Grant it to a visitor with `add-visitor.py <name> --apps <app-id>`.

The service user needs read access; other users should have no access. These files must never be copied into `frontend/public`, `.next/static`, a release archive, or Git.

## Verification

Before switching the current release, run the repository tests and type checks. After the services restart, verify:

```bash
curl -fsS http://127.0.0.1:<backend-port>/health
curl -fsS http://127.0.0.1:<frontend-port>/api/health
curl -fI https://<public-host>/terminal
curl -I https://<public-host>/api/visitor/status
curl -I https://<public-host>/api/visitor/app?app=<app-id>
curl -I https://<public-host>/api/visitor/asset?app=<app-id>&kind=wallpaper
curl -fsS "https://<public-host>/api/music/playlist?id=3778678&limit=50"   # 需要后端能出网访问 music.163.com
```

`/api/music/*` 只是把公开歌单的曲目列表转发出来（`/api/music` 与聊天、访客接口一样要求共享 token）。若服务器到 `music.163.com` 的出网被限制，这里会返回 503，前端只是不显示曲目列表，官方播放器本身照常工作。

The unauthenticated visitor requests must return `403`. Confirm HTTPS without bypassing certificate checks, then verify a real Agent conversation and one complete visitor login in a fresh browser session: wrong password `401`, rate limit `429`, correct password `200` + cookie, then a visitor page that lists only the granted apps, one app opening normally, and a second account that cannot open the first account's app.

Rollback by switching the stable symlink to a previously verified release and restarting only this project's frontend and backend services. Do not modify unrelated sites, tunnels, firewall rules, or game services.
