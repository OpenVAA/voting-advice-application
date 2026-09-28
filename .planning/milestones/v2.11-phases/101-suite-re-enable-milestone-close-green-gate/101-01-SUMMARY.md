---
phase: 101-suite-re-enable-milestone-close-green-gate
plan: 01
subsystem: testing
tags: [playwright, e2e, perm, accessibility, svelte5]

requires:
  - phase: 95-100
    provides: Completed Svelte 5 runes migration (the gating reason for the perm quarantine)
provides:
  - perm-per-app-notifications E2E project re-enabled (2 executing tests, 0 skipped)
  - Documented --no-deps standalone recipe for running the perm spec in isolation
affects: [101-03]

tech-stack:
  added: []
  patterns:
    - "Playwright --no-deps standalone recipe: seed via the real setup project then run the spec, both with --no-deps, to verify one perm project without the journey/perm chain"

key-files:
  created: []
  modified:
    - tests/tests/specs/perm/perm-per-app-notifications.spec.ts
    - tests/playwright.config.ts
    - tests/tests/specs/voter/voter-journey.spec.ts

key-decisions:
  - "Kept the journey->perm dependency chain intact (operator decision) — every perm setup overwrites the shared global app_settings singleton, so the chain is load-bearing for full-suite determinism. Documented a --no-deps standalone recipe instead of decoupling."

patterns-established:
  - "expectQuestionAndAdvance requires a known heading text and gates on it as the deterministic settle (the e2e/base dataset is stable)"

requirements-completed: [SUITE-01]

duration: ~90min (incl. operator E2E verification + D-02 fixes)
completed: 2026-06-06
---

# Phase 101 Plan 01: Un-quarantine perm-per-app-notifications Summary

**Re-enabled the 2 quarantined perm-per-app-notifications cross-route isolation tests (the load-bearing one-line change of SUITE-01) and verified they pass 2/0; fixed two D-02 regressions surfaced during verification.**

## Performance
- **Duration:** ~90 min (incl. operator-run E2E + D-02 fixes)
- **Completed:** 2026-06-06T15:49:50Z
- **Tasks:** 3/3 (Tasks 1-2 autonomous; Task 3 operator-verified checkpoint)

## Accomplishments
- `test.describe.skip(...)` → `test.describe(...)`; removed the dead skip-rationale TODO/`reason`/`eslint-disable` block and the stale "currently quarantined" Playwright config comment. The two `test(...)` bodies + HARD assertions are byte-identical (D-02 rigidity preserved).
- **Operator verified `yarn test:e2e --project=perm-per-app-notifications` → 2 passed / 0 skipped.**
- D-02 (surfaced during verification): two real regressions fixed so the perm project could run.

## Task Commits
1. **Task 1: un-quarantine spec** — `bc8324120` (test)
2. **Task 2: remove stale config comment** — `8f95047c7` (test)
3. **Task 3: verify 2/0** — operator-verified checkpoint (perm E2E green)

## Deviations / D-02 fixes
- **`docs(101): --no-deps recipe`** — `fea40cb40`. Operator chose to keep the dependency chain (full-suite-correct) and document a standalone recipe rather than decouple, because every perm setup overwrites the shared `app_settings` singleton (chain prevents mid-journey clobber).
- **`fix(101): expectQuestionAndAdvance requires known heading text`** — `73cde6452`. Running the perm project transitively pulls `voter-journey`, which was failing: the v2.11 SETTLE-BEFORE-COUNT helper assumed a Q→Q nav was always pending on entry and stalled a full `TIMEOUTS.page` on every call already sitting on its target question (after categoryStart/goBack/previousButton), pushing the journey past `JOURNEY_TEST_MAX`. Made `text` required + gate on the known heading instead. (Operator subsequently restructured the D-03 step on top — left uncommitted pending journey-green confirmation.)

## Files Created/Modified
- `tests/tests/specs/perm/perm-per-app-notifications.spec.ts` — un-quarantined
- `tests/playwright.config.ts` — stale comment removed + --no-deps recipe documented at the project block
- `tests/tests/specs/voter/voter-journey.spec.ts` — `expectQuestionAndAdvance` refactor

## Self-Check: PASSED
- perm-per-app-notifications: 2 passed / 0 skipped (operator-verified). No assertion softened; no config wiring changed.
