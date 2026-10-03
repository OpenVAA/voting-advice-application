#!/usr/bin/env bash
#
# 169-gates.sh -- the Phase 169 per-group gate set (D-26), twelve gates, each status read directly.
#
# Usage: bash .planning/phases/169-dependency-bump-to-latest-safe-versions/169-gates.sh <label>
#
# Every gate runs with TURBO_FORCE=true (turbo does not hash the Node version or the shared ESLint/TS base
# configs, so a cached green could be replayed). Each gate is run as `cmd > "$DIR/NN-name.log" 2>&1; s=$?` --
# never through a pipe -- and `name<TAB>status<TAB>seconds` is appended to summary.tsv. Every gate runs even
# after a red. Logs land under tests/e2e-runs/169-gates/<label>/ (gitignored).
#
# Exit codes: 0 all twelve gates green; 1 at least one gate non-zero; 2 usage/precondition error.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT" || exit 2

LABEL="${1:-}"
if [ -z "$LABEL" ]; then
  echo "169-gates.sh: a <label> is required (e.g. 169-01-baseline)" >&2
  exit 2
fi
case "$LABEL" in
  */* | .* ) echo "169-gates.sh: label '$LABEL' must be a plain name" >&2; exit 2 ;;
esac

BASE_REV_FILE=".planning/phases/168-docs-site-rewrite-strapi-to-supabase/gate-evidence/base-rev.txt"
COMPONENT_BASE_FILE=".planning/phases/168-docs-site-rewrite-strapi-to-supabase/gate-evidence/component-base-rev.txt"
if [ ! -s "$BASE_REV_FILE" ]; then
  echo "169-gates.sh: $BASE_REV_FILE is missing -- the 168 docs gates cannot be anchored" >&2
  exit 2
fi
if [ ! -s "$COMPONENT_BASE_FILE" ]; then
  echo "169-gates.sh: $COMPONENT_BASE_FILE is missing -- the 168 docs gates cannot be anchored" >&2
  exit 2
fi
for script in validate:links check:research-quotes; do
  if ! node -e 'const s=require("./apps/docs/package.json").scripts||{};process.exit(s[process.argv[1]]?0:1)' "$script"; then
    echo "169-gates.sh: apps/docs/package.json has no '$script' script" >&2
    exit 2
  fi
done
BASE_REV="$(cat "$BASE_REV_FILE")"
COMPONENT_BASE="$(cat "$COMPONENT_BASE_FILE")"

export TURBO_FORCE=true

DIR="tests/e2e-runs/169-gates/$LABEL"
mkdir -p "$DIR"
: > "$DIR/summary.tsv"
{
  echo "label: $LABEL"
  echo "started: $(date -u +%FT%TZ)"
  echo "node: $(node -v)"
  echo "yarn: $(yarn --version)"
  echo "head: $(git rev-parse HEAD)"
  echo "porcelain_lines: $(git status --porcelain | wc -l | tr -d ' ')"
  echo "TURBO_FORCE: $TURBO_FORCE"
} > "$DIR/env.txt"

FAILED=0
run_gate() {
  local name="$1"
  shift
  local t0 t1 s
  t0=$(date +%s)
  echo "169-gates.sh [$LABEL] $name: $*"
  "$@" > "$DIR/$name.log" 2>&1
  s=$?
  t1=$(date +%s)
  printf '%s\t%s\t%s\n' "$name" "$s" "$((t1 - t0))" >> "$DIR/summary.tsv"
  echo "169-gates.sh [$LABEL] $name: exit $s ($((t1 - t0))s)"
  if [ "$s" -ne 0 ]; then FAILED=1; fi
}

run_gate 01-install yarn install --immutable
run_gate 02-dedupe yarn dedupe --check
run_gate 03-typecheck yarn typecheck
run_gate 04-lint yarn lint:check
run_gate 05-format yarn format:check
run_gate 06-check-frontend yarn workspace @openvaa/frontend check
run_gate 07-check-docs yarn workspace @openvaa/docs check
run_gate 08-unit yarn test:unit
run_gate 09-build yarn build
run_gate 10-audit yarn audit:deps
run_gate 11-docs-links yarn workspace @openvaa/docs validate:links --check
run_gate 12-docs-rq yarn workspace @openvaa/docs check:research-quotes --base "$BASE_REV" --component-base "$COMPONENT_BASE"

echo "ended: $(date -u +%FT%TZ)" >> "$DIR/env.txt"
echo "---- $DIR/summary.tsv"
cat "$DIR/summary.tsv"
exit "$FAILED"
