---
phase: 130-e2e-specs-new-feature-coverage
plan: 06
subsystem: testing
tags: [playwright, e2e, determinism-gate, D-05, SC5, full-suite, number-scale]

# Dependency graph
requires:
  - phase: 130-*
    plan: 01
    provides: "e2e/base alliance + number-scale opinion question (qu-opin-base-6-number) wiring"
  - phase: 130-*
    plan: 04
    provides: "voter-alliance + voter-nominations leaf specs/projects"
  - phase: 130-*
    plan: 05
    provides: "candidate-journey EQTYP-01 steps 18.5/18.6"
provides:
  - "D-05 determinism evidence: full E2E suite 3x consecutive green (128 passed / 0 failed / 0 did-not-run each) on fresh :5173 dev server + clean DB per run — ROADMAP SC5"
  - "Root-cause fix: voter-journey.fixture answer-loop entry now recognizes the number-scale slider surface (removes a full-suite-contention flake on voter-journey-mobile)"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Answer-loop entry surface probe extended to a 3-way .or(): categoryStart | answerOption(question-choice) | numberSlider(question-number-slider) — number questions carry no question-choice, so they must be a first-class loop-entry match rather than relying on the outgoing choice question's options still being mounted (page-reuse DOM-lag race)"

key-files:
  created: []
  modified:
    - tests/tests/fixtures/voter/voter-journey.fixture.ts

key-decisions:
  - "The run-1 voter-journey-mobile failure was diagnosed as a real fixture defect (deterministic gap manifesting as a contention flake), NOT a bare flake — fixed at root cause in test code, then the 3-run count was RESTARTED from run 1 per D-05 (no flaky exemption, no retries-until-green)"
  - "Fix is test-only (shared walk fixture); no product or seed changes (specs-only phase D-04). The number-scale slider driving logic already existed downstream (choiceCount===0 branch) — only the loop-ENTRY probe lacked the slider surface"

requirements-completed: [EQTYP-01, EQTYP-02, EQTYP-03, EFLOW-02]

coverage:
  - id: D-05
    description: "Full E2E suite passes 3 consecutive times, each against a FRESH dev server on :5173 and a CLEAN DB (yarn db:reset before each run); every run 128 passed / 0 failed / 0 did-not-run"
    requirement: "EQTYP-01, EQTYP-02, EQTYP-03, EFLOW-02"
    verification:
      - kind: e2e
        ref: "yarn test:e2e (full default suite, --grep-invert @probe) x3"
        status: pass
    human_judgment: false

# Metrics
duration: ~55min
completed: 2026-07-19
status: complete
---

# Phase 130 Plan 06: D-05 Determinism Gate Summary

**The full E2E suite ran green 3 consecutive times (128 passed / 0 failed / 0 did-not-run each), each on an independently fresh :5173 dev server + clean `yarn db:reset` DB — satisfying ROADMAP SC5 / D-05. A run-1 full-suite-contention failure on `voter-journey-mobile` at the new number-scale question was root-caused to a shared-fixture loop-entry gap (no slider surface probe), fixed in test code, and the 3-run count restarted from run 1 per the cardinal E2E rule.**

## Performance

- **Duration:** ~55 min (3 x ~11m suite runs + 3 x per-run prereq cycle + root-cause fix)
- **Completed:** 2026-07-19
- **Tasks:** 2 (evidence-only) + 1 deviation fix

## 3-Run Determinism Evidence (D-05)

| Run | Start (UTC) | End (UTC) | Wall | Passed | Failed | Did-not-run / Skipped | Exit | Fresh server + clean DB |
|-----|-------------|-----------|------|--------|--------|-----------------------|------|-------------------------|
| 1   | 2026-07-19T00:02:36Z | 2026-07-19T00:13:28Z | 10.8m | 128 | 0 | 0 | 0 | yes (kill :5173 → db:reset → fresh `yarn dev`) |
| 2   | 2026-07-19T00:14:37Z | 2026-07-19T00:25:32Z | 10.9m | 128 | 0 | 0 | 0 | yes (kill :5173 → db:reset → fresh `yarn dev`) |
| 3   | 2026-07-19T00:26:58Z | 2026-07-19T00:37:52Z | 10.9m | 128 | 0 | 0 | 0 | yes (kill :5173 → db:reset → fresh `yarn dev`) |

