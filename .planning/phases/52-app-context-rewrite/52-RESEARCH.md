# Phase 52: App Context Rewrite - Research

**Researched:** 2026-03-28
**Domain:** Svelte 5 runes migration -- VoterContext, CandidateContext, AdminContext rewrite + zero-$store sweep
**Confidence:** HIGH

## Summary

Phase 52 completes the context system migration by rewriting the three application-level contexts (VoterContext, CandidateContext, AdminContext) from `svelte/store` internals to native `$state`/`$derived`, and achieving zero `$store` context references across the entire frontend codebase. This is the culmination of the bottom-up migration strategy: Phase 49 replaced utility stores, Phase 50 rewrote leaf contexts, Phase 51 rewrote mid-level contexts, and Phase 52 handles the final top-level contexts.

The scope encompasses: (1) rewriting 3 context implementation files totaling ~713 lines, (2) rewriting 7 sub-module store files (answerStore, matchStore, filterStore, nominationAndQuestionStore, candidateUserDataStore, jobStores, and shared utils like questionBlockStore/questionCategoryStore/questionStore/paramStore), (3) updating type files to remove `Readable<T>`/`Writable<T>` wrappers, and (4) updating ~59 consumer components (19 voter, 27 candidate, 14 admin, minus 1 shared QuestionHeading) to use direct property access instead of `$store` syntax. The grep data shows 248 total `$store` reference occurrences that must be converted.

A key technical challenge is the sub-module architecture: VoterContext delegates to factory functions (answerStore, matchStore, filterStore, etc.) that currently return `Readable<T>` or extended store objects. These must be converted to return plain reactive objects or use `$derived` internally. The `answerStore` and `candidateUserDataStore` are extended stores (Readable + methods) that need careful redesign to expose reactive values without the store subscription pattern.

**Primary recommendation:** Convert each sub-module from store-factory functions to rune-based reactive classes/objects. Use `$derived` for computed values, `$state` for mutable values. Update type definitions to remove all `Readable<T>`/`Writable<T>` wrappers. Update all consumer `$store` references to direct property access. Finish with grep sweep validation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: VoterContext derived chains -- Claude's discretion on mechanical vs consolidation approach
- D-02: CandidateContext async patterns -- Apply same patterns as AppContext (Phase 51): page data subscriptions become `$derived` chains from `$app/state`, auth state becomes `$derived` from page session. Async data writer methods stay as plain functions
- D-03: Grep sweep validation for zero-$store milestone with specific grep commands
- D-04: Carry forward from Phases 50-51 (direct $state properties, full consumer migration, version counter pattern)

