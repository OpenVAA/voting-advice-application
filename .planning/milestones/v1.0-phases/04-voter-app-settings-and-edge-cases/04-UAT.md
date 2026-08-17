---
status: resolved
phase: 04-voter-app-settings-and-edge-cases
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md]
started: 2026-03-08T19:10:00Z
updated: 2026-03-08T21:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Category Selection Filtering
expected: With category selection enabled, the voter questions page shows category checkboxes. Deselecting all then selecting one category filters questions to only that category's questions.
result: issue
reported: "voter-settings.spec.ts first test fails - afterBeforeAll updateAppSettings changes questionsIntro.show to true which changes navigation flow. Test clicks home start, then waits for intro start, but navigation may skip intro. The updateAppSettings call may also partially overwrite sibling settings."
severity: major

### 2. Category & Question Intros
expected: When categoryIntros and questionsIntro settings are enabled, intro text/screens appear before the category and question pages respectively.
result: skipped
reason: Blocked by test 1 failure (serial mode)

### 3. Minimum Answers Threshold
expected: The results link in the banner does NOT appear until the voter has answered enough questions to meet the minimum answers threshold.
result: skipped
reason: Blocked by test 1 failure (serial mode)

### 4. Feedback Popup on Results Page
expected: Feedback popup appears after delay on results page. Dismissal persists via localStorage.
result: issue
reported: "voter-popups.spec.ts answeredVoterPage fixture fails. The fixture navigates Home->Intro->Questions->Results but fails at voter-home-start click. The beforeAll updateAppSettings call likely corrupts settings needed for the voter journey flow. Also beforeAll runs before fixture which modifies settings the fixture depends on."
severity: major

### 5. Survey Popup Configuration
expected: Survey popup appears with configured link on results page.
result: issue
reported: "Same root cause as test 4 - answeredVoterPage fixture fails due to settings mutation in beforeAll."
severity: major

### 6. Popups Disabled State
expected: Neither popup appears when settings are null/disabled.
result: issue
reported: "Same root cause as test 4 - answeredVoterPage fixture fails."
severity: major

### 7. Static Pages Render
expected: About, info, and privacy pages render with content, return button, and h1 heading.
result: pass

### 8. Nominations Page Gate
expected: Nominations page shows entity cards when enabled, redirects when disabled.
result: issue
reported: "voter-nominations-container testId not found when showAllNominations is enabled. The nominations page may need additional data (e.g., published nominations with test- prefix) or the page rendering depends on settings that were corrupted by concurrent test runs."
severity: major

### 9. E2E Specs Pass
expected: All three spec files pass via Playwright.
result: issue
reported: "Only 6/18 tests pass. Root causes: (1) buildRoute returned URLs without leading / causing invalid navigation - FIXED. (2) voterContext.ts crashed on null cardContents value - FIXED. (3) voter-settings and voter-popups specs have settings mutation issues where beforeAll updateAppSettings corrupts the voter journey flow. (4) nominations page testId not found."
severity: blocker

## Summary

total: 9
passed: 1
issues: 6
pending: 0
skipped: 2

## Gaps

- truth: "Category selection E2E test passes with allowCategorySelection enabled"
  status: resolved
  reason: "User reported: voter-settings spec first test fails because updateAppSettings in beforeAll changes navigation flow. After settings change, home->intro path may differ from expected."
  severity: major
  test: 1
  root_cause: "voter-settings.spec.ts beforeAll sets questionsIntro.show:true but the test assumes Home->Intro->QuestionsIntro navigation. The updateAppSettings may partially overwrite the questions component, losing showCategoryTags or other sibling fields."
  artifacts:
    - path: "tests/tests/specs/voter/voter-settings.spec.ts"
      issue: "Settings mutation in beforeAll breaks navigation flow"
  missing:
    - "Ensure updateAppSettings sends complete sibling settings to avoid partial overwrites"
    - "Add wait/reload after settings change to ensure frontend picks up new settings"
  debug_session: ""

- truth: "Feedback/survey popups appear and can be dismissed on results page"
  status: resolved
  reason: "User reported: answeredVoterPage fixture fails because beforeAll settings mutation breaks voter journey navigation"
  severity: major
  test: 4
  root_cause: "voter-popups.spec.ts beforeAll runs updateAppSettings with results/survey/notifications settings BEFORE the answeredVoterPage fixture navigates the voter journey. The settings change may corrupt the voter app state (e.g., setting notifications.voterApp.show:false may affect page rendering)."
  artifacts:
    - path: "tests/tests/specs/voter/voter-popups.spec.ts"
      issue: "beforeAll settings mutation conflicts with answeredVoterPage fixture"
    - path: "tests/tests/fixtures/voter.fixture.ts"
      issue: "Fixture assumes default settings but specs modify settings before fixture runs"
  missing:
    - "Separate settings mutation from voter journey navigation - apply settings AFTER reaching results page, or use page.evaluate to set localStorage directly"
  debug_session: ""

- truth: "Nominations page renders with entity cards when showAllNominations enabled"
  status: resolved
  reason: "User reported: voter-nominations-container testId not found even with showAllNominations:true"
  severity: major
  test: 8
  root_cause: "Nominations page may require published nominations with valid candidate data. The test data imports nominations but the page rendering may depend on additional conditions (e.g., candidate visibility, constituency filtering) that aren't met."
  artifacts:
    - path: "tests/tests/specs/voter/voter-static-pages.spec.ts"
      issue: "Nominations test assertions don't account for data requirements"
  missing:
    - "Verify nominations page data requirements and ensure test data meets them"
  debug_session: ""

- truth: "buildRoute returns valid URLs for page.goto()"
  status: fixed
  reason: "buildRoute stripped leading / from paths, causing 'Cannot navigate to invalid URL' errors"
  severity: blocker
  test: 9
  root_cause: "buildRoute.ts line 20 had .replace(/^\\/+/, '') which stripped the leading slash from all routes"
  artifacts:
    - path: "tests/tests/utils/buildRoute.ts"
      issue: "Leading slash stripped from route paths"
  missing: []
  debug_session: ""

- truth: "Voter app loads without crashing on null cardContents"
  status: fixed
  reason: "voterContext.ts crashed with 'Cannot read properties of null (reading includes)' when appSettings.results.cardContents had null values"
  severity: blocker
  test: 9
  root_cause: "voterContext.ts line 205: .filter(([, value]) => value.includes('submatches')) called .includes() on null value. Missing optional chaining."
  artifacts:
    - path: "frontend/src/lib/contexts/voter/voterContext.ts"
      issue: "Missing null safety on cardContents value"
  missing: []
  debug_session: ""
