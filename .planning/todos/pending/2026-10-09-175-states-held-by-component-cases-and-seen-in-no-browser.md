---
created: 2026-10-09T00:00:00.000Z
title: States of the organization-editing pages that component cases hold and no browser test has seen
area: E2E / coverage
severity: minor
source: Phase 175 (the "not done or not verified" sections of 175-08, 175-09, 175-10, 175-11 and 175-12-SUMMARY.md; 175-12-SUMMARY.md § Every item the earlier summaries left for this plan); filed by 175-13
owner: the next plan that extends `perm-organization-editing.spec.ts`; Phase 176 meets items 3 and 6
files:
  - tests/tests/specs/perm/perm-organization-editing.spec.ts
  - tests/tests/fixtures/contestant/perm-organization-editing.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-organization-editing.ts
  - apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/questions/[questionId]/+page.svelte
---

## Finding

Phase 175 closed with 46 tests of the organization-editing spec and unit and component cases beside them. The following behaviours are held by the second kind alone, or by no test of an organization's pages: none was produced in a browser as an organization's editor or its voter sees it.

1. **`entities.hideIfMissingAnswers.organization: true` removes an organization from a voter's results.** The phase's one change to voter-side behaviour (operator decision A3). Held by unit cases of `nominationAndQuestionState` in both directions. The dataset can show it: with the setting on, organization A with one opinion answer missing leaves the voter's list (`175-08-SUMMARY.md` § What the next plans should know). The setting is the suite's one settings row, so the test restores it.
2. **The no-questions variant of the home explanation.** The dataset's candidate has a complete profile, so its home shows the ready sentence and never `contestantApp.home.ingress.notDoneNoQuestions.*`. The no-questions variant of the profile instructions is on a scanned page; its wording is asserted nowhere.
3. **No frame shows the neutral page, or the former error page, while questions load.** Component cases read the markup after each flush; no browser run captures frames.
4. **The loading and the not-found view of the preview.** Two component cases.
5. **The unsaved-changes guard with a staged logo.** Proven in a browser for a name and a colour, not for a logo.
6. **Where the save of the last unanswered opinion question leads.** The spec asserts the list of questions (`saveAndExpect('list')`), which is what the page does; the page's own comment says the entity's home is intended. The page computes its target from a derived value the save itself empties. Phase 176 rebuilds this routing: the assertion then fails by name and is changed with it, and the comment with the code.
7. **A reading in the six other locales.** The spec opens `/en/`; see `2026-10-09-175-native-speaker-review-organization-editing-strings.md`.
8. **The three isolated fallbacks** (UI contract U-05, U-12, U-30, and U-19 with item 1): built as ruled, each removable as one block; none was exercised, because none was overruled when the phase closed.
9. **The settings page as an organization's editor.** Phase 173's human-verification item names four pages: an organization editor's profile, questions, preview **and settings**. The spec opens the first three and saves answers through the UI; no test opens the settings page under an organization's URL. `contestant-a11y-scan` scans the settings route as a candidate's editor, and the page shows the signed-in user's own settings, not the entity's, so nothing type-specific is expected there. One step in the confirmed organization's describe would close it.

### What is measured

The spec's 46 tests are green in the phase's closing full run and three times in isolation, each on a database it reset itself. The component and unit cases named above are green in the closing gate set (frontend unit: 182 files, 3146 tests).

## Options

Items 1, 5 and 9 are each one test on the existing dataset and fixtures. Item 2 needs a candidate or an organization whose profile is incomplete and that is asked no opinion question, which the dataset does not hold. Items 3 and 4 need a way to hold a load open, which the suite does not have. Item 6 is Phase 176's.
