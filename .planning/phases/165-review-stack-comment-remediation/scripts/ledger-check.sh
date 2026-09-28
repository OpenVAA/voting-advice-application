#!/usr/bin/env bash
#
# ledger-check.sh -- completeness and disposition-vocabulary gate over 165-LEDGER.md.
#
# Usage:
#   ledger-check.sh [--final] [--ledger <path>]
#
#   --final          Also fail on any `pending` cell in the inline table, on a `fix` row whose Commit
#                    cell names no commit reachable from HEAD, and when `scripts/tip-proofs.sh`
#                    (written by plan 165-02) is missing or exits non-zero.
#   --ledger <path>  Check another copy of the ledger (used to observe the gate red on a scratch
#                    copy). Default: 165-LEDGER.md in the phase directory.
#
# The EXPECTED id set is derived at run time from the `^### C-[0-9]+` headings of
# 165-REVIEW-COMMENTS.md, never from a stored list. The ACTUAL set is every row of the ledger's
# inline table whose first cell carries a `C-` id. Always checked:
#   - the two sets are equal (each missing and each extra id is named)
#   - no id appears twice
#   - every disposition is one of fix, split-artifact, already-fixed, deferred, wont-fix
#   - every owner plan `165-NN` has a `165-NN-PLAN.md` in the phase directory
#   - the review-body appendix has one row per `## PR #` header of the inventory (12)
#
# Prints one summary line with the counts per disposition.
#
# Exit codes:
#   0  every check passed
#   1  at least one check failed (each failure is named)
#   2  usage error or unreadable input

set -euo pipefail
set -o pipefail

usage() { sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'; }

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PHASE_DIR=$(dirname "$SCRIPT_DIR")
ROOT=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)
INVENTORY="$PHASE_DIR/165-REVIEW-COMMENTS.md"
LEDGER="$PHASE_DIR/165-LEDGER.md"
FINAL=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --final) FINAL=1; shift ;;
    --ledger)
      [ "$#" -ge 2 ] || { echo "ledger-check.sh: --ledger needs a path" >&2; exit 2; }
      LEDGER="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "ledger-check.sh: unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

for f in "$INVENTORY" "$LEDGER"; do
  [ -r "$f" ] || { echo "ledger-check.sh: cannot read $f" >&2; exit 2; }
done

TMP=$(mktemp -d "${TMPDIR:-/tmp}/ledger165.XXXXXX")
trap 'rm -rf "$TMP"' EXIT

FAIL=0
fail() { echo "FAIL: $1"; FAIL=1; }

# ── Expected set, derived from the inventory ──────────────────────────────
grep -E '^### C-[0-9]+' "$INVENTORY" | sed -E 's/^### (C-[0-9]+).*/\1/' | sort > "$TMP/expected" || true
EXPECTED_N=$(wc -l < "$TMP/expected" | tr -d ' ')
[ "$EXPECTED_N" -gt 0 ] || { echo "ledger-check.sh: no ### C- headings in $INVENTORY" >&2; exit 2; }
EXPECTED_PRS=$(grep -c -E '^## PR #[0-9]+' "$INVENTORY" || true)

