#!/usr/bin/env bash
#
# promote.sh — deploy a release of tapestry into this checkout (normally ~/apps/tapestry).
#
#   1. refuse if the checkout has local edits (prod is never edited by hand)
#   2. snapshot the login DB (accounts, sessions) (SQLite VACUUM INTO via node:sqlite in the container — no downtime)
#   3. fetch from origin and check out the requested ref (detached)
#   4. rebuild + recreate the container
#   5. wait for /readyz; on failure print the rollback command
#
# Usage:  scripts/promote.sh [--ref <tag|branch|sha>]   (default: newest tag)

set -Eeuo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

REF=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --ref) REF="$2"; shift 2 ;;
    -h|--help) sed -n '3,12p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

[[ -f .env ]] || { echo "FATAL: no .env in $PWD" >&2; exit 1; }
set -a; # shellcheck disable=SC1091
source ./.env; set +a
PORT="${TAPESTRY_PORT:-8205}"
DATA_DIR="${TAPESTRY_DATA_DIR:-./data}"
BACKUP_DIR="${TAPESTRY_BACKUP_DIR:-/data/backups/tapestry}"
SERVICE=app

if [[ -n "$(git status --porcelain)" ]]; then
  echo "FATAL: $PWD has local changes — commit them in the dev repo instead:" >&2
  git status --short >&2
  exit 1
fi

PREV="$(git rev-parse --short HEAD)"
git fetch --tags --prune origin
[[ -n "$REF" ]] || REF="$(git tag --sort=-v:refname | head -1)"
[[ -n "$REF" ]] || { echo "FATAL: no --ref given and no tags exist" >&2; exit 1; }
echo "▸ Promote tapestry: $PREV → $REF  (port $PORT, data $DATA_DIR)"

# node:sqlite one-liner: VACUUM INTO makes a consistent, compact copy of a live DB.
SNAPSHOT_JS='
const { DatabaseSync } = require("node:sqlite");
const [src, dst] = process.argv.slice(1);
const q = String.fromCharCode(39);
if (dst.includes(q)) throw new Error("bad snapshot path");
const d = new DatabaseSync(src);
d.exec("VACUUM INTO " + q + dst + q);
d.close();
const c = new DatabaseSync(dst, { readOnly: true });
const r = Object.values(c.prepare("PRAGMA integrity_check").get())[0];
c.close();
if (r !== "ok") { console.error("snapshot integrity_check failed:", r); process.exit(1); }
'

if [[ -f "$DATA_DIR/tapestry.db" ]]; then
  mkdir -p "$BACKUP_DIR"
  NAME="tapestry-$(date +%Y%m%d-%H%M%S)-$PREV.db"
  SNAP="$BACKUP_DIR/$NAME"
  if [[ -n "$(docker compose ps -q --status running "$SERVICE" 2>/dev/null)" ]]; then
    # hot backup inside the running container, then copy it out (owned by you)
    docker compose exec -T "$SERVICE" node -e "$SNAPSHOT_JS" /data/tapestry.db "/tmp/$NAME"
    docker compose cp "$SERVICE:/tmp/$NAME" "$SNAP"
    docker compose exec -T "$SERVICE" rm -f "/tmp/$NAME"
  else
    # not running: use the current image with the backup dir mounted
    docker compose run --rm --no-deps -T -v "$(cd "$BACKUP_DIR" && pwd):/backup" "$SERVICE" \
      node -e "$SNAPSHOT_JS" /data/tapestry.db "/backup/$NAME"
  fi
  echo "  snapshot: $SNAP"
  # keep the newest 10 snapshots
  ls -1t "$BACKUP_DIR"/tapestry-*.db 2>/dev/null | tail -n +11 | xargs -r rm -f
fi

git -c advice.detachedHead=false checkout --detach "$REF"
# scripts/compose.sh bakes in the version (git describe); refs older than it lack it
if [[ -x scripts/compose.sh ]]; then scripts/compose.sh up -d --build; else docker compose up -d --build; fi

# /readyz (standards §12): 200 ready, 503 not. Refs older than it have only
# /healthz (their /readyz is behind the sign-in, so neither 200 nor 503).
ready() {
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/readyz" 2>/dev/null || true)"
  [[ "$code" == 200 ]] && return 0
  [[ "$code" != 503 && "$code" != 000 ]] && curl -fsS -o /dev/null "http://127.0.0.1:$PORT/healthz" 2>/dev/null
}

for _ in $(seq 1 30); do
  if ready; then
    echo "✓ tapestry $REF is up on :$PORT"
    exit 0
  fi
  sleep 2
done
echo "✗ tapestry did not come ready on :$PORT. Roll back with:" >&2
echo "    scripts/promote.sh --ref $PREV" >&2
echo "  (DB snapshot, if taken: ${SNAP:-none})" >&2
exit 1
