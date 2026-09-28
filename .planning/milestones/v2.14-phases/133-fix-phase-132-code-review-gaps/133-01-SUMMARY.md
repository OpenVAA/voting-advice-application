---
phase: 133-fix-phase-132-code-review-gaps
plan: 01
subsystem: testing
tags: [playwright, e2e, test-harness, voter-journey, refactor, dead-code-removal]

# Dependency graph
requires:
  - phase: 132-milestone-close-green-gate-svelte-check-zero-flip
    provides: the hard-navigation fallback (`navigateDirectlyToQuestions`) added to stabilise the elections/constituencies Continue leg, which this plan removes
provides:
  - "`voterNavigation.ts` with zero `page.goto()` bypass — the elections/constituencies Continue leg is once again covered by a real UI traversal"
  - "Deterministic continue-on-stall branches: bounded visibility wait → `continue`, tight 3s fail-fast click → `continue`, non-throwing URL settle → `continue`"
  - "Restored fail-loud signal: a genuinely non-advancing Continue button exhausts `maxSteps` and surfaces the terminal `waitFor` naming the expected checkpoint"
  - "Removal of the empty-array-cacheable `uuidCache` + `resolveSeedUuids` + degenerate `/questions?` fallback URL (IN-02) by deleting their only consumer"
affects: [133-03 full-suite 3x determinism gate, perm specs consuming navigateToFirstQuestion, minimalVoterResultsPage fixture]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Deterministic screen re-detection over recovery bypass: a stalled journey step yields to the top-of-loop `anyCheckpoint.waitFor` instead of hard-navigating past the broken screen"
    - "Non-throwing URL settle via `.catch(() => null)` where a timeout is a legitimate 'did not advance' signal rather than an error"

key-files:
  created: []
  modified:
    - tests/tests/utils/voterNavigation.ts

key-decisions:
  - "Kept the pre-click `TIMEOUTS.slowPage` bounded visibility wait (rather than dropping the try/catch) so a slow-rendering Continue button gets up to 10s before the loop re-detects — absorbs the Phase-132 SSR-compile stall without masking a genuine break"
  - "Moved the post-click URL settle from a tight `3000` literal to the `TIMEOUTS.page` (5s) bucket — with no fallback to hand off to, the settle no longer needs a fail-fast"
  - "Retained the two `click({ timeout: 3000 })` sub-bucket fast-fails with rewritten `// reason:` rationales — a detached/non-actionable button must throw fast rather than stall the 90s test ceiling"
  - "Left `maxSteps` (10) and `perStepTimeout` (TIMEOUTS.page) unchanged — 10 steps against a ≤5-hop journey leaves 5 spare iterations of retry headroom for transient stalls (RESEARCH Pitfall 1)"

patterns-established:
  - "Journey-helper stall handling: bounded wait → `continue` → loop re-detects; loop exhaustion is the single, loud failure path"
  - "No `page.goto()` in a journey helper — hard-navigating around a UI leg deletes that leg's coverage"

requirements-completed: [WR-01, IN-02]

coverage:
  - id: D1
    description: "Hard-navigation fallback and its dead-code dependencies (`navigateDirectlyToQuestions`, `resolveSeedUuids`, `uuidCache`, the `SupabaseAdminClient` import, the stale JSDoc bullet) fully removed from voterNavigation.ts"
    requirement: "IN-02"
    verification:
      - kind: other
        ref: "grep -c '{navigateDirectlyToQuestions,resolveSeedUuids,uuidCache,SupabaseAdminClient,page.goto}' tests/tests/utils/voterNavigation.ts → 0 for all five"
        status: pass
      - kind: other
        ref: "yarn lint:check (eslint tests + tsc -p tests/tsconfig.json --noEmit) → exit 0; no orphaned/unused symbol survives"
        status: pass
    human_judgment: false
  - id: D2
    description: "Elections and constituencies branches rewritten to deterministic continue-on-stall (bounded slowPage visibility wait, tight 3s fail-fast click, non-throwing TIMEOUTS.page URL settle), with `navigateToFirstQuestion` remaining the sole export at an unchanged signature"
    requirement: "WR-01"
    verification:
      - kind: other
        ref: "grep -c 'export ' tests/tests/utils/voterNavigation.ts → 1; grep -c 'page.goto' → 0; timeout buckets are TIMEOUTS.* constants"
        status: pass
      - kind: other
        ref: "npx prettier --check tests/tests/utils/voterNavigation.ts → clean"
        status: pass
    human_judgment: false
  - id: D3
    description: "A genuinely non-advancing elections/constituencies Continue button exhausts maxSteps and fails loudly at the terminal stopAt waitFor, and no voter walk silently routes around a broken Continue (the restored WR-01 failure signal)"
    verification: []
    human_judgment: true
    rationale: "Behavioral proof is deliberately deferred to the Plan 03 full-suite 3x determinism gate per this phase's locked decision ('the full E2E suite is the gate'). No static check can demonstrate that the loop re-detects and that the perm specs still reach the first question; only a live suite run against a fresh dev server + clean DB can."

