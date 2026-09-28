---
phase: 110-votercontext-orchestrator-voter-sub-stores
reviewed: 2026-06-13T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts
  - apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts
  - apps/frontend/src/lib/contexts/voter/nominationAndQuestionStore.svelte.ts
  - apps/frontend/src/lib/contexts/voter/filters/filterStore.svelte.ts
  - apps/frontend/src/lib/contexts/utils/paramStore.svelte.ts
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
findings:
  critical: 0
  warning: 1
  info: 3
  total: 4
status: clean
---

# Phase 110: Code Review Report

**Reviewed:** 2026-06-13T00:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** clean (WR-01 fixed; IN-01/02/03 pre-existing — deferred)

## Summary

Phase 110 converts the voter context orchestrator (`voterContext.svelte.ts`) and five sub-stores (`answerStore`, `matchStore`, `nominationAndQuestionStore`, `filterStore`, `paramStore`) from object-literal factory closures to Svelte 5 classes, and deletes three dead projection factories. The refactor is behaviorally faithful: every `$derived`/`$effect` body and sub-store projection is preserved verbatim; factory signatures are byte-identical; the destructure-trap contract is maintained via prototype getters.

The D1 ordering concern (producer field initializers reading deps declared after them) is correctly handled by the §20 lazy-body rule — all `$derived.by` bodies defer reads until first invocation, by which time all field initializers have completed. The `paramStore` definite-assignment fix (`#param!: TParam`) is type-only and runtime-correct for the same reason.

`Object.assign(this, this.#appContext)` correctly copies own-enumerable members from the Phase-109 `AppContextProvider` instance; the `readonly x!: AppContext['x']` declarations are purely TypeScript-level and do not interfere at runtime. No consumer spread of `voterContext` was found.

No BLOCKER-level issues were introduced by Phase 110. One WARNING is raised for a latent encapsulation gap; three INFO items note pre-existing code smells that survived the refactor unchanged.

## Warnings

### WR-01: `VoterContextProvider` exported from public barrel — constructor requires effect context and side-effectful `initFilterContext` [FIXED: a3045494b]

**File:** `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:66` (re-exported via `apps/frontend/src/lib/contexts/voter/index.ts`)

**Issue:** `VoterContextProvider` is declared `export class` and re-exported from the voter barrel (`index.ts`). Its constructor (a) requires a Svelte effect context (it registers five `$effect` blocks), and (b) calls `initFilterContext()` as a side effect. Calling `new VoterContextProvider()` outside `initVoterContext()` bypasses the `CONTEXT_KEY` double-init guard, would throw `effect_orphan` or `initFilterContext called for a second time` in non-component scopes, and would install a duplicate Svelte context key. No current consumer does this (confirmed by grep across `src/`), but the class being publicly importable makes the hazard discoverable-but-invisible.

**Fix:** Either restrict the export to avoid re-exporting the class from the barrel, or add a JSDoc `@internal` marker and `@throws` annotation to signal the construction constraint:

```ts
// In voterContext.svelte.ts — add before the class declaration:
/**
 * @internal — construct only via `initVoterContext()`. Requires an effect context
 * (component `<script>` or `$effect.root`). Calling `new VoterContextProvider()`
 * directly bypasses the CONTEXT_KEY guard and the double-init protection on
 * `initFilterContext`.
 */
export class VoterContextProvider implements VoterContext {
```

Or, if the class export is only needed for `instanceof` checks or typing, re-export only the type:

```ts
// In index.ts — replace the star re-export with selective exports:
export type { VoterContextProvider } from './voterContext.svelte';
export { getVoterContext, initVoterContext } from './voterContext.svelte';
```

**Applied fix:** Added `@internal`/`@throws` JSDoc block to `VoterContextProvider` warning that direct construction bypasses the `CONTEXT_KEY` guard. Narrowed barrel `index.ts` from `export *` to selective exports: `export type { VoterContextProvider }` (type-only) + `export { getVoterContext, initVoterContext }` (values). Commit: `a3045494b`.

