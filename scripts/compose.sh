#!/usr/bin/env bash
# `docker compose` for this checkout, with the version it builds baked into
# the image for the health endpoints (/healthz, /readyz).
#   scripts/compose.sh up -d --build
# The version is `git describe --tags --always --dirty` (a release tag such as
# v0.7.0, or v0.7.0-1-g9af513a a commit after it, -dirty with local changes).
# Also its commit (APP_COMMIT, `git rev-parse --short HEAD`) and build time
# (APP_BUILT_AT, ISO-8601 UTC). Values already set win. Plain `docker compose`
# still works; the version then falls back to package.json, and commit and
# builtAt are left out.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -z "${APP_VERSION:-}" ]; then
  APP_VERSION="$(git -C "$ROOT" describe --tags --always --dirty 2>/dev/null || true)"
  export APP_VERSION
fi
if [ -z "${APP_COMMIT:-}" ]; then
  APP_COMMIT="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || true)"
  export APP_COMMIT
fi
if [ -z "${APP_BUILT_AT:-}" ]; then
  APP_BUILT_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  export APP_BUILT_AT
fi
cd "$ROOT"
exec docker compose "$@"
