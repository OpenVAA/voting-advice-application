#!/usr/bin/env bash
#
# determinism-batch.sh -- Run N SERIAL, preflight-confirmed, validity-enforced full-suite
#                         E2E runs on ONE pinned git HEAD and emit a mechanically derived
#                         ledger (Phase 138, D-13/D-14/D-15 -- criterion 3, INTEG-02).
#
# Usage:
#   tests/scripts/determinism-batch.sh                                   # the gate: 16 full-suite runs
#   tests/scripts/determinism-batch.sh --runs 16 --ledger-file .planning/.../138-DETERMINISM-LEDGER.md
#   tests/scripts/determinism-batch.sh --runs 2 --project eperm07-term-trigger \
#       --ledger-dir tests/e2e-runs/selftest-batch                       # fast scoped self-check
#
#   --runs <N>          How many runs. Default 16 (2x the observed 1-in-8 rate, D-13).
#                       STRICTLY validated: a non-integer or a value below 1 exits 2 with
#                       usage. A value below 16 is accepted, but the emitted ledger says
#                       in its header that it does NOT satisfy the acceptance threshold.
#   --project <name>    Restrict every run to one Playwright project. FOR SELF-CHECKING
#                       ONLY: the emitted ledger is stamped as a scoped check in its
#                       header so it can never be mistaken for gate evidence.
#   --ledger-dir <path> Where run-NN directories are created. Relative paths resolve
#                       against the REPO ROOT. Default: tests/e2e-runs/determinism-batch
#                       (git-ignored, per plan 01).
#   --ledger-file <path> Where the markdown ledger is written. Default:
#                       <ledger-dir>/138-DETERMINISM-LEDGER.md
#   --carry-discards <path>
#                       A TSV of already-formatted abort rows from a PREVIOUS, discarded
#                       attempt. They are carried into this batch's "Aborts and discards"
#                       section so a restart cannot erase the record of what it restarted
#                       from. Carried rows are historical: they precede run 01 of THIS
#                       batch and so do not break its consecutive count, but they are never
#                       dropped -- silence about a discarded attempt is exactly what makes
#                       a green arguable.
#
# Prerequisites:
#   - The working tree is COMMITTED. The batch pins one HEAD and aborts if it changes
#     mid-batch: "16 consecutive runs" means 16 runs of one tree.
#   - Docker is running (the single-run wrapper starts Supabase itself).
#   - NOTHING is listening on $FRONTEND_PORT. Each run spawns and owns its own dev server.
#   - Free disk for the projected artifact volume. Run 1 is MEASURED and projected before
#     the batch commits to the remaining runs (RESEARCH Pitfall 6).
#   - UNATTENDED: ~11.5 min per full suite plus per-run preconditions is 3.2-3.8 h for 16
#     runs (RESEARCH SR5.1). Do not interleave other work on this host -- that changes the
#     contention environment the runs are measuring.
#
# The script automatically:
#   1. Refuses to start with CI present -- it would buy `retries: 3` and collapse to a
#      single worker (playwright.config.ts:115,117), changing BOTH the retry posture and
#      the contention environment the failure lives in
#   2. Unsets the three EPERM07_ forcing knobs and records that it did
#   3. Pins git HEAD once, and ABORTS any iteration that observes a different HEAD
#   4. Loops SERIALLY -- one run at a time, never two suites concurrently -- delegating
#      every per-run step (database reset, readiness poll, dev-server spawn and teardown,
#      Playwright invocation, preflight capture) to tests/scripts/e2e-run.sh
#   5. Derives each ledger row MECHANICALLY from that run's results.json and the wrapper's
#      artifact files -- nothing is transcribed from human-readable console output
#   6. Enforces the validity rules AS CODE: preflight failures 0 AND at least one preflight
#      SUCCESS line, executed count equals the expected constant, failed and did-not-run 0,
#      wrapper exit 0. An invalid run ABORTS the batch; it is recorded with its reason,
#      never skipped and never renumbered
#   7. Measures run 1's directory and projects the total BEFORE committing to the rest,
#      then prunes each valid run to its machine-readable and text evidence
#   8. Regenerates the markdown ledger after every iteration, so an interrupted batch still
#      leaves a complete, honest record on disk
#   9. Stamps the ledger from an EXIT trap if the batch dies unexpectedly, so an
#      INCOMPLETE ledger can never read as "No run in this batch was aborted"
#
# NEW CONVENTION (as with e2e-run.sh in plan 01): nothing else in tests/ is orchestrated by
# a shell script; per-iteration exit-code capture and a machine-readable ledger have no
# in-repo precedent at all. Style follows apps/supabase/benchmarks/scripts/run-benchmarks.sh
# (shebang form, header block, `set -euo pipefail`, script-location-relative paths,
# "${VAR:-default}" env defaults).
#
# Exit codes:
#   0  every requested run was VALID
#   2  usage error (bad --runs, unknown argument)
#   3  CI is present in the environment
#   4  git HEAD changed mid-batch, or the projected artifact volume does not fit on disk
#   5  a run was INVALID (the batch stopped at that run; the ledger names it)
# 130  the batch was interrupted (recorded as a discard, never as a pass)

