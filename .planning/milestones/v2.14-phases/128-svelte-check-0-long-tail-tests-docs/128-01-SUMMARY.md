---
phase: 128-svelte-check-0-long-tail-tests-docs
plan: 01
subsystem: testing
tags: [typescript, svelte-check, vitest, supabase-adapter, mixin-typing, spike-cleanup]

# Dependency graph
requires:
  - phase: 125
    provides: D-03 spike-directory deletion precedent (importer-gate pattern)
provides:
  - Three Supabase adapter test files at 0 svelte-check errors (provider, adminWriter, writer)
  - Removal of the dead _spikes-020-class-conversion/ spike scaffolding (4 files)
  - Typed-intermediate-variable pattern for passing SupabaseAdapterConfig through init()
affects: [128-05, svelte-check-zero]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Typed-intermediate-variable to satisfy a widened config through a base-typed init() param (bypasses fresh-object-literal excess-property check)"
    - "Contextual typing of a thenable mock's then params from PromiseLike['then']"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts

key-decisions:
  - "Passed SupabaseAdapterConfig via a typed local variable rather than the plan's literal 'type the handle concrete' mechanism, which does not work because the mixin's return-type annotation erases the widened init() override."
  - "Wrapped the image-answer info as { en: 'My photo' } — LocalizedString is a { [locale]: string } map."

patterns-established:
  - "Typed-intermediate-variable: assign a subtype config to a `const config: SupabaseAdapterConfig`, then pass it to a base-typed init() — the subtype is assignable and no fresh-literal excess-property check fires."
  - "Thenable mock then params left unannotated so they contextually type from the field's PromiseLike<unknown>['then'] type."

requirements-completed: [TYPE-08]

coverage:
  - id: D1
    description: "supabaseDataProvider.test.ts + supabaseAdminWriter.test.ts: 9 provider + 1 adminWriter serverClient inits and the thenable mock typecheck clean (11 errors cleared)."
    requirement: "TYPE-08"
    verification:
      - kind: other
        ref: "cd apps/frontend && yarn check — 0 errors in supabaseDataProvider.test.ts / supabaseAdminWriter.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "supabaseDataWriter.test.ts: serverClient init, two register() registrationKey args, and LocalizedAnswers image-answer shape typecheck clean (4 errors cleared)."
    requirement: "TYPE-08"
    verification:
      - kind: other
        ref: "cd apps/frontend && yarn check — 0 errors in supabaseDataWriter.test.ts"
        status: pass
      - kind: unit
        ref: "yarn test:unit — 759 passed (retyped mocks still execute)"
        status: pass
    human_judgment: false
  - id: D3
    description: "_spikes-020-class-conversion/ directory (4 .spike.svelte.test.ts files) deleted after a zero-importer gate; unit sweep stays green."
    requirement: "TYPE-08"
    verification:
      - kind: other
        ref: "grep importer gate returns zero matches; DIR_GONE; yarn test:unit 759 passed"
        status: pass
    human_judgment: false

# Metrics
duration: 7min
completed: 2026-07-16
status: complete
---

# Phase 128 Plan 01: Supabase adapter test-layer type errors + dead spike cleanup Summary

**Cleared all 15 `.test.ts`/`.spike` type errors in the Supabase adapter test layer (serverClient inits, thenable mock, register args, LocalizedAnswers) via typed-intermediate-variable configs, and deleted the dead `_spikes-020-class-conversion/` scaffolding after a zero-importer gate.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-07-16T15:04:51Z
- **Completed:** 2026-07-16T15:12:07Z
- **Tasks:** 3
- **Files modified:** 3 modified, 4 deleted

## Accomplishments
- Frontend svelte-check ERROR count dropped from 24 to 9 (exactly 15 cleared, zero net-new), with 0 errors remaining in all three adapter test files.
- All fixes are typed to real runtime signatures — no `any`-cast (D-04). `yarn test:unit` stays green (759 passed).
- Removed the 4-file `_spikes-020-class-conversion/` spike directory after the pre-deletion importer gate returned zero external importers (D-05); findings remain preserved in `.planning/spikes/` and the spike-findings skill.

## Task Commits

Each task was committed atomically:

1. **Task 1: Retype serverClient inits + thenable mock (provider + adminWriter)** - `375971691` (fix)
2. **Task 2: serverClient init + register args + LocalizedAnswers (writer)** - `0bf2b01fa` (fix)
3. **Task 3: Delete _spikes-020-class-conversion/ after importer gate** - `d0fb8e6c5` (chore)

