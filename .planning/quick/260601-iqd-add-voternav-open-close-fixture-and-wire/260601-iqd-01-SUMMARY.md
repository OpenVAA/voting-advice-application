---
status: complete
status_note: "Stamped complete at v2.10 milestone audit (2026-06-04). All 4 PLAN must-haves verified present: createVoterNav open()/close() in tests/tests/fixtures/voter/voterNavFixture.fixture.ts, menuToggle 'nav-menu-toggle' testid, perm-localisation-positive wiring. 4 commits landed (dcafe9f1d/b8554ccb6/590bbb402/ab195a328); perm-localisation-positive green in the Phase 94 suite."
phase: quick-260601-iqd
plan: 01
subsystem: e2e-tests
tags: [playwright, fixtures, localisation, voter-nav, perm-l10n]
requires:
  - tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts (createLangSelector)
  - tests/tests/fixtures/candidate/perm-l10n.ts (composition root)
  - apps/frontend/src/routes/Header.svelte (menu-toggle button)
provides:
  - testIds.shared.navigation.menuToggle ('nav-menu-toggle')
  - createVoterNav(page) function-fixture (open/close)
  - voterNav fixture registered in perm-l10n composition root
affects:
  - tests/tests/specs/perm/perm-localisation-positive.spec.ts
tech-stack:
  added: []
  patterns:
    - idempotent open/close drawer function-fixture chaining to a langSelector fixture
key-files:
  created:
    - tests/tests/fixtures/candidate/voterNavFixture.fixture.ts
  modified:
    - tests/tests/utils/testIds.ts
    - apps/frontend/src/routes/Header.svelte
    - tests/tests/fixtures/candidate/perm-l10n.ts
    - tests/tests/specs/perm/perm-localisation-positive.spec.ts
decisions:
  - "Header menu-toggle uses a string-literal data-testid (\"nav-menu-toggle\") rather than importing testIds — app code does not import from the tests workspace."
  - "voterNav.close() targets #drawerCloseButton (locale-stable id) instead of getByRole({name}) because the close control's accessible name is t('common.closeMenu') (locale-dependent); a scoped eslint-disable documents the playwright/no-raw-locators exception."
metrics:
  duration: ~3min
  completed: 2026-06-01
---

# Phase quick-260601-iqd Plan 01: Add voterNav open/close fixture and wire it into perm-localisation-positive Summary

Added a locale-independent `voterNav` open/close function-fixture and threaded it through `perm-localisation-positive.spec.ts` so the language selector — which lives inside the voter nav drawer (closed by default) — is reachable in every UI locale before the spec interacts with it.

## What Was Built

- **Task 1 — locale-independent menu-toggle testid** (`dcafe9f1d`): Added `menuToggle: 'nav-menu-toggle'` to `testIds.shared.navigation`, and rendered `data-testid="nav-menu-toggle"` on the Header menu-toggle `<button>`. The string literal is used in app code (Header.svelte) since app code does not import the tests workspace; the value matches the testIds constant.
- **Task 2 — voterNav fixture + composition-root wiring** (`b8554ccb6`, lint fix `590bbb402`): Created `voterNavFixture.fixture.ts` exporting `createVoterNav(page)` with idempotent `open()` (returns a `LangSelectorFixture`) and `close()`, plus `type VoterNavFixture`. `open()` skips the toggle click when the drawer nav is already visible; `close()` returns early when the drawer is not visible. Registered `voterNav` (fixture body + type) in `perm-l10n.ts`.
- **Task 3 — spec wiring** (`ab195a328`): Destructured `voterNav` in the test callback and added `await voterNav.open()` before each of the 4 `langSelector` accesses (en-root `expectVisible`, `switchTo('fi')`, `switchTo('en')`, step-10 `switchTo('fi')`). Added `await voterNav.close()` after the line-119 `expectVisible` so the drawer overlay does not cover the home start button. Before the step-10 access, the entity-details dialog is torn down via `page.keyboard.press('Escape')` + `expect(dialog).toBeHidden()` (it covers the header / menu-toggle), then the nav is opened.

## Verification

- `npx eslint` on all four edited files (testIds.ts, Header.svelte not lintable via tests eslint, perm-l10n.ts, voterNavFixture.fixture.ts, perm-localisation-positive.spec.ts): **clean, 0 errors**.
- `npx playwright test perm-localisation-positive --list`: the target spec and the full perm-l10n composition root load and transpile without module-resolution or type errors, confirming the new fixture and its `LangSelectorFixture` import resolve.
- `grep` checks: `menuToggle: 'nav-menu-toggle'` present in testIds.ts; `data-testid="nav-menu-toggle"` present in Header.svelte; `voterNav: VoterNavFixture` present in perm-l10n.ts; `createVoterNav` present in the fixture; 4 `voterNav.open()` + 1 `voterNav.close()` in the spec.

### Type-checking note (plan verify-command discrepancy)

The plan's automated verify commands invoked `cd tests && npx tsc --noEmit -p tsconfig.json`. **There is no `tsconfig.json` (or any tsconfig) under `tests/`** in this repo — the Playwright test tree is transpiled by Playwright's own esbuild pipeline, not a standalone `tsc` project. The `-p tsconfig.json` invocation therefore errored with `TS5058: The specified path does not exist` and never type-checked; the verify commands' `&& echo OK` / `grep || echo OK` shapes masked this as a pass. Type-level resolution was instead confirmed via `npx playwright test perm-localisation-positive --list` (which fully resolves and transpiles the spec + fixture graph). All grep/lint assertions in the plan's verify blocks pass on their own terms.

### E2E spec execution

The full `perm-localisation-positive` spec was **NOT executed** — running it requires a live dev server + seeded database (`yarn dev` + a localisation-positive seed), which is out of scope for autonomous execution per the task constraints. Static verification (lint + Playwright spec-graph resolution) is clean.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking lint] eslint failures on the new fixture**
- **Found during:** Task 3 (post-edit lint sweep)
- **Issue:** `npx eslint` flagged `voterNavFixture.fixture.ts` for (a) `simple-import-sort/imports` ordering and (b) `playwright/no-raw-locators` on `page.locator('#drawerCloseButton')`.
- **Fix:** Applied the import-sort autofix; added a scoped `// eslint-disable-next-line playwright/no-raw-locators` with a `// reason:` rationale — the close control's accessible name is `t('common.closeMenu')` (locale-dependent), so a `getByRole({ name })` selector would defeat the fixture's locale-independence requirement; the `#drawerCloseButton` id (VoterNav.svelte:57) is the only locale-stable anchor.
- **Files modified:** tests/tests/fixtures/candidate/voterNavFixture.fixture.ts
- **Commit:** 590bbb402

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: tests/tests/fixtures/candidate/voterNavFixture.fixture.ts
- FOUND: commit dcafe9f1d (Task 1)
- FOUND: commit b8554ccb6 (Task 2)
- FOUND: commit 590bbb402 (Task 2 lint fix)
- FOUND: commit ab195a328 (Task 3)
