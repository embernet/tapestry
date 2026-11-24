#!/usr/bin/env bash
# `docker compose` for this checkout, with the version it builds baked into
# the image for the health endpoints (/healthz, /readyz).
#   scripts/compose.sh up -d --build
# The version is `git describe --tags --always --dirty` (a release tag such as
# v0.7.0, or v0.7.0-1-g9af513a a commit after it, -dirty with local changes).
# An APP_VERSION already set wins. Plain `docker compose` still works; the
# version then falls back to package.json.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -z "${APP_VERSION:-}" ]; then
  APP_VERSION="$(git -C "$ROOT" describe --tags --always --dirty 2>/dev/null || true)"
  export APP_VERSION
fi
cd "$ROOT"
exec docker compose "$@"
