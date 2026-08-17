---
phase: 119-e2e-fixtures-helpers-seed
plan: 05
subsystem: e2e-test-substrate
tags: [e2e, test-ids, data-testid, fixtures-first, svelte]
requires:
  - "Phase-118 approved v2.14 coverage plan (locked context)"
provides:
  - "shared.video test-id (generic Video root, visibility-assertable)"
  - "voter.questions.popupInfoButton / popupInfoModal test-ids (interactiveInfo popup mode)"
  - "voter.questions.infoSection (per-section, keyed by index)"
  - "voter.questions.argumentGroup (per-group, keyed by choiceId|type)"
  - "voter.questions.termTrigger / termPopup test-ids"
  - "shared.feedbackPopup / shared.surveyPopup distinct root test-ids"
  - "voter.results.filterSelectAllToggle test-id (>3-option toggle)"
  - "voter.about.organizationMatching disclosure test-id"
affects:
  - "Phase-119 Plans 06/07 (fixtures/helpers that READ these test-ids)"
  - "Phase-120 EPERM + Phase-121 EFLOW specs"
tech-stack:
  added: []
  patterns:
    - "keyed data-testid via interpolation (feedback-rating-{value} analog)"
    - "restProps passthrough lands data-testid on component root via concatClass"
    - "single-owner testIds.ts registry (this plan owns all new Phase-119 keys)"
key-files:
  created: []
  modified:
    - tests/tests/utils/testIds.ts
    - apps/frontend/src/lib/components/video/Video.svelte
    - apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte
    - apps/frontend/src/lib/components/questions/QuestionExtendedInfoDrawer.svelte
    - apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte
    - apps/frontend/src/lib/components/questions/QuestionArguments.svelte
    - apps/frontend/src/lib/components/term/Term.svelte
    - apps/frontend/src/lib/dynamic-components/feedback/popup/FeedbackPopup.svelte
    - apps/frontend/src/lib/dynamic-components/survey/popup/SurveyPopup.svelte
    - apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte
    - apps/frontend/src/routes/(voters)/about/+page.svelte
decisions:
  - "Placed the popup-info modal test-id on the QuestionExtendedInfo body inside QuestionExtendedInfoDrawer (the unambiguous modal body) rather than threading restProps through Drawer→ModalContainer onto the <dialog>."
  - "QuestionHeading.svelte needed no edit — the term-trigger/term-popup test-ids live on Term.svelte, which QuestionHeading renders; the requirement is satisfied transitively."
  - "Wrapped the About org-matching {@html} disclosure in a <div data-testid=...> since the content is @html output, not a literal <p>."
metrics:
  duration: ~10m
  completed: 2026-06-15
---

# Phase 119 Plan 05: Production data-testid Additions + testIds Registry Summary

Added every Phase-119 production-source `data-testid` that the Plan-06/07 fixtures read, and declared all new keys in the single-owner `tests/tests/utils/testIds.ts` registry. `yarn typecheck:tests` is green (SC1 substrate ready).

## What Was Built

This plan is the test-id substrate half of the fixtures-first gate (A8): a helper cannot read a test-id that does not exist, so adding the id is part of "build the helper." All ids are declared in `testIds.ts` (read downstream via `getByTestId(testIds.…)`, A3 — no raw locators) and emitted by their components.

