# Phase 3: Voter App Core Journey - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Cover the voter happy path from landing page through results and entity detail pages (VOTE-01 through VOTE-12). Uses the simplest configuration: single election, single constituency (both auto-implied — no selection pages). No voter settings/popups (Phase 4), no multi-election/constituency variants (Phase 5), no locale testing (ADV-02).

</domain>

<decisions>
## Implementation Decisions

### Dataset structure
- Separate voter dataset JSON (`voter-dataset.json`) extending the default dataset — both imported in data-setup
- Split candidate-specific test data (candidates used only by candidate app specs, their nominations) into their own addendum (`candidate-addendum.json`) to decouple from voter data
- Default dataset keeps shared foundations: election, constituencies, question types, questions, question categories, parties
- Voter dataset adds: candidate answers for all Likert questions, plus edge-case candidates
- Most candidates get full Likert answers for deterministic match scoring
- One candidate with missing/partial answers (tests graceful handling)
- One candidate with full answers but terms of use not accepted (tests visibility filtering)
- Predictable answer values designed so match rankings are deterministic when voter answers all "Fully agree"

### Match ranking verification
- Ranking verification tests separated into their own spec file (`voter-matching.spec.ts`)
- Preferred approach: run the `@openvaa/matching` package algorithm independently on the same data, then verify displayed results match the computed output — decouples E2E tests from hardcoded expected rankings
- If running the matching algo independently isn't feasible, fall back to pre-computed expected rankings in the dataset

### Voter journey flow
- Simplest path configuration: single election + single constituency, both auto-implied by the `(located)` layout gate
- Flow: Home -> Intro -> Questions (all 8 Likert) -> Results -> Entity Detail
- Test the main intro page (step list + continue button); skip category intros (Phase 4 concern with `allowCategorySelection`)
- Answer all 8 Likert questions to exercise full question navigation (next, previous, skip, last-question behavior)
- Voter answers are saved in localStorage — each test must start with clean localStorage to avoid state leakage
- Testing localStorage recall (answer persistence across sessions) deferred to later

### Results and entity detail
- Test drawer interaction (click result card -> drawer opens) as the primary UX
- Direct URL navigation (`/results/candidate/[id]`) also tested if feasible within Phase 3, otherwise deferred
- Test both candidate AND party/organization detail pages (covers VOTE-11 and VOTE-12)
- Verify all EntityDetails tabs render (info, opinions, submatches) — assert content appears without deep field-level verification
- Entity tabs on results page (candidates vs organizations) tested by switching between them

### Spec file organization
- Split by page area:
  - `voter-journey.spec.ts` — Home -> Intro -> Questions flow
  - `voter-results.spec.ts` — Results display, entity tabs, candidate/party sections
  - `voter-detail.spec.ts` — Candidate and party detail pages, drawer interaction, tab navigation
  - `voter-matching.spec.ts` — Ranking verification (separate so it can be excluded if matching algo tests are sufficient)
- Serial mode within each spec file (tests represent sequential flow steps)
- Different spec files can run in parallel with each other
- All specs live in `tests/tests/specs/voter/` directory

### Voter fixture with answered questions
- Shared voter fixture that answers all questions and saves browser state (localStorage with answers)
- Results and detail specs reuse this fixture state for efficiency
- Fixture designed to accept parameters (e.g., answer count) to accommodate later tests with partial answers
- Journey spec does its own question answering (that IS the test)

### Component documentation
- Update `<!--@component` comments in voter page/component files when they don't already document user actions
- This improves traceability between source docs and test coverage
- No automated sync mechanism in this phase — manual reference only

### Claude's Discretion
- Page object design for voter pages (HomePage, IntroPage, ResultsPage, DetailPage, etc.)
- Whether direct URL detail navigation fits in Phase 3 or defers
- Exact fixture implementation for parameterizable voter answers
- How to integrate `@openvaa/matching` for independent ranking computation in tests
- Test assertions and error scenarios within each spec

</decisions>

<specifics>
## Specific Ideas

- Run the matching algorithm independently on test data and compare against displayed results — preferred over hardcoded expected rankings
- Voter fixture should be parameterizable for answer count to support future Phase 4 tests (minimum answers threshold)
- The `(located)` layout gate auto-redirects to election/constituency selection if params can't be implied — with single election + single constituency, it should pass through transparently

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `QuestionsPage` page object (voter): nextButton, previousButton, answerOption locators + selectAnswer/goNext/goPrevious/skip methods
- `testIds.voter`: 20+ testIds across home, elections, constituencies, intro, questions, results, entityDetail, nav namespaces
- `StrapiAdminClient`: importData, deleteData, findData — supports all needed collection types
- `buildRoute.ts`: Route URL builder utility in tests/tests/utils/
- `ROUTE` constants: All voter routes defined (Home, Intro, Questions, Results, ResultEntity, etc.)
- `default-dataset.json`: 1 election, 2 constituencies, 8 Likert + 4 info questions, 7 candidates, 2 parties
- `@openvaa/matching` package: Manhattan/Euclidean/directional distance metrics, Match objects with scores and subMatches

### Established Patterns
- Playwright `voter-app` project depends only on `data-setup` (no auth needed)
- 14 voter route files already have `data-testid` attributes from Phase 1
- Entity detail opens in Drawer via `beforeNavigate` + `pushState` pattern on results page
- EntityDetails component uses tabs (info/opinions/submatches) configured via `entityDetails.contents` setting
- Results page shows entity type tabs when multiple types exist (candidates + organizations)
- `fullyParallel: true` in Playwright config — each test gets its own browser context (clean localStorage)

### Integration Points
- `(located)/+layout.ts`: Gate that auto-implies election/constituency or redirects to selection pages
- Results page uses `getVoterContext()` for matches, answers, resultsAvailable
- `resultsAvailable` is true when voter has answered >= `matching.minimumAnswers` questions
- Entity detail reached via drawer (default) or direct URL `/results/[entityType]/[entityId]`
- Voter answers stored in localStorage via voter context

</code_context>

<deferred>
## Deferred Ideas

- Structured user action definitions in component docs with automated sync to test coverage — future milestone concern
- localStorage answer recall testing (persistence across sessions) — Phase 4 or later
- Category intro pages (`allowCategorySelection`) — Phase 4
- Multi-election and constituency selection flows — Phase 5
- Minimum answers threshold testing (results link appears after N answers) — Phase 4 (VOTE-07, VOTE-17)

</deferred>

---

*Phase: 03-voter-app-core-journey*
*Context gathered: 2026-03-07*
