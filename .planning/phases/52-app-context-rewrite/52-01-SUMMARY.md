---
phase: 52-app-context-rewrite
plan: 01
subsystem: frontend-contexts
tags: [svelte5, runes, state-management, contexts]
dependency_graph:
  requires: [51-mid-level-context-rewrite]
  provides: [rune-based-voter-context, rune-based-candidate-context, rune-based-admin-context]
  affects: [52-02-voter-consumer-migration, 52-03-candidate-admin-consumer-migration]
tech_stack:
  added: []
  patterns: [fromStore-bridge, getter-object-pattern, derived-chains]
key_files:
  created:
    - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
    - apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts
    - apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts
    - apps/frontend/src/lib/contexts/voter/nominationAndQuestionStore.svelte.ts
    - apps/frontend/src/lib/contexts/voter/filters/filterStore.svelte.ts
    - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts
    - apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts
    - apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts
    - apps/frontend/src/lib/contexts/admin/jobStores.svelte.ts
    - apps/frontend/src/lib/contexts/utils/questionCategoryStore.svelte.ts
    - apps/frontend/src/lib/contexts/utils/questionStore.svelte.ts
    - apps/frontend/src/lib/contexts/utils/questionBlockStore.svelte.ts
  modified:
    - apps/frontend/src/lib/contexts/utils/paramStore.svelte.ts
    - apps/frontend/src/lib/contexts/voter/voterContext.type.ts
    - apps/frontend/src/lib/contexts/voter/answerStore.type.ts
    - apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts
    - apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.type.ts
    - apps/frontend/src/lib/contexts/admin/adminContext.type.ts
    - apps/frontend/src/lib/contexts/admin/jobStores.type.ts
    - apps/frontend/src/lib/contexts/voter/index.ts
    - apps/frontend/src/lib/contexts/candidate/index.ts
    - apps/frontend/src/lib/contexts/admin/index.ts
    - apps/frontend/src/lib/utils/matches.ts
    - apps/frontend/src/lib/utils/entityDetails.ts
decisions:
  - "Used getter-object pattern for sub-module return values to preserve reactivity across function boundaries"
  - "Used fromStore bridge to read AppContext store values in $derived expressions"
  - "candidateUserDataStore uses $effect for answersLocked subscription (SSR-safe inside factory)"
  - "Replaced memoizedDerived with $derived in paramStore and candidateContext (Svelte 5 handles equality)"
metrics:
  duration: 810s
  completed: 2026-03-28T13:07:15Z
  tasks: 3
  files: 35
---

# Phase 52 Plan 01: VoterContext/CandidateContext/AdminContext Rewrite Summary

Rewrote all 3 application-level contexts, 10 sub-modules, and 7 type files from svelte/store to $state/$derived runes with fromStore bridge for AppContext interop.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | ee45637ed | feat(52-01): convert shared utils and sub-modules from store-based to rune-based |
| 2 | 024bde122 | feat(52-01): rewrite VoterContext, CandidateContext, AdminContext to $state/$derived |
| 3 | 69cf7f892 | chore(52-01): update barrel exports and fix stale import paths |

## Task Details

### Task 1: Convert shared utils and all sub-modules (ee45637ed)

Converted 10 sub-module/utility files and updated 3 type files:

**Shared utils (4 files):**
- `questionCategoryStore.svelte.ts`: Parameters changed from `Readable<T>` to `() => T` getters, returns getter object with reactive `$derived.by()` value
- `questionStore.svelte.ts`: Same getter pattern, filters by appType and matchability
- `questionBlockStore.svelte.ts`: Replaced `derived([...])` with `$derived.by()`, default values as getter functions
- `paramStore.svelte.ts`: Replaced `memoizedDerived` + `toStore` + `$app/stores` bridge with direct `$derived` reading `page` from `$app/state`

**Voter sub-modules (4 files):**
- `answerStore.svelte.ts`: Uses `fromStore` bridge to convert `localStorageWritable` Writable to reactive getter. Exposes `answers` getter instead of `subscribe`
- `matchStore.svelte.ts`: All `Readable<T>` parameters became `() => T` getters, `derived([...])` became `$derived.by()`
- `filterStore.svelte.ts`: Same pattern, builds FilterGroups reactively
- `nominationAndQuestionStore.svelte.ts`: Same pattern, nomination/question tree computation

**Candidate sub-modules (1 file):**
- `candidateUserDataStore.svelte.ts`: Most complex conversion. Replaced 4 internal `writable()` stores with `$state` (savedData, editedImage, editedTermsOfUseAccepted) and `fromStore` bridge (editedAnswers persisted store). Used `$effect` for answersLocked subscription. Composite `$derived.by()` replaces the derived store. Returns object with getter properties for all reactive values.

**Admin sub-modules (1 file):**
- `jobStores.svelte.ts`: Replaced `writable<Map>` with `$state<Map>`, all `derived()` with `$derived`/`$derived.by()`. Direct Map assignment for mutations.

