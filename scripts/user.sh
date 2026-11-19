#!/usr/bin/env bash
# Manage local accounts in this instance (dev or prod, whichever .env says).
#   scripts/user.sh add <username> ["Display Name"]   # prompts for the password
#   scripts/user.sh remove <username>
#   scripts/user.sh list
set -Eeuo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
tty=-T; [[ -t 0 ]] && tty=
exec docker compose exec $tty app node server/auth/cli.js /data/tapestry.db "$@"
