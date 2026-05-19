---
phase: 01-infrastructure-foundation
plan: 07
subsystem: testing
tags: [data-testid, svelte, e2e-testing, playwright, components]

# Dependency graph
requires:
  - phase: none
    provides: existing shared/dynamic Svelte components
provides:
  - data-testid attributes on 16 shared/dynamic Svelte components used by voter and candidate apps
  - testId support on navigation (nav-menu, nav-menu-item), entity cards, entity details, entity list with controls
  - testId support on feedback form, survey banner/button, constituency/election selectors
  - testId support on tab buttons, question choices (per-option), question actions (next/previous/delete)
  - opinion question input wrapper with testId
affects: [01-03, 01-08, e2e-testing]

# Tech tracking
tech-stack:
  added: []
  patterns: [data-testid on interactive elements, index-suffixed testIds for dynamic lists]

key-files:
  modified:
    - frontend/src/lib/dynamic-components/navigation/Navigation.svelte
    - frontend/src/lib/dynamic-components/navigation/NavItem.svelte
    - frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
    - frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte
    - frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte
    - frontend/src/lib/dynamic-components/entityList/EntityList.svelte
    - frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte
    - frontend/src/lib/dynamic-components/feedback/Feedback.svelte
    - frontend/src/lib/dynamic-components/survey/SurveyButton.svelte
    - frontend/src/lib/dynamic-components/survey/banner/SurveyBanner.svelte
    - frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte
    - frontend/src/lib/components/electionSelector/ElectionSelector.svelte
    - frontend/src/lib/components/tabs/Tabs.svelte
    - frontend/src/lib/components/questions/QuestionChoices.svelte
    - frontend/src/lib/components/questions/QuestionActions.svelte
    - frontend/src/lib/components/questions/OpinionQuestionInput.svelte

key-decisions:
  - "Used static data-testid attributes directly on elements rather than testId props since components already spread $$restProps"
  - "Added index-suffixed testIds for dynamic lists (question-choice-{i}, tab-{index}, election-selector-option-{i})"
  - "Wrapped OpinionQuestionInput content in div with data-testid since it had no container element"

patterns-established:
  - "Static data-testid naming: component-scoped names (nav-menu, entity-card, feedback-form)"
  - "Dynamic list testIds: base-name-{index} pattern for iterated interactive elements"
  - "Container testIds: placed on outermost semantic element (nav, article, form, fieldset, div)"

requirements-completed: [INFRA-01]

# Metrics
duration: 5min
completed: 2026-03-03
---

# Phase 01 Plan 07: Shared/Dynamic Component TestIds Summary

**data-testid attributes added to 16 shared/dynamic Svelte components covering navigation, entity cards/lists, feedback, survey, selectors, tabs, and question UI**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-03T19:58:29Z
- **Completed:** 2026-03-03T20:03:01Z
- **Tasks:** 1
- **Files modified:** 16

## Accomplishments
- All 16 shared/dynamic component files now have data-testid attributes on their interactive elements
- QuestionChoices has per-option testIds (question-choice-{i}) enabling individual answer selection in E2E tests
- Navigation, Tabs, EntityCard, EntityList, Feedback, Survey, and selector components all instrumented
- Question action buttons (next, previous, delete) have distinct testIds for E2E test targeting
- No functional changes -- only data-testid attribute additions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add testIds to shared and dynamic components** - `ea5dcc1` (feat) -- committed as part of 01-04 batch due to concurrent execution

**Note:** The changes for this plan were committed together with plan 01-04 in commit `ea5dcc10e` because both plans were executed in the same session. All 16 component file changes are included in that commit.

## Files Modified
- `frontend/src/lib/dynamic-components/navigation/Navigation.svelte` - Added data-testid="nav-menu" on nav container
- `frontend/src/lib/dynamic-components/navigation/NavItem.svelte` - Added data-testid="nav-menu-item" on interactive a/button element
- `frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` - Added data-testid="entity-card" on article container
- `frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte` - Added data-testid="entity-card-action" on button and anchor elements
- `frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte` - Added data-testid="entity-details" on article container
- `frontend/src/lib/dynamic-components/entityList/EntityList.svelte` - Added data-testid="entity-list" on list container, data-testid="entity-list-show-more" on pagination button
- `frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte` - Added data-testid="entity-list-controls" on container, data-testid="entity-list-search" on search, data-testid="entity-list-filter" on filter buttons
- `frontend/src/lib/dynamic-components/feedback/Feedback.svelte` - Added data-testid on form container, description textarea, rating inputs, submit and cancel buttons
- `frontend/src/lib/dynamic-components/survey/SurveyButton.svelte` - Added data-testid="survey-button"
- `frontend/src/lib/dynamic-components/survey/banner/SurveyBanner.svelte` - Added data-testid="survey-banner"
- `frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte` - Added data-testid="constituency-selector" on container
- `frontend/src/lib/components/electionSelector/ElectionSelector.svelte` - Added data-testid="election-selector" on container and data-testid="election-selector-option-{i}" on each checkbox
- `frontend/src/lib/components/tabs/Tabs.svelte` - Added data-testid="tab-{index}" on each tab button
- `frontend/src/lib/components/questions/QuestionChoices.svelte` - Added data-testid="question-choices" on fieldset and data-testid="question-choice-{i}" on each radio input
- `frontend/src/lib/components/questions/QuestionActions.svelte` - Added data-testid="question-actions" on group, data-testid="question-next", "question-delete", "question-previous" on action buttons
- `frontend/src/lib/components/questions/OpinionQuestionInput.svelte` - Wrapped content in div with data-testid="opinion-question-input"

## Decisions Made
- Used static data-testid attributes directly on elements rather than adding testId props, since all components already use $$restProps which allows callers to override data-testid when needed
- Used index-suffixed testIds (question-choice-{i}, tab-{index}, election-selector-option-{i}) for dynamically rendered lists to enable targeting specific items in E2E tests
- Added a wrapper div to OpinionQuestionInput since it had no container element -- this is a minimal layout change but necessary for testId placement

## Deviations from Plan

### Concurrent Execution with Plan 01-04

The changes for this plan were committed as part of the 01-04 commit (`ea5dcc10e`) because both plans were executed in the same session. All 16 component files are included in that commit alongside the candidate page testId changes. This is a commit organization deviation but all work is complete and verified.

---

**Total deviations:** 1 (commit organization -- changes included in 01-04 commit)
**Impact on plan:** No impact on deliverables. All 16 files instrumented as specified.

## Issues Encountered
- Pre-existing svelte-check errors (8 errors in 7 files) unrelated to our changes -- CSS class resolution warnings for `small-label` and `small-info` classes, and a type error in register page. These are out of scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All shared/dynamic components now support data-testid for E2E test targeting
- Plan 03 (voter app page testIds) can reference these component testIds in its page-level tests
- Plan 08 (candidate protected page testIds) benefits from these shared component testIds as well

## Self-Check: PASSED

- All 16 modified files exist on disk
- All 16 files contain data-testid attributes (verified via grep)
- Commit ea5dcc1 exists in git history
- SUMMARY.md exists at expected path

---
*Phase: 01-infrastructure-foundation*
*Completed: 2026-03-03*
