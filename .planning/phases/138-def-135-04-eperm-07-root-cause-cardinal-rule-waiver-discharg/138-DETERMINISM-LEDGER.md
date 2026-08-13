# Phase 138 -- Determinism batch ledger (criterion 3, INTEG-02)

## Header

| Field | Value |
|---|---|
| Batch start (UTC) | `2026-08-13T19:58:20Z` |
| Batch end (UTC) | `2026-08-13T22:55:52Z` |
| Pinned git HEAD | `8931516356ea4ce9f30ad84aa1e688f1b900bacd` |
| Runs requested | 16 |
| Runs recorded | 16 |
| Playwright project scope | full gate suite (`--grep-invert @probe`) |
| Expected executed count | 135 |
| `CI` in environment | absent -- the batch refuses to start with it set |
| Forcing knobs | `EPERM07_FORCE_BUDGET_MS`, `EPERM07_FORCE_CPU_RATE`, `EPERM07_NO_VT` explicitly unset by the batch |
| Effective retries (observed) | 0 |
| Effective workers (observed) | 6 |
| Working tree at batch start | 3 file(s) modified: .vscode/settings.json supabase/.temp/cli-latest .planning/phases/138-def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg/138-DETERMINISM-LEDGER.md |
| Ledger directory | `tests/e2e-runs/determinism-batch` (git-ignored) |

**On the working-tree row above.** The three files it names are all inert to what the suite
executes. `.vscode/settings.json` is an editor colour theme and `supabase/.temp/cli-latest` is a
version-check cache written by the Supabase CLI -- the same two files, and the same judgement,
recorded in `138-NEGATIVE-CONTROL.md` § 2. The third is *this ledger itself*, left on disk by the
discarded first attempt and about to be overwritten by this one. `git status --porcelain tests/ apps/
packages/` was **empty** at batch start: nothing the suite runs was uncommitted, which is what the
pinned HEAD is there to guarantee.

**Expected executed count.** It was **134** through Phase 137. Plan 01 of this phase
ships the `eperm07-term-trigger` hunt spec permanently in the default suite, which moved
the baseline to **135**. This is a decision, not drift; see `## Executed-count baseline`.

**Observed posture** is read back out of each run's `results.json` (`config.workers`,
`config.projects[].retries`) rather than restated from the config file, so the claim is
auditable rather than asserted.

**Pruning policy.** Every count in this ledger is derived from a run's `results.json`
before anything is pruned. A run that is VALID is then reduced to its machine-readable and
text evidence -- `results.json`, `stdout.log`, `devserver.log`, `db-reset.log`,
`env-posture.txt` and the provenance files (`started`, `ended`, `head`, `exit`,
`preflight-failures`, `worktree-status.txt`) -- by deleting its HTML report directory,
which is where the traces and videos live. A run that is NOT valid keeps everything.

**Fix state being proved.** See `138-NEGATIVE-CONTROL.md` for the criterion-2 pair
(pre-fix FAILS / post-fix PASSES under the forcing harness) that this batch runs on top of.

## Per-run ledger

One row per run, in execution order. Start and end are the wrapper's own UTC stamps, so
run N+1's start being at or after run N's end is itself the proof the batch was serial.
Wall clock is informational only and is never an input to a pass/fail decision.

