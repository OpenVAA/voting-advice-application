#!/usr/bin/env bash
#
# record-hygiene-read.sh -- record that a plan's agent read a changed file after its last change.
#
# Usage:
#   record-hygiene-read.sh <plan-id> <path>...
#
#   <plan-id>  `165-NN`, the plan recording the read. Rows go to `hygiene-reads/<plan-id>.tsv`.
#   <path>     Repo-relative paths the agent has read in full, in their current working-tree state.
#
# The gate runs first: `hygiene-changed-files.sh --files <path>...` must exit 0, or nothing is
# recorded. A read of a dirty file is not a read that proves anything. On success, one row per
# path is appended: `path<TAB>git hash-object of the working-tree file<TAB>plan-id`. An identical
# row already present is not duplicated. `hygiene-changed-files.sh --check-reads` then accepts a
# path only while its current blob has a row, so any later edit to the file voids the read.
#
# Exit codes:
#   0  every path passed the gate and is recorded
#   1  the gate reported residue; nothing recorded
#   2  usage error or gate tool error; nothing recorded

set -euo pipefail
set -o pipefail

usage() { sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'; }

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)
cd "$ROOT"

case "${1:-}" in -h|--help) usage; exit 0 ;; esac
[ "$#" -ge 2 ] || { echo "record-hygiene-read.sh: need <plan-id> and at least one path" >&2; usage >&2; exit 2; }

PLAN_ID="$1"
shift
case "$PLAN_ID" in
  165-[0-9][0-9]) ;;
  *) echo "record-hygiene-read.sh: plan id must look like 165-NN, got: $PLAN_ID" >&2; exit 2 ;;
esac

st=0
bash "$SCRIPT_DIR/hygiene-changed-files.sh" --files "$@" || st=$?
if [ "$st" -ne 0 ]; then
  echo "record-hygiene-read.sh: the hygiene gate exited $st; refusing to record a read" >&2
  if [ "$st" -eq 1 ]; then exit 1; fi
  exit 2
fi

LOG="$SCRIPT_DIR/hygiene-reads/$PLAN_ID.tsv"
mkdir -p "$SCRIPT_DIR/hygiene-reads"
touch "$LOG"
for p in "$@"; do
  p="${p#./}"
  blob=$(git hash-object -- "$p")
  row=$(printf '%s\t%s\t%s' "$p" "$blob" "$PLAN_ID")
  if grep -qxF -- "$row" "$LOG"; then
    echo "already recorded: $p ($blob)"
  else
    printf '%s\n' "$row" >> "$LOG"
    echo "recorded: $p ($blob) -> hygiene-reads/$PLAN_ID.tsv"
  fi
done
