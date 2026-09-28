---
phase: 138-def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg
plan: 05
subsystem: e2e-harness
tags: [determinism, e2e, evidence, criterion-3, batch-orchestration]
status: complete

requires:
  - 'tests/scripts/e2e-run.sh :: the single-run wrapper this batch loops (plan 01)'
  - 'tests/e2e-runs/ :: the git-ignored run directory (plan 01)'
  - 'tests/tests/specs/voter/voter-journey.spec.ts:866 :: the EPERM-07 step read by title from results.json'
  - '138-NEGATIVE-CONTROL.md :: the criterion-2 pair this batch runs on top of'
  - '138-DIAGNOSIS.md § Named root cause :: criterion 1, discharged before this plan'
provides:
  - 'tests/scripts/determinism-batch.sh :: the serial N-run loop with validity rules enforced in code'
  - '138-DETERMINISM-LEDGER.md :: criterion 3 evidence — 16 rows, aborts/discards, disk, verdict, retry posture, baseline, contention'
  - 'criterion 3 discharged :: 16 consecutive full-suite runs on one HEAD, zero EPERM-07 failures, every run preflight-confirmed'
  - 'the F-3 retry-posture statement on the record :: plan 06 can cite it rather than re-derive it'
  - 'the executed-count baseline of 135 stated as a decision :: every later v2.15 phase reconciles against it'
affects:
  - 'tests/e2e-runs/ :: gains determinism-batch/ and determinism-batch-attempt-01-discarded/ (git-ignored)'
  - '.planning/REQUIREMENTS.md :: INTEG-02 evidenced'

tech-stack:
  added: []
  patterns:
    - 'Enforce the validity rules as CODE, not as instructions: a batch that only branches on exit status will count a short run as a pass, so the executed count, the preflight verdict and the failed/flaky/did-not-run counts are each asserted per iteration and an invalid run aborts the batch'
    - 'Pin the code state once and re-read it every iteration: "N consecutive runs" is a claim about ONE tree, and a mid-batch commit invalidates it silently unless the loop checks'
    - 'Regenerate the evidence document after every iteration rather than appending at the end, so an interrupted batch still leaves a complete and honest record on disk'
    - 'Carry a discarded attempt INTO the restarted batch record: a restart that emits a fresh ledger silently erases what it restarted from'
    - 'Measure run 1 and project before committing to the remaining N-1, then prune each valid run — 16 full-suite runs are 5.2 GB unpruned and 9.9 MB pruned'
    - 'Refuse the posture rather than document it: the batch exits non-zero with CI set, because a green bought with retries would itself be the outcome the cardinal rule forbids'

key-files:
  created:
    - 'tests/scripts/determinism-batch.sh'
    - '.planning/phases/138-.../138-DETERMINISM-LEDGER.md'
  modified: []

decisions:
  - 'Validity is asserted on executed count (135) + preflight verdict + failed/flaky/did-not-run, never on exit status alone'
  - 'An infrastructure abort resets the consecutive count and the batch restarts from run 01; the discarded attempt is carried into the ledger rather than erased'
  - 'Valid runs are pruned to their machine-readable and text evidence; only a non-valid run keeps its HTML report'
  - 'The batch refuses to start with CI present (exit 3) rather than merely warning'
  - 'The verdict claims criterion 3 and explicitly nothing more, and shows the arithmetic for why a green batch alone would not be decisive'

metrics:
  duration: ~4h 40m (of which ~3h 0m was the unattended batch)
  completed: 2026-08-14
  tasks: 3
  commits: 4

actuals:
  tokens: 10161
  tasks: 3
  commits: 4
---

# Phase 138 Plan 05: The 16-Run Determinism Batch Summary

Sixteen consecutive full-suite runs on one pinned HEAD, each executing all 135 tests and each
confirmed by the served-app preflight, show zero `EPERM-07` failures — and the batch that produced
them refuses to start in any posture that would make the result arguable, asserts every count from
`results.json` rather than console text, and records the one attempt it discarded rather than
quietly restarting over it.

