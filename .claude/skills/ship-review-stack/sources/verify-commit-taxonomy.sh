#!/usr/bin/env bash
#
# verify-commit-taxonomy.sh -- criterion 4's six sub-clauses turned into an exit code.
#                              This is the ONLY automated evidence for 4.1-4.6 (Phase 151).
#
# Usage:
#   verify-commit-taxonomy.sh [<commit-range>]
#   verify-commit-taxonomy.sh origin/main..HEAD
#   verify-commit-taxonomy.sh 989e3ebe2..ship/v0.2-akita-11-planning
#
#   $1  RANGE  OPTIONAL, default "origin/main..HEAD". Any two-dot range git log accepts.
#
# What the six sub-clauses become here:
#
#   4.1  all planning items are one commit          -> class `planning` count == 1
#   4.2  all other documentation is one commit      -> class `docs`     count == 1
#   4.3  all tests are one commit                   -> class `test`     count == 1
#   4.4  no fixes of itself                         -> PROXY, see below
#   4.5  purely-formatting changes collected        -> class `style`    count <= 1
#   4.6  db-touching commits carry a [db] tag       -> implication over --name-only
#
# 4.4 IS CHECKED BY PROXY AND THE OUTPUT SAYS SO. "Feature/fix commits touching the same
# files or features are squashed such that the PR contains no fixes of itself" is not
# decidable from subjects: whether commit B fixes commit A is a semantic question. The
# structural proxy asserted instead is DISJOINT MODIFIED-PATH SETS -- no two commits in the
# range share a modified path. It is strictly stronger than the criterion on a
# path-partitioned stack (where it holds by construction) and strictly weaker as a general
# statement about intent. The report prints the proxy's name on every run so no record built
# from this output can silently overclaim what was measured.
#
# CLASSIFICATION. Subject prefixes are read as `type[tag](scope)!: rest`; every element
# after `type` is optional. Recognised classes:
#
#   planning  docs  test  feat  fix  refactor  chore  style  perf  ci  revert
#
# Two extra accepted forms, both measured in this branch:
#   - the bracket-tag form `type[tag]:` -- precedent `feat[admin-tools]`, 3 uses;
#   - the bare `Revert "..."` form git revert generates -- 1 such commit exists.
#
# `planning` HAS NO CONVENTIONAL-COMMIT TYPE OF ITS OWN, so it is also recognised as
# `docs` carrying a `planning` tag or scope: `docs[planning]:` / `docs(planning):`.
# THIS IS LOAD-BEARING FOR 4.1 vs 4.2. Criteria 4.1 and 4.2 are two different single-commit
# classes, so the planning commit MUST NOT be subjected as a bare `docs: ...` -- research's
# candidate message `docs: planning artifacts` would land in the docs class and make 4.2
# read as two commits while 4.1 read as zero. Whoever writes the planning slice's message
# must use `docs[planning]:` (or a bare `planning:`), and this script is where that is enforced.
#
# An unrecognised type is an ERROR NAMING THE COMMIT, never a silent skip. Four classes this
# branch carries were absent from the phase's own context document -- `todo` (3), `roadmap`
# (1), `ci` (1) and the bare `Revert "..."` -- plus `wip` (10), `spike` (9) and `plan` (7).
# A silent skip would let criterion 4 pass with commits nobody placed.
#
# PARSING. One `git log --format='%x01%H%x00%s' --name-only -z <range>` invocation supplies
# both the subjects and the file lists. `%x01` starts each commit record and `%x00` separates
# sha from subject, so neither a subject containing whitespace nor a path containing a space
# can shift a field (one tracked path in this repo does contain a space). Merge commits show
# no files under `--name-only`; the restructured stack is linear by construction, so this is
# recorded rather than worked around.
#
# Output:
#   stdout  the class table (always), then any violation detail, then the summary banner
#   exit    derived from a counter, after the banner and after the remediation prose
#
# Exit codes -- the caller must be able to branch on the status alone:
#   0  CONFORMING: every class placed, every cardinality met, no [db] gap, no shared path
#   1  VIOLATIONS: at least one of the above failed; each is named with its short sha
#   2  usage error (the range does not resolve, or python3 is unavailable)

set -euo pipefail
set -o pipefail

usage() { sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'; }

RANGE="${1:-origin/main..HEAD}"

case "$RANGE" in
  -h|--help) usage; exit 0 ;;
esac

command -v python3 >/dev/null 2>&1 || {
  echo "verify-commit-taxonomy.sh: python3 is required" >&2
  exit 2
}

cd "$(git rev-parse --show-toplevel)"

if ! git rev-list --quiet "$RANGE" >/dev/null 2>&1; then
  echo "verify-commit-taxonomy.sh: not a resolvable commit range: $RANGE" >&2
  usage >&2
  exit 2
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

