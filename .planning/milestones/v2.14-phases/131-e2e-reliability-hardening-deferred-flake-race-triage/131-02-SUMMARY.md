---
phase: 131-e2e-reliability-hardening-deferred-flake-race-triage
plan: 02
subsystem: testing
tags: [playwright, e2e, navigation-helper, flake, race, perm-cluster, supabase-storage]

# Dependency graph
requires:
  - phase: 131-e2e-reliability-hardening-deferred-flake-race-triage
    plan: 01
    provides: proven todo-triage loop + cold-start evidence conventions reused here
provides:
  - "navigateToFirstQuestion terminal answer-option settle — closes the Phase-127 run-1 navigation-timing race at the helper class level"
  - "Todo #7 (perm-hide-election-tags) disposed FIXED with 3x-green + 5-consumer-regression evidence"
  - "Corrected cold-start E2E recipe (bare yarn db:reset + bucket-ready gate) — the 131-01 manual storage restart DESYNCS config.toml buckets in this environment"
affects: [131-03, 131-04, 131-05, phase-132-full-suite-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Terminal settle for shared voter-nav helper: waitForURL(/questions/) THEN answerOption.waitFor({state:'visible', timeout: TIMEOUTS.element})"
    - "Cold-start E2E recipe (Plan-02 refinement): dev-server-up gate -> yarn db:reset -> assert public-assets bucket present -> run (NO manual storage restart)"

key-files:
  created:
    - .planning/phases/131-e2e-reliability-hardening-deferred-flake-race-triage/post-fix/131-perm-hide-election-tags-3x.txt
    - .planning/phases/131-e2e-reliability-hardening-deferred-flake-race-triage/post-fix/131-helper-consumer-regression.txt
  modified:
    - tests/tests/utils/voterNavigation.ts
    - .planning/todos/completed/2026-07-16-perm-hide-election-tags-navigation-timing-flake.md
    - .planning/phases/131-e2e-reliability-hardening-deferred-flake-race-triage/131-DISCUSSION-POINTS.md

key-decisions:
  - "Harden the SHARED helper (navigateToFirstQuestion) at the class level, not a spec-local band-aid (D-03); test-only change, no product code touched (D-09-preferred)"
  - "Race unreproducible after a bounded attempt (REPRO-1 passed; 2 iterations contaminated by an unrelated vite crash) -> harden defensively per the plan's allowance"
  - "Dropped the 131-01 manual storage-restart step: in this environment it DESYNCS the config.toml storage buckets (Bucket not found cascade); bare yarn db:reset cleanly re-provisions both buckets"

patterns-established:
  - "Terminal answer-option settle guarantees a fully-mounted /questions/<id> page after the intro->__first__ onMount redirect before navigateToFirstQuestion returns"
  - "Bucket-ready gate (poll storage.buckets for public-assets) is the correct post-db:reset readiness signal in this env; the storage-container restart is unnecessary and harmful"

requirements-completed: [HARDN-01]

coverage:
  - id: D-07
    description: "Todo #7 (perm-hide-election-tags navigation-timing flake) FIXED via helper harden; perm-hide-election-tags proven 3x cold-start green"
    requirement: HARDN-01
    verification:
      - kind: e2e
        ref: "tests/tests/specs/perm/perm-hide-election-tags.spec.ts (3x cold-start, 81 passed each) -> post-fix/131-perm-hide-election-tags-3x.txt"
        status: pass
    human_judgment: false
  - id: D-10
    description: "5-consumer regression: all navigateToFirstQuestion consumers green post-harden (no perm-cluster regression)"
    requirement: HARDN-01
    verification:
      - kind: e2e
        ref: "perm-hide-election-tags + perm-hide-if-missing-answers + perm-hide-category-tags + perm-disable-allow-open (+ minimalVoterResultsPage.fixture path) -> post-fix/131-helper-consumer-regression.txt (89 passed, 0 failed, 0 did-not-run)"
        status: pass
    human_judgment: false

# Metrics
duration: ~80min
completed: 2026-07-22
status: complete
---

# Phase 131 Plan 02: navigateToFirstQuestion Helper Harden (todo #7) Summary

**Closed the one genuine live flake in the phase — perm-hide-election-tags — by hardening the shared `navigateToFirstQuestion` helper with a terminal answer-option settle (test-only, class-level), proven 3x cold-start green and regression-clean across all 5 consumers, plus a corrected cold-start recipe that fixes a bucket-desync the inherited 131-01 storage-restart step caused in this environment.**

## Performance

- **Duration:** ~80 min (dominated by ~7 min/cold-start E2E run: 2 reproduce + 3 prove + 1 regression + calibration)
- **Completed:** 2026-07-22
- **Tasks:** 2
- **Files:** 5 (2 created, 3 modified incl. the todo move)

## Accomplishments

- **Hardened `navigateToFirstQuestion` at the class level (commit a6ba83c5a).** After the existing `waitForURL(/\/questions\//)`, the helper now waits for `page.getByTestId(testIds.voter.questions.answerOption).first()` to be `visible` with `TIMEOUTS.element` (named budget, no raw literal) and a `// reason:` annotation. This closes the window where `advanceVoterFlow` short-circuits (line ~167) on an answer option visible on the pre-redirect `/questions` intro page, but the `/questions → /questions/__first__` onMount redirect then detaches it — the caller could otherwise assert against a mid-redirect transitional DOM (the heading where ElectionTag renders).
- **Reproduce-first (D-03/§4.5).** REPRO-1 on clean HEAD passed 81/0/0 — the Phase-127 run-1 race did NOT reproduce. Two further iterations were contaminated by an unrelated mid-session vite crash (ERR_CONNECTION_REFUSED), not the race. Racy await located by code-read. With the genuine race unreproducible after a bounded attempt, the helper was hardened DEFENSIVELY (test-only) per the plan's allowance — a genuine product hydration race would have been escalated (D-09), not absorbed.
- **3x cold-start green.** pass/pass/pass, 81 passed each, zero did-not-run (`post-fix/131-perm-hide-election-tags-3x.txt`).
- **5-consumer regression pass (D-10).** All navigateToFirstQuestion consumers — the 4 perm specs plus the `minimalVoterResultsPage.fixture.ts` path (exercised by perm-hide-if-missing-answers + perm-disable-allow-open) — green in one cold-start run: 89 passed, 0 failed, 0 did-not-run (`post-fix/131-helper-consumer-regression.txt`). No perm-cluster regression.
- **Todo #7 disposed FIXED** and `git mv`'d to `.planning/todos/completed/`, citing the harden commit + 3x green + regression. §6 ledger row #7 filled; §4.5/§4.6 ticked.

## Task Commits

1. **Task 1: harden navigateToFirstQuestion terminal settle + 3x prove** — `a6ba83c5a` (test)
2. **Task 2: D-10 5-consumer regression + stamp todo #7 FIXED** — `2744ecd71` (docs)

## Files Created/Modified

- `tests/tests/utils/voterNavigation.ts` — terminal answer-option settle added to `navigateToFirstQuestion`
- `post-fix/131-perm-hide-election-tags-3x.txt` — 3x cold-start evidence (81 each) + reproduce-first + corrected-recipe notes
- `post-fix/131-helper-consumer-regression.txt` — 5-consumer regression (89 passed, 0/0)
- `.planning/todos/completed/2026-07-16-perm-hide-election-tags-navigation-timing-flake.md` — stamped FIXED, moved from pending/
- `131-DISCUSSION-POINTS.md` — §6 row #7 filled; §4.5/§4.6 ticked

## Decisions Made

- **Class-level helper harden, not a spec band-aid (D-03).** The fix lives in `navigateToFirstQuestion` so all 5 consumers benefit; the mandatory D-10 regression proves it does not mask a real failure across the cluster.
- **Defensive harden on an unreproducible race.** The reproduce-first attempt did not surface the race (the single clean iteration passed); the plan explicitly permits a defensive helper-class harden in that case, with the reasoning recorded.
- **Corrected the cold-start recipe.** See Deviations — the inherited 131-01 manual storage restart is unnecessary and actively harmful in this environment.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Started a fresh dev server + added a dev-server-up gate to the run recipe**
- **Found during:** Task 1 reproduce-first (REPRO-2/REPRO-3)
- **Issue:** The pre-existing vite dev server on :5173 crashed mid-session; two reproduce iterations failed with `net::ERR_CONNECTION_REFUSED at http://localhost:5173/` — a harness fault, not the navigation race. A crashed server would silently contaminate every subsequent evidence run.
- **Fix:** Started a fresh `yarn dev` stack and added a dev-server-up gate (abort fast, never emit a false failure) plus a post-reset re-confirm to the cold-start run recipe.
- **Files modified:** run recipe only (scratchpad harness); no repo code.
- **Verification:** All post-harden runs (3x prove + regression) ran against a stable server with zero ERR_CONNECTION_REFUSED.

**2. [Rule 3 - Blocking] Dropped the 131-01 manual storage restart; use bare `yarn db:reset` + a bucket-ready gate**
- **Found during:** Task 1 3x-prove (a contaminated pre-fix run)
- **Issue:** The 131-01 recipe restarts `supabase_{storage,kong,rest}` after each `db:reset` to clear a Kong-502 wedge. In THIS environment that manual storage restart DESYNCS the config.toml storage buckets (`public-assets`/`private-assets`) — the storage service does not re-provision them on a plain container restart — producing `Portrait upload failed: Bucket not found` and a did-not-run cascade. Verified directly: after a manual storage restart the `storage.buckets` table was empty and did not self-heal.
- **Fix:** Bare `yarn db:reset` (= `supabase start && supabase db reset`) cleanly re-provisions BOTH buckets. Corrected per-iteration recipe: dev-server-up gate → `yarn db:reset` → assert `public-assets` bucket present (poll `storage.buckets`) → run. No manual storage restart.
- **Files modified:** run recipe only; documented in both `post-fix/*.txt` preambles for reproducibility.
- **Verification:** With the corrected recipe, all 4 subsequent runs (3x prove + regression) reported `public-assets bucket ready after 1s` and zero bucket-not-found failures.

**Total deviations:** 2 auto-fixed (both blocking — evidence-harness environment). Neither altered the spec, the helper contract under test, or product code beyond the single test-only terminal settle. No scope creep.

## Issues Encountered

- **Unrelated vite dev-server crash** mid-reproduce (fixed by a fresh server + up-gate; see Deviation 1).
- **Storage bucket desync** under the inherited manual storage-restart recipe (fixed by dropping the restart; see Deviation 2). Recommend Plans 03-05 reuse the corrected recipe (bare `db:reset` + bucket-ready gate) rather than the 131-01 storage-restart recipe in this environment.

## User Setup Required

None. A dev server on :5173 (`yarn dev`) and local Supabase must be running for later plans' E2E evidence — a fresh `yarn dev` stack was started this plan and is left running.

## Next Phase Readiness

- Todo #7 terminally FIXED; only 4 deferred todos remain for Plans 03-05.
- Corrected cold-start recipe documented in both evidence artifacts — reuse for every 3x cold-start run.
- No new `test.skip` introduced; the harden is a single test-only wait-condition addition.

## Self-Check: PASSED

- All 4 created/modified code+evidence files verified present on disk; the terminal `answerOption.waitFor` harden is in `voterNavigation.ts`.
- Both commits (`a6ba83c5a`, `2744ecd71`) verified in git log.
- Todo #7 confirmed moved (not copied): no longer in `.planning/todos/pending/`.

---
*Phase: 131-e2e-reliability-hardening-deferred-flake-race-triage*
*Completed: 2026-07-22*