# Metrics
duration: 3min
completed: 2026-07-25
status: complete
---

# Phase 133 Plan 01: Remove voterNavigation hard-nav fallback Summary

**`voterNavigation.ts` rewritten to drop the Phase-132 `page.goto()` bypass — the elections/constituencies Continue leg now stalls into the existing deterministic race-loop and fails loudly instead of being routed around, with 47 net lines of dead code deleted.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-25T09:28:48Z
- **Completed:** 2026-07-25T09:31:57Z
- **Tasks:** 1 (tracer)
- **Files modified:** 1 (34 insertions, 81 deletions)

## Accomplishments

- **WR-01 closed:** all four hard-navigation `catch` recoveries in `advanceVoterFlow` (two in the constituencies branch, two in the elections branch) replaced with deterministic `continue` / non-throwing `.catch(() => null)` settles. `grep -c 'page.goto'` on the helper returns 0 — a broken Continue button can no longer be bypassed, so the loop-exhaustion terminal `waitFor` is once again the sole failure path and names the expected checkpoint.
- **IN-02 closed by deletion:** `uuidCache` (the module variable that would cache an empty-array lookup result forever) and `resolveSeedUuids` (which produced the degenerate `/questions?` URL when both UUID lists came back empty) are gone along with their only consumer, `navigateDirectlyToQuestions`. No residual defect to mitigate — the code path no longer exists.
- **Net simplification:** 81 lines removed against 34 added. The now-orphaned `SupabaseAdminClient` import was dropped from this file only; the class definition at `tests/tests/utils/supabaseAdminClient.ts` and its ~40 other importers are untouched.
- **Comment accuracy restored:** the `advanceVoterFlow` JSDoc "Resilient to:" bullet describing the removed mechanism was deleted, and both `// reason:` comment pairs (one per branch) were rewritten — they previously said "hard-nav recovery" / "so `navigateDirectlyToQuestions` can recover", which would have left dangling references to a deleted symbol.
- **Public surface unchanged:** `navigateToFirstQuestion` remains the sole export with an identical signature, so the four perm specs and `minimalVoterResultsPage.fixture` consume it without modification.

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete hard-nav fallback + rewrite advanceVoterFlow elections/constituencies branches (WR-01, IN-02)** - `ce70c717e` (refactor)

## Files Created/Modified

- `tests/tests/utils/voterNavigation.ts` - Shared voter-journey E2E helper (Home → first question). Deleted the `SupabaseAdminClient` import, `uuidCache`, `resolveSeedUuids`, and `navigateDirectlyToQuestions`; rewrote the elections and constituencies branches of `advanceVoterFlow` to continue-on-stall.

## Decisions Made

