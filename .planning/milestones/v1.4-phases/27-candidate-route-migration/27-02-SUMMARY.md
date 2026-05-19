---
phase: 27-candidate-route-migration
plan: 02
subsystem: ui
tags: [svelte5, runes, sveltekit, candidate-app, auth, preregister]

# Dependency graph
requires:
  - phase: 24-voter-route-migration
    provides: Established runes patterns for route migration ($derived, $effect, $state, page from $app/state)
provides:
  - 7 candidate auth/preregister route pages fully in Svelte 5 runes mode
  - Zero $: reactive statements in auth/preregister routes
  - Zero $app/stores imports in auth/preregister routes
affects: [27-candidate-route-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "$effect replacing onMount for popup notifications (preregister)"
    - "$effect replacing onMount for input focus (login)"
    - "Single $effect for OIDC auth code exchange combining two $: statements (D-08)"
    - "$effect for changedAfterCheck tracking on input changes (D-09)"

key-files:
  created: []
  modified:
    - apps/frontend/src/routes/candidate/password-reset/+page.svelte
    - apps/frontend/src/routes/candidate/register/password/+page.svelte
    - apps/frontend/src/routes/candidate/preregister/status/+page.svelte
    - apps/frontend/src/routes/candidate/preregister/+page.svelte
    - apps/frontend/src/routes/candidate/login/+page.svelte
    - apps/frontend/src/routes/candidate/preregister/signicat/oidc/callback/+page.svelte
    - apps/frontend/src/routes/candidate/register/+page.svelte

key-decisions:
  - "register/+page.svelte registrationKey changed from string|null to string via ?? '' to work cleanly with $state and bind:value"

patterns-established:
  - "$state() for all mutated variables that drive template rendering or $derived computations"
  - "$derived() for single-expression reactive declarations (canSubmit, submitLabel, code, isLoginShown)"
  - "page from $app/state replacing $page from $app/stores with $ prefix removal in script and template"

requirements-completed: [ROUTE-01, ROUTE-03, LIFE-01]

# Metrics
duration: 3min
completed: 2026-03-21
---

# Phase 27 Plan 02: Auth/Preregister Route Migration Summary

**7 candidate auth/preregister pages migrated to Svelte 5 runes with $derived, $effect, $state, and page from $app/state**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T10:49:04Z
- **Completed:** 2026-03-21T10:52:27Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- All 7 auth/preregister page files have `<svelte:options runes />`
- Zero `$:` reactive statements across all 7 files
- Zero `$app/stores` imports across all 7 files
- OIDC callback uses single `$effect` combining authorization code extraction and exchange (D-08)
- Register page uses `$effect` for changedAfterCheck tracking (D-09)
- Login and preregister onMount calls replaced with `$effect` (D-02)
- All `getLayoutContext(onDestroy)` calls preserved (D-01)
- All `$store` shorthand preserved unchanged (D-15)

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate 4 simple auth pages** - `e9c08cb94` (feat)
2. **Task 2: Migrate 3 complex auth pages** - `eb2303718` (feat)

## Files Created/Modified
- `apps/frontend/src/routes/candidate/password-reset/+page.svelte` - $derived for canSubmit/submitLabel, $state for mutated vars, page from $app/state
- `apps/frontend/src/routes/candidate/register/password/+page.svelte` - $derived for canSubmit/submitLabel, $state for mutated vars, page from $app/state
- `apps/frontend/src/routes/candidate/preregister/status/+page.svelte` - $derived for code, page from $app/state
- `apps/frontend/src/routes/candidate/preregister/+page.svelte` - $effect replacing onMount for popup notification
- `apps/frontend/src/routes/candidate/login/+page.svelte` - $effect replacing onMount, $derived for canSubmit/isLoginShown, $state for 6 mutated vars, page from $app/state
- `apps/frontend/src/routes/candidate/preregister/signicat/oidc/callback/+page.svelte` - Single $effect for OIDC auth code exchange (D-08), page from $app/state
- `apps/frontend/src/routes/candidate/register/+page.svelte` - $effect for changedAfterCheck (D-09), $derived for canSubmit, $state for mutated vars, page from $app/state

## Decisions Made
- register/+page.svelte: Changed `registrationKey` initialization from `$page.url.searchParams.get('registrationKey')` (string|null) to `$state(page.url.searchParams.get('registrationKey') ?? '')` (string) for cleaner $state and bind:value compatibility. Empty string check in canSubmit derivation handles the null case.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All auth/preregister candidate routes now in runes mode
- Ready for plans 03 and 04 to migrate protected routes and layouts

## Self-Check: PASSED

All 7 modified files exist on disk. Both task commits verified (e9c08cb94, eb2303718).

---
*Phase: 27-candidate-route-migration*
*Completed: 2026-03-21*
