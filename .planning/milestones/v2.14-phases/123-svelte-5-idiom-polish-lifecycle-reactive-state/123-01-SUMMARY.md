---
phase: 123-svelte-5-idiom-polish-lifecycle-reactive-state
plan: 01
subsystem: testing
tags: [svelte5, runes, effect-root, vitest, candidate-context, svelte-check, regression-test]

requires:
  - phase: 122-e2e-specs-bank-auth-round-trip
    provides: clean phase-start tree (HEAD fd97bb7) for the criterion-4 baseline capture
provides:
  - Pinned svelte-check baseline artifact (123-BASELINE.md — 151 errors / 1 warning, criterion-4 reference)
  - NEW candidateContext.svelte.test.ts (RUNES-05 Bug 1 RED regression test — entityType in blocks path)
  - Confirmed + documented A2 test-construction seam (spy-on-collaborator under $effect.root, NO pure-helper extract)
  - $app/navigation vitest alias + stub mock (test-infra enabler for context unit tests)
affects: [123-02 (turns the Bug-1 test green via the one-line :378 fix), all downstream 123 plans (criterion-4 gate)]

tech-stack:
  added: []
  patterns:
    - "Spy-on-collaborator $effect.root harness for the candidate context provider (fake DataRoot whose getApplicableQuestions is a vi.fn() spy)"
    - "$app/navigation resolvable test-mock stub + vitest alias (enables unit-testing modules that transitively import $app/navigation)"

key-files:
  created:
    - .planning/phases/123-svelte-5-idiom-polish-lifecycle-reactive-state/123-BASELINE.md
    - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts
    - apps/frontend/src/lib/i18n/tests/__mocks__/app-navigation.ts
  modified:
    - apps/frontend/vitest.config.ts

key-decisions:
  - "A2 seam = spy-on-collaborator under $effect.root driving the REAL CandidateContextProvider (no production refactor / no pure-helper extract). Lower-risk per RESEARCH; the entityType assertion holds either way."
  - "Pinned baseline = 151 errors / 1 warning (delta 0 vs RESEARCH figure) — authoritative criterion-4 reference."
  - "Added a $app/navigation alias + stub to vitest.config (Rule 3 test-infra enabler) because vite import-analysis cannot resolve the candidate context's transitive $app/navigation import under the bare vitest config."

patterns-established:
  - "Context-provider unit test: vi.mock ../app + ../auth + inheritContextMembers + candidateUserDataState.svelte + $lib/api/dataWriter, then construct the real provider inside $effect.root + flushSync, assert on a shared vi.hoisted spy's mock.calls."

metrics:
  duration: ~12min
  completed: 2026-06-17
---

# Phase 123 Plan 01: Wave-0 Scaffolding (svelte-check baseline + Bug-1 RED test) Summary

Stood up the RUNES-05 Wave-0 scaffolding: pinned the svelte-check baseline as a committed criterion-4 reference, and authored the NEW `candidateContext.svelte.test.ts` that guards Bug 1 (entityType must be passed to `getApplicableQuestions` in the `questionBlocks` blocks-computation path) — written RED-first and proven to fail for the correct reason against current unmodified source.

## What Was Built

### Task 1 — Pinned svelte-check baseline (`123-BASELINE.md`)
Ran `yarn workspace @openvaa/frontend check` on the clean phase-start tree (HEAD `fd97bb7`, no modified `apps/frontend/src` files). Transcribed the verbatim machine-readable summary line:

```
COMPLETED 2086 FILES 151 ERRORS 1 WARNINGS 30 FILES_WITH_PROBLEMS
```

Pinned baseline: **151 errors / 1 warning** (delta vs RESEARCH figure = 0). Recorded the command, date, HEAD SHA, the criterion-4 rule (post-edit error count ≤ 151, warning ≤ 1), and the nature of the 151 pre-existing TYPE-01/TYPE-02 deferrals (qs ambient TS7016, admin-jobs `+server.ts` cookies/fetch drift, route string-to-number + settings-page prop errors) — all outside this phase's edit surface.

### Task 2 — Bug-1 RED regression test (`candidateContext.svelte.test.ts`)
NEW test mirroring the analog harness idioms (`candidateUserDataState.svelte.test.ts`): `$effect.root` + `flushSync` construction, `afterEach` cleanup, `vi.fn()` collaborator-shape spies.

