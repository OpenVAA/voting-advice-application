#!/usr/bin/env bash
#
# slice-overlap-matrix.sh -- criterion 6's "PRs touching the same files are minimised",
#                            measured as an N x N pairwise file-set overlap matrix (Phase 151).
#
# Usage:
#   slice-overlap-matrix.sh [--union] <slice-def-file> <PARENT> <TARGET>
#   slice-overlap-matrix.sh --self-test
#
#   <slice-def-file>  One line per slice, TAB separated:  <slice-id><TAB><pathspec>[<TAB><pathspec>...]
#                     Blank lines and lines starting with # are ignored. Fields are split on TAB
#                     ONLY, so a pathspec may contain spaces. Full pathspec magic is available --
#                     `:(exclude)packages/dev-seed` works, because this is `git diff` and not
#                     `git ls-tree` (151-RESEARCH.md Pitfall 4).
#   <PARENT>          The ref the slice is measured from -- for a stack, the slice's parent.
#   <TARGET>          The ref the slice is measured to -- the merge target.
#   --union           Additionally print the union of all slices against the full PARENT..TARGET
#                     file count, and fail on a shortfall.
#   --self-test       Run the built-in negative, positive and union controls and exit 0 only if
#                     all three behave as specified. Takes no other arguments.
#
# WHY OFF-DIAGONAL ZERO IS THE RIGHT BAR, NOT "SMALL". For a PATH-PARTITIONED stack every file
# belongs to exactly one slice's pathspec by construction, so the correct off-diagonal value is
# exactly 0. A non-zero cell is not a criterion-6 quality judgement -- it is a partition BUG: the
# same file is written by two commits, the later one wins, and the byte-identity check still
# passes while the stack is wrong. That is the same defect class the catch-all tripwire catches
# (151-RESEARCH.md Pitfall 5), caught here earlier and more cheaply.
#
# --union CATCHES THE OTHER HALF. Overlap is the "same file twice" direction; the union check is
# the "no file at all" direction. Both are needed: a gap-free partition can still overlap, and an
# overlap-free partition can still leave a gap. Plan 151-01 proved the same pair by arithmetic
# (per-slice counts summing to the independently measured total, plus an empty catch-all).
#
# --no-renames IS CARRIED ON EVERY MEASUREMENT INCLUDING THE TOTAL. `git diff --name-only` with
# rename detection prints ONE path per rename; with --no-renames it prints two (the delete and
# the add). Comparing a rename-detected total against a rename-suppressed union would report a
# phantom shortfall on every rename in the diff -- 1,135 of them on this branch. The comparable
# total is therefore computed with the same flags, and the rename-detected total is printed
# beside it for transparency only.
#
# -z THROUGHOUT (threat T-151-02-03). One tracked path in this repo contains a space
# (`apps/frontend/src/lib/server/api/README.md 21-40-30-014.md`). Whitespace splitting would
# silently shrink that slice's set and hide an overlap. NUL-delimited output is converted to
# lines for `comm`; a path containing a literal newline is out of contract for this script and
# would show up as a union/total mismatch rather than passing silently.
#
# Sorting is LC_ALL=C on every set, because `comm` requires both inputs sorted under the SAME
# collation and a locale-sensitive sort would make `comm` report spurious non-overlap.
#
# Output:
#   stdout  the matrix (always), the index legend, any offending pair's shared paths, the banner
#   exit    derived from a counter, after the banner and after the remediation prose
#
# Exit codes -- the caller must be able to branch on the status alone:
#   0  every off-diagonal cell is 0 (and, under --union, no gap)
#   1  at least one pair of slices shares a file, or --union found a gap
#   2  usage error (bad arguments, unreadable definition file, unresolvable ref, empty definition)

set -euo pipefail
set -o pipefail

