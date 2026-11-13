#!/usr/bin/env bash
#
# 170-gates.sh -- the Phase 170 per-plan gate set, each status read directly.
#
# Usage: bash .planning/phases/170-contestant-app-rename-symbols-routes/170-gates.sh <label> --plan <0|1|2|3|4> [--db]
#
# Rows (always): build, typecheck, lint, format, check-frontend, check-docs, unit, build-frontend, build-docs,
#   docs-links, skill-links. For plans 1 to 3 the docs-links row sets aside github-path findings located in
#   the two generated docs subtrees, which stay stale until plan 4 regenerates them; see gate_docs_links.
# With --plan 1 or higher, three more: idempotent (rename.mjs --check --plan N), residue (the search gate's
#   --report --only output for the groups of plans 1..N, minus lines under the two generated docs subtrees
#   while N is below 4; status 1 if any line remains), exemptions (170-verdict.mjs exemptions).
# With --db, two more: pgtap, sql-lint (both need the local Supabase stack up).
#
# Every row runs with TURBO_FORCE=true, as `cmd > "$DIR/NN-name.log" 2>&1; s=$?` -- never through a pipe --
# and `name<TAB>status<TAB>seconds` is appended to summary.tsv. Every row runs even after a red one. Output
# lands under tests/e2e-runs/170-gates/<label>/ (gitignored): env.txt, head (the SHA alone),
# rows-expected.txt, summary.tsv and one log per row.
#
# Guards (exit 2): Node below the engines floor; a working tree with uncommitted changes outside .planning/
# other than the operator's untracked CAND-APP-PLAN.md (gates run on committed trees only); a label that
# already holds a run (evidence is never overwritten; a re-run takes <label>-r2, -r3, ...).
#
# Exit codes: 0 every row green; 1 at least one row non-zero; 2 usage/precondition error.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT" || exit 2
PD=".planning/phases/170-contestant-app-rename-symbols-routes"

LABEL="${1:-}"
shift || true
PLAN=""
DB=0
while [ $# -gt 0 ]; do
  case "$1" in
    --plan)
      if [ $# -lt 2 ]; then echo "170-gates.sh: --plan requires a value" >&2; exit 2; fi
      PLAN="$2"
      shift 2
      ;;
    --db) DB=1; shift ;;
    *) echo "170-gates.sh: unexpected argument '$1'" >&2; exit 2 ;;
  esac
done
if [ -z "$LABEL" ]; then
  echo "170-gates.sh: a <label> is required (e.g. 170-01-baseline)" >&2
  exit 2
fi
case "$LABEL" in
  */* | .* | -*) echo "170-gates.sh: label '$LABEL' must be a plain name" >&2; exit 2 ;;
esac
case "$PLAN" in
  0 | 1 | 2 | 3 | 4) ;;
  *) echo "170-gates.sh: --plan <0|1|2|3|4> is required" >&2; exit 2 ;;
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
  echo "170-gates.sh: node $(node -v) is below the engines floor 24.15.0" >&2
  exit 2
fi

# Gates run on committed trees only.
DIRTY="$(git status --porcelain -- . ':(exclude).planning' | grep -v -x '?? CAND-APP-PLAN.md')"
if [ -n "$DIRTY" ]; then
  echo "170-gates.sh: the working tree has uncommitted changes outside .planning/:" >&2
  printf '%s\n' "$DIRTY" >&2
  exit 2
fi

BASELINE_FILE="$PD/evidence/skill-links-baseline.txt"
if [ ! -s "$BASELINE_FILE" ]; then
  echo "170-gates.sh: $BASELINE_FILE is missing -- the skill-links row has nothing to compare with" >&2
  exit 2
fi

DIR="tests/e2e-runs/170-gates/$LABEL"
if [ -e "$DIR/summary.tsv" ]; then
  echo "170-gates.sh: $DIR already holds a run; use a new label (e.g. ${LABEL}-r2) so evidence is never overwritten" >&2
  exit 2
fi

export TURBO_FORCE=true
mkdir -p "$DIR"
: > "$DIR/summary.tsv"
git rev-parse HEAD > "$DIR/head"
{
  echo "label: $LABEL"
  echo "plan: $PLAN"
  echo "db: $DB"
  echo "started: $(date -u +%FT%TZ)"
  echo "node: $(node -v)"
  echo "yarn: $(yarn --version)"
  echo "head: $(cat "$DIR/head")"
  echo "TURBO_FORCE: $TURBO_FORCE"
} > "$DIR/env.txt"

ROWS="build typecheck lint format check-frontend check-docs unit build-frontend build-docs docs-links skill-links"
if [ "$PLAN" -ge 1 ]; then ROWS="$ROWS idempotent residue exemptions"; fi
if [ "$DB" -eq 1 ]; then ROWS="$ROWS pgtap sql-lint"; fi
printf '%s\n' $ROWS > "$DIR/rows-expected.txt"

FAILED=0
N=0
run_gate() {
  local name="$1"
  shift
  N=$((N + 1))
  local log t0 t1 s
  log="$DIR/$(printf '%02d' "$N")-$name.log"
  t0=$(date +%s)
  echo "170-gates.sh [$LABEL] $name: $*"
  "$@" > "$log" 2>&1
  s=$?
  t1=$(date +%s)
  printf '%s\t%s\t%s\n' "$name" "$s" "$((t1 - t0))" >> "$DIR/summary.tsv"
  echo "170-gates.sh [$LABEL] $name: exit $s ($((t1 - t0))s)"
  if [ "$s" -ne 0 ]; then FAILED=1; fi
}

# The dangling-citation count never rises above its recorded baseline, and the components skill stays clean.
gate_skill_links() {
  local baseline out dangling s
  baseline="$(tr -d '[:space:]' < "$BASELINE_FILE")"
  out="$(bash .claude/scripts/audit-skill-links.sh 2>&1)"
  printf '%s\n' "$out" | tail -n 6
  dangling="$(printf '%s\n' "$out" | sed -n 's/.*Dangling: \([0-9][0-9]*\).*/\1/p' | tail -n 1)"
  echo "dangling: ${dangling:-?} (baseline $baseline)"
  case "$dangling" in
    '' | *[!0-9]*) echo "could not read a Dangling: count"; return 1 ;;
  esac
  if [ "$dangling" -gt "$baseline" ]; then echo "the dangling count rose above its baseline"; return 1; fi
  bash .claude/scripts/audit-skill-links.sh components
  s=$?
  echo "audit-skill-links.sh components: exit $s"
  return "$s"
}

