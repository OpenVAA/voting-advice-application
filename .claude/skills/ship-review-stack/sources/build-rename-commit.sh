#!/usr/bin/env bash
#
# build-rename-commit.sh -- Reconstruct a PURE-RENAME commit on top of a base commit by
#                           re-pathing the base tree BY RULE (Phase 151, D-11 / PR #1).
#
# Usage:
#   .planning/phases/151-ship-v0-2-akita-review-stack/scripts/build-rename-commit.sh
#   build-rename-commit.sh <base-commit-ish>
#   build-rename-commit.sh <base-commit-ish> --drop-prefix backend/
#   GIT_INDEX_FILE=/tmp/gsd-idx build-rename-commit.sh origin/main
#
#   <base-commit-ish>   OPTIONAL positional, default "origin/main". Its tree is re-pathed
#                       and it becomes the parent of the produced commit. Deliberately NOT
#                       defaulted to a hard-coded SHA: 151-01-PLAN.md C-11/C-12 require the
#                       base to be re-resolved at execution time.
#   --drop-prefix <p>   OPTIONAL, repeatable. Any tracked path starting with <p> is omitted
#                       from the new tree, i.e. rendered as a deletion. DEFAULT: nothing is
#                       dropped. Per D-09 Q4 the Strapi removal is split out of PR #1 into
#                       slice 01b, so the rename pass keeps backend/** intact; the flag
#                       exists so slice 01b can reuse this script if it wants to.
#   --message <msg>     OPTIONAL commit message; a default describing the move (and the
#                       drops, when any) is composed otherwise.
#
# The path rule -- derived BY RULE, NEVER by git rename detection:
#     frontend/**  ->  apps/frontend/**
#     docs/**      ->  apps/docs/**       (151-01-PLAN.md C-3: 271 files; the monorepo
#                                          refresh moved docs/ too, not just frontend/)
#     everything else kept verbatim
#   Rationale (threat T-151-01-02): similarity rename detection over a diff this size
#   produces spurious pairs -- measured, backend/vaa-strapi/jest.config.json ->
#   apps/frontend/jest.config.json at R100. Re-pathing the tree cannot produce a spurious
#   pair, because every output blob OID is copied unchanged from the base tree. That is
#   what makes the result render as R100 renames even at diff.renameLimit=1.
#
# Prerequisites:
#   - python3 on PATH. The `git ls-tree -r -z` stream is parsed NUL-split in python3 and
#     never with awk/cut/read: the tracked path
#     `apps/frontend/src/lib/server/api/README.md 21-40-30-014.md` contains a space
#     (151-RESEARCH.md Pitfall 2 -- a whitespace-splitting parser mangles it silently).
#
# Output:
#   stdout  the produced commit OID and NOTHING else, so callers can capture it with $( )
#   stderr  the moved=/kept=/dropped= counters and the R/A/M taxonomy of the result
#
# Index:
#   Honours GIT_INDEX_FILE when exported, so the caller can chain build-slice.sh onto the
#   same index (build-slice.sh applies its diff to whatever the index already holds). With
#   GIT_INDEX_FILE unset a private mktemp index is used. Either way the index is TRUNCATED
#   first -- this script writes a COMPLETE tree listing, so a stale entry would otherwise
#   survive into the result. The worktree is never read and never written.
#
# Exit codes -- the caller must be able to branch on the status alone:
#   0  the rename commit was produced; its OID is on stdout
#   2  usage error (unknown flag, or a flag missing its value)
#   3  the base commit-ish does not resolve, or its tree is empty

set -euo pipefail
set -o pipefail

BASE=""
MSG=""
DROP_PREFIXES=""

usage() { sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'; }

while [ "$#" -gt 0 ]; do
  case "$1" in
    --drop-prefix)
      if [ "$#" -lt 2 ]; then echo "build-rename-commit.sh: --drop-prefix requires a value" >&2; usage >&2; exit 2; fi
      DROP_PREFIXES="${DROP_PREFIXES}$2"$'\n'
      shift 2
      ;;
    --message)
      if [ "$#" -lt 2 ]; then echo "build-rename-commit.sh: --message requires a value" >&2; usage >&2; exit 2; fi
      MSG="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      echo "build-rename-commit.sh: unknown flag $1" >&2; usage >&2; exit 2
      ;;
    *)
      if [ -n "$BASE" ]; then echo "build-rename-commit.sh: unexpected extra argument $1" >&2; usage >&2; exit 2; fi
      BASE="$1"
      shift
      ;;
  esac
done

BASE="${BASE:-origin/main}"

# git pathspecs and plumbing are cwd-relative; anchor everything at the repo root so the
# script behaves identically when invoked from the phase directory or from the root.
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

if ! BASE_SHA="$(git rev-parse --verify --quiet "${BASE}^{commit}")"; then
  echo "build-rename-commit.sh: base commit-ish does not resolve: $BASE" >&2
  exit 3
fi

# A private index unless the caller supplied one to chain onto.
if [ -n "${GIT_INDEX_FILE:-}" ]; then
  IDX="$GIT_INDEX_FILE"
else
  IDX="$(mktemp -t gsd-rename-idx)"
fi
rm -f "$IDX"
export GIT_INDEX_FILE="$IDX"

export DROP_PREFIXES

git ls-tree -r -z "$BASE_SHA" | python3 -c '
import os, sys
drops = [p.encode() for p in os.environ.get("DROP_PREFIXES", "").split("\n") if p]
recs = sys.stdin.buffer.read().split(b"\0")
out = []
moved = kept = dropped = 0
for rec in recs:
    if not rec:
        continue
    meta, path = rec.split(b"\t", 1)          # NUL-safe: path may contain spaces
    mode, _otype, sha = meta.split()
    if any(path.startswith(d) for d in drops):
        dropped += 1
        continue
    if path.startswith(b"frontend/") or path.startswith(b"docs/"):
        path = b"apps/" + path                # monorepo refresh, by rule
        moved += 1
    else:
        kept += 1
    out.append(mode + b" " + sha + b"\t" + path)
sys.stderr.write("moved=%d kept=%d dropped=%d\n" % (moved, kept, dropped))
if not out:
    sys.stderr.write("build-rename-commit.sh: base tree produced no entries\n")
    sys.exit(3)
sys.stdout.buffer.write(b"\0".join(out) + b"\0")
' | git update-index -z --index-info

TREE="$(git write-tree)"

if [ -z "$MSG" ]; then
  MSG="refactor: move frontend/ and docs/ under apps/"
  if [ -n "$DROP_PREFIXES" ]; then
    MSG="refactor: move frontend/ and docs/ under apps/, remove Strapi backend"
  fi
  MSG="${MSG}

Pure path moves. No file contents change: every blob OID is carried over from
${BASE} unchanged, so this commit renders as renames even at diff.renameLimit=1."
fi

C1="$(git commit-tree "$TREE" -p "$BASE_SHA" -m "$MSG")"

# Taxonomy of the result, on stderr so stdout stays a single OID. diff.renameLimit=1 is
# deliberate: exact (blob-OID) renames survive it, so a clean R/0A/0M here is the strongest
# available statement that nothing but paths moved.
{
  echo "--- taxonomy of $C1 (diff.renameLimit=1) ---"
  git -c diff.renameLimit=1 show -M --name-status --format= "$C1" \
    | awk '{print substr($1,1,1)}' | sort | uniq -c
} >&2

echo "$C1"
