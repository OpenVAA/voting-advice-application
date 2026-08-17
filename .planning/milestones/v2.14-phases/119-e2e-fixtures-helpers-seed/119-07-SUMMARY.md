---
phase: 119-e2e-fixtures-helpers-seed
plan: 07
subsystem: testing
tags: [playwright, e2e-fixtures, umami, emulateMedia, entity-filters, dark-mode, nav-menu]

# Dependency graph
requires:
  - phase: 119-05
    provides: "entity-filter-select-all-toggle testid on EnumeratedEntityFilter.svelte + filterSelectAllToggle registry key"
  - phase: 119-06
    provides: "resultsPage.expectOrgMatchScore + aboutPage/questionInfo views.ts registrations (shared-file additive base)"
provides:
  - "entityFilters.fixture.ts selectAll()/selectNone()/isAllSelected()/getSelectAllToggle() on the per-filter object (EFLOW-01)"
  - "resultsPage.fixture.ts expectSubMatch(category, score?) per-category subMatch gauge reader (EFLOW-04)"
  - "trackingIntercept.fixture.ts — async createTrackingIntercept stubbing window.umami.track via addInitScript, getTrackCalls()/clear() (EFLOW-08)"
  - "theme.fixture.ts — createThemeReader setColorScheme(emulateMedia)/expectTheme reading prefers-color-scheme (EFLOW-07, corrected: no toggle/web-storage)"
  - "navMenu.fixture.ts — createNavMenu expectNavMenuItems + openMobileNav reusing existing nav testids (EFLOW-09/11)"
