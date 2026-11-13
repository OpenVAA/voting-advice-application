#!/usr/bin/env bash
#
# 172-e2e.sh -- one preflight-confirmed E2E run for Phase 172, plus its cardinal-rule verdict.
#
# Usage (PD = .planning/phases/172-terms-of-use-per-user-and-project):
#   bash PD/172-e2e.sh <label> [--project <name>]      one run. Start it in the background and poll --status.
#   bash PD/172-e2e.sh --status <label>                returns at once: `absent`, `running` or `done <exit status>`
#   bash PD/172-e2e.sh --judge <label> [--allow-slice] re-read the newest attempt and exit 0 or 1 by the verdict
#   bash PD/172-e2e.sh --path <label>                  print the newest attempt's directory and nothing else
#
# A run, in order:
#   (1) claims its attempt directory: tests/e2e-runs/172/<label>, or <label>-r2, -r3, ... when the label already
#       holds an attempt, so no evidence is overwritten and a rerun keeps its label;
#   (2) `docker builder prune -af` (the build cache only -- never images, never volumes, never a Docker restart);
#   (3) free space in the Docker VM via `docker run --rm alpine df -k /`; refuses under 13.8 GiB (exit 3);
#   (4) refuses when anything already listens on the wrapper's port (FRONTEND_PORT, default 5273) (exit 5);
#   (5) runs tests/scripts/e2e-run.sh --run-dir <attempt> --no-db-reset [--project <name>] once (one fresh dev
#       server the wrapper spawns and owns; the database is left as it is), stdout+stderr into
#       <attempt>/wrapper.log, its status captured directly and kept as <attempt>/wrapper-exit; the caller's
#       environment passes through unchanged;
#   (6) derives summary.json and provenance.txt with tests/scripts/e2e-evidence.mjs;
#   (7) exits with the wrapper's status when it is non-zero, otherwise 0 or 1 by the verdict below.
# Its last act, on every exit path, is writing the file `done` (its exit status) into the attempt's directory.
#
# The verdict (step 7 and --judge) is green only when all of these hold for the attempt:
#   - summary.json exists; counts.failed, counts.flaky and counts.didNotRun are 0; counts.total and
#     counts.passed are above 0;
#   - the wrapper's recorded status is 0, with one preflight success or more and no preflight failure;
#   - provenance.txt names the full default suite -- unless the run was asked for with --project, or --judge
#     is given --allow-slice;
#   - for a full-suite run whose label is not 172-01-baseline: counts.total is not below the total of the
#     newest 172-01-baseline attempt that holds a summary.json (a drop means tests vanished from the run).
#     A project slice is exempt from this comparison.
# A did-not-run test counts as a failure: the cardinal E2E rule.
#
# It never deletes anything under tests/e2e-runs/.
#
# Exit codes of a run: the wrapper's own status when non-zero (1 Playwright failures, 3 database preparation,
# 4 readiness, 5 port held or server never listened, 6 no positive preflight verdict, 130 interrupted); else
# 0 (verdict green) or 1 (verdict red). 2 usage or precondition error, 3 Docker unavailable or too little
# space, 5 port already held.

set -u

SELF="172-e2e.sh"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT" || exit 2

# Node: the pinned v24.21.0 when it is installed, else the newest version at or above 24.15 under nvm. A
# non-interactive shell's default node on this host is below the engines floor.
NVM_NODE_DIR="$HOME/.nvm/versions/node"
if [ -d "$NVM_NODE_DIR/v24.21.0/bin" ]; then
  export PATH="$NVM_NODE_DIR/v24.21.0/bin:$PATH"
elif [ -d "$NVM_NODE_DIR" ]; then
  PICK="$(ls "$NVM_NODE_DIR" | sed 's/^v//' | awk -F. '($1 > 24) || ($1 == 24 && $2 >= 15)' | sort -t. -k1,1n -k2,2n -k3,3n | tail -n 1)"
  if [ -n "$PICK" ]; then export PATH="$NVM_NODE_DIR/v$PICK/bin:$PATH"; fi
