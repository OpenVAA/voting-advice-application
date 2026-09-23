#!/usr/bin/env bash
#
# hygiene-grep-report.sh -- Phase 152 criterion 2 (REVIEW-HYG-02) as a before/after
#                           occurrence table, plus the assert mode that turns it into a gate.
#
# ── PROVENANCE, AND THE ONE BEHAVIOURAL CHANGE ─────────────────────────────────────────────
# This file is a RETARGETED COPY of `.claude/skills/ship-review-stack/sources/hygiene-grep-report.sh`
# (229 lines). The original is under a D-15 exempt tree and is NOT modified. The copy changes
# exactly one thing, at the `survivor)` arm of the verdict loop, and rewrites the header
# paragraph that used to justify the old behaviour.
#
# Usage:
#   hygiene-grep-report.sh [<baseline.tsv>]
#   hygiene-grep-report.sh --assert-clean [<baseline.tsv>]
#   hygiene-grep-report.sh --save-baseline <path> [<baseline.tsv>]
#
#   <baseline.tsv>     OPTIONAL. A TSV previously written by --save-baseline. When given,
#                      the table gains `base` and `delta` columns so the pre-codemod run
#                      (the pre-sweep baseline recorded in 152-BASELINE.md) and a later
#                      post-sweep run are one record.
#   --assert-clean     Turn the report into a gate: exit 1 unless every planning-reference
#                      pattern is at zero occurrences. Phase/spike references are gated on
#                      `occ`, exactly like every other row -- see the survivor-form note below.
#   --save-baseline P  Also write the machine-readable TSV (id, occ, files) to P.
#
# SCOPE IS LOAD-BEARING (D-15, threat T-151-02-01). Every git grep in this script carries
# the pathspec `-- apps/ packages/ tests/ ':(exclude)*.md'`, written out at each call site
# rather than hidden behind a variable, so the scope is auditable by eye and cannot be widened
# in one edit. `CLAUDE.md`, `.agents/` and `.claude/` are agent-facing planning infrastructure,
# exempt from hygiene, and must never appear in these counts: an unscoped grep would count
# `.planning/` self-references, report a permanently-red gate, and invite edits to exempt files.
#
# MARKDOWN IS EXCLUDED BY OPERATOR RULING D7 (2026-08-29), PERMANENTLY AND NOT PROVISIONALLY.
# The class this instrument gates is CODE COMMENTS. Markdown prose is not in it, and the
# decisive reason is a capability gap rather than a preference: the shared classifier maps `md`
# to an EMPTY comment family, so `assert-comment-only-diff.mjs` reads every byte of a Markdown
# file as code and the zero-allow-entry behaviour-neutrality proof — the property that makes
# this phase's sweep commits trustworthy — does not function on Markdown at all. Sweeping `.md`
# would mean landing edits under a proof that structurally cannot verify them. Bringing Markdown
# into the class needs a Markdown-aware prover first; that is a phase, not an edit here.
#
# THE EXCLUSION IS WRITTEN OUT AT EVERY CALL SITE, deliberately, and is NOT hoisted into a
# variable — same reason the scope roots are not. It is also NOT a flag and NOT an ignore file:
# per this phase's standing no-opt-out principle, excusing a case must require editing this
# script so it is reviewed as the decision it is. The header of the report names the exclusion
# so a reader is told the gate declined to look, rather than being shown a green that quietly
# skipped four files. Those four registered sites — `packages/dev-seed/README.md`,
# `apps/frontend/static/fonts/README.md`, `tests/README.md` and `tests/IDURA-TEST-RUNBOOK.md` —
# keep their occurrences. Three of the five `§` markers in `fonts/README.md` are OFL 1.1 licence
# sections 2 and 5: a sweep treating `§` as a citation marker would strip licence text.
#
# THE MILESTONE-VERSION ROW IS REPORT-ONLY AND IS NEVER AUTO-STRIPPED. `v\d+\.\d+` matches
# genuine tool and package versions -- `Yarn 4.13`, `Node 22.22.1`, `playwright:v1.58.2-noble`,
# `Svelte 5` -- as readily as milestone tags. Its ~45 occurrences across ~30 files route to the
# agent judgement pass; `--assert-clean` records the row and never fails on it. It stays a
# `report` row under every disposition and is never promoted to a gate row.
#
# ⚠ THERE IS NO AUTHORISED SURVIVOR FORM. THIS IS THE ONE BEHAVIOURAL CHANGE FROM THE SOURCE,
# AND IT INVERTS THE SOURCE'S OWN STATED RULE. The source script's header reads, verbatim:
#
#     "THE COLLAPSED SURVIVOR FORM'S BASELINE IS NOT ZERO. `see phase N` already appears 4
#      times in 3 files in the current tree. That is the floor, not a violation: D-14
#      authorises exactly this form to survive. `--assert-clean` therefore checks the survivor
#      rows on their `bare` column (occurrences NOT immediately preceded by `see `), never on
#      `occ`."
#
# Phase 152's REVIEW-HYG-02 authorises NO survivor: "no historical narrative, planning-artifact
# path, phase or plan number, or decision id survives." So every planning-reference row in this
# copy -- `phase-ref` and `spike-ref` included -- is gated on `occ = 0`.
#
# This is not a stylistic preference. Measured on the pre-sweep tree, `phase-ref` reports
# `occ 744 / bare 102`: 642 occurrences are already in the collapsed `see phase N` form, and
# the source script's gate calls all 642 GREEN. `spike-ref` is the sharper demonstration --
# `occ 40 / bare 0`, so the source gate reports that row **OK** while forty live violations of
# this phase's criterion sit in the tree. A plan that reused `--assert-clean` unmodified would
# have shipped a gate that is green on 682 violations.
#
# The `bare` column is KEPT and still computed, as a REPORTED DIAGNOSTIC only: it is the fastest
# way to see how much of a residual is in the collapsed form (and therefore how much of the
# remaining work is deleting a `see ` prefix rather than rewriting a sentence). It no longer
# decides any verdict. `152-BASELINE.md` records both scripts run side by side against the same
# tree, so the difference between them is evidence rather than an assertion.
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
# row (SWEEP-03 / FLATTEN-02-shaped identifiers, the same class as a decision ID under a
# different spelling) has NO counterpart in that loop, so it is printed as a separate
# supplementary row with its own subtotal rather than being folded into the comparable total.
# Folding it in would silently change what the 1,984 number means.
#
# ── THE TASK-ID ROW WAS NARROWED TWICE, FOR TWO DIFFERENT REASONS (plan 153-11) ──────────────
# It reported 106 occurrences over 54 files before this. It now reports 19, and neither
# narrowing removed a violation from the tree — both removed a MISREADING from the row.
#
# (1) THE COVERAGE-ID NAMESPACE, OPERATOR RULING D6 (2026-08-29). The E2E coverage vocabulary
# — `EFLOW-`, `EPERM-`, `EQTYP-`, `UNBLK-`, `TMPL-`, `GEN-`, `CLI-`, `ASSERT-`, `RUNES-`,
# `CLEAN-`, `NF-`, `CR-`, `WR-`, `IN-`, `VGATE-` — is NOT planning debt and STAYS in the tree
# byte-identical. The ruling is explicit that the pattern was over-broad and the tree was right.
# It was settled by MEASUREMENT, not by shape: all 19 Playwright titles among these ids are
# quoted verbatim in `tests/e2e-runs/**` run registers (12 to 61 citing files each) while all 62
# vitest ones appear in zero, and `D-07` vs `EPERM-07` proves shape was never a usable test —
# identical shape, opposite classes, and `D-07`'s eleven register hits are a DIFFERENT `D-07`.
# Stripping them would also have broken things a diff cannot restore: `VGATE-04/05` gate the
# blocking `e2e-visual` CI job, `NF-01` appears in a CI step NAME and `TMPL-07` in a step
# comment, and `TMPL-03`/`GEN-04`/`NF-02`/`CR-01` are cited from committed READMEs.
# `NF`, `CR`, `WR` and `IN` are listed for completeness and are INERT here: two-letter prefixes
# were never matched by `[A-Z]{3,}` in the first place.
#
# (2) THE SUFFIX-CAPTURE BUG, found by plan 153-11 while measuring (1). The old pattern
# `\b[A-Z]{3,}-\d{2}\b` matched the TAIL of a longer hyphenated identifier, because `-` is a
# word boundary — the SAME defect this header already documents one row above for `D-13` inside
# `D-137-11`, and the same defect plan 153-10's env-pair guard shipped with. Eighteen of the
# 106 occurrences were reported as a phantom `EDGE-0N` namespace that does not exist anywhere in
# this repository; every one of them is the tail of `REVIEW-EDGE-0N`, a requirement id. That
# misattribution was live bait: a later reader closing the row by adding `EDGE` to the namespace
# above would have blinded the gate to every `REVIEW-EDGE-*` citation in the tree while believing
# they had excluded test vocabulary. The pattern now matches the WHOLE identifier
# (`(?:-[A-Z]{2,})*` before the number, `(?<![A-Za-z0-9-])` in front), so the row reports
# `REVIEW-EDGE-01` rather than `EDGE-01`. Measured: the occurrence count is UNCHANGED at 106
# either way — this fix corrects attribution, not arithmetic.
#
# THE NARROWED ROW IS STILL A GATE, PROVEN IN BOTH DIRECTIONS. It still matches `SWEEP-03` and
# `FLATTEN-02`, the two shapes this row exists for, and it still reports the 15 `REVIEW-EDGE-0N`
# and 1 `INTEG-02` citations that survive in code. Do NOT read the drop from 106 to 19 as work
# done: it is 87 occurrences the ruling declared were never violations.
#
# `D-06` IS NOT THIS ROW'S BUSINESS, and never was. It has a one-letter prefix, so `[A-Z]{3,}`
# never matched it under either pattern; `decision-id-bare` is the row that catches it.
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
#   1  --assert-clean with at least one gated row above zero occurrences (strip rows AND the
#      phase-ref / spike-ref rows alike; `milestone-ver` is report-only and never counted)
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


