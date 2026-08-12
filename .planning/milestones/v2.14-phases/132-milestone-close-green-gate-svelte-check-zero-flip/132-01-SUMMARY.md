---
phase: 132-milestone-close-green-gate-svelte-check-zero-flip
plan: 01
subsystem: testing
tags: [playwright, e2e, candidate-journey, flake-hardening, waitForURL, load-contention]

# Dependency graph
requires:
  - phase: 131-e2e-reliability-hardening
    provides: "escalated candidate-journey:661 cold-start load-contention flake todo (resolves_phase 132) + the navigateToFirstQuestion waitForURL-then-settle idiom this mirrors"
provides:
  - "Hardened candidate-journey step 13.5: post-submit navigation settle (page.waitForURL /\\/candidate(?!\\/profile)/, TIMEOUTS.slowPage) inserted before the candidate-home-status toBeVisible assertion"
  - "candidate-journey proven green in isolation (5 passed / 0 failed / 0 did-not-run) — the phase TRACER slice that de-risks the Plan 03 full-suite 3x gate"
affects: [132-plan-03-full-suite-gate, milestone-close-green-gate, HARDN-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "URL-settle-then-element-wait: split page.waitForURL (generous slowPage budget) from the subsequent element toBeVisible so a post-navigation assertion never races the save()+goto()+remount chain under concurrent full-DAG load"

key-files:
  created: []
  modified:
    - tests/tests/specs/candidate/candidate-journey.spec.ts

key-decisions:
  - "Used the inline page.waitForURL(/\\/candidate(?!\\/profile)/, { timeout: TIMEOUTS.slowPage }) fallback rather than the fixture candidateProfilePage.expectSubmitMessage() — the fixture's toHaveURL uses the Playwright default 5s expect timeout, which is exactly the budget the post-submit navigation exceeds under full-perm-DAG contention; the 10s slowPage budget directly root-causes the documented load window."

patterns-established:
  - "Post-submit navigation settle before a home-route element assertion (candidate-app analog of navigateToFirstQuestion's waitForURL-then-settle in voterNavigation.ts)"

requirements-completed: [HARDN-02]

coverage:
  - id: D1
    description: "candidate-journey step 13.5 hardened with a post-submit URL-settle before the candidate-home-status visibility assertion; candidate-journey passes green in isolation"
    requirement: HARDN-02
    verification:
      - kind: e2e
        ref: "yarn test:e2e --project=candidate-journey (candidate-journey.spec.ts:359 full journey; step 13.5 @ :671)"
        status: pass
    human_judgment: false

# Metrics
duration: ~22min
completed: 2026-07-23
status: complete
---

# Phase 132 Plan 01: Harden candidate-journey step 13.5 post-submit wait Summary

**candidate-journey step 13.5 now settles the post-submit navigation off /profile with a generous `waitForURL(TIMEOUTS.slowPage)` before asserting `candidate-home-status`, root-causing the escalated cold-start load-contention flake — candidate-journey proven green in isolation (5/0/0).**

## Performance

- **Duration:** ~22 min
- **Started:** 2026-07-23T00:55:00Z (approx)
- **Completed:** 2026-07-23T01:17:00Z (approx)
- **Tasks:** 1 (tracer)
- **Files modified:** 1

## Accomplishments
- Inserted an additive post-submit navigation settle (`page.waitForURL(/\/candidate(?!\/profile)/, { timeout: TIMEOUTS.slowPage })`) between the profile-submit `.click()` and the `candidate-home-status` `toBeVisible` assertion in step 13.5, so the visibility check runs against an already-navigated, interactive home route instead of racing the `save()`+`goto()`+home-remount chain under full-DAG concurrent load.
- Preserved the existing `toBeVisible({ timeout: TIMEOUTS.slowPage })` status assertion unchanged — the harden is purely additive (splits the URL-settle from the element-visibility wait so the two compose additively per D-01).
- Verified candidate-journey green in isolation via the phase TRACER gate: `yarn test:e2e --project=candidate-journey` → **5 passed (33.1s), 0 failed / 0 did-not-run**.
- Confirmed the change is test-only (D-03): `git status --porcelain apps/frontend/src` is empty; no product code touched.

## Task Commits

Each task was committed atomically:

1. **Task 1 (tracer): Harden step 13.5 post-submit wait + prove candidate-journey isolated green** - `cd06625bf` (test)

## Files Created/Modified
- `tests/tests/specs/candidate/candidate-journey.spec.ts` - Step 13.5: added an 11-line block (comment + `page.waitForURL` settle) between the submit click and the `candidate-home-status` visibility assertion.

## Decisions Made
- **Inline `waitForURL(TIMEOUTS.slowPage)` over the `expectSubmitMessage()` fixture.** The plan preferred the fixture for consistency and sanctioned the inline `waitForURL` as the equivalent fallback. The fixture's `toHaveURL` uses Playwright's default 5s expect timeout (no explicit `expect.timeout` in `playwright.config.ts`), which is exactly the budget the post-submit navigation exceeds under full-perm-DAG contention — using it would shift the same race onto a 5s URL check. The inline `waitForURL` with the 10s `slowPage` budget directly root-causes the documented cold-start load window, matching the todo's Solution ("wait for the home route to be interactive before asserting toBeVisible"). Uses only the `TIMEOUTS` vocabulary; no magic number.

## Deviations from Plan

None - plan executed exactly as written (the fixture-vs-inline choice was an explicitly-sanctioned plan option, not a deviation).

## Issues Encountered
- The Vite dev server binds IPv6-only (`[::1]:5173`); a `127.0.0.1` health poll returned connection-reset (http=000) while the server was actually up and serving 200 on `localhost`/`[::1]`. Playwright's `baseURL` uses `localhost`, so this was a health-probe artifact only, not a server problem. Resolved by probing `localhost`/`[::1]` and proceeding.

## Acceptance Criteria (all met)
- `yarn test:e2e --project=candidate-journey` exits 0: 5 passed / 0 failed / 0 did-not-run.
- Settle present in step-13.5 region: `grep -nE 'waitForURL|expectSubmitMessage'` matches `page.waitForURL(...)` at L671.
- Status assertion preserved: `grep -c 'candidate.home.statusMessage'` = 7 (unchanged, >= 1).
- No fixed-delay / no skip: `grep -c 'waitForTimeout('` = 0; `grep -c '.skip('` = 0.
- Product code untouched: `git status --porcelain apps/frontend/src` empty.

## Deferred to Plan 03 (per D-02)
- The full-concurrent-DAG proof (gate run 1, which exercises candidate-journey under the full perm-DAG).
- The terminal FIXED stamp + move of `.planning/todos/pending/2026-07-22-candidate-journey-link-url-status-load-flake.md` to `done/`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The TRACER slice is proven: candidate-journey can go green, unblocking the Plan 03 full-suite 3x determinism gate.
- Dev server (:5173) and clean DB remain up for downstream plans in this phase.

## Self-Check: PASSED
- FOUND: `.planning/phases/132-milestone-close-green-gate-svelte-check-zero-flip/132-01-SUMMARY.md`
- FOUND: commit `cd06625bf` (task 1)
