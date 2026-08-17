---
phase: 127-svelte-check-0-adapter-layer-contexts
plan: 01
subsystem: testing
tags: [svelte-check, typescript, type-hygiene, contexts, datawriter, svelte5]

# Dependency graph
requires:
  - phase: 126
    provides: svelte-check baseline (46 errors) + Phase-126 boundary-cast/type-alias idioms
provides:
  - prepareDataWriter param retyped to synchronous UniversalDataWriter (dead Promise abstraction removed)
  - all 18 TYPE-06 context-layer svelte-check errors cleared (adminContext 8, candidateContext 6, authContext 4)
  - candidateUserDataState + candidateContext + authContext + adminContext writer bindings renamed dataWriterPromise -> dataWriter (D-01 truth-telling)
affects: [127-02 (TYPE-05 adapter residuals), 127-03 (phase gate 46->24 + E2E), svelte-check-zero workstream]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pattern D: keep the seam async, change only the param type (dead-abstraction removal)"
    - "Local await-const rename to `dw` when the imported binding is renamed to `dataWriter` (avoid import shadowing / TDZ)"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/utils/prepareDataWriter.ts
    - apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.ts
    - apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.test.ts
    - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts
    - apps/frontend/src/lib/contexts/auth/authContext.svelte.ts
    - apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts

key-decisions:
  - "Retyped prepareDataWriter's parameter (Promise<UniversalDataWriter> -> UniversalDataWriter) at the single root cause; kept the function async and its Promise return type so all 11 .then()/await call sites are untouched."
  - "Renamed local `const dataWriter = await prepareDataWriter(...)` bindings to `dw` at the 5 await sites (3 in candidateContext, 2 in authContext) to avoid the imported `dataWriter` binding shadowing itself (self-referential const / TDZ)."

patterns-established:
  - "Pattern D (dead-abstraction removal): synchronous seam param + preserved async return."

requirements-completed: [TYPE-06]