# The E2E coverage-id namespace operator ruling D6 KEEPS in the tree. A NAMED CONSTANT, not a
# flag and not an ignore file: excusing another namespace means editing this line, which is then
# reviewed as the decision it is. It is consumed by exactly one row, spelled out immediately
# below, so a reader can see both halves at once.
COVERAGE_ID_NAMESPACE='EFLOW|EPERM|EQTYP|UNBLK|TMPL|GEN|CLI|ASSERT|RUNES|CLEAN|NF|CR|WR|IN|VGATE'

BARE_PAT='(?i)(?<!see\s)\bphases?\s+\d+'
scan_row phase-ref        survivor '(?i)\bphases?\s+\d+'          -- apps/ packages/ tests/ ':(exclude)*.md'

BARE_PAT='(?i)(?<!see\s)\bspikes?[\s\-/]\d+'
scan_row spike-ref        survivor '(?i)\bspikes?[\s\-/]\d+'      -- apps/ packages/ tests/ ':(exclude)*.md'

scan_row decision-id-long strip    '\bD-\d{2,3}-\d{2}\b'          -- apps/ packages/ tests/ ':(exclude)*.md'
scan_row decision-id-bare strip    '\bD-\d{2}\b(?!-\d{2})'        -- apps/ packages/ tests/ ':(exclude)*.md'
scan_row section-anchor   strip    '§'                            -- apps/ packages/ tests/ ':(exclude)*.md'
scan_row planning-path    strip    '\.planning/'                  -- apps/ packages/ tests/ ':(exclude)*.md'
scan_row plan-number      strip    '(?i)\bplans?\s+\d+[-.]\d+'    -- apps/ packages/ tests/ ':(exclude)*.md'
scan_row milestone-ver    report   '\bv\d+\.\d+\b'                -- apps/ packages/ tests/ ':(exclude)*.md'
scan_row task-id          strip    "(?<![A-Za-z0-9-])(?!(?:$COVERAGE_ID_NAMESPACE)-)[A-Z]{3,}(?:-[A-Z]{2,})*-\d{2}\b" \
                                                                  -- apps/ packages/ tests/ ':(exclude)*.md'

