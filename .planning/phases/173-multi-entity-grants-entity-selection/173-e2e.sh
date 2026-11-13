#!/usr/bin/env bash
#
# 173-e2e.sh -- one preflight-confirmed E2E run for Phase 173, plus its cardinal-rule verdict.
#
# Usage (PD = .planning/phases/173-multi-entity-grants-entity-selection):
#   bash PD/173-e2e.sh <label> [--project <name>]
# Never in the foreground: start it in the background and poll the marker, as the plans' <long_gates> block says.
#
# Steps:
#   (a) guards: Node at or above the engines floor; a working tree with no uncommitted change outside
#       .planning/ other than the operator's untracked CAND-APP-PLAN.md; a label that holds no earlier run;
#   (b) `docker builder prune -af` (the build cache only -- never images, never volumes, never a Docker restart);
#   (c) free space in the Docker VM via `docker run --rm alpine df -k /`; refuses under 13.8 GiB (exit 3);
#   (d) refuses when anything already listens on the wrapper's port (FRONTEND_PORT, default 5273) (exit 5);
#   (e) records the power source (`pmset -g batt`) in <run-dir>/power.txt, then runs
#       tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/173-e2e/<label> --no-db-reset [--project ...]
#       (one fresh dev server the wrapper spawns and owns; the database is left as it is), stdout+stderr into
#       <run-dir>/wrapper.log; the caller's environment passes through to the wrapper;
#   (f) derives summary.json and provenance.txt with tests/scripts/e2e-evidence.mjs;
#   (g) writes <run-dir>/head (git rev-parse HEAD), <run-dir>/exit (the WRAPPER's status; the Playwright status
#       the wrapper wrote there is kept as <run-dir>/playwright-exit), and appends to power.txt the power source
#       at the end and the host's Sleep / Wake / DarkWake entries inside the run window;
#   (h) fails when counts.failed, counts.flaky or counts.didNotRun is non-zero, or counts.total/passed is 0.
# Its last act once the run directory is claimed, on every exit path, is writing <run-dir>/done (its status).
#
# A Sleep entry inside the run window means the host was suspended during the run. Such a run is VOID, not
# red: keep its directory and make the run again under <label>-r2. power.txt says so in one line.
#
# It never deletes anything under tests/e2e-runs/.
#
# Exit: the wrapper's own status when non-zero (1 Playwright failures, 3 database preparation, 4 readiness,
# 5 port held or server never listened, 6 no positive preflight verdict, 130 interrupted); else 0 (counts
# clean) or 1 (counts dirty). 2 usage/precondition error, 3 Docker unavailable or too little space, 5 port
# already held.

set -u

SELF="173-e2e.sh"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT" || exit 2

LABEL="${1:-}"
shift || true
PROJECT_ARGS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --project)
      if [ $# -lt 2 ]; then echo "$SELF: --project requires a value" >&2; exit 2; fi
      PROJECT_ARGS=(--project "$2")
      shift 2
      ;;
    *) echo "$SELF: unexpected argument '$1'" >&2; exit 2 ;;
  esac
