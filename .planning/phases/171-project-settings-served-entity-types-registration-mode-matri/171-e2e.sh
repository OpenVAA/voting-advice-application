#!/usr/bin/env bash
#
# 171-e2e.sh -- one preflight-confirmed E2E run for Phase 171, plus its cardinal-rule verdict.
#
# Usage: bash .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-e2e.sh <label> [--project <name>] [--require-project <name>]...
#
#   <label>                    plain name; the run lands in tests/e2e-runs/171-e2e/<label>
#   --project <name>           restrict the run to one Playwright project (the wrapper's own option)
#   --require-project <name>   repeatable; the run is red unless that project has at least one passed test and
#                              no failed, flaky or did-not-run test in the run's summary
#
# Steps:
#   (a) guards: Node at or above the engines floor; a working tree with no uncommitted change outside
#       .planning/ other than the operator's untracked CAND-APP-PLAN.md; a label that holds no earlier run;
#   (b) `docker builder prune -af` (the build cache only -- never images, never volumes, never a Docker restart);
#   (c) free space in the Docker VM via `docker run --rm alpine df -k /`; refuses under 13.8 GiB (exit 3);
#   (d) refuses when anything already listens on the wrapper's port (FRONTEND_PORT, default 5273) (exit 5);
#   (e) runs tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/171-e2e/<label> --no-db-reset [--project ...]
#       once (one fresh dev server the wrapper spawns and owns; the database is left as it is), stdout+stderr
#       into <run-dir>/wrapper.log, its status captured directly; the caller's environment passes through
#       unchanged, so PLAYWRIGHT_BANK_AUTH and the identity-provider variables reach the wrapper's dev server;
#   (f) derives summary.json with tests/scripts/e2e-evidence.mjs;
#   (g) fails when counts.failed, counts.flaky or counts.didNotRun is non-zero, when counts.total or
#       counts.passed is 0, or when a --require-project project did not run green.
#
# It never deletes anything under tests/e2e-runs/.
#
# Exit: the wrapper's own status when non-zero (1 Playwright failures, 3 database preparation, 4 readiness,
# 5 port held or server never listened, 6 no positive preflight verdict, 130 interrupted); else 0 (counts
# clean) or 1 (counts dirty or a required project missing). 2 usage/precondition error, 3 Docker unavailable
# or too little space, 5 port already held.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT" || exit 2

LABEL="${1:-}"
shift || true
PROJECT_ARGS=()
REQUIRED=()
while [ $# -gt 0 ]; do
  case "$1" in
    --project)
      if [ $# -lt 2 ]; then echo "171-e2e.sh: --project requires a value" >&2; exit 2; fi
      PROJECT_ARGS=(--project "$2")
      shift 2
      ;;
    --require-project)
      if [ $# -lt 2 ]; then echo "171-e2e.sh: --require-project requires a value" >&2; exit 2; fi
      REQUIRED+=("$2")
      shift 2
      ;;
    *) echo "171-e2e.sh: unexpected argument '$1'" >&2; exit 2 ;;
  esac
done
if [ -z "$LABEL" ]; then
  echo "171-e2e.sh: a <label> is required (e.g. 171-04-interim)" >&2
  exit 2
