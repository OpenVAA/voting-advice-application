---
phase: 26-validation-gate
plan: 01
subsystem: ui
tags: [svelte5, typescript, legacy-patterns, svelte-check, migration-cleanup]

# Dependency graph
requires:
  - phase: 25-cleanup
    provides: All TODO[Svelte 5] markers resolved and candidate app call sites updated
provides:
  - Zero legacy Svelte 4 patterns in voter routes, shared components, and dynamic components
  - Zero svelte-check TypeScript errors in all in-scope files
affects: [26-validation-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Non-null assertions inside Svelte {#if} guards for $state<T>() variables"
    - "Optional chaining for $state variables that may be undefined at call time"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/components/heroEmoji/HeroEmoji.svelte
    - apps/frontend/src/lib/dynamic-components/survey/SurveyButton.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/NavGroup.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/Navigation.svelte
    - apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte
    - apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.svelte
    - apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte
    - apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte
    - apps/frontend/src/routes/(voters)/(located)/results/+page.svelte

key-decisions:
  - "Non-null assertions (!) used only inside Svelte {#if} template guards where runtime guarantees the value is defined"
  - "Optional chaining (?.) used for activeElection where the variable may genuinely be undefined at the call site"
  - "Guard clause pattern in onMount for $state variables that TypeScript cannot prove are set before mount"

patterns-established:
  - "Non-null assertion inside {#if var} guards: safe pattern for $state<T>() without initializer in Svelte 5 templates"

requirements-completed: [VAL-02, VAL-03]

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 26 Plan 01: Legacy Pattern Audit + TypeScript Error Fixes Summary

**Zero legacy Svelte 4 patterns and zero svelte-check TypeScript errors achieved across all in-scope files (voter routes, shared components, dynamic components)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-19T20:11:53Z
- **Completed:** 2026-03-19T20:15:00Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Removed all legacy Svelte 4 patterns from in-scope files (commented-out `$:` block, dead code with `on:click`, JSDoc examples with `on:event`/`slot=` syntax)
- Updated 8 dynamic-component JSDoc documentation blocks to use Svelte 5 idioms (onclick, onCancel, snippets, callback props)
- Fixed all 11 svelte-check TypeScript "possibly undefined" errors across 3 voter route files
- Verified 410 unit tests still pass with zero regressions
- svelte-check reports 0 errors across all 2001 files

## Task Commits

Each task was committed atomically:

1. **Task 1: Legacy pattern audit and fix** - `407a22d8e` (fix)
2. **Task 2: Fix 11 svelte-check TypeScript errors** - `078a92a7c` (fix)

## Files Created/Modified
- `apps/frontend/src/lib/components/heroEmoji/HeroEmoji.svelte` - Removed commented-out `$:` reactive block
- `apps/frontend/src/lib/dynamic-components/survey/SurveyButton.svelte` - Updated JSDoc: Events to Callback Props, on:click to onClick
- `apps/frontend/src/lib/dynamic-components/navigation/NavGroup.svelte` - Updated JSDoc: Slots to Snippets, on:click to onclick
- `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte` - Updated JSDoc: on:click to onclick in description and usage
- `apps/frontend/src/lib/dynamic-components/navigation/Navigation.svelte` - Updated JSDoc: Slots to Snippets, Events to Callback Props, on:keyboardFocusOut to onKeyboardFocusOut
- `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte` - Updated JSDoc: Events to Callback Props (onCancel, onError, onSent)
- `apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte` - Updated JSDoc: removed slot="close", on:click to onclick
- `apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte` - Updated JSDoc: removed slot="close", on:click to onclick
- `apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.svelte` - Updated JSDoc: Events to Callback Props, removed dead commented-out button block
- `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte` - Added onMount guard clause, non-null assertions in template
- `apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte` - Non-null assertion for category prop inside {#if} guard
- `apps/frontend/src/routes/(voters)/(located)/results/+page.svelte` - Optional chaining for activeElection

## Decisions Made
- Non-null assertions (!) used inside Svelte `{#if}` template guards where the runtime guarantees values are defined, but TypeScript cannot narrow through Svelte's conditional blocks
- Optional chaining (?.) used for `activeElection` in results page where the variable may genuinely be undefined
- Guard clause `if (!question) return;` added to onMount callback where $effect populates the value before mount but TypeScript cannot prove timing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- VAL-02 (zero TypeScript errors) and VAL-03 (zero legacy patterns) requirements satisfied
- Ready for Plan 02: Full E2E test suite execution (VAL-01)

## Self-Check: PASSED

All 12 modified files verified on disk. Both task commits (407a22d8e, 078a92a7c) verified in git log.

---
*Phase: 26-validation-gate*
*Completed: 2026-03-19*
