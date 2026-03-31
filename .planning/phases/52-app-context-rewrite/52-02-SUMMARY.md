---
phase: 52-app-context-rewrite
plan: 02
subsystem: frontend-consumers
tags: [svelte5, runes, consumer-migration, voter, candidate]
dependency_graph:
  requires: [52-01-voter-candidate-admin-context-rewrite]
  provides: [rune-based-voter-consumers, rune-based-candidate-consumers]
  affects: [52-03-admin-consumer-migration]
tech_stack:
  added: []
  patterns: [context-object-reference-for-setters, effect-root-settlement, voterCtx-candCtx-pattern]
key_files:
  created: []
  modified:
    - apps/frontend/src/routes/(voters)/(located)/+layout.svelte
    - apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte
    - apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte
    - apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte
    - apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte
    - apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte
    - apps/frontend/src/routes/(voters)/(located)/results/[entityType]/[entityId]/+page.svelte
    - apps/frontend/src/routes/(voters)/(located)/results/statistics/+page.svelte
    - apps/frontend/src/routes/(voters)/intro/+page.svelte
    - apps/frontend/src/routes/(voters)/elections/+page.svelte
    - apps/frontend/src/routes/(voters)/constituencies/+page.svelte
    - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte
    - apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte
    - apps/frontend/src/routes/Banner.svelte
    - apps/frontend/src/routes/candidate/(protected)/+page.svelte
    - apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte
    - apps/frontend/src/routes/candidate/(protected)/questions/+layout.svelte
    - apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte
    - apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte
    - apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte
    - apps/frontend/src/routes/candidate/preregister/+layout.svelte
    - apps/frontend/src/routes/candidate/preregister/+page.svelte
    - apps/frontend/src/routes/candidate/preregister/(authenticated)/+layout.svelte
    - apps/frontend/src/routes/candidate/preregister/(authenticated)/constituencies/+page.svelte
    - apps/frontend/src/routes/candidate/preregister/(authenticated)/elections/+page.svelte
    - apps/frontend/src/routes/candidate/preregister/(authenticated)/email/+page.svelte
    - apps/frontend/src/routes/candidate/register/+layout.svelte
    - apps/frontend/src/routes/candidate/register/+page.svelte
    - apps/frontend/src/routes/candidate/register/password/+page.svelte
    - apps/frontend/src/routes/candidate/login/+page.svelte
    - apps/frontend/src/routes/candidate/help/+page.svelte
    - apps/frontend/src/routes/candidate/privacy/+page.svelte
    - apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte
decisions:
  - "Used $effect.root() for settlement detection replacing store .subscribe() in (located)/+layout.svelte"
  - "Keep context object reference (voterCtx/candCtx) for writable property assignments instead of destructuring"
  - "Access matches/selectedElections through context object in shared components (EntityCard, EntityDetails, QuestionHeading, Banner) for reactivity"
metrics:
  duration: 1204s
  completed: 2026-03-28T13:31:08Z
  tasks: 2
  files: 38
---

# Phase 52 Plan 02: Voter + Candidate Consumer Migration Summary

Migrated all 19 voter consumer files and 26 candidate consumer files from $store syntax to direct property access for VoterContext and CandidateContext values, plus converted settlement pattern to $effect.root().

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 468047cd0 | feat(52-02): update all voter consumer files to direct property access |
| 2 | 9a31dcb6a | feat(52-02): update all candidate consumer files to direct property access |

## Task Details

### Task 1: Update all 19 voter consumer files (468047cd0)

Mechanically replaced all `$storeName` patterns with direct property access for VoterContext values across 19 files (18 modified, 1 unchanged):

**Settlement pattern conversion (located/+layout.svelte):**
- Replaced `nominationsAvailable.subscribe()` + `get(nominationsAvailable)` with `$effect.root()` + `$effect()` pattern
- Removed `import { get } from 'svelte/store'`, added `import { untrack } from 'svelte'`
- Uses `$effect.root()` to create a detached reactive scope that can be cleaned up when the promise resolves