fi

ROOT="tests/e2e-runs/172"
BASELINE_LABEL="172-01-baseline"

usage() {
  echo "usage: $SELF <label> [--project <name>] | --status <label> | --judge <label> [--allow-slice] | --path <label>" >&2
  exit 2
}

# A label is a plain name that cannot be mistaken for an attempt directory of another label.
check_label() {
  case "$1" in
    '' | */* | .* | -*) echo "$SELF: label '$1' must be a plain name" >&2; exit 2 ;;
  esac
  if printf '%s' "$1" | grep -Eq -- '-r[0-9]+$'; then
    echo "$SELF: label '$1' ends like an attempt directory (-rN); choose another" >&2
    exit 2
  fi
}

node_floor_or_exit() {
  if ! node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>24||(a===24&&b>=15)?0:1)' 2> /dev/null; then
    echo "$SELF: node $(node -v 2> /dev/null || echo '(none)') is below the engines floor 24.15.0 and $NVM_NODE_DIR holds no version at or above it" >&2
    exit 2
  fi
}

# Prints the attempt directories of a label, oldest first.
attempts_of() {
  local label="$1" d k
  if [ -d "$ROOT/$label" ]; then echo "1 $ROOT/$label"; fi
  for d in "$ROOT/$label"-r*; do
    [ -d "$d" ] || continue
    k="${d##*-r}"
    case "$k" in '' | *[!0-9]*) continue ;; esac
    echo "$k $d"
  done | sort -n -k1,1
}

# Prints the newest attempt directory of a label, or nothing when the label has none.
newest_attempt() {
  attempts_of "$1" | tail -n 1 | cut -d' ' -f2-
}

# Prints the newest attempt directory of a label that holds a summary.json, or nothing.
newest_summarised_attempt() {
  local best="" line d
  while IFS= read -r line; do
    d="${line#* }"
    if [ -n "$d" ] && [ -f "$d/summary.json" ]; then best="$d"; fi
  done << EOF
$(attempts_of "$1")
EOF
  printf '%s' "$best"
}

# Creates and prints the next free attempt directory of a label.
claim_attempt() {
  local label="$1" n=2 dir="$ROOT/$1"
  mkdir -p "$ROOT" || return 1
  if mkdir "$dir" 2> /dev/null; then
    printf '%s' "$dir"
    return 0
  fi
  while [ "$n" -le 99 ]; do
    dir="$ROOT/$label-r$n"
    if mkdir "$dir" 2> /dev/null; then
      printf '%s' "$dir"
      return 0
    fi
    n=$((n + 1))
  done
  return 1
}

# $1 attempt directory, $2 label, $3 `1` when a project slice is acceptable. Prints the directory and the
# counts line; returns 0 only on a green verdict.
judge_attempt() {
  local dir="$1" label="$2" allow_slice="$3" baseline=""
  if [ "$label" != "$BASELINE_LABEL" ]; then baseline="$(newest_summarised_attempt "$BASELINE_LABEL")"; fi
  echo "$dir"
  node -e '
const fs = require("fs");
const path = require("path");
const [dir, allowSlice, baselineDir] = process.argv.slice(1);
const read = (name) => {
  try {
    return fs.readFileSync(path.join(dir, name), "utf8").trim();
  } catch {
    return null;
  }
};
const reasons = [];
const raw = read("summary.json");
if (raw === null) {
  console.log("172-e2e.sh verdict: RED -- no summary.json in " + dir);
  process.exit(1);
}
const c = JSON.parse(raw).counts;
console.log(`172-e2e.sh counts: total ${c.total}, passed ${c.passed}, failed ${c.failed}, flaky ${c.flaky}, skipped ${c.skipped}, didNotRun ${c.didNotRun}`);
if (c.failed) reasons.push(`${c.failed} failed`);
if (c.flaky) reasons.push(`${c.flaky} flaky`);
if (c.didNotRun) reasons.push(`${c.didNotRun} did not run`);
if (!c.total) reasons.push("no test in the run");
if (!c.passed) reasons.push("no passed test");
const wrapperExit = read("wrapper-exit");
if (wrapperExit !== "0") reasons.push(`wrapper status ${wrapperExit === null ? "not recorded" : wrapperExit}`);
const preflightOk = Number(read("preflight-successes") || 0);
const preflightFail = Number(read("preflight-failures") || 0);
if (preflightOk < 1) reasons.push("no preflight success recorded");
if (preflightFail > 0) reasons.push(`${preflightFail} preflight failure(s)`);
const provenance = read("provenance.txt") || "";
const fullSuite = /^project:\s+<full default suite>$/m.test(provenance);
console.log(`172-e2e.sh scope: ${fullSuite ? "the full default suite" : "a project slice (or no provenance)"}`);
if (!fullSuite && allowSlice !== "1") reasons.push("provenance.txt does not name the full default suite");
if (fullSuite && baselineDir) {
  const base = JSON.parse(fs.readFileSync(path.join(baselineDir, "summary.json"), "utf8")).counts.total;
  console.log(`172-e2e.sh baseline: total ${base} in ${baselineDir}`);
  if (c.total < base) reasons.push(`total ${c.total} is below the baseline total ${base}: tests vanished from the run`);
}
if (reasons.length) {
  console.log("172-e2e.sh verdict: RED -- " + reasons.join("; "));
  process.exit(1);
}
console.log("172-e2e.sh verdict: GREEN");
' "$dir" "$allow_slice" "$baseline"
}

MODE="run"
case "${1:-}" in
  --status | --judge | --path)
    MODE="${1#--}"
    shift
    ;;
  --*) usage ;;
esac
if [ $# -lt 1 ]; then usage; fi
LABEL="$1"
shift
check_label "$LABEL"

if [ "$MODE" = "status" ]; then
  if [ $# -ne 0 ]; then usage; fi
  D="$(newest_attempt "$LABEL")"
  if [ -z "$D" ]; then
    echo "absent"
  elif [ -f "$D/done" ]; then
    echo "done $(cat "$D/done")"
  else
    echo "running"
  fi
  exit 0
fi

if [ "$MODE" = "path" ]; then
  if [ $# -ne 0 ]; then usage; fi
  D="$(newest_attempt "$LABEL")"
  if [ -z "$D" ]; then exit 1; fi
  echo "$D"
  exit 0
fi

if [ "$MODE" = "judge" ]; then
  ALLOW_SLICE=0
  while [ $# -gt 0 ]; do
    case "$1" in
      --allow-slice) ALLOW_SLICE=1; shift ;;
      *) usage ;;
    esac
  done
  node_floor_or_exit
  D="$(newest_attempt "$LABEL")"
  if [ -z "$D" ]; then
    echo "$SELF: label '$LABEL' has no attempt under $ROOT" >&2
    exit 1
  fi
  judge_attempt "$D" "$LABEL" "$ALLOW_SLICE"
  exit $?
fi

# ---- a run -------------------------------------------------------------------------------------------------

PROJECT_ARGS=()
SLICE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --project)
      if [ $# -lt 2 ]; then echo "$SELF: --project requires a value" >&2; exit 2; fi
      PROJECT_ARGS=(--project "$2")
      SLICE=1
      shift 2
      ;;
    *) echo "$SELF: unexpected argument '$1'" >&2; usage ;;
  esac
done

RUN_DIR="$(claim_attempt "$LABEL")"
if [ -z "$RUN_DIR" ]; then
  echo "$SELF: could not create an attempt directory for '$LABEL' under $ROOT" >&2
  exit 2
fi
on_exit() {
  local s=$?
  printf '%s\n' "$s" > "$RUN_DIR/done"
  exit "$s"
}
trap on_exit EXIT
trap 'exit 130' INT TERM

node_floor_or_exit

# (2) build cache only.
echo "$SELF [$LABEL] attempt $RUN_DIR"
echo "$SELF [$LABEL] docker builder prune -af"
docker builder prune -af > /dev/null 2>&1
prune_status=$?
if [ "$prune_status" -ne 0 ]; then
  echo "$SELF: docker builder prune failed (exit $prune_status) -- is Docker running?" >&2
  exit 3
fi

# (3) free space in the Docker VM, captured into a variable first so a docker failure is not read as a number.
DF_OUT="$(docker run --rm alpine df -k / 2>&1)"
df_status=$?
if [ "$df_status" -ne 0 ]; then
  echo "$SELF: could not measure Docker VM free space (exit $df_status): $DF_OUT" >&2
  exit 3
fi
AVAIL_KIB="$(printf '%s\n' "$DF_OUT" | awk 'NR==2 {print $4}')"
MIN_KIB=14470349 # 13.8 GiB, the floor the operator accepted for this host
case "$AVAIL_KIB" in
  '' | *[!0-9]*) echo "$SELF: could not parse free space from: $DF_OUT" >&2; exit 3 ;;
esac
AVAIL_GIB="$(LC_ALL=C awk -v k="$AVAIL_KIB" 'BEGIN { printf "%.2f", k / 1048576 }')"
if [ "$AVAIL_KIB" -lt "$MIN_KIB" ]; then
  echo "$SELF: only ${AVAIL_GIB} GiB free in the Docker VM (floor 13.8 GiB) -- stop and report; never restart Docker or prune images/volumes" >&2
  exit 3
fi
echo "$SELF [$LABEL] Docker VM free: ${AVAIL_GIB} GiB"

# (4) the port the wrapper will bind, resolved as the wrapper resolves it.
PORT="${FRONTEND_PORT:-5273}"
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN > /dev/null 2>&1; then
  echo "$SELF: a process already listens on port $PORT:" >&2
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >&2
  exit 5
fi

# (5) one wrapper run.
printf 'label: %s\ndocker_vm_free_gib: %s\nport: %s\nnode: %s\nslice: %s\n' \
  "$LABEL" "$AVAIL_GIB" "$PORT" "$(node -v)" "${PROJECT_ARGS[*]:-none}" > "$RUN_DIR/172-preflight.txt"
echo "$SELF [$LABEL] tests/scripts/e2e-run.sh --run-dir $RUN_DIR --no-db-reset ${PROJECT_ARGS[*]:-}"
tests/scripts/e2e-run.sh --run-dir "$RUN_DIR" --no-db-reset ${PROJECT_ARGS[@]+"${PROJECT_ARGS[@]}"} > "$RUN_DIR/wrapper.log" 2>&1
s=$?
printf '%s\n' "$s" > "$RUN_DIR/wrapper-exit"
# The Playwright argument line is what e2e-evidence.mjs reads to tell the full suite from a slice.
grep -m1 '^e2e-run.sh: npx playwright ' "$RUN_DIR/wrapper.log" | sed 's/^e2e-run.sh: //' > "$RUN_DIR/command"
echo "$SELF [$LABEL] wrapper exit $s"

# (6) derived evidence.
node tests/scripts/e2e-evidence.mjs "$RUN_DIR" --note "$LABEL"
ev=$?
if [ "$ev" -ne 0 ]; then
  echo "$SELF: e2e-evidence.mjs exited $ev -- no summary.json to judge" >&2
  if [ "$s" -ne 0 ]; then exit "$s"; fi
  exit 1
fi

# (7) the verdict.
judge_attempt "$RUN_DIR" "$LABEL" "$SLICE"
verdict=$?
if [ "$s" -ne 0 ]; then exit "$s"; fi
exit "$verdict"
