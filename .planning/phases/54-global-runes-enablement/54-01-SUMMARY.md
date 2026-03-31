---
phase: 54-global-runes-enablement
plan: 01
subsystem: ui
tags: [svelte5, runes, compiler-config, vite-plugin-svelte, dynamicCompileOptions]

# Dependency graph
requires:
  - phase: 53-legacy-file-migration
    provides: All 167 .svelte files migrated to runes-compatible syntax
provides:
  - Global runes mode enabled via svelte.config.js (compilerOptions + dynamicCompileOptions)
  - All per-file runes directives removed from 167 .svelte files
  - Third-party Svelte libraries excluded from runes enforcement via node_modules check
affects: [55-e2e-verification]

# Tech tracking
tech-stack:
  added: []
  patterns: [dynamicCompileOptions with node_modules exclusion for mixed runes/legacy codebase]

key-files:
  created: []
  modified:
    - apps/frontend/svelte.config.js
    - 167 .svelte files in apps/frontend/src/ (directive removal)

key-decisions:
  - "Both compilerOptions.runes and vitePlugin.dynamicCompileOptions used: compilerOptions for svelte-check/IDE, dynamicCompileOptions for Vite build with node_modules exclusion"
  - "Pre-existing a11y directive naming warnings (a11y-foo-bar vs a11y_foo_bar) left as-is -- out of scope for this plan"

patterns-established:
  - "dynamicCompileOptions pattern: return {runes:true} for non-node_modules files, void for node_modules"

requirements-completed: [R6.1, R6.2, R6.3, R6.4]

# Metrics
duration: 3min
completed: 2026-03-28
---

# Phase 54 Plan 01: Enable Runes Mode Globally Summary

**Global runes enabled via svelte.config.js with dynamicCompileOptions node_modules exclusion; 167 per-file directives removed; build green with 613 unit tests passing**

## Performance

- **Duration:** 3 min 31s
- **Started:** 2026-03-28T14:19:23Z
- **Completed:** 2026-03-28T14:22:54Z
- **Tasks:** 2
- **Files modified:** 168 (1 config + 167 .svelte files)

## Accomplishments
- Enabled global runes mode in svelte.config.js with both `compilerOptions.runes: true` (for svelte-check/IDE) and `vitePlugin.dynamicCompileOptions` (for Vite build with node_modules exclusion)
- Removed all 167 `<svelte:options runes />` per-file directives (16 more than the originally estimated 151, due to files migrated in later phases)
- Verified build succeeds, all 613 unit tests pass across 33 test files
- Third-party Svelte libraries (svelte-visibility-change) correctly excluded from runes enforcement

## Task Commits

Each task was committed atomically:

1. **Task 1: Enable global runes in svelte.config.js** - `90abf5aa2` (feat)
2. **Task 2: Remove all 167 per-file runes directives and verify clean build** - `6daeed458` (feat)

**Plan metadata:** (pending) (docs: complete plan)

## Files Created/Modified
- `apps/frontend/svelte.config.js` - Added compilerOptions.runes:true and vitePlugin.dynamicCompileOptions with node_modules exclusion
- 167 `.svelte` files in `apps/frontend/src/` - Removed `<svelte:options runes />` directives; Prettier reformatted where needed

## Decisions Made
- Used both `compilerOptions.runes: true` (for svelte-check/IDE which cannot read dynamicCompileOptions) and `vitePlugin.dynamicCompileOptions` (for Vite build to exclude node_modules from runes enforcement)
- Kept pre-existing a11y directive naming warnings (hyphenated vs underscored) as out of scope -- these are cosmetic warnings about Svelte 5's new naming convention for `svelte-ignore` directives
- Kept pre-existing `<svelte:component>` deprecation warning in PopupRenderer.svelte as out of scope

## Deviations from Plan

### Scope Adjustments

**1. File count: 167 instead of 151**
- **Cause:** Additional files were migrated to runes during Phases 50-53, each adding `<svelte:options runes />` directives
- **Impact:** No impact -- bulk sed removal handled all files regardless of count

**2. Pre-existing build warnings not fixed**
- **Warnings found:** 18 `a11y-*` legacy naming warnings (use underscores not hyphens) and 1 `<svelte:component>` deprecation in PopupRenderer.svelte
- **Decision:** Out of scope per deviation rules (pre-existing issues not caused by this plan's changes)
- **Logged to:** deferred-items.md

---

**Total deviations:** 0 auto-fixed (2 scope adjustments documented)
**Impact on plan:** Plan executed as designed. File count difference is cosmetic. Pre-existing warnings are documented for future cleanup.

## Issues Encountered
- `yarn format` required `yarn install` first in the worktree (node_modules state file missing) -- resolved by running install, then format completed successfully

## Deferred Items
- 18 `a11y-*` directive naming warnings across 5 files (use underscores instead of hyphens in svelte-ignore comments): Layout.svelte, QuestionChoices.svelte, Button.svelte, Input.svelte, Select.svelte
- 1 `<svelte:component>` deprecation warning in PopupRenderer.svelte (components are dynamic by default in runes mode)

## Known Stubs
None -- no stubs introduced by this plan.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Global runes mode is fully operational
- Build is green, all unit tests pass
- Ready for Phase 55 (E2E verification) to validate end-to-end behavior under global runes
- Pre-existing a11y naming and svelte:component warnings should be addressed in a future cleanup phase

## Self-Check: PASSED

- [x] apps/frontend/svelte.config.js exists with dynamicCompileOptions (1 match) and runes: true (2 matches)
- [x] Zero `<svelte:options runes` directives remain in apps/frontend/src/
- [x] Task 1 commit 90abf5aa2 exists
- [x] Task 2 commit 6daeed458 exists
- [x] 54-01-SUMMARY.md exists

---
*Phase: 54-global-runes-enablement*
*Completed: 2026-03-28*
