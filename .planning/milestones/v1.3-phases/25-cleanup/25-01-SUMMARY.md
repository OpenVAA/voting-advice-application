---
phase: 25-cleanup
plan: 01
subsystem: ui
tags: [svelte-5, todo-cleanup, migration-hygiene, runes]

# Dependency graph
requires:
  - phase: 22-runes-components
    provides: shared component runes migration
  - phase: 23-snippets-consumers
    provides: snippet/slot migration in consumers
  - phase: 24-voter-routes
    provides: voter route runes migration
provides:
  - Zero TODO[Svelte 5] markers in v1.3-scoped files (shared components, dynamic-components, i18n tests)
  - Verified candidate app compatibility with all shared component API changes
affects: [v1.4-candidate-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TODO[Svelte 5] resolved via keep-wrapper pattern for type guard and update functions"
    - "Redundant vi.mock removed when vitest.config.ts global alias suffices"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/components/entityFilters/EntityFilters.svelte
    - apps/frontend/src/lib/components/video/Video.svelte
    - apps/frontend/src/lib/components/input/Input.svelte
    - apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte
    - apps/frontend/src/lib/i18n/tests/utils.test.ts
    - apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte

key-decisions:
  - "Type guard wrapper in EntityFilters retained -- Svelte 5 templates still cannot use TypeScript generics inline"
  - "Video load() TODO downgraded to regular TODO -- init refactor is architectural improvement beyond cleanup scope"
  - "Input class constants retained -- snippet conversion requires major restructuring of 650-line component"
  - "ConstituencySelector update() wrapper retained -- $derived.by() changes reactivity semantics without benefit"
  - "vi.mock removed from utils.test.ts -- vitest.config.ts global alias at line 26 already resolves $env/dynamic/public"
  - "EntityCardAction kept as component -- snippet conversion would lose scoped .hover-shaded styles"

patterns-established:
  - "Keep-wrapper pattern: retain Svelte 4 workarounds that remain necessary in Svelte 5 rather than force-converting"
  - "TODO marker triage: downgrade TODO[Svelte 5] to regular TODO when issue is deferred improvement, remove when no longer applicable"

requirements-completed: [CLEAN-01, CLEAN-02]

# Metrics
duration: 2min
completed: 2026-03-19
---

# Phase 25 Plan 01: TODO[Svelte 5] Marker Cleanup Summary

**Resolved all 6 v1.3-scoped TODO[Svelte 5] markers in shared components and i18n tests, verified candidate app compatibility with zero API breakage**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-19T17:43:16Z
- **Completed:** 2026-03-19T17:45:24Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Removed all 6 TODO[Svelte 5] markers from v1.3-scoped files while retaining necessary wrapper functions
- Eliminated redundant vi.mock in i18n tests (global vitest.config.ts alias already provides the mock)
- Verified candidate app compiles cleanly with all shared component API changes from Phases 22-24
- Full workspace build (13/13 tasks) and all 417 frontend unit tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Resolve all 6 TODO[Svelte 5] markers in v1.3 scope** - `ed4f88a3b` (fix)
2. **Task 2: Verify candidate app compatibility and full build** - no commit (verification-only, no file changes)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `apps/frontend/src/lib/components/entityFilters/EntityFilters.svelte` - Removed TODO comment, retained type guard wrapper
- `apps/frontend/src/lib/components/video/Video.svelte` - Downgraded TODO[Svelte 5] to regular TODO
- `apps/frontend/src/lib/components/input/Input.svelte` - Removed TODO comment, retained class constants
- `apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte` - Removed TODO comment, retained update() wrapper
- `apps/frontend/src/lib/i18n/tests/utils.test.ts` - Removed redundant vi.mock and associated comments
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte` - Removed TODO from JSDoc block

## Decisions Made
- Type guard wrapper in EntityFilters retained because Svelte 5 templates still cannot use TypeScript generics inline
- Video load() TODO downgraded to regular TODO because init-function refactoring is an architectural improvement beyond cleanup scope
- Input class constants retained because snippet conversion would require major restructuring of the 650-line component
- ConstituencySelector update() wrapper retained because $derived.by() would change reactivity semantics without clear benefit
- vi.mock removed from utils.test.ts because vitest.config.ts global alias at line 26 already resolves $env/dynamic/public for all tests
- EntityCardAction kept as component because snippet conversion would lose scoped .hover-shaded styles

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- v1.3 Svelte 5 Migration milestone is ready for final validation gate
- 6 deferred TODO[Svelte 5] markers remain in contexts/, admin/, and root +layout.svelte (v1.4 scope)
- Candidate app verified compatible with all shared component API changes; candidate runes migration deferred to CAND-01 (v1.4)

## Self-Check: PASSED

All 6 modified files exist on disk. Task 1 commit ed4f88a3b verified in git log. SUMMARY.md created successfully.

---
*Phase: 25-cleanup*
*Completed: 2026-03-19*