done
case "$LABEL" in
  '' | */* | .* | -*)
    echo "usage: $SELF <label> [--project <name>] -- a plain <label> is required (e.g. 173-01-baseline)" >&2
    exit 2
    ;;
esac

# (a) Node: the pinned v24.21.0 when it is installed, else the newest version at or above 24.15 under nvm.
NVM_NODE_DIR="$HOME/.nvm/versions/node"
if [ -x "$NVM_NODE_DIR/v24.21.0/bin/node" ]; then
  export PATH="$NVM_NODE_DIR/v24.21.0/bin:$PATH"
elif [ -d "$NVM_NODE_DIR" ]; then
  PICK="$(ls "$NVM_NODE_DIR" | sed 's/^v//' | awk -F. '($1 > 24) || ($1 == 24 && $2 >= 15)' | sort -t. -k1,1n -k2,2n -k3,3n | tail -n 1)"
  if [ -n "$PICK" ]; then export PATH="$NVM_NODE_DIR/v$PICK/bin:$PATH"; fi
fi
if ! node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>24||(a===24&&b>=15)?0:1)' 2> /dev/null; then
  echo "$SELF: node $(node -v 2> /dev/null || echo '(none)') is below the engines floor 24.15.0" >&2
  exit 2
fi

DIRTY="$(git status --porcelain -- . ':(exclude).planning' | grep -v -x '?? CAND-APP-PLAN.md')"
if [ -n "$DIRTY" ]; then
  echo "$SELF: the working tree has uncommitted changes outside .planning/:" >&2
  printf '%s\n' "$DIRTY" >&2
  exit 2
fi

RUN_DIR="tests/e2e-runs/173-e2e/$LABEL"
if [ -d "$RUN_DIR" ] && [ -n "$(ls -A "$RUN_DIR" 2> /dev/null)" ]; then
  echo "$SELF: $RUN_DIR already holds a run; use a new label (e.g. ${LABEL}-r2) so evidence is never overwritten" >&2
  exit 2
fi

mkdir -p "$RUN_DIR" || exit 2
on_exit() {
  local s=$?
  printf '%s\n' "$s" > "$RUN_DIR/done"
  exit "$s"
}
trap on_exit EXIT
trap 'exit 130' INT TERM

# (b) build cache only.
echo "$SELF [$LABEL] docker builder prune -af"
docker builder prune -af > /dev/null 2>&1
prune_status=$?
if [ "$prune_status" -ne 0 ]; then
  echo "$SELF: docker builder prune failed (exit $prune_status) -- is Docker running?" >&2
  exit 3
fi

# (c) free space in the Docker VM, captured into a variable first so a docker failure is not read as a number.
DF_OUT="$(docker run --rm alpine df -k / 2>&1)"
df_status=$?
if [ "$df_status" -ne 0 ]; then
  echo "$SELF: could not measure Docker VM free space (exit $df_status): $DF_OUT" >&2
  exit 3
fi
AVAIL_KIB="$(printf '%s\n' "$DF_OUT" | awk 'NR==2 {print $4}')"
MIN_KIB=14470349 # 13.8 GiB, the floor the operator accepted for this host
case "$AVAIL_KIB" in
  '' | *[!0-9]*) echo "$SELF: could not parse free space from: $DF_OUT" >&2; exit 3 ;;
esac
AVAIL_GIB="$(LC_ALL=C awk -v k="$AVAIL_KIB" 'BEGIN { printf "%.2f", k / 1048576 }')"
if [ "$AVAIL_KIB" -lt "$MIN_KIB" ]; then
  echo "$SELF: only ${AVAIL_GIB} GiB free in the Docker VM (floor 13.8 GiB) -- stop and report; never restart Docker or prune images/volumes" >&2
  exit 3
fi
echo "$SELF [$LABEL] Docker VM free: ${AVAIL_GIB} GiB"

# (d) the port the wrapper will bind, resolved as the wrapper resolves it.
PORT="${FRONTEND_PORT:-5273}"
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN > /dev/null 2>&1; then
  echo "$SELF: a process already listens on port $PORT:" >&2
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >&2
  exit 5
fi

# (e) one wrapper run.
printf 'label: %s\ndocker_vm_free_gib: %s\nport: %s\nnode: %s\nslice: %s\n' \
  "$LABEL" "$AVAIL_GIB" "$PORT" "$(node -v)" "${PROJECT_ARGS[*]:-none}" > "$RUN_DIR/173-preflight.txt"
START_LOCAL="$(date '+%F %T')"
{
  echo "started_local: $START_LOCAL"
  echo "--- pmset -g batt (start)"
  pmset -g batt 2>&1 || echo "(pmset unavailable)"
} > "$RUN_DIR/power.txt"
echo "$SELF [$LABEL] tests/scripts/e2e-run.sh --run-dir $RUN_DIR --no-db-reset ${PROJECT_ARGS[*]:-}"
tests/scripts/e2e-run.sh --run-dir "$RUN_DIR" --no-db-reset ${PROJECT_ARGS[@]+"${PROJECT_ARGS[@]}"} > "$RUN_DIR/wrapper.log" 2>&1
s=$?
END_LOCAL="$(date '+%F %T')"
# The Playwright argument line is what e2e-evidence.mjs and the verdict read to tell the full suite from a slice.
grep -m1 '^e2e-run.sh: npx playwright ' "$RUN_DIR/wrapper.log" | sed 's/^e2e-run.sh: //' > "$RUN_DIR/command"
echo "$SELF [$LABEL] wrapper exit $s"

# (f) derived evidence, read while <run-dir>/exit still holds the Playwright status the wrapper wrote.
node tests/scripts/e2e-evidence.mjs "$RUN_DIR" --note "$LABEL"
ev=$?

# (g) the head, the wrapper's status and the power record.
git rev-parse HEAD > "$RUN_DIR/head"
if [ -f "$RUN_DIR/exit" ]; then cp "$RUN_DIR/exit" "$RUN_DIR/playwright-exit"; fi
printf '%s\n' "$s" > "$RUN_DIR/exit"
{
  echo "ended_local: $END_LOCAL"
  echo "--- pmset -g batt (end)"
  pmset -g batt 2>&1 || echo "(pmset unavailable)"
  echo "--- pmset -g log, Sleep / Wake / DarkWake entries inside the run window"
  pmset -g log 2> /dev/null | grep -E " (Sleep|Wake|DarkWake) " |
    awk -v a="$START_LOCAL" -v b="$END_LOCAL" '{ t = substr($0, 1, 19); if (t >= a && t <= b) print }' > "$RUN_DIR/power-window.txt"
  cat "$RUN_DIR/power-window.txt"
  SLEEPS="$(grep -c -E "^.{26}Sleep " "$RUN_DIR/power-window.txt")"
  echo "sleep_entries_in_window: $SLEEPS"
  if [ "$SLEEPS" -gt 0 ]; then echo "the host was suspended during this run: the run is VOID, not red -- make it again under ${LABEL}-r2"; fi
} >> "$RUN_DIR/power.txt"
rm -f "$RUN_DIR/power-window.txt"
tail -n 2 "$RUN_DIR/power.txt"

if [ "$ev" -ne 0 ]; then
  echo "$SELF: e2e-evidence.mjs exited $ev -- no summary.json to judge" >&2
  if [ "$s" -ne 0 ]; then exit "$s"; fi
  exit 1
fi

# (h) cardinal rule.
node -e '
const s = require(require("path").resolve(process.argv[1], "summary.json"));
const c = s.counts;
console.log(`173-e2e.sh counts: total ${c.total}, passed ${c.passed}, failed ${c.failed}, flaky ${c.flaky}, skipped ${c.skipped}, didNotRun ${c.didNotRun}`);
process.exit(c.failed || c.flaky || c.didNotRun || !c.total || !c.passed ? 1 : 0);
' "$RUN_DIR"
verdict=$?
if [ "$s" -ne 0 ]; then exit "$s"; fi
exit "$verdict"
