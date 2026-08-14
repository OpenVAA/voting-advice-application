#!/usr/bin/env bash
#
# e2e-run.sh -- Perform exactly ONE preflight-confirmed E2E run and leave behind a
#               complete, machine-readable evidence directory (Phase 138, D-10/D-12).
#
# Usage:
#   tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/run-01
#   tests/scripts/e2e-run.sh --run-dir /abs/path/run-01 --project eperm07-term-trigger
#   FRONTEND_PORT=5273 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/run-01
#
#   --run-dir <path>   REQUIRED. Where every artifact for this run lands. A relative
#                      path is resolved against the REPO ROOT, never against $PWD, so
#                      the script behaves identically from any working directory.
#   --project <name>   OPTIONAL. Restrict the run to one Playwright project. With no
#                      --project the run is the full gate suite, invoked exactly as
#                      the root `test:e2e` script does (including --grep-invert @probe).
#
# Prerequisites:
#   - `yarn install` has run and Playwright browsers are installed
#     (`yarn playwright install`)
#   - Docker is running. This script starts Supabase itself, via `yarn db:reset`.
#   - NOTHING is already listening on $FRONTEND_PORT. This script SPAWNS AND OWNS its
#     own dev server; a surviving listener would either trip Vite's `strictPort` or,
#     worse, wildcard shadow-bind and serve a different checkout to the suite.
#
# The script automatically:
#   1. Neutralises the environment -- unsets the three EPERM07_ forcing knobs and CI --
#      and records the resulting retry/worker posture as evidence
#   2. Records provenance: UTC start timestamp, git HEAD, working-tree cleanliness
#   3. Runs `yarn db:reset` (which starts Supabase first)
#   4. POLLS REST + Storage for readiness and asserts the `public-assets` bucket is
#      listed -- `db:status` passing is NOT readiness
#   5. ASSERTS $FRONTEND_PORT has no listener, then spawns the frontend dev server with
#      its stdout+stderr redirected into the run directory as devserver.log (D-10), and
#      waits for the port to accept connections. It refuses to adopt a foreign listener,
#      and at teardown it kills only processes in its own spawned process group
#   6. Runs Playwright with per-run JSON and HTML reporter output
#   7. Captures the Phase-137 preflight verdict by counting its fixed failure headline
#      in the captured stdout
#   8. Tears the dev server down FROM A TRAP and asserts the port has no listener
#   9. Records the UTC end timestamp
#
# NEW CONVENTION: no shell script orchestrates E2E anywhere else in this repo -- the
# E2E entry points are npm scripts only (package.json "test:e2e"). Style follows
# apps/supabase/benchmarks/scripts/run-benchmarks.sh (shebang form, header block,
# `set -euo pipefail`, script-location-relative paths, "${VAR:-default}" env defaults).
#
# Plan 05's determinism batch LOOPS this script; it is deliberately a separate,
# independently testable unit that performs exactly one run.
#
# Exit codes -- the caller must be able to branch on the status alone:
#   0  the run completed and Playwright reported success
#   1  Playwright reported failures
#   2  usage error
#   3  `yarn db:reset` failed
#   4  the readiness poll timed out (or the service-role key it needs is unavailable)
#   5  the dev server never started listening, or the port was already occupied
#      before the spawn (this wrapper SPAWNS AND OWNS its server; adopting a foreign
#      one is not evidence)
#   6  the run produced one or more preflight failures
# 130  the run was INTERRUPTED (SIGINT/SIGTERM). Never 0: criterion 3 counts 16
#      CONSECUTIVE runs, so an abort must be recorded as an abort by the caller, not
#      silently counted as a green.

set -euo pipefail

# Auto-detect paths from script location -- cwd-independence is not optional here:
# the Playwright config already had a spawn-cwd incident (playwright.config.ts:1135-1147).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$TESTS_DIR/.." && pwd)"

