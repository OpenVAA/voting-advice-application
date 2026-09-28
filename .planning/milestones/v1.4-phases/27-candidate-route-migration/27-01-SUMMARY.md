---
phase: 27-candidate-route-migration
plan: 01
subsystem: ui
tags: [svelte5, runes, candidate-app, migration, snippets, events]

# Dependency graph
requires: []
provides:
  - 10 candidate route files migrated to Svelte 5 runes mode
  - Runes-mode layouts with snippet children for preregister and register
  - Native event handling pattern in forgot-password
  - $derived reactive pattern in questions page
affects: [27-candidate-route-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Snippet children in layouts: import Snippet, $props() children, {@render children?.()}"
    - "Native form events: onsubmit with e.preventDefault() replacing on:submit|preventDefault"
    - "$derived replacing $: for computed values in runes mode"
    - "$state() required for variables used with bind: in runes mode"

key-files:
  created: []
  modified:
    - apps/frontend/src/routes/candidate/preregister/(authenticated)/+layout.svelte
    - apps/frontend/src/routes/candidate/preregister/+layout.svelte
    - apps/frontend/src/routes/candidate/register/+layout.svelte
    - apps/frontend/src/routes/candidate/forgot-password/+page.svelte
    - apps/frontend/src/routes/candidate/help/+page.svelte
    - apps/frontend/src/routes/candidate/privacy/+page.svelte
    - apps/frontend/src/routes/candidate/preregister/(authenticated)/constituencies/+page.svelte
    - apps/frontend/src/routes/candidate/preregister/(authenticated)/elections/+page.svelte
    - apps/frontend/src/routes/candidate/preregister/(authenticated)/email/+page.svelte
    - apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte

key-decisions:
  - "Variables used with bind: converted to $state() for runes compatibility (constituencies selectionComplete, email form fields)"

patterns-established:
  - "Snippet children in Svelte 5 layouts: import Snippet type, destructure from $props(), render with {@render children?.()}"
  - "Native events: onsubmit={handler} with e.preventDefault() inside handler body"

requirements-completed: [ROUTE-03, ROUTE-04, EVNT-01, EVNT-02]

# Metrics
duration: 3min
completed: 2026-03-21
---

# Phase 27 Plan 01: Minimal-Complexity Candidate Route Migration Summary

**10 candidate route files migrated to Svelte 5 runes mode: 3 layouts with snippet children, forgot-password with native onsubmit, questions page with $derived, and 5 simple page runes opt-ins**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T10:48:57Z
- **Completed:** 2026-03-21T10:52:09Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- 3 layout files (preregister, preregister/authenticated, register) converted from `<slot />` to `{@render children?.()}` with Snippet type and $props()
- forgot-password page converted from `on:submit|preventDefault` to native `onsubmit` with `e.preventDefault()`, plus `$state()` for form variables
- questions/+page.svelte `$: completion` converted to `$derived()` with proper type annotation
- 5 simple pages (help, privacy, constituencies, elections, email) given runes opt-in with appropriate `$state()` conversions for bound variables
- All `getLayoutContext(onDestroy)` calls preserved intact per D-01

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate 4 layout files and forgot-password event directive** - `710260956` (feat)
2. **Task 2: Add runes opt-in to 6 simple pages** - `84fee544a` (feat)

## Files Created/Modified

- `apps/frontend/src/routes/candidate/preregister/(authenticated)/+layout.svelte` - Runes + snippet children + Snippet import
- `apps/frontend/src/routes/candidate/preregister/+layout.svelte` - Runes + snippet children + Snippet import
- `apps/frontend/src/routes/candidate/register/+layout.svelte` - Runes + snippet children + Snippet import
- `apps/frontend/src/routes/candidate/forgot-password/+page.svelte` - Runes + $state + native onsubmit
- `apps/frontend/src/routes/candidate/help/+page.svelte` - Runes opt-in only
- `apps/frontend/src/routes/candidate/privacy/+page.svelte` - Runes opt-in only
- `apps/frontend/src/routes/candidate/preregister/(authenticated)/constituencies/+page.svelte` - Runes + $state for selectionComplete
- `apps/frontend/src/routes/candidate/preregister/(authenticated)/elections/+page.svelte` - Runes opt-in only
- `apps/frontend/src/routes/candidate/preregister/(authenticated)/email/+page.svelte` - Runes + $state for form fields
- `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte` - Runes + $derived for completion

## Decisions Made

- Variables used with `bind:` in runes mode require `$state()` -- applied to constituencies/selectionComplete and email/form,email1,email2,status,termsAccepted even though the plan described these as "no other changes needed"

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added $state() for bind: variables in constituencies and email pages**
- **Found during:** Task 2 (Simple pages migration)
- **Issue:** Plan stated "no other changes needed" for constituencies and email pages, but in Svelte 5 runes mode, variables used with `bind:` directives must be `$state()` to maintain reactivity
- **Fix:** Converted `let selectionComplete: boolean` to `$state(false)` in constituencies; converted `let form`, `let email1`, `let email2`, `let status`, `let termsAccepted` to `$state()` variants in email page; added optional chaining for `form?.reportValidity()` since $state<HTMLFormElement>() can be undefined
- **Files modified:** constituencies/+page.svelte, email/+page.svelte
- **Verification:** Files compile with runes mode, bind: directives have reactive sources
- **Committed in:** 84fee544a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Auto-fix necessary for correctness in runes mode. Without $state(), bind: variables would not be reactive. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 10 of 25 candidate route files now in Svelte 5 runes mode
- Patterns established for remaining files: snippet children in layouts, native events, $derived for computed values
- Ready for plan 02 (medium-complexity routes with more reactive patterns)

## Self-Check: PASSED

- All 10 modified files exist on disk
- Both task commits found: 710260956, 84fee544a
- SUMMARY.md created successfully

---
*Phase: 27-candidate-route-migration*
*Completed: 2026-03-21*