affects: [121-eflow-specs, 119-08-probes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "window.umami.track addInitScript capture seam for analytics-emission assertions (no network, no secret)"
    - "page.emulateMedia({ colorScheme }) + matchMedia read-back as the dark-mode signal (no toggle, no web-storage)"
    - "single flip-toggle select-all/none driven by reading current all-selected state before clicking"

key-files:
  created:
    - tests/tests/fixtures/shared/trackingIntercept.fixture.ts
    - tests/tests/fixtures/shared/theme.fixture.ts
    - tests/tests/fixtures/shared/navMenu.fixture.ts
  modified:
    - tests/tests/fixtures/voter/entityFilters.fixture.ts
    - tests/tests/fixtures/voter/resultsPage.fixture.ts

key-decisions:
  - "EFLOW-07 corrected to page.emulateMedia + matchMedia read-back (no dark-mode toggle / web-storage exists in the app)"
  - "theme reader reads the prefers-color-scheme media match (the SAME query darkMode.svelte.ts reads) via page.evaluate — no raw element locator, keeping no-restricted-locators clean"
  - "the three new shared readers are standalone direct-import factories (like feedbackDialog/langSelector) — NO views.ts registration"
  - "expectSubMatch's score arg accepted for call-site symmetry; the gauge value comparison is owned by the spec against the returned Locator"

patterns-established:
  - "trackingIntercept: addInitScript stub of window.umami.track into window.__trackCalls + getTrackCalls() reader"
  - "themeReader: emulateMedia control + matchMedia read-back assertion"

requirements-completed: []

# Metrics
duration: 18min
completed: 2026-06-15
---

# Phase 119 Plan 07: EFLOW Fixtures & Helpers Summary

**EFLOW-side Playwright substrate — entityFilters select-all/none + resultsPage subMatch reader, plus three new shared fixtures (window.umami.track intercept, emulateMedia dark-mode reader, nav-menu reader) — all green on typecheck:tests and the no-restricted-locators guard.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-06-15
- **Completed:** 2026-06-15
- **Tasks:** 2
- **Files modified:** 5 (3 created, 2 extended)

## Accomplishments
- `entityFilters` gains `selectAll()`/`selectNone()` (+ `isAllSelected()`/`getSelectAllToggle()`) clicking the single `> 3`-options flip-toggle based on current state, copying the settle-before-count invariant (EFLOW-01).
- `resultsPage` gains `expectSubMatch(category, score?)` reading a per-category subMatch gauge inside `sub-matches`, reusing the `sub-matches`/`score-gauge` testids (EFLOW-04).
- NEW `trackingIntercept.fixture.ts` — async `createTrackingIntercept(page)` stubs `window.umami.track` via `addInitScript` into `window.__trackCalls`, exposes `getTrackCalls()`/`clear()`, and documents the arming prerequisite (umami platform + trackEvents + granted consent); no network to cloud.umami.is, no secret (EFLOW-08).
- NEW `theme.fixture.ts` — `createThemeReader(page)` with `setColorScheme` (`page.emulateMedia`) + `expectTheme` reading the `prefers-color-scheme` media match; NO toggle, NO web-storage (EFLOW-07, mechanism corrected).
- NEW `navMenu.fixture.ts` — `createNavMenu(page)` with `expectNavMenuItems` + `openMobileNav`, reusing the existing `nav-menu`/`nav-menu-item`/`nav-menu-toggle` testids (no new id; EFLOW-09/11).

## Task Commits

1. **Task 1: entityFilters selectAll/selectNone + resultsPage expectSubMatch** — `cc4ddf237` (feat)
2. **Task 2: trackingIntercept + theme(emulateMedia) + navMenu shared fixtures** — `22c534a7d` (feat)

## Files Created/Modified
- `tests/tests/fixtures/voter/entityFilters.fixture.ts` — added `getSelectAllToggle()`, `isAllSelected()`, `selectAll()`, `selectNone()` to the per-filter object (clicks the single flip-toggle by reading current state; settle-before-count invariant).
- `tests/tests/fixtures/voter/resultsPage.fixture.ts` — added `expectSubMatch(category, score?)` (subMatch gauge reader, reuses `sub-matches`/`score-gauge`).
- `tests/tests/fixtures/shared/trackingIntercept.fixture.ts` (NEW) — `window.umami.track` capture fixture (`getTrackCalls`).
- `tests/tests/fixtures/shared/theme.fixture.ts` (NEW) — emulateMedia dark-mode reader.
- `tests/tests/fixtures/shared/navMenu.fixture.ts` (NEW) — nav-menu items + mobile-open reader.

## Decisions Made
- **EFLOW-07 dark-mode mechanism corrected (confirmed against `darkMode.svelte.ts`):** the app has NO dark-mode toggle and NO client-side theme persistence — `darkMode.current` derives solely from `window.matchMedia('(prefers-color-scheme: dark)')`. The reader uses `page.emulateMedia` to control and reads that same media match back via `page.evaluate` to assert. "Persisted across reload" is automatic.
- **No raw element locator for the theme signal:** the app applies no `dark` class to `<html>` (the dark theme drives logo/image `src` + header style via the `darkMode` rune, not a root class), so a `page.locator('html')` class assertion would have been both forbidden by the locator guard AND unsound. Reading the `prefers-color-scheme` match via `page.evaluate` is the faithful, guard-clean signal.
- **Shared readers are standalone factories** (mirroring `feedbackDialog`/`langSelector`) — none is destructured off the voter `test`, so `views.ts` was intentionally left unchanged (honoring the 119-06 shared-file additive note: 119-06's `expectOrgMatchScore` + `aboutPage`/`questionInfo` registrations were preserved untouched).
- **No testIds.ts modification** — every id needed (`filterSelectAllToggle`, `subMatches`, `scoreGauge`, `navigation.menu/menuItem/menuToggle`) already exists (Plan 05 owns `filterSelectAllToggle`); read-only per the shared-file ownership note.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unnecessary `await` on a synchronous expect**
- **Found during:** Task 2 (lint gate)
- **Issue:** `await expect(await this.isAllSelected()).toBe(true)` in `selectAll()` triggered `playwright/no-useless-await` — `expect(value).toBe()` on a non-locator value is synchronous, so the outer `await` is useless.
- **Fix:** dropped the outer `await` (kept the inner `await this.isAllSelected()`).
- **Files modified:** `tests/tests/fixtures/voter/entityFilters.fixture.ts`
- **Verification:** `yarn eslint` on the five fixture files exits 0; `yarn typecheck:tests` exits 0.
- **Committed in:** `22c534a7d` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 lint bug).
**Impact on plan:** trivial; no scope change. The five Plan-07 fixture files lint clean and typecheck clean.

## Flags (scope corrections for downstream phases)

- **EFLOW-07 spec scope (Phase 121) MUST be corrected:** drop any dark-mode toggle-click and client-storage-persistence assertions. The app has no toggle and no theme persistence; drive the theme via `themeReader.setColorScheme(...)` (emulateMedia) and assert via `themeReader.expectTheme(...)` (prefers-color-scheme read-back). "Persisted across reload" is automatic and needs no separate assertion. This flag is also recorded in the `theme.fixture.ts` file header.
- **trackingIntercept arming prerequisite (Phase 121 / Plan-08 probes):** the consuming spec/probe MUST seed `analytics.platform='umami'` + `analytics.trackEvents=true` AND grant consent in userPreferences for events to emit; the consent-ungranted state is the suppression (no-emit) assertion. Documented in the `trackingIntercept.fixture.ts` header.

## Issues Encountered

- **Pre-existing `simple-import-sort` lint error in `packages/dev-seed/src/templates/index.ts`** (introduced by Plan 119-04, commit `b723973c5`) makes the monorepo-wide `yarn lint:check` exit 1 on `@openvaa/dev-seed#lint`. This file is OUT OF SCOPE for Plan 07 (which touches only `tests/tests/fixtures/**`). Logged to `.planning/phases/119-e2e-fixtures-helpers-seed/deferred-items.md` (DEF-119-07-01) — trivial `yarn lint:fix` for the 119-04 owner. Plan 07's own five fixture files lint clean (exit 0), satisfying the A3/SC1 locator-guard intent for this plan's deliverables.

## User Setup Required
None - no external service configuration required (the tracking intercept stubs `window.umami`, no real Umami key / network).

## Next Phase Readiness
- EFLOW-01/04/07/08/09/11 helper substrate is ready for Phase 121 specs + the Plan-08 probes, with the dark-mode mechanism corrected and the tracking arm prerequisite documented.
- The pre-existing dev-seed import-sort lint error (DEF-119-07-01) should be cleared by the 119-04 owner / phase registry-cleanup pass so the phase-wide `lint:check` gate goes green.

## Self-Check: PASSED

- Files: all 5 present (entityFilters, resultsPage, trackingIntercept, theme, navMenu).
- Commits: `cc4ddf237` (Task 1) and `22c534a7d` (Task 2) both present in git log.
- `yarn typecheck:tests` exits 0; the five fixture files lint clean (exit 0); all plan grep-guards pass.

---
*Phase: 119-e2e-fixtures-helpers-seed*
*Completed: 2026-06-15*
