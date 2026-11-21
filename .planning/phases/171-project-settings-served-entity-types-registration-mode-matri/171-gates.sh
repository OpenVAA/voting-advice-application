#!/usr/bin/env bash
#
# 171-gates.sh -- the Phase 171 closing gate set, each status read directly.
#
# Usage: bash .planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-gates.sh <label>
#
# Thirteen rows, in order, every one with TURBO_FORCE=true in its environment:
#   01-build             yarn build (the production build of every workspace, the frontend included)
#   02-typecheck         yarn typecheck, then yarn typecheck:tests
#   03-lint              yarn lint:check
#   04-format            yarn format:check
#   05-check-frontend    yarn workspace @openvaa/frontend check
#   06-check-docs        yarn workspace @openvaa/docs check
#   07-docs-links        yarn workspace @openvaa/docs validate:links --check
#   08-unit              yarn test:unit
#   09-db-reset          yarn db:reset (migrations + seed.sql; destroys the E2E project's rows, which the next
#                        E2E run's global setup recreates)
#   10-db-types-drift    yarn db:types, then packages/supabase-types/src/database.ts unchanged against the index
#   11-pgtap             yarn workspace @openvaa/supabase test:db
#   12-db-lint           yarn db:lint:sql
#   13-seed-default      yarn db:seed:default, then one query that prints `t` only when the default project's
#                        stored settings declare both entity types, every registration mode for both and a
#                        contestantApp.questions member -- rows 09 and 13 together are `yarn db:reset-with-data`
#
# Why the types row comes straight after the reset and before pgTAP. `yarn db:types` describes the APPLIED
# database, and the pgTAP suite's first file (00-helpers.test.sql) COMMITs its helper functions into `public`,
# where they stay until the next reset. Measured in the run labelled 171-04-closing, where the types row ran
# after pgTAP: the regenerated file gained 18 lines, every one a test helper (create_test_data, set_test_user,
# test_id, ...), and the row was red on a tree whose schema and types agree. On a database that has only been
# reset the regenerated file is the committed file. On a drift the row keeps the diff as db-types-drift.diff
# and puts the committed file back, so the rows after it and any run after the set see the committed tree.
#
# Every row runs as `cmd > "$DIR/NN-name.log" 2>&1; s=$?` -- never through a pipe -- and
# `name<TAB>status<TAB>seconds` is appended to summary.tsv. Every row runs even after a red one. Output lands
# under tests/e2e-runs/171-gates/<label>/ (gitignored): env.txt, head (the SHA alone), summary.tsv and one log
# per row.
#
# Guards (exit 2): Node below the engines floor; a working tree with uncommitted changes outside .planning/
# other than the operator's untracked CAND-APP-PLAN.md (gates run on committed trees only); a label that
# already holds a run (evidence is never overwritten; a re-run takes <label>-2, -3, ...); a listener on the
# E2E wrapper's port (FRONTEND_PORT, default 5273), which means a run is in flight that row 09 would destroy.
#
# Exit codes: 0 every row green; 1 at least one row non-zero; 2 usage/precondition error.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT" || exit 2

