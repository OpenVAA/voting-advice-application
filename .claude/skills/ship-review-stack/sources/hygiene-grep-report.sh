#!/usr/bin/env bash
#
# hygiene-grep-report.sh -- criterion 3 as a before/after occurrence table, plus the
#                           assert mode that turns it into a gate (Phase 151).
#
# Usage:
#   hygiene-grep-report.sh [<baseline.tsv>]
#   hygiene-grep-report.sh --assert-clean [<baseline.tsv>]
#   hygiene-grep-report.sh --save-baseline <path> [<baseline.tsv>]
#
#   <baseline.tsv>     OPTIONAL. A TSV previously written by --save-baseline. When given,
#                      the table gains `base` and `delta` columns so the pre-codemod run
#                      (plan 151-03) and the post-codemod run (plan 151-08) are one record.
#   --assert-clean     Turn the report into a gate: exit 1 unless every strip pattern is at
#                      zero AND every surviving phase/spike reference carries the collapsed
#                      `see ` prefix.
#   --save-baseline P  Also write the machine-readable TSV (id, occ, files) to P.
#
# SCOPE IS LOAD-BEARING (D-15, threat T-151-02-01). Every git grep in this script carries
# the pathspec `-- apps/ packages/ tests/`, written out at each call site rather than hidden
# behind a variable, so the scope is auditable by eye and cannot be widened in one edit.
# `CLAUDE.md`, `.agents/` and `.claude/` are agent-facing planning infrastructure, exempt from
# hygiene, and must never appear in these counts: an unscoped grep would count `.planning/`
# self-references, report a permanently-red gate, and invite edits to exempt files.
#
# THE MILESTONE-VERSION ROW IS REPORT-ONLY AND IS NEVER AUTO-STRIPPED. `v\d+\.\d+` matches
# genuine tool and package versions -- `Yarn 4.13`, `Node 22.22.1`, `playwright:v1.58.2-noble`,
# `Svelte 5` -- as readily as milestone tags. Its ~45 occurrences across ~30 files route to the
# Stage-2 agent pass in plan 151-08; `--assert-clean` records the row and never fails on it.
#
# THE COLLAPSED SURVIVOR FORM'S BASELINE IS NOT ZERO. `see phase N` already appears 4 times in
# 3 files in the current tree. That is the floor, not a violation: D-14 authorises exactly this
# form to survive. `--assert-clean` therefore checks the survivor rows on their `bare` column
# (occurrences NOT immediately preceded by `see `), never on `occ`.
#
# ROWS ARE DISJOINT, AND THAT CORRECTS A CORRECTION. 151-RESEARCH.md C-5 attributes "725
# occurrences across 183 files" to the bare `D-NN` form. Measured here: 725 is the count of the
# COMBINED pattern `\bD-\d{2,3}(-\d{2})?\b`; the bare form alone is 540 and the long form is 185
# (540 + 185 = 725). `\bD-\d{2}\b` also matches the `D-13` prefix inside `D-137-11`, because `-`
# is a word boundary, so the naive two-row split double-counts every long-form ID. The bare row
# below therefore carries `(?!-\d{2})`, and the printed total is a true occurrence count.
#
# TWO TOTALS, ON PURPOSE. The `planning-reference total` covers the eight rows research's own
# proof loop covers, so it is directly comparable to that loop's ~1,984 figure. The `task-id`
# row (SWEEP-03 / FLATTEN-02 / EPERM-07-shaped identifiers, the same class as a decision ID
# under a different spelling) has NO counterpart in that loop, so it is printed as a separate
# supplementary row with its own subtotal rather than being folded into the comparable total.
# Folding it in would silently change what the 1,984 number means.
#
# Counts drift as the branch advances -- research measured 3,969 reconstructed files, plan 01
# measured 4,240 -- so nothing here is hard-coded. Every number is derived at run time.
#
# Output:
#   stdout  the pattern table (always), the two totals, the union file count, then the banner
#   exit    derived from a counter, and only in --assert-clean mode
#
# Exit codes -- the caller must be able to branch on the status alone:
#   0  report mode (always), or --assert-clean with every gate row green
#   1  --assert-clean with at least one strip row above zero or one un-collapsed survivor
#   2  usage error (unknown flag, --save-baseline without a path, unreadable baseline)

