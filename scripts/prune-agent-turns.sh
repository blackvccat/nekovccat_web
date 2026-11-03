#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${NEKO_ENV_FILE:-/etc/nekoweb/backend-go.env}"
RETENTION_DAYS="${AGENT_TURN_RETENTION_DAYS:-90}"
if ! [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  echo "AGENT_TURN_RETENTION_DAYS must be a non-negative integer" >&2
  exit 1
fi
if [ ! -r "$ENV_FILE" ]; then
  echo "cannot read $ENV_FILE" >&2
  exit 1
fi
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a
: "${DATABASE_URL:?DATABASE_URL is required}"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c \
  "DELETE FROM agent_turns WHERE created_at < now() - interval '${RETENTION_DAYS} days'"
