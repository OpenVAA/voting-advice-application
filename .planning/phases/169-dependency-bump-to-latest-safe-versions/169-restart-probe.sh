#!/usr/bin/env bash
#
# 169-restart-probe.sh -- live proof that the frontend dev server restarts when the repo-root .env changes.
#
# Usage: bash .planning/phases/169-dependency-bump-to-latest-safe-versions/169-restart-probe.sh <label>
#
# Steps:
#   (a) refuses when anything listens on the probe port (PROBE_PORT, default 5199) (exit 5);
#   (b) starts `FRONTEND_PORT=<port> yarn workspace @openvaa/frontend dev` in its own process group, output to
#       tests/e2e-runs/169-gates/<label>-dev.log;
#   (c) waits up to 120 s for the server to report it is ready (Vite's "Local:" / "ready in" line);
#   (d) touches the repo-root .env (mtime only -- the file's contents are never read or printed);
#   (e) waits up to 60 s for "server restarted" (case-insensitive) in the log;
#   (f) kills the process group (also on any exit, via the EXIT trap).
#
# Exit: 0 restart seen; 1 no restart line within 60 s; 2 usage error; 3 server never became ready;
# 4 no repo-root .env to touch; 5 port already held.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT" || exit 2

LABEL="${1:-}"
if [ -z "$LABEL" ]; then
  echo "usage: $0 <label>" >&2
  exit 2
fi

PORT="${PROBE_PORT:-5199}"
LOG_DIR="$REPO_ROOT/tests/e2e-runs/169-gates"
LOG="$LOG_DIR/$LABEL-dev.log"
mkdir -p "$LOG_DIR"

if [ ! -f "$REPO_ROOT/.env" ]; then
  echo "no repo-root .env at $REPO_ROOT/.env" >&2
  exit 4
fi

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "port $PORT already has a listener; refusing" >&2
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >&2
  exit 5
fi

# Job control gives the background job its own process group, so one kill reaches yarn, node and vite.
set -m
DEV_PID=""
cleanup() {
  if [ -n "$DEV_PID" ]; then
    kill -TERM -- "-$DEV_PID" 2>/dev/null
    sleep 1
    kill -KILL -- "-$DEV_PID" 2>/dev/null
  fi
}
trap cleanup EXIT

: >"$LOG"
FRONTEND_PORT="$PORT" yarn workspace @openvaa/frontend dev >>"$LOG" 2>&1 &
DEV_PID=$!
echo "dev server pid/pgid $DEV_PID on port $PORT, log $LOG"

ready=0
for _ in $(seq 1 120); do
  if grep -Eqi 'Local:|ready in' "$LOG"; then
    ready=1
    break
  fi
  if ! kill -0 "$DEV_PID" 2>/dev/null; then
    break
  fi
  sleep 1
done
if [ "$ready" -ne 1 ]; then
  echo "dev server did not report ready within 120 s" >&2
  tail -20 "$LOG" >&2
  exit 3
fi
echo "ready: $(grep -Ei 'Local:|ready in' "$LOG" | head -1)"

touch "$REPO_ROOT/.env"
echo "touched repo-root .env at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

for _ in $(seq 1 60); do
  if grep -qi 'server restarted' "$LOG"; then
    echo "restart seen: $(grep -i 'server restarted' "$LOG" | head -1)"
    exit 0
  fi
  sleep 1
done

echo "no 'server restarted' line within 60 s of touching the repo-root .env" >&2
tail -20 "$LOG" >&2
exit 1
