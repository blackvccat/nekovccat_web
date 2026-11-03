#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${NEKO_ENV_FILE:-/etc/nekoweb/backend-go.env}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/nekoweb}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

if [ ! -r "$ENV_FILE" ]; then
  echo "cannot read $ENV_FILE" >&2
  exit 1
fi
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a
: "${DATABASE_URL:?DATABASE_URL is required}"

install -d -m 0700 "$BACKUP_DIR"
stamp="$(date -u +%Y%m%d-%H%M%S)"
target="$BACKUP_DIR/nekovccat-$stamp.dump"
pg_dump --format=custom --no-owner --no-privileges --file="$target" "$DATABASE_URL"
chmod 0600 "$target"
find "$BACKUP_DIR" -type f -name 'nekovccat-*.dump' -mtime +"$RETENTION_DAYS" -delete
echo "backup: $target"
