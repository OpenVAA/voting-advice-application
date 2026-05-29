---
status: partial
phase: 89-continuing-test-refactoring-implement-the-new-candidate-jour
source: [89-VERIFICATION.md]
started: 2026-05-29T12:35:00Z
updated: 2026-05-29T12:35:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. candidate-mega-journey 3-run cold-start determinism gate
expected: 3 consecutive `cd tests && npx playwright test --project=candidate-mega-journey --reporter=list` cold-start runs after `yarn db:reset && yarn db:seed --template baseV1` produce PASS-identical 22/22 step outcomes. Each run ≤ ~120s. Post-teardown `auth.users` table contains 0 rows where email LIKE '%unregistered-aa@test%'.
result: [pending]

### 2. voter-mega-journey post-89-01 lockstep cold-start
expected: `cd tests && npx playwright test --project=voter-mega-journey --reporter=list` cold-start passes with the 4 new strict assertion groups (Q1 emoji hero + info-button click, Q2 image hero + info-button absent, QG-Opin-Base category hero image, candidate-details info-tab 13→14 + north-only present / mun-only/south-only absent). Run ≤ ~90s.
result: [pending]

### 3. 3 perm specs PASS independently + cross-chain isolation smoke
expected: Per-perm runs `cd tests && npx playwright test --project=perm-disable-voter-app --reporter=list` (and -candidate-app, -per-app-notifications) PASS independently after `yarn db:reset && yarn dev`. Cross-chain combined run `cd tests && npx playwright test --project=candidate-mega-journey --project=perm-disable-voter-app --project=perm-disable-candidate-app --project=perm-per-app-notifications --reporter=list` PASSes (proves distinct-prefix decoupling).
result: [pending]

### 4. Full e2e suite green in default + PLAYWRIGHT_LEGACY=1 modes
expected: Run A: `yarn db:reset && yarn db:seed --template baseV1 && yarn test:e2e` exits 0. Run B: `cd tests && PLAYWRIGHT_LEGACY=1 yarn test:e2e` exits 0. No 'spec file not found' errors; no orphan testIgnore references; both modes execute the post-retirement catalog cleanly.
result: [pending]

### 5. auth.users teardown ordering proof
expected: After a full candidate-mega chain run + teardown, `psql -c "select count(*) from auth.users where email = 'unregistered-aa@test.openvaa.local'"` returns 0. R4 binding: unregisterCandidate must run BEFORE runTeardown('test-').
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
