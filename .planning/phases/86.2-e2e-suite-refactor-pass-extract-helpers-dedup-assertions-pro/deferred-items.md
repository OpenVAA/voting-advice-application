# Phase 86.2-01 Deferred Items

## Pre-existing bug in voter-not-located-redirect.spec.ts:195

- **Location:** `tests/tests/specs/voter/voter-not-located-redirect.spec.ts:195` (was line 206 before Plan 86.2-01 fillAllConstituencies shrink).
- **Symptom:** Parsing error `expect( , 'electionUuid must be discovered in beforeAll').toBeTruthy()` — empty first argument.
- **Likely intent:** `expect(electionUuid, 'electionUuid must be discovered in beforeAll').toBeTruthy()`.
- **Origin:** Pre-existing from commit `97f55cb41 chore(87-post-fix)` — confirmed via `git stash` round-trip.
- **Scope:** Out of Plan 86.2-01 scope per D-02 (87-post-fix treated as final) + general scope boundary (Plan 86.2-01 = helper extraction + anchor refactor, NOT pre-existing bug fix).
- **Impact:** Causes `tsc --noEmit` and `eslint` to error on this file; the 3rd test in the spec ("election pre-selected via URL bounces only to constituency selector") would fail at runtime.
- **Disposition:** Surface in SUMMARY.md as a pre-existing issue; route to Phase 86.3 (test-authoring phase) or a follow-up hygiene plan.
