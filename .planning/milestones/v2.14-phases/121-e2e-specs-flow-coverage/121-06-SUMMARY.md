---
phase: 121-e2e-specs-flow-coverage
plan: 06
subsystem: testing
tags: [playwright, e2e, dark-mode, prefers-color-scheme, axe, a11y, wcag, emulateMedia]
requires:
  - phase: 121-05
    provides: "voter-dark-mode leaf project (testMatch /voter-dark-mode\\.spec\\.ts/, depends data-setup-base)"
  - phase: 119
    provides: "theme.fixture.ts (createThemeReader — verified emulateMedia mechanism)"
provides:
  - "EFLOW-07 voter-dark-mode.spec.ts: dark theme applied + persists across reload (emulateMedia), light restored"
  - "EFLOW-07 a11y-smoke dark-mode colour-contrast axe scan (WCAG 2.1 AA gated in both themes)"
affects:
  - "Phase 121 wave-3 merge / full-suite green"
  - "any future dark-theme token change (now contrast-gated by axe)"
tech-stack:
  added: []
  patterns:
    - "Theme driven via page.emulateMedia({colorScheme}) — NO toggle, NO localStorage (darkMode.svelte.ts reads matchMedia only)"
    - "Read-only leaf spec on data-setup-base (cold-entry-dataroot analog), HARD assertions only"
    - "Dark-variant axe scan paired in the existing unlocated-route loop, reusing assertAxeGates with a -dark label (no inline expect)"
key-files:
  created:
    - "tests/tests/specs/voter/voter-dark-mode.spec.ts"
  modified:
    - "tests/tests/specs/a11y/a11y-smoke.spec.ts"
key-decisions:
  - "Persistence asserted by re-reading the dark signal after page.reload() (emulated media survives reload) — no storage assertion, since none is possible"
  - "expect not imported in voter-dark-mode.spec.ts — all assertions live inside the theme fixture's expectTheme web-first poll (lint: no-unused-imports)"
  - "Dark axe scan covers the 3 unlocated routes (home/elections/constituencies) via the existing for-of loop; reuses assertAxeGates module-scope helper"
patterns-established:
  - "EFLOW-07 dark-mode = OS-media emulation, not a UI toggle (binding RESEARCH Pitfall 1 correction)"
  - "Paired light+dark axe scan per unlocated route, -dark label, zero-violation global gate"
requirements-completed: [EFLOW-07]
duration: ~18min
completed: 2026-06-16
---

# Phase 121 Plan 06: Dark-mode applied/persists + dark-contrast a11y gate (EFLOW-07) Summary

Added the missing EFLOW-07 coverage: a new read-only leaf spec proving the dark theme is applied via `prefers-color-scheme` emulation and survives a reload (then light is restored), plus a dark-scheme colour-contrast axe scan in `a11y-smoke` that gates WCAG 2.1 AA contrast in both light and dark themes. Dark mode is OS-media-driven only (no toggle, no localStorage), so the theme is controlled with `page.emulateMedia({colorScheme})` and the rendered signal is the `matchMedia('(prefers-color-scheme: dark)')` match the app itself reads.

## Performance

- **Duration:** ~18 min
- **Started:** 2026-06-16
- **Completed:** 2026-06-16
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- **`voter-dark-mode.spec.ts` (NEW leaf, EFLOW-07).** Mirrors `cold-entry-dataroot.spec.ts` leaf shape (read-only on `data-setup-base`, public voter routes, HARD assertions). Uses `createThemeReader(page)`: `setColorScheme('dark')` → `goto('/en')` → `expectTheme('dark')` → `page.reload()` → `expectTheme('dark')` (persists automatically — emulated media survives reload, no storage assertion), then `setColorScheme('light')` → reload → `expectTheme('light')`. No toggle-click, no `dark` root-class assertion, no localStorage assertion.
- **`a11y-smoke.spec.ts` dark-contrast extension (EFLOW-07).** Inside the existing unlocated-route `for…of` loop, added a paired `${route.name} (dark)` test that calls `page.emulateMedia({colorScheme:'dark'})`, navigates via `buildRoute(...)`, settles, runs `new AxeBuilder({page}).withTags(WCAG_TAGS).analyze()`, and asserts via the existing module-scope `assertAxeGates(results, testInfo, \`${route.name}-dark\`)`. Zero violations across home / elections-selector / constituencies-selector in dark. No inline `expect()` in the loop (reuses the helper → `playwright/no-standalone-expect` clean).

## Verification

- `voter-dark-mode` with deps: 3 passed (seeds + spec + teardown). 3× `--no-deps` reruns: 1 passed each (cardinal gate).
- `a11y-smoke` with deps: 13 passed (incl. 3 new `(dark)` scans). 3× `--no-deps` reruns (after re-seeding `e2e/base`): 11 passed each (cardinal gate).
- Lint clean on both files via the canonical tests config: `eslint --flag v10_config_lookup_from_file` → exit 0. (A bare `eslint` invocation without that flag spuriously reported "rule not found" for `playwright/no-restricted-locators` on a pre-existing line 256 inline-disable — not a real error; the flag registers the playwright plugin from `tests/eslint.config.mjs`.)
- No file deletions in either commit.

## Deviations from Plan

**1. [Rule 1 - Lint] Dropped the unused `expect` import in voter-dark-mode.spec.ts**
- **Found during:** Task 1 (`yarn lint:check` after first write)
- **Issue:** The plan's leaf analog imports `{ expect, test }`, but this spec asserts only through the fixture's `expectTheme` (a web-first `expect.poll` inside `theme.fixture.ts`), so `expect` was unused → `unused-imports/no-unused-imports` error.
- **Fix:** Import only `{ test }`; documented the rationale in the header docstring. Re-ran 3× green after the change.
- **Files modified:** tests/tests/specs/voter/voter-dark-mode.spec.ts
- **Commit:** eea5d2589

## Environment Note (not a deviation)

The first `a11y-smoke --no-deps` reruns failed 11/11 because the preceding `a11y-smoke` *with-deps* run executed its `data-teardown-base` tail, wiping the `e2e/base` dataset; failures were missing-data axe violations on the (otherwise green) `home` light scan, not a code defect. Re-seeding via `yarn db:seed --template e2e/base` restored 3× green. Per the project E2E discipline, `--no-deps` reruns require base data present.

## Authentication Gates

None — all routes under test are public voter-app routes (run unauthenticated).

## Known Stubs

None. Both specs assert real rendered signals (the live `prefers-color-scheme` match and live axe results against `e2e/base`).

## Threat Flags

None — test-only changes; no new production/security surface (matches the plan's threat register: T-121-01/02 both `accept`).

## Commits

- `eea5d2589` — test(121-06): add voter-dark-mode leaf spec (EFLOW-07)
- `61472a2d9` — test(121-06): add dark-mode colour-contrast axe scan to a11y-smoke (EFLOW-07)

## Self-Check: PASSED

- FOUND: tests/tests/specs/voter/voter-dark-mode.spec.ts
- FOUND: tests/tests/specs/a11y/a11y-smoke.spec.ts
- FOUND: .planning/phases/121-e2e-specs-flow-coverage/121-06-SUMMARY.md
- FOUND: commit eea5d2589
- FOUND: commit 61472a2d9
