#!/usr/bin/env bash
#
# build-slice.sh -- Sync the index under <pathspec...> to TARGET, then commit it onto
#                   PARENT. One invocation == one PR in the review stack (Phase 151, D-07).
#
# Usage:
#   GIT_INDEX_FILE=/tmp/gsd-idx TARGET=<merge-target> PARENT=<stack-tip> \
#     build-slice.sh "<commit message>" <pathspec> [<pathspec>...]
#
#   $1                 REQUIRED. The commit message for this slice.
#   $2...              REQUIRED. One or more git pathspecs. FULL pathspec magic is
#                      available -- `:(exclude)packages/dev-seed` works here, which is why
#                      slices are built on `git diff --raw` and not on `git ls-tree`
#                      (151-RESEARCH.md Pitfall 4: ls-tree rejects :(exclude) with
#                      "pathspec magic not supported by this command", and inside a pipe
#                      that failure is silent).
#
# Environment -- ALL THREE ARE REQUIRED; the script refuses to run without them:
#   GIT_INDEX_FILE     A dedicated index path. NEVER the repo's own .git/index: the whole
#                      mechanism runs beside the worktree, and threat T-151-01-03 makes
#                      an untouched worktree an acceptance criterion.
#   TARGET             The merged-target commit-ish. Every slice pulls content FROM here,
#                      which is what makes the stack tip byte-identical to it.
#   PARENT             The current stack tip. The index must already hold PARENT's tree --
#                      build-rename-commit.sh and previous build-slice.sh runs leave it
#                      that way, which is why they all share one GIT_INDEX_FILE.
#
# How it works:
#   diff --raw PARENT..TARGET restricted to <pathspec...>  ->  index entries  ->
#   write-tree -> commit-tree. Status D becomes mode 0 + a 40-zero OID, which is
#   update-index's removal form.
#
# Three things here are load-bearing and must not be "simplified" (threat T-151-01-01;
# all three failed live during research, and the catch-all laundered the result -- 472
# files absorbed, tree hash still matched):
#   --abbrev=40      git diff --raw abbreviates OIDs by default and update-index then dies
#                    with `fatal: malformed index info` (Pitfall 3).
#   set -o pipefail  `set -e` does NOT fire inside a pipeline, so without pipefail the
#                    slice silently produces nothing while the script reports success.
#   python3 parsing  the -z stream is split on NUL, never on whitespace. The tracked path
#                    `apps/frontend/src/lib/server/api/README.md 21-40-30-014.md` contained a
#                    space (Pitfall 2). Plan 151-14 renamed that file to `README.md` as a
#                    review finding, so the repository no longer contains a spaced path -- the
#                    NUL split stays REQUIRED regardless: a whitespace split would silently
#                    corrupt the index-info stream the moment one reappears, and `git diff`
#                    output is not a whitespace-delimited format.
#   --no-renames     slice content is the target's bytes at the target's paths; rename
#                    detection would be noise here and, at this diff size, wrong noise.
#   diff.renameLimit=20000
#                    carried on every rename-sensitive invocation in this phase so a
#                    measurement never silently degrades (Pitfall 1).
#
# Output:
#   stdout  the produced commit OID -- or PARENT unchanged when the slice is empty, so a
#           caller can unconditionally do PARENT=$(build-slice.sh ...) in a loop
#   stderr  files=<n>, and `EMPTY: <msg>` when the slice changed nothing
#
# Exit codes -- the caller must be able to branch on the status alone:
#   0  a slice commit was produced, OR the slice was empty (see the EMPTY: stderr line)
#   2  usage error (missing message, missing pathspec, or a missing required env var)

set -euo pipefail
set -o pipefail            # REQUIRED -- see the note above and 151-RESEARCH.md Pitfall 3

usage() { sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'; }

for var in GIT_INDEX_FILE TARGET PARENT; do
  if [ -z "${!var:-}" ]; then
    echo "build-slice.sh: $var must be set in the environment" >&2
    usage >&2
    exit 2
  fi
done

if [ "$#" -lt 2 ]; then
  echo "build-slice.sh: a commit message and at least one pathspec are required" >&2
  usage >&2
  exit 2
fi

MSG="$1"; shift

# git pathspecs are cwd-relative; anchor at the repo root so a slice table is written once
# and works from the phase directory and from the root alike.
cd "$(git rev-parse --show-toplevel)"

git -c diff.renameLimit=20000 diff --raw -z --abbrev=40 --no-renames \
      "$PARENT" "$TARGET" -- "$@" \
  | python3 -c '
import sys
recs = sys.stdin.buffer.read().split(b"\0")
out = []
i = 0
while i < len(recs):
    meta = recs[i]
    if not meta:
        break
    i += 1
    path = recs[i]; i += 1
    # meta = :srcmode dstmode srcsha dstsha status
    fields = meta[1:].split()[:5]
    mode_dst, sha_dst, status = fields[1], fields[3], fields[4]
    if status.startswith(b"D"):
        out.append(b"0 " + b"0" * 40 + b"\t" + path)      # mode 0 == remove
    else:
        out.append(mode_dst + b" " + sha_dst + b"\t" + path)
sys.stderr.write("files=%d\n" % len(out))
sys.stdout.buffer.write(b"\0".join(out) + (b"\0" if out else b""))
' | git update-index -z --index-info

TREE="$(git write-tree)"

if [ "$TREE" = "$(git rev-parse "${PARENT}^{tree}")" ]; then
  echo "EMPTY: $MSG" >&2
  echo "$PARENT"
  exit 0
fi

git commit-tree "$TREE" -p "$PARENT" -m "$MSG"