set -euo pipefail
set -o pipefail

usage() { sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'; }

ASSERT=0
BASELINE=""
SAVE=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --assert-clean) ASSERT=1; shift ;;
    --save-baseline)
      [ "$#" -ge 2 ] || { echo "hygiene-grep-report.sh: --save-baseline needs a path" >&2; exit 2; }
      SAVE="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    -*) echo "hygiene-grep-report.sh: unknown flag: $1" >&2; usage >&2; exit 2 ;;
    *)
      [ -r "$1" ] || { echo "hygiene-grep-report.sh: baseline not readable: $1" >&2; exit 2; }
      BASELINE="$1"; shift ;;
  esac
done

cd "$(git rev-parse --show-toplevel)"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
TSV="$WORK/rows.tsv"
: > "$TSV"

# BARE_PAT is set immediately before a `survivor` row and consumed by scan_row, which resets
# it. Survivor rows need a second pattern -- the same reference WITHOUT the collapsed `see `
# prefix -- and a fixed-width PCRE lookbehind is the only way to express "not preceded by".
BARE_PAT=""

# scan_row <id> <kind> <pattern> -- <pathspec...>
# Every trailing argument is forwarded verbatim to every git grep, so the pathspec written at
# the call site is the pathspec that runs. git grep exits 1 on no-match, which pipefail would
# turn into a fatal error, hence the `|| true` on each.
scan_row() {
  local id="$1" kind="$2" pat="$3"; shift 3
  local occ files bare="-"

  occ=$( { git grep -I -h -o -P "$pat" "$@" || true; } | wc -l | tr -d ' ' )
  { git grep -I -l -P "$pat" "$@" || true; } > "$WORK/files.$id"
  files=$( wc -l < "$WORK/files.$id" | tr -d ' ' )

  if [ "$kind" = "survivor" ]; then
    bare=$( { git grep -I -h -o -P "$BARE_PAT" "$@" || true; } | wc -l | tr -d ' ' )
  fi
  BARE_PAT=""

  printf '%s\t%s\t%s\t%s\t%s\n' "$id" "$kind" "$occ" "$files" "$bare" >> "$TSV"
}

# --- The pattern set (C-5/C-6 corrected). Order matters only for readability. ------------
# Comment syntaxes in scope span .ts, .svelte, .md, .sh (#), .mjs and .sql (--) -- these are
# raw text greps, so no syntax is privileged and none is missed.

BARE_PAT='(?i)(?<!see\s)\bphases?\s+\d+'
scan_row phase-ref        survivor '(?i)\bphases?\s+\d+'          -- apps/ packages/ tests/

BARE_PAT='(?i)(?<!see\s)\bspikes?[\s\-/]\d+'
scan_row spike-ref        survivor '(?i)\bspikes?[\s\-/]\d+'      -- apps/ packages/ tests/

scan_row decision-id-long strip    '\bD-\d{2,3}-\d{2}\b'          -- apps/ packages/ tests/
scan_row decision-id-bare strip    '\bD-\d{2}\b(?!-\d{2})'        -- apps/ packages/ tests/
scan_row section-anchor   strip    '§'                            -- apps/ packages/ tests/
scan_row planning-path    strip    '\.planning/'                  -- apps/ packages/ tests/
scan_row plan-number      strip    '(?i)\bplans?\s+\d+[-.]\d+'    -- apps/ packages/ tests/
scan_row milestone-ver    report   '\bv\d+\.\d+\b'                -- apps/ packages/ tests/
scan_row task-id          strip    '\b[A-Z]{3,}-\d{2}\b'          -- apps/ packages/ tests/

# ---------------------------------------------------------------------------------------

base_occ() { [ -n "$BASELINE" ] && awk -F'\t' -v k="$1" '$1 == k { print $2; exit }' "$BASELINE" || true; }

ERRORS=0
COMPARABLE=0
SUPPLEMENTARY=0