### Claude's Discretion
- VoterContext internal structure decisions (mechanical vs consolidation)
- CandidateContext specific conversion patterns
- AdminContext conversion (simplest at 116 lines)
- Sub-module handling (answerStore, matchStore, filterStore, nominationAndQuestionStore, etc.)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R2.7 | Rewrite VoterContext to use $state/$derived | VoterContext (264 lines) has ~20 derived stores across main file + 6 sub-modules. All use `derived()` from svelte/store. `answerStore` uses `localStorageWritable` (already $state-based internally). `matchStore`, `filterStore`, `nominationAndQuestionStore` are pure derived computations. |
| R2.8 | Rewrite CandidateContext to use $state/$derived | CandidateContext (333 lines) has 15 derived stores, 3 memoizedDerived, 2 writable, imports `page` from `$app/stores`. `candidateUserDataStore` (246 lines) has 7 internal stores. |
| R2.9 | Rewrite AdminContext to use $state/$derived | AdminContext (116 lines) has 1 writable, inherits from AppContext + AuthContext. `jobStores` (150 lines) has 1 writable + 3 derived stores. Simplest of the three. |
| R2.10 | Preserve existing context API shape (getXxxContext/initXxxContext) | All three contexts use Symbol-keyed `setContext`/`getContext`/`hasContext` -- pattern preserved, only internal implementations change. |
| R2.11 | Rename .ts context files to .svelte.ts where runes are used | Files using `$state`/`$derived` must be `.svelte.ts`. Applies to: voterContext, candidateContext, adminContext, answerStore, matchStore, filterStore, nominationAndQuestionStore, candidateUserDataStore, jobStores, and shared utils. |
| R2.12 | Ensure SSR safety -- no module-level $state | All $state declarations are inside `initXxxContext()` factory functions called during component init. No module-level state leaks. |
| R3.1 (remaining) | Update all `$store` references in components | 248 total `$store` occurrences across ~59 consumer files for these 3 contexts. Mechanical conversion: `$storeName` becomes `storeName` (direct property access). |
| R3.2 (remaining) | Remove `svelte/store` imports from consumer components | 3 `.svelte` files currently import from `svelte/store` (located layout, QuestionHeading, EntityDetails). All context/sub-module `.ts` files with store imports. |
| R3.3 (remaining) | Update reactive declarations using context stores | Consumer files using `$: value = $store` patterns must convert to `$derived` or direct access. Files already using runes just need `$storeName` -> `storeName`. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Use TypeScript strictly -- avoid `any`, prefer explicit types
- Build system: Turborepo with `yarn build` / `yarn test:unit`
- Monorepo: changes within `apps/frontend/` only
- Check code against code review checklist
- Never commit sensitive data
- SSR must work correctly -- no hydration mismatches
- WCAG 2.1 AA accessibility must be maintained

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte | 5.53.12 | Framework with runes ($state, $derived, $effect) | Already installed, verified |
| SvelteKit | 2.55.0 | App framework; provides $app/state, $app/environment | Already installed, verified |
| svelte/store | 5.53.12 | `toStore()` bridge for backward-compatible interfaces (persistedState, StackedState) | Only for bridge utilities, NOT for new context code |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @openvaa/matching | workspace | MatchingAlgorithm used by VoterContext | Already used, no changes needed |
| @openvaa/filters | workspace | FilterGroup used by filterStore | Already used, no changes needed |
| @openvaa/data | workspace | DataRoot, entity types, question types | Already used, no changes needed |
| Vitest | 3.2.4 | Unit test framework | Already configured |

### Alternatives Considered

None. All tools are already in the project. No new dependencies needed.

## Architecture Patterns

### Recommended File Structure

After Phase 52, these files change:

```
apps/frontend/src/lib/contexts/
  voter/
    voterContext.svelte.ts      # RENAMED from .ts, rewritten with $state/$derived
    voterContext.type.ts         # MODIFIED: Remove Readable<T>/Writable<T> wrappers
    answerStore.svelte.ts        # RENAMED from .ts, rewritten with $state
    answerStore.type.ts          # MODIFIED: Remove Readable<T> base type
    matchStore.svelte.ts         # RENAMED from .ts, rewritten with $derived
    countAnswers.ts              # UNCHANGED (pure function, no stores)
    voter.ts                     # UNCHANGED (pure class)
    filters/
      filterStore.svelte.ts      # RENAMED from .ts, rewritten with $derived
      buildParentFilters.ts      # UNCHANGED
      buildQuestionFilter.ts     # UNCHANGED
    nominationAndQuestionStore.svelte.ts  # RENAMED from .ts
    selectionTree.type.ts        # UNCHANGED
  candidate/
    candidateContext.svelte.ts   # RENAMED, rewritten
    candidateContext.type.ts     # MODIFIED: Remove Readable<T>/Writable<T>
    candidateUserDataStore.svelte.ts  # RENAMED, rewritten
    candidateUserDataStore.type.ts    # MODIFIED: Remove Readable<T>
  admin/
    adminContext.svelte.ts       # RENAMED, rewritten
    adminContext.type.ts         # MODIFIED: Remove Writable<T>
    jobStores.svelte.ts          # RENAMED, rewritten
    jobStores.type.ts            # MODIFIED: Remove Readable<T>
  utils/
    questionBlockStore.svelte.ts  # RENAMED from .ts
    questionCategoryStore.svelte.ts  # RENAMED from .ts
    questionStore.svelte.ts       # RENAMED from .ts
    paramStore.svelte.ts          # MAY ALREADY BE RENAMED by Phase 50/51
    memoizedDerived.ts            # DELETED (no more consumers after this phase)
```

### Pattern 1: Sub-module Store to Reactive Object

**What:** Convert factory functions that return `Readable<T>` to functions that return reactive objects with `$state`/`$derived` properties.

