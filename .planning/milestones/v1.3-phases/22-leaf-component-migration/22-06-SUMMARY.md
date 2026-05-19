---
phase: 22-leaf-component-migration
plan: 06
subsystem: ui
tags: [svelte5, runes, props, bindable, candidate-components, admin-components]

# Dependency graph
requires:
  - phase: 22-04
    provides: "Shared and dynamic leaf components migrated to runes mode"
  - phase: 22-05
    provides: "Standard dynamic leaf components migrated to runes mode"
provides:
  - "All 98 leaf components across shared, dynamic, candidate, and admin directories in Svelte 5 runes mode"
  - "Comprehensive verification that COMP-01 through COMP-09 (Phase 22 scope) are fully met"
  - "LanguageSelector with $bindable() on selected prop (COMP-06)"
  - "PasswordField/PasswordSetter export functions preserved for bind:this pattern"
affects: [phase-23-container-migration, phase-26-validation-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "export function in runes mode for bind:this consumer pattern (PasswordField.focus, PasswordSetter.reset)"
    - "$effect for debounced validation with setTimeout (PasswordValidator)"
    - "Snippet children prop replacing default <slot> (WithPolling)"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte
    - apps/frontend/src/lib/candidate/components/passwordField/PasswordField.svelte
    - apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte
    - apps/frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.svelte
    - apps/frontend/src/lib/candidate/components/preregisteredNotification/PreregisteredNotification.svelte
    - apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUse.svelte
    - apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte
    - apps/frontend/src/lib/admin/components/jobs/FeatureJobs.svelte
    - apps/frontend/src/lib/admin/components/jobs/JobDetails.svelte
    - apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte
    - apps/frontend/src/lib/admin/components/languageFeatures/LanguageSelector.svelte

key-decisions:
  - "PasswordField id prop uses local const instead of $bindable to avoid mutating prop"
  - "export function focus/reset kept as Svelte 5 component exports accessible via bind:this"
  - "PasswordValidator debounced validation uses $effect with explicit dependency tracking"

patterns-established:
  - "export function pattern: keep for bind:this consumers, works in runes mode"
  - "$effect for debounced side-effects with clearTimeout cleanup via onDestroy"

requirements-completed: [COMP-01, COMP-02, COMP-06, COMP-07, COMP-08, COMP-09]

# Metrics
duration: 7min
completed: 2026-03-18
---

# Phase 22 Plan 06: Candidate and Admin Component Migration + Phase Verification Summary

**All 11 remaining candidate/admin leaf components migrated to Svelte 5 runes mode; comprehensive verification confirms 98/98 leaf components pass COMP-01 through COMP-09 with zero legacy patterns**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-18T22:10:21Z
- **Completed:** 2026-03-18T22:18:17Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Migrated 7 candidate components (LogoutButton, PasswordField, PasswordSetter, PasswordValidator, PreregisteredNotification, TermsOfUse, TermsOfUseForm) to runes mode
- Migrated 4 admin components (FeatureJobs, JobDetails, WithPolling, LanguageSelector) to runes mode
- LanguageSelector uses $bindable() for selected prop (COMP-06)
- WithPolling converted from <slot> to {@render children()} snippet pattern
- Comprehensive verification confirms all Phase 22 requirements met: 98 files with runes opt-in, zero legacy globals, zero deprecated patterns
- Frontend build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate 7 candidate and 4 admin components to runes mode** - `cd935915a` (feat)
2. **Task 2: Comprehensive verification sweep** - verification only, no code changes needed

## Files Created/Modified
- `apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte` - $props() with restProps, remove $$restProps
- `apps/frontend/src/lib/candidate/components/passwordField/PasswordField.svelte` - $props() with $bindable(password), export function focus()
- `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte` - $props() with $bindable(password/valid/errorMessage), $effect validation
- `apps/frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.svelte` - $props() with $bindable(validPassword), $effect debounced validation, $derived filter rules
- `apps/frontend/src/lib/candidate/components/preregisteredNotification/PreregisteredNotification.svelte` - $props() with restProps
- `apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUse.svelte` - $derived for computed content
- `apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte` - $props() with $bindable(termsAccepted)
- `apps/frontend/src/lib/admin/components/jobs/FeatureJobs.svelte` - $props(), $derived for jobs, onclick
- `apps/frontend/src/lib/admin/components/jobs/JobDetails.svelte` - $props(), $effect for message toggle
- `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` - $props() with children snippet
- `apps/frontend/src/lib/admin/components/languageFeatures/LanguageSelector.svelte` - $props() with $bindable(selected), $derived options

## Decisions Made
- PasswordField `id` prop handled via local const (`const id = idProp ?? getUUID()`) to avoid mutating a non-bindable prop
- `export function focus()` and `export function reset()` kept as component exports (Svelte 5 supports this pattern; consumers use bind:this)
- PasswordValidator debounced validation converted to `$effect` with explicit `_password`/`_username` dependency tracking and `onDestroy` cleanup

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 22 (leaf component migration) is complete: all 98 leaf components migrated to Svelte 5 runes mode
- Ready for Phase 23 (container component migration) - 6 container components with named slots remain
- Ready for Phase 26 (validation gate) - E2E tests should be run to confirm no regressions
- Pre-existing typecheck errors (Partial<ButtonProps> union complexity, autocomplete type, buildRoute types) documented as known; not caused by migration

## Self-Check: PASSED

All 11 modified files exist on disk. Task 1 commit cd935915a verified in git log. SUMMARY.md created.

---
*Phase: 22-leaf-component-migration*
*Completed: 2026-03-18*