**A2 seam (RESOLVED): spy-on-collaborator under `$effect.root`, driving the REAL `CandidateContextProvider`.** No pure-helper extract was introduced — the production blocks computation (`candidateContext.svelte.ts:355-394`) is exercised directly. The upstream `../app` / `../auth` context modules (plus `inheritContextMembers`, `candidateUserDataState.svelte`, `$lib/api/dataWriter`) are `vi.mock`-ed to minimal fakes; the fake `getAppContext().dataRoot` exposes a single Opinion `QuestionCategory`-shaped fake whose `appliesTo` returns `true` and whose `getApplicableQuestions` is a shared `vi.hoisted` `vi.fn()` spy returning a non-empty matchable-question array. The seam is documented in the test's top-of-file comment so plan 02 knows no helper extract is in play.

The single load-bearing assertion: **every** `getApplicableQuestions` invocation reachable through the `questionBlocks` blocks computation received an arg object whose `entityType === ENTITY_TYPE.Candidate`.

## RED Confirmation (correct-reason failure)

```
AssertionError: expected undefined to be 'candidate' // Object.is equality
 ❯ src/lib/contexts/candidate/candidateContext.svelte.test.ts:138:31
```

This is an **assertion failure** on the missing `entityType` in the blocks-path `getApplicableQuestions` call (source `:378` omits it) — NOT a harness/construction/import error. The provider constructed cleanly, the `$effect` ran, the spy was invoked (it passed `expect(...).toHaveBeenCalled()`), and only the per-call `entityType` assertion failed. This is exactly the RED outcome the plan requires. Full unit run: **1 failed | 766 passed** (the lone failure is this intentional RED test).

Plan 02 turns it green via the one-line fix at `:378` (`{ elections, constituencies }` → `{ elections, constituencies, entityType }`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `$app/navigation` resolvable test stub + vitest alias**
- **Found during:** Task 2 — first test run failed with `Failed to resolve import "$app/navigation" from candidateContext.svelte.ts` (vite import-analysis transform error, before any assertion could run).
- **Issue:** `$app/navigation` is a SvelteKit virtual module not provided under the bare vitest config; `vi.mock` could not intercept because vite's static import-analysis fails to resolve the bare specifier at transform time. This produced a harness/construction error — the exact failure mode the acceptance criteria forbid for the RED test.
- **Fix:** Created `apps/frontend/src/lib/i18n/tests/__mocks__/app-navigation.ts` (no-op stub mirroring the existing `app-state.ts` / `app-environment.ts` pattern) and added a `$app/navigation` alias to `apps/frontend/vitest.config.ts` (alongside the existing `$app/environment` / `$app/paths` / `$app/state` aliases).
- **Files modified:** `apps/frontend/vitest.config.ts` (+4 lines), `apps/frontend/src/lib/i18n/tests/__mocks__/app-navigation.ts` (new).
- **Scope note:** Test-infrastructure only; no production source touched. Behavior-neutral for all other suites (766 still pass). Committed with the RED test (`95bc0de88`).

## Acceptance Criteria

- [x] `123-BASELINE.md` exists, contains the verbatim summary line with an `N ERRORS` token, records the HEAD SHA, states the criterion-4 rule, and was captured by an actual `check` run.
- [x] `candidateContext.svelte.test.ts` exists, imports `ENTITY_TYPE`, references `getApplicableQuestions` + `entityType` in its assertion.
- [x] The test FAILS (RED) for the correct reason — assertion failure on missing `entityType`, not a construction/import error.
- [x] A top-of-file comment records the A2 seam used (spy-on-collaborator under `$effect.root`).
- [x] `candidateContext.svelte.ts` is NOT modified (`git diff --name-only HEAD` shows no change to it).
- [x] No reactive context accessor is destructured (the live provider instance is read directly, never destructured).

## Known Stubs

None that block the plan goal. The test's fakes (`makeQuestionCategory` / `makeDataRoot`, the mocked upstream contexts) are intentional test doubles, not production stubs. The `$app/navigation` mock is a test-only stub matching the established `__mocks__` pattern.

## Commits

- `4c50734b0` docs(123-01): pin svelte-check baseline (151 errors / 1 warning)
- `95bc0de88` test(123-01): add RED Bug-1 regression test (entityType in blocks path)

## Self-Check: PASSED

All created files exist on disk (`123-BASELINE.md`, `candidateContext.svelte.test.ts`, `app-navigation.ts`, `123-01-SUMMARY.md`) and both task commits (`4c50734b0`, `95bc0de88`) are present in git history. Per this plan's RED contract, the Bug-1 test correctly FAILS (assertion: `expected undefined to be 'candidate'` at `:138`) for the documented reason — the missing `entityType` on the blocks-path call — NOT a harness error and NOT a green suite. That failing-for-the-right-reason outcome is the intended state for plan 01.
