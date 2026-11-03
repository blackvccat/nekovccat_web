#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${OUT:-$ROOT/dist/nekoweb-go}"
GO="${GO:-go}"
GOOS="${GOOS:-linux}"
GOARCH="${GOARCH:-amd64}"

mkdir -p "$OUT/backend-go/internal/agent" "$OUT/agent"

(
  cd "$ROOT/backend-go"
  for cmd in neko-backend visitor-sync visitor-hash; do
    CGO_ENABLED=0 GOOS="$GOOS" GOARCH="$GOARCH" "$GO" build \
      -trimpath -ldflags="-s -w" \
      -o "$OUT/backend-go/$cmd" "./cmd/$cmd"
  done
)

cp "$ROOT/agent/website.patch.yml" "$OUT/agent/website.patch.yml"
cp "$ROOT/agent/website-tools.mjs" "$OUT/agent/website-tools.mjs"
cp "$ROOT/backend-go/internal/agent/progressive_bridge.mjs" \
   "$OUT/backend-go/internal/agent/progressive_bridge.mjs"

echo "Go release staged at $OUT"
echo "Build frontend separately, then copy public/ and .next/static into .next/standalone."
