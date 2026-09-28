---
status: complete
phase: 07-advanced-test-capabilities
source: [07-01-SUMMARY.md, 07-02-SUMMARY.md]
started: 2026-03-11T17:00:00Z
updated: 2026-03-11T17:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Baseline Screenshots Exist in Git
expected: 4 baseline PNG files exist under tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/: voter-results-desktop.png, voter-results-mobile.png, candidate-preview-desktop.png, candidate-preview-mobile.png
result: pass

### 2. Default E2E Excludes Visual and Perf Tests
expected: Running `yarn test:e2e` does NOT execute any visual or performance tests. Only the standard E2E suite runs (~85 tests). No tests tagged @visual or @perf are discovered.
result: pass

### 3. Visual Regression Tests Pass
expected: Running `PLAYWRIGHT_VISUAL=1 npx playwright test -c tests/playwright.config.ts --project=visual-regression` discovers and passes all 4 visual tests (voter results desktop/mobile, candidate preview desktop/mobile). Screenshots are compared against baselines.
result: pass

### 4. Performance Budget Test Passes
expected: Running `PLAYWRIGHT_PERF=1 npx playwright test -c tests/playwright.config.ts --project=performance` discovers and passes the performance budget test. Voter results page load timing is measured via Navigation Timing API and is within budget (8s DOMContentLoaded, 15s full load).
result: pass

### 5. CI Workflow Has Non-Blocking Visual/Perf Job
expected: .github/workflows/main.yaml contains an e2e-visual-perf job that runs visual and perf tests with continue-on-error: true, sets PLAYWRIGHT_VISUAL=1 and PLAYWRIGHT_PERF=1 env vars, and uploads a distinct report artifact.
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
