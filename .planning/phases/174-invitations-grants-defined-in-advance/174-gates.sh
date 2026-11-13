#!/usr/bin/env bash
#
# 174-gates.sh -- the Phase 174 gate set, one row per gate, each status read directly.
#
# Usage (PD = .planning/phases/174-invitations-grants-defined-in-advance):
#   bash PD/174-gates.sh <label> [--rows <comma-separated row names>]
# Never in the foreground: start it in the background and poll the marker, as the plans' <long_gates> block says.
#
# Fifteen rows by default, in this fixed order, every one with TURBO_FORCE=true in its environment:
#   typecheck            yarn typecheck
#   lint                 yarn lint:check
#   db-reset             yarn db:reset
#   types-regen          yarn db:types
#   types-clean          git diff --exit-code -- packages/supabase-types/src/database.ts
#   pgtap                yarn workspace @openvaa/supabase test:db
#   sql-lint             yarn db:lint:sql
#   unit                 yarn test:unit
#   check-frontend       yarn workspace @openvaa/frontend check
#   build                yarn build
#   format               yarn format:check
#   docs-links           yarn workspace @openvaa/docs validate:links --check
#   name-gate-self-test  node scripts/assert-no-candidate-app-names.mjs --self-test
#   auth-config          node scripts/assert-auth-signup-closed.mjs
#   stack                bash PD/174-stack-probe.sh after
#
# BASE_ROWS is the first thirteen. The last two, auth-config and stack, exist only from plan 174-03 on: the
# gate script of auth-config is written there, and the stack row asserts the auth configuration that plan
# sets. A run made before 174-03 closes names the thirteen with --rows:
#   --rows typecheck,lint,db-reset,types-regen,types-clean,pgtap,sql-lint,unit,check-frontend,build,format,docs-links,name-gate-self-test
#
# With --rows only the named rows run, still in the order above, and rows-expected.txt holds exactly those
# names. An unknown name is a usage error. 174-verdict.mjs never reads a subset run as the full gate set.
#
# The order of the five database rows is fixed: the reset, then the types on the freshly reset database,
# then pgTAP, then the SQL lint. `yarn db:types` describes the APPLIED database, and the pgTAP suite's first
# file commits its helper functions into `public`, where they stay until the next reset; on a database where
# pgTAP has run since the last reset the regenerated file gains the helpers and types-clean is red on a
# correct tree. A subset that names types-regen without db-reset is judged on whatever the database holds.
#
# db-reset DESTROYS local data, the E2E project's rows and the `default` dataset included: run the gate set
# before the E2E run and re-seed with `yarn db:seed:default` at the end. A subset without db-reset resets
# nothing.
#
# Every row runs as `cmd > "$DIR/NN-name.log" 2>&1; s=$?` -- never through a pipe -- and
# `name<TAB>status<TAB>seconds` is appended to summary.tsv. Every row runs even after a red one. Output lands
# under tests/e2e-runs/174-gates/<label>/ (gitignored): env.txt, head (the SHA alone), rows-expected.txt,
# summary.tsv, power.txt (the power source at the start and the end, the host's Sleep entries inside the run
# window and, when there is one, the line that calls the run VOID), one log per row and, as the run's last
# act once the directory is claimed, `done` (its status).
#
# Refusals (exit 2): Node below the engines floor; a working tree with uncommitted changes outside .planning/
# other than the operator's untracked CAND-APP-PLAN.md (gates run on committed trees only); a label that
# already holds a run (evidence is never overwritten; a re-run takes <label>-r2, -r3, ...); with a database
# row selected, a local Supabase stack that `yarn db:status` does not find (start it with `yarn db:start`);
# with db-reset selected, an E2E run in flight (a listener on FRONTEND_PORT, default 5273, or a run directory
# under tests/e2e-runs/ started within ten minutes and not ended), which the reset would destroy.
#
# Exit codes: 0 every row green; 1 at least one row non-zero; 2 usage or precondition error; 130 interrupted.

