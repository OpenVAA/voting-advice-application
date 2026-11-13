#!/usr/bin/env bash
#
# 177.1-e2e.sh -- one preflight-confirmed E2E run for Phase 177.1, plus its cardinal-rule verdict.
#
# Usage (PD = .planning/phases/177.1-invitations-entity-confirmation-nominations-in-advance):
#   bash PD/177.1-e2e.sh <label> [--project <name>] [--require-project <name>]...
# Never in the foreground: start it in the background and poll the marker, as the plans' <long_gates> block says.
#
#   <label>                    plain name; the run lands in tests/e2e-runs/177.1-e2e/<label>
#   --project <name>           restrict the run to one Playwright project (the wrapper's own option)
#   --require-project <name>   repeatable; the run is red unless that project is in the run's summary, has at
#                              least one test, and every one of its tests passed
#
# Steps:
#   (a) guards: Node at or above the engines floor; a working tree with no uncommitted change outside
#       .planning/ other than the operator's untracked CAND-APP-PLAN.md; a label that holds no earlier run;
#       the shared local stack (below);
#   (b) `docker builder prune -af` (the build cache only -- never images, never volumes, never a Docker restart);
#   (c) free space in the Docker VM via `docker run --rm alpine df -k /`; refuses under 13.8 GiB (exit 3);
#   (d) refuses when anything already listens on the wrapper's port (FRONTEND_PORT, default 5273) (exit 5);
#   (e) records the power source (`pmset -g batt`) in <run-dir>/power.txt, then runs
#       tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/177.1-e2e/<label> --no-db-reset [--project ...]
#       (one fresh dev server the wrapper spawns and owns; the database is left as it is), stdout+stderr into
#       <run-dir>/wrapper.log; the caller's environment passes through unchanged, so PLAYWRIGHT_BANK_AUTH and
#       the identity-provider variables reach the wrapper's dev server;
#   (f) derives summary.json and provenance.txt with tests/scripts/e2e-evidence.mjs;
#   (g) writes <run-dir>/head (git rev-parse HEAD), <run-dir>/exit (the WRAPPER's status; the Playwright status
#       the wrapper wrote there is kept as <run-dir>/playwright-exit), and appends to power.txt the power source
#       at the end and the host's Sleep / Wake / DarkWake entries inside the run window;
#   (h) fails when counts.failed, counts.flaky or counts.didNotRun is non-zero, when counts.total or
#       counts.passed is 0, or when a --require-project project did not run green.
# Its last act once the run directory is claimed, on every exit path, is writing <run-dir>/done (its status).
#
# The shared local stack. Another worktree of this repository uses the same Supabase project id and ports, so
# a run here acts on that worktree's database. Before the run directory is claimed the driver refuses (exit 2),
# naming what it found, when:
#   (1) a `started` file without an `ended` beside it, younger than ten minutes, exists at any depth under
#       tests/e2e-runs/ of any worktree `git worktree list --porcelain` names, this one included. A worktree
#       whose directory exists but cannot be read, or whose tests/e2e-runs/ cannot be searched, refuses; a
#       worktree whose directory does not exist holds no run and is listed as absent;
#   (2) anything listens on 5173 or on FRONTEND_PORT (default 5273);
#   (3) the local stack's edge-runtime container (supabase_edge_runtime_<project_id of config.toml>) runs and
#       the bind-mount source of its functions is not this worktree's apps/supabase/supabase/functions, or no
#       functions mount can be found on it. A `docker` command that fails refuses. A stopped stack is no
#       refusal: the wrapper starts it from this worktree.
#
# Only the wrapper makes a run VOID: its heartbeat ends a run during which the host was suspended with status 8
# and leaves VOID-host-suspend.txt in the run directory. This driver passes that status through and says VOID
# by name; such a run is kept and made again under <label>-r2. power.txt is the host's own record of the same
# window. A Sleep entry there with no marker beside it does not make a run void: a red run without the marker
# is a failure, and the entry is what is read when such a run has no other cause.
#
# It never deletes anything under tests/e2e-runs/.
#
# Exit: the wrapper's own status when non-zero (1 Playwright failures, 3 database preparation, 4 readiness,
# 5 port held or server never listened, 6 no positive preflight verdict, 8 VOID -- the host was suspended,
# neither a pass nor a test failure, 130 interrupted); else 0 (counts
# clean and every required project green) or 1 (counts dirty or a required project missing or not green).
# 2 usage/precondition error or a shared-stack refusal, 3 Docker unavailable or too little space, 5 port
# already held.

set -u

