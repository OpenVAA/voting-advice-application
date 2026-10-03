#!/usr/bin/env bash
#
# 169-e2e.sh -- one preflight-confirmed E2E run for Phase 169, plus its cardinal-rule verdict.
#
# Usage: bash .planning/phases/169-dependency-bump-to-latest-safe-versions/169-e2e.sh <label> [--project <name>]
#
# Steps:
#   (a) `docker builder prune -af` (the build cache only -- never images, never volumes, never a Docker restart);
#   (b) free space in the Docker VM via `docker run --rm alpine df -k /`; refuses under the operator-accepted
#       floor of 13.8 GiB (exit 3);
#   (c) refuses when anything already listens on the wrapper's port (FRONTEND_PORT, default 5273) (exit 5);
#   (d) runs tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/169-e2e/<label> [--project ...] (one fresh dev
#       server, a db:reset), stdout+stderr into <run-dir>/wrapper.log, and writes the wrapper's echoed
#       Playwright command into <run-dir>/command;
#   (e) derives summary.json with tests/scripts/e2e-evidence.mjs;
#   (f) fails when counts.failed, counts.flaky or counts.didNotRun is non-zero, or counts.total/passed is 0.
#
# Exit: the wrapper's own status when non-zero; else 0 (counts clean) or 1 (counts dirty). 2 usage error,
# 3 Docker unavailable or too little space, 5 port already held.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT" || exit 2

LABEL="${1:-}"
shift || true
PROJECT_ARGS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --project)
      if [ $# -lt 2 ]; then echo "169-e2e.sh: --project requires a value" >&2; exit 2; fi
      PROJECT_ARGS=(--project "$2")
      shift 2
      ;;
    *) echo "169-e2e.sh: unexpected argument '$1'" >&2; exit 2 ;;
  esac
done
if [ -z "$LABEL" ]; then
  echo "169-e2e.sh: a <label> is required (e.g. 169-01-group0)" >&2
  exit 2
fi
case "$LABEL" in
  */* | .* ) echo "169-e2e.sh: label '$LABEL' must be a plain name" >&2; exit 2 ;;
esac

RUN_DIR="tests/e2e-runs/169-e2e/$LABEL"
if [ -d "$RUN_DIR" ] && [ -n "$(ls -A "$RUN_DIR" 2>/dev/null)" ]; then
  echo "169-e2e.sh: $RUN_DIR already holds a run; use a new label so evidence is never overwritten" >&2
  exit 2
fi

# (a) build cache only.
echo "169-e2e.sh [$LABEL] docker builder prune -af"
docker builder prune -af > /dev/null 2>&1
prune_status=$?
if [ "$prune_status" -ne 0 ]; then
  echo "169-e2e.sh: docker builder prune failed (exit $prune_status) -- is Docker running?" >&2
  exit 3
fi

# (b) free space in the Docker VM, captured into a variable first so a docker failure is not read as a number.
DF_OUT="$(docker run --rm alpine df -k / 2>&1)"
df_status=$?
if [ "$df_status" -ne 0 ]; then
  echo "169-e2e.sh: could not measure Docker VM free space (exit $df_status): $DF_OUT" >&2
  exit 3
fi
AVAIL_KIB="$(printf '%s\n' "$DF_OUT" | awk 'NR==2 {print $4}')"
MIN_KIB=14470349 # 13.8 GiB, the floor the operator accepted for this host
case "$AVAIL_KIB" in
  '' | *[!0-9]*) echo "169-e2e.sh: could not parse free space from: $DF_OUT" >&2; exit 3 ;;
esac
AVAIL_GIB="$(awk -v k="$AVAIL_KIB" 'BEGIN { printf "%.2f", k / 1048576 }')"
if [ "$AVAIL_KIB" -lt "$MIN_KIB" ]; then
  echo "169-e2e.sh: only ${AVAIL_GIB} GiB free in the Docker VM (floor 13.8 GiB) -- stop and report; never restart Docker or prune images/volumes" >&2
  exit 3
fi
echo "169-e2e.sh [$LABEL] Docker VM free: ${AVAIL_GIB} GiB"

# (c) the port the wrapper will bind, resolved as the wrapper resolves it.
PORT="${FRONTEND_PORT:-5273}"
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN > /dev/null 2>&1; then
  echo "169-e2e.sh: a process already listens on port $PORT:" >&2
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >&2
  exit 5
fi

# (d) one wrapper run.
mkdir -p "$RUN_DIR"
printf 'docker_vm_free_gib: %s\nport: %s\n' "$AVAIL_GIB" "$PORT" > "$RUN_DIR/169-preflight.txt"
echo "169-e2e.sh [$LABEL] tests/scripts/e2e-run.sh --run-dir $RUN_DIR ${PROJECT_ARGS[*]:-}"
tests/scripts/e2e-run.sh --run-dir "$RUN_DIR" ${PROJECT_ARGS[@]+"${PROJECT_ARGS[@]}"} > "$RUN_DIR/wrapper.log" 2>&1
s=$?
grep -m1 '^e2e-run.sh: npx playwright ' "$RUN_DIR/wrapper.log" | sed 's/^e2e-run.sh: //' > "$RUN_DIR/command"
echo "169-e2e.sh [$LABEL] wrapper exit $s"

# (e) derived verdict.
node tests/scripts/e2e-evidence.mjs "$RUN_DIR" --note "$LABEL"
ev=$?
if [ "$ev" -ne 0 ]; then
  echo "169-e2e.sh: e2e-evidence.mjs exited $ev -- no summary.json to judge" >&2
  if [ "$s" -ne 0 ]; then exit "$s"; fi
  exit 1
fi

# (f) cardinal rule.
node -e '
const s = require(require("path").resolve(process.argv[1], "summary.json"));
const c = s.counts;
console.log(`169-e2e.sh counts: total ${c.total}, passed ${c.passed}, failed ${c.failed}, flaky ${c.flaky}, skipped ${c.skipped}, didNotRun ${c.didNotRun}`);
process.exit(c.failed || c.flaky || c.didNotRun || !c.total || !c.passed ? 1 : 0);
' "$RUN_DIR"
verdict=$?
if [ "$s" -ne 0 ]; then exit "$s"; fi
exit "$verdict"