fi
case "$LABEL" in
  */* | .* | -*) echo "171-e2e.sh: label '$LABEL' must be a plain name" >&2; exit 2 ;;
esac

# (a) Node: the phase's pinned v24.21.0 when it is installed, else the newest version at or above 24.15 under nvm.
NVM_NODE_DIR="$HOME/.nvm/versions/node"
if [ -x "$NVM_NODE_DIR/v24.21.0/bin/node" ]; then
  export PATH="$NVM_NODE_DIR/v24.21.0/bin:$PATH"
elif [ -d "$NVM_NODE_DIR" ]; then
  PICK="$(ls "$NVM_NODE_DIR" | sed 's/^v//' | awk -F. '($1 > 24) || ($1 == 24 && $2 >= 15)' | sort -t. -k1,1n -k2,2n -k3,3n | tail -n 1)"
  if [ -n "$PICK" ]; then export PATH="$NVM_NODE_DIR/v$PICK/bin:$PATH"; fi
fi
if ! node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>24||(a===24&&b>=15)?0:1)'; then
  echo "171-e2e.sh: node $(node -v) is below the engines floor 24.15.0" >&2
  exit 2
fi

DIRTY="$(git status --porcelain -- . ':(exclude).planning' | grep -v -x '?? CAND-APP-PLAN.md')"
if [ -n "$DIRTY" ]; then
  echo "171-e2e.sh: the working tree has uncommitted changes outside .planning/:" >&2
  printf '%s\n' "$DIRTY" >&2
  exit 2
fi

RUN_DIR="tests/e2e-runs/171-e2e/$LABEL"
if [ -d "$RUN_DIR" ] && [ -n "$(ls -A "$RUN_DIR" 2>/dev/null)" ]; then
  echo "171-e2e.sh: $RUN_DIR already holds a run; use a new label (e.g. ${LABEL}-2) so evidence is never overwritten" >&2
  exit 2
fi

# (b) build cache only.
echo "171-e2e.sh [$LABEL] docker builder prune -af"
docker builder prune -af > /dev/null 2>&1
prune_status=$?
if [ "$prune_status" -ne 0 ]; then
  echo "171-e2e.sh: docker builder prune failed (exit $prune_status) -- is Docker running?" >&2
  exit 3
fi

# (c) free space in the Docker VM, captured into a variable first so a docker failure is not read as a number.
DF_OUT="$(docker run --rm alpine df -k / 2>&1)"
df_status=$?
if [ "$df_status" -ne 0 ]; then
  echo "171-e2e.sh: could not measure Docker VM free space (exit $df_status): $DF_OUT" >&2
  exit 3
fi
AVAIL_KIB="$(printf '%s\n' "$DF_OUT" | awk 'NR==2 {print $4}')"
MIN_KIB=14470349 # 13.8 GiB, the floor the operator accepted for this host
case "$AVAIL_KIB" in
  '' | *[!0-9]*) echo "171-e2e.sh: could not parse free space from: $DF_OUT" >&2; exit 3 ;;
esac
AVAIL_GIB="$(LC_ALL=C awk -v k="$AVAIL_KIB" 'BEGIN { printf "%.2f", k / 1048576 }')"
if [ "$AVAIL_KIB" -lt "$MIN_KIB" ]; then
  echo "171-e2e.sh: only ${AVAIL_GIB} GiB free in the Docker VM (floor 13.8 GiB) -- stop and report; never restart Docker or prune images/volumes" >&2
  exit 3
fi
echo "171-e2e.sh [$LABEL] Docker VM free: ${AVAIL_GIB} GiB"

# (d) the port the wrapper will bind, resolved as the wrapper resolves it.
PORT="${FRONTEND_PORT:-5273}"
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN > /dev/null 2>&1; then
  echo "171-e2e.sh: a process already listens on port $PORT:" >&2
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >&2
  exit 5
fi

# (e) one wrapper run.
mkdir -p "$RUN_DIR"
printf 'docker_vm_free_gib: %s\nport: %s\nnode: %s\nbank_auth: %s\nrequired_projects: %s\n' \
  "$AVAIL_GIB" "$PORT" "$(node -v)" "${PLAYWRIGHT_BANK_AUTH:-unset}" "${REQUIRED[*]:-none}" > "$RUN_DIR/171-preflight.txt"
echo "171-e2e.sh [$LABEL] tests/scripts/e2e-run.sh --run-dir $RUN_DIR --no-db-reset ${PROJECT_ARGS[*]:-}"
tests/scripts/e2e-run.sh --run-dir "$RUN_DIR" --no-db-reset ${PROJECT_ARGS[@]+"${PROJECT_ARGS[@]}"} > "$RUN_DIR/wrapper.log" 2>&1
s=$?
grep -m1 '^e2e-run.sh: npx playwright ' "$RUN_DIR/wrapper.log" | sed 's/^e2e-run.sh: //' > "$RUN_DIR/command"
echo "171-e2e.sh [$LABEL] wrapper exit $s"

# (f) derived verdict.
node tests/scripts/e2e-evidence.mjs "$RUN_DIR" --note "$LABEL"
ev=$?
if [ "$ev" -ne 0 ]; then
  echo "171-e2e.sh: e2e-evidence.mjs exited $ev -- no summary.json to judge" >&2
  if [ "$s" -ne 0 ]; then exit "$s"; fi
  exit 1
fi

# (g) cardinal rule, then the required projects.
node -e '
const s = require(require("path").resolve(process.argv[1], "summary.json"));
const c = s.counts;
console.log(`171-e2e.sh counts: total ${c.total}, passed ${c.passed}, failed ${c.failed}, flaky ${c.flaky}, skipped ${c.skipped}, didNotRun ${c.didNotRun}`);
let bad = c.failed || c.flaky || c.didNotRun || !c.total || !c.passed ? 1 : 0;
for (const name of process.argv.slice(2)) {
  const p = s.byProject[name];
  if (!p) {
    console.log(`171-e2e.sh required project ${name}: NOT IN THE RUN`);
    bad = 1;
    continue;
  }
  const ok = p.passed > 0 && !p.failed && !p.flaky && !p.didNotRun;
  console.log(`171-e2e.sh required project ${name}: total ${p.total}, passed ${p.passed}, failed ${p.failed}, flaky ${p.flaky}, skipped ${p.skipped}, didNotRun ${p.didNotRun}${ok ? "" : " -- RED"}`);
  if (!ok) bad = 1;
}
process.exit(bad);
' "$RUN_DIR" ${REQUIRED[@]+"${REQUIRED[@]}"}
verdict=$?
if [ "$s" -ne 0 ]; then exit "$s"; fi
exit "$verdict"
