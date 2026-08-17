---
phase: 22-leaf-component-migration
plan: 03
subsystem: ui
tags: [svelte5, runes, props, derived, effect, state, bindable, event-modifiers, video]

# Dependency graph
requires:
  - phase: 22-02
    provides: "Button/Icon/Select/Toggle/other shared leaf components in runes mode with call-site updates"
provides:
  - "9 question sub-components in runes mode with $props() and zero legacy globals"
  - "3 controller sub-components in runes mode with $derived() reactive statements"
  - "Video.svelte fully migrated: event modifiers replaced, $bindable() on all bound/mutated props, 17+ reactive statements converted"
  - "All shared leaf components in src/lib/components/ now in runes mode"
affects: [22-04, 22-05, 22-06, 23-container-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "onclickcapture for |capture modifier replacement"
    - "Idempotent functions eliminate need for |once wrapper"
    - "Combined dual on:click handlers into single onclick callback"
    - "$bindable() on all props internally mutated by load()-style functions"

key-files:
  created: []
  modified:
    - "apps/frontend/src/lib/components/video/Video.svelte"
    - "apps/frontend/src/lib/components/video/Video.type.ts"
    - "apps/frontend/src/lib/components/questions/QuestionChoices.svelte"
    - "apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte"
    - "apps/frontend/src/lib/components/questions/QuestionActions.svelte"
    - "apps/frontend/src/lib/components/questions/QuestionArguments.svelte"
    - "apps/frontend/src/lib/components/questions/QuestionBasicInfo.svelte"
    - "apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte"
    - "apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte"
    - "apps/frontend/src/lib/components/questions/QuestionExtendedInfoDrawer.svelte"
    - "apps/frontend/src/lib/components/questions/QuestionOpenAnswer.svelte"
    - "apps/frontend/src/lib/components/controller/InfoMessages.svelte"
    - "apps/frontend/src/lib/components/controller/ProgressBar.svelte"
    - "apps/frontend/src/lib/components/controller/WarningMessages.svelte"

key-decisions:
  - "tryUnmute is idempotent -- no once() wrapper needed, simplifies |once replacement"
  - "Video props mutated in load() use $bindable() rather than separate $state copies for minimal refactoring"
  - "Removed readonly from BindableVideoProps type to support $bindable() mutation"
  - "on:collapse/on:expand on Expander kept as-is (Expander uses createEventDispatcher, not callback props yet)"

patterns-established:
  - "$bindable() on all props that are internally reassigned (e.g., in load/reset functions)"
  - "onclickcapture={handler} for |capture modifier replacement"
  - "Combined multi-handler buttons: onclick={() => { tryUnmute(); action(); }}"

requirements-completed: [COMP-01, COMP-02, COMP-06, COMP-09]

# Metrics
duration: 12min
completed: 2026-03-18
---

# Phase 22 Plan 03: Question/Controller/Video Component Migration Summary

**13 components migrated to runes mode including Video.svelte (884 lines) with event modifier replacement, $bindable() props, and 17+ reactive statement conversions**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-18T21:29:10Z
- **Completed:** 2026-03-18T21:41:34Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- All 9 question sub-components use $props() with zero legacy globals
- All 3 controller sub-components use $props() with $derived() reactivity
- Video.svelte fully migrated: event modifiers replaced with inline JS (COMP-09), $bindable() on all bound/mutated props (COMP-06), accessors removed, all 17+ reactive statements converted
- Frontend typecheck passes with no new errors (42 pre-existing, unchanged from Plan 02)

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate 12 question and controller sub-components** - `3c7d81953` (feat)
2. **Task 2: Migrate Video.svelte with event modifiers and $bindable** - `7e769220e` (feat)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified
- `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` - Largest question component, $derived for layout variants, $effect for selected state
- `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` - Standard props conversion, removed reactive $: mode default
- `apps/frontend/src/lib/components/questions/QuestionActions.svelte` - Converted on:click on Button to onclick
- `apps/frontend/src/lib/components/questions/QuestionArguments.svelte` - Simple leaf, restProps
- `apps/frontend/src/lib/components/questions/QuestionBasicInfo.svelte` - Keeps on:collapse/expand on Expander (dispatcher)
- `apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte` - Keeps on:collapse/expand on Expander
- `apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte` - $state for showDrawer, onclick on Button
- `apps/frontend/src/lib/components/questions/QuestionExtendedInfoDrawer.svelte` - Fixed incorrect prop passing to QuestionExtendedInfo
- `apps/frontend/src/lib/components/questions/QuestionOpenAnswer.svelte` - $state for collapsible/expanded/fullHeight
- `apps/frontend/src/lib/components/controller/InfoMessages.svelte` - $derived for displayMessages
- `apps/frontend/src/lib/components/controller/ProgressBar.svelte` - $derived for normalized values, const for static maps
- `apps/frontend/src/lib/components/controller/WarningMessages.svelte` - $derived for allMessages
- `apps/frontend/src/lib/components/video/Video.svelte` - Full migration: runes, $bindable, event modifiers, $state/$derived/$effect
- `apps/frontend/src/lib/components/video/Video.type.ts` - Removed readonly from BindableVideoProps

## Decisions Made
- **tryUnmute is idempotent**: The function checks `!muted` before acting, making `|once` modifiers unnecessary. This simplifies the migration by avoiding once() wrapper functions.
- **$bindable() for load() mutation**: Video's load() function reassigns 13 content/optional props. Using $bindable() on all of them is the least invasive approach vs. creating separate $state copies.
- **Removed readonly from BindableVideoProps**: The readonly TypeScript markers conflict with $bindable() props that are internally mutated. Removing readonly aligns the type with the actual component behavior.
- **Kept on:collapse/on:expand on Expander consumers**: Expander.svelte uses createEventDispatcher (Phase 23 scope for dispatch migration). Consumer components must continue using on: syntax for dispatched events.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed QuestionExtendedInfoDrawer passing unknown props to QuestionExtendedInfo**
- **Found during:** Task 1 (QuestionExtendedInfoDrawer migration)
- **Issue:** Drawer was passing `info` and `infoSections` as props to QuestionExtendedInfo, but QuestionExtendedInfo's type only accepts `question` (it extracts info internally). Previously masked by $$restProps flowing through as unknown HTML attributes.
- **Fix:** Changed to pass `question` prop instead, letting QuestionExtendedInfo extract info/infoSections internally as designed. Removed unused getCustomData import.
- **Files modified:** apps/frontend/src/lib/components/questions/QuestionExtendedInfoDrawer.svelte
- **Verification:** Typecheck passes with one fewer error than before migration
- **Committed in:** 3c7d81953 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed buildTranscript() return type safety in Video.svelte**
- **Found during:** Task 2 (Video.svelte migration)
- **Issue:** `buildTranscript()` returns `string | undefined` but was assigned to `transcript` prop typed as `string`. Exposed by stricter runes mode type checking.
- **Fix:** Added `?? ''` fallback on buildTranscript() calls and typed transcript as `$bindable<string | undefined>('')`
- **Files modified:** apps/frontend/src/lib/components/video/Video.svelte
- **Verification:** TypeScript error resolved, typecheck passes
- **Committed in:** 7e769220e (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs exposed by stricter type checking)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- QuestionExtendedInfoButton has a pre-existing "union type too complex to represent" error from Partial<ButtonProps> spread. This is documented in STATE.md and not caused by our migration.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All shared leaf components in src/lib/components/ are now in runes mode
- Ready for Plan 04 (dynamic-components migration) and Plan 05 (candidate/admin components)
- Expander.svelte's createEventDispatcher remains for Phase 23 container migration

## Self-Check: PASSED

- All 14 modified files exist on disk
- Both task commits verified (3c7d81953, 7e769220e)

---
*Phase: 22-leaf-component-migration*
*Completed: 2026-03-18*