**When to use:** All sub-modules (answerStore, matchStore, filterStore, etc.)

**Before (store pattern):**
```typescript
// matchStore.ts
import { derived } from 'svelte/store';
import type { Readable } from 'svelte/store';

export function matchStore({ answers, ... }): Readable<MatchTree> {
  return derived([answers, ...], ([answers, ...]) => {
    // computation
    return tree;
  });
}
```

**After (rune pattern):**
```typescript
// matchStore.svelte.ts

export function matchStore({ answers, ... }): MatchTree {
  // Access reactive inputs directly -- they are now $state/$derived properties
  const tree = $derived.by(() => {
    const currentAnswers = answers;  // reads $state
    // computation
    return computedTree;
  });
  return tree;  // return the $derived itself
}
```

**Critical design decision:** The sub-module factory functions currently accept `Readable<T>` parameters and return `Readable<T>`. After conversion, they accept reactive values (plain references from context) and return `$derived` values. The function signatures change fundamentally.

### Pattern 2: Extended Store to Reactive Class/Object

**What:** Convert extended stores (Readable + methods) like `answerStore` and `candidateUserDataStore` to reactive objects with `$state` properties and methods.

**When to use:** answerStore, candidateUserDataStore, jobStores

**Before:**
```typescript
export type AnswerStore = Readable<Frozen<Answers>> & {
  setAnswer: (questionId: string, value?: Answer['value']) => void;
  deleteAnswer: (questionId: string) => void;
  reset: () => void;
};
```

**After:**
```typescript
export type AnswerStore = {
  readonly answers: Frozen<Answers>;  // $state, read directly
  setAnswer: (questionId: string, value?: Answer['value']) => void;
  deleteAnswer: (questionId: string) => void;
  reset: () => void;
};
```

Consumers change from `$answers[questionId]` to `answers.answers[questionId]` -- OR -- the voterContext can destructure differently and expose `answers` (the frozen object) directly while keeping `answerActions` or similar for mutations.

**Recommended approach for answerStore:** Since VoterContext already exposes `answers` as a property, the cleanest pattern is to have answerStore return an object with a reactive `current` property (or use property name `value`), plus mutation methods. The VoterContext can then expose `answers` as a getter that returns the reactive value, preserving the existing API shape where consumers do `answers[questionId]` without `$`.

### Pattern 3: Writable Context Properties to $state

**What:** Context properties typed as `Writable<T>` become plain `$state<T>` values.

**When to use:** `newUserEmail`, `selectedQuestionCategoryIds`, `firstQuestionId`, `userData` (admin), `isPreregistered`, `preregistrationElectionIds`, `preregistrationConstituencyIds`

**Before (consumer):**
```svelte
const { selectedQuestionCategoryIds } = getVoterContext();
$selectedQuestionCategoryIds = [];  // write via $store
```

**After (consumer):**
```svelte
const { selectedQuestionCategoryIds } = getVoterContext();
// PROBLEM: Cannot assign to destructured $state -- it's not a binding
```

**Critical insight:** Writable properties exposed through context cannot be simple `$state` values because destructuring breaks the reactive binding. The established pattern from Phase 50 (D-01) is to use object properties:

```typescript
// In context:
const _selectedQuestionCategoryIds = $state<Array<Id>>([]);

// Return from context as getter/setter pair or use an object wrapper
// Option A: Return object with .value
return {
  selectedQuestionCategoryIds: {
    get value() { return _selectedQuestionCategoryIds; },
    set value(v) { _selectedQuestionCategoryIds = v; }
  }
};

// Option B: Use sessionStorageWritable which already returns a Writable-compatible object
// (since persistedState.svelte.ts uses toStore() internally)
```

**Recommended approach:** The `persistedState.svelte.ts` utility already returns `Writable<T>` objects backed by `$state` internally. For the persisted writables (`selectedQuestionCategoryIds`, `firstQuestionId`, `isPreregistered`, etc.), keep using `sessionStorageWritable`/`localStorageWritable` -- they already use `$state` internally. For non-persisted writables (`newUserEmail`, `userData` in admin), the context should expose them as object wrappers or use `toStore()`.