## What was built

**Task 1 — `tests/scripts/determinism-batch.sh` (536 lines).** A serial loop over plan 01's
single-run wrapper. It orchestrates and does not re-implement: `grep -c 'yarn db:reset'` and
`grep -c 'yarn dev'` on it both return 0, because the wrapper owns the database reset, the readiness
poll, the dev-server spawn and teardown, the Playwright invocation and the preflight capture.

What it enforces, as code rather than as instructions:

- **Refuses `CI`** (exit 3, before creating anything), naming both consequences — three retries per
  test and a collapse to one worker.
- **Rejects a degenerate run count** — `--runs 0` and `--runs abc` each exit 2 with usage. `--runs 1`
  is accepted for self-checking, and the emitted ledger says in its own header that it does not
  satisfy the acceptance threshold.
- **Pins HEAD once and re-reads it every iteration**, aborting on any change.
- **Derives every row from `results.json`** — executed / passed / failed / flaky / did-not-run as
  integers, and the `EPERM-07` step outcome located by step title through a recursive step walk.
  Nothing is parsed from human-readable output. The retry and worker posture is likewise read *back*
  out of the report rather than restated from the config.
- **Validity = preflight failures 0 AND executed == 135 AND failed/flaky/did-not-run == 0 AND wrapper
  exit 0 AND the `EPERM-07` step passed.** An invalid run aborts the batch immediately, keeping its
  full artifact set; it is never skipped and never renumbered.
- **Measures run 1 and projects** against free disk before committing to the rest, then prunes each
  valid run's HTML report.

**Task 2 — the batch, and `138-DETERMINISM-LEDGER.md`.** 16/16 runs VALID on HEAD
`8931516356ea4ce9f30ad84aa1e688f1b900bacd`. Every row: exit 0, preflight failures 0, executed 135,
passed 135, failed 0, flaky 0, did-not-run 0, `EPERM-07` step `passed`. Start and end stamps are
contiguous and non-overlapping across all sixteen — the batch was serial. Batch window
`2026-08-13T19:58:20Z` → `2026-08-13T22:55:52Z` (~2 h 58 m).

**Task 3 — the four closing sections.** `## Verdict`, `## Retry posture — on the record`,
`## Executed-count baseline`, `## Contention environment`.

## The measurements

| Measure | Value |
|---|---|
| Runs valid / requested | 16 / 16 |
| Executed per run | 135 (135 passed, 0 failed, 0 flaky, 0 did-not-run) |
| Preflight failures | 0 in every run |
| `EPERM-07` step outcome | `passed` in every run |
| Effective retries / workers (observed) | 0 / 6 |
| Suite duration spread | 622–638 s (baseline 648 s at 6 workers) |
| Whole-run wall clock spread | 661–679 s |
| Run 01 directory, unpruned | 334 948 KB (327 MB) |
| Projected total for 16, unpruned | 5 233 MB |
| Actually retained after pruning | 9 924 KB (9.9 MB) — a 527× reduction |

The tight 622–638 s spread is itself evidence the contention posture was *sustained*, not merely
configured: a batch that had silently dropped to fewer workers would show a markedly longer suite.

## The discarded attempt — recorded, not hidden

A first 16-run batch on HEAD `88ae686ef` reached **run 05 VALID** (each 135/135, preflight 0,
`EPERM-07` passed) and was then interrupted by the supervising process during run 06.

This is precisely the failure plan 01 pre-empted. Its wrapper had a bug fixed at that time — an
interrupted run exiting 0 — and the same reasoning was built into this batch's own trap. The
interrupt was therefore recorded as a **discard, exit 130**, not as a pass. Teardown was clean: no
listener on the port, no stray Vite or Playwright process, and the five valid runs intact.

Per the failure handling decided in advance, an infrastructure abort **resets the consecutive count**.
The slot was not re-used and the five runs were not merged into the sixteen; the batch restarted from
run 01, and the discarded attempt is preserved unmodified at
`tests/e2e-runs/determinism-batch-attempt-01-discarded/` and carried into the final ledger's
`## Aborts and discards` section.

