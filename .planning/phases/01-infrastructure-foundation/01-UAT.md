---
status: diagnosed
phase: 01-infrastructure-foundation
source: 01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md, 01-05-SUMMARY.md, 01-06-SUMMARY.md, 01-07-SUMMARY.md, 01-08-SUMMARY.md, 01-09-SUMMARY.md, 01-10-SUMMARY.md
started: 2026-03-04T08:00:00Z
updated: 2026-03-04T08:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Playwright 5-Project Config
expected: Running `npx playwright test --list` from the tests/ directory shows 5 projects: data-setup, data-teardown, auth-setup, candidate-app, voter-app with correct dependency chain.
result: issue
reported: "Playwright scans too broadly - picks up vitest files from backend/frontend, legacy spec files with test.describe.configure() errors due to dual @playwright/test versions, SvelteKit $env imports, and TypeScript declare field errors. Result: 0 tests found."
severity: blocker

### 2. Frontend Builds After TestId Additions
expected: Running `yarn workspace @openvaa/frontend build` (or `yarn build:app-shared && yarn workspace @openvaa/frontend build`) completes without errors. The 100+ data-testid attribute additions across 30+ Svelte files should cause zero build regressions.
result: pass

### 3. ESLint Playwright Rules Active
expected: Running ESLint on the tests directory applies Playwright-specific rules. Legacy test files should produce errors for anti-patterns like waitForTimeout and raw locators. The rules no-wait-for-timeout, no-raw-locators, and prefer-web-first-assertions should be enforced as errors.
result: pass

### 4. Test Dataset Valid and Complete
expected: The file `tests/tests/data/default-dataset.json` exists and contains valid JSON with 9 collections: election, questionTypes, questionCategories, questions, parties, candidates, nominations, constituencies, and answers. All externalId values are prefixed with "test-".
result: pass

### 5. TestIds Constants Match DOM Elements
expected: Every constant in `tests/tests/utils/testIds.ts` has a corresponding `data-testid` attribute in the Svelte source files. No orphaned constants (testIds defined in the constants file but missing from the DOM). Running a grep for each testId value finds at least one matching Svelte file.
result: issue
reported: "4 orphaned testIds with no matching DOM elements: candidate-questions-next, candidate-questions-previous (candidate question detail page has save but no next/previous navigation), voter-questions-card (voter questions page doesn't wrap question cards), loading-indicator (no loading/spinner component has this testId). Remaining 43 testIds all have matching data-testid attributes."
severity: minor

### 6. Page Objects and Fixtures Compile
expected: TypeScript compilation of the test files succeeds. `npx tsc --noEmit -p tests/tsconfig.json` (or equivalent) shows no type errors in the new fixtures, page objects, and utility files (fixtures/index.ts, auth.fixture.ts, LoginPage.ts, HomePage.ts, QuestionsPage.ts, strapiAdminClient.ts).
result: skipped
reason: No tsconfig.json exists in the tests directory - tests folder is not a standalone TypeScript package.

## Summary

total: 6
passed: 3
issues: 2
pending: 0
skipped: 1

## Gaps

- truth: "Playwright 5-project config lists all projects and discovers tests correctly"
  status: failed
  reason: "User reported: Playwright scans too broadly - picks up vitest files from backend/frontend, legacy spec files with test.describe.configure() errors due to dual @playwright/test versions, SvelteKit $env imports, and TypeScript declare field errors. Result: 0 tests found."
  severity: blocker
  test: 1
  root_cause: "Global testDir set to ./tests/tests/ scans everything recursively. Legacy spec files at tests/tests/*.spec.ts (not in specs/ subdirectory) cause test.describe.configure() errors. No testIgnore pattern excludes vitest files from backend/frontend/packages or legacy specs."
  artifacts:
    - path: "tests/playwright.config.ts"
      issue: "testDir too broad, missing testIgnore patterns"
    - path: "tests/tests/candidateApp-basics.spec.ts"
      issue: "Legacy spec at root of tests/tests/ instead of specs/ subdirectory"
    - path: "tests/tests/candidateApp-advanced.spec.ts"
      issue: "Legacy spec at root of tests/tests/ instead of specs/ subdirectory"
    - path: "tests/tests/translations.spec.ts"
      issue: "Legacy spec importing SvelteKit $env indirectly"
  missing:
    - "Add testIgnore patterns to playwright.config.ts for legacy specs and non-Playwright files"
    - "Or move legacy specs into specs/ subdirectories and restrict testMatch"

- truth: "Every testIds.ts constant has a matching data-testid in Svelte source files"
  status: failed
  reason: "User reported: 4 orphaned testIds with no matching DOM elements: candidate-questions-next, candidate-questions-previous, voter-questions-card, loading-indicator. 43/47 constants are correctly wired."
  severity: minor
  test: 5
  root_cause: "candidate-questions-next/previous: Candidate question page uses custom save/cancel buttons, not QuestionActions with next/previous. voter-questions-card: Voter questions page displays single question with input/actions, not card layout. loading-indicator: Loading.svelte component exists but has no data-testid attribute."
  artifacts:
    - path: "tests/tests/utils/testIds.ts"
      issue: "3 constants reference non-existent DOM concepts (next/previous/card); 1 constant references existing component missing testId"
    - path: "frontend/src/lib/components/loading/Loading.svelte"
      issue: "Component exists but lacks data-testid='loading-indicator'"
  missing:
    - "Remove candidate.questions.nextButton, candidate.questions.previousButton, voter.questions.card from testIds.ts"
    - "Add data-testid='loading-indicator' to Loading.svelte outer div"
