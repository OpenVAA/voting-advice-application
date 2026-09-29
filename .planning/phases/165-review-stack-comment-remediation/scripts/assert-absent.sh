#!/usr/bin/env bash
#
# assert-absent.sh -- a negative grep that fails closed.
#
# Usage:
#   assert-absent.sh '<pcre>' -- <pathspec>...
#
# Runs `git grep -I -n -P --untracked -e <pcre> -- <pathspec>...` (tracked plus untracked,
# non-ignored files in the working tree), with no pipe, and branches on its status. A plain
# `! git grep ...` reads a grep error -- an invalid pattern, an unreadable tree -- as "absent",
# which turns a broken negative gate into a pass. Here an error has its own exit status.
#
# A pathspec that matches no file is also an error, not an absence: `git grep` exits 1 on it
# silently, so a typo in the path would otherwise prove the pattern absent from nothing.
#
# Exit codes -- the caller must be able to branch on the status alone:
#   0  no match; prints `absent`
#   1  at least one match; every match is printed as `path:line:text`
#   2  usage error, grep error (printed), or a pathspec matching no file

set -euo pipefail
set -o pipefail

usage() { sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'; }

case "${1:-}" in -h|--help) usage; exit 0 ;; esac
if [ "$#" -lt 3 ] || [ "$2" != "--" ]; then
  echo "assert-absent.sh: expected '<pcre>' -- <pathspec>..." >&2
  usage >&2
  exit 2
fi

PATTERN="$1"
shift 2

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

TMP=$(mktemp -d "${TMPDIR:-/tmp}/absent165.XXXXXX")
trap 'rm -rf "$TMP"' EXIT

st=0
git ls-files --cached --others --exclude-standard -- "$@" > "$TMP/files" 2> "$TMP/ls.err" || st=$?
if [ "$st" -ne 0 ]; then
  echo "assert-absent.sh: git ls-files exited $st" >&2
  cat "$TMP/ls.err" >&2
  exit 2
fi
if [ ! -s "$TMP/files" ]; then
  echo "assert-absent.sh: the pathspec matches no file: $*" >&2
  exit 2
fi

st=0
git grep -I -n -P --untracked -e "$PATTERN" -- "$@" > "$TMP/out" 2> "$TMP/err" || st=$?
case "$st" in
  1)
    echo "absent"
    exit 0
    ;;
  0)
    cat "$TMP/out"
    echo "assert-absent.sh: $(wc -l < "$TMP/out" | tr -d ' ') match(es) of $PATTERN" >&2
    exit 1
    ;;
  *)
    echo "assert-absent.sh: git grep exited $st" >&2
    cat "$TMP/err" >&2
    exit 2
    ;;
esac