The restart runs on a **different HEAD** (`893151635`) because the `--carry-discards` mechanism was
added between the attempts. The ledger states that difference explicitly and shows the delta is one
file, `tests/scripts/determinism-batch.sh` (+43/−0) — nothing under `apps/`, `packages/`,
`tests/tests/` or `tests/playwright.config.ts` differs, so no code the suite executes changed between
them.

## What the verdict claims — and what it refuses to claim

The verdict states criterion 3 and stops there. It also states, with the arithmetic shown, the reason
a green batch is not self-sufficient: at the documented 1-in-8 rate, sixteen greens would be the
expected observation from an **unfixed** tree about **11.8%** of the time (`0.875^16`). The batch is
decisive only because the mechanism was named first (`138-DIAGNOSIS.md`, criterion 1, plan 03) and the
fix was shown to invert a deterministic adversary first (`138-NEGATIVE-CONTROL.md`, criterion 2,
plan 04). Both are named in the verdict so a later reader cannot take this ledger as the diagnosis —
the closure criterion 4 forbids.

**The F-3 statement is now on the record.** `retries: process.env.CI ? 3 : 0` at
`tests/playwright.config.ts:115` is pre-existing and checkable rather than asserted:
`git log -L 115,115:tests/playwright.config.ts` names `9045a0a3d` (2024-06-25) as its last modifying
commit — over two years before this phase. Phase 138 touched that config once (`77e870d94`, plan 01)
and did not touch this line. `grep -rnE 'test\.(skip|fixme|only)\(|describe\.(skip|only)\b' tests/tests`
returns 0.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 — Blocking] A restarted batch would have erased the record of the attempt it restarted from**
- **Found during:** Task 2, after the first attempt was interrupted at run 06.
- **Issue:** the script regenerates the ledger from scratch each batch. Restarting from run 01 would
  have emitted a clean 16-row ledger with `## Aborts and discards` reading "**None.**" — literally
  true of the second attempt and materially misleading about the evidence, and exactly the silence
  the plan's prohibitions name ("an aborted or discarded run is never silently omitted").
- **Fix:** added `--carry-discards <tsv>`, which seeds the aborts section before run 01. Carried rows
  are labelled historical and excluded from the batch's own abort count, so they cannot be misread as
  failures of the sixteen.
- **Commit:** `893151635`

**2. [Rule 1 — Bug] The carried row claimed both attempts ran on "this same HEAD"**
- **Found during:** Task 2, reviewing the emitted ledger.
- **Issue:** the two attempts ran on `88ae686ef` and `893151635`. Leaving "same HEAD" in the record
  would have been a false provenance claim in the one document whose entire purpose is auditable
  provenance.
- **Fix:** corrected to state the HEAD difference, and to give the checkable delta
  (`git diff --stat 88ae686ef 893151635` → one file, the batch harness; 0 files under `apps/`,
  `packages/`, `tests/tests/`, `tests/playwright.config.ts`).
- **Commit:** `a602bb283`

### Adjustments within plan intent

- **Wall clock column.** The plan asks for one wall-clock figure per row. The first implementation
  used the Playwright suite duration, which contradicted the row's own start and end stamps (10 s next
  to a 47 s window). Changed to the whole-run wall clock with the suite duration carried alongside it
  — they answer different questions, and both are informational only.
- **Row HEAD.** Rows initially carried a 9-character abbreviation. Changed to the full 40-character
  hash so the acceptance check "all rows carry the same HEAD, matching the header and
  `git rev-parse HEAD`" is a literal string match rather than a prefix judgement.
- **Working-tree note.** The ledger header mechanically lists modified files; at batch start these
  were `.vscode/settings.json`, `supabase/.temp/cli-latest` and the ledger file itself (left by the
  discarded attempt). A prose note was added stating that `git status --porcelain tests/ apps/
  packages/` was **empty** — nothing the suite executes was uncommitted. The two inert files are the
  same two, with the same judgement, already recorded in `138-NEGATIVE-CONTROL.md` § 2.