### Task 1 — Video / question-info / arguments / terms (commit `81ed9a8c1`)
- **testIds.ts**: new keys `shared.video`; `voter.questions.{popupInfoButton, popupInfoModal, infoSection, argumentGroup, termTrigger, termPopup}`.
- **Video.svelte**: generic `data-testid="video"` on the root `<div>` (NOT the hero figure). The element is `class:hidden`-not-destroyed, so the downstream reader asserts visibility (`expectVideo(true)`=`toBeVisible`, `expectVideo(false)`=`not.toBeVisible`). One shared key for both voter + candidate apps.
- **QuestionExtendedInfoButton.svelte**: `voter-questions-popup-info-button` on the info `<Button>` (popup mode).
- **QuestionExtendedInfoDrawer.svelte**: `voter-questions-popup-info-modal` on the `QuestionExtendedInfo` modal body (so `expectInfoMode(q,'popup')` can assert the open modal).
- **QuestionExtendedInfo.svelte**: per-`infoSections` section id keyed by index (`voter-questions-info-section-{index}`) so `expectInfoSections([...])` can enumerate.
- **QuestionArguments.svelte**: per-group id keyed by `choiceId` (categorical) with `type` fallback (`voter-questions-argument-group-{choiceId ?? type}`) — mirrors the keyed `feedback-rating-{value}` pattern so `expectArguments(q,type)` can target a group.
- **Term.svelte**: `voter-questions-term-trigger` on the trigger `<span>` + `voter-questions-term-popup` on the definition popup `<div>`.

### Task 2 — popups / filter toggle / About disclosure (commit `d5a0dc9d1`)
- **testIds.ts**: new keys `shared.feedbackPopup`, `shared.surveyPopup`, `voter.results.filterSelectAllToggle`, `voter.about.organizationMatching`.
- **FeedbackPopup.svelte** + **SurveyPopup.svelte**: distinct root test-ids (`feedback-popup` / `survey-popup`) on their `<Alert>` roots so the dismiss-and-reload helper can distinguish them (EPERM-09).
- **EnumeratedEntityFilter.svelte**: `entity-filter-select-all-toggle` on the single select-all/none toggle `<button>` (renders only `{#if values.length > 3}`; the label flips selectAll/unselectAll via `allSelected` — it is ONE toggle, not two buttons) (EFLOW-01).
- **about/+page.svelte**: `voter-about-organization-matching` on a `<div>` wrapping the org-matching disclosure `{@html}` block (EPERM-10).

## Corrections Honored (from RESEARCH/PATTERNS)
- **No dark-mode toggle id** — there is NO dark-mode toggle in the app (`prefers-color-scheme` / `page.emulateMedia` only). Verified `testIds.ts` contains no `dark-mode` token.
- **nav-menu + score-gauge ids reused, not duplicated** — `expectNavMenuItems` reuses `shared.navigation.menu/menuItem/menuToggle`; org-match-score reuses `voter.results.scoreGauge`. Verified single occurrence of each in `testIds.ts`.

## Verification
- `yarn typecheck:tests` exits 0 (SC1) — confirms the new `testIds.ts` keys are type-correct.
- Per-task grep gate confirmed each named component emits `data-testid`.
- All component prop passthroughs are type-safe: `QuestionExtendedInfoProps`, `QuestionArgumentsProps`, and `AlertProps` all extend `SvelteHTMLElements['div']`, which accepts `data-testid`.

## Deviations from Plan
None — plan executed as written.

The one judgement call (modal-body test-id placement) is documented under `decisions` in frontmatter: I placed `voter-questions-popup-info-modal` on the `QuestionExtendedInfo` body inside `QuestionExtendedInfoDrawer` rather than threading `restProps` through `Drawer`→`ModalContainer` onto the `<dialog>`, because the `QuestionExtendedInfo` root is the unambiguous modal body and `QuestionExtendedInfo` already spreads `restProps` via `concatClass`. This is fully within the plan's intent ("a test-id on the opened modal/dialog body") and Claude's discretion on internal placement.

## Known Stubs
None — all test-ids are emitted by live components reachable in the running app under the relevant seeded settings. No hardcoded empty values, placeholders, or unwired components introduced.

## Self-Check: PASSED
- All 11 modified files present on disk.
- Both task commits (`81ed9a8c1`, `d5a0dc9d1`) present in git history.
- `yarn typecheck:tests` green.
- No file deletions in either commit.
- Pre-existing unstaged `.planning/STATE.md` + `package.json` left untouched; STATE.md/ROADMAP.md NOT modified (orchestrator owns those in sequential/worktree mode).