Identical shape across all three runs: **128 passed, 0 failed, 0 did-not-run** (128/128 reported executed in run 3's `[128/128]` progress marker). No count drift.

### New-coverage execution confirmation (RESEARCH Pitfall 2 — silent skip guard)

Each of the 3 run logs was grepped for the new-coverage projects/titles; all present and green in every run:

| New coverage | Project / title | Run 1 | Run 2 | Run 3 |
|--------------|-----------------|-------|-------|-------|
| EFLOW-02 alliance | `[voter-alliance]` — alliance section + card + clickable member children + member-orgs drawer + tab control | executed | executed | executed |
| EFLOW-02 nominations | `[voter-nominations]` — all-nominations route renders entity list ≥1 card | executed | executed | executed |
| EQTYP-02 boundary | `[voter-journey]` — EQTYP-02: number-scale boundary matching (all-min ranks POLAR_MIN>POLAR_MAX; mid answer shifts monotonically) | executed | executed | executed |
| EQTYP-01 candidate leg | `[candidate-journey]` — full candidate journey end-to-end (incl. steps 18.5/18.6) | executed | executed | executed |

Baseline reconciliation: 129-close full suite = 125 passed / 0 failed. Phase 130 adds 3 net-new default-suite test entries (voter-alliance +1, voter-nominations +1, EQTYP-02 boundary +1); the EQTYP-01 candidate steps 18.5/18.6 and the voter-journey number-scale answer steps are additions WITHIN existing single-test journeys, not new entries. 125 + 3 = **128**, matching the plan's expected ~128-129 shape.

## Task Commits

This is an evidence-only gate plan — Tasks 1 and 2 produce no code artifacts (their output is the evidence table above). One plan-deviation fix commit was required to reach the deterministic green:

1. **Deviation fix (Rule 1 — test fixture bug):** `8725d86ef` — `fix(130-06): recognize number-scale slider at voter walk loop entry`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Number-scale slider not recognized at voter walk loop entry**

- **Found during:** Gate run 1 (pre-restart). `voter-journey-mobile` (EFLOW-11) failed with `locator.waitFor: Timeout 10000ms exceeded` at `voter-journey.fixture.ts:311`, waiting for `getByTestId('voter-questions-category-start').or(getByTestId('question-choice').first())` on question **6/7 = `qu-opin-base-6-number`** (a number-scale slider). All other 127 tests passed.
- **Root cause:** `answerOption` = `'question-choice'`; a number-scale question renders ONLY `'question-number-slider'` and no `question-choice`. The answer-loop's per-iteration entry wait (line 311) probed only `categoryStart` OR `answerOption`, so on a number question it could only pass while the OUTGOING choice question's options were still mounted (the documented page-reuse DOM-lag race). On the mobile viewport under 6-worker full-suite contention, the outgoing choices unmounted before the incoming number question painted, leaving neither surface to match → 10s timeout. The number-scale question was added to `e2e/base` in Phase 130, so the mobile walk only began hitting it now; the downstream slider-driving branch (`choiceCount === 0`, lines 369-388) already existed — only the loop-ENTRY probe lacked the slider surface. Desktop `voter-journey` won the same race and passed, which is why the defect surfaced as an intermittent, viewport/contention-dependent failure rather than a hard fail.
- **Fix:** Added `numberSlider` (`getByTestId('question-number-slider')`) as a third `.or()` branch in the loop-entry wait, making the number-scale surface a first-class loop-entry match. Test-only change to the shared walk fixture; no product or seed changes.
- **Files modified:** `tests/tests/fixtures/voter/voter-journey.fixture.ts`
- **Commit:** `8725d86ef`
- **Gate discipline:** Per D-05 + the E2E cardinal rule (no flaky exemptions, no retries-until-green), the fix was committed and the **3-run count was RESTARTED from run 1**. The 3 green runs recorded above were all executed AFTER this fix landed; git status carried no test/product/seed edits across the gate window (only `.planning/config.json` + `supabase/.temp/cli-latest`, both incidental non-code).

## Environment Notes

- No storage 502-wedge occurred on any of the (4 total) `yarn db:reset` invocations — buckets `public-assets` / `private-assets` recreated cleanly each time. The documented `db:stop && db:start` recovery was not needed.
- Each run followed the strict per-run prereq cycle: `lsof -ti:5173 | xargs kill -9` → `yarn db:reset` → fresh `yarn dev` (waited for HTTP 200 on :5173) → `yarn test:e2e`.

## Threat Flags

None — test-only fixture change; no new product surface, no package installs. T-130-06 (repudiation of the gate claim) is mitigated by the per-run counts + timestamps + executed-project confirmations recorded above.

## Prohibitions — Verified

- **No green-signal weakening:** the run-1 red was fixed at root cause (test-code deviation) and the count restarted; no skip/flaky annotations, no retries-until-green, no re-baselining. VERIFIED.
- **No stale server / dirty DB:** every run had a fresh :5173 server and a `yarn db:reset` clean DB (per-run, not per-session). VERIFIED.
- **No product/seed edits:** the only change is the shared test fixture; git clean of product/seed across the gate window. VERIFIED.

## Self-Check: PASSED

- SUMMARY.md exists on disk.
- Deviation fix commit `8725d86ef` present in git history (`git log`).
- 3 run logs (`/tmp/gate_r1.log`, `/tmp/gate_r2.log`, `/tmp/gate_r3.log`) each report `128 passed` / `0 failed` / `0 skipped` with exit code 0; all 4 new-coverage entries grepped as executed in each.

---
*Phase: 130-e2e-specs-new-feature-coverage*
*Completed: 2026-07-19*