### Preconditions

Task 2's precondition asked for a clean, committed working tree. Nothing under `tests/`, `apps/` or
`packages/` was dirty; the two files that were are an editor colour theme and a Supabase CLI
version-check cache, neither imported by the app or the harness. The precondition's stated purpose —
that the pinned HEAD actually describes the code under test — was met, and the fact is recorded in
the ledger rather than papered over.

## Verification

| Check | Result |
|---|---|
| `bash -n tests/scripts/determinism-batch.sh` | exit 0; file executable; 536 lines |
| `--runs 0` / `--runs abc` | exit 2 with usage, both |
| `CI=1 ... --runs 1` | exit 3, before creating any directory |
| `--carry-discards <missing file>` | exit 2 |
| Two-iteration scoped self-test | exit 0; 2 rows; header marked `SELF-TEST — not gate evidence`; run 2 start (18:44:55Z) at run 1 end (18:44:55Z) — non-overlapping |
| Mid-batch HEAD change | throwaway empty commit during run 01 → run 02 aborted **exit 4**, abort row names both hashes; commit reverted with `git reset --soft` |
| `grep -c 'e2e-run.sh'` in the batch script | 3 (≥ 1 required) |
| `grep -c 'yarn db:reset'` / `grep -c 'yarn dev'` in the batch script | 0 / 0 — the wrapper owns them |
| `git status --porcelain tests/e2e-runs` after runs | prints nothing |
| Ledger: `## Per-run ledger` / `## Aborts and discards` | 1 / 1 |
| Ledger rows indexed 01–16 | 16, in order, not marked as a self-test |
| Every row 135 / 135 / 0 / 0 / 0, exit 0, preflight 0, `EPERM-07` passed | yes, all 16 |
| Same HEAD in all rows, matching header and `git rev-parse HEAD` | 17 occurrences (16 rows + header); matches |
| Timestamps monotonic, no overlap | checked all 16 rows programmatically — 0 overlaps |
| Ledger: Verdict / Retry posture / Executed-count baseline / Contention | 1 / 1 / 1 / 1, all non-empty |
| `grep -q '138-NEGATIVE-CONTROL'` and `'138-DIAGNOSIS'` | both present |
| Closure-language grep | one match, inside the sentence stating the batch is **not** that closure — not used as a closure statement |
| `find .planning/phases/138-* -name '*.log' -o -name '*.zip' -o -name '*.webm'` | prints nothing |
| `git status --porcelain .planning` | markdown only |
| `npx prettier --check` on the ledger | passes |
| `grep -rnE 'test\.(skip\|fixme\|only)\('` in `tests/tests` | 0 |

## Known Stubs

None. Both artifacts are implemented and exercised, and the ledger's every quantitative claim traces
to a run's `results.json`, a ledger row, or a cited `file:line`.

## Self-Check: PASSED

Files verified present:

- `FOUND: tests/scripts/determinism-batch.sh` (executable, 536 lines)
- `FOUND: .planning/phases/138-.../138-DETERMINISM-LEDGER.md` (226 lines)

Commits verified in `git log`:

- `FOUND: 88ae686ef` feat(138-05): serial determinism batch with validity rules enforced in code
- `FOUND: 893151635` feat(138-05): carry discarded-attempt records across a batch restart
- `FOUND: a602bb283` docs(138-05): 16 consecutive full-suite runs — the criterion-3 ledger
- `FOUND: 166bcc57b` docs(138-05): close the batch — verdict claiming criterion 3 and no more

## For plan 06

- **Criterion 3 is discharged** and the verdict claims it and nothing more.
- **F-3 is already written** in `## Retry posture — on the record`, with the pre-existing setting's
  file, line and last-modifying commit. Plan 06 can cite it rather than re-derive it.
- **F-1 and F-2 remain open** — the two stale claims in `tests/README.md:129` and `:133`. Untouched by
  this plan.
- **The executed-count baseline of 135** is stated as a decision in the ledger, for every later v2.15
  phase to reconcile against.