**Important note on consumer patterns:** When a consumer currently does `$selectedQuestionCategoryIds = []`, the rune equivalent depends on how the value is exposed. If it's a store (Writable), consumers use `$store = value`. If it's a plain property returned from context, consumers need `ctx.selectedQuestionCategoryIds = value` (but this only works if the context object has a setter). The pattern from Phase 50 must be consistently applied.

### Pattern 4: Derived Chains with $derived

**What:** Replace `derived([storeA, storeB], ([a, b]) => ...)` with `$derived(() => { ... })` that reads reactive values directly.

**When to use:** All ~20 derived stores in VoterContext, ~15 in CandidateContext

**Before:**
```typescript
const electionsSelectable = derived(
  [appSettings, dataRoot],
  ([appSettings, dataRoot]) => !appSettings.elections?.disallowSelection && dataRoot.elections?.length !== 1
);
```

**After:**
```typescript
const electionsSelectable = $derived(
  !appSettings.elections?.disallowSelection && dataRoot.elections?.length !== 1
);
```

This is significantly cleaner. The reactive values `appSettings` and `dataRoot` are now direct properties from AppContext (which was converted in Phase 51), so they can be read directly in `$derived` expressions.

### Pattern 5: Sub-module Parameter Changes

**What:** Sub-module factory functions that accepted `Readable<T>` parameters now accept getters/direct values.

**When to use:** questionCategoryStore, questionStore, questionBlockStore, filterStore, matchStore, nominationAndQuestionStore

**Before:**
```typescript
export function questionCategoryStore({
  dataRoot,
  selectedElections,
  selectedConstituencies,
}: {
  dataRoot: Readable<DataRoot>;
  selectedElections: Readable<Array<Election>>;
  selectedConstituencies: Readable<Array<Constituency>>;
}): Readable<Array<QuestionCategory>> {
  return derived([dataRoot, selectedElections, selectedConstituencies], ...);
}
```

**After:**
```typescript
export function questionCategoryStore({
  dataRoot,
  selectedElections,
  selectedConstituencies,
}: {
  dataRoot: () => DataRoot;           // getter function
  selectedElections: () => Array<Election>;
  selectedConstituencies: () => Array<Constituency>;
}): { readonly value: Array<QuestionCategory> } {  // reactive object
  // OR return a $derived directly
}
```

**Alternative approach (simpler):** Instead of passing getters, the sub-modules can be inlined into the context files. Since VoterContext and CandidateContext are the only consumers of most sub-modules, inlining the `$derived` chains eliminates the need for the sub-module function signature redesign. However, this increases context file size. Given D-01 says "keep the same semantic structure unless consolidation provides clear benefits," the getter approach is recommended to preserve modularity.

**Recommended getter convention:** Use `() => T` getter functions as parameters. Inside sub-modules, call these getters within `$derived` expressions to establish reactive dependencies:

```typescript
const questionCategories = $derived.by(() => {
  const root = dataRoot();  // calls getter, tracks dependency
  const elections = selectedElections();
  const constituencies = selectedConstituencies();
  return root.questionCategories?.filter(...) ?? [];
});
```

### Anti-Patterns to Avoid

- **Direct $state assignment from destructured context:** Cannot do `let { x } = getCtx(); x = newValue;` -- this doesn't update the context's state. Use object wrappers or keep the context reference.
- **$effect for what should be $derived:** Don't use `$effect` to compute values that are pure derivations. Use `$derived` or `$derived.by()`.
- **Nested $derived.by for simple expressions:** Use `$derived(expr)` for simple single-expression derivations. Only use `$derived.by(() => { ... })` when you need multi-statement logic.
- **Module-level $state:** All $state must be inside `initXxxContext()` factory functions to ensure SSR safety (R2.12).
- **Breaking the `get()` helper for imperative reads:** Some code uses `get(store)` from `svelte/store` for imperative reads (e.g., `get(getRoute)` in candidateContext logout). After conversion, these become direct reads of the reactive value since `$state`/`$derived` values can be read anywhere.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Storage persistence | Custom $effect + localStorage | `persistedState.svelte.ts` (already exists) | Already $state-based, handles versioning, SSR-safe |
| Store-to-rune bridge | Manual subscribe/unsubscribe | `toStore()` / `fromStore()` from `svelte/store` | Official Svelte 5 bridge API |
| Memoized derivation | Custom equality checking | `$derived` with `$derived.by` | Svelte 5 `$derived` already does reference equality; deep equality rare |
| Reactive parameter passing | Custom signal/observable | Getter functions `() => T` | Simple, composable, works with $derived tracking |