RAW="$WORK/log.z"
PARSER="$WORK/classify.py"
PARSED="$WORK/parsed.tsv"

git log --format='%x01%H%x00%s' --name-only -z "$RANGE" > "$RAW"

cat > "$PARSER" <<'PYEOF'
# Python 3.9 compatible on purpose -- the host runs 3.9.16 (no match statement, no X | Y).
import re
import sys

KNOWN = ["planning", "docs", "test", "feat", "fix", "refactor",
         "chore", "style", "perf", "ci", "revert"]

HEADER_RE = re.compile(r'^([A-Za-z]+)(?:\[([^\]]*)\])?(?:\(([^)]*)\))?(!?):\s*(.*)$')
BARE_REVERT_RE = re.compile(r'^Revert\s+"')
MIGRATION_RE = re.compile(r'(?:^|/)migrations/[^/]*\.sql$')

DB_PREFIXES = ("apps/supabase/", "packages/supabase-types/")
DB_MARKER = "[db]"

MAX_DETAIL = 20  # rows printed per violation kind; counts are always complete


def classify(subject):
    """Return (class_name, None) or (None, reason). Never raises on a weird subject."""
    if BARE_REVERT_RE.match(subject):
        return "revert", None
    m = HEADER_RE.match(subject)
    if not m:
        return None, "no conventional-commit prefix"
    typ = m.group(1).lower()
    tag = (m.group(2) or "").lower()
    scope = (m.group(3) or "").lower()
    if typ == "docs" and ("planning" in (tag, scope)):
        return "planning", None
    if typ in KNOWN:
        return typ, None
    return None, "unrecognised type '%s'" % m.group(1)


def is_db_path(path):
    if path.startswith(DB_PREFIXES):
        return True
    return MIGRATION_RE.search(path) is not None


def emit(*fields):
    # Tabs are the field separator, so squash any that a subject smuggled in.
    sys.stdout.write("\t".join(str(f).replace("\t", " ") for f in fields) + "\n")


def main(path):
    with open(path, "rb") as fh:
        data = fh.read()

    commits = []
    for rec in data.split(b"\x01"):
        if not rec:
            continue
        parts = rec.split(b"\x00")
        sha = parts[0].decode("utf-8", "replace")
        subject = parts[1].decode("utf-8", "replace") if len(parts) > 1 else ""
        files = []
        for tok in parts[2:]:
            tok = tok.lstrip(b"\n")
            if not tok:
                continue
            files.append(tok.decode("utf-8", "replace"))
        commits.append((sha, subject, files))

    counts = {}
    unknown = []
    db_violations = []
    shared = []
    first_owner = {}

    for sha, subject, files in commits:
        cls, reason = classify(subject)
        if cls is None:
            unknown.append((sha, reason, subject))
            cls = "unknown"
        counts[cls] = counts.get(cls, 0) + 1

        # 4.6 -- the implication: any db-touching path obliges a [db] marker.
        if DB_MARKER not in subject:
            for f in files:
                if is_db_path(f):
                    db_violations.append((sha, subject, f))
                    break

        # 4.4 proxy -- disjoint modified-path sets.
        for f in files:
            owner = first_owner.get(f)
            if owner is None:
                first_owner[f] = sha
            else:
                shared.append((f, owner, sha))

    emit("TOTAL", len(commits))
    for cls in KNOWN + ["unknown"]:
        if cls in counts:
            emit("CLASS", cls, counts[cls])
        elif cls in ("planning", "docs", "test", "style"):
            emit("CLASS", cls, 0)  # a bounded class is reported even when absent

    emit("UNKNOWNCOUNT", len(unknown))
    for sha, reason, subject in unknown[:MAX_DETAIL]:
        emit("UNKNOWN", sha[:9], reason, subject)

    emit("DBVIOLCOUNT", len(db_violations))
    for sha, subject, f in db_violations[:MAX_DETAIL]:
        emit("DBVIOL", sha[:9], subject, f)

    emit("SHAREDCOUNT", len(shared))
    for f, a, b in shared[:MAX_DETAIL]:
        emit("SHARED", f, a[:9], b[:9])


main(sys.argv[1])
PYEOF

python3 "$PARSER" "$RAW" > "$PARSED"

field() { awk -F'\t' -v k="$1" '$1 == k { print $2; exit }' "$PARSED"; }
count_of() { awk -F'\t' -v c="$2" '$1 == "CLASS" && $2 == c { print $3; exit }' "$PARSED"; }

TOTAL="$(field TOTAL)"
UNKNOWNS="$(field UNKNOWNCOUNT)"
DBVIOLS="$(field DBVIOLCOUNT)"
SHAREDS="$(field SHAREDCOUNT)"
ERRORS=0