usage() { sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'; }

UNION=0
SELFTEST=0
ARGS=()

while [ "$#" -gt 0 ]; do
  case "$1" in
    --union)     UNION=1; shift ;;
    --self-test) SELFTEST=1; shift ;;
    -h|--help)   usage; exit 0 ;;
    -*)          echo "slice-overlap-matrix.sh: unknown flag: $1" >&2; usage >&2; exit 2 ;;
    *)           ARGS[${#ARGS[@]}]="$1"; shift ;;
  esac
done

# ---------------------------------------------------------------------------------------
# --self-test: the three controls, run against this repository as it stands.
# ---------------------------------------------------------------------------------------
if [ "$SELFTEST" -eq 1 ]; then
  SELF="${BASH_SOURCE[0]}"
  P="${SELFTEST_PARENT:-origin/main}"
  T="${SELFTEST_TARGET:-HEAD}"

  cd "$(git rev-parse --show-toplevel)"
  for ref in "$P" "$T"; do
    git rev-parse --verify --quiet "${ref}^{commit}" >/dev/null || {
      echo "slice-overlap-matrix.sh --self-test: does not resolve: $ref" >&2
      echo "Override with SELFTEST_PARENT / SELFTEST_TARGET." >&2
      exit 2
    }
  done

  ST="$(mktemp -d)"
  trap 'rm -rf "$ST"' EXIT
  FAILED=0

  # Control 1 -- NEGATIVE. Two slices that both claim apps/frontend/src/lib.
  printf 'lib\tapps/frontend/src/lib\nlibapi\tapps/frontend/src/lib/api\n' > "$ST/overlap.tsv"
  set +e
  bash "$SELF" "$ST/overlap.tsv" "$P" "$T" > "$ST/neg.out" 2>&1
  NEG_RC=$?
  set -e
  # The assertion names the exact pair line, not the substring 'lib' -- a loose grep here
  # would pass on almost any output and make the negative control decorative.
  if [ "$NEG_RC" -ne 0 ] \
     && grep -q '\[1\] lib  x  \[2\] libapi' "$ST/neg.out" \
     && grep -q '^      apps/frontend/src/lib/api/' "$ST/neg.out"; then
    echo "  negative control  PASS  (exit $NEG_RC, both slice ids and a shared path named)"
  else
    echo "  negative control  FAIL  (exit $NEG_RC -- expected non-zero with named shared paths)"
    sed -n '1,40p' "$ST/neg.out"
    FAILED=$((FAILED + 1))
  fi

  # Control 2 -- POSITIVE. Two disjoint pathspecs.
  printf 'devseed\tpackages/dev-seed\ne2e\ttests\n' > "$ST/disjoint.tsv"
  set +e
  bash "$SELF" "$ST/disjoint.tsv" "$P" "$T" > "$ST/pos.out" 2>&1
  POS_RC=$?
  set -e
  if [ "$POS_RC" -eq 0 ] && grep -q 'DISJOINT' "$ST/pos.out"; then
    echo "  positive control  PASS  (exit 0, every off-diagonal cell 0)"
  else
    echo "  positive control  FAIL  (exit $POS_RC -- expected 0)"
    sed -n '1,40p' "$ST/pos.out"
    FAILED=$((FAILED + 1))
  fi

  # Control 3 -- UNION. A complete two-slice partition: dev-seed, and everything else.
  printf 'devseed\tpackages/dev-seed\nrest\t.\t:(exclude)packages/dev-seed\n' > "$ST/full.tsv"
  set +e
  bash "$SELF" --union "$ST/full.tsv" "$P" "$T" > "$ST/uni.out" 2>&1
  UNI_RC=$?
  set -e
  if [ "$UNI_RC" -eq 0 ] && grep -q 'gap: 0' "$ST/uni.out"; then
    echo "  union control     PASS  (exit 0, union equals the comparable total, gap 0)"
  else
    echo "  union control     FAIL  (exit $UNI_RC -- expected 0 with gap: 0)"
    sed -n '1,40p' "$ST/uni.out"
    FAILED=$((FAILED + 1))
  fi

  echo ""
  echo "---"
  echo "Self-test controls failing: $FAILED"
  if [ "$FAILED" -gt 0 ]; then
    echo ""
    echo "The overlap gate is not trustworthy: a control did not behave as specified."
    echo "Do not use its verdict as criterion-6 evidence until this passes."
    exit 1
  fi
  echo ""
  echo "SELF-TEST PASSED"
  exit 0
fi

# ---------------------------------------------------------------------------------------
# Normal mode.
# ---------------------------------------------------------------------------------------
if [ "${#ARGS[@]}" -ne 3 ]; then
  echo "slice-overlap-matrix.sh: need <slice-def-file> <PARENT> <TARGET>" >&2
  usage >&2
  exit 2
fi

DEF="${ARGS[0]}"
PARENT="${ARGS[1]}"
TARGET="${ARGS[2]}"

[ -r "$DEF" ] || { echo "slice-overlap-matrix.sh: cannot read definition file: $DEF" >&2; exit 2; }

# git pathspecs are cwd-relative; anchor at the repo root so one definition file works from
# anywhere -- the same reason build-slice.sh does this.
cd "$(git rev-parse --show-toplevel)"

for ref in "$PARENT" "$TARGET"; do
  git rev-parse --verify --quiet "${ref}^{commit}" >/dev/null || {
    echo "slice-overlap-matrix.sh: does not resolve to a commit: $ref" >&2
    exit 2
  }
done

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

IDS=()
N=0

while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    ''|'#'*) continue ;;
  esac

  # Split on TAB only: field 1 is the slice id, every later field is one pathspec.
  OLDIFS="$IFS"
  IFS=$'\t'
  # shellcheck disable=SC2206  -- word splitting on TAB is exactly what is wanted here
  FIELDS=($line)
  IFS="$OLDIFS"

  ID="${FIELDS[0]}"
  SPECS=("${FIELDS[@]:1}")

  if [ "${#SPECS[@]}" -eq 0 ]; then
    echo "slice-overlap-matrix.sh: slice '$ID' has no pathspec (fields must be TAB separated)" >&2
    exit 2
  fi

  git -c diff.renameLimit=20000 diff --name-only -z --no-renames "$PARENT" "$TARGET" -- "${SPECS[@]}" \
    | tr '\0' '\n' | sed '/^$/d' | LC_ALL=C sort > "$WORK/set.$N"

  IDS[$N]="$ID"
  N=$((N + 1))
done < "$DEF"

[ "$N" -gt 0 ] || { echo "slice-overlap-matrix.sh: definition file defines no slices" >&2; exit 2; }

# CELL is a flat array indexed i*N+j -- bash 3.2 (the host shell) has no associative arrays.
CELL=()
PAIRS_SHARING=0
SHARED_TOTAL=0

i=0
while [ "$i" -lt "$N" ]; do
  j=0
  while [ "$j" -lt "$N" ]; do
    if [ "$i" -eq "$j" ]; then
      v=$( wc -l < "$WORK/set.$i" | tr -d ' ' )
    elif [ "$j" -lt "$i" ]; then
      v="${CELL[$((j * N + i))]}"          # symmetric; reuse the already-computed cell
    else
      v=$( { LC_ALL=C comm -12 "$WORK/set.$i" "$WORK/set.$j" || true; } | wc -l | tr -d ' ' )
      if [ "$v" -gt 0 ]; then
        PAIRS_SHARING=$((PAIRS_SHARING + 1))
        SHARED_TOTAL=$((SHARED_TOTAL + v))
      fi
    fi
    CELL[$((i * N + j))]="$v"
    j=$((j + 1))
  done
  i=$((i + 1))
done

echo ""
echo "Slice Overlap Matrix -- criterion 6"
echo "==================================="
echo "parent : $PARENT  ($(git rev-parse --short "$PARENT"))"
echo "target : $TARGET  ($(git rev-parse --short "$TARGET"))"
echo "slices : $N   (definition: $DEF)"
echo ""

printf "  %-24s" ""
j=0
while [ "$j" -lt "$N" ]; do printf "%7s" "$((j + 1))"; j=$((j + 1)); done
printf "\n"

i=0
while [ "$i" -lt "$N" ]; do
  printf "  %2d %-21.21s" "$((i + 1))" "${IDS[$i]}"
  j=0
  while [ "$j" -lt "$N" ]; do
    printf "%7s" "${CELL[$((i * N + j))]}"
    j=$((j + 1))
  done
  printf "\n"
  i=$((i + 1))
done

echo ""
echo "  diagonal = the slice's own file count; off-diagonal = |slice_i INTERSECT slice_j|"

if [ "$PAIRS_SHARING" -gt 0 ]; then
  echo ""
  echo "Overlapping pairs (first three shared paths each):"
  i=0
  while [ "$i" -lt "$N" ]; do
    j=$((i + 1))
    while [ "$j" -lt "$N" ]; do
      v="${CELL[$((i * N + j))]}"
      if [ "$v" -gt 0 ]; then
        echo "  [$((i + 1))] ${IDS[$i]}  x  [$((j + 1))] ${IDS[$j]}   shared files: $v"
        { LC_ALL=C comm -12 "$WORK/set.$i" "$WORK/set.$j" || true; } | head -3 \
          | sed 's/^/      /'
      fi
      j=$((j + 1))
    done
    i=$((i + 1))
  done
fi

ERRORS=0
[ "$PAIRS_SHARING" -eq 0 ] || ERRORS=$((ERRORS + 1))

GAP=""
if [ "$UNION" -eq 1 ]; then
  U=$( cat "$WORK"/set.* | LC_ALL=C sort -u | wc -l | tr -d ' ' )
  TOT=$( { git -c diff.renameLimit=20000 diff --name-only --no-renames "$PARENT" "$TARGET" || true; } \
           | wc -l | tr -d ' ' )
  TOT_R=$( { git -c diff.renameLimit=20000 diff --name-only "$PARENT" "$TARGET" || true; } \
             | wc -l | tr -d ' ' )
  GAP=$((TOT - U))
  echo ""
  echo "  union of all slices                       : $U"
  echo "  comparable total (--no-renames, as above) : $TOT"
  echo "  rename-detected total (informational)     : $TOT_R"
  echo "  gap: $GAP"
  [ "$GAP" -eq 0 ] || ERRORS=$((ERRORS + 1))
fi

echo ""
echo "---"
echo "Errors: $ERRORS  (overlapping pairs: $PAIRS_SHARING, shared file slots: $SHARED_TOTAL${GAP:+, gap: $GAP})"

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "The slice partition is not clean."
  echo "  - an overlapping pair: two pathspecs claim the same file. One commit will be"
  echo "    applied over the other and the later application wins, so the stack still"
  echo "    reconstructs the target while a reviewer sees the file twice. Narrow one"
  echo "    pathspec, or exclude the shared subtree from it with :(exclude)<path>."
  echo "  - a gap: a file in PARENT..TARGET belongs to no slice. It would land in the"
  echo "    catch-all slice, which must be EMPTY. Add a pathspec that claims it -- do not"
  echo "    write a slice as the complement of the others, which makes the catch-all"
  echo "    trivially empty and destroys the tripwire."
  exit 1
fi

echo ""
echo "DISJOINT"
exit 0
