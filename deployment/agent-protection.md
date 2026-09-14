# Agent traffic protection

Normal visitors wait briefly when all model slots are occupied. Repeated requests from the same source are rejected before admission, and the waiting room has a fixed capacity. This protects model concurrency and request usage during a burst while preserving existing JSON and SSE protocols.

## Defaults

| Control | Default behavior |
| --- | --- |
| Public chat attempts | Up to 3 attempts per 10 seconds per source; overflow starts a quiet cooldown. Invalid sessions and malformed requests count as attempts. |
| Session endpoint | Up to 12 attempts per minute per source, with a separate cooldown. A valid existing signed session is reused. |
| Relationship unlock endpoint | Separate 3-attempt/10-second guard, plus the same bounded body reader. Successful chat replies can still submit their proof even when the chat attempt bucket is exhausted. |
| Executing requests | `CHAT_MAX_CONCURRENT=3` across the backend process. |
| Waiting requests | `CHAT_QUEUE_MAX_SIZE=12`, FIFO, with `CHAT_QUEUE_WAIT_SECONDS=8`. A full queue rejects immediately. |
| Per-source admission | One active or waiting request per source. Sending another request cannot reserve a second position. |
| Per-source executed attempts | `CHAT_IP_MINUTE_LIMIT=6`, `CHAT_IP_HOUR_LIMIT=30`, `CHAT_IP_DAILY_LIMIT=60`. |
| Whole-site executed attempts | `CHAT_DAILY_LIMIT=400` in a rolling 24-hour window. |

The trusted source is an IPv4 address or an IPv6 /64 network. IPv6 spelling variants and IPv4-mapped IPv6 normalize to the same identity. Visitors sharing a NAT or IPv6 /64 share these limits; an anonymous session cookie is not a separate person or an authorization to bypass limits.

The backend additionally bounds attempt tracking, request body size/read time and request admission work. Cooldowns and attempt state have finite capacity and expire. Requests rejected at these stages do not create model runtimes or consume the whole-site usage allowance.

## Queue and accounting

The client shows that it is waiting to connect and keeps its stop control available. Queue timeout or a full queue returns a readable error and `Retry-After`. The client does not automatically retry. The queue waits before sending response headers; it does not claim a live queue position or guarantee that a request will run.

Disconnecting or cancelling while waiting removes the request. Invalid bodies, duplicate active requests, queue rejection and queue timeout do not consume chat usage. The backend atomically rechecks persistent limits immediately before admitting execution, so several waiters cannot spend the same final allowance.

Once an attempt has been admitted to execution, it remains counted even if the model later fails, times out or is cancelled. Cancelling a running model call is not a way to obtain unlimited uncounted model work. Request counts are not token counts or a precise currency budget.

Usage is a rolling window, not a midnight reset. Quota errors use the relevant request expiry to report the next possible retry. Another visitor can consume a released whole-site allowance before a retry arrives. Refreshing, opening a new conversation, rotating cookies and restarting the application do not clear the SQLite usage history.

## Deployment and incident response

Keep exactly one frontend process and one backend worker for this deployment. Attempt guards and the FIFO queue are process-local; restarting clears that temporary state. SQLite usage remains persistent. Multiple instances need a shared admission service before scaling; shared SQLite alone does not share queue positions or in-memory cooldowns.

Expose only the frontend through the dedicated trusted Cloudflare Tunnel. Keep both services bound to loopback. `TRUST_CLOUDFLARE=true` is safe only when untrusted clients cannot directly reach the origin or inject `cf-connecting-ip` through another proxy. Neither `Forwarded` nor `X-Forwarded-For` grants an identity.

Keep quota data, credentials and private content outside the versioned release. Deploy both application services, verify `/api/health` and backend `/api/ready`, and run a normal authorized chat. Exercise flood/queue scenarios only against an isolated backend with a fake model, never the public paid model. Verify existing non-authorized relationship endpoints still return `403`. Preserve the previous release for rollback.

Application guards do not stop volumetric traffic from reaching Next.js. For sustained attacks, configure Cloudflare rate-limiting rules on the exact host and `/api/chat`, `/api/chat/`, `/api/chat/session`, and `/api/chat/relationship-unlock` paths, returning a rate-limit response before traffic reaches the tunnel. Verify the rule's events in Cloudflare rather than treating source-code changes as an enabled edge rule. An interactive HTML challenge on a streaming API cannot be completed by the current fetch client; use a page-level challenge or explicitly integrate a verified challenge flow if needed.

A distributed attacker with enough independent networks can still consume the global anonymous allowance slowly. Stronger protection requires an additional signal such as a server-verified challenge or authenticated user quota. Retain the global cap while assessing traffic. Do not clear the database or raise the cap merely to make a flood disappear: that grants new model usage to the same attackers.

Useful structured events include rejected admission codes, queue wait duration and active/waiting counts. Logs must not include chat content, cookies, model keys, raw addresses or private relationship material. A full quota alone does not identify an attacker; use timestamped application events and trusted edge request records to investigate.