## Info

### IN-01: Dead `!currentT` guard branch in `filterStore` early-return [PRE-EXISTING — deferred]

**File:** `apps/frontend/src/lib/contexts/voter/filters/filterStore.svelte.ts:37`

**Issue:** The guard `if (!nq || !currentLocale || !currentT) return {} as FilterTree` contains a dead sub-condition. `currentT` is assigned `this.#deps.t()` where `t` is `() => this.#t` — a thunk returning the translation function. The translation function is always a non-null function reference; `!currentT` is therefore always `false`. This is pre-existing behavior (the same condition appears in the pre-Phase-110 factory), carried into the class verbatim.

**Status:** Pre-existing behavior (identical condition in pre-Phase-110 factory); not introduced by Phase 110. Deferred to a future clean-up phase.

**Fix:** Remove `!currentT` from the guard:

```ts
if (!nq || !currentLocale) return {} as FilterTree;
```

### IN-02: `nominationAndQuestionStore` mutates shared `DataRoot` object (`candidateNominationIds`) [PRE-EXISTING — deferred]

**File:** `apps/frontend/src/lib/contexts/voter/nominationAndQuestionStore.svelte.ts:101`

**Issue:** Inside the `$derived.by` body, `organization.data.candidateNominationIds` is reassigned in-place:

```ts
organization.data.candidateNominationIds = organization.data.candidateNominationIds?.filter(
  (id) => !candidateNominationsWithMissingAnswers?.has(id)
);
```

This mutates the `OrganizationNomination.data` object that lives inside `DataRoot`, which is a shared singleton ("Single source of truth" per `@openvaa/data` philosophy). Each re-evaluation of the `$derived.by` block (e.g., on election/constituency change) progressively shrinks `candidateNominationIds`, potentially causing cumulative data loss across re-renders. Pre-existing behavior; not introduced by Phase 110.

**Status:** Pre-existing mutation (exists in the pre-Phase-110 factory); not introduced by Phase 110. Deferred to a future clean-up phase.

**Fix:** Filter without mutating the shared object by using a local variable:

```ts
const filteredIds = organization.data.candidateNominationIds?.filter(
  (id) => !candidateNominationsWithMissingAnswers?.has(id)
);
const filteredNominations = nominations.filter(
  (n) => (filteredIds?.length ?? 0) > 0 &&
    filteredIds!.includes((n as OrganizationNomination).data.candidateNominationIds?.[0] ?? '')
);
```

Or, more cleanly, derive the filtered nomination list without touching `.data`:

```ts
nominations = nominations.filter((n) => {
  const ids = (n as OrganizationNomination).data.candidateNominationIds;
  return ids?.some((id) => !candidateNominationsWithMissingAnswers?.has(id)) ?? false;
});
```

### IN-03: `{} as never` type-erasure cast in `matchStore` — bypasses exhaustiveness [PRE-EXISTING — deferred]

**File:** `apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts:57`

**Issue:** `const electionMatches: Record<EntityType, Array<MaybeWrappedEntityVariant>> = {} as never` uses `as never` to silence a TypeScript error. `Record<EntityType, ...>` requires all `EntityType` keys to be present, but the object is built incrementally. The `as never` cast prevents the compiler from catching cases where an `EntityType` is never assigned (e.g., if a new type is added to `ENTITY_TYPE` enum and the loop doesn't handle it). Pre-existing.

**Status:** Pre-existing cast (exists in the pre-Phase-110 factory); not introduced by Phase 110. Deferred to a future clean-up phase.

**Fix:** Use `Partial` for accumulation and cast to the full record type only at the return site:

```ts
const electionMatches: Partial<Record<EntityType, Array<MaybeWrappedEntityVariant>>> = {};
// ... fill in loop ...
tree[electionId] = electionMatches as Record<EntityType, Array<MaybeWrappedEntityVariant>>;
```

---

_Reviewed: 2026-06-13T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
