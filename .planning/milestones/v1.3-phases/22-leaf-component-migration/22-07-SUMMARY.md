---
phase: 22-leaf-component-migration
plan: 07
subsystem: ui
tags: [svelte5, runes, bind-this, component-exports, typecheck]

# Dependency graph
requires:
  - phase: 22-leaf-component-migration (plans 01-06)
    provides: runes-mode components with export function declarations
provides:
  - bind:this consumer pattern for all export function components
  - WithPolling slot compatibility with Svelte 4 consumers
  - Select restProps type using HTMLAttributes<HTMLElement>
  - Zero Phase-22-introduced typecheck errors
affects: [phase-23-snippet-migration, phase-24-route-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "bind:this={ref} + ref.method() for accessing component export functions"
    - "HTMLAttributes<HTMLElement> for multi-element restProps spread components"

key-files:
  created: []
  modified:
    - apps/frontend/src/routes/candidate/login/+page.svelte
    - apps/frontend/src/routes/admin/login/+page.svelte
    - apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte
    - apps/frontend/src/lib/dynamic-components/feedback/popup/FeedbackPopup.svelte
    - apps/frontend/src/lib/dynamic-components/feedback/modal/FeedbackModal.svelte
    - apps/frontend/src/routes/+layout.svelte
    - apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte
    - apps/frontend/src/lib/components/select/Select.type.ts
    - apps/frontend/src/lib/candidate/components/passwordField/PasswordField.type.ts
    - apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.type.ts

key-decisions:
  - "bind:this pattern chosen over $bindable() callback props for export function consumers"
  - "Admin login unused focusPassword binding removed entirely instead of converting to bind:this"
  - "WithPolling keeps runes mode with <slot /> (deprecated but functional until Phase 23)"
  - "HTMLAttributes<HTMLElement> for Select base type following InfoAnswer.type.ts precedent"

patterns-established:
  - "bind:this={ref} + ref?.method(): standard pattern for accessing Svelte 5 component export functions from consumers"
  - "HTMLAttributes<HTMLElement>: use for components that spread restProps onto multiple element types"

requirements-completed: [COMP-01, COMP-02, COMP-03, COMP-06, COMP-07, COMP-08, COMP-09]

# Metrics
duration: 6min
completed: 2026-03-19
---

# Phase 22 Plan 07: Gap Closure Summary

**Converted 4 export function binding patterns to bind:this in 6 consumers, reverted WithPolling to slot, and fixed Select restProps type -- eliminating all Phase-22-introduced typecheck errors**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-19T07:17:54Z
- **Completed:** 2026-03-19T07:24:23Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Converted all bind:functionName patterns (bind:focus, bind:reset, bind:submit, bind:openFeedback) to bind:this pattern across 6 consumer files
- Removed unused focusPassword binding from admin login page
- Reverted WithPolling.svelte from {@render children()} back to <slot /> for Svelte 4 consumer compatibility
- Fixed Select.type.ts restProps type from SvelteHTMLElements['select'] to HTMLAttributes<HTMLElement>
- Cleaned up PasswordField.type.ts and PasswordSetter.type.ts (removed focus/reset from props types)
- Reduced typecheck errors from 47 to 46 (eliminated 1 Select error; remaining are pre-existing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix export function binding pattern in all consumers** - `6bd0ace5c` (fix)
2. **Task 2: Revert WithPolling to slot and fix Select type** - `823110a73` (fix)
3. **Task 3: Verify typecheck passes for Phase 22 scope** - `f66a4ef1a` (fix -- improved Select type to HTMLAttributes<HTMLElement>)

## Files Created/Modified
- `apps/frontend/src/routes/candidate/login/+page.svelte` - bind:this={passwordFieldRef} for PasswordField.focus()
- `apps/frontend/src/routes/admin/login/+page.svelte` - removed unused bind:focus and focusPassword declaration
- `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte` - bind:this={passwordSetterRef} for PasswordSetter.reset()
- `apps/frontend/src/lib/dynamic-components/feedback/popup/FeedbackPopup.svelte` - bind:this={feedbackRef} for Feedback.reset()/submit()
- `apps/frontend/src/lib/dynamic-components/feedback/modal/FeedbackModal.svelte` - bind:this={feedbackRef} for Feedback.reset()
- `apps/frontend/src/routes/+layout.svelte` - bind:this={feedbackModalRef} with reactive $: store assignment for openFeedbackModal
- `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` - reverted to <slot /> from {@render children()}
- `apps/frontend/src/lib/components/select/Select.type.ts` - HTMLAttributes<HTMLElement> base type
- `apps/frontend/src/lib/candidate/components/passwordField/PasswordField.type.ts` - removed focus from props
- `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.type.ts` - removed reset from props

## Decisions Made
- **bind:this over $bindable() callback props**: Chosen because export function is the idiomatic Svelte 5 pattern for component methods, and bind:this is the correct consumer access pattern. This avoids complexity of duplicating functions as both exports and bindable props.
- **Remove unused binding entirely**: Admin login's focusPassword was declared but never called -- cleaner to remove than convert.
- **Keep runes mode on WithPolling**: <slot /> works in runes mode (just deprecated). Phase 23 will convert consumers to snippet-compatible pattern.
- **HTMLAttributes<HTMLElement> for Select**: Follows existing InfoAnswer.type.ts precedent. Avoids event handler type conflicts when restProps are spread onto div, input, and select elements.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Improved Select type from SvelteHTMLElements['div'] to HTMLAttributes<HTMLElement>**
- **Found during:** Task 3 (typecheck verification)
- **Issue:** Plan specified changing Select base type to SvelteHTMLElements['div'], but this caused event handler type conflicts when restProps were spread onto the <select> element (ClipboardEventHandler<HTMLDivElement> incompatible with HTMLSelectElement)
- **Fix:** Used HTMLAttributes<HTMLElement> instead, which is element-agnostic and compatible with all three spread targets
- **Files modified:** apps/frontend/src/lib/components/select/Select.type.ts
- **Verification:** yarn workspace @openvaa/frontend check shows zero Select.svelte errors
- **Committed in:** f66a4ef1a

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary correction to achieve zero Phase-22-introduced errors. No scope creep.

## Issues Encountered
- Pre-existing autocomplete type errors remain in PasswordField.svelte (line 63: string vs FullAutoFill) and PasswordSetter.svelte (line 36: 'new-password' vs "" | "on" | "off"). These are NOT Phase 22 introduced -- confirmed via git stash test showing identical errors before our changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 22 (leaf component migration) is complete with all verification gaps closed
- All 98 migrated components have <svelte:options runes />
- Zero Phase-22-introduced typecheck errors (46 remaining errors are all pre-existing)
- WithPolling uses <slot /> ready for Phase 23 snippet migration
- bind:this pattern established for Phase 24 route migration consumers

## Self-Check: PASSED

All 10 modified files verified present on disk. All 3 task commits (6bd0ace5c, 823110a73, f66a4ef1a) verified in git log.

---
*Phase: 22-leaf-component-migration*
*Completed: 2026-03-19*