## Files Created/Modified
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` - 9 init sites retyped via `SupabaseAdapterConfig` locals; thenable mock `then` params contextually typed; import added.
- `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts` - 1 init site retyped via a typed config local; import added.
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` - 1 init site retyped; two `register()` calls given `registrationKey`; image-answer `info` wrapped as `LocalizedString`; import added.
- `apps/frontend/src/lib/contexts/_spikes-020-class-conversion/` - DELETED (020-class-core, 021-class-localstorage, 022-class-version-bridge, 023-class-ssr-effect `.spike.svelte.test.ts`).

## Decisions Made
- **serverClient typing mechanism:** The plan directed typing the provider/writer handle "concrete" so `init` would accept `serverClient`. That mechanism does not work: `supabaseAdapterMixin` annotates its return type as `Constructor<SupabaseAdapter> & TBase`, which erases the mixin's widened `init(config: SupabaseAdapterConfig)` override — consumers see the base `init(config: AdapterConfig)`. The `beforeEach` init (already using the concrete `SupabaseDataProvider` handle) errored at 134:7 in the baseline, proving the concrete-handle approach cannot clear the error. Instead each config was extracted to a `const config: SupabaseAdapterConfig = {...}` local and passed to `init()` — a subtype value is assignable to the `AdapterConfig` parameter, and the fresh-object-literal excess-property check does not fire for a pre-declared variable. Test-side only, no source change, no `any`-cast; runtime behavior unchanged (unit sweep green).
- **LocalizedString shape:** `info: 'My photo'` → `info: { en: 'My photo' }` (LocalizedString is a `{ [locale]: string }` map per `packages/app-shared/src/data/localized.type.ts`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected the serverClient-typing mechanism (plan premise was factually wrong)**
- **Found during:** Task 1 (provider/adminWriter inits)
- **Issue:** The plan asserted the `~line 130` init was "already-passing" and that typing the handle concrete would let `init` accept `serverClient`. The baseline `yarn check` showed that init erroring at 134:7 despite `provider` already being the concrete `SupabaseDataProvider` — the mixin's explicit return-type annotation erases the widened `init` override, so the concrete-handle approach cannot work.
- **Fix:** Extracted each config to a typed `const config: SupabaseAdapterConfig` local and passed it to `init()`, which is assignable to the base `AdapterConfig` parameter and bypasses the fresh-literal excess-property check. No `any`-cast, no source-file widening (D-01 respected — `universalAdapter.type.ts` untouched).
- **Files modified:** all three adapter test files
- **Verification:** `yarn check` — 0 errors in the three files, total 24 → 9 (15 cleared, no net-new); `yarn test:unit` 759 passed.
- **Committed in:** `375971691` (Task 1), `0bf2b01fa` (Task 2)

---

**Total deviations:** 1 auto-fixed (1 mechanism correction / Rule 1)
**Impact on plan:** The deviation only changed the *mechanism* used to reach the plan's stated acceptance criteria (serverClient accepted, no `any`-cast, test-side only, D-01 base type not widened). All success criteria met exactly. No scope creep.

## Issues Encountered
- The `then` field is declared as `PromiseLike<unknown>['then']`; the original assignment used a non-optional `resolve` param, which is incompatible with the optional `onfulfilled?` of the target. Resolved by removing the explicit param annotations so `resolve`/`reject` are contextually typed from the field type (no cast).

## Prohibition verification (previously flagged-unverified)
- **D-04 (no any-cast):** VERIFIED. No `any` / `as any` appears on any edited line; every fix is typed to a real signature (`SupabaseAdapterConfig`, `PromiseLike['then']`, `registrationKey`, `LocalizedString`).
- **D-05 (importer gate before deletion):** VERIFIED. Pre-deletion grep across `apps/frontend/src` (excluding the directory) for the four spike basenames + directory name returned zero matches before the `git rm`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The three adapter test files and the spike directory are cleared; the remaining 9 frontend svelte-check errors are owned by Plans 02/03 and the docs error by Plan 04.
- Plan 128-05 (wave 2, depends on 01–04) can run the final `yarn build` + `yarn test:unit` gate once the other wave-1 plans land.

## Self-Check: PASSED

- All 3 modified test files exist on disk; spike directory confirmed removed.
- All 3 task commits present in git history (`375971691`, `0bf2b01fa`, `d0fb8e6c5`).

---
*Phase: 128-svelte-check-0-long-tail-tests-docs*
*Completed: 2026-07-16*
