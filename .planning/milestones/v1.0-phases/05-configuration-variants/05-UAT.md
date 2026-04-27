---
status: complete
phase: 05-configuration-variants
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md
started: 2026-03-09T20:00:00Z
updated: 2026-03-10T12:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 6
name: Variant teardown cleans up correctly
expected: |
  After all variant tests complete, the shared teardown deletes all test-prefixed entities from Strapi. Run: `yarn test:e2e --project=data-teardown-variants` and verify it passes without errors.
awaiting: complete

## Tests

### 1. Variant overlay datasets load without errors
expected: Run the variant data setup for multi-election. The overlay merges with the base dataset and imports into Strapi without errors. The setup project passes (no import failures, no schema mismatches). Run: `yarn test:e2e --project=data-setup-multi-election` (requires Docker stack running via `yarn dev`)
result: PASS — all overlay datasets (multi-election, constituency, startfromcg) import successfully

### 2. Multi-election voter journey tests pass
expected: The multi-election spec runs 5 tests: election selection page shows 2 elections, full question journey with per-election results accordion, constituency auto-implication, election-specific questions, and disallowSelection mode. Run: `yarn test:e2e --project=variant-multi-election`
result: PASS — 5/5 tests pass

### 3. Results sections configuration tests pass
expected: The results-sections spec runs 3 tests: candidates-only shows only candidate cards, organizations-only shows only party cards, both-sections shows tabbed view with both. Run: `yarn test:e2e --project=variant-results-sections`
result: PASS — 3/3 tests pass

### 4. Constituency selection tests pass
expected: The constituency spec runs 6 tests: constituency page appears after election selection, constituency selection via combobox works, question journey completes with no false nominations warning, election accordion shows, results are filtered by selected constituency, and missing nominations warning triggers for partial-coverage constituency. Run: `yarn test:e2e --project=variant-constituency`
result: PASS — 6/6 tests pass (includes missing nominations warning verification)

### 5. startFromConstituencyGroup reversed flow tests pass
expected: The startfromcg spec runs 4 tests: constituencies shown before elections (reversed flow), election selection after constituency, full journey completes, and orphan municipality navigates without runtime errors. Run: `yarn test:e2e --project=variant-startfromcg`
result: PASS — 4/4 tests pass

### 6. Variant teardown cleans up correctly
expected: After all variant tests complete, the shared teardown deletes all test-prefixed entities from Strapi. Run: `yarn test:e2e --project=data-teardown-variants` and verify it passes without errors.
result: PASS — teardown completes successfully

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0

## Gaps

None — all variant tests pass including missing nominations warning coverage.

## Notes

- App bug fixed during UAT: electionId redirect loop in `(voters)/(located)/+layout.ts` when `constituencyId` was missing but `electionId` was present
- Playwright config fix: data-setup-multi-election dependency changed from teardown to app-settings projects
- Multi-election accordion pattern handled across all variant specs
- Missing nominations warning explicitly tested: East Municipality has election-1 nominations only, triggering "some nominations" dialog with per-election availability indicators