# ── Ledger rows: inline table and appendix, split on unescaped pipes ──────
# Output: `I<TAB>id<TAB>disposition<TAB>plan<TAB>commit<TAB>pending-count` per inline row, and
# `A<TAB>pr` per appendix row. Column positions come from each table's header row.
awk -v OFS='\t' '
  function cells(line,   n, i, s) {
    gsub(/\\\|/, "\001", line)
    n = split(line, raw, "|")
    nc = 0
    for (i = 2; i < n; i++) { s = raw[i]; gsub(/^[ \t]+|[ \t]+$/, "", s); gsub("\001", "|", s); c[++nc] = s }
    return nc
  }
  /^## / {
    section = ""
    if ($0 ~ /^## Inline review comments/) section = "I"
    else if ($0 ~ /^## Review bodies/) section = "A"
    header = 0
    next
  }
  section != "" && /^\|/ {
    n = cells($0)
    if (!header) {
      header = 1
      for (i = 1; i <= n; i++) col[section, c[i]] = i
      next
    }
    if (c[1] ~ /^-+$/) next
    if (section == "I") {
      if (match(c[1], /C-[0-9]+/) == 0) next
      id = substr(c[1], RSTART, RLENGTH)
      pend = 0
      for (i = 1; i <= n; i++) if (c[i] == "pending") pend++
      print "I", id, c[col["I", "Disposition"]], c[col["I", "Plan"]], c[col["I", "Commit"]], pend
    } else if (section == "A") {
      if (c[1] ~ /^#[0-9]+$/) print "A", c[1]
    }
  }
' "$LEDGER" > "$TMP/rows"

awk -F '\t' '$1 == "I" { print $2 }' "$TMP/rows" | sort > "$TMP/actual"
ACTUAL_N=$(wc -l < "$TMP/actual" | tr -d ' ')

# Set equality, both directions.
# Duplicates are reported separately below, so the set comparison runs over distinct ids.
sort -u "$TMP/actual" > "$TMP/actual.u"
comm -23 "$TMP/expected" "$TMP/actual.u" > "$TMP/missing"
comm -13 "$TMP/expected" "$TMP/actual.u" > "$TMP/extra"
while IFS= read -r id; do fail "missing from the ledger: $id"; done < "$TMP/missing"
while IFS= read -r id; do fail "in the ledger but not in 165-REVIEW-COMMENTS.md: $id"; done < "$TMP/extra"

# Duplicates.
uniq -d "$TMP/actual" > "$TMP/dups"
while IFS= read -r id; do fail "duplicate ledger row: $id"; done < "$TMP/dups"

# Vocabulary and owner plans.
awk -F '\t' '$1 == "I" { print $2 "\t" $3 "\t" $4 }' "$TMP/rows" > "$TMP/disp"
while IFS=$'\t' read -r id d plan; do
  case "$d" in
    fix|split-artifact|already-fixed|deferred|wont-fix) ;;
    *) fail "$id: disposition \"$d\" is not one of fix, split-artifact, already-fixed, deferred, wont-fix" ;;
  esac
  case "$plan" in
    165-[0-9][0-9]) [ -f "$PHASE_DIR/$plan-PLAN.md" ] || fail "$id: owner plan $plan has no $plan-PLAN.md" ;;
    *) fail "$id: owner plan \"$plan\" is not 165-NN" ;;
  esac
done < "$TMP/disp"

# Appendix.
APPENDIX_N=$(awk -F '\t' '$1 == "A"' "$TMP/rows" | wc -l | tr -d ' ')
[ "$APPENDIX_N" -eq 12 ] || fail "the review-body appendix has $APPENDIX_N rows, not 12"
[ "$APPENDIX_N" -eq "$EXPECTED_PRS" ] || fail "the review-body appendix has $APPENDIX_N rows but the inventory has $EXPECTED_PRS PR headers"

# ── --final ────────────────────────────────────────────────────────────────
if [ "$FINAL" -eq 1 ]; then
  awk -F '\t' '$1 == "I" && $6 > 0 { print $2 " (" $6 " pending cell(s))" }' "$TMP/rows" > "$TMP/pending"
  while IFS= read -r line; do fail "pending: $line"; done < "$TMP/pending"
  awk -F '\t' '$1 == "I" && $3 == "fix" { print $2 "\t" $5 }' "$TMP/rows" > "$TMP/fixes"
  while IFS=$'\t' read -r id commit; do
    shas=$(printf '%s\n' "$commit" | grep -oE '[0-9a-f]{7,40}' || true)
    if [ -z "$shas" ]; then fail "$id: fix row names no commit"; continue; fi
    for sha in $shas; do
      if ! git -C "$ROOT" merge-base --is-ancestor "$sha" HEAD 2> /dev/null; then
        fail "$id: commit $sha is not reachable from HEAD"
      fi
    done
  done < "$TMP/fixes"
  if [ -f "$SCRIPT_DIR/tip-proofs.sh" ]; then
    st=0
    bash "$SCRIPT_DIR/tip-proofs.sh" > "$TMP/tip.out" 2>&1 || st=$?
    [ "$st" -eq 0 ] || { sed 's/^/  tip-proofs: /' "$TMP/tip.out"; fail "scripts/tip-proofs.sh exited $st"; }
  else
    fail "scripts/tip-proofs.sh does not exist (plan 165-02 writes it)"
  fi
fi

# ── Summary ────────────────────────────────────────────────────────────────
count() { awk -F '\t' -v d="$1" '$1 == "I" && $3 == d' "$TMP/rows" | wc -l | tr -d ' '; }
echo "ledger-check: $ACTUAL_N inline rows (expected $EXPECTED_N) — $(count fix) fix / $(count split-artifact) split-artifact / $(count already-fixed) already-fixed / $(count deferred) deferred / $(count wont-fix) wont-fix; appendix $APPENDIX_N rows$([ "$FINAL" -eq 1 ] && echo '; mode --final')"

if [ "$FAIL" -ne 0 ]; then
  echo "VERDICT: FAILED"
  exit 1
fi
echo "VERDICT: PASSED"
exit 0
