---
phase: 92-e2e-test-infrastructure-hardening
plan: 03
subsystem: e2e-test-infrastructure
tags: [fixtures, testids, goToPage, voter-app, playwright]
requires:
  - "92-01 (no-restricted-locators rule + typecheck:tests gate + entityDetails getByText fix)"
provides:
  - "voterHomePage / voterIntroPage / voterQuestionsPage function-fixtures (goToPage + expectPageVisible)"
  - "resultsPage + entityDetails fixtures extended with the goToPage/expectPageVisible paradigm"
  - "voter.home.page + voter.intro.page load-anchor testIds (catalog + frontend)"
  - "named voter-route goto migration onto goToPage (5 primary voter/voterNav files)"
affects:
  - "92-05 (perm-spec gap-file goto migration depends on these voter fixtures)"
tech-stack:
  added: []
  patterns:
    - "function-fixture goToPage(locale='en') + expectPageVisible(visible=true) via buildRoute"
    - "MainContent restProps data-testid as always-rendered page-load anchor"
key-files:
  created:
    - tests/tests/fixtures/voter/voterHomePage.fixture.ts
    - tests/tests/fixtures/voter/voterIntroPage.fixture.ts
    - tests/tests/fixtures/voter/voterQuestionsPage.fixture.ts
  modified:
    - tests/tests/utils/testIds.ts
    - apps/frontend/src/routes/(voters)/+page.svelte
    - apps/frontend/src/routes/(voters)/intro/+page.svelte
    - tests/tests/fixtures/resultsPage.fixture.ts
    - tests/tests/fixtures/entityDetails.fixture.ts
    - tests/tests/fixtures/views.ts
    - tests/tests/specs/voter/voter-mega-journey.spec.ts
    - tests/tests/specs/perm/perm-not-located-2e2cg.spec.ts
    - tests/tests/specs/perm/perm-disable-voter-app.spec.ts
    - tests/tests/utils/voterNavigation.ts
decisions:
  - "Voter fixtures registered in views.ts (the voter-mega-journey composition root), NOT voter-mega.fixture.ts as the plan file-list suggested — voter-mega-journey.spec.ts imports `test` from views.ts; voter-mega.fixture.ts is a different root used by perm specs that do not need these page fixtures."
  - "entityDetails exposes expectPageVisible only (no goToPage) — entity-detail is a drawer, and a grep found zero deep-link gotos to the ResultEntity route; a goToPage on a runtime-discovered entity id would be a freeform-URL smell (Pitfall 4)."
  - "Home/intro load anchors placed on the MainContent root <div> via restProps data-testid (always-rendered content), not on the action button (hidden under maintenance variant)."
  - "perm-answers-locked.spec.ts left untouched — all its gotos are candidate routes (out of Phase 92 scope)."
metrics:
  duration: ~6min
  completed: 2026-06-02
  tasks: 3
  files: 13
---

# Phase 92 Plan 03: Voter goToPage/expectPageVisible Fixture Rollout Summary

Rolled out the `goToPage(locale?)` + `expectPageVisible(visible=true)` paradigm to every navigated/asserted voter page: rebuilt the 5 deleted voter page-objects as function-fixtures (3 net-new + 2 extended in place), added stable load-confirming testIds to the voter home + intro pages (catalog + frontend), and migrated all named-voter-route `page.goto` calls in the 5 primary voter/voterNav files onto the fixture paradigm.

## What Was Built

### Task 1 — load anchors + 3 net-new voter fixtures (commit `0dc229541`)
- **Load anchors chosen per page:**
  - `voter.home.page` = `'voter-home'` — on the home `MainContent` root div (`apps/frontend/src/routes/(voters)/+page.svelte`).
  - `voter.intro.page` = `'voter-intro'` — on the intro `MainContent` root div (`apps/frontend/src/routes/(voters)/intro/+page.svelte`).
  - `voter.questions.heading` = `'voter-questions-heading'` (pre-existing, reused).
  - `voter.results.list` = `'voter-results-list'` (pre-existing, reused).
  - `voter.entityDetail.container` = `'voter-entity-detail'` (pre-existing, reused).
