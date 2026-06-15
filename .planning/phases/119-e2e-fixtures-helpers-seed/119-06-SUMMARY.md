---
phase: 119-e2e-fixtures-helpers-seed
plan: 06
subsystem: e2e-test-fixtures
tags: [e2e, fixtures, playwright, eperm, testids]
requires:
  - "119-05 (testIds keys: video, popupInfoButton/Modal, infoSection, argumentGroup, feedbackPopup/surveyPopup, about.organizationMatching)"
provides:
  - "createVideoReader / expectVideo (shared — EPERM-06)"
  - "createQuestionInfo / expectInfoMode / expectInfoSections / expectArguments (voter — EPERM-07)"
  - "createPopupNotice / dismissAndReload (shared — EPERM-09)"
  - "resultsPage.expectOrgMatchScore (voter — EPERM-10)"
  - "createAboutPage / expectOrgMatchingDisclosure (voter — EPERM-10)"
affects:
  - "Phase 120 EPERM specs (consumers)"
  - "Plan 119-08 probes (consumers)"
tech-stack:
  added: []
  patterns:
    - "testid-anchored reader-factory (feedbackDialog.fixture.ts analog)"
    - "shared standalone factory (direct create<Name>(page) import) vs voter views.ts composition root"
key-files:
  created:
    - tests/tests/fixtures/shared/video.fixture.ts
    - tests/tests/fixtures/voter/questionInfo.fixture.ts
    - tests/tests/fixtures/shared/popupNotice.fixture.ts
    - tests/tests/fixtures/voter/aboutPage.fixture.ts
  modified:
    - tests/tests/fixtures/voter/resultsPage.fixture.ts
    - tests/tests/fixtures/voter/views.ts
decisions:
  - "questionInfo `question` param is an OPTIONAL 0-based index (nth-or-first scoping) — lightest shape consistent with voterQuestionsPage one-question-at-a-time navigation"
  - "expectVideo(false) and expander-mode use toBeHidden() (lint-preferred, equivalent to not.toBeVisible() for the hidden-not-destroyed Video element)"
  - "org-match-score reuses testIds.voter.results.scoreGauge scoped to the target card (no org-scoped disambiguation id needed); returns the gauge Locator for per-mode value comparison"
  - "About disclosure reader asserts block PRESENCE/ABSENCE per mode (locale-dependent text), not a specific string"
metrics:
  duration: "~10m"
  completed: 2026-06-15
---

# Phase 119 Plan 06: EPERM Fixtures & Helpers Summary

Reader/helper factories for the Phase-120 EPERM specs — `expectVideo` (EPERM-06), question-info readers `expectInfoMode`/`expectInfoSections`/`expectArguments` (EPERM-07), a feedback/survey popup handle with `dismissAndReload` (EPERM-09), and an org-match-score readout + About-page org-matching disclosure reader (EPERM-10) — each mirroring the verified `feedbackDialog.fixture.ts` testid-anchored reader-factory shape and routed entirely through `testIds` (A3, no raw locators). All green on `yarn typecheck:tests` + `yarn lint:check` (`no-restricted-locators`).

## What Was Built

### Task 1 — `expectVideo` (shared) + question-info readers (commit `c18533524`)
- **`tests/tests/fixtures/shared/video.fixture.ts`** — `createVideoReader(page)` exposing `expectVideo(present: boolean)`. Reads the generic `video` test-id; because the Video root is hidden-not-destroyed (`class:hidden={!hasContent}`), it asserts VISIBILITY: `present=true → toBeVisible()`, `present=false → toBeHidden()`. Standalone shared factory (consumed by direct import from both voter + candidate).
- **`tests/tests/fixtures/voter/questionInfo.fixture.ts`** — `createQuestionInfo(page)` exposing:
  - `expectInfoMode(question, 'popup'|'expander')` — popup: clicks `popupInfoButton`, asserts `popupInfoModal` visible; expander: clicks the existing `voter-questions-info-button`, asserts NO modal (`toBeHidden()`).
  - `expectInfoSections(sections: number[])` — enumerates `infoSection` testids by index, asserts each expected section visible.
  - `expectArguments(question, 'ordinal'|'boolean'|'categorical')` — asserts the type-appropriate `argumentGroup` renders (categorical groups keyed by choiceId).
  - **`question` signature:** OPTIONAL 0-based index (`nthOrFirst`) — omitted defaults to the first match; consistent with the single-question-at-a-time voterQuestionsPage navigation.

