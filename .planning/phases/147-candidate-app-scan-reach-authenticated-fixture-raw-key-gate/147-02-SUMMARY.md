---
phase: 147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate
plan: '02'
subsystem: testing
tags: [playwright, scheduler, phase-assignment, a11y, axe-core, i18n, negative-control, e2e]

requires:
  - phase: 147-01
    provides: 'BASE-GREEN (135/0 with per-test durations), the 13-row register, and the tests/e2e-runs/147/ harness this plan measures through'
  - phase: 147-scout
    provides: '147-SCOUT-INVENTORY.md §§ A, C, E, F — the measured-false split rationale, criterion 5 restated as a reporting property, the already-built fixture, and the single-importer split cost'
provides:
  - 'ORD-OBSERVED — the phase-assignment instrument validated at 0 mismatches over 89 projects, 80 predicted vs 80 observed'
  - 'ORD-PERTURB — the ungating measured at 136/0/0/0/0, verdict DOES NOT PERTURB, unblocking a row two prior runs had voided'
  - '147-ORDERING.md § Decision (A) — wiring W3, with all six alternatives rejected in the selection criterion own terms'
  - '147-ORDERING.md § Decision (B) — both verdicts reported in one body, chosen against a measured +138s alternative'
  - '147-ORDERING.md § For 147-03 — a 7-item change checklist plus 7 stale records, leaving no residual choice'
affects: [147-03, 147-04, 147-05]

actuals:
  tokens: 21000
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - 'Pre-registered decision rule: write the if-X-then-Y table BEFORE the deciding measurement and retain it verbatim, so the choice is demonstrably not fitted to the result'
    - 'Phase assignment read from the run own results.json via observedFromRun(), never from a prediction, and never from a hand-drawn graph'
    - 'Void disclosure retained under a History divider rather than deleted once the retry went green'

key-files:
  created:
    - .planning/phases/147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate/147-02-SUMMARY.md
  modified:
    - .planning/phases/147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate/147-NEGATIVE-CONTROL.md
    - .planning/phases/147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate/147-ORDERING.md
    - tests/playwright.config.ts
    - tests/tests/fixtures/shared/forensicCapture.fixture.ts
    - tests/README.md

key-decisions:
  - 'Selected wiring W3 by the rule pre-registered in 147-ORDERING.md BEFORE ORD-PERTURB was taken; the table is retained verbatim so the selection is auditable as prospective rather than post-hoc.'
  - 'Chose Decision (B) mechanism 3 (both verdicts in one body) over a separate test per surface, on a measured <=+138s / +21% suite wall clock. Flagged explicitly as satisfying criterion 5 purpose but not the scout literal "reported as its own test" — the one place the evidence does not force the answer.'
  - 'Switched trace: on -> retain-on-failure. It removed 260-340MB per full-suite run, which is one half of the disk pressure that voided the two prior ORD-PERTURB attempts; the archived-run half shrinks with it because e2e-run.sh points PLAYWRIGHT_HTML_OUTPUT_DIR at the run dir.'
  - 'Recorded the Docker.raw sparse-bloat finding (60GiB allocated vs ~7.5GB live) in the register rather than acting on it — reclaiming it is an operator decision about a daemon running other projects containers.'
  - 'Corrected rather than rewrote the moved config baseline: the two prior revert proofs are left standing as true statements about their HEAD, with the new clean hash recorded beside them.'

patterns-established:
  - 'When a config edit moves a hash another row pinned, amend that row with the new baseline and an instruction to re-take a fresh pre-edit hash — never silently rewrite the historical proof.'
  - 'Cost decisions from the run own per-test durations (BASE-GREEN results.json), split by fixture kind, rather than from an estimate.'

requirements-completed: [CSCAN-02]

coverage:
  - id: D1
    description: 'ORD-OBSERVED: the phase-assignment instrument reproduces the real assignment before any prediction is taken from it'
    requirement: CSCAN-02
    verification:
      - kind: other
        ref: 'node tests/e2e-runs/147/phases.mjs --self-check => 89 projects, 0 mismatches, 80 predicted vs 80 observed; re-run at 0 against the restored config'
        status: pass
    human_judgment: false
  - id: D2
    description: 'ORD-PERTURB: ungating auth-setup alone does not perturb the default suite'
    requirement: CSCAN-02
    verification:
      - kind: e2e
        ref: 'tests/e2e-runs/147-ord-perturb/ — 136 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run, exit 0, 10.7 min, preflight OK=1 FAILED=0; 0 of 89 projects moved phase'
        status: pass
    human_judgment: false
  - id: D3
    description: 'The perturbation declaration was confirmed behaviourally, never by grepping the config text'
    requirement: CSCAN-02
    verification:
      - kind: other
        ref: 'config-projects.mts => 91 projects, auth-setup declared with dependencies [data-setup-base]; playwright --list => 136 tests in 90 files (+1 vs BASE-GREEN)'
        status: pass
    human_judgment: false
  - id: D4
    description: 'Decision (A) names one wiring with predicted phases, hazard verdict on both axes, and every alternative rejected in the criterion own terms'
    requirement: CSCAN-02
    verification:
      - kind: other
        ref: '147-ORDERING.md § Decision (A); phases.mjs --wiring W3 => phase 3 of 80, both hazard axes NONE, opt-in closures 2 / 1 / 1'
        status: pass
    human_judgment: false
  - id: D5
    description: 'Decision (B) names one mechanism and records the measured cost of the expensive alternative, derived from BASE-GREEN per-test durations'
    requirement: CSCAN-02
    verification:
      - kind: other
        ref: 'a11y-smoke 130.2s over 16 tests = 14 axe scans (116.0s) + 2 navigation (14.2s); fixture-driven 104.4s / 8, raw 11.6s / 6; separate-test alternative <=+138s'
        status: pass
    human_judgment: false
  - id: D6
    description: 'No measurement survived: the perturbation reverted and proven twice, no product bytes changed by the measurement'
    requirement: CSCAN-02
    verification:
      - kind: other
        ref: 'git diff --exit-code -- tests apps packages .github package.json yarn.lock => 0; git hash-object back to fbbd85ae27895d9e19a73ad95113610dcf511c04'
        status: pass
    human_judgment: false

