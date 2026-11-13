#!/usr/bin/env bash
#
# 172-gates.sh -- the Phase 172 static gate set, each status read directly.
#
# Usage (PD = .planning/phases/172-terms-of-use-per-user-and-project):
#   bash PD/172-gates.sh <label>            run the nine gates. Start it in the background and poll --status.
#   bash PD/172-gates.sh --status <label>   returns at once: `absent`, `running` or `done <exit status>`
#   bash PD/172-gates.sh --judge <label>    re-read the newest attempt; exit 0 only on nine rows, every status 0
#   bash PD/172-gates.sh --path <label>     print the newest attempt's directory and nothing else
#
# Nine rows, in this order, every one with TURBO_FORCE=true in its environment:
#   01-lint          yarn lint:check
#   02-types-regen   yarn db:reset, then yarn db:types
#   03-types-clean   git diff --exit-code -- packages/supabase-types/src/database.ts
#   04-sql-lint      yarn db:lint:sql
#   05-pgtap         yarn workspace @openvaa/supabase test:db
#   06-unit          yarn test:unit
#   07-svelte-check  yarn workspace @openvaa/frontend check
#   08-build         yarn build
#   09-format        yarn format:check
#
# Why row 02 resets the database first. `yarn db:types` describes the APPLIED database, and the pgTAP suite's
# first file (00-helpers.test.sql) COMMITs its helper functions into `public`, where they stay until the next
# reset. Row 05 of every run therefore leaves a database on which the next run's row 03 is red on a correct
# tree: measured before this script's first run, the regenerated file gained 18 lines, every one a test helper
# (create_test_data, set_test_user, test_id, ...). The reset also makes rows 04 and 05 judge the schema of the
# tree, not whatever schema was applied last. It DESTROYS local data, the E2E project's rows included; the next
# E2E run's global setup recreates those.
#
# Row 03 keeps a drift as db-types-drift.diff in the attempt's directory. When the generated file was
# unmodified at the start of the run, the committed file is then put back, so the rows after it judge the
# committed tree; a file that was already modified at the start is left as it is.
#
# Every row runs as `cmd > "$DIR/<NN-name>.log" 2>&1; s=$?` -- never through a pipe -- and
# `<NN-name><TAB>status<TAB>seconds` is appended to summary.tsv. Every row runs even after a red one.
#
# Attempts. A run lands in tests/e2e-runs/172-gates/<label>/ (gitignored). When that directory exists the run
# takes <label>-r2, -r3, ..., so no evidence is overwritten and a rerun keeps its label. --status, --judge and
# --path read the newest attempt. The run's last act, on every exit path, is writing the file `done` (its exit
# status) into the attempt's directory. The directory also holds env.txt (label, UTC start, head, porcelain
# line count), head (the SHA alone), summary.tsv and one log per row.
#
# Refusals of a run (exit 2, with `done` written): Node below the engines floor; a listener on the E2E
# wrapper's port (FRONTEND_PORT, default 5273) or a run directory under tests/e2e-runs/ that started within
# the last ten minutes and has not ended -- an E2E run is in flight, and row 02 would destroy the state it
# depends on.
#
# Exit codes of a run: 0 every row green; 1 at least one row non-zero; 2 usage or precondition error;
# 130 interrupted.

set -u

SELF="172-gates.sh"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT" || exit 2

# Node: the pinned v24.21.0 when it is installed, else the newest version at or above 24.15 under nvm. A
# non-interactive shell's default node on this host is below the engines floor.
NVM_NODE_DIR="$HOME/.nvm/versions/node"
if [ -d "$NVM_NODE_DIR/v24.21.0/bin" ]; then
  export PATH="$NVM_NODE_DIR/v24.21.0/bin:$PATH"
elif [ -d "$NVM_NODE_DIR" ]; then
  PICK="$(ls "$NVM_NODE_DIR" | sed 's/^v//' | awk -F. '($1 > 24) || ($1 == 24 && $2 >= 15)' | sort -t. -k1,1n -k2,2n -k3,3n | tail -n 1)"
  if [ -n "$PICK" ]; then export PATH="$NVM_NODE_DIR/v$PICK/bin:$PATH"; fi
