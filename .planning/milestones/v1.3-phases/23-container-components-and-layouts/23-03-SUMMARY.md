---
phase: 23-container-components-and-layouts
plan: 03
subsystem: ui
tags: [svelte5, runes, snippets, layout, bindable, slot-migration]

# Dependency graph
requires:
  - phase: 23-container-components-and-layouts
    plan: 01
    provides: createEventDispatcher removal, callback props, onKeyboardFocusOut in route layouts
  - phase: 23-container-components-and-layouts
    plan: 02
    provides: Named slot-to-snippet pattern, runes conversion pattern for container components
provides:
  - Layout.svelte fully in runes mode with $bindable isDrawerOpen, menu/children snippet props, native onclick
  - SingleCardContent.svelte fully in runes mode with note/children snippet props
  - All 3 route layout consumers using {#snippet menu()} syntax
  - Zero slot="menu" remaining in codebase
  - Event forwarding chain complete from Navigation through Nav wrappers to route layouts
affects: [23-container-components-and-layouts, phase-24]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "$bindable(false) for two-way bound boolean props (isDrawerOpen)"
    - "Menu snippet prop on Layout for named slot replacement in root layout"
    - "{#snippet menu()} syntax in route +layout.svelte consumers"

key-files:
  created: []
  modified:
    - apps/frontend/src/routes/Layout.svelte
    - apps/frontend/src/routes/Layout.type.ts
    - apps/frontend/src/routes/SingleCardContent.svelte
    - apps/frontend/src/routes/(voters)/+layout.svelte
    - apps/frontend/src/routes/candidate/+layout.svelte
    - apps/frontend/src/routes/admin/+layout.svelte
    - apps/frontend/src/routes/candidate/(protected)/preview/+page.svelte

key-decisions:
  - "Route +layout.svelte files keep their own <slot /> for SvelteKit child route rendering; only Layout's named menu slot converted"
  - "SingleCardContent type defined locally as Omit<MainContentProps, ...> & snippet props rather than updating MainContent.type.ts"

patterns-established:
  - "$bindable(false) default value for optional two-way bound props"
  - "Layout snippet menu pattern: {#snippet menu()} wrapping Nav component inside Layout consumer"

requirements-completed: [LAYOUT-01, COMP-05]

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 23 Plan 03: Layout and SingleCardContent Runes Migration Summary

**Layout.svelte and SingleCardContent.svelte migrated to full Svelte 5 runes with snippet props, $bindable isDrawerOpen, and all 5 consumer files updated**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-19T11:12:19Z
- **Completed:** 2026-03-19T11:15:50Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Layout.svelte fully converted to runes mode with $bindable(false) isDrawerOpen, menu/children snippet props, and native onclick on drawer overlay
- SingleCardContent.svelte fully converted to runes mode with note/children snippet props, replacing $$slots.note conditional and $$restProps
- All 3 root layout consumers (voters, candidate, admin) updated from slot="menu" attribute to {#snippet menu()} syntax
- Preview page consumer updated from svelte:fragment slot="note" to {#snippet note()} syntax
- svelte-check passes with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate Layout.svelte to runes with snippet props and update all 3 route layout consumers** - `3dc667069` (feat)
2. **Task 2: Migrate SingleCardContent.svelte to runes with snippet props and update 2 consumers** - `7ec184be8` (feat)

## Files Created/Modified
- `apps/frontend/src/routes/Layout.svelte` - Full runes conversion: $props(), $bindable(false), menu/children snippets, onclick
- `apps/frontend/src/routes/Layout.type.ts` - Added menu?: Snippet and children?: Snippet types
- `apps/frontend/src/routes/SingleCardContent.svelte` - Full runes conversion: $props(), note/children snippets, restProps
- `apps/frontend/src/routes/(voters)/+layout.svelte` - slot="menu" -> {#snippet menu()} wrapping VoterNav
- `apps/frontend/src/routes/candidate/+layout.svelte` - slot="menu" -> {#snippet menu()} wrapping CandidateNav
- `apps/frontend/src/routes/admin/+layout.svelte` - slot="menu" -> {#snippet menu()} wrapping AdminNav
- `apps/frontend/src/routes/candidate/(protected)/preview/+page.svelte` - svelte:fragment slot="note" -> {#snippet note()}

## Decisions Made
- Route +layout.svelte files keep their own `<slot />` for SvelteKit child route rendering untouched; only the Layout's named menu slot was converted to snippet syntax
- SingleCardContent defines its own type locally (`Omit<MainContentProps, 'titleClass' | 'primaryActionsLabel'> & { note?: Snippet; children?: Snippet }`) rather than modifying the shared MainContent.type.ts
- Entity detail page (results/[entityType]/[entityId]/+page.svelte) needed no changes as it only uses default content, not the note slot

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Layout.svelte and SingleCardContent.svelte fully migrated; ready for MainContent.svelte migration in Plan 04
- All slot="menu" eliminated from codebase
- Remaining slot="note" occurrences are MainContent consumers (Plan 04 scope)
- svelte-check passes with zero errors

## Self-Check: PASSED

- All 7 key files verified present
- Both task commits verified (3dc667069, 7ec184be8)
- svelte-check: 0 errors
- Zero slot="menu" in codebase

---
*Phase: 23-container-components-and-layouts*
*Completed: 2026-03-19*
