---
phase: 22-leaf-component-migration
plan: 05
subsystem: ui
tags: [svelte5, runes, props, derived, effect, state, svelte-self, svelte-component, event-forwarding, createEventDispatcher, bindable]

# Dependency graph
requires:
  - phase: 22-03
    provides: "All shared leaf components in runes mode (Button, Icon, etc.)"
provides:
  - "12 high-attention dynamic components in runes mode with $props() and zero legacy globals"
  - "EntityCard self-import replacing svelte:self (COMP-07)"
  - "AppLogo direct component usage replacing svelte:component (COMP-08)"
  - "NavItem event forwarding via restProps replacing bare on:click (COMP-03)"
  - "All NavItem consumer call sites updated to onclick"
  - "4 createEventDispatcher components (DataConsent, SurveyButton, Feedback, Navigation) in runes mode with dispatcher preserved for Phase 23"
affects: [22-06, 23-container-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Self-import pattern for recursive components (EntityCard imports itself)"
    - "Direct component usage in #await blocks replacing svelte:component (AppLogo)"
    - "onclick via restProps spread for event forwarding (NavItem)"
    - "createEventDispatcher preserved in runes mode for Phase 23 callback prop conversion"
    - "bind:this pattern for accessing export function from runes components (Feedback)"

key-files:
  created: []
  modified:
    - "apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte"
    - "apps/frontend/src/lib/dynamic-components/appLogo/AppLogo.svelte"
    - "apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte"
    - "apps/frontend/src/lib/dynamic-components/navigation/NavGroup.svelte"
    - "apps/frontend/src/lib/dynamic-components/navigation/NavGroup.type.ts"
    - "apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte"
    - "apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte"
    - "apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte"
    - "apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte"
    - "apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.svelte"
    - "apps/frontend/src/lib/dynamic-components/survey/SurveyButton.svelte"
    - "apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte"
    - "apps/frontend/src/lib/dynamic-components/feedback/Feedback.type.ts"
    - "apps/frontend/src/lib/dynamic-components/feedback/popup/FeedbackPopup.svelte"
    - "apps/frontend/src/lib/dynamic-components/feedback/modal/FeedbackModal.svelte"
    - "apps/frontend/src/lib/dynamic-components/navigation/Navigation.svelte"

key-decisions:
  - "EntityCard $derived.by() returns typed parsed object with explicit EntityVariantMatch cast for SubMatches compatibility"
  - "NavGroup type corrected from SvelteHTMLElements['ul'] to SvelteHTMLElements['section'] to match actual rendered element"
  - "Feedback export function submit/reset kept as-is; consumers updated to bind:this pattern (Rule 3)"
  - "Feedback.type.ts submit/reset props removed (they are export functions, not props)"
  - "SurveyButton Partial<ButtonProps> union type complexity error accepted as pre-existing pattern (same as LogoutButton)"
  - "DataConsentPopup on:change dispatcher type regression accepted (runes+createEventDispatcher type inference limitation)"

patterns-established:
  - "Self-import for recursive components: import ComponentName from './ComponentName.svelte'"
  - "Direct component in #await: use component variable directly instead of svelte:component this={...}"
  - "Event forwarding via restProps: consumer passes onclick={handler}, flows through spread on element"
  - "bind:this for export function access: let ref = ReturnType<typeof Component>, then ref?.method()"

requirements-completed: [COMP-01, COMP-02, COMP-03, COMP-07, COMP-08]

# Metrics
duration: 19min
completed: 2026-03-18
---

# Phase 22 Plan 05: High-Attention Dynamic Component Migration Summary

**12 dynamic components migrated to runes mode: EntityCard self-import (COMP-07), AppLogo direct component (COMP-08), NavItem onclick via restProps (COMP-03), and 4 createEventDispatcher components with dispatcher preserved for Phase 23**

## Performance

- **Duration:** 19 min
- **Started:** 2026-03-18T21:44:33Z
- **Completed:** 2026-03-18T22:03:44Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- EntityCard converted from svelte:self to self-import pattern with $derived.by() for all reactive state
- AppLogo converted from svelte:component to direct component usage in #await block with $derived for logo resolution
- NavItem event forwarding replaced: bare on:click removed, onclick flows through restProps; all 5 consumer call sites updated
- 4 createEventDispatcher components (DataConsent, SurveyButton, Feedback, Navigation) in runes mode with dispatcher boundary preserved for Phase 23 COMP-04 conversion
- Feedback.svelte consumer binding pattern updated from bind:reset/submit to bind:this for runes compatibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate EntityCard, AppLogo, and NavItem with deprecated syntax replacements** - `1bbc00ae0` (feat)
2. **Task 2: Migrate 4 createEventDispatcher components with boundary preservation** - `390257e25` (feat)

## Files Created/Modified
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` - Self-import replacing svelte:self, $derived.by() for reactive parsing
- `apps/frontend/src/lib/dynamic-components/appLogo/AppLogo.svelte` - Direct component usage in #await, $derived for logo/classes
- `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte` - Runes mode, onclick via restProps spread
- `apps/frontend/src/lib/dynamic-components/navigation/NavGroup.svelte` - Runes mode, $props()
- `apps/frontend/src/lib/dynamic-components/navigation/NavGroup.type.ts` - Fixed type from SvelteHTMLElements['ul'] to ['section']
- `apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte` - Runes mode, onclick on NavItem
- `apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte` - Runes mode, onclick on NavItem
- `apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte` - Runes mode, onclick on NavItem
- `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte` - Runes mode opt-in
- `apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.svelte` - Runes mode, dispatcher preserved
- `apps/frontend/src/lib/dynamic-components/survey/SurveyButton.svelte` - Runes mode with $bindable(clicked), dispatcher preserved
- `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte` - Runes mode with $state/$effect, dispatcher preserved, export function kept
- `apps/frontend/src/lib/dynamic-components/feedback/Feedback.type.ts` - Removed submit/reset from props type (export function pattern)
- `apps/frontend/src/lib/dynamic-components/feedback/popup/FeedbackPopup.svelte` - bind:this for Feedback ref
- `apps/frontend/src/lib/dynamic-components/feedback/modal/FeedbackModal.svelte` - bind:this for Feedback ref
- `apps/frontend/src/lib/dynamic-components/navigation/Navigation.svelte` - Runes mode, dispatcher preserved

## Decisions Made
- **EntityCard $derived.by() with cast**: The `unwrapEntity()` return type uses generic `Match` type which doesn't narrow to `QuestionCategory`. Used explicit `as EntityVariantMatch` cast to maintain type compatibility with SubMatches component.
- **NavGroup type correction**: `NavGroupProps` incorrectly extended `SvelteHTMLElements['ul']` but the component renders a `<section>`. Fixed to `SvelteHTMLElements['section']` since migration surfaced this pre-existing mismatch.
- **Feedback bind:this pattern**: Since export function can't be bound with `bind:functionName` in runes mode consumers, updated FeedbackPopup and FeedbackModal to use `bind:this={feedbackRef}` with `feedbackRef?.reset()` access pattern.
- **SurveyButton union type**: The `Partial<ButtonProps>` type creates a complex union when spread on Button. Same pre-existing limitation as LogoutButton. Accepted.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed NavGroup type mismatch (ul vs section)**
- **Found during:** Task 1 (NavGroup migration)
- **Issue:** NavGroupProps extended SvelteHTMLElements['ul'] but component renders <section>, causing type error when restProps is properly typed
- **Fix:** Changed NavGroup.type.ts to extend SvelteHTMLElements['section']
- **Files modified:** apps/frontend/src/lib/dynamic-components/navigation/NavGroup.type.ts
- **Verification:** Typecheck passes, no type errors for NavGroup
- **Committed in:** 1bbc00ae0 (Task 1 commit)

**2. [Rule 3 - Blocking] Updated Feedback consumers for bind:this pattern**
- **Found during:** Task 2 (Feedback migration)
- **Issue:** FeedbackPopup and FeedbackModal used bind:reset/bind:submit which doesn't work with runes-mode export function
- **Fix:** Updated consumers to use bind:this={feedbackRef} with feedbackRef?.method() access. Removed submit/reset from FeedbackProps type.
- **Files modified:** FeedbackPopup.svelte, FeedbackModal.svelte, Feedback.type.ts
- **Verification:** Typecheck passes for both consumers
- **Committed in:** 390257e25 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug fix, 1 blocking)
**Impact on plan:** Both fixes necessary for type correctness. NavGroup type was a pre-existing bug exposed by migration. Feedback consumer updates are minimal and follow established bind:this pattern.

## Issues Encountered
- **Linter auto-migration interference**: The svelte-check command triggered linter auto-save that migrated many non-target files to runes mode. Required careful git checkout restoration after each typecheck run.
- **SurveyButton union type complexity**: Spreading Partial<ButtonProps> restProps onto Button produces "union type too complex" error. Same pre-existing pattern as LogoutButton (documented in STATE.md). Not fixable without ButtonProps type redesign.
- **DataConsentPopup dispatcher type regression**: DataConsent in runes mode causes type inference issue for consumer on:change event. Pre-existing createEventDispatcher limitation in runes mode -- will be resolved when events are converted to callback props in Phase 23.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 12 high-attention dynamic components are in runes mode
- createEventDispatcher boundary preserved in 4 components for Phase 23 COMP-04 conversion
- NavItem event forwarding pattern established for any remaining consumers
- Plan 06 (verification gate) can proceed with E2E testing

---
*Phase: 22-leaf-component-migration*
*Completed: 2026-03-18*
