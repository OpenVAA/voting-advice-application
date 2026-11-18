#!/usr/bin/env bash
#
# verify-identity.sh -- D-23's TWO INDEPENDENT byte-identity checks, printed verbatim.
#                       This is the whole of criterion 7: the review stack must reconstruct
#                       the merge target byte for byte (Phase 151).
#
# Usage:
#   verify-identity.sh <target-commit-ish> <stack-tip-commit-ish>
#   verify-identity.sh feat-gsd-roadmap ship/v0.2-akita-11-planning
#
#   $1  TARGET   OPTIONAL positional, default "feat-gsd-roadmap". The post-sweep tip
#                already merged with origin/main -- the single ref criterion 7 names.
#   $2  TIP      REQUIRED. The top commit of the reconstructed stack.
#
# The two checks are INDEPENDENT ON PURPOSE. Tree equality alone would pass on a stack
# whose slices are wrong but whose union happens to reproduce the tree; the changed-file
# count is computed by a different code path (diff machinery, not object hashing) and is
# printed as a NUMBER, so the record shows a measurement rather than a claim. Both must
# hold. Neither is sufficient.
#
# What this script does NOT prove: that the partition into slices is honest. A non-empty
# catch-all slice launders partition bugs while both checks below still pass -- measured
# live during research: two broken slices, 472 files swept into the catch-all, tree hash
# match (151-RESEARCH.md Pitfall 5). The catch-all-empty assertion in the stack build is a
# SEPARATE and equally load-bearing gate. Read a green banner here as "the union is right",
# never as "the slices are right".
#
# Output:
#   stdout  both check bodies, both values, and a summary banner
#   exit    derived from a counter, after the banner and after any remediation prose
#
# Exit codes -- the caller must be able to branch on the status alone:
#   0  BYTE-IDENTICAL: zero changed files AND equal tree hashes
#   1  MISMATCH: at least one check failed; remediation prose names the first differing path
#   2  usage error (no stack tip given, or a ref does not resolve)

set -euo pipefail
set -o pipefail

usage() { sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'; }

TARGET="${1:-feat-gsd-roadmap}"
TIP="${2:-}"

if [ -z "$TIP" ]; then
  echo "verify-identity.sh: a stack tip commit-ish is required" >&2
  usage >&2
  exit 2
fi

cd "$(git rev-parse --show-toplevel)"

for ref in "$TARGET" "$TIP"; do
  if ! git rev-parse --verify --quiet "${ref}^{commit}" >/dev/null; then
    echo "verify-identity.sh: does not resolve to a commit: $ref" >&2
    exit 2
  fi
done

FAILURES=0

echo "== Check 1: git diff must be empty =="
echo "target : $TARGET  ($(git rev-parse "$TARGET"))"
echo "tip    : $TIP  ($(git rev-parse "$TIP"))"
git -c diff.renameLimit=20000 diff --stat "$TARGET" "$TIP" || true
N="$(git -c diff.renameLimit=20000 diff --name-only "$TARGET" "$TIP" | wc -l | tr -d ' ')"
echo "changed files: $N"
[ "$N" -eq 0 ] || FAILURES=$((FAILURES + 1))

echo ""
echo "== Check 2: tree hashes must be equal =="
A="$(git rev-parse "${TARGET}^{tree}")"
B="$(git rev-parse "${TIP}^{tree}")"
printf 'target tree : %s\nstack  tree : %s\n' "$A" "$B"
[ "$A" = "$B" ] || FAILURES=$((FAILURES + 1))

echo ""
echo "---"
echo "Checks failed: $FAILURES  (changed files: $N, trees equal: $([ "$A" = "$B" ] && echo yes || echo no))"

if [ "$FAILURES" -gt 0 ]; then
  echo ""
  echo "MISMATCH: the stack does not reconstruct the target."
  if [ "$N" -ne 0 ]; then
    FIRST="$(git -c diff.renameLimit=20000 diff --name-only "$TARGET" "$TIP" | head -1)"
    echo "First differing path: $FIRST"
    echo "Inspect it with:  git diff $TARGET $TIP -- \"$FIRST\""
    echo "Then find the slice whose pathspec should own that path. A path that no slice"
    echo "claims lands in the catch-all; a path two slices claim is applied twice, and the"
    echo "later application wins -- both show up here as a residual difference."
  else
    echo "Zero changed files but unequal tree hashes: the two refs differ in something the"
    echo "diff machinery normalises away. Compare the trees directly with:"
    echo "  git diff-tree -r $A $B"
  fi
  exit 1
fi

echo ""
echo "BYTE-IDENTICAL"
exit 0