echo ""
echo "Commit Taxonomy Audit -- criterion 4.1-4.6"
echo "=========================================="
echo "range   : $RANGE"
echo "commits : $TOTAL"
echo ""
printf "  %-10s  %7s  %-10s  %-4s  %s\n" "class" "count" "expected" "ok" "clause"
printf "  %-10s  %7s  %-10s  %-4s  %s\n" "----------" "-------" "----------" "----" "------"

while IFS=$'\t' read -r kind name value _rest; do
  [ "$kind" = "CLASS" ] || continue
  case "$name" in
    planning) expected="== 1";  clause="4.1" ;;
    docs)     expected="== 1";  clause="4.2" ;;
    test)     expected="== 1";  clause="4.3" ;;
    style)    expected="<= 1";  clause="4.5" ;;
    unknown)  expected="== 0";  clause="unplaced" ;;
    *)        expected="-";     clause="-" ;;
  esac
  ok="ok"
  case "$expected" in
    "== 1") [ "$value" -eq 1 ] || { ok="FAIL"; ERRORS=$((ERRORS + 1)); } ;;
    "== 0") [ "$value" -eq 0 ] || ok="FAIL" ;;   # counted via UNKNOWNCOUNT, not twice
    "<= 1") [ "$value" -le 1 ] || { ok="FAIL"; ERRORS=$((ERRORS + 1)); } ;;
    *)      ok="-" ;;
  esac
  printf "  %-10s  %7s  %-10s  %-4s  %s\n" "$name" "$value" "$expected" "$ok" "$clause"
done < "$PARSED"

echo ""
printf "  %-46s  %s\n" "4.6  [db] marker on db-touching commits" "violations: $DBVIOLS"
printf "  %-46s  %s\n" "4.4  PROXY: disjoint modified-path sets" "shared paths: $SHAREDS"
printf "  %-46s  %s\n" "     unplaced commits (unrecognised subject)" "count: $UNKNOWNS"

[ "$UNKNOWNS" -eq 0 ] || ERRORS=$((ERRORS + 1))
[ "$DBVIOLS" -eq 0 ] || ERRORS=$((ERRORS + 1))
[ "$SHAREDS" -eq 0 ] || ERRORS=$((ERRORS + 1))

# The parser caps detail rows at 20 per kind; the counts above are always complete.
shown() { [ "$1" -gt 20 ] && echo "first 20 of $1" || echo "all $1"; }

if [ "$UNKNOWNS" -gt 0 ]; then
  echo ""
  echo "Unplaced commits ($(shown "$UNKNOWNS")):"
  awk -F'\t' '$1 == "UNKNOWN" { printf "  %-10s  %-34s  %s\n", $2, $3, $4 }' "$PARSED"
fi

if [ "$DBVIOLS" -gt 0 ]; then
  echo ""
  echo "Commits touching database paths without a [db] marker ($(shown "$DBVIOLS")):"
  awk -F'\t' '$1 == "DBVIOL" { printf "  %-10s  %s\n              triggering path: %s\n", $2, $3, $4 }' "$PARSED"
fi

if [ "$SHAREDS" -gt 0 ]; then
  echo ""
  echo "Paths modified by more than one commit ($(shown "$SHAREDS")):"
  # Emitted as SHARED <path> <first-owner> <later-commit>; print the two shas first.
  awk -F'\t' '$1 == "SHARED" { printf "  %-9s and %-9s both modify  %s\n", $3, $4, $2 }' "$PARSED"
fi

echo ""
echo "---"
echo "Errors: $ERRORS  (unplaced: $UNKNOWNS, [db] gaps: $DBVIOLS, shared paths: $SHAREDS)"
echo "Note: 4.4 is asserted by its structural proxy (disjoint modified-path sets), not by"
echo "      deciding whether one commit fixes another. Read the verdict accordingly."

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "The commit history does not satisfy criterion 4."
  echo "  - a class over its cardinality: squash its commits into the single commit the"
  echo "    criterion names (4.1 planning, 4.2 other docs, 4.3 tests, 4.5 formatting)."
  echo "  - a class at zero where 1 is expected: the slice was never cut, or its subject"
  echo "    prefix places it elsewhere -- the planning slice needs docs[planning]: or planning:."
  echo "  - an unplaced commit: rewrite its subject to a recognised type, or add the type to"
  echo "    this script's KNOWN list if the project has adopted it."
  echo "  - a [db] gap: add [db] to that commit's subject, e.g. feat[db]: supabase schema."
  echo "  - a shared path: two commits touch the same file, so the stack is not"
  echo "    path-partitioned and one commit is very likely fixing the other."
  exit 1
fi

echo ""
echo "CONFORMING"
exit 0