SELF="177.1-e2e.sh"
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
      if [ $# -lt 2 ]; then echo "$SELF: --project requires a value" >&2; exit 2; fi
      PROJECT_ARGS=(--project "$2")
      shift 2
      ;;
    --require-project)
      if [ $# -lt 2 ]; then echo "$SELF: --require-project requires a value" >&2; exit 2; fi
      REQUIRED+=("$2")
      shift 2
      ;;
    *) echo "$SELF: unexpected argument '$1'" >&2; exit 2 ;;
  esac
done
case "$LABEL" in
  '' | */* | .* | -*)
    echo "usage: $SELF <label> [--project <name>] [--require-project <name>]... -- a plain <label> is required (e.g. 177.1-05-close)" >&2
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

RUN_DIR="tests/e2e-runs/177.1-e2e/$LABEL"
if [ -d "$RUN_DIR" ] && [ -n "$(ls -A "$RUN_DIR" 2> /dev/null)" ]; then
  echo "$SELF: $RUN_DIR already holds a run; use a new label (e.g. ${LABEL}-r2) so evidence is never overwritten" >&2
  exit 2
fi

# The shared local stack: (1) a run in flight in any worktree, (2) a dev-server listener, (3) a running edge
# runtime that serves another worktree's functions. Prints each finding to stderr; returns 0 when none.
shared_stack_findings() {
  local found=0 wt list_out list_status runs out fstatus started d port lsof_out
  list_out="$(git worktree list --porcelain 2>&1)"
  list_status=$?
  if [ "$list_status" -ne 0 ]; then
    echo "$SELF: git worktree list --porcelain failed (exit $list_status): $list_out" >&2
    return 1
  fi
  while IFS= read -r wt; do
    [ -n "$wt" ] || continue
    if [ ! -e "$wt" ]; then
      echo "$SELF: worktree $wt is absent from disk; no run can be in flight there" >&2
      continue
    fi
    if [ ! -d "$wt" ] || [ ! -r "$wt" ] || [ ! -x "$wt" ]; then
      echo "$SELF: worktree $wt cannot be read, so a run in flight there cannot be ruled out" >&2
      found=1
      continue
    fi
    runs="$wt/tests/e2e-runs"
    [ -e "$runs" ] || continue
    out="$(find "$runs" -name started -type f -mmin -10 2>&1)"
    fstatus=$?
    if [ "$fstatus" -ne 0 ]; then
      echo "$SELF: $runs cannot be searched (find exit $fstatus), so a run in flight there cannot be ruled out: $out" >&2
      found=1
      continue
    fi
    while IFS= read -r started; do
      [ -n "$started" ] || continue
      d="$(dirname "$started")"
      if [ ! -f "$d/ended" ]; then
        echo "$SELF: an E2E run started within the last ten minutes and has not ended: $d" >&2
        found=1
      fi
    done << EOF
$out
EOF
  done << EOF
$(printf '%s\n' "$list_out" | sed -n 's/^worktree //p')
EOF

  for port in 5173 "${FRONTEND_PORT:-5273}"; do
    lsof_out="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2> /dev/null)"
    if [ -n "$lsof_out" ]; then
      echo "$SELF: a process listens on port $port:" >&2
      printf '%s\n' "$lsof_out" >&2
      found=1
    fi
  done

  local project_id edge names dstatus mounts istatus own src fn_sources bad
  project_id="$(sed -n 's/^project_id = "\([^"]*\)"$/\1/p' apps/supabase/supabase/config.toml | head -n 1)"
  if [ -z "$project_id" ]; then
    echo "$SELF: no project_id in apps/supabase/supabase/config.toml, so the local stack's containers cannot be named" >&2
    return 1
  fi
  edge="supabase_edge_runtime_$project_id"
  names="$(docker ps --filter "name=$edge" --format '{{.Names}}' 2>&1)"
  dstatus=$?
  if [ "$dstatus" -ne 0 ]; then
    echo "$SELF: docker ps failed (exit $dstatus), so the stack's owner cannot be read: $names" >&2
    return 1
  fi
  if printf '%s\n' "$names" | grep -q -x -F "$edge"; then
    mounts="$(docker inspect --format '{{range .Mounts}}{{.Type}} {{.Source}}{{"\n"}}{{end}}' "$edge" 2>&1)"
    istatus=$?
    if [ "$istatus" -ne 0 ]; then
      echo "$SELF: docker inspect $edge failed (exit $istatus), so the stack's owner cannot be read: $mounts" >&2
      return 1
    fi
    own="$REPO_ROOT/apps/supabase/supabase/functions"
    # Docker Desktop reports a host path's bind source under /host_mnt; the path after it is the host's.
    fn_sources="$(printf '%s\n' "$mounts" | awk '$1 == "bind" { sub(/^bind /, ""); sub(/^\/host_mnt\//, "/"); print }' | grep -E '/supabase/functions(/|$)')"
    if [ -z "$fn_sources" ]; then
      echo "$SELF: the running $edge has no bind mount of a supabase/functions directory, so the worktree it serves cannot be read; its mounts:" >&2
      printf '%s\n' "$mounts" >&2
      found=1
    else
      bad=0
      while IFS= read -r src; do
        [ -n "$src" ] || continue
        case "$src" in
          "$own" | "$own"/*) ;;
          *) bad=1 ;;
        esac
      done << EOF
$fn_sources
EOF
      if [ "$bad" -ne 0 ]; then
        echo "$SELF: the running $edge serves functions from another worktree (this one's are $own):" >&2
        printf '%s\n' "$fn_sources" >&2
        found=1
      fi
    fi
  fi
  return "$found"
}

if ! shared_stack_findings; then
  echo "$SELF: refusing: the local stack is in use elsewhere or cannot be read (see above)" >&2
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
printf 'label: %s\ndocker_vm_free_gib: %s\nport: %s\nnode: %s\nslice: %s\nbank_auth: %s\nrequired_projects: %s\n' \
  "$LABEL" "$AVAIL_GIB" "$PORT" "$(node -v)" "${PROJECT_ARGS[*]:-none}" "${PLAYWRIGHT_BANK_AUTH:-unset}" "${REQUIRED[*]:-none}" > "$RUN_DIR/177.1-preflight.txt"
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
if [ "$s" -eq 8 ]; then
  echo "$SELF [$LABEL] VOID -- the wrapper ended this run because the host was suspended (see $RUN_DIR/VOID-host-suspend.txt). It is not red and its counts are not a verdict: make the run again under ${LABEL}-r2."
fi

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
  pmset -g log 2> /dev/null | grep -E "^.{26}(Sleep|Wake|DarkWake) " |
    awk -v a="$START_LOCAL" -v b="$END_LOCAL" '{ t = substr($0, 1, 19); if (t >= a && t <= b) print }' > "$RUN_DIR/power-window.txt"
  cat "$RUN_DIR/power-window.txt"
  SLEEPS="$(grep -c -E "^.{26}Sleep " "$RUN_DIR/power-window.txt")"
  echo "sleep_entries_in_window: $SLEEPS"
  if [ "$SLEEPS" -gt 0 ]; then echo "the host logged a Sleep entry inside this run's window; the run is VOID only if the wrapper left $RUN_DIR/VOID-host-suspend.txt (status 8)"; fi
} >> "$RUN_DIR/power.txt"
rm -f "$RUN_DIR/power-window.txt"
tail -n 2 "$RUN_DIR/power.txt"

if [ "$ev" -ne 0 ]; then
  echo "$SELF: e2e-evidence.mjs exited $ev -- no summary.json to judge" >&2
  if [ "$s" -ne 0 ]; then exit "$s"; fi
  exit 1
fi

# (h) cardinal rule, then the required projects.
node -e '
const s = require(require("path").resolve(process.argv[1], "summary.json"));
const c = s.counts;
console.log(`177.1-e2e.sh counts: total ${c.total}, passed ${c.passed}, failed ${c.failed}, flaky ${c.flaky}, skipped ${c.skipped}, didNotRun ${c.didNotRun}`);
let bad = c.failed || c.flaky || c.didNotRun || !c.total || !c.passed ? 1 : 0;
const byProject = s.byProject || {};
for (const name of process.argv.slice(2)) {
  const p = byProject[name];
  if (!p) {
    console.log(`177.1-e2e.sh required project ${name}: NOT IN THE RUN`);
    bad = 1;
    continue;
  }
  const ok = p.total > 0 && p.passed === p.total;
  console.log(`177.1-e2e.sh required project ${name}: total ${p.total}, passed ${p.passed}, failed ${p.failed}, flaky ${p.flaky}, skipped ${p.skipped}, didNotRun ${p.didNotRun}${ok ? "" : " -- RED"}`);
  if (!ok) bad = 1;
}
process.exit(bad);
' "$RUN_DIR" ${REQUIRED[@]+"${REQUIRED[@]}"}
verdict=$?
if [ "$s" -ne 0 ]; then exit "$s"; fi
exit "$verdict"