# FRONTEND_PORT defaults to 5273, NOT 5173: on this host port 5173 is held by a Docker
# sibling's IPv6 wildcard bind, which is why the Phase-137 gate ran on 5273. The port is
# passed as a shell PREFIX to both the dev server and the Playwright invocation -- never
# written into .env.
FRONTEND_PORT="${FRONTEND_PORT:-5273}"
SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
READINESS_TIMEOUT_S="${READINESS_TIMEOUT_S:-120}"
DEVSERVER_TIMEOUT_S="${DEVSERVER_TIMEOUT_S:-180}"

# The preflight's failure headline is deliberately FIXED so it can be grepped
# (tests/tests/support/preflight.ts:97). Do not parse anything else out of human output.
PREFLIGHT_HEADLINE='E2E PREFLIGHT FAILED'

RUN_DIR=""
PROJECT=""
DEV_PID=""
INTERRUPTED=0

usage() {
  sed -n '2,50p' "${BASH_SOURCE[0]}"
}

# --- argument parsing -------------------------------------------------------------

while [ $# -gt 0 ]; do
  case "$1" in
    --run-dir)
      RUN_DIR="${2:-}"
      shift 2
      ;;
    --project)
      PROJECT="${2:-}"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "e2e-run.sh: unknown argument '$1'" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ -z "$RUN_DIR" ]; then
  echo "e2e-run.sh: --run-dir is required" >&2
  exit 2
fi

