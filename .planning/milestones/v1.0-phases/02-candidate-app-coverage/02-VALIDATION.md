---
phase: 2
slug: candidate-app-coverage
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-04
gap_audit: 2026-03-11
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `yarn test:e2e --project=candidate-app` |
| **Full suite command** | `yarn test:e2e` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn test:e2e --project=candidate-app`
- **After every plan wave:** Run `yarn test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-02-01 | 02 | 2 | CAND-01 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-auth.spec.ts` | yes | green |
| 02-02-02 | 02 | 2 | CAND-02 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-auth.spec.ts` | yes | green |
| 02-02-03 | 02 | 2 | CAND-07 | e2e | `yarn test:e2e --project=candidate-app-mutation tests/tests/specs/candidate/candidate-registration.spec.ts` | yes | green |
| 02-02-04 | 02 | 2 | CAND-08 | e2e | `yarn test:e2e --project=candidate-app-mutation tests/tests/specs/candidate/candidate-registration.spec.ts` | yes | green |
| 02-03-01 | 03 | 3 | CAND-03 | e2e | `yarn test:e2e --project=candidate-app-mutation tests/tests/specs/candidate/candidate-profile.spec.ts` | yes | green |
| 02-03-02 | 03 | 3 | CAND-04 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-questions.spec.ts` | yes | green (Likert-5 only; see note) |
| 02-03-03 | 03 | 3 | CAND-05 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-questions.spec.ts` | yes | green |
| 02-03-04 | 03 | 3 | CAND-06 | e2e | `yarn test:e2e --project=candidate-app tests/tests/specs/candidate/candidate-questions.spec.ts` | yes | green |
| 02-03-05 | 03 | 3 | CAND-12 | e2e | `yarn test:e2e --project=candidate-app-mutation tests/tests/specs/candidate/candidate-profile.spec.ts` | yes | green |
| 02-04-01 | 04 | 2 | CAND-09 | e2e | `yarn test:e2e --project=candidate-app-settings tests/tests/specs/candidate/candidate-settings.spec.ts` | yes | green |
| 02-04-02 | 04 | 2 | CAND-10 | e2e | `yarn test:e2e --project=candidate-app-settings tests/tests/specs/candidate/candidate-settings.spec.ts` | yes | green |
| 02-04-03 | 04 | 2 | CAND-11 | e2e | `yarn test:e2e --project=candidate-app-settings tests/tests/specs/candidate/candidate-settings.spec.ts` | yes | green |
| 02-04-04 | 04 | 2 | CAND-13 | e2e | `yarn test:e2e --project=candidate-app-settings tests/tests/specs/candidate/candidate-settings.spec.ts` | yes | green |
| 02-04-05 | 04 | 2 | CAND-14 | e2e | `yarn test:e2e --project=candidate-app-settings tests/tests/specs/candidate/candidate-settings.spec.ts` | yes | green |
| 02-04-06 | 04 | 2 | CAND-15 (hideHero) | e2e | `yarn test:e2e --project=candidate-app-settings tests/tests/specs/candidate/candidate-settings.spec.ts` | yes | green |
| 02-04-06b | 04 | 2 | CAND-15 (hideVideo) | manual | See manual-only section below | N/A | manual-only |

*Status: pending / green / red / flaky / manual-only*

---

## Wave 0 Requirements

- [x] `tests/tests/specs/candidate/candidate-auth.spec.ts` -- CAND-01, CAND-02
- [x] `tests/tests/specs/candidate/candidate-registration.spec.ts` -- CAND-07, CAND-08
- [x] `tests/tests/specs/candidate/candidate-profile.spec.ts` -- CAND-03, CAND-12 (all persistence types)
- [x] `tests/tests/specs/candidate/candidate-questions.spec.ts` -- CAND-04, CAND-05, CAND-06
- [x] `tests/tests/specs/candidate/candidate-settings.spec.ts` -- CAND-09 through CAND-15
- [x] `tests/tests/pages/candidate/ProfilePage.ts` -- page object
- [x] `tests/tests/pages/candidate/QuestionsPage.ts` -- page object
- [x] `tests/tests/pages/candidate/QuestionPage.ts` -- single question page object
- [x] `tests/tests/pages/candidate/SettingsPage.ts` -- page object
- [x] `tests/tests/pages/candidate/PreviewPage.ts` -- page object
- [x] `tests/tests/utils/emailHelper.ts` -- SES email fetch + parse utility

---

## Gap Audit Notes (2026-03-11)

### CAND-03: Info field types
Added test: `should render all info field types (date, number, text, checkbox) on profile page`
in `candidate-profile.spec.ts`. Asserts `input[type="date"]`, `input[type="number"]`,
`role=textbox`, and `input[type="checkbox"]` are all visible inside `<main>`.

### CAND-04: Opinion question types
**COVERED with single type.** The default test dataset contains exactly one opinion question type:
`test-qt-likert5` (singleChoiceOrdinal, 5 choices). All 8 opinion questions (`test-question-1`
through `test-question-8`) use this type. No other opinion question types exist in the dataset.
The existing Likert-5 test is sufficient and complete for the current dataset.

### CAND-06: Preview specific content
Added test: `should show specific candidate data (name or answered question) in preview`
in `candidate-questions.spec.ts`. Asserts candidate last name "Alpha" is visible inside
the preview container, and at least one Likert answer label is rendered.

### CAND-12: Text and comment persistence
Added two tests in `candidate-profile.spec.ts`:
- `should persist a text info field value after page reload`: fills textbox, saves, reloads, asserts value.
- `should persist comment text on a question after page reload`: fills comment on question, saves, reloads, asserts comment value.

### CAND-15: hideVideo setting
**MANUAL-ONLY.** The `hideVideo` setting only has a DOM effect when a question has
`customData.video` set (see `questions/[questionId]/+page.svelte` line 83). The default
test dataset contains no questions with video customData. Without video content in the
dataset, toggling `hideVideo` produces no observable difference in the rendered DOM.
An automated test would require adding a question with video customData and a reachable
video URL to the test environment.

---

## Manual-Only Verifications

| Requirement | Reason | Manual Test Procedure |
|-------------|--------|-----------------------|
| CAND-15 (hideVideo) | No video customData in test dataset; `hideVideo` only affects `customData?.video` content | 1. Add video URL to a question's customData in Strapi admin. 2. Set `candidateApp.questions.hideVideo=false`, navigate to question, verify video visible. 3. Set `hideVideo=true`, reload, verify video not visible. |

---

## Validation Sign-Off

- [x] All tasks have automated verify or documented manual-only justification
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all files
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** gap-audit complete 2026-03-11