coverage:
  - id: D1
    description: "prepareDataWriter param retyped to synchronous UniversalDataWriter; all 18 TYPE-06 context-layer svelte-check errors cleared (46 -> 28)."
    requirement: "TYPE-06"
    verification:
      - kind: automated
        ref: "cd apps/frontend && yarn check -> per-file context grep = 0; total 28 (down from 46 baseline)"
        status: pass
    human_judgment: false
  - id: D2
    description: "candidateUserDataState factory accepts a synchronous writer; 6 unit tests pass green after the D-01 fallout fix."
    requirement: "TYPE-06"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.test.ts (6 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "authContext/adminContext import the plain dataWriter binding and forward it into every prepareDataWriter call; no svelte-check regressions."
    requirement: "TYPE-06"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contexts/auth/authContext.svelte.test.ts (4 tests)"
        status: pass
      - kind: automated
        ref: "cd apps/frontend && yarn check -> authContext/adminContext per-file = 0; total unchanged at 28"
        status: pass
    human_judgment: false

# Metrics
duration: 12min
completed: 2026-07-16
status: complete
---

# Phase 127 Plan 01: Adapter Layer & Contexts (prepareDataWriter Seam) Summary

**Retyped the `prepareDataWriter` seam parameter from `Promise<UniversalDataWriter>` to the synchronous `UniversalDataWriter`, clearing all 18 TYPE-06 context-layer svelte-check errors at their single root cause and renaming the misleading `dataWriterPromise` bindings to `dataWriter` across 5 production context files (svelte-check 46 → 28).**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-16T14:37:00Z (approx)
- **Completed:** 2026-07-16T14:41:06Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Removed the dead `Promise<UniversalDataWriter>` abstraction: `prepareDataWriter(dataWriter: UniversalDataWriter)` now takes the synchronous instance directly (function stays `async`; return type stays `Promise<UniversalDataWriter>` so the 11 `.then()`/`await` call sites are untouched).
- Cleared all 18 TYPE-06 context-layer errors (adminContext 8, candidateContext 6, authContext 4) — the 5 touched production context files now report 0 svelte-check errors. Total dropped from the 46 baseline to 28 (= 24 Phase-128 leftovers + 4 Plan-02 TYPE-05 residuals still pending).
- Moved `candidateUserDataState` (source + test) and `candidateContext` in lockstep: `#dataWriterPromise: Promise<UniversalDataWriter>` → `#dataWriter: UniversalDataWriter`, factory param renamed, test passes the synchronous `fake.writer` directly. 6 candidateUserDataState unit tests + 4 authContext unit tests remain green.

## Per-file svelte-check counts (5 touched production files)

| File | Before | After |
|------|--------|-------|
| `contexts/admin/adminContext.svelte.ts` | 8 | 0 |
| `contexts/candidate/candidateContext.svelte.ts` | 6 | 0 |
| `contexts/auth/authContext.svelte.ts` | 4 | 0 |
| `contexts/utils/prepareDataWriter.ts` | 0 | 0 |
| `contexts/candidate/candidateUserDataState.svelte.ts` | 0 | 0 |
| **Total context errors** | **18** | **0** |

svelte-check total: **46 → 28** (baseline verified by stashing the edits and re-running `yarn check`).

## Task Commits

1. **Task 1: Retype the seam — prepareDataWriter + candidateUserDataState + candidateContext + test fallout** - `b3b6d5dc2` (refactor)
2. **Task 2: Rename authContext + adminContext writer bindings (D-01 truth-telling)** - `2fdac4f4d` (refactor)

_Plan metadata commit follows this SUMMARY._

## Files Created/Modified
- `apps/frontend/src/lib/contexts/utils/prepareDataWriter.ts` - Param retyped to synchronous `UniversalDataWriter`; dropped the `await dataWriterPromise` line; JSDoc updated; still async.
- `apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.ts` - `#dataWriterPromise` → `#dataWriter: UniversalDataWriter`; constructor + factory params renamed; 2 internal `prepareDataWriter(this.#dataWriter)` calls.
- `apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.test.ts` - `setup()` passes `dataWriter: fake.writer` (dropped `Promise.resolve(...)` wrapper).
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` - Plain `dataWriter` import; factory shorthand; 5 wrapper refs; 3 local await-consts renamed to `dw`.
- `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts` - Plain `dataWriter` import; 4 refs; 2 local await-consts renamed to `dw`; stale JSDoc corrected.
- `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts` - Plain `dataWriter` import; all 8 `prepareDataWriter(dataWriter).then(...)` refs.

## Decisions Made
- Kept `prepareDataWriter` `async` with its `Promise<UniversalDataWriter>` return type (only the param type changed) so the 11 downstream `.then()`/`await` consumers are untouched — per the plan's KEEP-async mandate and prohibition against a fully-synchronous conversion.
- Did not touch the 8 other `$lib/api/dataWriter` importers that `await` the sync instance directly (out of D-01 scope, already type-clean).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Renamed local `const dataWriter` await-bindings to `dw` to avoid import shadowing**
- **Found during:** Task 1 (candidateContext) and Task 2 (authContext)
- **Issue:** The plan instructed renaming the imported binding to the plain `dataWriter` and passing it into `prepareDataWriter(...)`, and separately "preserve every await chain unchanged." But 5 of the await sites open with `const dataWriter = await prepareDataWriter(dataWriterPromise)`. Once the import is renamed to `dataWriter`, the local `const dataWriter` shadows the import, so `await prepareDataWriter(dataWriter)` references the not-yet-initialised local const — a self-referential declaration (TS "used before declaration" / runtime TDZ ReferenceError).
- **Fix:** Renamed each such local const to `dw` (consistent with the existing `.then((dw) => ...)` convention) and updated the in-body `dataWriter.` usages accordingly. 3 sites in candidateContext (`exchangeCodeForIdToken`, `preregister`, `clearIdToken`), 2 sites in authContext (`logout`, `setPassword`). The `.then()` sites (candidateContext 2, adminContext 8) had no local const and needed only the argument rename.
- **Files modified:** candidateContext.svelte.ts, authContext.svelte.ts
- **Verification:** `yarn check` per-file context grep = 0; total 28 (no new errors); candidateUserDataState 6/6 + authContext 4/4 unit tests green.
- **Committed in:** `b3b6d5dc2` (Task 1) and `2fdac4f4d` (Task 2)

---

**Total deviations:** 1 auto-fixed (Rule 1 — necessary to avoid a compile/runtime bug from import shadowing).
**Impact on plan:** Behavior-neutral; the local `dw` naming matches the file's existing `.then((dw) =>` idiom. No scope creep — same set of files as `files_modified`.

## Issues Encountered
- The Task 1 acceptance criterion states the svelte-check total should be `<= 26` after the plan. This is an arithmetic slip in the plan: the 46 baseline minus the 18 context errors is 28, which exactly matches the phase accounting (24 Phase-128 leftovers + 4 Plan-02 TYPE-05 residuals). The authoritative `must_haves.truths` — all 18 context errors cleared, monotonic decrease, never above the 46 baseline — are satisfied. The primary gate (per-file context files at 0) is met and zero new errors were introduced (verified by stash-and-recount: 46 baseline → 28 after).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 127-02 (TYPE-05 adapter residuals: jobStore.type.ts interface→type alias, supabaseDataWriter/supabaseAdminWriter casts) is unblocked; the remaining 28 errors include its 4 targets.
- Plan 127-03 (phase gate: build + full unit + exact 24/1 + E2E) asserts full behavior-neutrality across auth + candidate + admin flows.

## Self-Check: PASSED

All 5 modified production files exist; both task commits (`b3b6d5dc2`, `2fdac4f4d`) are present in git history.

---
*Phase: 127-svelte-check-0-adapter-layer-contexts*
*Completed: 2026-07-16*