**Key insight:** Most sub-module complexity was dealing with Svelte 4's store subscription model. With runes, the sub-modules become dramatically simpler -- most `derived()` calls become single `$derived()` expressions.

## Common Pitfalls

### Pitfall 1: answerStore Subscribe Pattern in Located Layout

**What goes wrong:** The `(voters)/(located)/+layout.svelte` file uses `nominationsAvailable.subscribe()` imperatively to await settlement of derived chain. After conversion, `.subscribe()` is not available on plain `$derived` values.
**Why it happens:** The file uses imperative subscription to implement a polling/settlement pattern that waits for the reactive chain to stabilize after data provision.
**How to avoid:** This specific pattern needs rethinking. Options: (1) Use `$effect` with a promise-based settle approach, (2) Use `toStore()` to re-wrap the value for the imperative subscribe, (3) Refactor the settlement pattern to use a simple `$effect` that watches the derived value.
**Warning signs:** Runtime errors about `.subscribe is not a function`.

### Pitfall 2: `get()` Calls in Async Functions

**What goes wrong:** CandidateContext uses `get(store)` from svelte/store in async functions like `logout()`, `preregister()`, etc. to read current store values.
**Why it happens:** `get()` is the Svelte 4 way to imperatively read a store value outside of component context.
**How to avoid:** After conversion, reactive values are just JavaScript values -- read them directly. `get(getRoute)` becomes just `getRoute` (since `getRoute` after Phase 51 is a direct reactive value). But be careful: in async contexts, you may need to capture the value before the `await` to avoid reading stale values.
**Warning signs:** Values unexpectedly changing between `await` calls.

### Pitfall 3: filterStore `t: readable(t)` Wrapping

**What goes wrong:** VoterContext currently wraps `t` (a non-store value) in `readable()` to pass it to `filterStore`, which expects `Readable<T>`.
**Why it happens:** filterStore's API required all inputs as `Readable<T>`.
**How to avoid:** After conversion, filterStore accepts getter functions. Pass `() => t` or just pass `t` directly since `t` is a function that doesn't change per request.
**Warning signs:** TypeScript errors about incompatible parameter types.

### Pitfall 4: CandidateUserDataStore Internal Subscriptions

**What goes wrong:** `candidateUserDataStore` subscribes to `answersLocked` store to trigger `resetUnsaved()`. With runes, `.subscribe()` doesn't exist on reactive values.
**Why it happens:** Store subscription was used for side effects.
**How to avoid:** Replace with `$effect(() => { if (answersLocked()) resetUnsaved(); })`. But note: `$effect` requires component initialization context. Since `candidateUserDataStore` is called from `initCandidateContext()`, which runs during component init, this works.
**Warning signs:** `$effect` can only be used during component initialization errors.

### Pitfall 5: `page` Import Migration in CandidateContext

**What goes wrong:** CandidateContext imports `page` from `$app/stores`. Phase 50 migrates `$app/stores` to `$app/state`, but this file might still have the old import.
**Why it happens:** Phase 50 handles `$app/stores` migration, but the candidateContext file is also modified in Phase 52. Need to coordinate.
**How to avoid:** Phase 50's D-03 states all `$app/stores` files are migrated in Phase 50, including candidateContext.ts. By the time Phase 52 runs, the import will already be `page` from `$app/state`. The Phase 52 implementation should work from the post-Phase-50/51 codebase.
**Warning signs:** N/A -- Phase 50 handles this.

### Pitfall 6: MatchStore's Algorithm Instance

**What goes wrong:** VoterContext creates `new MatchingAlgorithm({...})` once and passes it to `matchStore`. This is not reactive and shouldn't be wrapped in `$state`.
**Why it happens:** Confusion about what needs to be reactive.
**How to avoid:** `algorithm` is a stateless computation engine -- it stays as a plain object. Only its inputs (answers, nominations, questions) need reactive tracking.
**Warning signs:** Unnecessary re-creation of algorithm instance.

