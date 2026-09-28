---
phase: 109-appcontext-orchestrator-spread-fix-poc-removal
plan: 03
subsystem: ui
tags: [svelte5, context, appContext, spread-safety, regression-test, tdd, green-gate]

# Dependency graph
requires:
  - phase: 109-02
    provides: class AppContextProvider with every member installed own-enumerable (the invariant this plan's test guards)
  - phase: 107-componentcontext-class
    provides: ComponentContextProvider spread-safety test idiom analog
  - phase: 108-trackingservice-class
    provides: trackingService spread-safety regression-guard test analog
provides:
  - appContext.spread.svelte.test.ts — headless own-enumerability regression test proving { ...new AppContextProvider() } captures every AppContext member as own-enumerable (Object.keys superset, not `in`)
  - AppContextProvider exported as a test seam (non-behavioral) so the headless test can construct it directly
  - full Phase 109 green-gate evidence (build client+SSR + vitest 101 + svelte-check 151/0 + git diff) recorded here
affects: [110-112-orchestrator-spread-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Own-enumerability spread regression guard: assert Object.keys(spread) is a SUPERSET of the type's member list (NOT `in`, which passes for prototype members too) — per-key toContain loop names any dropped member"
    - "Headless construction of an orchestrator class: vi.mock the upstream contexts (getComponentContext/getDataContext) + producers (tracking/survey/popup/getRoute/localStorageState) to own-enumerable handle stubs; vi.mock $app/state with empty page.data so SSR field initializers fall back to static defaults; construct inside $effect.root + flushSync"
    - "Export the provider class as a documented test seam while production keeps using the initAppContext/getAppContext factory wrappers"

key-files:
  created:
    - apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts
  modified:
    - apps/frontend/src/lib/contexts/app/appContext.svelte.ts

key-decisions:
  - "Exported AppContextProvider as a test seam (the plan's read_first explicitly sanctioned this over a thinner seam) — non-behavioral; production code constructs only via initAppContext()"
  - "Asserted own-enumerability via Object.keys(spread) superset (per-key toContain loop) rather than `in`, because `in` would also pass for prototype getters — defeating the regression guard's entire purpose"
  - "Typed the test instance via InstanceType<typeof AppContextProvider> (the class is exported as a value, not a type)"

patterns-established:
  - "The downstream { ...appContext } spread invariant now has a permanent CI guard: a future edit converting any member to a prototype getter / bare $state field fails the spread test before it can silently drop the member from candidateContext:366 / adminContext:98 / voterContext:488"

requirements-completed: [CLASS-04]

# Metrics
duration: 3min
completed: 2026-06-13
---

# Phase 109 Plan 03: appContext Spread Regression Test + Green Gate Summary

**Added a headless own-enumerability regression test proving `{ ...new AppContextProvider() }` captures every AppContext member as an own-enumerable property (the exact invariant the three untouched downstream orchestrators — candidateContext:366, adminContext:98, voterContext:488 — depend on), exported the provider class as a test seam, and ran the full Phase 109 green gate (build client+SSR + vitest 101/101 + svelte-check 151/0, zero new) with the downstream consumers confirmed unmodified and unbroken.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-06-12T23:20:41Z
- **Completed:** 2026-06-12T23:23:44Z
- **Tasks:** 2
- **Files modified:** 1 modified + 1 created

## Accomplishments

- Created `appContext.spread.svelte.test.ts` (3 `it()` cases) following the authContext/trackingService idiom:
  - **Test 1 (own-enumerability):** spreads `new AppContextProvider()` and asserts `Object.keys(spread)` is a SUPERSET of the 32-member AppContext list (per-key `toContain` loop, so a missing member names itself). Uses `Object.keys` — NOT `in` — so a prototype-getter regression fails.
  - **Test 2 (snapshot semantics):** a representative reactive member read through the spread snapshot (`spread.appSettings.current`, `spread.locale.current`) reflects the value at spread time — documenting what the downstream orchestrators rely on (they spread at init time).
  - **Edge case:** the read-write `appType.set` / `appType.update` handle survives the spread and is callable on the spread copy.
- Headless construction: `vi.mock` of `$app/state` (empty `page.data`), `$app/environment` (`browser:false`), the upstream contexts (`../component` `getComponentContext`, `../data` `getDataContext`), and the producers (`./tracking`, `./survey.svelte`, `./popup`, `./getRoute.svelte`, `../utils/persistedState.svelte` `localStorageState`) — all to minimal own-enumerable handle stubs. Construction wrapped in `$effect.root` + `flushSync` (the class installs constructor `$effect`s).
- Exported `AppContextProvider` from `appContext.svelte.ts` as a documented test seam (non-behavioral; production keeps using `initAppContext()` / `getAppContext()`).
- Ran the complete Phase 109 green gate and recorded exact numbers (see Verification Results).

## Task Commits

Each task was committed atomically (TDD RED→GREEN for Task 1):

1. **Task 1 — RED: add failing own-enumerability spread guard** - `8ef0ebec2` (test)
2. **Task 1 — GREEN: export AppContextProvider as a test seam** - `8f9b6f5f3` (feat)
3. **Task 1 — type fix: InstanceType<typeof AppContextProvider> (svelte-check)** - `f4ce6dd83` (test)
4. **Task 2 — full green gate + downstream-unmodified verification** - (verification + this SUMMARY; no source changes)

## Files Created/Modified

- `apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts` — **NEW**: headless regression test (3 `it()` cases) asserting `{ ...new AppContextProvider() }` captures all 32 AppContext members as own-enumerable.
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` — added `export` to `class AppContextProvider` (documented test seam) + a JSDoc note that production must use the factory wrappers. No behavioral change.

## Verification Results

Full Phase 109 green gate (run from `apps/frontend`):

1. `grep -rn '_poc' src/` → **zero hits** (ROADMAP criterion 2; re-confirmed post-conversion).
2. `yarn build` → **green** (client + SSR, built in ~8s; `appContext.svelte.js` SSR chunk emitted).
3. `yarn vitest run src/lib/contexts/` → **101 passed / 20 files.**
   - **Deleted-PoC delta math:** pre-phase baseline 101 → Plan 01 deleted the 3-`it()` PoC test → 98 post-removal baseline (matches Plans 01/02). Plan 03's new spread test adds 3 `it()` cases → **98 + 3 = 101 final live total.** Unambiguous.
4. `yarn svelte-check` → **151 errors / 0 warnings — zero new** vs the 151-error baseline (all pre-existing: `qs` declarations, password types, questions-layout `string`/`number`, settings form props — none in the appContext surface).
5. `git diff --name-only` across Phase 109 commits (`87cedd9fa^..HEAD`, source files only) lists ONLY:
   - `appContext.poc.svelte.test.ts` (DELETED, Plan 01)
   - `appContext.svelte.ts` (Plans 02 + 03 seam)
   - `appContext.type.ts` (Plan 01)
   - `darkMode.svelte.ts` (Plan 01)
   - `appContext.spread.svelte.test.ts` (NEW, Plan 03)
   - Does NOT list `candidateContext.svelte.ts`, `voterContext.svelte.ts`, `adminContext.svelte.ts`, or any `getAppContext()` component consumer.
6. Downstream `{ ...appContext }` spread sites confirmed intact and unmodified: `voterContext.svelte.ts:488`, `adminContext.svelte.ts:98`, `candidateContext.svelte.ts:366`.

## Decisions Made

- Asserted own-enumerability via `Object.keys(spread)` superset (per-key `toContain` loop) rather than `in` — `in` would also pass for prototype getters, which is exactly the failure mode being guarded against.
- Exported the provider class as the test seam (the plan's `read_first` explicitly sanctioned "OR export a thin test seam"); chose the export over a more invasive seam because it is the minimal, non-behavioral change and is the same shape as the shipped authContext/trackingService analogs whose tests import their providers/producers directly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Exported AppContextProvider as a test seam**
- **Found during:** Task 1 (RED → GREEN).
- **Issue:** `AppContextProvider` was not exported from `appContext.svelte.ts` (only the `initAppContext`/`getAppContext` factory wrappers were), so the headless test could not construct it — RED failure was `AppContextProvider is not a constructor`.
- **Fix:** Added `export` to the class declaration + a JSDoc note that production must use the factory wrappers. Non-behavioral. The plan's Task 1 `read_first` explicitly anticipated this ("OR export a thin test seam").
- **Files modified:** `apps/frontend/src/lib/contexts/app/appContext.svelte.ts`
- **Commit:** `8f9b6f5f3`

**2. [Rule 1 - Bug] Fixed 2 self-introduced svelte-check errors (class-as-type)**
- **Found during:** Task 2 (svelte-check gate).
- **Issue:** The new test typed the instance as `AppContextProvider` (a value, not a type), producing 2 new svelte-check errors (`'AppContextProvider' refers to a value, but is being used as a type here`) — would have pushed svelte-check to 153 (+2 vs the 151 baseline).
- **Fix:** Typed the instance via `InstanceType<typeof AppContextProvider>`. Back to 151/0, zero new. Test remains 3/3 green.
- **Files modified:** `apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts`
- **Commit:** `f4ce6dd83`

Both deviations were in the new Plan 03 artifacts (the export seam + the test's own type annotation) — NOT defects in Plan 01/02 source. The downstream consumers and the Plan 02 class body were untouched.

## Issues Encountered

None beyond the two auto-fixed deviations above (both self-contained to the Plan 03 test + the test seam).

## User Setup Required

None — one new test file + a non-behavioral `export` on an existing class.

## Next Phase Readiness

- The downstream `{ ...appContext }` spread invariant now has a permanent CI regression guard. A future edit converting any AppContext member to a prototype getter or a bare `$state`/`$derived` field will fail `appContext.spread.svelte.test.ts` before it can silently drop the member from the three orchestrator spreads.
- All four ROADMAP Phase 109 success criteria are confirmed as a verified whole: (1) class + explicit own-enumerable forwarding (Plan 02, re-proven by this test); (2) zero `_poc` (Plan 01, re-confirmed); (3) SSR appSettings/appCustomization merge preserved (Plan 02, build green); (4) full green gate — build client+SSR + vitest 101 + svelte-check 151/0, downstream unbroken.
- Phases 110-112 (orchestrator spread migration) can now safely convert the three downstream consumers off the instance-spread, with this test as the safety net for the appContext side.

## Self-Check: PASSED

- `apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts` exists and contains `AppContextProvider` + an `EXPECTED_KEYS` member list.
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` contains `export class AppContextProvider`.
- All three task commits (`8ef0ebec2`, `8f9b6f5f3`, `f4ce6dd83`) found in git log.

## TDD Gate Compliance

- RED gate: `test(109-03): add failing own-enumerability spread guard` — `8ef0ebec2` (failed: `AppContextProvider is not a constructor`).
- GREEN gate: `feat(109-03): export AppContextProvider as a test seam` — `8f9b6f5f3` (3/3 pass).
- No REFACTOR needed (the type-annotation fix `f4ce6dd83` is a follow-on bug fix to the test, not a refactor of passing code).

---
*Phase: 109-appcontext-orchestrator-spread-fix-poc-removal*
*Completed: 2026-06-13*