LABEL="${1:-}"
if [ -z "$LABEL" ] || [ $# -ne 1 ]; then
  echo "usage: 171-gates.sh <label>   (e.g. 171-04-closing)" >&2
  exit 2
fi
case "$LABEL" in
  */* | .* | -*) echo "171-gates.sh: label '$LABEL' must be a plain name" >&2; exit 2 ;;
esac

# Node: the phase's pinned v24.21.0 when it is installed, else the newest version at or above 24.15 under nvm.
NVM_NODE_DIR="$HOME/.nvm/versions/node"
if [ -x "$NVM_NODE_DIR/v24.21.0/bin/node" ]; then
  export PATH="$NVM_NODE_DIR/v24.21.0/bin:$PATH"
elif [ -d "$NVM_NODE_DIR" ]; then
  PICK="$(ls "$NVM_NODE_DIR" | sed 's/^v//' | awk -F. '($1 > 24) || ($1 == 24 && $2 >= 15)' | sort -t. -k1,1n -k2,2n -k3,3n | tail -n 1)"
  if [ -n "$PICK" ]; then export PATH="$NVM_NODE_DIR/v$PICK/bin:$PATH"; fi
fi
if ! node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>24||(a===24&&b>=15)?0:1)'; then
  echo "171-gates.sh: node $(node -v) is below the engines floor 24.15.0" >&2
  exit 2
fi

# Gates run on committed trees only.
DIRTY="$(git status --porcelain -- . ':(exclude).planning' | grep -v -x '?? CAND-APP-PLAN.md')"
if [ -n "$DIRTY" ]; then
  echo "171-gates.sh: the working tree has uncommitted changes outside .planning/:" >&2
  printf '%s\n' "$DIRTY" >&2
  exit 2
fi

# A listener on the wrapper's port is an E2E run in flight; row 09 would destroy the state it depends on.
PORT="${FRONTEND_PORT:-5273}"
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN > /dev/null 2>&1; then
  echo "171-gates.sh: a process listens on port $PORT -- an E2E run is in flight; the gate set resets the database:" >&2
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >&2
  exit 2
fi

DIR="tests/e2e-runs/171-gates/$LABEL"
if [ -e "$DIR/summary.tsv" ]; then
  echo "171-gates.sh: $DIR already holds a run; use a new label (e.g. ${LABEL}-2) so evidence is never overwritten" >&2
  exit 2
fi

export TURBO_FORCE=true
mkdir -p "$DIR"
: > "$DIR/summary.tsv"
git rev-parse HEAD > "$DIR/head"
{
  echo "label: $LABEL"
  echo "started: $(date -u +%FT%TZ)"
  echo "node: $(node -v)"
  echo "yarn: $(yarn --version)"
  echo "head: $(cat "$DIR/head")"
  echo "TURBO_FORCE: $TURBO_FORCE"
} > "$DIR/env.txt"

FAILED=0
N=0
run_gate() {
  local name="$1"
  shift
  N=$((N + 1))
  local log t0 t1 s
  log="$DIR/$(printf '%02d' "$N")-$name.log"
  t0=$(date +%s)
  echo "171-gates.sh [$LABEL] $name: $*"
  "$@" > "$log" 2>&1
  s=$?
  t1=$(date +%s)
  printf '%s\t%s\t%s\n' "$name" "$s" "$((t1 - t0))" >> "$DIR/summary.tsv"
  echo "171-gates.sh [$LABEL] $name: exit $s ($((t1 - t0))s)"
  if [ "$s" -ne 0 ]; then FAILED=1; fi
}

gate_typecheck() {
  local s
  yarn typecheck
  s=$?
  echo "yarn typecheck: exit $s"
  if [ "$s" -ne 0 ]; then return "$s"; fi
  yarn typecheck:tests
  s=$?
  echo "yarn typecheck:tests: exit $s"
  return "$s"
}

# The generated types are regenerated from the applied database and must equal the committed file.
gate_db_types_drift() {
  local s
  yarn db:types
  s=$?
  echo "yarn db:types: exit $s"
  if [ "$s" -ne 0 ]; then return "$s"; fi
  git diff --stat -- packages/supabase-types/
  git diff --quiet -- packages/supabase-types/src/database.ts
  s=$?
  echo "packages/supabase-types/src/database.ts unchanged against the index: exit $s"
  if [ "$s" -ne 0 ]; then
    git diff -- packages/supabase-types/src/database.ts > "$DIR/db-types-drift.diff"
    git checkout -- packages/supabase-types/src/database.ts
    echo "the regenerated file differed; the diff is kept as $DIR/db-types-drift.diff and the committed file is back in place"
  fi
  return "$s"
}

# The same database `apps/supabase/scripts/lint-schema.mjs` connects to by default.
DATABASE_URL_DEFAULT="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
DB_CONTAINER="supabase_db_openvaa-local"
DEFAULT_PROJECT_ID="00000000-0000-0000-0000-000000000001"
SEEDED_QUERY="SELECT (settings->'contestantApp'->'entityTypes' = '[\"candidate\",\"organization\"]'::jsonb)
   AND (settings->'contestantApp'->'registrationModes' = '{\"candidate\":[\"identity_provider\",\"email\",\"code\"],\"organization\":[\"identity_provider\",\"email\",\"code\"]}'::jsonb)
   AND (settings->'contestantApp' ? 'questions')
  FROM public.app_settings WHERE project_id = '$DEFAULT_PROJECT_ID';"

# `yarn db:seed:default` after row 09's reset is `yarn db:reset-with-data`; the stored row is then read back.
gate_seed_default() {
  local s out
  yarn db:seed:default
  s=$?
  echo "yarn db:seed:default: exit $s"
  if [ "$s" -ne 0 ]; then return "$s"; fi
  if command -v psql > /dev/null 2>&1; then
    echo "reading the stored row with psql on the PATH"
    out="$(psql "${DATABASE_URL:-$DATABASE_URL_DEFAULT}" -At -v ON_ERROR_STOP=1 -c "$SEEDED_QUERY" 2>&1)"
    s=$?
  else
    echo "psql is not on the PATH; reading the stored row with the database container's own psql"
    out="$(docker exec "$DB_CONTAINER" psql -U postgres -d postgres -At -v ON_ERROR_STOP=1 -c "$SEEDED_QUERY" 2>&1)"
    s=$?
  fi
  echo "query exit $s; output: '$out'"
  if [ "$s" -ne 0 ]; then return "$s"; fi
  echo "the default project's stored contestantApp root:"
  if command -v psql > /dev/null 2>&1; then
    psql "${DATABASE_URL:-$DATABASE_URL_DEFAULT}" -At -c "SELECT settings->'contestantApp' FROM public.app_settings WHERE project_id = '$DEFAULT_PROJECT_ID';" 2>&1
  else
    docker exec "$DB_CONTAINER" psql -U postgres -d postgres -At -c "SELECT settings->'contestantApp' FROM public.app_settings WHERE project_id = '$DEFAULT_PROJECT_ID';" 2>&1
  fi
  [ "$out" = "t" ]
}

run_gate build yarn build
run_gate typecheck gate_typecheck
run_gate lint yarn lint:check
run_gate format yarn format:check
run_gate check-frontend yarn workspace @openvaa/frontend check
run_gate check-docs yarn workspace @openvaa/docs check
run_gate docs-links yarn workspace @openvaa/docs validate:links --check
run_gate unit yarn test:unit
run_gate db-reset yarn db:reset
run_gate db-types-drift gate_db_types_drift
run_gate pgtap yarn workspace @openvaa/supabase test:db
run_gate db-lint yarn db:lint:sql
run_gate seed-default gate_seed_default

echo "ended: $(date -u +%FT%TZ)" >> "$DIR/env.txt"
echo "---- $DIR/summary.tsv"
cat "$DIR/summary.tsv"
exit "$FAILED"