**Shared dynamic components:**
- `EntityCard.svelte`: Changed from `const matches = getVoterContext().matches` to `const voterContext = getVoterContext()` and reads `voterContext?.matches` reactively inside `$derived.by()`
- `EntityDetails.svelte`: Same pattern, also removed `Readable` type import from `svelte/store`
- `QuestionHeading.svelte`: Replaced `Readable<Array<Election>>` + conditional store assignment with `$derived()` reading from voterCtx/candidateCtx context objects; removed `readable` and `Readable` imports
- `Banner.svelte`: Changed from `const resultsAvailable = getVoterContext().resultsAvailable` to `const voterCtx = getVoterContext()` and reads `voterCtx.resultsAvailable` in template

**AnswerStore shape change:**
- `$answers[questionId]` -> `answers.answers[questionId]` (reading via getter)
- `$answers` in onMount -> `answers.answers` (e.g. `Object.keys(answers.answers).length`)
- `answers.setAnswer()` / `answers.deleteAnswer()` / `answers.reset()` unchanged (method calls)

### Task 2: Update all 26 candidate consumer files and verify build (9a31dcb6a)

Mechanically replaced all `$storeName` patterns with direct property access for CandidateContext values across 26 files (22 modified, 4 unchanged):

**CandidateUserDataStore shape change:**
- `$userData` -> `userData.current` (reading via getter)
- `$userData?.candidate` -> `userData.current?.candidate`
- `$hasUnsaved` -> `userData.hasUnsaved` (getter, not store)
- `$savedCandidateData` -> `userData.savedCandidateData` (getter, not store)

**Writable property fix (affects both voter and candidate):**
- Destructured `const { firstQuestionId, selectedQuestionCategoryIds } = getVoterContext()` would create non-assignable constants
- Fixed by keeping `const voterCtx = getVoterContext()` and assigning through `voterCtx.firstQuestionId = ...`
- Same pattern for CandidateContext writable properties: `candCtx.newUserEmail`, `candCtx.preregistrationElectionIds`, etc.
- `bind:group={selectedQuestionCategoryIds}` -> `bind:group={voterCtx.selectedQuestionCategoryIds}` (Svelte bind requires writable reference)

**Build verification:** `yarn build --filter=@openvaa/frontend` passes (7.77s).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed constant assignment error for writable context properties**
- **Found during:** Task 2 build verification
- **Issue:** Destructuring writable getter/setter properties from context objects into `const` variables makes them non-assignable. Svelte 5 runes mode treats destructured context values as constants.
- **Fix:** Keep context object reference (`voterCtx`/`candCtx`) and access writable properties through the object for assignments and `bind:` directives
- **Files modified:** `questions/+page.svelte`, `[questionId]/+page.svelte` (voter), `login/+page.svelte`, `register/password/+page.svelte`, `elections/+page.svelte`, `constituencies/+page.svelte` (candidate)
- **Commit:** 9a31dcb6a

## Decisions Made

1. **$effect.root() for settlement detection**: The `(located)/+layout.svelte` file used `nominationsAvailable.subscribe()` to wait for the reactive chain to settle. Since `nominationsAvailable` is now a plain reactive getter, we use `$effect.root()` to create a detachable reactive scope and `$effect()` inside it to watch for value changes. The `$effect.root()` cleanup function is called when the promise resolves or times out.

2. **Context object reference for writable properties**: When a consumer needs to write to a context property (e.g., `firstQuestionId = null`), the destructured variable is a const snapshot. Instead, we keep a reference to the context object (`const voterCtx = getVoterContext()`) and write through it (`voterCtx.firstQuestionId = null`). This works because the context object has getter/setter pairs.

3. **Shared component reactivity via context object**: For components that conditionally access VoterContext (EntityCard, EntityDetails, Banner), we keep the full context object and read reactive properties inside `$derived` or template expressions, ensuring reactivity is preserved across the getter boundary.

## Build Verification

Build passes: `yarn build --filter=@openvaa/frontend` succeeds (7.77s).

## Self-Check: PASSED