- **Fixture directory used:** `tests/tests/fixtures/voter/` (net-new subdir, consistent with the `fixtures/candidate/` convention and the plan's specified paths). Fixtures import from `../../utils/`.
- 3 fixtures: `voterHomePage` (route `Home`, `/` prepended to bare-locale buildRoute output), `voterIntroPage` (route `Intro`), `voterQuestionsPage` (route `Questions`). Each exposes `goToPage(locale='en')` (calls `expectPageVisible(true)` internally), `expectPageVisible(visible=true)`, and a `clickStart()` convenience. Reference shape copied verbatim from `candidateQuestionsOverviewPage.fixture.ts:75-89`; buildRoute substituted for the hardcoded URL. getByTestId only — no raw getByText/.locator.

### Task 2 — extend results+entityDetails, register fixtures (commit `f861a9aa2`)
- `resultsPage.fixture.ts`: added `goToPage('Results', locale)` + `expectPageVisible` keyed on `voter-results-list` (extended in place; all existing methods preserved).
- `entityDetails.fixture.ts`: added `expectPageVisible` keyed on `voter-entity-detail`. **No goToPage** (drawer, not a deep-link page — rationale documented inline).
- `views.ts`: registered `voterHomePage` / `voterIntroPage` / `voterQuestionsPage` in the composition root via `base.extend<...>({ name: async ({page}, use) => use(createXxx(page)) })`.

### Task 3a — goto migration (commit `92b71a2a4`)
Goto migrate/keep tally per file:

| File | Migrated → goToPage | Kept inline (with // reason) | Notes |
|------|---------------------|------------------------------|-------|
| `voter-mega-journey.spec.ts` | 2 Home gotos → `voterHomePage.goToPage/clickStart` | 3 (About/Info/Privacy, locale-aware buildRoute, no fixture this plan) | also: `/open menu/i` getByRole ×3 → `nav-menu-toggle` testId (92-01 deferred migration) |
| `voterNavigation.ts` | 2 Home gotos → `createVoterHomePage(page).goToPage/clickStart` | 1 (dynamic `/questions?electionId=...` fallback URL) | fixture instantiated from raw page (util, not fixture-consumer) |
| `perm-not-located-2e2cg.spec.ts` | 0 | 5 (locale-less redirect-bounce + dynamic deferred-target probes) | all bounce/whitelist probes — visibility assertion would defeat intent |
| `perm-disable-voter-app.spec.ts` | 0 | 3 (2 maintenance-mode probes asserting start button HIDDEN + 1 candidate route) | goToPage's visibility assertion would fail by design |
| `perm-answers-locked.spec.ts` | 0 | 0 (untouched) | candidate-route gotos only — out of Phase 92 scope |

## Deviations from Plan

### File-list deviations (no behavior impact)
**1. [Rule 3 - Path correction] Frontend route paths**
- Plan `files_modified` listed `apps/frontend/src/routes/[[lang=locale]]/(voters)/+page.svelte` and `.../[[lang=locale]]/(voters)/(located)/intro/+page.svelte`. The actual on-disk paths have no `[[lang=locale]]` prefix and the intro is NOT under `(located)`: `apps/frontend/src/routes/(voters)/+page.svelte` and `apps/frontend/src/routes/(voters)/intro/+page.svelte`. Edited the real files (the plan explicitly instructed re-grepping exact paths before editing).

**2. [Decision] Fixture registration in views.ts, not voter-mega.fixture.ts**
- Plan Task-2 file list named `voter-mega.fixture.ts` as a registration target. `voter-mega-journey.spec.ts` imports its `test` from `views.ts` (not `voterMegaTest`), so registering in `views.ts` is the correct and sufficient composition root for the spec to consume the new fixtures by destructuring. `voter-mega.fixture.ts` was therefore NOT modified — it is a separate root used by perm specs that have no need for these page fixtures.

### Auto-fixed
**3. [Rule 3 - Blocking lint] Import sort in voterNavigation.ts**
- After swapping the `buildRoute` import for `createVoterHomePage`, `simple-import-sort/imports` flagged the ordering. Fixed via `eslint --fix`. Verified green.

## Gate Results
- `yarn typecheck:tests` → exit 0.
- `cd tests && npx eslint .` → exit 0 (the no-restricted-locators rule is satisfied; new fixtures use getByTestId only).
- Repo-wide `yarn lint:check` remains RED on 3 pre-existing Phase-91 dev-seed `_helpers/` errors — KNOWN out-of-scope per handoff context, NOT touched.
- PHASE GATE (manual `yarn test:e2e`) is recorded at phase-level verification, not blocking this plan.

## Self-Check: PASSED
- Created files: all 3 voter fixtures FOUND.
- Commits: `0dc229541`, `f861a9aa2`, `92b71a2a4` all FOUND in git log.
- No accidental file deletions in any commit.