### Pitfall 7: Consumer Destructuring of Writable Properties

**What goes wrong:** Consumers destructure writable properties from context (`const { firstQuestionId } = getVoterContext()`) and then try to assign to them (`$firstQuestionId = null`). After migration, the assignment pattern changes.
**Why it happens:** `$state` values lose reactivity when destructured.
**How to avoid:** For writable properties backed by `sessionStorageWritable`/`localStorageWritable`, keep returning the Writable-compatible object. Consumers continue using `$firstQuestionId = null` because the persistedState utility returns a `Writable<T>` (via `toStore()`). For non-persisted writables, decide whether to keep using `toStore()` wrapper or switch to object-with-setter pattern.
**Warning signs:** Assignments to destructured values having no effect.

## Code Examples

### Example 1: VoterContext Derived Chain Conversion

```typescript
// voterContext.svelte.ts (after Phase 51 completes)

// AppContext properties are now direct reactive values (from Phase 51)
const { appSettings, dataRoot, getRoute, locale, startEvent, t } = getAppContext();

// Simple derived -- was: derived([appSettings, dataRoot], ([appSettings, dataRoot]) => ...)
const electionsSelectable = $derived(
  !appSettings.elections?.disallowSelection && dataRoot.elections?.length !== 1
);

// Multi-input derived
const constituenciesSelectable = $derived(
  dataRoot.elections?.some((e: Election) => !e.singleConstituency)
);
```

### Example 2: answerStore Conversion

```typescript
// answerStore.svelte.ts
import { localStorageWritable } from '../utils/persistedState.svelte';

export function answerStore({ startEvent }: { startEvent: TrackingService['startEvent'] }): AnswerStore {
  const store = localStorageWritable('VoterContext-answerStore', Object.freeze({}) as Frozen<Answers>);

  // store is a Writable<T> backed by $state internally
  // Consumers can subscribe or use $store syntax via toStore() bridge

  function setAnswer(questionId: string, value?: Answer['value']): void {
    store.update((answers) => {
      const updated = structuredClone(answers) as Answers;
      if (value === undefined) {
        delete updated[questionId];
        startEvent('answer_delete', { questionId });
      } else {
        updated[questionId] = { value };
        startEvent('answer', { ... });
      }
      return deepFreeze(updated);
    });
  }

  // Return keeps the same shape -- the key decision is whether
  // to expose `subscribe` (store compat) or a reactive property
  return {
    deleteAnswer: (qId) => setAnswer(qId),
    reset: () => { store.set(Object.freeze({})); startEvent('answer_resetAll'); },
    setAnswer,
    subscribe: store.subscribe  // backward-compat if needed by matchStore
  };
}
```

### Example 3: Consumer Component Conversion

```svelte
<!-- Before: results/+layout.svelte -->
<script>
  const { matches, elections, ... } = getVoterContext();
  // Uses $matches, $elections everywhere in template
</script>
{#if $elections.length > 1}
  {#each $elections as election}
    ...
  {/each}
{/if}

<!-- After: -->
<script>
  const { matches, elections, ... } = getVoterContext();
  // Direct access: matches, elections (reactive values)
</script>
{#if elections.length > 1}
  {#each elections as election}
    ...
  {/each}
{/if}
```

### Example 4: AdminContext Conversion (Simplest)

```typescript
// adminContext.svelte.ts
export function initAdminContext(): AdminContext {
  const appContext = getAppContext();
  const authContext = getAuthContext();

  // Was: const userData = writable<BasicUserData | undefined>(undefined);
  let userData = $state<BasicUserData | undefined>(undefined);

  const jobs = jobStores();

  // DataWriter wrappers stay as plain async functions (no reactivity needed)
  // ...

  return setContext<AdminContext>(CONTEXT_KEY, {
    ...appContext,
    ...authContext,
    get userData() { return userData; },
    set userData(v) { userData = v; },
    jobs,
    updateQuestion, getActiveJobs, getPastJobs, startJob,
    getJobProgress, abortJob, abortAllJobs, insertJobResult
  });
}
```

## Detailed Inventory of Changes

### VoterContext Ecosystem