### Task 2 — popupNotice + org-match-score + About-disclosure, wired into views.ts (commit `c9cd666d0`)
- **`tests/tests/fixtures/shared/popupNotice.fixture.ts`** — `createPopupNotice(page)` exposing `expectVisible(kind)`, `dismiss(kind)`, `dismissAndReload(kind)` for `kind: 'feedback'|'survey'` (distinct root testids `feedbackPopup`/`surveyPopup`). `dismissAndReload` dismisses → `page.reload()` → asserts the popup does NOT reappear (dismiss-persistence). Standalone shared factory.
- **`tests/tests/fixtures/voter/resultsPage.fixture.ts`** — appended `expectOrgMatchScore(target)` reusing `testIds.voter.results.scoreGauge` scoped to the target org/party card; asserts the gauge visible and returns it for per-mode value comparison. Additive (appended to the returned object; no existing readers restructured — Plan 07 can extend cleanly).
- **`tests/tests/fixtures/voter/aboutPage.fixture.ts`** — `createAboutPage(page)` exposing `goToPage`/`expectPageVisible` + `expectOrgMatchingDisclosure(mode)` reading `voter-about-organization-matching` (asserts block visible for `answersOnly`/`impute`, hidden for `none`).
- **`tests/tests/fixtures/voter/views.ts`** — registered `aboutPage` + `questionInfo` voter-scoped fixtures (additive: appended imports, ViewFixtures members, and `base.extend` entries; existing exports untouched so Plan 07 can extend).

## Deviations from Plan

None — plan executed as written, with two lint-driven mechanical equivalences:
- **`toBeHidden()` over `not.toBeVisible()`** in `video.fixture.ts` (`expectVideo(false)`) and `questionInfo.fixture.ts` (expander mode). The plan/RESEARCH phrased the Video hidden assertion as `not.toBeVisible()`; ESLint `playwright/no-useless-not` flags that and prefers `toBeHidden()`, which is semantically equivalent for the hidden-not-destroyed element (element stays attached, just hidden). This is the lint-preferred form, not a behavioral change. (Not a deviation rule — a within-spec lint-clean choice covered by Claude's-discretion over the helper's internal shape.)

## Verification

- `yarn typecheck:tests` → exit 0 (SC1).
- `yarn lint:check` → exit 0, 11/11 turbo tasks successful, 0 errors (`no-restricted-locators` guard passes; A3). Only pre-existing out-of-scope `@openvaa/dev-seed` `unused-imports` warnings remain (not touched by this plan).
- Grep acceptance checks: `expectVideo`, `expectInfoMode`/`expectInfoSections`/`expectArguments`, `dismissAndReload`, `expectOrgMatchingDisclosure`, score readout, `aboutPage` registration — all present.

Note: the plan's `<verify>` grep `! grep -nE "...expect.soft...catch(() => null)..."` matches the DOCSTRING prose (identical wording carried verbatim from the verified `feedbackDialog.fixture.ts` analog), not code. No code uses raw `.locator()`/`getByText()`/`expect.soft`/try-catch-on-expect/`.catch(()=>null)` — confirmed by the authoritative `no-restricted-locators` ESLint guard passing.

## Shared-File Coordination (Plan 119-07)

`resultsPage.fixture.ts` and `views.ts` edits are purely ADDITIVE (appended methods / appended imports + members + extend entries; no existing exports restructured) so Plan 119-07's edits to the same two files extend cleanly. `testIds.ts` was read-only (Plan 05 owns it).

## Known Stubs

None. All readers route through real `testIds` keys (added by Plan 05) and assert real DOM state.

## Self-Check: PASSED

- Files exist: video.fixture.ts, questionInfo.fixture.ts, popupNotice.fixture.ts, aboutPage.fixture.ts (created); resultsPage.fixture.ts, views.ts (modified) — all present.
- Commits exist: `c18533524` (Task 1), `c9cd666d0` (Task 2) — both in git log.
