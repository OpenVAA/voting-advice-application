#!/usr/bin/env bash
#
# 177.1-gates.sh -- the Phase 177.1 gate set, one row per gate, each status read directly.
#
# Usage (PD = .planning/phases/177.1-invitations-entity-confirmation-nominations-in-advance):
#   bash PD/177.1-gates.sh <label> [--rows <comma-separated row names>]
# Never in the foreground: start it in the background and poll the marker, as the plans' <long_gates> block says.
#
# Thirteen rows by default, in this fixed order, every one with TURBO_FORCE=true in its environment:
#   typecheck            yarn typecheck
#   lint                 yarn lint:check (its links include the auth-configuration assertion)
#   db-reset             yarn db:reset
#   types-regen          yarn db:types
#   types-clean          git diff --exit-code -- packages/supabase-types/src/database.ts
#   pgtap                yarn workspace @openvaa/supabase test:db
#   sql-lint             yarn db:lint:sql
#   integration          the gated writer integration test of the frontend, against the local stack
#   unit                 yarn test:unit
#   check-frontend       yarn workspace @openvaa/frontend check
#   build                yarn build
#   format               yarn format:check
#   docs-links           yarn workspace @openvaa/docs validate:links --check
#
# With --rows only the named rows run, still in the order above, and rows-expected.txt holds exactly those
# names. An unknown name is a usage error. 177.1-verdict.mjs never reads a subset run as the full gate set.
#
# The order of the database rows is fixed: the reset, then the types on the freshly reset database, then
# pgTAP, then the SQL lint, then the integration test. `yarn db:types` describes the APPLIED database, and the
# pgTAP suite's first file commits its helper functions into `public`, where they stay until the next reset; on
# a database where pgTAP has run since the last reset the regenerated file gains the helpers and types-clean is
# red on a correct tree. A subset that names types-regen without db-reset is judged on whatever the database
# holds.
#
# The integration row reads the API URL, the anon key and the service-role key from `supabase status -o env`
# into shell variables and hands them to the one vitest process through its environment. They are never
# echoed, never written to a file and never put on a command line. The row fails when a key cannot be read.
# The test works in the default project of the seed under identifiers of its own and removes what it made.
# Its JSON report lands in the run directory as integration.json.
#
# db-reset DESTROYS local data, the E2E project's rows and the `default` dataset included: run the gate set
# before the E2E run and re-seed with `yarn db:seed:default` at the end. A subset without db-reset resets
# nothing.
#
# Every row runs as `cmd > "$DIR/NN-name.log" 2>&1; s=$?` -- never through a pipe -- and
# `name<TAB>status<TAB>seconds` is appended to summary.tsv. Every row runs even after a red one. Output lands
# under tests/e2e-runs/177.1-gates/<label>/ (gitignored): env.txt, head (the SHA alone), rows-expected.txt,
# summary.tsv, power.txt (the power source at the start and the end, and the host's Sleep, Wake and DarkWake
# entries inside the run window with the number of Sleep entries), one log per row and, as the run's last act
# once the directory is claimed, `done` (its status).
#
# power.txt is a record and nothing more. A Sleep entry voids nothing: a gate run is judged by its rows' exit
# values, and only the E2E wrapper's marker (VOID-host-suspend.txt, status 8) makes an E2E run void.
#
# Refusals (exit 2): Node below the engines floor; a working tree with uncommitted changes outside .planning/
# other than the operator's untracked CAND-APP-PLAN.md (gates run on committed trees only); a label that
# already holds a run (evidence is never overwritten; a re-run takes <label>-r2, -r3, ...); with a database
# row selected, a local Supabase stack that `yarn db:status` does not find (start it with `yarn db:start`).
#
# The shared local stack. Another worktree of this repository uses the same Supabase project id and ports, so
# a reset or a database row here acts on that worktree's database. With a database row selected, the driver
# refuses (exit 2), naming what it found, when:
#   (a) a `started` file without an `ended` beside it, younger than ten minutes, exists at any depth under
#       tests/e2e-runs/ of any worktree `git worktree list --porcelain` names, this one included. Every depth,
#       because a determinism batch writes its markers one level below a single run's. A worktree whose
#       directory exists but cannot be read, or whose tests/e2e-runs/ cannot be searched, refuses; a worktree
#       whose directory does not exist holds no run and is listed as absent;
#   (b) anything listens on 5173 or on FRONTEND_PORT (default 5273);
#   (c) the local stack's edge-runtime container (supabase_edge_runtime_<project_id of config.toml>) runs and
#       the bind-mount source of its functions is not this worktree's apps/supabase/supabase/functions, or no
#       functions mount can be found on it. A `docker` command that fails refuses. A stopped stack is no
#       refusal.
#
# Exit codes: 0 every row green; 1 at least one row non-zero; 2 usage or precondition error; 130 interrupted.

set -u

SELF="177.1-gates.sh"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT" || exit 2
PD=".planning/phases/177.1-invitations-entity-confirmation-nominations-in-advance"