| File | Lines | Store Imports | Change Type |
|------|-------|--------------|-------------|
| voterContext.ts | 264 | derived, get, readable | Full rewrite to $derived |
| voterContext.type.ts | 87 | Readable, Writable | Remove store type wrappers |
| answerStore.ts | 54 | (via persistedState) | Minimal -- already $state internally |
| answerStore.type.ts | 23 | Readable | Change base type |
| matchStore.ts | 111 | derived, Readable | Full rewrite to $derived |
| filterStore.ts | 76 | derived, Readable | Full rewrite to $derived |
| nominationAndQuestionStore.ts | 114 | derived, Readable | Full rewrite to $derived |
| countAnswers.ts | 17 | (none) | No change |
| voter.ts | 7 | (none) | No change |

### CandidateContext Ecosystem

| File | Lines | Store Imports | Change Type |
|------|-------|--------------|-------------|
| candidateContext.ts | 333 | derived, get, writable | Full rewrite |
| candidateContext.type.ts | 178 | Readable, Writable | Remove store type wrappers |
| candidateUserDataStore.ts | 246 | derived, get, writable, Readable | Full rewrite |
| candidateUserDataStore.type.ts | 106 | Readable | Change base type |

### AdminContext Ecosystem

| File | Lines | Store Imports | Change Type |
|------|-------|--------------|-------------|
| adminContext.ts | 116 | writable | Simple $state conversion |
| adminContext.type.ts | 52 | Writable | Remove store type wrapper |
| jobStores.ts | 150 | derived, writable | Rewrite to $state/$derived |
| jobStores.type.ts | 30 | Readable | Remove store type wrappers |

### Shared Utils (Used by Both Voter and Candidate)

| File | Lines | Store Imports | Change Type |
|------|-------|--------------|-------------|
| questionBlockStore.ts | 99 | derived, readable, Readable | Full rewrite to $derived |
| questionCategoryStore.ts | 53 | derived, Readable | Full rewrite to $derived |
| questionStore.ts | 42 | derived, Readable | Full rewrite to $derived |
| paramStore.ts | 21 | (via memoizedDerived) | May already be updated by Phase 50/51 |
| memoizedDerived.ts | 52 | derived, get, writable, Readable | DELETE after no consumers remain |

### Consumer Files

| Category | Files | $store Occurrences |
|----------|-------|-------------------|
| Voter route files | 14 | ~82 |
| Voter dynamic components | 5 | ~10 |
| Candidate route files | 20 | ~95 |
| Candidate components | 2 | ~13 |
| Admin route files | 7 | ~4 |
| Admin components | 3 | ~4 |
| Shared (Banner) | 1 | ~1 |
| **TOTAL** | **~52** (deduplicated) | **~209** |

*Note: Some files use both VoterContext and AppContext -- the AppContext $store references were already handled in Phase 51. The counts above reflect only the VoterContext/CandidateContext/AdminContext-specific $store references.*

## Conversion Order Strategy

The recommended order within Phase 52:

1. **Shared utils first:** questionCategoryStore, questionStore, questionBlockStore (used by both Voter and Candidate contexts)
2. **VoterContext sub-modules:** answerStore, matchStore, filterStore, nominationAndQuestionStore
3. **VoterContext main + types + consumers** (19 consumer files)
4. **CandidateContext sub-modules:** candidateUserDataStore
5. **CandidateContext main + types + consumers** (27 consumer files)
6. **AdminContext:** jobStores, adminContext + types + consumers (14 consumer files)
7. **memoizedDerived.ts deletion** (if no remaining consumers)
8. **Grep sweep validation** (D-03)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `derived([a, b], ([a, b]) => ...)` | `$derived(() => { ... })` | Svelte 5 (2024) | Dramatically simpler reactive computations |
| `writable<T>(value)` | `let x = $state<T>(value)` | Svelte 5 (2024) | No import needed, TypeScript-native |
| `Readable<T>` / `Writable<T>` types | Plain `T` (reactive via context) | Svelte 5 (2024) | Simpler type definitions |
| `$store` auto-subscription syntax | Direct property access | Svelte 5 (2024) | Less magic, more explicit |
| `get(store)` for imperative reads | Direct value read | Svelte 5 (2024) | No import needed |