# The docs link validator. With --plan 0 or 4 its own exit status is the row's status. For plans 1 to 3 the
# two generated docs subtrees are stale by design (they are regenerated in plan 170-04), and their source
# links name files the rename has moved: a github-path finding located in a file under either subtree is set
# aside and counted. Any other finding -- another class, or any file outside the two subtrees -- fails the row.
gate_docs_links() {
  local raw s all aside total
  raw="$DIR/docs-links.raw.txt"
  yarn workspace @openvaa/docs validate:links --check > "$raw" 2>&1
  s=$?
  cat "$raw"
  echo "validate:links --check: exit $s"
  if [ "$s" -eq 0 ]; then return 0; fi
  if [ "$s" -ne 1 ] || [ "$PLAN" -eq 0 ] || [ "$PLAN" -ge 4 ]; then return "$s"; fi
  all="$(grep -c -E '^  \[[a-z-]+\] ' "$raw")"
  aside="$(grep -c -E '^  \[github-path\] apps/docs/src/routes/\(content\)/developers-guide/frontend/(components|routing)/generated/' "$raw")"
  total="$(sed -n 's/^Total findings: \([0-9][0-9]*\)$/\1/p' "$raw" | tail -n 1)"
  echo "docs-links: $all finding(s), of which $aside github-path finding(s) under the generated docs subtrees set aside until plan 4 (validator total: ${total:-?})"
  if [ -z "$total" ] || [ "$total" -ne "$all" ]; then echo "the finding lines do not add up to the validator's total"; return 1; fi
  [ "$all" -eq "$aside" ]
}

# The search gate's findings for the groups of plans 1..N. Until plan 4 regenerates them, the two generated
# docs subtrees are stale by design and their lines are counted separately.
gate_residue() {
  local groups raw s kept generated
  case "$PLAN" in
    1) groups="symbols" ;;
    2) groups="symbols,urls" ;;
    3) groups="symbols,urls,tests" ;;
    *) groups="symbols,urls,tests,prose" ;;
  esac
  raw="$DIR/residue.raw.txt"
  node scripts/assert-no-candidate-app-names.mjs --report --only "$groups" > "$raw"
  s=$?
  if [ "$s" -ne 0 ]; then echo "the search gate exited $s in report mode"; return 1; fi
  if [ "$PLAN" -lt 4 ]; then
    grep -v -E '^apps/docs/src/routes/\(content\)/developers-guide/frontend/(components|routing)/generated/' "$raw" > "$DIR/residue.txt"
  else
    cp "$raw" "$DIR/residue.txt"
  fi
  kept="$(wc -l < "$DIR/residue.txt" | tr -d ' ')"
  generated="$(($(wc -l < "$raw" | tr -d ' ') - kept))"
  cat "$DIR/residue.txt"
  echo "residue: groups $groups; $kept finding(s) remain; $generated line(s) under the generated docs subtrees set aside"
  [ "$kept" -eq 0 ]
}

run_gate build yarn build
run_gate typecheck yarn typecheck
run_gate lint yarn lint:check
run_gate format yarn format:check
run_gate check-frontend yarn workspace @openvaa/frontend check
run_gate check-docs yarn workspace @openvaa/docs check
run_gate unit yarn test:unit
run_gate build-frontend yarn workspace @openvaa/frontend build
run_gate build-docs yarn workspace @openvaa/docs build
run_gate docs-links gate_docs_links
run_gate skill-links gate_skill_links
if [ "$PLAN" -ge 1 ]; then
  run_gate idempotent node "$PD/rename.mjs" --check --plan "$PLAN"
  run_gate residue gate_residue
  run_gate exemptions node "$PD/170-verdict.mjs" exemptions
fi
if [ "$DB" -eq 1 ]; then
  run_gate pgtap yarn workspace @openvaa/supabase test:db
  run_gate sql-lint yarn db:lint:sql
fi

echo "ended: $(date -u +%FT%TZ)" >> "$DIR/env.txt"
echo "---- $DIR/summary.tsv"
cat "$DIR/summary.tsv"
exit "$FAILED"
