---
phase: 95-domain-a-wave-1-tier-1-leaf-contexts
plan: 01
subsystem: ui
tags: [svelte5, runes, ssr, appContext, appSettings, hydration, state]

# Dependency graph
requires:
  - phase: 88-e2e-catalog-audit
    provides: post-audit deterministic E2E baseline this migration regresses against (no-behavior-regression gate)
provides:
  - "Pure mergeAppSettings ({ ...target, ...nonNull }) — no shared staticSettings module-ref mutation"
  - "mergeInitialAppSettings(static, dynamic, dbData) pure SSR-init helper in lib/utils/settings.ts"
  - "appContext appSettings + appCustomization DB override folded into $state init (SSR-correct, no default→override flash)"
  - "Wave-0 purity + SSR-init unit coverage (settings.test.ts, 8 cases)"
affects: [95-02-dataContext, 95-03-answer-stores, 95-04-overlay-registry, 95-05-popupStore, 97-consumer-codemod, 98-clean]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pattern 7 — synchronous SSR-aware $state init (read page.data at init, not only in $effect)"
    - "Pattern 8 / D-05 — pure spread merge for shared module singletons"
    - "L-3 — reference-equality guard on page.data initialized to the init-time DB value"

key-files:
  created:
    - apps/frontend/src/lib/utils/settings.test.ts
  modified:
    - apps/frontend/src/lib/utils/settings.ts
    - apps/frontend/src/lib/contexts/app/appContext.svelte.ts

key-decisions:
  - "Extracted internal pure helper mergeInitialAppSettings (K1-compliant — internal, not a renamed public symbol) so the SSR-init merge is unit-assertable without a running dev server"
  - "SSR no-flash verified via unit assertion on the pure init helper (sentinel DB override present in initial value, NO $effect flush) rather than an E2E/dev-server test"
  - "Kept all exported toStore bridges + userPreferences Writable untouched (Wave-1 boundary; ~60 consumers migrate in Wave 3)"

patterns-established:
  - "Pattern 7: DB-override merge belongs in $state init (server + client) so SSR HTML carries it; $effect handles post-navigation changes only"
  - "Pattern 8: mergeAppSettings is pure; never mutate the shared staticSettings reference"

requirements-completed: [CTX-01]

# Metrics
duration: 4min
completed: 2026-06-04
---

# Phase 95 Plan 01: appContext SSR-Gap Fix + mergeAppSettings Purity Summary

**appContext's appSettings + appCustomization DB override now merges at `$state` init (SSR-correct, no post-hydration flash) and `mergeAppSettings` is a pure spread that no longer mutates the shared `staticSettings` module reference.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-06-04T11:38:26Z
- **Completed:** 2026-06-04T11:42:35Z
- **Tasks:** 3
- **Files modified:** 3 (2 modified, 1 created)

## Accomplishments
- Made `mergeAppSettings` pure (`{ ...target, ...nonNull }`) — eliminates the cross-context `staticSettings` pollution (threat T-95-01-01 mitigated).
- Folded the DB override into the INITIAL `$state` value for BOTH `appSettings` and `appCustomization` via a synchronous `page.data` read — server-rendered HTML now carries the override (D-04; closes the real production SSR gap spike 008 surfaced).
- Initialized the load-bearing reference-equality guards (`prevAppSettingsData` / `prevAppCustomizationData`) to the init-time DB value so the post-navigation `$effect` does not re-merge the already-folded payload; the `$effect` keeps the L-3 guard + `Error` short-circuit and handles post-nav changes only.
- Added 8 unit cases (purity + SSR-init), including a sentinel-override assertion that proves the override is in the initial value with no `$effect` flush and FAILS if the merge were reverted to `$effect`-only.

## Task Commits

Each task was committed atomically:

1. **Task 1: Make mergeAppSettings pure + Wave-0 purity test** (TDD)
   - `411d00661` (test — RED: failing purity test)
   - `6bb28d884` (feat — GREEN: pure spread)
2. **Task 2: Fold DB override into $state init (close SSR gap)** - `1a5a8bcd2` (feat)
3. **Task 3: Assert DB override is in initial settings value (SSR no-flash)** - `3e5761541` (test)

_TDD task 1 produced two commits (test → feat). No refactor commit was needed._