set -euo pipefail

# Auto-detect paths from script location -- cwd-independence is not optional here.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$TESTS_DIR/.." && pwd)"
RUNNER="$SCRIPT_DIR/e2e-run.sh"

# The full gate suite's expected executed count. It was 134 through Phase 137; plan 01 of
# this phase ships the eperm07-term-trigger hunt spec PERMANENTLY as a LEAF regression
# guard, which moved it to 135. Every later v2.15 phase reconciles against 135.
EXPECTED_EXECUTED=135

# The step whose outcome criterion 3 is actually about
# (tests/tests/specs/voter/voter-journey.spec.ts:866).
EPERM07_STEP_PREFIX='EPERM-07 customData.terms'

RUNS=16
PROJECT=""
LEDGER_DIR=""
LEDGER_FILE=""
CARRY_DISCARDS=""
SCOPED=0
BATCH_START=""
PINNED_HEAD=""
OBSERVED_WORKERS="pending"
OBSERVED_RETRIES="pending"
RUN1_KB=""
PROJECTED_MB=""
ACTUAL_KB=""
INTERRUPTED=0
# Set by `record_abort` so the EXIT trap never double-records an abort that the
# batch already recorded deliberately, and by the tail of the loop so a clean
# finish is not mistaken for an unexpected death.
ABORT_RECORDED=0
BATCH_COMPLETE=0

usage() {
  # Delimit the header block rather than hardcoding a line range: the previous
  # `sed -n '2,Np'` truncated the exit-code table the header tells the caller to
  # branch on, and drifted further every time the header grew.
  sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'
}

# A value-taking flag given as the LAST argument must be a USAGE error, not a silent
# death. `VAR="${2:-}"; shift 2` looks safe but is not: with one positional left,
# `shift 2` fails, and under `set -euo pipefail` the script dies with exit 1 -- no
# message, no usage -- which this batch would then record as RUN_STATUS=1 -> INVALID
# with a reason naming the wrapper's exit table. A typo must not read as a test failure.
#
# $1 = flag name, $2 = the caller's remaining argument count ($#).
require_value() {
  if [ "$2" -lt 2 ]; then
    echo "determinism-batch.sh: $1 requires a value" >&2
    usage >&2
    exit 2
  fi
}

# --- argument parsing ---------------------------------------------------------------

while [ $# -gt 0 ]; do
  case "$1" in
    --runs)
      require_value --runs $#
      RUNS="$2"
      shift 2
      ;;
    --project)
      require_value --project $#
      PROJECT="$2"
      shift 2
      ;;
    --ledger-dir)
      require_value --ledger-dir $#
      LEDGER_DIR="$2"
      shift 2
      ;;
    --ledger-file)
      require_value --ledger-file $#
      LEDGER_FILE="$2"
      shift 2
      ;;
    --carry-discards)
      require_value --carry-discards $#
      CARRY_DISCARDS="$2"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "determinism-batch.sh: unknown argument '$1'" >&2
      usage >&2
      exit 2
      ;;
  esac
