#!/usr/bin/env bash
# wait-for-healthy.sh — Blocks until local Supabase (:54321) + Vite dev (:5173) respond.
# Used by the Phase 59 baseline capture (D-59-03) and by the post-swap parity run (Plan 05).
# Exits 0 when both services are live; exits 1 on timeout with the endpoint that failed named.
#
# Usage:
#   ./wait-for-healthy.sh [--supabase-url URL] [--frontend-url URL] [--timeout-seconds N]
# Defaults:
#   --supabase-url http://127.0.0.1:54321
#   --frontend-url http://localhost:5173
#   --timeout-seconds 120

set -euo pipefail

SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
TIMEOUT_SECONDS=120

while [[ $# -gt 0 ]]; do
  case "$1" in
    --supabase-url) SUPABASE_URL="$2"; shift 2 ;;
    --frontend-url) FRONTEND_URL="$2"; shift 2 ;;
    --timeout-seconds) TIMEOUT_SECONDS="$2"; shift 2 ;;
    *) echo "unknown flag: $1" >&2; exit 2 ;;
  esac
done

check_supabase() {
  curl -sSf -o /dev/null -m 2 "${SUPABASE_URL}/auth/v1/health"
}

check_frontend() {
  curl -sSfI -o /dev/null -m 2 "${FRONTEND_URL}/"
}

elapsed=0
while (( elapsed < TIMEOUT_SECONDS )); do
  if check_supabase && check_frontend; then
    echo "healthy: supabase=${SUPABASE_URL} frontend=${FRONTEND_URL} after ${elapsed}s"
    exit 0
  fi
  sleep 1
  elapsed=$((elapsed + 1))
done

echo "ERROR: wait-for-healthy.sh timed out after ${TIMEOUT_SECONDS}s" >&2
if ! check_supabase; then
  echo "  - Supabase unreachable at ${SUPABASE_URL}/auth/v1/health — is 'yarn dev:reset && yarn dev' running?" >&2
fi
if ! check_frontend; then
  echo "  - Frontend unreachable at ${FRONTEND_URL}/ — is 'yarn dev' running?" >&2
fi
exit 1