## Files Created/Modified
- `apps/frontend/src/lib/utils/settings.ts` - `mergeAppSettings` made pure (spread, no `Object.assign` mutation); added internal pure `mergeInitialAppSettings(static, dynamic, dbData)` SSR-init helper.
- `apps/frontend/src/lib/utils/settings.test.ts` - **NEW**. 8 vitest cases: 4 `mergeAppSettings` purity (new object, no target mutation, nullish filter, key override) + 4 `mergeInitialAppSettings` SSR-init (sentinel override present at init, undefined→base, Error→base, purity).
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` - synchronous `page.data.appSettingsData` / `appCustomizationData` reads at init; `appSettingsValue` built via `mergeInitialAppSettings`; `appCustomizationValue` given identical synchronous-init treatment; both reference-equality guards initialized to the init-time DB value; exported `toStore` bridges + `userPreferences` `localStorageWritable` untouched.

## Decisions Made
- **Extracted `mergeInitialAppSettings` as an internal pure helper** (rather than inlining the init merge in the context). Rationale: makes the SSR-init merge directly unit-assertable in a server-context-free vitest run (no dev server), and keeps the `$state(...)` declaration a single readable call. K1-compliant — it is an internal helper, not a renamed public symbol; no `rune…`/`…Native` suffix.
- **SSR no-flash proven at the unit level** via the pure helper rather than an E2E/dev-server test. The sentinel-override assertion is the unit equivalent of spike 008 variantB's `initialMergeIncludedDbOverride === true`, and the `undefined`/`Error` cases ensure it genuinely guards the fix (it would fail if the override were reverted to `$effect`-only). The network-throttle visual no-flash check is recorded below as the documented manual belt-and-braces (per 95-VALIDATION Manual-Only table), not the automated gate.

## Deviations from Plan

None — plan executed exactly as written. (The `mergeInitialAppSettings` helper extraction is explicitly sanctioned by Task 3's `<action>`: "If the init merge is not cleanly extractable for a server-context unit assertion, extract a tiny pure helper … and unit-test that helper directly (still K1-compliant).")

## Issues Encountered
- `yarn check` (svelte-check) reports 4 pre-existing type errors in `appContext.svelte.ts` (lines 187/222/229/246 — `UserFeedbackStatus` vs `FeedbackStatus` comparisons + `openFeedbackModal` `Writable` parenthesization). These originate from constructs present in the pre-edit baseline (HEAD~2) and on lines the 95-01 edits never touched (edits were confined to the appSettings/appCustomization `$state`-init region + the helper import). They are OUT OF SCOPE per the SCOPE BOUNDARY rule and were logged to `deferred-items.md`, not fixed. Repo-wide baseline: 151 errors / 30 warnings across 2151 files (qs declarations, admin/jobs cookies, candidateContext SupabaseDataWriter, etc.) — all pre-existing; **no new errors introduced by 95-01**.

## Verification Notes
- `cd apps/frontend && yarn test:unit --run` → **686 passed (41 files)** (was 682 pre-plan; +4 SSR-init assertions). Includes new `settings.test.ts` (8/8) and all existing appContext-dependent tests.
- `grep -c "Object.assign" settings.ts` → 0; `grep -c "{ ...target, ...nonNull }"` → 1.
- `grep -c "page.data.*appSettingsData" appContext.svelte.ts` → 3 (≥2: synchronous init read + `$effect` read).
- `toStore` count in `appContext.svelte.ts` unchanged vs pre-edit (9 == 9) — exported bridges kept.
- **Manual (documented, not blocking):** throttle the network, hard-load a DB-overridden instance, and confirm the server HTML already carries the override (no default→override flash). Mirrors 95-VALIDATION Manual-Only Verifications; the automated sentinel-override unit assertion is the primary gate.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CTX-01 complete: appContext is pure runes internally for appSettings + appCustomization; SSR override renders server-side; `mergeAppSettings` is pure.
- Wave-1 boundary preserved: exported `toStore` bridges + `userPreferences` `Writable` + `localStorageWritable` are intact for the ~60 un-migrated consumers (Wave 3 / Phase 97). `StackedState`/`persistedState` deletions remain Phase 98.
- Parallel-eligible plans 95-02 (dataContext), 95-03 (answer stores), 95-04 (overlay registry), 95-05 (popupStore) touch disjoint files and are unblocked.

## Self-Check: PASSED
- FOUND: apps/frontend/src/lib/utils/settings.ts (modified)
- FOUND: apps/frontend/src/lib/utils/settings.test.ts (created)
- FOUND: apps/frontend/src/lib/contexts/app/appContext.svelte.ts (modified)
- FOUND commit 411d00661 (test RED)
- FOUND commit 6bb28d884 (feat GREEN)
- FOUND commit 1a5a8bcd2 (feat SSR-init)
- FOUND commit 3e5761541 (test SSR assertion)

---
*Phase: 95-domain-a-wave-1-tier-1-leaf-contexts*
*Completed: 2026-06-04*