ALL_ROWS="typecheck lint db-reset types-regen types-clean pgtap sql-lint integration unit check-frontend build format docs-links"
# The rows that act on the local stack: they refuse without a running stack and while the stack is shared.
DB_ROWS="db-reset types-regen types-clean pgtap sql-lint integration"
TYPES_FILE="packages/supabase-types/src/database.ts"

usage() {
  echo "usage: bash $PD/$SELF <label> [--rows <comma-separated row names>]" >&2
  echo "rows: $ALL_ROWS" >&2
  exit 2
}

LABEL="${1:-}"
shift || true
ROWS_ARG=""
while [ $# -gt 0 ]; do
  case "$1" in
    --rows)
      if [ $# -lt 2 ] || [ -z "$2" ]; then echo "$SELF: --rows requires a value" >&2; usage; fi
      ROWS_ARG="$2"
      shift 2
      ;;
    *) echo "$SELF: unexpected argument '$1'" >&2; usage ;;
  esac
done
case "$LABEL" in
  '' | */* | .* | -*) echo "$SELF: a plain <label> is required (e.g. 177.1-05-close)" >&2; usage ;;
esac

has_word() { case " $1 " in *" $2 "*) return 0 ;; *) return 1 ;; esac; }

# The selected rows, always in the fixed order.
if [ -z "$ROWS_ARG" ]; then
  ROWS="$ALL_ROWS"
else
  ASKED="$(printf '%s' "$ROWS_ARG" | tr ',' ' ')"
  for r in $ASKED; do
    if ! has_word "$ALL_ROWS" "$r"; then echo "$SELF: unknown row '$r'" >&2; usage; fi
  done
  ROWS=""
  for r in $ALL_ROWS; do
    if has_word "$ASKED" "$r"; then ROWS="$ROWS $r"; fi
  done
  ROWS="${ROWS# }"
  if [ -z "$ROWS" ]; then echo "$SELF: --rows names no row" >&2; usage; fi
fi
NEEDS_DB=0
for r in $ROWS; do
  if has_word "$DB_ROWS" "$r"; then NEEDS_DB=1; fi
done

# Node: the pinned v24.21.0 when it is installed, else the newest version at or above 24.15 under nvm.
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

# Gates run on committed trees only.
DIRTY="$(git status --porcelain -- . ':(exclude).planning' | grep -v -x '?? CAND-APP-PLAN.md')"
if [ -n "$DIRTY" ]; then
  echo "$SELF: the working tree has uncommitted changes outside .planning/:" >&2
  printf '%s\n' "$DIRTY" >&2
  exit 2
fi

DIR="tests/e2e-runs/177.1-gates/$LABEL"
if [ -e "$DIR" ] && [ -n "$(ls -A "$DIR" 2> /dev/null)" ]; then
  echo "$SELF: $DIR already holds a run; use a new label (e.g. ${LABEL}-r2) so evidence is never overwritten" >&2
  exit 2
fi

# The shared local stack: (a) a run in flight in any worktree, (b) a dev-server listener, (c) a running edge
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

if [ "$NEEDS_DB" -eq 1 ]; then
  if ! shared_stack_findings; then
    echo "$SELF: refusing: a row that acts on the local stack is selected and the stack is in use elsewhere or cannot be read (see above)" >&2
    exit 2
  fi
  if ! yarn db:status > /dev/null 2>&1; then
    echo "$SELF: the local Supabase stack is not up (yarn db:status failed) and a row that needs it is selected -- start it with: yarn db:start" >&2
    exit 2
  fi
fi

mkdir -p "$DIR" || exit 2
on_exit() {
  local s=$?
  printf '%s\n' "$s" > "$DIR/done"
  exit "$s"
}
trap on_exit EXIT
trap 'exit 130' INT TERM

export TURBO_FORCE=true
: > "$DIR/summary.tsv"
git rev-parse HEAD > "$DIR/head"
printf '%s\n' $ROWS > "$DIR/rows-expected.txt"
START_LOCAL="$(date '+%F %T')"
{
  echo "label: $LABEL"
  echo "rows: $ROWS"
  echo "started: $(date -u +%FT%TZ)"
  echo "node: $(node -v)"
  echo "yarn: $(yarn --version)"
  echo "head: $(cat "$DIR/head")"
  echo "TURBO_FORCE: $TURBO_FORCE"
} > "$DIR/env.txt"
{
  echo "started_local: $START_LOCAL"
  echo "--- pmset -g batt (start)"
  pmset -g batt 2>&1 || echo "(pmset unavailable)"
} > "$DIR/power.txt"

FAILED=0
N=0
run_gate() {
  local name="$1"
  shift
  N=$((N + 1))
  local log t0 t1 s
  log="$DIR/$(printf '%02d' "$N")-$name.log"
  t0=$(date +%s)
  echo "$SELF [$LABEL] $name: $*"
  "$@" > "$log" 2>&1
  s=$?
  t1=$(date +%s)
  printf '%s\t%s\t%s\n' "$name" "$s" "$((t1 - t0))" >> "$DIR/summary.tsv"
  echo "$SELF [$LABEL] $name: exit $s ($((t1 - t0))s)"
  if [ "$s" -ne 0 ]; then FAILED=1; fi
}

# `yarn db:types` redirects into the generated file, so a failed generation leaves it truncated; the
# committed file is then put back (the tree was clean at the start).
gate_types_regen() {
  local s
  yarn db:types
  s=$?
  echo "yarn db:types: exit $s"
  if [ "$s" -ne 0 ]; then
    git checkout -- "$TYPES_FILE"
    echo "the generation failed; the committed file is back in place"
  fi
  return "$s"
}

# A drift is kept as db-types-drift.diff and the committed file is put back, so the rows after it judge the committed tree.
gate_types_clean() {
  local s
  git diff --stat -- "$TYPES_FILE"
  git diff --exit-code -- "$TYPES_FILE" > "$DIR/db-types-drift.diff"
  s=$?
  echo "git diff --exit-code -- $TYPES_FILE: exit $s"
  if [ "$s" -eq 0 ]; then
    rm -f "$DIR/db-types-drift.diff"
    return 0
  fi
  echo "the regenerated file differs from the committed one; the diff is kept as $DIR/db-types-drift.diff"
  git checkout -- "$TYPES_FILE"
  echo "the committed file is back in place"
  return "$s"
}

# One field of the stack's status on standard input: the value of the line `<NAME>=<value>`, quoted or not.
status_field() { sed -n "s/^$1=\"\{0,1\}\([^\"]*\)\"\{0,1\}\$/\1/p" | head -n 1; }

# The writer integration test with the stack's address and its two keys in that one process's environment.
gate_integration() {
  local status_env api anon service s
  status_env="$(cd apps/supabase && yarn supabase status -o env 2> /dev/null)"
  api="$(printf '%s\n' "$status_env" | status_field API_URL)"
  anon="$(printf '%s\n' "$status_env" | status_field ANON_KEY)"
  service="$(printf '%s\n' "$status_env" | status_field SERVICE_ROLE_KEY)"
  status_env=""
  if [ -z "$api" ] || [ -z "$anon" ] || [ -z "$service" ]; then
    echo "$SELF: could not read the API URL and the two API keys from 'supabase status -o env' -- is the stack up?"
    return 3
  fi
  echo "SUPABASE_URL: $api (the two keys are in the test's environment and are not printed)"
  (
    export SUPABASE_URL="$api"
    export SUPABASE_ANON_KEY="$anon"
    export SUPABASE_SERVICE_ROLE_KEY="$service"
    export CONTESTANT_WRITER_INTEGRATION_REQUIRED=1
    yarn workspace @openvaa/frontend vitest run supabaseDataWriter.integration --reporter=default --reporter=json --outputFile="$REPO_ROOT/$DIR/integration.json"
  )
  s=$?
  anon=""
  service=""
  return "$s"
}

for r in $ROWS; do
  case "$r" in
    typecheck) run_gate typecheck yarn typecheck ;;
    lint) run_gate lint yarn lint:check ;;
    db-reset) run_gate db-reset yarn db:reset ;;
    types-regen) run_gate types-regen gate_types_regen ;;
    types-clean) run_gate types-clean gate_types_clean ;;
    pgtap) run_gate pgtap yarn workspace @openvaa/supabase test:db ;;
    sql-lint) run_gate sql-lint yarn db:lint:sql ;;
    integration) run_gate integration gate_integration ;;
    unit) run_gate unit yarn test:unit ;;
    check-frontend) run_gate check-frontend yarn workspace @openvaa/frontend check ;;
    build) run_gate build yarn build ;;
    format) run_gate format yarn format:check ;;
    docs-links) run_gate docs-links yarn workspace @openvaa/docs validate:links --check ;;
  esac
done

END_LOCAL="$(date '+%F %T')"
echo "ended: $(date -u +%FT%TZ)" >> "$DIR/env.txt"
{
  echo "ended_local: $END_LOCAL"
  echo "--- pmset -g batt (end)"
  pmset -g batt 2>&1 || echo "(pmset unavailable)"
  echo "--- pmset -g log, Sleep / Wake / DarkWake entries inside the run window"
  pmset -g log 2> /dev/null | grep -E "^.{26}(Sleep|Wake|DarkWake) " |
    awk -v a="$START_LOCAL" -v b="$END_LOCAL" '{ t = substr($0, 1, 19); if (t >= a && t <= b) print }' > "$DIR/power-window.txt"
  cat "$DIR/power-window.txt"
  SLEEPS="$(grep -c -E "^.{26}Sleep " "$DIR/power-window.txt")"
  echo "sleep_entries_in_window: $SLEEPS"
} >> "$DIR/power.txt"
rm -f "$DIR/power-window.txt"

echo "---- $DIR/summary.tsv"
cat "$DIR/summary.tsv"
exit "$FAILED"