fi

ROOT="tests/e2e-runs/172-gates"
EXPECTED_ROWS="01-lint 02-types-regen 03-types-clean 04-sql-lint 05-pgtap 06-unit 07-svelte-check 08-build 09-format"
TYPES_FILE="packages/supabase-types/src/database.ts"

usage() {
  echo "usage: $SELF <label> | --status <label> | --judge <label> | --path <label>" >&2
  exit 2
}

# A label is a plain name that cannot be mistaken for an attempt directory of another label.
check_label() {
  case "$1" in
    '' | */* | .* | -*) echo "$SELF: label '$1' must be a plain name" >&2; exit 2 ;;
  esac
  if printf '%s' "$1" | grep -Eq -- '-r[0-9]+$'; then
    echo "$SELF: label '$1' ends like an attempt directory (-rN); choose another" >&2
    exit 2
  fi
}

# Prints the newest attempt directory of a label, or nothing when the label has none.
newest_attempt() {
  local label="$1" best="" top=1 d k
  if [ -d "$ROOT/$label" ]; then best="$ROOT/$label"; fi
  for d in "$ROOT/$label"-r*; do
    [ -d "$d" ] || continue
    k="${d##*-r}"
    case "$k" in '' | *[!0-9]*) continue ;; esac
    if [ "$k" -gt "$top" ]; then
      top="$k"
      best="$d"
    fi
  done
  printf '%s' "$best"
}

# Creates and prints the next free attempt directory of a label.
claim_attempt() {
  local label="$1" n=2 dir="$ROOT/$1"
  mkdir -p "$ROOT" || return 1
  if mkdir "$dir" 2> /dev/null; then
    printf '%s' "$dir"
    return 0
  fi
  while [ "$n" -le 99 ]; do
    dir="$ROOT/$label-r$n"
    if mkdir "$dir" 2> /dev/null; then
      printf '%s' "$dir"
      return 0
    fi
    n=$((n + 1))
  done
  return 1
}

MODE="run"
case "${1:-}" in
  --status | --judge | --path)
    MODE="${1#--}"
    shift
    ;;
  --*) usage ;;
esac
if [ $# -ne 1 ]; then usage; fi
LABEL="$1"
check_label "$LABEL"

if [ "$MODE" = "status" ]; then
  D="$(newest_attempt "$LABEL")"
  if [ -z "$D" ]; then
    echo "absent"
  elif [ -f "$D/done" ]; then
    echo "done $(cat "$D/done")"
  else
    echo "running"
  fi
  exit 0
fi

if [ "$MODE" = "path" ]; then
  D="$(newest_attempt "$LABEL")"
  if [ -z "$D" ]; then exit 1; fi
  echo "$D"
  exit 0
fi

if [ "$MODE" = "judge" ]; then
  D="$(newest_attempt "$LABEL")"
  if [ -z "$D" ]; then
    echo "$SELF: label '$LABEL' has no attempt under $ROOT" >&2
    exit 1
  fi
  echo "$D"
  if [ -f "$D/env.txt" ]; then grep -E '^(head|porcelain_lines):' "$D/env.txt"; fi
  if [ ! -f "$D/summary.tsv" ]; then
    echo "$SELF: $D holds no summary.tsv" >&2
    exit 1
  fi
  cat "$D/summary.tsv"
  NAMES="$(cut -f1 "$D/summary.tsv" | tr '\n' ' ' | sed 's/ $//')"
  RED="$(awk -F'\t' '$2 != "0"' "$D/summary.tsv" | wc -l | tr -d ' ')"
  if [ "$NAMES" != "$EXPECTED_ROWS" ]; then
    echo "$SELF: expected the nine rows '$EXPECTED_ROWS', found '$NAMES'" >&2
    exit 1
  fi
  if [ "$RED" -ne 0 ]; then
    echo "$SELF: $RED row(s) are not 0" >&2
    exit 1
  fi
  echo "$SELF: nine rows, every status 0"
  exit 0
fi

# ---- a run -------------------------------------------------------------------------------------------------

DIR="$(claim_attempt "$LABEL")"
if [ -z "$DIR" ]; then
  echo "$SELF: could not create an attempt directory for '$LABEL' under $ROOT" >&2
  exit 2
fi
on_exit() {
  local s=$?
  printf '%s\n' "$s" > "$DIR/done"
  exit "$s"
}
trap on_exit EXIT
trap 'exit 130' INT TERM

if ! node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>24||(a===24&&b>=15)?0:1)' 2> /dev/null; then
  echo "$SELF: node $(node -v 2> /dev/null || echo '(none)') is below the engines floor 24.15.0 and $NVM_NODE_DIR holds no version at or above it" >&2
  exit 2
fi

# Row 02 resets the database, which would destroy the state an E2E run in flight depends on.
PORT="${FRONTEND_PORT:-5273}"
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN > /dev/null 2>&1; then
  echo "$SELF: a process listens on port $PORT -- an E2E run is in flight and row 02 resets the database:" >&2
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

export TURBO_FORCE=true
: > "$DIR/summary.tsv"
git rev-parse HEAD > "$DIR/head"
{
  echo "label: $LABEL"
  echo "attempt: $DIR"
  echo "started: $(date -u +%FT%TZ)"
  echo "head: $(cat "$DIR/head")"
  echo "porcelain_lines: $(git status --porcelain | grep -c -v -x '?? CAND-APP-PLAN.md')"
  echo "node: $(node -v)"
  echo "yarn: $(yarn --version)"
  echo "TURBO_FORCE: $TURBO_FORCE"
} > "$DIR/env.txt"

TYPES_CLEAN_AT_START=0
if git diff --quiet -- "$TYPES_FILE"; then TYPES_CLEAN_AT_START=1; fi

FAILED=0
run_gate() {
  local name="$1"
  shift
  local t0 t1 s
  t0=$(date +%s)
  echo "$SELF [$LABEL] $name: $*"
  "$@" > "$DIR/$name.log" 2>&1
  s=$?
  t1=$(date +%s)
  printf '%s\t%s\t%s\n' "$name" "$s" "$((t1 - t0))" >> "$DIR/summary.tsv"
  echo "$SELF [$LABEL] $name: exit $s ($((t1 - t0))s)"
  if [ "$s" -ne 0 ]; then FAILED=1; fi
}

# The types are regenerated from a freshly reset database. `yarn db:types` redirects into the generated file,
# so a failed generation leaves it truncated; an unmodified file is then put back.
gate_types_regen() {
  local s
  yarn db:reset
  s=$?
  echo "yarn db:reset: exit $s"
  if [ "$s" -ne 0 ]; then return "$s"; fi
  yarn db:types
  s=$?
  echo "yarn db:types: exit $s"
  if [ "$s" -ne 0 ] && [ "$TYPES_CLEAN_AT_START" -eq 1 ]; then
    git checkout -- "$TYPES_FILE"
    echo "the generation failed; the committed file is back in place"
  fi
  return "$s"
}

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
  echo "the regenerated file differs from the index; the diff is kept as $DIR/db-types-drift.diff"
  if [ "$TYPES_CLEAN_AT_START" -eq 1 ]; then
    git checkout -- "$TYPES_FILE"
    echo "the file was unmodified at the start of the run; the committed file is back in place"
  else
    echo "the file was already modified at the start of the run; it is left as it is"
  fi
  return "$s"
}

run_gate 01-lint yarn lint:check
run_gate 02-types-regen gate_types_regen
run_gate 03-types-clean gate_types_clean
run_gate 04-sql-lint yarn db:lint:sql
run_gate 05-pgtap yarn workspace @openvaa/supabase test:db
run_gate 06-unit yarn test:unit
run_gate 07-svelte-check yarn workspace @openvaa/frontend check
run_gate 08-build yarn build
run_gate 09-format yarn format:check

echo "ended: $(date -u +%FT%TZ)" >> "$DIR/env.txt"
echo "---- $DIR/summary.tsv"
cat "$DIR/summary.tsv"
exit "$FAILED"