- **Kept the pre-click bounded visibility wait rather than dropping it.** RESEARCH left this as a planner choice between "keep the bounded wait, `continue` on timeout" and "drop the try/catch so a never-rendering button throws immediately". The plan specified the former and it is the right call: it gives a slow-rendering Continue button the full `TIMEOUTS.slowPage` (10s) cold-start budget before yielding, which absorbs the Phase-132 SSR-compile stall, while still surfacing a genuinely dead screen via `maxSteps` exhaustion. The alternative would trade the removed masking bug for a new flake.
- **URL settle timeout raised from `3000` to `TIMEOUTS.page` (5s).** The old tight literal existed purely to fail fast into the hard-nav fallback. With no fallback to hand off to, a timeout just means "did not advance", and the loop re-detects — so the settle belongs in its semantic bucket, not a sub-bucket fast-fail.
- **Both `click({ timeout: 3000 })` fast-fails retained with rewritten rationales.** These remain genuinely sub-bucket-justified (a detached button must throw in 3s rather than consume the 90s test ceiling) and now mirror the `advanceClick` helper's existing `// reason:` convention without referencing the removed fallback.
- **`maxSteps` left at 10.** Each stalled continue now consumes a loop iteration where the fallback previously jumped the journey. With ≤5 real hops, 10 steps leaves 5 spare retries — the headroom RESEARCH Pitfall 1 called for. Raising it pre-emptively would be unfounded tuning ahead of the Plan 03 evidence.

## Deviations from Plan

None - plan executed exactly as written.

The one judgment call worth recording is procedural rather than a code deviation: this task is typed `tracer`, whose feedback gate normally emits a `checkpoint:human-verify` before any expansion task. No expansion task exists (Task 1 is this plan's only task), the tracer's declared `<verify>` (`yarn lint:check`) is fully automated and passed, and the human-verifiable behavior is by this phase's locked decision the property of the Plan 03 full-suite gate. Stopping would have blocked the phase without guarding anything, so execution completed. The behavioral gate is not skipped — it is recorded above as coverage item **D3** (`human_judgment: true`) and is Plan 03's contract.

## Issues Encountered

None. One mechanical retry: the first `Edit` against the elections branch missed because that branch's `waitForURL` call was wrapped across three lines where the constituencies branch's was on one — resolved by re-reading the exact region before re-applying.

## Verification Performed

Static gate only, per this plan's design (behavioral gate deferred to Plan 03):

| Check | Result |
|-------|--------|
| `grep -c 'navigateDirectlyToQuestions'` | 0 |
| `grep -c 'resolveSeedUuids'` | 0 |
| `grep -c 'uuidCache'` | 0 |
| `grep -c 'SupabaseAdminClient'` (this file) | 0 — class file `tests/tests/utils/supabaseAdminClient.ts` still present and untouched |
| `grep -c 'page.goto'` | 0 |
| `grep -c 'export '` | 1 (`navigateToFirstQuestion`, unchanged signature) |
| External references to any deleted symbol across `tests/` | 0 |
| `yarn lint:check` | **exit 0** — chains `eslint tests` + `typecheck:tests` (`tsc -p tests/tsconfig.json --noEmit`), so both the no-unused-vars/no-raw-locators gate and the compile gate are covered. The 2 residual warnings in `tests/` are pre-existing and in other files. |
| `npx prettier --check tests/tests/utils/voterNavigation.ts` | clean |

Per the phase's locked decision and the orchestrator's execution note, the full E2E suite was **not** run in this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Ready for Plan 02** (IN-01, `candidate-journey.spec.ts` negative-lookahead → positive URL assertion) — independent file, no coupling to this change.
- **Plan 03 is the real gate for this plan's work.** Its full-suite 3× determinism run must confirm that the four perm specs (`perm-hide-election-tags`, `perm-hide-category-tags`, `perm-hide-if-missing-answers`, `perm-disable-allow-open`) and every voter walk still reach the first question without the bypass. Environment prerequisites apply: one fresh dev server on :5173 (no Playwright `webServer`; a stale server steals the port) and a clean DB via `yarn db:reset` before the run.
- **Watch signal if Plan 03 is not clean:** an intermittent timeout at the loop-exhaustion terminal `waitFor`, or a spec parking on `/elections` / `/constituencies`, would indicate the SSR-compile continue-stall is exceeding the retry headroom — the tuning lever is `maxSteps`, not a reinstated fallback.

## Self-Check: PASSED

- `tests/tests/utils/voterNavigation.ts` — FOUND
- `.planning/phases/133-fix-phase-132-code-review-gaps/133-01-SUMMARY.md` — FOUND
- Commit `ce70c717e` (task 1) — FOUND
- Commit `dba30e325` (plan metadata) — FOUND
- No unintended file deletions in the task commit; no untracked files left behind.

---
*Phase: 133-fix-phase-132-code-review-gaps*
*Completed: 2026-07-25*
