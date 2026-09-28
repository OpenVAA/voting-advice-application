---
phase: 01-infrastructure-foundation
plan: 03
subsystem: testing
tags: [data-testid, svelte, e2e-testing, playwright, voter-app]

# Dependency graph
requires: []
provides:
  - data-testid attributes on all 14 voter app route pages (36 testIds total)
  - Stable selectors for Playwright E2E tests targeting voter app flows
affects: [03-voter-tests, 04-voter-advanced-tests]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'data-testid prop forwarding via $$restProps/concatClass on shared Svelte components'
    - 'Page-scoped kebab-case testId naming: voter-{page}-{element}'

key-files:
  created: []
  modified:
    - 'frontend/src/routes/[[lang=locale]]/(voters)/+page.svelte'
    - 'frontend/src/routes/[[lang=locale]]/(voters)/elections/+page.svelte'
    - 'frontend/src/routes/[[lang=locale]]/(voters)/constituencies/+page.svelte'
    - 'frontend/src/routes/[[lang=locale]]/(voters)/intro/+page.svelte'
    - 'frontend/src/routes/[[lang=locale]]/(voters)/(located)/questions/+page.svelte'
    - 'frontend/src/routes/[[lang=locale]]/(voters)/(located)/questions/[questionId]/+page.svelte'
    - 'frontend/src/routes/[[lang=locale]]/(voters)/(located)/questions/category/[categoryId]/+page.svelte'
    - 'frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/+page.svelte'
    - 'frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/[entityType]/[entityId]/+page.svelte'
    - 'frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/statistics/+page.svelte'
    - 'frontend/src/routes/[[lang=locale]]/(voters)/about/+page.svelte'
    - 'frontend/src/routes/[[lang=locale]]/(voters)/info/+page.svelte'
    - 'frontend/src/routes/[[lang=locale]]/(voters)/privacy/+page.svelte'
    - 'frontend/src/routes/[[lang=locale]]/(voters)/nominations/+page.svelte'

key-decisions:
  - 'Used data-testid prop forwarding on shared components (Button, Tabs, AccordionSelect, etc.) rather than modifying component internals'
  - 'Added container-level testIds for static pages (about, info, privacy) since they lack interactive elements beyond the return button'
  - 'Used consistent voter- prefix with page-scoped naming for all 36 testIds'

patterns-established:
  - 'voter-{page}-{element} naming convention for voter app testIds'
  - 'Pass data-testid as prop to components using $$restProps pattern (Button, ElectionSelector, etc.)'

requirements-completed: [INFRA-01]

# Metrics
duration: 8min
completed: 2026-03-03
---

# Phase 1 Plan 3: Voter App Route TestIds Summary

**36 data-testid attributes added across all 14 voter app route pages using page-scoped kebab-case naming convention**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-03T19:58:20Z
- **Completed:** 2026-03-03T20:06:41Z
- **Tasks:** 1
- **Files modified:** 14

## Accomplishments

- All 14 voter route pages instrumented with data-testid attributes for E2E test selection
- 36 unique testId values following voter-{page}-{element} kebab-case convention
- Interactive elements (buttons, links, inputs, selects) and key containers all have stable selectors
- Zero functional changes -- only data-testid attribute additions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add testIds to voter page routes** - `36eee05` (feat)

**Plan metadata:** `52590aa` (docs: complete plan)

## Files Created/Modified

