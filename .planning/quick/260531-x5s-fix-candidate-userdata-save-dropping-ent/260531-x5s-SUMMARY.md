---
status: complete
phase: 260531-x5s
plan: 01
subsystem: frontend-candidate-data
tags: [bugfix, candidate, dataWriter, store, svelte5, tdd]
requires:
  - "@openvaa/data CandidateData / LocalizedAnswers"
provides:
  - "save() that merges answers into candidate.answers without dropping the entity id"
  - "Honest LocalizedAnswers return types for updateAnswers/overwriteAnswers"
  - "Regression test proving id survives two consecutive answers-only saves"
affects:
  - apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts
  - apps/frontend/src/lib/api/base/dataWriter.type.ts
  - apps/frontend/src/lib/api/base/universalDataWriter.ts
tech-stack:
  added: []
  patterns:
    - "Distinct handling of two API return shapes (LocalizedAnswers vs LocalizedCandidateData) in a single save() method"
    - "$effect.root + flushSync harness for unit-testing a Svelte 5 rune store"
key-files:
  created:
    - apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.test.ts
  modified:
    - apps/frontend/src/lib/api/base/dataWriter.type.ts
    - apps/frontend/src/lib/api/base/universalDataWriter.ts
    - apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts
decisions:
  - "Route mergeCandidateAnswers through the existing updateCandidateData setter and cast the merged map to LocalizedCandidateData['answers'] to satisfy the Answers & LocalizedAnswers intersection type"
  - "Mock $app/environment with browser:true in the store test so prepareDataWriter + localStorageWritable operate (default app-environment stub sets browser:false)"
metrics:
  duration: ~25min
  completed: 2026-06-01
---

# Phase 260531-x5s Plan 01: Fix candidate userData save dropping entity id Summary

Fixed the candidate `userData.save()` bug where an answers-only save replaced the whole `savedData.candidate` with the bare answers map returned by `updateAnswers`, dropping the entity `id`; subsequent saves then sent `p_entity_id: undefined` to `upsert_answers`, producing a PostgREST 404.

## What Changed

### Task 1 — Honest answer-setter return types (commit `58df5550a`)
- `dataWriter.type.ts`: `updateAnswers` / `overwriteAnswers` now return `DWReturnType<LocalizedAnswers, TType>` (was `LocalizedCandidateData`). JSDoc `@returns` + the section comment updated to state answer setters return only the updated answers map while the property setter returns the whole candidate.
- `universalDataWriter.ts`: public `updateAnswers` / `overwriteAnswers` and the abstract `_setAnswers` declaration now return `DWReturnType<LocalizedAnswers>` (matching the already-honest supabase concrete impl). Added `LocalizedAnswers` to the type imports.
- This deliberately surfaced the store's `save()` type-lie (resolved in Task 2). `updateEntityProperties` left unchanged (correctly returns `LocalizedCandidateData`).

### Task 2 — Merge answers + regression test (TDD: RED `0b82b07fc`, GREEN `89a847438`)
- New `mergeCandidateAnswers(answers)` helper next to `updateCandidateData`: merges the updated answers into the existing candidate's `answers` (preserving `id`, `firstName`, `image`, `termsOfUseAccepted`, etc.) and throws the same "data is loaded" guard.
- `save()` now uses two distinct locals — `updatedAnswers: LocalizedAnswers | undefined` (merged via `mergeCandidateAnswers`) and `updatedCandidate: LocalizedCandidateData | undefined` (wholesale-replaced via `updateCandidateData`). Answers merge applies first; the properties replace (which returns the full candidate from the DB) applies last, preserving the combined-case behavior.
- New `candidateUserDataStore.svelte.test.ts` with 3 tests (see Verification).

## Verification

- `yarn vitest run candidateUserDataStore.svelte.test.ts` — 3/3 PASS:
  - Test 1: two consecutive answers-only saves both call `updateAnswers` with `target.id === 'cand-1'` (was `undefined` on the 2nd call in RED).
  - Test 2: answers-only save preserves `id` + `firstName` and merges the answer into `candidate.answers` (`answers.q1 === { value: 3 }`).
  - Test 3: properties-only save still replaces the candidate, `id` + `termsOfUseAccepted` intact; `updateAnswers` not called.
- `yarn vitest run supabaseDataWriter.test.ts` — 34/34 PASS unchanged (bare-answers-map contract assertions intact).
- `yarn tsc --noEmit` — no type errors in the four touched files (the new `save()` type-lie error is resolved).
- `yarn eslint` on the four touched files — clean.

RED was confirmed for the right reason: Tests 1+2 failed with `received: undefined` for the candidate `id`, directly reproducing the dropped-id root cause; Test 3 (properties path) passed in RED, confirming the property path was already correct.

### Out of scope / manual
- E2E regression guard `tests/tests/specs/candidate/candidate-mega-journey.spec.ts` step 13.5 (requires Supabase + dev server) was NOT run here. It is the higher-level guard: post-fix it must no longer time out on `candidate-home-status` and the "problem saving your answers" toast must not appear.

## Deviations from Plan

None functionally — plan executed as written. Two small mechanical adjustments inside the sanctioned approach:
1. **[Rule 3 - Blocking] Type intersection on `candidate.answers`.** `LocalizedCandidateData.answers` resolves to `Answers & LocalizedAnswers` (CandidateData/EntityData base intersected with the override), so the merged map could not be assigned directly. Routed `mergeCandidateAnswers` through the existing `updateCandidateData` setter and cast the merged map to `LocalizedCandidateData['answers']` (mirrors the existing `_current` derived cast). Commit `89a847438`.
2. **[Rule 3 - Blocking] Test environment.** The default `$app/environment` test stub sets `browser = false`, which makes `prepareDataWriter` throw and `localStorageWritable` skip persistence. Added a per-file `vi.mock('$app/environment', { browser: true })` and a `FakeTarget` param type on the fake writer vi.fns so `target` is visible to the call-arg assertions. Commit `89a847438`.

## Pre-existing Issues (NOT introduced, NOT fixed — out of scope)

`yarn tsc --noEmit` reports 15 errors confined to `supabaseDataWriter.ts` / `supabaseDataWriter.test.ts` (stale generated supabase-types: `p_entity_id` / `get_candidate_user_data` / `merge_custom_data` RPC signatures, plus test-setup `serverClient` / `password` arg mismatches). Verified present on the base commit `b98bebbc9` before any change in this plan (15 matches). These do not block the runtime fix and the supabase unit tests pass 34/34.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, file access, or schema changes. The `upsert_answers` DB function and migrations are unchanged.

## Self-Check: PASSED

All 4 touched/created source files and the SUMMARY exist on disk; all 3 commits (`58df5550a`, `0b82b07fc`, `89a847438`) are present in git history.
