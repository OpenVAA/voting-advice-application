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


## Verdict

Criterion 3, verbatim from `.planning/ROADMAP.md` § Phase 138 § Success Criteria:

> 3. At least **16 consecutive full-suite runs** (2x the observed 1-in-8 rate) show zero `EPERM-07`
>    failures, each run confirmed by Phase 137's served-app preflight.

**Achieved.** Sixteen consecutive full-suite runs, indexed 01 through 16 in `## Per-run ledger`,
every one of them:

- on the single pinned HEAD `8931516356ea4ce9f30ad84aa1e688f1b900bacd` (all sixteen rows carry it,
  and it is the ledger header's pinned value);
- with **135 tests executed** -- the full expected count, asserted per run rather than inferred from
  the exit status, with 135 passed, 0 failed, 0 flaky and 0 did-not-run;
- with a **preflight failure count of 0**, so each run is confirmed by Phase 137's served-app
  preflight to have tested this checkout (D-17);
- with the **`EPERM-07` step outcome `passed`**, read from that run's `results.json` by step title
  rather than from the run's overall status;
- serial: run N+1's start stamp is at or after run N's end stamp, with no overlap anywhere in the
  table.

This also satisfies `.planning/REQUIREMENTS.md` INTEG-02 -- *"The fix holds across a determinism run
long enough to exercise the observed 1-in-8 failure rate"* -- at twice that rate (D-13).

### What this batch does NOT establish

**It is criterion 3 and nothing else.** Specifically:

- **It is not the diagnosis.** The named root cause -- the ordering defect in which SvelteKit commits
  the destination URL to history (`client.js:1759-1760`) before it swaps the DOM (`client.js:1824`),
  while the walk's settle released at the URL -- is criterion 1, and it is written in
  `138-DIAGNOSIS.md` § Named root cause. It was discharged in plan 03, before this batch ran.
- **It is not the negative control.** The pre-fix-FAILS / post-fix-PASSES pair under one frozen
  adversary is criterion 2, and it is recorded in `138-NEGATIVE-CONTROL.md` (five pre-fix failures,
  five post-fix passes). It was discharged in plan 04, before this batch ran.

The ordering matters and is not cosmetic. **Sixteen green runs would be the expected observation from
an unfixed tree roughly one time in eight and a half**: at the documented 1-in-8 rate,
`(1 - 1/8)^16 = 0.875^16 ~= 0.118`. A green batch presented on its own is therefore not far from the
"it stopped happening" closure criterion 4 forbids -- it is only decisive **because** the mechanism
was named first and the fix was shown to invert a deterministic adversary first. Anyone reading this
ledger as the result should read `138-DIAGNOSIS.md` and `138-NEGATIVE-CONTROL.md` before doing so.

## Retry posture -- on the record

Criterion 4's language is absolute ("no retry annotation ... exists anywhere in the record"), and a
later reader who greps this repository for retry settings **will find one**. Both halves are stated
here so that discovery resolves rather than lingers.

**(a) Every run in this batch executed with an effective retry count of zero.** It is not asserted
from the config -- it is read back out of each run's `results.json` (`config.projects[].retries`) and
recorded in the ledger header as `Effective retries (observed) | 0`, alongside
`Effective workers (observed) | 6`. Further, `tests/scripts/determinism-batch.sh` **refuses to start**
when `CI` is present in the environment, exiting 3 before creating anything, precisely because `CI`
would buy three retries per test; and both the batch and `tests/scripts/e2e-run.sh` explicitly unset
the three `EPERM07_` forcing knobs and record that they did. A green bought with retries would itself
be the retried-until-green outcome the cardinal rule forbids, so the harness is built to make it
impossible rather than merely discouraged.

**(b) The config's continuous-integration retry setting is PRE-EXISTING and untouched by this phase.**
It is `tests/playwright.config.ts:115`, verbatim:

```ts
  retries: process.env.CI ? 3 : 0,
```

Checkable rather than asserted: `git log -L 115,115:tests/playwright.config.ts` names its last
modifying commit as **`9045a0a3d`, dated 2024-06-25** (*"test: change Playwright test to allow
rerunnig them"*) -- more than two years before Phase 138 existed. Phase 138 touched
`tests/playwright.config.ts` exactly once, in `77e870d94` (plan 01, the forensic-capture and hunt
project), and that commit did not touch this line. It is therefore not a retry annotation added to
mask this defect; it is long-standing continuous-integration configuration that this phase neither
introduced nor altered, and it has no effect on any run in this ledger because `CI` was absent from
all sixteen.

For completeness on the same criterion:
`grep -rnE 'test\.(skip|fixme|only)\(|describe\.(skip|only)\b' tests/tests --include='*.ts'` returns
**0 matches** -- no skip, fixme, exclusive-run or quarantine annotation was added to make this batch
green.

## Executed-count baseline

The suite's expected executed count **moved from 134 to 135 during this phase**.

| | Count | Source |
|---|---|---|
| Through Phase 137 | 134 tests in 88 files | the Phase-137 gate run, `--list --grep-invert @probe` |
| From Phase 138 plan 01 onward | **135 tests in 89 files** | `138-01-SUMMARY.md` § Verification |

**Cause:** plan 01's `eperm07-term-trigger` spec **ships permanently** in the default suite as a LEAF
regression guard rather than being deleted once the hunt ended -- following the precedent of the
existing cold-entry regression project. One spec, one test, one file: 134 -> 135.

**135 is the figure every later v2.15 phase reconciles against.** This section exists because a
silent count change is indistinguishable from drift: a later reader who expects 134 and sees 135 must
be able to find out in one lookup whether a test was added on purpose or a test count quietly moved.
It was on purpose, and this is the decision.

The count is also the reason exit status alone was never the acceptance test here. Per
`CLAUDE.md` § E2E Hard Rule, a "did not run" test counts as a failure, so an exit 0 with fewer than
135 executed is a cardinal failure, not a pass. `tests/scripts/determinism-batch.sh` carries 135 as a
constant and marks any run whose executed count differs as INVALID, aborting the batch.

## Contention environment

Every run in this batch executed at **6 workers** -- observed, not assumed: the value is read out of
each run's `results.json` (`config.workers`) and recorded in the ledger header.

That is the same posture in which the original one-in-eight was observed. Per `138-RESEARCH.md` § R3.1
on `workers: process.env.CI ? 1 : 6` (`tests/playwright.config.ts:117`), verbatim:

> **`workers: 6` locally is itself a finding.** The full local suite runs six concurrent Chromium
> instances on one host. That is the contention environment in which the 1-in-8 was observed [...]

This matters because the defect is a timing race, and a batch run in a quieter posture would be
weaker evidence while looking identical in the ledger. Two specific quieting moves were therefore
foreclosed rather than merely avoided:

- **`CI` would have collapsed the suite to a single worker** (`playwright.config.ts:117`) as well as
  buying retries. The batch refuses to start with it set.
- **A container was not used** (D-14). These are local host runs, on the machine where the 1-in-8 was
  actually observed -- proving it somewhere the failure never happened would be weaker evidence, not
  stronger.

The sustained contention is visible in the ledger rather than only configured: the sixteen suite
durations span **622-638 s**, tightly clustered and consistent with the 648 s full-suite baseline
measured at 6 workers in `138-RESEARCH.md` § R5.1. A batch that had silently dropped to fewer workers
would have shown a markedly longer suite duration.
