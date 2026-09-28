# Phase 4: Voter App Settings and Edge Cases - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Test all configuration-driven voter features, optional pages, and UI behaviors (VOTE-04, VOTE-05, VOTE-07, VOTE-13, VOTE-15, VOTE-16, VOTE-17, VOTE-18, VOTE-19). Covers settings-toggled flows (category selection, question/category intros, minimum answers threshold), popups (feedback, survey), and static info pages (about, info, privacy, nominations). Statistics page (VOTE-14) is skipped — it's WIP and unstable. No multi-election/constituency variants (Phase 5), no locale testing (ADV-02).

</domain>

<decisions>
## Implementation Decisions

### Settings toggling strategy
- Per-test API toggle via `strapiAdminClient.updateAppSettings()` — same pattern as Phase 2 app-mode tests
- Each describe block enables settings it needs in beforeAll, restores defaults in afterAll — self-contained and independently runnable
- No separate datasets or Playwright projects needed — reuse existing data-setup with runtime settings changes
- Phase 3's data.setup.ts defaults (categoryIntros.show: false, questionsIntro.allowCategorySelection: false, questionsIntro.show: false) remain unchanged

### Category selection and intros (VOTE-04, VOTE-05, VOTE-13)
- Enable `questionsIntro.show`, `questionsIntro.allowCategorySelection`, and `categoryIntros.show` via API
- Select a subset of categories (1-2 out of available), verify only those questions appear, answer them, reach results — tests filtering behavior end-to-end
- Category intro pages: verify intro renders when `categoryIntros.show: true`, test skip button when `categoryIntros.allowSkip: true` — clicking skip bypasses that category's questions
- Question intro page: verify shown/hidden based on `questionsIntro.show` setting

### Minimum answers threshold (VOTE-07, VOTE-17)
- Test boundary with progressive answering: start with 0 answers (verify results link hidden/disabled), answer 1 question (still below threshold), then answer enough to cross threshold
- Results link in header (VOTE-17): verify disabled state below threshold, enabled state above threshold
- Uses `questions.showResultsLink: true` setting combined with `matching.minimumAnswers` threshold

### Popup timing (VOTE-15, VOTE-16)
- Set popup delays to 1-2 seconds via API (not 0) to verify timing mechanism without long waits
- Feedback popup (VOTE-15): verify appears after delay on results page, check popup has expected heading and key interactive element
- Survey popup (VOTE-16): verify appears after delay, check for survey link element
- Test both states: verify popups appear when enabled, verify popups DON'T appear when setting is null/disabled
- Test dismissal memory: after dismissing a popup, verify it doesn't reappear on page reload (userPreferences storage behavior)

### Static pages (VOTE-18, VOTE-19)
- Verification level: renders without error + 1-2 key elements (heading, main content area). Light smoke test, not content verification
- About, info, privacy pages: navigate, verify render, check key element
- Nominations page (VOTE-19): enable `showAllNominations` via API, navigate, verify page renders with candidate/party entries visible. Also verify NOT accessible when setting is disabled
- Statistics page (VOTE-14): SKIPPED — WIP in codebase, too unstable for E2E tests

### Spec file organization
- 3 spec files grouped by feature type:
  - `voter-settings.spec.ts` — category selection, question/category intros, minimum answers threshold, results link
  - `voter-popups.spec.ts` — feedback popup, survey popup, dismissal memory
  - `voter-static-pages.spec.ts` — about, info, privacy, nominations
- voter-settings: serial within each describe block (shared toggled state), different describe blocks parallel-safe via self-contained setup/teardown
- voter-popups: serial within describe blocks (popup timing depends on page state)
- voter-static-pages: parallel execution (independent pages, no shared state)

### Claude's Discretion
- Page object design for new voter pages (StaticPage, NominationsPage, CategoryIntroPage, QuestionIntroPage)
- Exact testIds needed for new elements (popup containers, category intro skip button, nominations list)
- How to wait for popup appearance (Playwright waitFor with timeout matching delay + buffer)
- Whether nominations page needs its own page object or shares with a generic pattern
- Exact threshold value used in minimum answers test

</decisions>

<specifics>
## Specific Ideas

- Category intro skip button must be explicitly tested — enable categoryIntros.show + categoryIntros.allowSkip, verify skip button appears, click it, verify category's questions are bypassed
- Popup dismissal memory test verifies real persistence behavior via userPreferences in localStorage
- Voter fixture parameterizable answer count (from Phase 3) should be leveraged for threshold testing

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `strapiAdminClient.updateAppSettings()`: Already used in data.setup.ts for settings — reuse for per-test toggling
- `QuestionsPage` page object: answer, next/previous navigation, skip methods — reuse for category-filtered question flow
- `ResultsPage` page object: card clicking, tab switching — reuse for popup verification context
- `IntroPage` page object: startButton locator + clickStart() — extend for question intro page
- `answeredVoterPage` fixture: Completes full voter journey to results — reuse for popup tests
- `testIds.voter.questions.categoryIntro`: Already exists for category intro element
- `testIds.voter.nav.resultsLink`: Already exists for header results link

### Established Patterns
- Per-test settings toggle with afterAll restore (Phase 2 app-mode pattern)
- Voter fixture with parameterizable answer count (Phase 3)
- Serial describe blocks within spec files (Phase 3)
- `assert { type: 'json' }` for JSON imports
- Page objects via Playwright fixtures (`test.extend<Fixtures>()`)

### Integration Points
- `appSettings.questions.questionsIntro.show` / `.allowCategorySelection` — controls question intro page
- `appSettings.questions.categoryIntros.show` / `.allowSkip` — controls category intro pages
- `appSettings.questions.showResultsLink` — controls header results link visibility
- `appSettings.matching.minimumAnswers` — threshold for resultsAvailable
- `appSettings.results.showFeedbackPopup` — delay in seconds (number or null)
- `appSettings.results.showSurveyPopup` + `appSettings.survey.showIn` includes 'resultsPopup'
- `appSettings.entities.showAllNominations` — controls nominations page access
- Popup countdown in `appContext.ts`: `startFeedbackPopupCountdown(delay)` / `startSurveyPopupCountdown(delay)`
- `userPreferences.feedback.status` / `userPreferences.survey.status` — dismissal memory in localStorage
- Results link in `Banner.svelte`: disabled when `!resultsAvailable`, hidden when `showResultsLink !== 'show'`

</code_context>

<deferred>
## Deferred Ideas

- Statistics page testing (VOTE-14) — deferred until page is no longer WIP
- localStorage answer recall testing (persistence across sessions) — deferred from Phase 3

</deferred>

---

*Phase: 04-voter-app-settings-and-edge-cases*
*Context gathered: 2026-03-08*