# Resolve a relative --run-dir against the REPO ROOT (not $PWD) so the script is
# cwd-independent for relative and absolute paths alike.
case "$RUN_DIR" in
  /*) : ;;
  *) RUN_DIR="$REPO_ROOT/$RUN_DIR" ;;
esac

mkdir -p "$RUN_DIR"

# --- teardown ---------------------------------------------------------------------

# Deterministic teardown from a TRAP: an interrupted run must not leave a listener
# behind to poison the next iteration of the batch.
cleanup() {
  local status=$?
  set +e
  # An interrupted run must NEVER report success. `$?` at trap entry is whatever the last
  # command returned, which is routinely 0 mid-run -- so a caller looping this script
  # would count an aborted run as a green, and criterion 3's "16 CONSECUTIVE runs" would
  # be silently wrong. Force the conventional 128+SIGINT status instead.
  if [ "$INTERRUPTED" = "1" ] && [ "$status" = "0" ]; then
    status=130
  fi
  if [ -n "$DEV_PID" ]; then
    # Kill the whole process group -- `yarn dev` fans out into concurrently +
    # watch:shared + vite, and killing only the parent orphans the listener.
    kill -TERM -"$DEV_PID" 2>/dev/null || kill -TERM "$DEV_PID" 2>/dev/null
    wait "$DEV_PID" 2>/dev/null
  fi
  # Belt and braces: kill whatever still holds the port -- but ONLY processes in OUR
  # OWN process group. The unscoped form `kill -9 $holders` would SIGKILL an operator's
  # own `yarn dev`, or any unrelated process that happens to hold this port, on a run
  # this wrapper did not start it for. `set -m` above puts the spawned job in its own
  # group whose pgid equals $DEV_PID, so pgid membership is exactly "we spawned it".
  local holders pid pgid foreign
  holders="$(lsof -nP -tiTCP:"$FRONTEND_PORT" -sTCP:LISTEN 2>/dev/null || true)"
  foreign=""
  if [ -n "$holders" ] && [ -n "$DEV_PID" ]; then
    for pid in $holders; do
      pgid="$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ')"
      if [ "$pgid" = "$DEV_PID" ]; then
        kill -9 "$pid" 2>/dev/null
      else
        foreign="$foreign $pid"
      fi
    done
    sleep 1
  elif [ -n "$holders" ]; then
    foreign="$holders"
  fi
  if [ -n "$foreign" ]; then
    echo "e2e-run.sh: WARNING -- port $FRONTEND_PORT is held by process(es) this wrapper did" >&2
    echo "            not spawn; leaving them alone:$foreign" >&2
  fi
  holders="$(lsof -nP -tiTCP:"$FRONTEND_PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$holders" ]; then
    echo "e2e-run.sh: WARNING -- port $FRONTEND_PORT still has a listener after teardown: $holders" >&2
  fi
  date -u +%FT%TZ > "$RUN_DIR/ended"
  exit "$status"
}
on_signal() {
  INTERRUPTED=1
  exit 130
}
trap on_signal INT TERM
trap cleanup EXIT

# --- 1. neutralise the environment, and record that it was neutralised --------------

# The forcing knobs must never leak into a run used as evidence (RESEARCH Pitfall 2).
unset EPERM07_FORCE_BUDGET_MS EPERM07_FORCE_CPU_RATE EPERM07_NO_VT || true
# CI matters TWICE over: with it set the config buys `retries: 3` and collapses to a
# single worker (playwright.config.ts:115,117), changing both the retry posture and the
# contention environment the failure actually lives in. A green produced that way proves
# nothing, and would itself be the "retried-until-green" the cardinal rule forbids.
unset CI || true

{
  echo "# Environment posture for this run (Phase 138, D-12)."
  echo "# Written BEFORE the run; the observed_* lines are appended from results.json AFTER it,"
  echo "# so the posture is auditable rather than asserted."
  echo "ci_env=unset"
  echo "eperm07_knobs=unset"
  echo "frontend_port=$FRONTEND_PORT"
  echo "expected_retries=0"
  echo "expected_workers=6"
} > "$RUN_DIR/env-posture.txt"

# --- 2. provenance ------------------------------------------------------------------

date -u +%FT%TZ > "$RUN_DIR/started"
git -C "$REPO_ROOT" rev-parse HEAD > "$RUN_DIR/head"
# A dirty tree is RECORDED, not rejected -- this wrapper is used mid-phase.
git -C "$REPO_ROOT" status --porcelain > "$RUN_DIR/worktree-status.txt"
{
  echo "dirty_files=$(wc -l < "$RUN_DIR/worktree-status.txt" | tr -d ' ')"
} >> "$RUN_DIR/env-posture.txt"

echo "e2e-run.sh: run dir $RUN_DIR"
echo "e2e-run.sh: HEAD    $(cat "$RUN_DIR/head")"

# --- 3. database reset ---------------------------------------------------------------

echo "e2e-run.sh: yarn db:reset (starts Supabase first) ..."
if ! (cd "$REPO_ROOT" && yarn db:reset > "$RUN_DIR/db-reset.log" 2>&1); then
  echo "e2e-run.sh: FATAL -- yarn db:reset failed; see $RUN_DIR/db-reset.log" >&2
  exit 3
fi

# --- 4. readiness poll (NOT a status check) -------------------------------------------

# Read a variable from the environment, falling back to the root .env. Never hardcode a
# key into a committed script (CLAUDE.md: never commit secrets).
read_env_var() {
  local name="$1"
  local value="${!name:-}"
  if [ -z "$value" ] && [ -f "$REPO_ROOT/.env" ]; then
    # Strip surrounding quotes and any CR; octal escapes avoid quoting ambiguity.
    value="$(grep -E "^${name}=" "$REPO_ROOT/.env" | head -1 | cut -d= -f2- | tr -d '\042\047\r')"
  fi
  printf '%s' "$value"
}

SERVICE_ROLE_KEY="$(read_env_var SUPABASE_SERVICE_ROLE_KEY)"
if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "e2e-run.sh: FATAL -- SUPABASE_SERVICE_ROLE_KEY not in the environment or $REPO_ROOT/.env;" >&2
  echo "            the public-assets readiness assertion cannot run, and skipping it silently" >&2
  echo "            is what wedges an unattended batch." >&2
  exit 4
fi

echo "e2e-run.sh: polling REST + Storage readiness (deadline ${READINESS_TIMEOUT_S}s) ..."
# `db:status` passing is NOT readiness: a db:reset can leave Storage briefly 502-ing, and
# in an unattended batch that difference is one wedged run versus a wasted night.
readiness_deadline=$(( $(date +%s) + READINESS_TIMEOUT_S ))
ready=false
while [ "$(date +%s)" -lt "$readiness_deadline" ]; do
  rest_code="$(curl -s -o /dev/null -w '%{http_code}' "$SUPABASE_URL/rest/v1/" || echo 000)"
  buckets="$(curl -s -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    "$SUPABASE_URL/storage/v1/bucket" || true)"
  # 2xx OR 4xx both prove the endpoint is answering (a 401/404 is a live service).
  if [[ "$rest_code" =~ ^[24] ]] && printf '%s' "$buckets" | grep -qF 'public-assets'; then
    ready=true
    break
  fi
  sleep 2
done

if [ "$ready" != true ]; then
  echo "e2e-run.sh: FATAL -- readiness poll timed out after ${READINESS_TIMEOUT_S}s" >&2
  echo "            last REST status: ${rest_code:-none}; public-assets listed: no" >&2
  exit 4
fi
echo "e2e-run.sh: Supabase ready (REST $rest_code, public-assets bucket present)"

# --- 5. spawn the dev server, with its output redirected (D-10) ------------------------

# This redirection is the ONLY available mechanism for D-10. Playwright does not manage
# the frontend dev server in this repo, and making it do so -- by adding a
# Playwright-managed frontend server entry to the config -- is FORBIDDEN: it would
# replace the Phase-137 trust model (a gate that VERIFIES an operator-started server)
# with one that trusts a Playwright-started one, and reusing an already-running server
# would reintroduce exactly the "something answered on the port" ambiguity Phase 137
# eliminated. The wrapper owns the server; the harness is not made to.
# The header lists "NOTHING is already listening on $FRONTEND_PORT" as a prerequisite;
# ASSERT it rather than assume it. Without this check the wait loop below tests the port
# FIRST and so breaks on its very first poll against a PRE-EXISTING listener -- the
# `kill -0 "$DEV_PID"` liveness probe never runs, our own `yarn dev` can already have died
# on Vite's `strictPort`, and the wrapper reports "dev server listening" for a server it
# does not own. That is the "something answered on the port" ambiguity this design exists
# to eliminate; the Phase-137 preflight catches wrong-checkout, not right-checkout-wrong-owner.
pre_holders="$(lsof -nP -tiTCP:"$FRONTEND_PORT" -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$pre_holders" ]; then
  echo "e2e-run.sh: FATAL -- port $FRONTEND_PORT already has a listener (pids: $pre_holders)." >&2
  echo "            This wrapper SPAWNS AND OWNS its dev server; adopting a foreign one is" >&2
  echo "            not evidence. Stop it, or re-run with FRONTEND_PORT=<a free port>." >&2
  exit 5
fi

echo "e2e-run.sh: starting dev server on port $FRONTEND_PORT -> $RUN_DIR/devserver.log"
set -m # job control: the background job gets its own process group, so the trap can kill the tree
(cd "$REPO_ROOT" && FRONTEND_PORT="$FRONTEND_PORT" yarn dev) > "$RUN_DIR/devserver.log" 2>&1 &
DEV_PID=$!
set +m

devserver_deadline=$(( $(date +%s) + DEVSERVER_TIMEOUT_S ))
listening=false
while [ "$(date +%s)" -lt "$devserver_deadline" ]; do
  # Liveness FIRST: with the port asserted free above, any listener that appears is ours,
  # but a dev server that died before binding must still be reported as a dead dev server
  # rather than as a timeout.
  if ! kill -0 "$DEV_PID" 2>/dev/null; then
    echo "e2e-run.sh: FATAL -- dev server exited before listening; see $RUN_DIR/devserver.log" >&2
    exit 5
  fi
  if lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN > /dev/null 2>&1; then
    listening=true
    break
  fi
  sleep 2
done

if [ "$listening" != true ]; then
  echo "e2e-run.sh: FATAL -- dev server did not listen on $FRONTEND_PORT within ${DEVSERVER_TIMEOUT_S}s" >&2
  exit 5
fi
echo "e2e-run.sh: dev server listening on $FRONTEND_PORT"

# --- 6. run Playwright ----------------------------------------------------------------

# PLAYWRIGHT_JSON_OUTPUT_FILE / PLAYWRIGHT_HTML_OUTPUT_DIR are honoured by the installed
# Playwright's reporter-output resolver, so per-run isolation needs NO config change. The
# config's HTML outputFolder is a single fixed path that repeated runs would overwrite.
# PLAYWRIGHT_HTML_OPEN=never keeps an unattended batch from blocking on a served report.
PW_ARGS=(test -c "$TESTS_DIR/playwright.config.ts")
if [ -n "$PROJECT" ]; then
  PW_ARGS+=(--project="$PROJECT")
else
  # No --project: the FULL gate suite, invoked exactly as the root `test:e2e` does.
  PW_ARGS+=("$TESTS_DIR" --grep-invert @probe)
fi
PW_ARGS+=(--reporter=html,json)

echo "e2e-run.sh: npx playwright ${PW_ARGS[*]}"
set +e
(
  cd "$REPO_ROOT" &&
    PLAYWRIGHT_JSON_OUTPUT_FILE="$RUN_DIR/results.json" \
      PLAYWRIGHT_HTML_OUTPUT_DIR="$RUN_DIR/html" \
      PLAYWRIGHT_HTML_OPEN=never \
      FRONTEND_PORT="$FRONTEND_PORT" \
      npx playwright "${PW_ARGS[@]}" 2>&1
) | tee "$RUN_DIR/stdout.log"
# The PLAYWRIGHT status, not tee's.
PW_STATUS="${PIPESTATUS[0]}"
set -e
echo "$PW_STATUS" > "$RUN_DIR/exit"
echo "e2e-run.sh: playwright exit $PW_STATUS"

# Append the OBSERVED posture, read back out of the machine-readable report rather than
# restated from the config -- so the retry/worker claim can be audited, not taken on trust.
if [ -s "$RUN_DIR/results.json" ]; then
  node -e '
    const fs = require("fs");
    const r = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const retries = [...new Set((r.config.projects || []).map((p) => p.retries))].join(",");
    const out = [
      `observed_workers=${r.config.workers}`,
      `observed_retries=${retries}`,
      `observed_expected=${r.stats.expected}`,
      `observed_unexpected=${r.stats.unexpected}`,
      `observed_flaky=${r.stats.flaky}`,
      `observed_skipped=${r.stats.skipped}`,
      `observed_duration_ms=${Math.round(r.stats.duration)}`
    ].join("\n");
    fs.appendFileSync(process.argv[2], out + "\n");
  ' "$RUN_DIR/results.json" "$RUN_DIR/env-posture.txt"
fi

# --- 7. preflight verdict --------------------------------------------------------------

PREFLIGHT_FAILURES="$(grep -c "$PREFLIGHT_HEADLINE" "$RUN_DIR/stdout.log" || true)"
PREFLIGHT_FAILURES="${PREFLIGHT_FAILURES:-0}"
echo "$PREFLIGHT_FAILURES" > "$RUN_DIR/preflight-failures"
echo "e2e-run.sh: preflight failures $PREFLIGHT_FAILURES"

# --- 8/9. teardown + end timestamp happen in the trap -----------------------------------

if [ "$PREFLIGHT_FAILURES" != "0" ]; then
  echo "e2e-run.sh: FATAL -- the run was not preflight-confirmed; it is not evidence (D-17)" >&2
  exit 6
fi

exit "$PW_STATUS"