duration: 80min
completed: 2026-08-27
status: complete
---

# Phase 147 Plan 02: Ordering Measured, Both Deferred Mechanisms Decided

**A row two prior runs had voided was measured on the third attempt — the ungating does not perturb the suite (136/0, 10.7 min, 0 of 89 projects moved phase) — and both deferred mechanisms were then decided against a rule written before the measurement and a cost derived from the suite's own durations.**

## Performance

- **Duration:** ~80 min (one 10.7-minute full-suite run, taken once, not retried)
- **Completed:** 2026-08-27

## Accomplishments

1. **Unblocked the environment that voided two prior attempts.** `trace: 'on'` was retaining a trace for
   every passing test — 260–340 MB per full-suite run, and because `e2e-run.sh` writes its HTML report
   into the run directory, the same bytes again in every archived run. Switched to `retain-on-failure`.
   Verified live during the run: `playwright-results` sat at **14 MB** where it would have held ~280 MB.
2. **`ORD-OBSERVED`** — validated the phase-assignment instrument at **0 mismatches over 89 projects**,
   80 predicted vs 80 observed, at **no suite cost** (it mines `BASE-GREEN`'s existing `results.json`).
3. **`ORD-PERTURB`** — **136 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run**, exit 0, 10.7 min.
   Verdict **DOES NOT PERTURB**: +1 test (the declared setup itself), 80 → 80 phases, **0 projects moved**.
4. **Decision (A) — W3**, by a rule pre-registered before the measurement.
5. **Decision (B) — both verdicts in one body**, on a measured `≤ +138 s (+21 %)` for the alternative.

## Task Commits

| commit      | what                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `fde174ccf` | `trace: 'on'` → `retain-on-failure`, with the forensics docblock and `tests/README.md` updated |
| `6e65a5d2f` | corrected the moved config baseline; recorded the Docker.raw disk gap                          |
| `850155b02` | `ORD-PERTURB` filled — does not perturb                                                        |
| `27dddcf3f` | Decisions (A) and (B) and the `For 147-03` checklist                                           |

## Decisions Made

See `key-decisions` in the frontmatter. The two that a later reader should not have to reconstruct:

- **W3 over W2** turns on one array entry. Under W2 the scan precedes the perm family _incidentally_
  (the perm head is anchored on `candidate-journey`, which happens to share the scan's phase); under W3
  the perm head names the scan directly. Recorded as **the one rejection reasonable to overturn**.
- **Decision (B) is an interpretation of a requirement**, and is marked as such in the document rather
  than presented as forced by evidence.

## Deviations from Plan

- **The plan's Task 2 precondition assumed a runnable environment.** It was not runnable when the plan
  was first attempted; unblocking it required a change to `tests/playwright.config.ts` outside this
  plan's stated file list. That change moved a blob hash `ORD-PERTURB` had pinned — corrected in
  `6e65a5d2f` rather than silently absorbed.
- **`tests/README.md` needed a Prettier pass** (`43880199a`), caught by this plan's own
  `format:check` verification item.

## Findings worth carrying forward

1. **The disk blocker was two-thirds unmeasured.** `Docker.raw` occupies **60 GiB** of allocated host
   blocks against **~7.5 GB** of live content — ~52 GiB of never-TRIMmed sparse bloat. Reclaiming it
   destroys nothing. **Recorded, not taken:** it is an operator decision. `tests/e2e-runs/` is a further
   6.8 GB, but the 140 and 146 registers cite it by path, so it must not be deleted.
2. **`assertNoRawI18nKeys` throws.** An axe failure cannot hide a raw-key failure (ordering), but a
   raw-key failure _does_ suppress the axe result. That asymmetry is the actual defect criterion 5 gestures at.
3. **`a11y-smoke` has no `testMatch`.** Adding a candidate spec under `tests/specs/a11y/` without one
   makes `a11y-smoke` collect it and run it **unauthenticated** — a failure mode that produces a _green_ run.

## Self-Check: PASSED

All five verification items pass: sections present and 7 wirings enumerated; 0 `TBD-147` in either row;
`git diff --exit-code -- tests apps packages .github package.json yarn.lock` exit 0; self-check 0
mismatches; `lint:check` and `format:check` green under `TURBO_FORCE=true` per D-02a (22/22 tasks, 0
errors — the 2 warnings are pre-existing in `packages/core` and `packages/dev-seed`).
