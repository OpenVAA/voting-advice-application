#!/usr/bin/env bash
# 166-hygiene-scan.sh -- the D-19 whole-file comment-hygiene scan, scoped to named files.
#
# Usage: bash .planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-hygiene-scan.sh <file>...
#
# Why this exists: `.claude/skills/ship-review-stack/sources/hygiene-grep-report.sh` scans all of
# apps/ packages/ tests/ and takes no file arguments, and the tree-wide report is already red on
# files this phase does not touch (166-RESEARCH.md Pitfall 9). D-19 requires every file the phase
# touches to be clean AS A WHOLE, so this script runs the same reference-form pattern set (plus the
# forms that script misses: 162-06, 162-REVIEW, WR-06, "migration 0000N", v2.x milestone tags)
# over exactly the files named.
#
# Exit codes:
#   0  every named file is clean of the mechanical reference forms
#   1  one or more hit lines (printed as file:line:text)
#   2  usage error: no file named, or a named file does not exist in the working tree
#
# The second section (narrative cues) is ADVISORY and never changes the exit code: historical
# narrative can only be judged by reading, so the cues only point the reader at likely lines.

set -uo pipefail

if [ "$#" -eq 0 ]; then
  echo "166-hygiene-scan.sh: name at least one file" >&2
  exit 2
fi

missing=0
for f in "$@"; do
  if [ ! -f "$f" ]; then
    echo "166-hygiene-scan.sh: not a file in the working tree: $f" >&2
    missing=1
  fi
done
[ "$missing" -eq 0 ] || exit 2

# Reference forms (CLAUDE.md Comment Hygiene rule 2). The bare `see phase N` / `see spike N`
# forms are allowed, hence the lookbehinds.
PAT='(?<![Ss]ee\s)\b[Pp]hases?\s+\d+|(?<![Ss]ee\s)\b[Ss]pikes?[\s\-/]\d+|\bD-\d{2,3}(-\d{2})?\b|§|\.planning/|\b[Pp]lans?\s+\d+[-.]\d+|\b[A-Z]{3,}-\d{2}\b|\b1\d\d-\d\d[a-z]?\b|\b1\d\d-(REVIEW|SPEC|SUMMARY|CONTEXT|FLOW|NEGATIVE)|\b[A-Z]{2}-\d{2}\b|\bmigration 0000\d|\bv2\.\d+\b'

# --untracked reads the working tree, so a new file is scanned before it is ever staged. git grep
# exits 1 on no match and 128 on a usage error; the second is surfaced, never mistaken for clean.
hits="$(git grep --untracked -n -I -P "$PAT" -- "$@")"
status=$?
if [ "$status" -gt 1 ]; then
  echo "166-hygiene-scan.sh: git grep failed (exit $status)" >&2
  exit 2
fi

# Advisory narrative cues: phrases that usually mark history rather than a description of the
# code as it is now. Every cue line must be READ; a cue is not a verdict.
CUES='(?i)\b(previously|used to|no longer|formerly|until this commit|was (changed|replaced|removed|moved|renamed|retired)|has been (removed|replaced|moved)|retire[sd]?|review finding|deviation|before (the|this) (fix|change|refactor)|strengthened, not weakened)\b'
cues="$(git grep --untracked -n -I -P "$CUES" -- "$@" || true)"

echo "files scanned: $#"
if [ -n "$cues" ]; then
  echo ""
  echo "ADVISORY narrative cues (read each; not a gate):"
  echo "$cues"
fi

if [ -n "$hits" ]; then
  echo ""
  echo "FAIL: planning-reference forms found:"
  echo "$hits"
  echo "FAIL: $(printf '%s\n' "$hits" | wc -l | tr -d ' ') hit line(s)"
  exit 1
fi

echo "CLEAN: no planning-reference form in $# file(s)"
exit 0
