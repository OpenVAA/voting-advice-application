---
phase: 23-container-components-and-layouts
plan: 01
subsystem: ui
tags: [svelte5, createEventDispatcher, callback-props, snippets, children, slot-migration]

# Dependency graph
requires:
  - phase: 22-leaf-component-migration
    provides: Runes-mode leaf components with $props() and restProps patterns
provides:
  - createEventDispatcher removed from all 5 dispatching components
  - Callback props pattern for custom events (onExpand, onCollapse, onKeyboardFocusOut, etc.)
  - children snippet rendering in 13 default-slot-only components
  - CandidateNav/AdminNav event forwarding bug fix
  - DataConsent onChange camelCase alignment
affects: [23-container-components-and-layouts, phase-24]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Callback props for custom component events: onExpand, onCollapse, onKeyboardFocusOut, onClick, onCancel, onSent, onError, onOpen, onClose"
    - "children snippet prop with Snippet type for default slot replacement"
    - "{@render children?.()} pattern for conditional default content rendering"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/components/expander/Expander.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/Navigation.svelte
    - apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte
    - apps/frontend/src/lib/dynamic-components/survey/SurveyButton.svelte
    - apps/frontend/src/lib/components/alert/Alert.svelte
    - apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte
    - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
    - apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte

key-decisions:
  - "Navigation onKeyboardFocusOut uses renamed alias (onKeyboardFocusOut: onKeyboardFocusOutCallback) to avoid name collision with use:onKeyboardFocusOut action import"
  - "Expander and Navigation default slots also converted to children snippet alongside the plan's 11 listed components (13 total)"
  - "Route layout consumers updated in Task 1 to use callback prop syntax (deviation from plan which deferred to Plan 03)"

patterns-established:
  - "Callback prop naming: camelCase on prefix (onExpand, onKeyboardFocusOut) for all custom component callbacks"
  - "Snippet prop pattern: import type { Snippet } from 'svelte' in type files, children?: Snippet, {@render children?.()}"

requirements-completed: [COMP-04, COMP-05]

# Metrics
duration: 6min
completed: 2026-03-19
---

# Phase 23 Plan 01: Dispatcher-to-callback and Default Slot-to-Snippet Summary

**Replaced createEventDispatcher with callback props in 5 dispatching components and converted 13 default-slot-only components from `<slot />` to `{@render children?.()}`**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-19T10:17:54Z
- **Completed:** 2026-03-19T10:24:48Z
- **Tasks:** 2
- **Files modified:** 51

## Accomplishments
- All 5 createEventDispatcher usages eliminated across Expander, Navigation, SurveyButton, Feedback, and Alert
- DataConsent.onchange renamed to onChange for camelCase convention alignment
- CandidateNav and AdminNav dead `slot="nav"` and `on:navFocusOut` replaced with proper `onKeyboardFocusOut` callback forwarding (latent bug fix)
- 13 default-slot-only components converted from `<slot />` to `{@render children?.()}` with Snippet type annotations
- All consumer call sites updated across voter, candidate, and admin apps
- svelte-check passes with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace createEventDispatcher with callback props** - `b7474a46e` (feat)
2. **Task 2: Convert default-slot-only components from slot to children snippet** - `2fe2b6e09` (feat)

## Files Created/Modified

### Dispatching components (Task 1)
- `apps/frontend/src/lib/components/expander/Expander.svelte` - Removed dispatcher, added onExpand/onCollapse callbacks
- `apps/frontend/src/lib/components/expander/Expander.type.ts` - Added callback prop types
- `apps/frontend/src/lib/dynamic-components/navigation/Navigation.svelte` - Removed dispatcher, added onKeyboardFocusOut callback
- `apps/frontend/src/lib/dynamic-components/navigation/Navigation.type.ts` - Added callback prop type
- `apps/frontend/src/lib/dynamic-components/survey/SurveyButton.svelte` - Removed dispatcher, added onClick callback
- `apps/frontend/src/lib/dynamic-components/survey/SurveyButton.type.ts` - Added callback prop type
- `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte` - Removed dispatcher, added onCancel/onError/onSent callbacks
- `apps/frontend/src/lib/dynamic-components/feedback/Feedback.type.ts` - Added callback prop types
- `apps/frontend/src/lib/components/alert/Alert.svelte` - Removed dispatcher, added onOpen callback (onClose already existed)
- `apps/frontend/src/lib/components/alert/Alert.type.ts` - Added onOpen type
- `apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.svelte` - Renamed onchange to onChange
- `apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.type.ts` - Renamed onchange to onChange