- `frontend/src/routes/[[lang=locale]]/(voters)/+page.svelte` - Home page: start button, info/about links
- `frontend/src/routes/[[lang=locale]]/(voters)/elections/+page.svelte` - Election list, continue button
- `frontend/src/routes/[[lang=locale]]/(voters)/constituencies/+page.svelte` - Constituency list, continue button
- `frontend/src/routes/[[lang=locale]]/(voters)/intro/+page.svelte` - Steps list, start button
- `frontend/src/routes/[[lang=locale]]/(voters)/(located)/questions/+page.svelte` - Category list/checkboxes, start button
- `frontend/src/routes/[[lang=locale]]/(voters)/(located)/questions/[questionId]/+page.svelte` - Heading, input, actions
- `frontend/src/routes/[[lang=locale]]/(voters)/(located)/questions/category/[categoryId]/+page.svelte` - Category intro, start/skip
- `frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/+page.svelte` - Ingress, election select, tabs, controls, list
- `frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/[entityType]/[entityId]/+page.svelte` - Entity detail
- `frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/statistics/+page.svelte` - Statistics container
- `frontend/src/routes/[[lang=locale]]/(voters)/about/+page.svelte` - Content, source link, return button
- `frontend/src/routes/[[lang=locale]]/(voters)/info/+page.svelte` - Content, return button
- `frontend/src/routes/[[lang=locale]]/(voters)/privacy/+page.svelte` - Content, return button
- `frontend/src/routes/[[lang=locale]]/(voters)/nominations/+page.svelte` - Container, controls, list

## TestId Inventory

| Page              | TestIds                                                                                                                                              | Elements                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Home              | voter-home-start, voter-home-info-link, voter-home-about-link                                                                                        | Button, link, link                                              |
| Elections         | voter-elections-list, voter-elections-continue                                                                                                       | ElectionSelector, Button                                        |
| Constituencies    | voter-constituencies-list, voter-constituencies-continue                                                                                             | ConstituencySelector, Button                                    |
| Intro             | voter-intro-steps, voter-intro-start                                                                                                                 | ol, Button                                                      |
| Questions (intro) | voter-questions-category-list, voter-questions-category-checkbox, voter-questions-start                                                              | div, input, Button                                              |
| Question (single) | voter-questions-heading, voter-questions-input, voter-questions-actions                                                                              | QuestionHeading, OpinionQuestionInput, QuestionActions          |
| Category intro    | voter-questions-category-intro, voter-questions-category-start, voter-questions-category-skip                                                        | HeadingGroup, Button, Button                                    |
| Results           | voter-results-ingress, voter-results-election-select, voter-results-container, voter-results-entity-tabs, voter-results-controls, voter-results-list | div, AccordionSelect, div, Tabs, EntityListControls, EntityList |
| Entity detail     | voter-entity-detail                                                                                                                                  | EntityDetails                                                   |
| Statistics        | voter-statistics-container                                                                                                                           | div                                                             |
| About             | voter-about-content, voter-about-source-link, voter-about-return                                                                                     | div, a, Button                                                  |
| Info              | voter-info-content, voter-info-return                                                                                                                | div, Button                                                     |
| Privacy           | voter-privacy-content, voter-privacy-return                                                                                                          | div, Button                                                     |
| Nominations       | voter-nominations-container, voter-nominations-controls, voter-nominations-list                                                                      | div, EntityListControls, EntityList                             |

## Decisions Made

- Used data-testid prop forwarding through $$restProps on shared components (Button, ElectionSelector, ConstituencySelector, AccordionSelect, Tabs, HeadingGroup, EntityList, EntityListControls, EntityDetails, QuestionHeading, OpinionQuestionInput, QuestionActions) rather than modifying component internals -- Plan 07 handles shared component instrumentation separately
- Added content-wrapper testIds for static pages (about, info, privacy) to enable page-level assertions even though primary interactive elements are limited to return buttons
- For the about page, wrapped the `{@html}` content in a div with data-testid since the template output had no wrapping element

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-commit hook (lint-staged) stashed working tree changes during commit, causing voter route files to be captured in a neighboring plan's metadata commit rather than their own atomic commit. The data-testid changes are correctly committed and all 14 files verified.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 14 voter route pages have stable data-testid selectors for Playwright E2E tests
- TestId values are ready for inclusion in the testIds.ts constants file (Plan 01)
- Voter app E2E test specs (Phase 3+) can now use getByTestId() for all interactive elements

## Self-Check: PASSED

- All 14 voter route files: FOUND with data-testid attributes
- Task commit 36eee05: FOUND in git history
- Total testId count: 36 across 14 files (exceeds minimum of 20)

---

_Phase: 01-infrastructure-foundation_
_Completed: 2026-03-03_