done

# A degenerate run count must be REJECTED, not coerced: a silently-clamped 0 would emit an
# empty ledger that still looks like a batch.
if ! printf '%s' "$RUNS" | grep -qE '^[0-9]+$' || [ "$RUNS" -lt 1 ]; then
  echo "determinism-batch.sh: --runs must be an integer >= 1 (got '$RUNS')" >&2
  usage >&2
  exit 2
fi

if [ -n "$PROJECT" ]; then
  SCOPED=1
fi

# --- environment posture, asserted once and loudly, BEFORE anything is created ---------

# CI matters TWICE over, which is why this is a refusal and not a warning: `retries: 3`
# would make the batch itself the "retried-until-green" outcome the cardinal rule forbids,
# and `workers: 1` would run it in a quieter posture than the one the 1-in-8 was observed
# in -- weaker evidence dressed up as stronger.
if [ -n "${CI:-}" ]; then
  echo "determinism-batch.sh: FATAL -- CI is set in the environment." >&2
  echo "  With CI present the config buys retries: 3 per test and collapses to a single" >&2
  echo "  worker (tests/playwright.config.ts:115,117). That changes the retry posture AND" >&2
  echo "  the contention environment the failure lives in; a green produced that way would" >&2
  echo "  itself be the retried-until-green closure the cardinal rule forbids." >&2
  exit 3
fi

# The forcing harness must never leak into a gate run (RESEARCH Pitfall 2). The wrapper
# unsets these too; doing it here as well means the batch's own record is self-contained.
unset EPERM07_FORCE_BUDGET_MS EPERM07_FORCE_CPU_RATE EPERM07_NO_VT || true

if [ ! -x "$RUNNER" ]; then
  echo "determinism-batch.sh: FATAL -- $RUNNER is missing or not executable" >&2
  exit 2
fi

