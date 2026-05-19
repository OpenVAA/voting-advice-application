---
status: passed
phase: 02-candidate-app-coverage
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md
started: 2026-03-04T18:10:00Z
updated: 2026-03-07T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Candidate Auth Spec Passes
expected: Run `yarn test:e2e tests/tests/specs/candidate/candidate-auth.spec.ts` (with Docker stack running). All 4 tests pass: valid login, invalid login error, logout with modal, password change with restoration. No test failures or timeouts.
result: pass
notes: "All 4 tests pass in 10.6s. Password change test restores original password via API."

### 2. Candidate Registration Spec Passes
expected: Run `yarn test:e2e tests/tests/specs/candidate/candidate-registration.spec.ts`. All 3 tests pass: registration email send/extract from SES, registration completion via email link with login redirect, and password reset via SES email flow. No failures or timeouts.
result: pass
notes: "All 3 tests pass. Required project dependency fix: registration must run after auth spec (both change alpha candidate password)."

### 3. Candidate Profile Spec Passes
expected: Run `yarn test:e2e tests/tests/specs/candidate/candidate-profile.spec.ts`. All 4 tests pass: fresh candidate registration, image upload via filechooser, info field filling (text/number/date/boolean), and data persistence after reload. No failures or timeouts.
result: pass
notes: "All 4 tests pass in 24.4s. Uses test.unregistered2@openvaa.org (separate from registration spec candidate)."

### 4. Candidate Questions Spec Passes
expected: Run `yarn test:e2e tests/tests/specs/candidate/candidate-questions.spec.ts`. All 6 tests pass: question card display, Likert answering with comments, category navigation, answer editing, data persistence, and preview page EntityDetails verification. No failures or timeouts.
result: pass
notes: "All 6 tests pass. Runs in parallel with auth spec (different mutation targets, JWT unaffected by password changes)."

### 5. Candidate Settings Spec Passes
expected: Run `yarn test:e2e tests/tests/specs/candidate/candidate-settings.spec.ts`. All 6 describe blocks pass: answers locked mode, app disabled mode, maintenance mode, notification popup, help/privacy pages, and question visibility (hideHero toggle). Settings are restored to defaults after each block. No failures or timeouts.
result: pass
notes: "All 8 tests pass as part of full 28-test suite run (32.9s). Required isolation into separate candidate-app-settings project because it mutates global app settings."

### 6. Legacy Specs Removed
expected: Verify the 3 legacy spec files are gone: `tests/tests/candidateApp-basics.spec.ts`, `tests/tests/candidateApp-advanced.spec.ts`, `tests/tests/translations.spec.ts` should NOT exist. The `testIgnore` in `tests/playwright.config.ts` should only contain `['**/*.test.ts']`.
result: pass
notes: "All 3 legacy files confirmed deleted. testIgnore contains only ['**/*.test.ts']."

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0

## Gaps

### Fixed during UAT

- truth: "All candidate specs pass when run together"
  status: fixed
  reason: "Specs mutating shared backend state (passwords, users, app settings) failed when run in parallel."
  fix: "Split candidate-app into 3 sequential Playwright projects: candidate-app (auth+questions), candidate-app-mutation (registration+profile), candidate-app-settings (settings). Dependencies ensure sequential execution."
  artifacts:
    - path: "tests/playwright.config.ts"
      change: "Added candidate-app-mutation and candidate-app-settings projects with dependency chain"

- truth: "Playwright version mismatch resolved"
  status: fixed
  reason: "docs workspace had playwright@1.57.0, root @playwright/test@1.58.2 — dual versions caused 'test() not expected here' errors."
  fix: "Updated docs/package.json to @playwright/test@^1.58.2 and playwright@^1.58.2."
  artifacts:
    - path: "docs/package.json"
      change: "Bumped playwright deps from ^1.57.0 to ^1.58.2"