set -u

SELF="174-gates.sh"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT" || exit 2
PD=".planning/phases/174-invitations-grants-defined-in-advance"

BASE_ROWS="typecheck lint db-reset types-regen types-clean pgtap sql-lint unit check-frontend build format docs-links name-gate-self-test"
ALL_ROWS="$BASE_ROWS auth-config stack"
DB_ROWS="db-reset types-regen types-clean pgtap sql-lint stack"
TYPES_FILE="packages/supabase-types/src/database.ts"

usage() {
  echo "usage: $SELF <label> [--rows <comma-separated row names>]" >&2
  echo "rows: $ALL_ROWS" >&2
  echo "the thirteen rows that exist before plan 174-03: $(printf '%s' "$BASE_ROWS" | tr ' ' ',')" >&2
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
  '' | */* | .* | -*) echo "$SELF: a plain <label> is required (e.g. 174-01-baseline)" >&2; usage ;;
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

DIR="tests/e2e-runs/174-gates/$LABEL"
if [ -e "$DIR" ] && [ -n "$(ls -A "$DIR" 2> /dev/null)" ]; then
  echo "$SELF: $DIR already holds a run; use a new label (e.g. ${LABEL}-r2) so evidence is never overwritten" >&2
  exit 2
fi

if [ "$NEEDS_DB" -eq 1 ]; then
  if ! yarn db:status > /dev/null 2>&1; then
    echo "$SELF: the local Supabase stack is not up (yarn db:status failed) and a database row is selected -- start it with: yarn db:start" >&2
    exit 2
  fi
fi

if has_word "$ROWS" db-reset; then
  PORT="${FRONTEND_PORT:-5273}"
  if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN > /dev/null 2>&1; then
    echo "$SELF: a process listens on port $PORT -- an E2E run is in flight and db-reset destroys the rows it depends on:" >&2
    lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >&2
    exit 2
  fi
  IN_FLIGHT=""
  while IFS= read -r started; do
    [ -n "$started" ] || continue
    if [ ! -f "$(dirname "$started")/ended" ]; then IN_FLIGHT="$IN_FLIGHT $(dirname "$started")"; fi
  done << EOF
$(find tests/e2e-runs -maxdepth 3 -name started -type f -mmin -10 2> /dev/null)
EOF
  if [ -n "$IN_FLIGHT" ]; then
    echo "$SELF: an E2E run started within the last ten minutes and has not ended:$IN_FLIGHT" >&2
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

for r in $ROWS; do
  case "$r" in
    typecheck) run_gate typecheck yarn typecheck ;;
    lint) run_gate lint yarn lint:check ;;
    db-reset) run_gate db-reset yarn db:reset ;;
    types-regen) run_gate types-regen gate_types_regen ;;
    types-clean) run_gate types-clean gate_types_clean ;;
    pgtap) run_gate pgtap yarn workspace @openvaa/supabase test:db ;;
    sql-lint) run_gate sql-lint yarn db:lint:sql ;;
    unit) run_gate unit yarn test:unit ;;
    check-frontend) run_gate check-frontend yarn workspace @openvaa/frontend check ;;
    build) run_gate build yarn build ;;
    format) run_gate format yarn format:check ;;
    docs-links) run_gate docs-links yarn workspace @openvaa/docs validate:links --check ;;
    name-gate-self-test) run_gate name-gate-self-test node scripts/assert-no-candidate-app-names.mjs --self-test ;;
    auth-config) run_gate auth-config node scripts/assert-auth-signup-closed.mjs ;;
    stack) run_gate stack bash "$PD/174-stack-probe.sh" after ;;
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
  if [ "$SLEEPS" -gt 0 ]; then echo "the host was suspended during this run: the run is VOID, not red -- make it again under ${LABEL}-r2"; fi
} >> "$DIR/power.txt"
rm -f "$DIR/power-window.txt"

echo "---- $DIR/summary.tsv"
cat "$DIR/summary.tsv"
exit "$FAILED"
