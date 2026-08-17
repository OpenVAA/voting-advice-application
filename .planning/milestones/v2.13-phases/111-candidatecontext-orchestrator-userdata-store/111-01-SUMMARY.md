---
phase: 111-candidatecontext-orchestrator-userdata-store
plan: 01
subsystem: ui
tags: [svelte5, runes, context-as-class, candidate-context, composite-store, refactor]

# Dependency graph
requires:
  - phase: 110-votercontext-orchestrator
    provides: "factory-wraps-class + Impl-naming precedent (AnswerStoreImpl + answerStore() byte-identical factory)"
  - phase: 96-persisted-state-class
    provides: "PersistedStateImpl / localStorageState class bridge consumed unchanged (§22 version bridge inherited)"
provides:
  - "CandidateUserDataStoreImpl Svelte 5 class behind a byte-identical candidateUserDataStore(opts) factory"
  - "Group-C composite $derived.by merge (savedData + editedAnswers + editedImage + editedTermsOfUseAccepted) preserved as a private #current field"
  - "12 arrow-field public methods that survive being held detached as userData.X on the candidate context"
affects: [111-02-candidatecontext-orchestrator, candidateContext.svelte.ts]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Composite-store-as-class: $state backings + $derived.by composite as private # fields, prototype getters for reactive accessors, arrow fields for detached methods, constructor-installed $effect"
    - "D2 type-name-clash avoidance: class named *Impl, public TYPE keeps the bare name, factory byte-identical"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts

key-decisions:
  - "Class named CandidateUserDataStoreImpl (NOT CandidateUserDataStore) to avoid the D2 type-name clash — the imported TYPE keeps the bare name"
  - "answersLocked $effect installed in the constructor (legal: constructed at component init = effect context via candidateContext field init); persistence stays imperative via localStorageState (no $effect-driven init, §20/§21)"
  - "JSON round-trip clone preserved verbatim (Svelte 5 $state proxies cannot be structuredClone'd)"

patterns-established:
  - "Composite Group-C store class idiom: factory-wraps-new + Impl naming + arrow-field methods + constructor $effect"

requirements-completed: [CLASS-06]

# Metrics
duration: 3min
completed: 2026-06-13
---

# Phase 111 Plan 01: candidateUserDataStore Class Conversion Summary

**Converted the 277-line `candidateUserDataStore` Group-C composite-bridge factory to a Svelte 5 `class CandidateUserDataStoreImpl implements CandidateUserDataStore` behind a byte-identical factory, preserving the `$derived.by` composite merge + JSON round-trip clone verbatim, with all 4 existing save() unit tests green.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-06-13T01:03:40Z
- **Completed:** 2026-06-13T01:05:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- `candidateUserDataStore.svelte.ts` is now `class CandidateUserDataStoreImpl implements CandidateUserDataStore`, returned from a byte-identical `candidateUserDataStore(opts)` factory (`return new CandidateUserDataStoreImpl(opts)`) — so `candidateUserDataStore.svelte.test.ts:3` and `candidateContext.svelte.ts:11` imports are unchanged.
- The Group-C composite `#current = $derived.by(...)` merge (savedData + editedAnswers + editedImage + editedTermsOfUseAccepted) is preserved verbatim, including the load-bearing `JSON.parse(JSON.stringify(...))` round-trip clone and its comment.
- All 12 public methods (init/reset/resetUnsaved/setAnswer/resetAnswer/resetAnswers/setImage/resetImage/setTermsOfUseAccepted/resetTermsOfUseAccepted/reloadCandidateData/save) are arrow-function fields (survive detach as `userData.X`); `#updateCandidateData`/`#mergeCandidateAnswers` are private methods (internal-only, not arrow fields).
- The `answersLocked` `$effect` (clear unsaved when answers lock) is installed in the constructor body; persistence remains imperative via the inherited `localStorageState` bridge (no `#version` added, no `$effect`-driven persistence).
- D2 type-name clash avoided: the class is `CandidateUserDataStoreImpl`, the public TYPE `CandidateUserDataStore` is not shadowed.

## Task Commits

1. **Task 1: Convert candidateUserDataStore to CandidateUserDataStoreImpl class** - `41b831936` (refactor)

This is a behavior-preserving refactor gated by an existing 4-case unit test (the test imports the factory and asserts answers-only vs properties-only merge paths), so the TDD cycle is GREEN-preservation: baseline 4/4 green confirmed before the change, 4/4 green after. No new test commit was needed — the existing test stays unchanged per the plan (it MUST pass as-is).

## Files Created/Modified
- `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts` - Rewritten as `CandidateUserDataStoreImpl` class + byte-identical `candidateUserDataStore` factory wrapper (composite `$derived.by` merge, 12 arrow-field methods, constructor `answersLocked` `$effect`, private `#updateCandidateData`/`#mergeCandidateAnswers` helpers, prototype getters for the 5 reactive accessors).

## Decisions Made
None beyond the plan — followed the plan and 111-PATTERNS guidance exactly (Impl naming, factory byte-identical, composite merge verbatim, arrow fields, constructor effect).

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None. `yarn check` (svelte-check) surfaces only pre-existing, unrelated errors (`qs` missing declaration file, supabase data-provider Json typing, FeedbackPopup SendingStatus) — none reference the converted file, so they are out of scope per the scope boundary. The frontend build (`yarn build --filter=@openvaa/frontend`) and the 4-case unit test both pass.

## Verification
- `yarn vitest run src/lib/contexts/candidate/candidateUserDataStore.svelte.test.ts` → 4/4 passed (baseline + post-refactor)
- `yarn build --filter=@openvaa/frontend` → built in 7.89s (factory signature byte-identical, candidateContext import resolves)
- grep confirms: `class CandidateUserDataStoreImpl`, no `CandidateUserDataStore` shadow, `JSON.parse(JSON.stringify`, `$derived.by` ×3, `localStorageState('CandidateContext-candidateUserDataStore-editedAnswers'`, `new CandidateUserDataStoreImpl`, arrow methods, constructor `$effect(() =>`, private `#updateCandidateData`/`#mergeCandidateAnswers`, no `#version` added

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 01 de-risks Plan 02 (candidateContext orchestrator conversion), which imports this factory at `candidateContext.svelte.ts:11` — the import is byte-identical so Plan 02 can convert the orchestrator without touching this slice.
- The barrel (`candidate/index.ts`) is intentionally NOT narrowed in this plan (Plan 02 narrows it); `CandidateUserDataStoreImpl` is not exported (factory-only surface), matching the type-only-barrel intent.

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts
- FOUND: .planning/phases/111-candidatecontext-orchestrator-userdata-store/111-01-SUMMARY.md
- FOUND commit: 41b831936

---
*Phase: 111-candidatecontext-orchestrator-userdata-store*
*Completed: 2026-06-13*