| Run | Start (UTC) | End (UTC) | Wall | HEAD | Exit | Preflight fails | Executed | Passed | Failed | Flaky | Did-not-run | EPERM-07 step | Verdict | Artifacts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 | 2026-08-13T19:58:21Z | 2026-08-13T20:09:31Z | 670 s (suite 634 s) | `8931516356ea4ce9f30ad84aa1e688f1b900bacd` | 0 | 0 | 135 | 135 | 0 | 0 | 0 | passed | VALID | `tests/e2e-runs/determinism-batch/run-01` |
| 02 | 2026-08-13T20:09:31Z | 2026-08-13T20:20:50Z | 679 s (suite 638 s) | `8931516356ea4ce9f30ad84aa1e688f1b900bacd` | 0 | 0 | 135 | 135 | 0 | 0 | 0 | passed | VALID | `tests/e2e-runs/determinism-batch/run-02` |
| 03 | 2026-08-13T20:20:50Z | 2026-08-13T20:31:54Z | 664 s (suite 624 s) | `8931516356ea4ce9f30ad84aa1e688f1b900bacd` | 0 | 0 | 135 | 135 | 0 | 0 | 0 | passed | VALID | `tests/e2e-runs/determinism-batch/run-03` |
| 04 | 2026-08-13T20:31:54Z | 2026-08-13T20:42:58Z | 664 s (suite 624 s) | `8931516356ea4ce9f30ad84aa1e688f1b900bacd` | 0 | 0 | 135 | 135 | 0 | 0 | 0 | passed | VALID | `tests/e2e-runs/determinism-batch/run-04` |
| 05 | 2026-08-13T20:42:58Z | 2026-08-13T20:54:03Z | 665 s (suite 624 s) | `8931516356ea4ce9f30ad84aa1e688f1b900bacd` | 0 | 0 | 135 | 135 | 0 | 0 | 0 | passed | VALID | `tests/e2e-runs/determinism-batch/run-05` |
| 06 | 2026-08-13T20:54:03Z | 2026-08-13T21:05:09Z | 666 s (suite 627 s) | `8931516356ea4ce9f30ad84aa1e688f1b900bacd` | 0 | 0 | 135 | 135 | 0 | 0 | 0 | passed | VALID | `tests/e2e-runs/determinism-batch/run-06` |
| 07 | 2026-08-13T21:05:10Z | 2026-08-13T21:16:13Z | 663 s (suite 624 s) | `8931516356ea4ce9f30ad84aa1e688f1b900bacd` | 0 | 0 | 135 | 135 | 0 | 0 | 0 | passed | VALID | `tests/e2e-runs/determinism-batch/run-07` |
| 08 | 2026-08-13T21:16:14Z | 2026-08-13T21:27:19Z | 666 s (suite 627 s) | `8931516356ea4ce9f30ad84aa1e688f1b900bacd` | 0 | 0 | 135 | 135 | 0 | 0 | 0 | passed | VALID | `tests/e2e-runs/determinism-batch/run-08` |
| 09 | 2026-08-13T21:27:19Z | 2026-08-13T21:38:24Z | 665 s (suite 625 s) | `8931516356ea4ce9f30ad84aa1e688f1b900bacd` | 0 | 0 | 135 | 135 | 0 | 0 | 0 | passed | VALID | `tests/e2e-runs/determinism-batch/run-09` |
| 10 | 2026-08-13T21:38:24Z | 2026-08-13T21:49:27Z | 663 s (suite 623 s) | `8931516356ea4ce9f30ad84aa1e688f1b900bacd` | 0 | 0 | 135 | 135 | 0 | 0 | 0 | passed | VALID | `tests/e2e-runs/determinism-batch/run-10` |
| 11 | 2026-08-13T21:49:27Z | 2026-08-13T22:00:29Z | 662 s (suite 623 s) | `8931516356ea4ce9f30ad84aa1e688f1b900bacd` | 0 | 0 | 135 | 135 | 0 | 0 | 0 | passed | VALID | `tests/e2e-runs/determinism-batch/run-11` |
| 12 | 2026-08-13T22:00:29Z | 2026-08-13T22:11:30Z | 661 s (suite 622 s) | `8931516356ea4ce9f30ad84aa1e688f1b900bacd` | 0 | 0 | 135 | 135 | 0 | 0 | 0 | passed | VALID | `tests/e2e-runs/determinism-batch/run-12` |
| 13 | 2026-08-13T22:11:31Z | 2026-08-13T22:22:38Z | 667 s (suite 628 s) | `8931516356ea4ce9f30ad84aa1e688f1b900bacd` | 0 | 0 | 135 | 135 | 0 | 0 | 0 | passed | VALID | `tests/e2e-runs/determinism-batch/run-13` |
| 14 | 2026-08-13T22:22:38Z | 2026-08-13T22:33:40Z | 662 s (suite 622 s) | `8931516356ea4ce9f30ad84aa1e688f1b900bacd` | 0 | 0 | 135 | 135 | 0 | 0 | 0 | passed | VALID | `tests/e2e-runs/determinism-batch/run-14` |
| 15 | 2026-08-13T22:33:40Z | 2026-08-13T22:44:48Z | 668 s (suite 628 s) | `8931516356ea4ce9f30ad84aa1e688f1b900bacd` | 0 | 0 | 135 | 135 | 0 | 0 | 0 | passed | VALID | `tests/e2e-runs/determinism-batch/run-15` |
| 16 | 2026-08-13T22:44:48Z | 2026-08-13T22:55:52Z | 664 s (suite 624 s) | `8931516356ea4ce9f30ad84aa1e688f1b900bacd` | 0 | 0 | 135 | 135 | 0 | 0 | 0 | passed | VALID | `tests/e2e-runs/determinism-batch/run-16` |

## Aborts and discards

| Run | When (UTC) | Reason |
|---|---|---|
| attempt 01, runs 01-05 | 2026-08-13T19:47:43Z | **Discarded attempt, recorded rather than hidden.** A first 16-run batch, pinned to HEAD `88ae686ef8d5534a937812caffef48199724af15`, completed runs 01-05 VALID (each 135 executed / 135 passed / 0 failed / 0 flaky / 0 did-not-run, preflight failures 0, EPERM-07 step passed) and was then INTERRUPTED by the supervising process during run 06 -- infrastructure, not a test failure. The batch's own signal trap recorded it as a discard and exited 130 rather than reporting a pass. Per the failure-handling rule decided in advance, an infrastructure abort RESETS the consecutive count, so the slot was NOT re-used and the batch restarted from run 01. The five valid runs are preserved unmodified at `tests/e2e-runs/determinism-batch-attempt-01-discarded/` and are NOT counted toward the sixteen. **The restart runs on a DIFFERENT HEAD** (`8931516356ea4ce9f30ad84aa1e688f1b900bacd`), so the sixteen are consecutive on that tree and the five are not merged into them. `git diff --stat 88ae686ef 893151635` is one file, `tests/scripts/determinism-batch.sh` (+43/-0, the discard-carrying this row is written by); nothing under `apps/`, `packages/`, `tests/tests/` or `tests/playwright.config.ts` differs, so no code the suite executes changed between the two attempts. |

An abort RESETS the consecutive count. The batch does not continue past one, and the
slot is never quietly re-used: criterion 3 measures consecutive runs, and silence about
aborts is exactly what makes a green arguable.

The first **1** row(s) above are CARRIED from a previous, discarded attempt
and are historical: they happened before run 01 of this batch, and the batch restarted
from run 01 rather than resuming into the vacated slot. They are carried precisely so a
restart cannot erase the record of what it restarted from.

**This batch itself aborted no run.** Every row above is carried history.

## Disk

| Measure | Value |
|---|---|
| Run 01 directory, measured before pruning | 334948 KB |
| Projected total for 16 runs, unpruned | 5233 MB |
| Actual total on disk after pruning | 9924 KB |
| Pruned | the HTML report directory of every valid run (it embeds the trace and video) |