## Open Questions

1. **Sub-module function signature pattern**
   - What we know: Sub-modules currently accept `Readable<T>` and return `Readable<T>`. With runes, inputs become getter functions and outputs become reactive values.
   - What's unclear: Best pattern for passing reactive values to sub-module factory functions -- getter functions `() => T`, object references, or inline the sub-modules into context.
   - Recommendation: Use getter functions `() => T` for modularity. This preserves the sub-module boundaries while working naturally with `$derived`.

2. **persistedState Writable compatibility**
   - What we know: `persistedState.svelte.ts` returns `Writable<T>` via `toStore()`. Consumer components currently use `$store` syntax for reads/writes.
   - What's unclear: After removing all `$store` syntax, how do consumers write to persisted values? The `Writable` interface supports `.set()` and `.update()`, but the goal is zero `svelte/store` types.
   - Recommendation: For this phase, keep `persistedState.svelte.ts` returning `Writable<T>` -- it's a bridge utility. Consumers accessing persisted values through context can use the context's getter/setter pattern. The `Writable<T>` type import from `svelte/store` in the persistedState utility itself is acceptable (it's infrastructure, not application code). The grep validation (D-03) targets `apps/frontend/src/lib/contexts/` and `apps/frontend/src/lib/components/` specifically.

3. **Located layout nomination settlement pattern**
   - What we know: Uses imperative `.subscribe()` on `nominationsAvailable` store for settlement detection.
   - What's unclear: Best rune-based equivalent for "wait for reactive value to stabilize."
   - Recommendation: Refactor to use `$effect` with a debounce timeout. The reactive chain should settle faster with native runes (no store compatibility overhead).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `apps/frontend/vitest.config.ts` |
| Quick run command | `yarn test:unit` |
| Full suite command | `yarn test:unit` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R2.7 | VoterContext uses $state/$derived | smoke | `yarn build --filter=@openvaa/frontend` | N/A (build test) |
| R2.8 | CandidateContext uses $state/$derived | smoke | `yarn build --filter=@openvaa/frontend` | N/A (build test) |
| R2.9 | AdminContext uses $state/$derived | smoke | `yarn build --filter=@openvaa/frontend` | N/A (build test) |
| R2.10 | API shape preserved | unit | `yarn test:unit` | Existing tests |
| R2.11 | Files renamed to .svelte.ts | manual | Check file extensions | N/A |
| R2.12 | SSR safety | smoke | `yarn build --filter=@openvaa/frontend` | N/A (build test) |
| R3.1-R3.3 | Zero $store references | grep | See D-03 commands | N/A |
| NF4 | No test regressions | unit | `yarn test:unit` | Existing tests |

### Sampling Rate

- **Per task commit:** `yarn build --filter=@openvaa/frontend`
- **Per wave merge:** `yarn test:unit && yarn build --filter=@openvaa/frontend`
- **Phase gate:** Full suite green + grep sweep validation (D-03)

### Wave 0 Gaps

None -- existing test infrastructure covers all phase requirements. The primary validation mechanism is build success + grep sweep, not new unit tests.

## Sources

### Primary (HIGH confidence)

- Direct code analysis of all 20+ source files in the voter/candidate/admin context directories
- Phase 49 RESEARCH.md -- established patterns for utility store replacement
- Phase 50 and Phase 51 CONTEXT.md -- carry-forward decisions D-01 through D-04
- `persistedState.svelte.ts` source -- confirmed $state-based internals with toStore() bridge
- `memoizedDerived.ts` source -- confirmed transitional bridge, marked for deletion in Phases 50-52
- Svelte 5.53.12 installed -- $state, $derived, $derived.by, $effect, toStore, fromStore all available

### Secondary (MEDIUM confidence)

- Consumer file grep counts (123 + 117 + 8 = 248 occurrences across ~59 files) -- automated count may include some false positives from variable names containing `$`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and verified
- Architecture: HIGH -- patterns established by Phases 49-51, confirmed by source code analysis
- Pitfalls: HIGH -- identified from direct source code analysis of actual usage patterns
- Consumer counts: MEDIUM -- grep-based counting may have minor inaccuracies

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable -- internal codebase, no external dependency changes)