LEDGER_DIR="${LEDGER_DIR:-tests/e2e-runs/determinism-batch}"
case "$LEDGER_DIR" in
  /*) : ;;
  *) LEDGER_DIR="$REPO_ROOT/$LEDGER_DIR" ;;
esac
mkdir -p "$LEDGER_DIR"

LEDGER_FILE="${LEDGER_FILE:-$LEDGER_DIR/138-DETERMINISM-LEDGER.md}"
case "$LEDGER_FILE" in
  /*) : ;;
  *) LEDGER_FILE="$REPO_ROOT/$LEDGER_FILE" ;;
esac
mkdir -p "$(dirname "$LEDGER_FILE")"

ROWS_FILE="$LEDGER_DIR/rows.tsv"
ABORTS_FILE="$LEDGER_DIR/aborts.tsv"
: > "$ROWS_FILE"
: > "$ABORTS_FILE"

# Carried discards seed the aborts section BEFORE run 01, so a restart cannot erase the
# record of the attempt it restarted from.
CARRIED_COUNT=0
if [ -n "$CARRY_DISCARDS" ]; then
  case "$CARRY_DISCARDS" in
    /*) : ;;
    *) CARRY_DISCARDS="$REPO_ROOT/$CARRY_DISCARDS" ;;
  esac
  if [ ! -f "$CARRY_DISCARDS" ]; then
    echo "determinism-batch.sh: --carry-discards file not found: $CARRY_DISCARDS" >&2
    exit 2
  fi
  cat "$CARRY_DISCARDS" >> "$ABORTS_FILE"
  CARRIED_COUNT="$(wc -l < "$ABORTS_FILE" | tr -d ' ')"
fi

# --- provenance -----------------------------------------------------------------------

PINNED_HEAD="$(git -C "$REPO_ROOT" rev-parse HEAD)"
BATCH_START="$(date -u +%FT%TZ)"
DIRTY_FILES="$(git -C "$REPO_ROOT" status --porcelain | wc -l | tr -d ' ')"
DIRTY_LIST="$(git -C "$REPO_ROOT" status --porcelain | awk '{print $2}' | paste -sd' ' -)"

# --- ledger emission ------------------------------------------------------------------

# The ledger is REGENERATED after every iteration rather than appended to, so an
# interrupted batch still leaves a complete file with its abort recorded.
emit_ledger() {
  {
    echo "# Phase 138 -- Determinism batch ledger (criterion 3, INTEG-02)"
    echo
    if [ "$SCOPED" = "1" ]; then
      echo "> **SELF-TEST -- not gate evidence.** This batch was scoped to the Playwright"
      echo "> project \`$PROJECT\`, so it did not execute the full suite. It exercises the batch"
      echo "> harness itself and satisfies no acceptance criterion."
      echo
    fi
    if [ "$RUNS" -lt 16 ]; then
      echo "> **This ledger does NOT satisfy the acceptance threshold.** $RUNS run(s) were"
      echo "> requested; criterion 3 requires at least 16 consecutive full-suite runs."
      echo
    fi
    echo "## Header"
    echo
    echo "| Field | Value |"
    echo "|---|---|"
    echo "| Batch start (UTC) | \`$BATCH_START\` |"
    echo "| Batch end (UTC) | \`${BATCH_END:-in progress}\` |"
    echo "| Pinned git HEAD | \`$PINNED_HEAD\` |"
    echo "| Runs requested | $RUNS |"
    echo "| Runs recorded | $(wc -l < "$ROWS_FILE" | tr -d ' ') |"
    echo "| Playwright project scope | ${PROJECT:-full gate suite (\`--grep-invert @probe\`)} |"
    echo "| Expected executed count | $EXPECTED_EXECUTED |"
    echo "| \`CI\` in environment | absent -- the batch refuses to start with it set |"
    echo "| Forcing knobs | \`EPERM07_FORCE_BUDGET_MS\`, \`EPERM07_FORCE_CPU_RATE\`, \`EPERM07_NO_VT\` explicitly unset by the batch |"
    echo "| Effective retries (observed) | $OBSERVED_RETRIES |"
    echo "| Effective workers (observed) | $OBSERVED_WORKERS |"
    echo "| Working tree at batch start | $DIRTY_FILES file(s) modified: ${DIRTY_LIST:-none} |"
    echo "| Ledger directory | \`${LEDGER_DIR#"$REPO_ROOT"/}\` (git-ignored) |"
    echo
    echo "**Expected executed count.** It was **134** through Phase 137. Plan 01 of this phase"
    echo "ships the \`eperm07-term-trigger\` hunt spec permanently in the default suite, which moved"
    echo "the baseline to **135**. This is a decision, not drift; see \`## Executed-count baseline\`."
    echo
    echo "**Observed posture** is read back out of each run's \`results.json\` (\`config.workers\`,"
    echo "\`config.projects[].retries\`) rather than restated from the config file, so the claim is"
    echo "auditable rather than asserted."
    echo
    echo "**Pruning policy.** Every count in this ledger is derived from a run's \`results.json\`"
    echo "before anything is pruned. A run that is VALID is then reduced to its machine-readable and"
    echo "text evidence -- \`results.json\`, \`stdout.log\`, \`devserver.log\`, \`db-reset.log\`,"
    echo "\`env-posture.txt\` and the provenance files (\`started\`, \`ended\`, \`head\`, \`exit\`,"
    echo "\`preflight-failures\`, \`worktree-status.txt\`) -- by deleting its HTML report directory,"
    echo "which is where the traces and videos live. A run that is NOT valid keeps everything."
    echo
    echo "**Fix state being proved.** See \`138-NEGATIVE-CONTROL.md\` for the criterion-2 pair"
    echo "(pre-fix FAILS / post-fix PASSES under the forcing harness) that this batch runs on top of."
    echo
    echo "## Per-run ledger"
    echo
    echo "One row per run, in execution order. Start and end are the wrapper's own UTC stamps, so"
    echo "run N+1's start being at or after run N's end is itself the proof the batch was serial."
    echo "Wall clock is informational only and is never an input to a pass/fail decision."
    echo
    echo "| Run | Start (UTC) | End (UTC) | Wall | HEAD | Exit | Preflight fails | Preflight OKs | Executed | Passed | Failed | Flaky | Did-not-run | EPERM-07 step | Verdict | Artifacts |"
    echo "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"
    if [ -s "$ROWS_FILE" ]; then
      cat "$ROWS_FILE"
    else
      echo "| _(no run completed)_ | | | | | | | | | | | | | | | |"
    fi
    echo
    echo "## Aborts and discards"
    echo
    if [ -s "$ABORTS_FILE" ]; then
      local total_aborts own_aborts
      total_aborts="$(wc -l < "$ABORTS_FILE" | tr -d ' ')"
      own_aborts="$(( total_aborts - CARRIED_COUNT ))"
      echo "| Run | When (UTC) | Reason |"
      echo "|---|---|---|"
      cat "$ABORTS_FILE"
      echo
      echo "An abort RESETS the consecutive count. The batch does not continue past one, and the"
      echo "slot is never quietly re-used: criterion 3 measures consecutive runs, and silence about"
      echo "aborts is exactly what makes a green arguable."
      if [ "$CARRIED_COUNT" -gt 0 ]; then
        echo
        echo "The first **$CARRIED_COUNT** row(s) above are CARRIED from a previous, discarded attempt"
        echo "and are historical: they happened before run 01 of this batch, and the batch restarted"
        echo "from run 01 rather than resuming into the vacated slot. They are carried precisely so a"
        echo "restart cannot erase the record of what it restarted from."
      fi
      if [ "$own_aborts" -le 0 ]; then
        echo
        echo "**This batch itself aborted no run.** Every row above is carried history."
      fi
    else
      echo "**None.** No run in this batch was aborted, discarded or restarted. This section is"
      echo "stated explicitly rather than omitted, because an omitted section and an empty one are"
      echo "indistinguishable to a later reader."
    fi
    echo
    echo "## Disk"
    echo
    echo "| Measure | Value |"
    echo "|---|---|"
    echo "| Run 01 directory, measured before pruning | ${RUN1_KB:-pending} KB |"
    echo "| Projected total for $RUNS runs, unpruned | ${PROJECTED_MB:-pending} MB |"
    echo "| Actual total on disk after pruning | ${ACTUAL_KB:-pending} KB |"
    echo "| Pruned | the HTML report directory of every valid run (it embeds the trace and video) |"
    echo
  } > "$LEDGER_FILE"
}

record_abort() {
  local idx="$1" reason="$2"
  ABORT_RECORDED=1
  printf '| %s | %s | %s |\n' "$idx" "$(date -u +%FT%TZ)" "$reason" >> "$ABORTS_FILE"
  emit_ledger
  echo "determinism-batch.sh: ABORT at run $idx -- $reason" >&2
  echo "determinism-batch.sh: ledger written to $LEDGER_FILE" >&2
}

on_signal() {
  INTERRUPTED=1
  record_abort "${RUN_LABEL:-n/a}" "batch INTERRUPTED (SIGINT/SIGTERM); recorded as a discard, not a pass"
  exit 130
}

# `trap on_signal INT TERM` covers interrupts and every validity failure calls
# `record_abort` explicitly -- but NOTHING covered a `set -e` death: a failing
# `git rev-parse`, `du -sk` or `mkdir`, or a full disk inside `emit_ledger`. In that
# state the last-emitted ledger still says, in the one section a reader checks for
# aborts, "**None.** No run in this batch was aborted, discarded or restarted" -- which
# is affirmatively false, in the document whose stated purpose is that silence about a
# discarded attempt is what makes a green arguable. The only tell was `Batch end | in
# progress` in the header table.
#
# Stamp an incomplete batch instead. Guarded three ways so it can only ever fire for a
# death nobody recorded: a clean finish sets BATCH_COMPLETE, an interrupt sets
# INTERRUPTED, and any deliberate abort sets ABORT_RECORDED.
on_exit() {
  local st=$?
  set +e
  if [ "$st" != "0" ] && [ "$INTERRUPTED" != "1" ] && [ "$ABORT_RECORDED" != "1" ] && [ "$BATCH_COMPLETE" != "1" ]; then
    record_abort "${RUN_LABEL:-n/a}" "batch terminated UNEXPECTEDLY (exit $st) -- this ledger is INCOMPLETE and proves nothing about consecutiveness" || true
  fi
  exit "$st"
}
trap on_signal INT TERM
trap on_exit EXIT

# --- the serial loop --------------------------------------------------------------------

echo "determinism-batch.sh: $RUNS run(s), pinned HEAD $PINNED_HEAD"
echo "determinism-batch.sh: ledger dir  $LEDGER_DIR"
echo "determinism-batch.sh: ledger file $LEDGER_FILE"
emit_ledger

i=1
while [ "$i" -le "$RUNS" ]; do
  RUN_LABEL="$(printf '%02d' "$i")"
  RUN_DIR="$LEDGER_DIR/run-$RUN_LABEL"

  # A mid-batch commit silently invalidates "16 consecutive runs of one tree". Re-read
  # rather than trust the pin.
  CURRENT_HEAD="$(git -C "$REPO_ROOT" rev-parse HEAD)"
  if [ "$CURRENT_HEAD" != "$PINNED_HEAD" ]; then
    record_abort "$RUN_LABEL" "git HEAD mismatch -- pinned \`$PINNED_HEAD\`, observed \`$CURRENT_HEAD\`. The batch proves ONE tree; a mid-batch change invalidates the consecutive count."
    exit 4
  fi

  echo
  echo "determinism-batch.sh: ===== run $RUN_LABEL of $RUNS ====="
  mkdir -p "$RUN_DIR"

  RUN_ARGS=(--run-dir "$RUN_DIR")
  if [ -n "$PROJECT" ]; then
    RUN_ARGS+=(--project "$PROJECT")
  fi

  RUN_T0="$(date +%s)"
  set +e
  "$RUNNER" "${RUN_ARGS[@]}"
  RUN_STATUS=$?
  set -e
  RUN_T1="$(date +%s)"

  START_TS="$(cat "$RUN_DIR/started" 2>/dev/null || echo unknown)"
  END_TS="$(cat "$RUN_DIR/ended" 2>/dev/null || echo unknown)"
  RUN_HEAD="$(cat "$RUN_DIR/head" 2>/dev/null || echo unknown)"
  PREFLIGHT_FAILS="$(cat "$RUN_DIR/preflight-failures" 2>/dev/null || echo unknown)"
  # POSITIVE confirmation, written by the wrapper from the preflight's own success line.
  # An absence check alone cannot distinguish "the preflight passed" from "the preflight
  # never ran"; this ledger's evidentiary claim rests on the difference.
  PREFLIGHT_OKS="$(cat "$RUN_DIR/preflight-successes" 2>/dev/null || echo unknown)"

  # Derive every count from the machine-readable report. Nothing here is parsed from
  # human-readable console output.
  METRICS=""
  if [ -s "$RUN_DIR/results.json" ]; then
    METRICS="$(node -e '
      const fs = require("fs");
      const r = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      const prefix = process.argv[2];
      let executed = 0, passed = 0, failed = 0, flaky = 0, didNotRun = 0;
      let eperm = "absent";
      const scanSteps = (steps) => {
        for (const s of steps || []) {
          if (typeof s.title === "string" && s.title.startsWith(prefix)) {
            eperm = s.error ? "failed" : "passed";
          }
          scanSteps(s.steps);
        }
      };
      const walk = (suite) => {
        for (const spec of suite.specs || []) {
          for (const t of spec.tests || []) {
            if (t.status === "skipped") didNotRun += 1;
            else executed += 1;
            if (t.status === "expected") passed += 1;
            if (t.status === "unexpected") failed += 1;
            if (t.status === "flaky") flaky += 1;
            for (const res of t.results || []) scanSteps(res.steps);
          }
        }
        for (const s of suite.suites || []) walk(s);
      };
      for (const s of r.suites || []) walk(s);
      const retries = [...new Set((r.config.projects || []).map((p) => p.retries))].join("/");
      const out = {
        executed, passed, failed, flaky, didNotRun, eperm,
        workers: r.config.workers,
        retries,
        durationMs: Math.round(r.stats.duration)
      };
      process.stdout.write(Object.entries(out).map(([k, v]) => k + "=" + v).join(" "));
    ' "$RUN_DIR/results.json" "$EPERM07_STEP_PREFIX" 2>/dev/null || true)"
  fi

  EXECUTED="?"; PASSED="?"; FAILED="?"; FLAKY="?"; DIDNOTRUN="?"; EPERM="?"; DURATION_MS="?"
  if [ -n "$METRICS" ]; then
    for kv in $METRICS; do
      case "$kv" in
        executed=*) EXECUTED="${kv#*=}" ;;
        passed=*) PASSED="${kv#*=}" ;;
        failed=*) FAILED="${kv#*=}" ;;
        flaky=*) FLAKY="${kv#*=}" ;;
        didNotRun=*) DIDNOTRUN="${kv#*=}" ;;
        eperm=*) EPERM="${kv#*=}" ;;
        workers=*) OBSERVED_WORKERS="${kv#*=}" ;;
        retries=*) OBSERVED_RETRIES="${kv#*=}" ;;
        durationMs=*) DURATION_MS="${kv#*=}" ;;
      esac
    done
  fi

  # Wall clock is the WHOLE run -- database reset, readiness poll, dev-server start, suite,
  # teardown -- so it is consistent with the row's own start and end stamps. The suite's own
  # duration is carried alongside it because they answer different questions. Both are
  # informational only and are never an input to a pass/fail decision.
  WALL="$((RUN_T1 - RUN_T0)) s"
  if [ "$DURATION_MS" != "?" ]; then
    WALL="$WALL (suite $((DURATION_MS / 1000)) s)"
  fi

  # --- the validity rules, as code ------------------------------------------------------
  VERDICT="VALID"
  REASON=""
  if [ "$RUN_STATUS" != "0" ]; then
    VERDICT="INVALID"
    REASON="the single-run wrapper exited $RUN_STATUS (see its exit-code table; 130 means the run was interrupted)"
  elif [ "$PREFLIGHT_FAILS" != "0" ]; then
    VERDICT="INVALID"
    REASON="preflight failure count is $PREFLIGHT_FAILS -- the run is not confirmed to have tested this checkout (D-17)"
  elif ! printf '%s' "$PREFLIGHT_OKS" | grep -qE '^[1-9][0-9]*$'; then
    VERDICT="INVALID"
    REASON="preflight success count is $PREFLIGHT_OKS -- the served-application gate did not positively confirm this run, and 'no failure was printed' is not the same fact as 'the gate passed' (D-17)"
  elif [ "$SCOPED" = "0" ] && [ "$EXECUTED" != "$EXPECTED_EXECUTED" ]; then
    VERDICT="INVALID"
    REASON="executed count is $EXECUTED, expected $EXPECTED_EXECUTED -- a test that did not run is a failure, never a skip (CLAUDE.md E2E Hard Rule)"
  elif [ "$SCOPED" = "1" ] && { [ "$EXECUTED" = "?" ] || [ "$EXECUTED" -lt 1 ]; }; then
    VERDICT="INVALID"
    REASON="no test executed"
  elif [ "$FAILED" != "0" ] || [ "$DIDNOTRUN" != "0" ]; then
    VERDICT="INVALID"
    REASON="failed=$FAILED did-not-run=$DIDNOTRUN -- both must be 0"
  elif [ "$FLAKY" != "0" ]; then
    VERDICT="INVALID"
    REASON="flaky=$FLAKY -- there is no acceptable flaky test in this project (CLAUDE.md E2E Hard Rule)"
  elif [ "$SCOPED" = "0" ] && [ "$EPERM" != "passed" ]; then
    VERDICT="INVALID"
    REASON="the EPERM-07 step outcome is '$EPERM', not 'passed' -- this is the step criterion 3 is about"
  fi

  printf '| %s | %s | %s | %s | `%s` | %s | %s | %s | %s | %s | %s | %s | %s | %s | %s | `%s` |\n' \
    "$RUN_LABEL" "$START_TS" "$END_TS" "$WALL" "$RUN_HEAD" "$RUN_STATUS" \
    "$PREFLIGHT_FAILS" "$PREFLIGHT_OKS" "$EXECUTED" "$PASSED" "$FAILED" "$FLAKY" "$DIDNOTRUN" \
    "$EPERM" "$VERDICT" "${RUN_DIR#"$REPO_ROOT"/}" >> "$ROWS_FILE"

  if [ "$VERDICT" != "VALID" ]; then
    # Everything is retained for a run that is not valid: the video, the console and
    # failed-request transcripts, the dev-server log and the trace all exist for exactly
    # this moment, which is what plan 01 was for.
    record_abort "$RUN_LABEL" "$REASON (full artifact set retained at \`${RUN_DIR#"$REPO_ROOT"/}\`)"
    exit 5
  fi

  # --- disk: measure run 1, project, then prune -----------------------------------------
  if [ "$i" = "1" ]; then
    RUN1_KB="$(du -sk "$RUN_DIR" | awk '{print $1}')"
    PROJECTED_MB="$(( RUN1_KB * RUNS / 1024 ))"
    # `-P` (POSIX output) is not optional: without it GNU coreutils `df` wraps a long
    # device name onto its own line, `NR==2` lands on the continuation row and `$4` is
    # EMPTY. `AVAIL_KB=""` then makes `$(( AVAIL_KB / 4 ))` evaluate to 0, the guard
    # below is unconditionally true, and an unattended batch aborts at run 01 reporting
    # a disk failure ("... exceeds a quarter of free disk (0 MB)") that is really a
    # parsing failure. `-P` guarantees one line per filesystem; `END` reads it whatever
    # the header does.
    AVAIL_KB="$(df -Pk "$REPO_ROOT" | awk 'END {print $4}')"
    # An unreadable value is REFUSED, never treated as zero: "I could not measure the
    # disk" and "the disk is full" must not produce the same abort reason.
    if ! printf '%s' "$AVAIL_KB" | grep -qE '^[0-9]+$'; then
      record_abort "$RUN_LABEL" "could not read free space for \`$REPO_ROOT\` -- \`df -Pk\` yielded '${AVAIL_KB:-<empty>}', which is not a number. Refusing to project artifact volume from an unparsable value (this is a MEASUREMENT failure, not a disk-space failure)."
      exit 4
    fi
    echo "determinism-batch.sh: run 01 directory ${RUN1_KB} KB; projected unpruned total for $RUNS runs ~${PROJECTED_MB} MB; $((AVAIL_KB / 1024)) MB free"
    # Peak usage with pruning is roughly one unpruned run plus N pruned ones. Refuse a
    # batch that cannot fit even the UNPRUNED projection in a quarter of free space --
    # exhausting the disk at run 12 wastes the night and proves nothing.
    if [ "$(( RUN1_KB * RUNS ))" -gt "$(( AVAIL_KB / 4 ))" ]; then
      record_abort "$RUN_LABEL" "projected artifact volume (${PROJECTED_MB} MB unpruned) exceeds a quarter of free disk ($((AVAIL_KB / 1024)) MB); refusing to start a batch that may exhaust the volume mid-run"
      exit 4
    fi
  fi

  if [ -d "$RUN_DIR/html" ]; then
    rm -rf "$RUN_DIR/html"
  fi

  ACTUAL_KB="$(du -sk "$LEDGER_DIR" | awk '{print $1}')"
  emit_ledger
  echo "determinism-batch.sh: run $RUN_LABEL VALID (executed=$EXECUTED passed=$PASSED eperm07=$EPERM)"

  i=$((i + 1))
done

BATCH_END="$(date -u +%FT%TZ)"
ACTUAL_KB="$(du -sk "$LEDGER_DIR" | awk '{print $1}')"
BATCH_COMPLETE=1
emit_ledger

echo
echo "determinism-batch.sh: $RUNS/$RUNS runs VALID on HEAD $PINNED_HEAD"
echo "determinism-batch.sh: ledger written to $LEDGER_FILE"
exit 0