# ---------------------------------------------------------------------------------------

base_occ() { [ -n "$BASELINE" ] && awk -F'\t' -v k="$1" '$1 == k { print $2; exit }' "$BASELINE" || true; }

ERRORS=0
COMPARABLE=0
SUPPLEMENTARY=0

# ── CENSUS. How many files this run actually looked at, and how many it declined. ────────────
# A gate that examines nothing also reports green, and this milestone has caught that shape
# three times: a scan printing `bare = 0 ... OK` over 40 live violations, a `git grep -E` that
# returned zero hard-coded ports over a file whose line 10 read `port = 54321`, and a guard
# reporting `pairs derived: 0 ... 0 violation(s)` at exit 0 over four live pairs. In all three
# the only thing that would have exposed the blindness was a census line. Printed unconditionally
# in BOTH modes, so a zero surface is visible in the same breath as a zero count.
CENSUS_TOTAL=$( git ls-files -- apps/ packages/ tests/ | wc -l | tr -d ' ' )
CENSUS_SCANNED=$( git ls-files -- apps/ packages/ tests/ ':(exclude)*.md' | wc -l | tr -d ' ' )
MD_FILES_IN_SCOPE=$(( CENSUS_TOTAL - CENSUS_SCANNED ))

echo ""
echo "Planning-Reference Hygiene Report -- Phase 152 criterion 2 (REVIEW-HYG-02)"
echo "========================================================================="
echo "scope   : apps/ packages/ tests/   (CLAUDE.md, .agents/, .claude/ exempt per D-15)"
echo "excluded: *.md -- $MD_FILES_IN_SCOPE Markdown file(s) under those roots are NOT scanned, per operator ruling D7."
echo "          Markdown prose is permanently out of this class; the behaviour-neutrality prover"
echo "          cannot verify a Markdown edit, so the gate declines to demand one. Not a gap."
echo "narrowed: task-id excludes the E2E coverage-id namespace, per operator ruling D6:"
echo "          $COVERAGE_ID_NAMESPACE"
echo "          Those ids stay in the tree byte-identical. The row still catches SWEEP-03 / FLATTEN-02."
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
    # ⚠ THE ONE BEHAVIOURAL CHANGE FROM THE SOURCE SCRIPT. The source tests `$bare` here and
    # sets `expect="bare = 0"`, because Phase 151's D-14 authorised the collapsed `see phase N`
    # form to survive. Phase 152's REVIEW-HYG-02 authorises no survivor, so the verdict reads
    # `$occ` -- the same column every `strip` row is judged on. `$bare` is still computed and
    # still printed, as a diagnostic showing how much of the residual is in the collapsed form.
    # DO NOT restore `bare` as the tested column: on the pre-sweep tree that flips `spike-ref`
    # from FAIL to OK over 40 live violations and hides 642 collapsed phase references.
    survivor)
      expect="occ = 0"
      if [ "$occ" -eq 0 ]; then verdict="OK"; else verdict="FAIL"; ERRORS=$((ERRORS + 1)); fi ;;
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
echo "  census -- tracked paths under the scan roots                       : $CENSUS_TOTAL"
echo "  census -- of those, greppable by these rows (non-.md)              : $CENSUS_SCANNED"
echo "  census -- declined as Markdown per operator ruling D7              : $MD_FILES_IN_SCOPE"

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
  echo "Comment hygiene does not hold (Phase 152 criterion 2, REVIEW-HYG-02)."
  echo "  - a strip row above zero: the codemod has not run over those files, or its"
  echo "    residue was left to the agent judgement pass. Locate them with, for example:"
  echo "      git grep -I -n -P '\\bD-\\d{2}\\b(?!-\\d{2})' -- apps/ packages/ tests/"
  echo "  - a phase-ref / spike-ref row above zero: the reference survives AT ALL, which this"
  echo "    phase forbids in every form -- INCLUDING the collapsed 'see phase N'. There is no"
  echo "    rewrite-to-'see phase N' remedy here; the citation goes, and the sentence around"
  echo "    it is rewritten by hand if it needs one. Locate every form with:"
  echo "      git grep -I -n -P '(?i)\\bphases?\\s+\\d+' -- apps/ packages/ tests/"
  echo "      git grep -I -n -P '(?i)\\bspikes?[\\s/-]\\d+' -- apps/ packages/ tests/"
  echo "    and the collapsed subset alone (the cheap half of the work) with:"
  echo "      git grep -I -n -P '(?i)\\bsee\\s+phases?\\s+\\d+' -- apps/ packages/ tests/"
  echo "  - milestone-ver is deliberately NOT a gate. Do not mechanically strip it;"
  echo "    it matches genuine tool and package versions. Route it to the agent pass."
  exit 1
fi

echo ""
echo "HYGIENE CLEAN"
exit 0