### Consumer updates (Task 1)
- `apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte` - Callback prop pass-through
- `apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte` - Fixed dead slot="nav"/on:navFocusOut
- `apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte` - Fixed dead slot="nav"/on:navFocusOut
- `apps/frontend/src/lib/components/questions/QuestionBasicInfo.svelte` - on:expand/on:collapse to onExpand/onCollapse
- `apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte` - on:expand/on:collapse to onExpand/onCollapse
- `apps/frontend/src/lib/dynamic-components/feedback/modal/FeedbackModal.svelte` - on:cancel/on:sent to onCancel/onSent
- `apps/frontend/src/lib/dynamic-components/feedback/popup/FeedbackPopup.svelte` - on:sent to onSent
- `apps/frontend/src/lib/dynamic-components/survey/popup/SurveyPopup.svelte` - on:click to onClick
- `apps/frontend/src/lib/dynamic-components/dataConsent/popup/DataConsentPopup.svelte` - onchange to onChange
- `apps/frontend/src/routes/(voters)/+layout.svelte` - on:keyboardFocusOut to onKeyboardFocusOut
- `apps/frontend/src/routes/admin/+layout.svelte` - on:keyboardFocusOut to onKeyboardFocusOut
- `apps/frontend/src/routes/candidate/+layout.svelte` - on:keyboardFocusOut to onKeyboardFocusOut

### Default slot components (Task 2)
- `apps/frontend/src/lib/components/headingGroup/HeadingGroup.svelte` + `.type.ts`
- `apps/frontend/src/lib/components/headingGroup/PreHeading.svelte` + `.type.ts`
- `apps/frontend/src/lib/components/warning/Warning.svelte` + `.type.ts`
- `apps/frontend/src/lib/components/input/InputGroup.svelte` + `.type.ts`
- `apps/frontend/src/lib/components/buttonWithConfirmation/ButtonWithConfirmation.svelte` + `.type.ts`
- `apps/frontend/src/lib/components/term/Term.svelte` + `.type.ts`
- `apps/frontend/src/lib/dynamic-components/navigation/NavGroup.svelte` + `.type.ts`
- `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte` + `.type.ts`
- `apps/frontend/src/lib/dynamic-components/entityDetails/InfoItem.svelte` + `.type.ts`
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` + `.type.ts`
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte` + `.type.ts`

## Decisions Made
- Navigation's `onKeyboardFocusOut` prop uses renamed destructuring alias (`onKeyboardFocusOut: onKeyboardFocusOutCallback`) to avoid collision with the `use:onKeyboardFocusOut` action import of the same name
- Expander and Navigation default slots also converted to children snippet alongside the plan's 11 listed components (13 total converted)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated route layout consumers to use callback prop syntax**
- **Found during:** Task 1 (svelte-check verification)
- **Issue:** Route layouts (voters/+layout.svelte, candidate/+layout.svelte, admin/+layout.svelte) used `on:keyboardFocusOut` which no longer works after removing createEventDispatcher from Navigation
- **Fix:** Changed `on:keyboardFocusOut={() => navigation.close?.()}` to `onKeyboardFocusOut={() => navigation.close?.()}` in all 3 route layouts
- **Files modified:** `apps/frontend/src/routes/(voters)/+layout.svelte`, `apps/frontend/src/routes/admin/+layout.svelte`, `apps/frontend/src/routes/candidate/+layout.svelte`
- **Verification:** svelte-check passes with zero errors
- **Committed in:** b7474a46e (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed missed on:collapse/on:expand in QuestionExtendedInfo arguments section**
- **Found during:** Task 2 (svelte-check verification)
- **Issue:** The arguments section Expander in QuestionExtendedInfo still used `on:collapse`/`on:expand` (missed by initial replace_all due to different whitespace context)
- **Fix:** Changed to `onCollapse`/`onExpand` callback props
- **Files modified:** `apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte`
- **Verification:** svelte-check passes with zero errors
- **Committed in:** 2fe2b6e09 (Task 2 commit)

**3. [Rule 2 - Missing Critical] Also migrated Expander and Navigation default slots to children snippet**
- **Found during:** Task 2 (verifying slot removal completeness)
- **Issue:** Expander and Navigation components had `<slot />` for default content alongside the dispatcher changes from Task 1
- **Fix:** Added children Snippet prop and replaced `<slot />` with `{@render children?.()}` in both components
- **Files modified:** Expander.svelte, Expander.type.ts, Navigation.svelte, Navigation.type.ts
- **Verification:** svelte-check passes with zero errors
- **Committed in:** 2fe2b6e09 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 missing critical)
**Impact on plan:** All auto-fixes were necessary for correctness. Route layout updates were required because removing the dispatcher broke the event forwarding chain. The additional slot migrations were natural extensions of the Task 2 scope.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All createEventDispatcher usages eliminated from components and dynamic-components
- Default slot migration pattern established; ready for named slot migration in Plan 02
- CandidateNav/AdminNav event forwarding bug fixed; keyboard navigation works correctly
- svelte-check passes with zero errors

## Self-Check: PASSED

- All key files verified present
- Both task commits verified (b7474a46e, 2fe2b6e09)
- svelte-check: 0 errors

---
*Phase: 23-container-components-and-layouts*
*Completed: 2026-03-19*
