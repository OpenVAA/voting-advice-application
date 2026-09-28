---
phase: 131-e2e-reliability-hardening-deferred-flake-race-triage
plan: 01
subsystem: testing
tags: [playwright, e2e, triage, stale-closure, perm-chain, supabase-storage, flake]

# Dependency graph
requires:
  - phase: 130-e2e-validation-strategy
    provides: aggregate E2E gate the stale-closure triage re-verifies per-surface
provides:
  - "Proven end-to-end todo-triage loop (evidence 3x -> parity -> stamp -> git mv -> ledger) reused by Plans 02-05"
  - "Todos #5 (not-located CLEAN-02) and #6 (notifications.voterApp) CLOSED-AS-STALE with this-phase evidence"
  - "Reusable db:reset storage-502-wedge remediation recipe for reliable per-iteration cold-start E2E evidence"
affects: [131-02, 131-03, 131-04, 131-05, phase-132-full-suite-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-iteration cold-start E2E: db:reset -> restart supabase_{storage,kong,rest} -> poll storage non-502 -> run"
    - "Binary-terminal todo disposition (CLOSED-AS-STALE) stamp + git mv pending/ -> completed/ + ledger row"

key-files:
  created:
    - .planning/phases/131-e2e-reliability-hardening-deferred-flake-race-triage/post-fix/131-not-located-3x.txt
    - .planning/phases/131-e2e-reliability-hardening-deferred-flake-race-triage/post-fix/131-notifications-3x.txt
  modified:
    - .planning/todos/completed/2026-05-16-voter-not-located-redirect-clean-02.md
    - .planning/todos/completed/2026-05-21-candidate-settings-notifications-voterapp-mount-lifecycle.md
    - .planning/phases/131-e2e-reliability-hardening-deferred-flake-race-triage/131-DISCUSSION-POINTS.md

key-decisions:
  - "Both surfaces closed on pass/pass/pass 3-of-3 cold-start evidence; no product/spec code changed"
  - "Diagnosed the db:reset storage-502-wedge (Kong upstream orphaned by storage restart) and remediated in-harness rather than accepting cascade did-not-run as a real signal"
  - "Parity CONFIRMED for both by reading the current covering specs; no coverage gap, so no assertion added"

patterns-established:
  - "Todo-triage tracer loop: 3x cold-start evidence -> parity read -> CLOSED-AS-STALE stamp citing this-phase artifact -> git mv to completed/ -> fill DISCUSSION-POINTS ledger row + tick checkbox"
  - "Cold-start E2E evidence requires a storage-ready gate after db:reset (poll /storage/v1/bucket for non-502), not just a PostgREST-ready gate"

requirements-completed: [HARDN-01]

coverage:
  - id: D1
    description: "Todo #5 (not-located CLEAN-02) triaged CLOSED-AS-STALE: cold-start /results deferred-target ?next= bounce chain proven 3x green"
    requirement: HARDN-01
    verification:
      - kind: e2e
        ref: "tests/tests/specs/perm/perm-not-located-2e2cg.spec.ts (3x cold-start) -> post-fix/131-not-located-3x.txt"
        status: pass
    human_judgment: false
  - id: D2
    description: "Todo #6 (notifications.voterApp per-app isolation) triaged CLOSED-AS-STALE: voter-route-only + candidate-route-only notification contract proven 3x green"
    requirement: HARDN-01
    verification:
      - kind: e2e
        ref: "tests/tests/specs/perm/perm-per-app-notifications.spec.ts + perm-access-disable.spec.ts (3x cold-start) -> post-fix/131-notifications-3x.txt"
        status: pass
    human_judgment: false

# Metrics
duration: ~55min
completed: 2026-07-22
status: complete
---

# Phase 131 Plan 01: Deferred-Flake Triage Tracer (todos #5 + #6) Summary

**Proved the full todo-triage loop end-to-end on the two cleanest stale-closure surfaces — not-located CLEAN-02 and notifications.voterApp — each closed CLOSED-AS-STALE on pass/pass/pass cold-start evidence, plus a diagnosed-and-remediated Supabase storage-502-wedge that makes per-iteration cold-start E2E evidence reliable.**

## Performance

- **Duration:** ~55 min
- **Started:** 2026-07-22T07:40Z (approx)
- **Completed:** 2026-07-22T08:16Z
- **Tasks:** 2
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- **Todo #5 (not-located CLEAN-02) CLOSED-AS-STALE.** Parity CONFIRMED against `perm-not-located-2e2cg.spec.ts:54` (the deferred-target `?next=` bounce chain `/results -> /elections?next= -> /constituencies?next= -> /results`, + 4 further redirect contracts). Ran 3x cold-start: pass/pass/pass (38 tests each). Stamped, `git mv`'d to `completed/`, ledger row #5 filled.
- **Todo #6 (notifications.voterApp) CLOSED-AS-STALE.** Parity CONFIRMED against `perm-per-app-notifications.spec.ts` (voter-route-only + candidate-route-only isolation with strict cross-route absence) and `perm-access-disable.spec.ts` (3 `access.*` gates) — no gap, no assertion added. Ran both 3x cold-start: pass/pass/pass (47 tests each). Stamped, moved, ledger row #6 filled.
- **Established the triage tracer loop** every later plan (02-05) reuses: 3x cold-start evidence -> parity read -> terminal stamp citing this-phase artifact -> `git mv` to `completed/` -> fill `131-DISCUSSION-POINTS.md` ledger row + tick checkbox.
- **Diagnosed and remediated the `yarn db:reset` storage-502-wedge** so the cold-start evidence is a valid signal rather than cascade noise (see Issues Encountered).

## Task Commits

Each task was committed atomically:

1. **Task 1 (TRACER): triage todo #5 (not-located CLEAN-02)** - `273adb699` (docs)
2. **Task 2: triage todo #6 (notifications.voterApp)** - `09ef18ecd` (docs)

_No product or spec code changed this plan — triage only._

## Files Created/Modified
- `post-fix/131-not-located-3x.txt` - 3x cold-start evidence for todo #5 (38 passed each, zero did-not-run) + harness remediation note
- `post-fix/131-notifications-3x.txt` - 3x cold-start evidence for todo #6 (47 passed each, zero did-not-run) + per-spec test lines
- `.planning/todos/completed/2026-05-16-voter-not-located-redirect-clean-02.md` - stamped CLOSED-AS-STALE, moved from pending/
- `.planning/todos/completed/2026-05-21-candidate-settings-notifications-voterapp-mount-lifecycle.md` - stamped CLOSED-AS-STALE, moved from pending/
- `131-DISCUSSION-POINTS.md` - filled §6 ledger rows #5/#6, ticked §2.5 and §3.7

## Decisions Made
- **Closed both surfaces on 3-of-3 pass/pass/pass** (D-07): each run is a first-and-only attempt on a freshly-cold DB — no retry-until-green. Both dispositions terminal (CLOSED-AS-STALE), neither left deferred.
- **Parity confirmed by reading the current covering specs** rather than trusting the ROADMAP premise (which the scout disproved). For todo #6 no coverage gap existed, so no assertion was added.
- **Evidence artifacts are this-phase-dated only** — neither disposition cites a `phases/130-` path (verified via grep = 0).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added a Supabase storage-ready gate + gateway-reconnect to the evidence-run harness**
- **Found during:** Task 1 (first 3x evidence attempt)
- **Issue:** The plan's `<verify>` runs bare `yarn db:reset` between iterations. Repeated `db:reset` restarts the Supabase `storage` container, orphaning Kong's upstream connection pool -> Kong returns `502 "invalid response from upstream"` on the base-dataset portrait upload (`packages/dev-seed/src/supabaseAdminClient.ts:736`), cascading `data-setup-base` into `27 did not run`. This is the known db:reset storage-502-wedge (project memory `project_bank_auth_e2e_env_and_determinism.md`), NOT a flake in the routing/notification contract under test.
- **Fix:** Per iteration: `yarn db:reset` -> `docker restart supabase_{storage,kong,rest}_openvaa-local` (reconnect Kong to the freshly-restarted storage) -> poll `GET /storage/v1/bucket` until non-502 -> run. The initial reconnect-only fix still failed run 1 because the readiness gate polled PostgREST (fast) not storage (slow); switching the gate to a storage-specific probe made all runs green.
- **Files modified:** None in the repo — harness/environment steps captured verbatim in both `post-fix/*.txt` preambles for reproducibility.
- **Verification:** Both surfaces then produced clean pass/pass/pass (38 and 47 tests each) with zero did-not-run.
- **Committed in:** `273adb699` / `09ef18ecd` (evidence artifacts document the recipe)

---

**Total deviations:** 1 auto-fixed (1 blocking — evidence-harness environment).
**Impact on plan:** The remediation touches only the test-environment setup between runs; it does not alter the contract under test, the specs, or product code. No scope creep.

## Issues Encountered
- **Supabase storage-502-wedge under repeated `db:reset`** (root cause: Kong's upstream pool orphaned when the storage container restarts mid-session). Diagnosed via container logs (storage restarted cleanly and was listening, yet the probe 502'd with no matching storage log line -> 502 originated at Kong). Remediated in-harness as documented above. Recommend later plans (02-05) reuse the `post-fix/*.txt` recipe; a follow-up could bake a storage-ready gate into the `yarn db:reset` script itself.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Triage tracer loop proven and ready for Plans 02-05 (helper harden #7, cold-deeplink cluster #2/#3/#4, feedback parity gap) to copy.
- Storage-wedge remediation recipe documented in both evidence artifacts — reuse for every 3x cold-start run.
- No new `test.skip` introduced; both dispositions terminal.

## Self-Check: PASSED

- All 5 created/modified files verified present on disk.
- All 3 commits (`273adb699`, `09ef18ecd`, `ae8bb9f76`) verified in git log.
- Both todos confirmed moved (not copied): neither remains in `.planning/todos/pending/`.

---
*Phase: 131-e2e-reliability-hardening-deferred-flake-race-triage*
*Completed: 2026-07-22*