echo ""
echo "Planning-Reference Hygiene Report -- criterion 3"
echo "==============================================="
echo "scope   : apps/ packages/ tests/   (CLAUDE.md, .agents/, .claude/ exempt per D-15)"
echo "mode    : $([ "$ASSERT" -eq 1 ] && echo "assert-clean (gate)" || echo "report")"
[ -n "$BASELINE" ] && echo "baseline: $BASELINE"
echo ""

if [ -n "$BASELINE" ]; then
  printf "  %-17s  %6s  %6s  %6s  %-9s  %-7s  %6s  %7s\n" \
    "pattern" "occ" "files" "bare" "expect" "verdict" "base" "delta"
  printf "  %-17s  %6s  %6s  %6s  %-9s  %-7s  %6s  %7s\n" \
    "-----------------" "------" "------" "------" "---------" "-------" "------" "-------"
else
  printf "  %-17s  %6s  %6s  %6s  %-9s  %-7s\n" \
    "pattern" "occ" "files" "bare" "expect" "verdict"
  printf "  %-17s  %6s  %6s  %6s  %-9s  %-7s\n" \
    "-----------------" "------" "------" "------" "---------" "-------"
fi

while IFS=$'\t' read -r id kind occ files bare; do
  case "$kind" in
    strip)
      expect="occ = 0"
      if [ "$occ" -eq 0 ]; then verdict="OK"; else verdict="FAIL"; ERRORS=$((ERRORS + 1)); fi ;;
    survivor)
      expect="bare = 0"
      if [ "$bare" -eq 0 ]; then verdict="OK"; else verdict="FAIL"; ERRORS=$((ERRORS + 1)); fi ;;
    report)
      expect="-"; verdict="REPORT" ;;
  esac

  if [ "$id" = "task-id" ]; then
    SUPPLEMENTARY=$((SUPPLEMENTARY + occ))
  else
    COMPARABLE=$((COMPARABLE + occ))
  fi

  if [ -n "$BASELINE" ]; then
    b="$(base_occ "$id")"
    if [ -n "$b" ]; then d=$((occ - b)); else b="-"; d="-"; fi
    printf "  %-17s  %6s  %6s  %6s  %-9s  %-7s  %6s  %7s\n" \
      "$id" "$occ" "$files" "$bare" "$expect" "$verdict" "$b" "$d"
  else
    printf "  %-17s  %6s  %6s  %6s  %-9s  %-7s\n" \
      "$id" "$occ" "$files" "$bare" "$expect" "$verdict"
  fi
done < "$TSV"

UNION="$( cat "$WORK"/files.* | sort -u | wc -l | tr -d ' ' )"

echo ""
echo "  planning-reference total (8 rows, comparable to the research loop) : $COMPARABLE"
echo "  task-id supplementary (no counterpart in that loop)                : $SUPPLEMENTARY"
echo "  union files touched by any row                                     : $UNION"

if [ -n "$SAVE" ]; then
  awk -F'\t' 'BEGIN { OFS="\t" } { print $1, $3, $4 }' "$TSV" > "$SAVE"
  echo "  baseline written                                                   : $SAVE"
fi

echo ""
echo "---"
echo "Gate rows failing: $ERRORS  (milestone-ver is report-only and never counted)"

if [ "$ASSERT" -eq 0 ]; then
  echo "Report mode: no gate applied. Re-run with --assert-clean to fail on the rows above."
  exit 0
fi

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "Comment hygiene does not hold (criterion 3)."
  echo "  - a strip row above zero: the codemod has not run over those files, or its"
  echo "    residue was left to the Stage-2 agent pass. Locate them with, for example:"
  echo "      git grep -I -n -P '\\bD-\\d{2}\\b(?!-\\d{2})' -- apps/ packages/ tests/"
  echo "  - a survivor row with bare > 0: the reference survives but not in the collapsed"
  echo "    form D-14 authorises. Rewrite it as 'see phase N' / 'see spike N':"
  echo "      git grep -I -n -P '(?i)(?<!see\\s)\\bphases?\\s+\\d+' -- apps/ packages/ tests/"
  echo "  - milestone-ver is deliberately NOT a gate. Do not mechanically strip it;"
  echo "    it matches genuine tool and package versions. Route it to the agent pass."
  exit 1
fi

echo ""
echo "HYGIENE CLEAN"
exit 0
