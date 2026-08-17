---
phase: 125-svelte-check-0-trivial-tier
plan: 01
subsystem: testing
tags: [svelte-check, typescript, qs, definitely-typed, types, api-routes]

# Dependency graph
requires:
  - phase: 125-svelte-check-0-trivial-tier
    provides: TYPE-01 cluster scoping (RESEARCH.md fallout analysis + D-01 honest-types decision)
provides:
  - "@types/qs devDependency in @openvaa/frontend — resolves all 8 pre-existing qs ambient-declaration errors"
  - "svelte-check total lowered 151 → 143 (−8) with zero net-new errors"
affects: [125-04 (D-04 phase-total gate plan), 126, 127, 128]

# Tech tracking
tech-stack:
  added: ["@types/qs@^6.15.0 (resolved 6.15.1, DefinitelyTyped, declaration-only)"]
  patterns: ["Honest real-types fix over declare-module any-shim (D-01) — real DefinitelyTyped types surface truth instead of masking it"]

key-files:
  created: []
  modified:
    - apps/frontend/package.json
    - yarn.lock

key-decisions:
  - "Added @types/qs per-workspace (mirroring the qs runtime dep) rather than via the catalog: pin — keeps the frontend devDeps block internally consistent with its runtime sibling; identical type resolution either way (A1)"
  - "No fallout cast applied: the predicted ParsedQs → GetDataOptionsBase fallout did NOT materialize because GetDataOptionsBase is all-optional ({ locale?: string }). A green yarn check is the authority, not the prediction — a gratuitous cast on a clean file was correctly withheld"
  - "Honest fix per D-01: real @types/qs types, no declare-module any-shim, no @ts-ignore/@ts-expect-error suppression"

patterns-established:
  - "Per-cluster dependency mutation runs alone in its own atomic commit so bisect can isolate it and per-cluster error accounting stays exact"

requirements-completed: [TYPE-01]

coverage:
  - id: D1
    description: "@types/qs devDependency resolves all 8 qs ambient-declaration import errors (buildRoute, parseParams, universalAdapter x2, admin-jobs active/past, data/[collection], constituencies page)"
    requirement: TYPE-01
    verification:
      - kind: automated_ui
        ref: "cd apps/frontend && yarn check 2>&1 | grep -c \"module 'qs'\" → 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Predicted ParsedQs → GetDataOptionsBase fallout at data/[collection]/+server.ts is absent (0 errors in that file); no cast needed, runtime behavior unchanged"
    requirement: TYPE-01
    verification:
      - kind: automated_ui
        ref: "cd apps/frontend && yarn check 2>&1 | grep -c 'api/data/\\[collection\\]' → 0"
        status: pass
    human_judgment: false

# Metrics
duration: 4min
completed: 2026-07-15
status: complete
---

# Phase 125 Plan 01: TYPE-01 qs Ambient-Declaration Cluster Summary

**Added real `@types/qs` DefinitelyTyped declarations to the frontend, clearing all 8 pre-existing "Could not find declaration file for module 'qs'" svelte-check errors with zero net-new fallout (151 → 143 errors) — no cast, no any-shim, no suppression.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-07-15T19:33:10Z
- **Completed:** 2026-07-15T19:37:00Z
- **Tasks:** 2 (collapsed into one atomic commit — Task 2's fallout fix was unneeded)
- **Files modified:** 2 (package.json, yarn.lock)

## Accomplishments
- Added `@types/qs@^6.15.0` (resolved 6.15.1) as a devDependency of `@openvaa/frontend`, per-workspace to mirror the existing `qs` runtime dep (A1).
- All 8 qs ambient-declaration import errors resolved (`grep -c "module 'qs'"` → 0).
- svelte-check total dropped from the 151 baseline to 143 — exactly −8, confirming zero net-new fallout.
- The honest real-types path (D-01) was used: no declare-module any-shim, no `@ts-ignore`/`@ts-expect-error`.

## Task Commits

The TYPE-01 cluster is a single atomic commit (dep add only — no source fallout to fix):

1. **Task 1 + Task 2 (TYPE-01 cluster)** - `cfc24a391` (fix)

_Task 2's predicted source cast was withheld: the fallout it targeted did not exist, so there was no clean-file edit to make. Both tasks' acceptance criteria (0 qs-module errors, 0 data/[collection] errors) are satisfied by the dependency add alone._

## Files Created/Modified
- `apps/frontend/package.json` - Added `"@types/qs": "^6.15.0"` to devDependencies (sibling to the `qs` runtime dep).
- `yarn.lock` - Resolved `@types/qs@npm:6.15.1` entry.

## Decisions Made
- **Per-workspace placement (A1):** Added `@types/qs` per-workspace mirroring the `qs` runtime line, not via the shared `catalog:` pin. Keeps the frontend block internally consistent; identical type resolution either way.
- **No fallout cast (A2 / D-01):** `GetDataOptionsBase` is `{ locale?: string }` — all-optional — so `qs.parse`'s `ParsedQs` return is assignable to `GetDataOptionsBase | undefined` with no cast. The research prediction of a `+1` fallout at `data/[collection]/+server.ts` was pessimistic. Per the plan's own rule ("the authority is a green yarn check, not the prediction"), no gratuitous cast was added to a file that already type-checks clean.

## Deviations from Plan

### Prediction did not hold (measured, not a bug)

**1. [Measurement reconciliation] Predicted single fallout at data/[collection] did not materialize**
- **Found during:** Task 1 (measure fallout after dep add)
- **Issue:** Research (A2) predicted adding real `@types/qs` would surface exactly 1 new type error at the `options = qs.parse(...)` assignment in `data/[collection]/+server.ts`, requiring a behavior-neutral cast (Task 2). Actual measurement: 0 errors in that file, 0 qs-module errors overall.
- **Root cause:** `GetDataOptionsBase` is all-optional (`{ locale?: string }`), so `ParsedQs` is assignable to `GetDataOptionsBase | undefined` without a cast. The predicted `ParsedQs → GetDataOptionsBase` mismatch is not a real mismatch for this target shape.
- **Fix:** No source edit needed. Task 2's cast was correctly withheld (D-01 favors honest real types; adding a no-op cast to a clean file would be gratuitous). The cluster committed as a single dep-add commit — exactly the "one atomic commit" the plan required.
- **Verification:** `yarn check` shows 0 qs-module errors and 0 `data/[collection]` errors; total 151 → 143 (−8, no net-new).
- **Committed in:** `cfc24a391`

---

**Total deviations:** 1 (prediction reconciliation — less work than planned, not a bug or scope change)
**Impact on plan:** Best-case outcome. Both tasks' acceptance criteria met by the dependency add alone; no cast, no suppression, no files outside `package.json`/`yarn.lock` touched. No scope creep, no Phase 126/127/128 errors touched (Pitfall 4 satisfied).

## Issues Encountered
None. (An unrelated pre-resolution warning about `zod`/`playwright-core` peer requirements is a pre-existing repo condition, not introduced here.)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- TYPE-01 cluster fully resolved and committed atomically; ready for the remaining trivial-tier clusters (Plans 02/03) and the D-04 phase-total gate (Plan 04, which asserts the full 151 → ≤133 reduction).
- The `@types/qs` types are now available to all 8 qs importers repo-wide.

## Self-Check: PASSED

- `apps/frontend/package.json` contains `@types/qs` — FOUND
- Commit `cfc24a391` — FOUND
- `125-01-SUMMARY.md` — FOUND

---
*Phase: 125-svelte-check-0-trivial-tier*
*Completed: 2026-07-15*
