---
phase: 95-domain-a-wave-1-tier-1-leaf-contexts
plan: 03
subsystem: ui
tags: [svelte5, runes, localStorage, persistedState, answerStore, candidateUserDataStore, store-bridge]

# Dependency graph
requires:
  - phase: 95-02
    provides: dataContext rune-migration sibling (parallel Wave-1 leaf; no hard dependency on this plan)
provides:
  - New shared `localStorageState<T>(key, default)` rune-native persistence helper (versioned-payload core parametrized on StorageType for Phase 96's sessionStorageState reuse)
  - Voter answerStore on localStorageState (no fromStore/3-layer bridge; zero svelte/store import)
  - Candidate candidateUserDataStore on localStorageState (no fromStore/3-layer bridge; zero svelte/store import)
  - Wave-0 unit coverage for the helper + voter answerStore
affects: [95-04, 95-05, 96-sessionStorageState, 96-voterContext, 96-candidateContext, 98-cleanup-deletes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pattern 1 reactive-getter exposure: localStorageState returns { readonly current; set; update } — current getter tracks the $state dependency"
    - "Shared versioned-payload core: private storageState(type, key, default) reuses getItemFromStorage/saveItemToStorage (no re-impl, no migration shim per D-03), consumed by localStorageState (and future sessionStorageState)"
    - "L-4 JSON-clone retained at both answer-store callsites ($state proxies are not structurally cloneable)"

key-files:
  created:
    - apps/frontend/src/lib/contexts/voter/answerStore.svelte.test.ts
  modified:
    - apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts
    - apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts
    - apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts
    - apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts

key-decisions:
  - "localStorageState reuses the production getItemFromStorage/saveItemToStorage versioned helpers — no inline readVersioned/writeVersioned (which the runes-test analog duplicated) and NO format-migration shim (D-03): a stale/wrong-version payload is discarded → defaultValue"
  - "Versioned core parametrized on StorageType (private storageState) so Phase 96's sessionStorageState shares it; localStorageWritable/sessionStorageWritable KEPT (deletion is Phase 98)"
  - "Both answer-store leaves drop svelte/store entirely (no kept bridge) — getter-shaped public surfaces (.answers, .current) mean no consumer bridge is needed; JSON-clone + deepFreeze + startEvent hooks preserved"

patterns-established:
  - "localStorageState — the only genuinely new symbol in Phase 95 (K1); rune-native persisted-state handle replacing the $state → localStorageWritable → fromStore bridge"

requirements-completed: [CTX-03]

# Metrics
duration: 12min
completed: 2026-06-04
---

# Phase 95 Plan 03: Answer Stores + localStorageState Helper Summary

**Introduced the shared rune-native `localStorageState<T>(key, default)` helper (versioned-payload core reusing `getItemFromStorage`/`saveItemToStorage`, no migration shim) and migrated BOTH the voter `answerStore` and the candidate `candidateUserDataStore` off the three-layer `$state → localStorageWritable → fromStore` bridge onto a single handle — zero `svelte/store` import at either callsite.**

## Performance

- **Duration:** ~12 min (resume session — Tasks 1+2 by prior executor; Task 3 verify/commit + plan-close here)
- **Completed:** 2026-06-04
- **Tasks:** 3 (Task 1 helper + helper test [RED/GREEN]; Task 2 voter store + Wave-0 test; Task 3 candidate store)
- **Files created:** 1 · **Files modified:** 4

## Accomplishments

- **Task 1 — `localStorageState` helper** (`persistedState.svelte.ts`): added the new exported `localStorageState<TValue>(key, defaultValue): PersistedState<TValue>` backed by a private `storageState(type, key, default)` core parametrized on `StorageType`. The core reuses the production `getItemFromStorage('localStorage', key)` for the initial read and `saveItemToStorage` for write-through — no inline `readVersioned`/`writeVersioned` duplication and NO format-migration shim (D-03): a stale/wrong-version payload falls back to `defaultValue`. `localStorageWritable`/`sessionStorageWritable` retained (Phase 98 deletes them). Five `<behavior>` cases added to `persistedState.svelte.test.ts`.
- **Task 2 — voter `answerStore`** (`answerStore.svelte.ts`): replaced the 3-layer `localStorageWritable(...) + fromStore(...)` bridge with a single `localStorageState('VoterContext-answerStore', …)` handle; `svelte/store` import fully removed; `get answers()` reads `store.current`; `JSON.parse(JSON.stringify(...))` clone (L-4) + `deepFreeze` + the `startEvent('answer'|'answer_delete'|'answer_resetAll', …)` tracking hooks preserved. Added Wave-0 `answerStore.svelte.test.ts` (5 cases — set/delete/reset/frozen-clone/startEvent).
- **Task 3 — candidate `candidateUserDataStore`** (`candidateUserDataStore.svelte.ts`): replaced `localStorageWritable(...) + fromStore(...)` (and the `editedAnswersState` wrapper var) with a single `localStorageState('CandidateContext-candidateUserDataStore-editedAnswers', {} as LocalizedAnswers)` handle; all `.current` reads (`_current` `$derived.by`, `_unsavedQuestionIds`, `save()`) rewired to `_editedAnswersStore.current`; the `.update`/`.set` calls map 1:1; `svelte/store` import fully removed; the JSON-clone (L-4), the `answersLocked` `$effect`, and the `$state` fields (`savedData`/`editedImage`/`editedTermsOfUseAccepted`) untouched. The existing 4 `save()` tests stay green.

## Task Commits

1. **Task 1 RED — failing localStorageState helper tests** — `245e154e7` (test)
2. **Task 1 GREEN — localStorageState rune-native persistence helper** — `e0981a5e9` (feat)
3. **Task 2 — Wave-0 voter answerStore unit coverage** — `5c6709b00` (test)
4. **Task 2 — migrate voter answerStore to localStorageState** — `06f71f6c5` (feat)
5. **Task 3 — migrate candidate candidateUserDataStore to localStorageState** — `36ea89b73` (feat)

**Plan metadata:** (final docs commit)

## Files Created/Modified

- `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts` — added `PersistedState<T>` interface, `localStorageState<T>`, and the private `storageState(type, …)` versioned core (reuses `getItemFromStorage`/`saveItemToStorage`); `localStorageWritable`/`sessionStorageWritable` + `storageWritable` retained.
- `apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts` — extended with the five `localStorageState` `<behavior>` cases (default fallback, set/update persist, round-trip, stale-version discard).
- `apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts` — single `localStorageState` handle; zero `svelte/store`; JSON-clone + `startEvent` hooks kept.
- `apps/frontend/src/lib/contexts/voter/answerStore.svelte.test.ts` (NEW) — Wave-0 unit coverage (5 cases).
- `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts` — single `localStorageState` handle; zero `svelte/store`; JSON-clone + `$effect` + `$state` fields kept.

## Decisions Made

- **Reuse production versioned helpers; no shim (D-03)** — `localStorageState` reads via `getItemFromStorage` and writes via `saveItemToStorage`, so the `{version,data}` payload, `requireUserDataVersion` expiry, and `browser` gate are not re-implemented. A stale/old-format payload is discarded (one-time loss of locally-cached answers on first post-migration load) per the locked, user-approved D-03 tradeoff — no untrusted payload is trusted into app state (T-95-03-02 accept).
- **StorageType-parametrized core for Phase 96 reuse** — the private `storageState(type, key, default)` is consumed by `localStorageState` and is shaped for `sessionStorageState` to share in Phase 96 (Claude's Discretion realization).
- **Both leaves drop `svelte/store` entirely** — neither answer store has a kept consumer bridge (their public surfaces are already getter-shaped: `.answers`, `.current`), so the `fromStore` wrapper var is removed outright. `localStorageWritable`/`sessionStorageWritable` are still exported for other consumers (`userPreferences`, survey/tracking); their deletion is Phase 98.

## Deviations from Plan

None — plan executed exactly as written. (Task 3 was resumed mid-flight after an API socket drop interrupted the prior executor; the uncommitted candidate-store change was reviewed against the Task 3 spec, verified correct and behavior-preserving, then committed atomically with no rework.)

## Issues Encountered

None. The resumed Task 3 working-tree change matched the plan spec exactly (5/5 acceptance grep gates already satisfied on review); no defect found, so no rework was required.

## Verification

- `cd apps/frontend && yarn test:unit --run` → **697/697 passed** (42 files). Targeted suites: `persistedState.svelte.test.ts` 14/14, `answerStore.svelte.test.ts` 5/5, `candidateUserDataStore.svelte.test.ts` 4/4 (existing save tests stay green).
- `cd apps/frontend && yarn check` → 150 errors / 29 warnings, **identical to the pre-existing baseline** (matches the 95-02 close baseline). `grep -E "persistedState|answerStore|candidateUserDataStore.svelte.ts"` over the output returns **NO** errors/warnings in the migrated files — zero new type errors introduced. The 150 errors are pre-existing out-of-scope failures (`qs` declaration files, admin-jobs `cookies` options, candidate-settings password props, `candidateContext` `SupabaseDataWriter` Promise mismatch, `EntityListControls` Readable<string>) — none touched by this plan.
- Grep gates (Task 1): `export function localStorageState` = 1; `getItemFromStorage|saveItemToStorage` ≥ 4; `readVersioned|writeVersioned` = 0; `localStorageWritable`/`sessionStorageWritable` still exported.
- Grep gates (Task 2): `svelte/store` = 0; `fromStore|localStorageWritable` = 0; `localStorageState` ≥ 1; `JSON.parse(JSON.stringify` ≥ 1; `startEvent(` ≥ 3; test file exists.
- Grep gates (Task 3): `svelte/store` = 0; `fromStore|localStorageWritable|editedAnswersState` = 0; `localStorageState` = 2; `JSON.parse(JSON.stringify` = 1.
- Phase-level gate: `grep -c "svelte/store"` over both leaf stores → 0 / 0.

## Known Stubs

None — no stubs introduced.

## Next Phase Readiness

- The private `storageState(type, …)` core is ready for Phase 96's `sessionStorageState` to share (versioned-payload + `browser` gate reuse).
- `localStorageWritable`/`sessionStorageWritable` + `storageWritable` remain for the other (non-answer-store) consumers; their deletion is Wave 4 (Phase 98).
- Both answer stores are now rune-native single-handle leaves — Wave-2 (Phase 96) voterContext/candidateContext migrations consume them unchanged (public getter surfaces preserved; destructure-trap untouched per CLAUDE.md / L-7).

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts
- FOUND: apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts
- FOUND: apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts
- FOUND: apps/frontend/src/lib/contexts/voter/answerStore.svelte.test.ts
- FOUND: apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts
- FOUND: .planning/phases/95-domain-a-wave-1-tier-1-leaf-contexts/95-03-SUMMARY.md
- FOUND commit: 245e154e7 / e0981a5e9 / 5c6709b00 / 06f71f6c5 / 36ea89b73

---
*Phase: 95-domain-a-wave-1-tier-1-leaf-contexts*
*Completed: 2026-06-04*