**Type files (3 files):**
- Removed all `Readable<T>` and `Writable<T>` wrappers from `answerStore.type.ts`, `candidateUserDataStore.type.ts`, `jobStores.type.ts`

### Task 2: Rewrite all 3 main context files (024bde122)

**VoterContext (voterContext.svelte.ts):**
- 11 `$derived`/`$derived.by()` expressions replacing 11+ `derived()` calls
- Uses `fromStore()` bridge to read `appSettings`, `dataRoot`, `getRoute`, `locale` from AppContext stores
- Sub-module calls pass getter functions: `() => derivedValue`
- Writable properties (`selectedQuestionCategoryIds`, `firstQuestionId`) exposed via getter/setter pairs backed by `sessionStorageWritable` stores and `fromStore` bridge
- `resetVoterData()` uses internal store references for `.set()`
- Context return object uses getters for all reactive properties

**CandidateContext (candidateContext.svelte.ts):**
- 12 `$derived`/`$derived.by()` expressions
- Removed `memoizedDerived` for `preregistrationElections`, `selectedElections`, `selectedConstituencies` -- replaced with `$derived.by()`
- `newUserEmail` as `$state` with direct assignment
- `idTokenClaims` reads `page.data.claims` from `$app/state` via `$derived`
- Writable properties (`preregistrationElectionIds`, `preregistrationConstituencyIds`, `isPreregistered`, `newUserEmail`) exposed via getter/setter pairs
- Async functions (`logout`, `exchangeCodeForIdToken`, `preregister`) read `getRouteState.current` instead of `get(getRoute)`

**AdminContext (adminContext.svelte.ts):**
- Simplest conversion: `writable<BasicUserData>` became `$state`
- `userData` exposed via getter/setter on context object
- All DataWriter wrappers unchanged (plain async functions)

**Type files (3 files):**
- All `Readable<T>` became plain `T`, all `Writable<T>` became plain `T`
- `VoterContext`, `CandidateContext`, `AdminContext` types now express reactive properties as plain types (getters on the implementation provide reactivity)

### Task 3: Update barrel exports and fix stale imports (69cf7f892)

- Updated `voter/index.ts`: `./voterContext` -> `./voterContext.svelte`
- Updated `admin/index.ts`: `./adminContext` -> `./adminContext.svelte`
- `candidate/index.ts` already correct (`./candidateContext.svelte`)
- Fixed 4 files with stale `MatchTree` type imports: updated to `.svelte` extension
- Fixed 3 layout files importing directly from `.js` paths: redirected to barrel exports

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed stale direct .js imports in consumer layouts**
- **Found during:** Task 3 verification (build test)
- **Issue:** 3 layout files imported from `adminContext.js` or `voterContext.js` (explicit .js extension), which failed after rename to `.svelte.ts`
- **Fix:** Redirected imports to barrel exports (`$lib/contexts/admin`, `$lib/contexts/voter`)
- **Files modified:** `(voters)/(located)/questions/+layout.svelte`, `admin/(protected)/argument-condensation/+layout.svelte`, `admin/(protected)/question-info/+layout.svelte`
- **Commit:** 69cf7f892

**2. [Rule 3 - Blocking] Fixed stale MatchTree type imports**
- **Found during:** Task 3
- **Issue:** 4 files imported `MatchTree` from old `matchStore` path (without `.svelte`)
- **Fix:** Updated to `matchStore.svelte` extension
- **Files modified:** `matches.ts`, `entityDetails.ts`, `+page.svelte`, `EntityDetails.svelte`
- **Commit:** 69cf7f892

## Decisions Made

1. **Getter-object pattern for sub-modules**: Sub-module factories return `{ get value() { return _derived; } }` rather than raw `$derived` values, because JavaScript function returns don't transfer reactive bindings. The calling context reads `.value` inside its own `$derived` expressions.

2. **fromStore bridge for AppContext interop**: Since AppContext (Phase 51) wraps values in `toStore()` for backward compatibility, our rune-based contexts use `fromStore()` to bridge these stores into reactive `.current` properties readable in `$derived` expressions.

3. **$effect for answersLocked subscription**: `candidateUserDataStore` uses `$effect(() => { if (answersLocked()) resetUnsaved(); })` instead of `answersLocked.subscribe()`. This is SSR-safe because it runs inside the `candidateUserDataStore()` factory which is called from `initCandidateContext()` during component initialization.

4. **Dropped memoizedDerived**: Replaced all `memoizedDerived` usage in `paramStore` and `candidateContext` with plain `$derived`. Svelte 5's fine-grained reactivity handles reference equality better than Svelte 4, making custom memoization unnecessary.

## Build Verification

Build passes: `yarn build --filter=@openvaa/frontend` succeeds (forced rebuild, 7.55s).

## Self-Check: PASSED
