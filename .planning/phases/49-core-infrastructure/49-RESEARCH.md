# Phase 49: Core Infrastructure - Research

**Researched:** 2026-03-27
**Domain:** Svelte 5 runes migration -- utility store replacement layer
**Confidence:** HIGH

## Summary

Phase 49 replaces the three custom store utilities (`parsimoniusDerived`, `storageStore`, `stackedStore`) that form the foundation of the context system. These utilities are imported by 12, 6, and 2 context files respectively, totaling 28 `parsimoniusDerived` call sites, 8 `storageStore` call sites, and 3 `stackedStore` instantiations.

The critical constraint is **backward compatibility**: all consumers of these utilities are context files scheduled for rewrite in Phases 50-52. The replacement utilities must maintain Svelte 4 store interfaces (`Readable<T>`, `Writable<T>`, `$store` subscription syntax) so the build stays green while only the utility internals change. Svelte 5.53.12 provides `toStore()` from `svelte/store` for bridging `$state`/`$derived` to store-compatible interfaces.

**Primary recommendation:** Create new `.svelte.ts` utility files using `$state`/`$derived` internally but exposing backward-compatible store interfaces. Replace `parsimoniusDerived` consumers with native `derived()` from `svelte/store` (transitional step). Delete all three old utility files. The 5 call sites using `differenceChecker` need a thin `memoizedDerived` helper or inline equality logic as a bridge.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R1.1 | Replace `parsimoniusDerived` with native `$derived` | 28 call sites across 12 files identified. 23 can use plain `derived()` as transitional step. 5 need `differenceChecker` bridge (2 use `JSON.stringify`, 3 use `hashIds`). Full `$derived` conversion happens in Phases 50-52 when contexts are rewritten. |
| R1.2 | Replace `storageStore` with `$state` + localStorage wrapper | New `persistedState.svelte.ts` using `$state` + `$effect`. Must export `localStorageWritable`/`sessionStorageWritable` with `Writable<T>` interface for backward compat. 8 consumer call sites in 6 files. |
| R1.3 | Replace `stackedStore` with `$state`-based stack | New `StackedState.svelte.ts` class with `$state` internals. Must expose `Readable<T>` `.subscribe()` via `toStore()` for `$topBarSettings` etc. 3 instances in `layoutContext.ts`, consumed by 22+ template-level `$store` reads. |
| R1.4 | Remove all custom store utility files after migration | Delete `parsimoniusDerived.ts`, `storageStore.ts`, `stackedStore.ts`. Verify zero imports remain. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Use TypeScript strictly -- avoid `any`, prefer explicit types
- Test accessibility -- WCAG 2.1 AA compliant (not directly relevant to this phase)
- Build system: Turborepo with `yarn build` / `yarn test:unit`
- Monorepo structure: changes are entirely within `apps/frontend/src/lib/contexts/utils/`
- Check code against [Code review checklist](docs/code-review-checklist.md)
- Never commit sensitive data

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte | 5.53.12 | Framework with runes (`$state`, `$derived`, `$effect`) | Already installed; all rune APIs available |
| SvelteKit | 2.55.0 | App framework; provides `$app/environment` (`browser`) | Already installed |
| svelte/store | 5.53.12 | `toStore()`, `fromStore()`, `derived()`, `Readable`, `Writable` | Bridge API for rune-to-store compat |
| Vitest | 3.2.4 | Unit test framework | Already configured |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @sveltejs/vite-plugin-svelte | 6.2.1 | Handles `.svelte.ts` file compilation | Already installed; enables runes in `.svelte.ts` |
| @openvaa/app-shared | workspace | `staticSettings.appVersion` for storage versioning | Already used by storageStore |

### Alternatives Considered

None. All tools are already in the project. No new dependencies needed.

## Architecture Patterns

### Recommended File Structure

```
apps/frontend/src/lib/contexts/utils/
  persistedState.svelte.ts    # NEW: $state + $effect storage persistence
  StackedState.svelte.ts      # NEW: $state-based stacked store class
  memoizedDerived.ts          # NEW: thin bridge for differenceChecker pattern
  prepareDataWriter.ts        # UNCHANGED
  questionBlockStore.ts       # MODIFIED: parsimoniusDerived -> derived
  questionBlockStore.type.ts  # UNCHANGED
  questionStore.ts            # MODIFIED: parsimoniusDerived -> derived
  questionCategoryStore.ts    # MODIFIED: parsimoniusDerived -> derived
  dataCollectionStore.ts      # MODIFIED: parsimoniusDerived -> derived
  paramStore.ts               # MODIFIED: parsimoniusDerived -> memoizedDerived
  pageDatumStore.ts           # MODIFIED: parsimoniusDerived -> memoizedDerived
  parsimoniusDerived.ts       # DELETED
  storageStore.ts             # DELETED
  stackedStore.ts             # DELETED
```

### Pattern 1: Persisted State with $state + $effect

**What:** Replace `storageStore.ts` with a rune-based persistence utility that wraps `$state` and uses `$effect` to sync to localStorage/sessionStorage. Export backward-compatible `Writable<T>` functions.

**When to use:** Any context that needs browser-persisted reactive state.

**Key implementation detail:** The `$effect` for persistence MUST be created during component initialization context (called from `initXxxContext()` in layout files). This works because `initXxxContext()` is always called during component `<script>` execution.

```typescript
// persistedState.svelte.ts
import { browser } from '$app/environment';
import { toStore } from 'svelte/store';
import type { Writable } from 'svelte/store';

export function localStorageWritable<T>(key: string, defaultValue: T): Writable<T> {
  const stored = browser ? loadFromLocalStorage<T>(key) : null;
  let value = $state<T>(stored ?? defaultValue);

  if (browser) {
    $effect(() => {
      saveToLocalStorage(key, value);
    });
  }

  return toStore(
    () => value,
    (v) => { value = v; }
  );
}
```

**Why `toStore()` bridge:** Components still use `$store` syntax (e.g., `$userPreferences`) until context rewrites in Phases 50-52. The `toStore()` function from `svelte/store` creates a proper `Writable<T>` that bridges `$state` reactivity to store subscriptions.

### Pattern 2: StackedState Class with Store Bridge

**What:** Replace `stackedStore.ts` with a class that uses `$state` for the internal stack and exposes both class methods and a `Readable<T>` interface via `toStore()`.

**When to use:** Layout context settings (topBarSettings, pageStyles, navigationSettings).

```typescript
// StackedState.svelte.ts
import { toStore } from 'svelte/store';
import type { Readable } from 'svelte/store';

export class StackedState<TMerged, TAddition = TMerged> {
  #stack: TMerged[] = $state([]);
  #updater: (current: TMerged[], value: TAddition) => TMerged[];

  readonly current: TMerged = $derived(this.#stack[this.#stack.length - 1]);

  constructor(initialValue: TMerged, updater: (current: TMerged[], value: TAddition) => TMerged[]) {
    this.#stack = [initialValue];
    this.#updater = updater;
  }

  push(value: TAddition): void {
    this.#stack = this.#updater(this.#stack, value);
  }

  revert(index: number): TMerged {
    if (index < 0) throw new Error('StackedState.revert: index cannot be negative');
    if (index < this.#stack.length - 1) {
      this.#stack = this.#stack.slice(0, index + 1);
    }
    return this.#stack[this.#stack.length - 1];
  }

  getLength(): number {
    return this.#stack.length;
  }

  /** Backward-compatible Readable<T> for $store syntax */
  get subscribe(): Readable<TMerged>['subscribe'] {
    return toStore(() => this.current).subscribe;
  }
}
```

**Consumer compatibility:** The `StackedStore<T>` type exposes `{ push, revert, getLength, subscribe }`. The new `StackedState` class exposes the same four members. The layoutContext type needs updating to use `StackedState` instead of `StackedStore`, but the runtime shape is identical. Components using `$topBarSettings` (store subscription) continue working because `subscribe` is present.

### Pattern 3: Transitional parsimoniusDerived Replacement

**What:** Replace `parsimoniusDerived()` calls with native `derived()` from `svelte/store`. For the 5 call sites needing `differenceChecker`, use a thin `memoizedDerived()` helper.

**When to use:** As a transitional step. These will become `$derived` in Phases 50-52 when contexts are fully rewritten.

```typescript
// memoizedDerived.ts
import { derived, get, writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Readable } from 'svelte/store';

type Stores = Readable<any> | [Readable<any>, ...Array<Readable<any>>] | Array<Readable<any>>;
type StoresValues<T> = T extends Readable<infer U>
  ? U
  : { [K in keyof T]: T[K] extends Readable<infer U> ? U : never };

/**
 * A derived store with equality checking via a differenceChecker function.
 * Bridge utility for the 5 former parsimoniusDerived call sites that used
 * differenceChecker. Will be removed when contexts are rewritten to $derived.
 */
export function memoizedDerived<TInput extends Stores, TOutput>(
  input: TInput,
  update: (args: StoresValues<TInput>) => TOutput,
  options: {
    differenceChecker: (value: TOutput) => unknown;
    initialValue?: TOutput;
  }
): Readable<TOutput> {
  const output = writable<TOutput>(options.initialValue);

  if (browser) {
    const deriver = derived(input, update, options.initialValue);
    deriver.subscribe((v) => {
      if (options.differenceChecker(get(output)) === options.differenceChecker(v)) return;
      output.set(v);
    });
  }

  return { subscribe: output.subscribe };
}
```

**Why not inline the equality check:** The `differenceChecker` pattern appears in `paramStore`, `pageDatumStore` (both `JSON.stringify`), and `candidateContext` (3x `hashIds`). A shared helper avoids code duplication for this transitional step. The helper itself will be deleted in Phase 52 when these contexts become `$derived.by()`.

### Anti-Patterns to Avoid

- **Module-level $state in utility files:** Never declare `$state` at module scope in `.svelte.ts` utility files. All `$state` must be inside functions or class constructors that are called during component initialization. Module-level state leaks across SSR requests.

- **Using $effect where $derived suffices:** The `persistedState` utility is the ONLY place `$effect` is appropriate (side effect: writing to storage). All computation should use `$derived` or `derived()`.

- **Creating new store abstractions:** Do not create additional store wrappers. The goal is to move toward `$state`/`$derived`, not to create new store utilities. `memoizedDerived` and `toStore()` bridges are explicitly transitional.

- **Mutating StackedState.#stack in place:** Always reassign `this.#stack = newArray` rather than using `.splice()` or `.push()` on the array. `$state` deep reactivity tracks mutations, but reassignment is cleaner and matches the intended Svelte 5 pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rune-to-store bridge | Custom subscribe/set wrapper | `toStore()` from `svelte/store` | Official Svelte 5 API, handles edge cases (SSR, teardown) |
| Store-to-rune bridge | Custom reactive wrapper | `fromStore()` from `svelte/store` | Official API; not needed in Phase 49 but useful for reference |
| SSR environment detection | Custom checks | `browser` from `$app/environment` | Already used; reliable SSR guard |
| Deep equality for derived | Custom deep-equal lib | `JSON.stringify` / `hashIds` (existing) | Already proven in codebase; temporary until `$derived` |

**Key insight:** Svelte 5 provides `toStore()` and `fromStore()` specifically for the store-to-rune migration path. These are the officially blessed bridge mechanisms. Using them avoids fragile custom implementations.

## Common Pitfalls

### Pitfall 1: $effect Not Available Outside Component Init

**What goes wrong:** Creating `$effect` in a utility function that is called outside component initialization throws `effect_orphan` runtime error.
**Why it happens:** `$effect` requires a component lifecycle context. Utility functions called lazily (e.g., in event handlers) don't have this context.
**How to avoid:** Ensure all `$effect` usage is within functions called from `initXxxContext()` (which runs during `<script>` in layout components). The `persistedState` utility is safe because `localStorageWritable` is always called from context init functions.
**Warning signs:** `effect_orphan` error in browser console; works in dev but fails on navigation.

### Pitfall 2: toStore() Must Be Called in Reactive Context

**What goes wrong:** `toStore()` called at module level or in a non-reactive scope creates a store that doesn't update when the underlying `$state` changes.
**Why it happens:** `toStore()` captures the active reaction context at call time. If there's no active context, the internal `render_effect` cannot track changes.
**How to avoid:** Call `toStore()` inside class constructors or functions that execute during component init. For the `StackedState` class, the `subscribe` getter creates the store lazily on first access, which happens during component init.
**Warning signs:** Store subscribers never receive updates after initial value.

### Pitfall 3: .svelte.ts Extension Required for Runes

**What goes wrong:** Using `$state`, `$derived`, or `$effect` in a regular `.ts` file causes cryptic compilation errors or the runes are treated as regular variables.
**Why it happens:** The Svelte compiler only processes runes in `.svelte` and `.svelte.ts`/`.svelte.js` files.
**How to avoid:** All new utility files that use runes MUST use the `.svelte.ts` extension. Files that only use `derived()`, `writable()` from `svelte/store` (no runes) can remain `.ts`.
**Warning signs:** `$state is not defined` errors; reactivity not working.

### Pitfall 4: localStorage Versioning Logic Must Be Preserved

**What goes wrong:** Replacing `storageStore` without preserving the version-checking logic for localStorage causes old user data to be loaded with incompatible schemas.
**Why it happens:** `storageStore` wraps localStorage values in `{ version, data }` and checks against `staticSettings.appVersion.requireUserDataVersion`. sessionStorage does NOT version data.
**How to avoid:** Port the exact versioning logic from `storageStore.ts` into `persistedState.svelte.ts`. Keep `getItemFromStorage` and `saveItemToStorage` helper functions with the same localStorage vs sessionStorage branching.
**Warning signs:** Users see stale/corrupted data after app version bump; JSON parse errors.

### Pitfall 5: StackedState Reactivity with splice/mutation

**What goes wrong:** Using `this.#stack.splice()` or `this.#stack.push()` (array mutation) triggers deep reactivity but may cause unexpected behavior with `$derived`.
**Why it happens:** `$state` proxies track deep mutations, but `$derived` with referential equality on the array won't detect mutations since the array reference doesn't change.
**How to avoid:** Always create a new array: `this.#stack = [...newItems]` or `this.#stack = this.#stack.slice(0, index + 1)`. This ensures referential change.
**Warning signs:** Layout settings not reverting properly on navigation.

### Pitfall 6: storageStore Subscribe-on-Create Side Effect

**What goes wrong:** The current `storageStore` subscribes to the store immediately on creation (line 49: `store.subscribe((value) => saveItemToStorage(...))`), which writes the initial value to storage on creation. If the `$effect` replacement doesn't write on init, behavior differs.
**Why it happens:** `$effect` runs asynchronously after mount, while store `.subscribe()` fires synchronously with the current value.
**How to avoid:** The `$effect` in `persistedState.svelte.ts` will naturally write on first run (when the effect first executes). If exact timing matters, use `$effect.pre` or accept the minor timing difference (storage write after DOM update vs immediately).
**Warning signs:** Storage not populated until first state change.

## Code Examples

### Complete persistedState.svelte.ts

```typescript
// Source: Derived from existing storageStore.ts + Svelte 5 $state/$effect patterns
import { staticSettings } from '@openvaa/app-shared';
import { browser } from '$app/environment';
import { toStore } from 'svelte/store';
import { logDebugError } from '$lib/utils/logger';
import type { Writable } from 'svelte/store';

export type StorageType = 'localStorage' | 'sessionStorage';

type LocallyStoredValue<TData> = {
  version: number;
  data: TData;
};

/**
 * Create a writable store persisted in localStorage with version checking.
 */
export function localStorageWritable<TValue>(key: string, defaultValue: TValue): Writable<TValue> {
  return storageWritable('localStorage', key, defaultValue);
}

/**
 * Create a writable store persisted in sessionStorage.
 */
export function sessionStorageWritable<TValue>(key: string, defaultValue: TValue): Writable<TValue> {
  return storageWritable('sessionStorage', key, defaultValue);
}

function storageWritable<TValue>(type: StorageType, key: string, defaultValue: TValue): Writable<TValue> {
  const stored = getItemFromStorage<TValue>(type, key);
  let value = $state<TValue>(stored ?? defaultValue);

  if (browser) {
    $effect(() => {
      saveItemToStorage(type, key, value);
    });
  }

  return toStore(
    () => value,
    (v: TValue) => { value = v; }
  );
}

// getItemFromStorage and saveItemToStorage ported identically from storageStore.ts
```

### Complete StackedState.svelte.ts

```typescript
// Source: Derived from existing stackedStore.ts + Svelte 5 $state class pattern
import { toStore } from 'svelte/store';
import type { Readable } from 'svelte/store';

export class StackedState<TMerged, TAddition = TMerged> implements Readable<TMerged> {
  #stack: TMerged[] = $state([]);
  #updater: (current: TMerged[], value: TAddition) => TMerged[];

  readonly current: TMerged = $derived(this.#stack[this.#stack.length - 1]);

  constructor(initialValue: TMerged, updater: (current: TMerged[], value: TAddition) => TMerged[]) {
    this.#stack = [initialValue];
    this.#updater = updater;
  }

  push(value: TAddition): void {
    this.#stack = this.#updater([...this.#stack], value);
  }

  revert(index: number): TMerged {
    if (index < 0) throw new Error('StackedState.revert: index cannot be negative');
    if (index < this.#stack.length - 1) {
      this.#stack = this.#stack.slice(0, index + 1);
    }
    return this.#stack[this.#stack.length - 1];
  }

  getLength(): number {
    return this.#stack.length;
  }

  get subscribe(): Readable<TMerged>['subscribe'] {
    return toStore(() => this.current).subscribe;
  }
}

export function simpleStackedState<TItem>(initialValue: TItem): StackedState<TItem> {
  return new StackedState(initialValue, (current, value) => [...current, value]);
}
```

### parsimoniusDerived Replacement Pattern (for consumers)

```typescript
// BEFORE (questionStore.ts):
import { parsimoniusDerived } from './parsimoniusDerived';
return parsimoniusDerived(
  [categories, selectedElections, selectedConstituencies],
  ([categories, elections, constituencies]) => /* ... */,
  { initialValue: [] }
);

// AFTER (transitional -- still store-based):
import { derived } from 'svelte/store';
return derived(
  [categories, selectedElections, selectedConstituencies],
  ([categories, elections, constituencies]) => /* ... */,
  []  // initialValue as 3rd positional arg
);

// For consumers with differenceChecker:
// BEFORE (paramStore.ts):
import { parsimoniusDerived } from './parsimoniusDerived';
return parsimoniusDerived(page, (page) => parseParams(page)[param], { differenceChecker: JSON.stringify });

// AFTER:
import { memoizedDerived } from './memoizedDerived';
return memoizedDerived(page, (page) => parseParams(page)[param], { differenceChecker: JSON.stringify });
```

## Impact Analysis: File-by-File Changes

### Files to Create (3)

| File | Purpose |
|------|---------|
| `contexts/utils/persistedState.svelte.ts` | `$state` + `$effect` storage persistence, exports `Writable<T>` |
| `contexts/utils/StackedState.svelte.ts` | `$state`-based stack class, implements `Readable<T>` |
| `contexts/utils/memoizedDerived.ts` | Thin bridge for 5 `differenceChecker` call sites |

### Files to Delete (3)

| File | Reason |
|------|--------|
| `contexts/utils/parsimoniusDerived.ts` | Replaced by native `derived()` + `memoizedDerived()` |
| `contexts/utils/storageStore.ts` | Replaced by `persistedState.svelte.ts` |
| `contexts/utils/stackedStore.ts` | Replaced by `StackedState.svelte.ts` |

### Files to Modify (16)

**Import change only (parsimoniusDerived -> derived):**

| File | Call Sites | Has differenceChecker |
|------|-----------|----------------------|
| `utils/questionStore.ts` | 1 | No |
| `utils/questionCategoryStore.ts` | 3 | No |
| `utils/questionBlockStore.ts` | 1 | No |
| `utils/dataCollectionStore.ts` | 1 | No |
| `voter/matchStore.ts` | 1 | No |
| `voter/voterContext.ts` | 11 | No |
| `voter/nominationAndQuestionStore.ts` | 1 | No |
| `voter/filters/filterStore.ts` | 1 | No |
| `admin/jobStores.ts` | 3 | No |

**Import change (parsimoniusDerived -> memoizedDerived):**

| File | Call Sites | differenceChecker |
|------|-----------|-------------------|
| `utils/paramStore.ts` | 1 | `JSON.stringify` |
| `utils/pageDatumStore.ts` | 1 | `JSON.stringify` |
| `candidate/candidateContext.ts` | 3 | `hashIds` |

**Import change (storageStore -> persistedState):**

| File | Functions Used |
|------|--------------|
| `voter/answerStore.ts` | `localStorageWritable` |
| `voter/voterContext.ts` | `sessionStorageWritable` |
| `app/appContext.ts` | `localStorageWritable` |
| `candidate/candidateUserDataStore.ts` | `localStorageWritable` |
| `candidate/candidateContext.ts` | `localStorageWritable`, `sessionStorageWritable` |
| `app/tracking/trackingService.ts` | `sessionStorageWritable` |

**Import change (stackedStore -> StackedState):**

| File | Change |
|------|--------|
| `layout/layoutContext.ts` | `stackedStore()` calls -> `new StackedState()` |
| `layout/layoutContext.type.ts` | `StackedStore<T>` type -> `StackedState<T>` |

**Comment-only changes:**

| File | Change |
|------|--------|
| `utils/hashIds.ts` | Update JSDoc reference from `parsimoniusDerived` to `memoizedDerived` |

### Total Modified Files: 16 context files + 1 utility (hashIds comment)

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `apps/frontend/vitest.config.ts` |
| Quick run command | `yarn workspace @openvaa/frontend test:unit` |
| Full suite command | `yarn test:unit` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R1.1 | parsimoniusDerived removed, consumers use derived/memoizedDerived | build + grep | `yarn build && ! grep -r "parsimoniusDerived" apps/frontend/src/` | N/A (build check) |
| R1.2 | persistedState round-trips data correctly (localStorage versioning, sessionStorage) | unit | `yarn workspace @openvaa/frontend vitest run src/lib/contexts/utils/persistedState.svelte.test.ts` | Wave 0 |
| R1.3 | StackedState push/pop/revert semantics preserved | unit | `yarn workspace @openvaa/frontend vitest run src/lib/contexts/utils/StackedState.svelte.test.ts` | Wave 0 |
| R1.4 | No imports of old utility files remain | grep | `! grep -rE "from.*/(parsimoniusDerived|storageStore|stackedStore)" apps/frontend/src/` | N/A (grep check) |

### Sampling Rate

- **Per task commit:** `yarn workspace @openvaa/frontend test:unit`
- **Per wave merge:** `yarn test:unit && yarn build`
- **Phase gate:** Full unit suite green + build succeeds + grep verification of no old imports

### Wave 0 Gaps

- [ ] `apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts` -- covers R1.2: localStorage versioning, sessionStorage, SSR safety (browser=false)
- [ ] `apps/frontend/src/lib/contexts/utils/StackedState.svelte.test.ts` -- covers R1.3: push, revert, getLength, subscribe, edge cases
- [ ] Vitest mock for `$app/environment` -- already exists at `src/lib/i18n/tests/__mocks__/app-environment.ts`
- [ ] Vitest may need `.svelte.ts` handling confirmation -- `@sveltejs/vite-plugin-svelte` 6.2.1 should handle this

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `writable()` / `derived()` stores | `$state` / `$derived` runes | Svelte 5.0 (Oct 2024) | All state management moves to runes |
| Custom equality checking (`parsimoniusDerived`) | `$derived` with referential equality (built-in) | Svelte 5.0 | Push-pull reactivity handles equality natively |
| Store subscriptions (`$store`) | Direct property access | Svelte 5.0 | No subscription overhead; fine-grained tracking |
| `svelte/store` only | `toStore()` / `fromStore()` bridge | Svelte 5.0 | Official migration path for incremental adoption |

## Open Questions

1. **toStore() in class getter -- lazy creation on every subscribe call?**
   - What we know: `toStore(() => this.current).subscribe` creates a new store each time `subscribe` is accessed. This might cause issues if the store is accessed multiple times.
   - What's unclear: Whether the returned store correctly bridges reactivity when created in a getter.
   - Recommendation: Cache the `toStore()` result in the constructor or a lazy-initialized field. Test thoroughly. Alternative: implement `subscribe` manually with a simple `Set<subscriber>` pattern.

2. **$effect timing vs store.subscribe timing for storage persistence**
   - What we know: `$effect` runs after DOM update (microtask). Current `storageStore` writes to storage synchronously on every `.set()`.
   - What's unclear: Whether the async timing causes any observable behavior difference.
   - Recommendation: Accept the minor timing difference. If issues arise, `$effect.pre` runs before DOM update and may be closer to the original timing. Validate with unit tests.

3. **Vitest handling of .svelte.ts files**
   - What we know: `@sveltejs/vite-plugin-svelte` 6.2.1 should process `.svelte.ts` files. The vitest config uses this plugin.
   - What's unclear: Whether runes (`$state`, `$derived`, `$effect`) work correctly in vitest's jsdom environment.
   - Recommendation: Create a minimal `.svelte.ts` test file early to validate the test setup before writing full test suites.

## Sources

### Primary (HIGH confidence)

- Svelte 5.53.12 source code (node_modules/svelte) -- `toStore()` implementation verified
- [Svelte $state docs](https://svelte.dev/docs/svelte/$state) -- Export rules for .svelte.ts modules
- [Svelte $derived docs](https://svelte.dev/docs/svelte/$derived) -- Referential equality checking, push-pull reactivity
- [Svelte $effect docs](https://svelte.dev/docs/svelte/$effect) -- Lifecycle requirements, $effect.root
- [Svelte stores docs](https://svelte.dev/docs/svelte/stores) -- toStore/fromStore bridge APIs
- [Svelte 5 migration guide](https://svelte.dev/docs/svelte/v5-migration-guide) -- .svelte.ts file handling

### Secondary (MEDIUM confidence)

- [Mainmatter: Runes and Global State](https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/) -- SSR safety, module-level state pitfalls
- [Joy of Code: Sharing State in Svelte 5](https://joyofcode.xyz/how-to-share-state-in-svelte-5) -- Patterns for .svelte.ts state modules

### Codebase Analysis (HIGH confidence)

- `parsimoniusDerived.ts` -- 56 lines, 28 call sites across 12 files, 5 using differenceChecker
- `storageStore.ts` -- 118 lines, 8 call sites across 6 files
- `stackedStore.ts` -- 79 lines, 3 instances in layoutContext, 22+ template reads
- `layoutContext.ts` -- Full StackedStore usage pattern with push/revert/getLength
- `answerStore.ts`, `candidateUserDataStore.ts` -- Full storageStore usage patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Svelte 5.53.12 verified installed, all APIs confirmed available in source
- Architecture: HIGH -- All consumer files analyzed, backward compatibility constraints understood
- Pitfalls: HIGH -- Based on official docs + codebase analysis of 28+ call sites
- Validation: MEDIUM -- .svelte.ts testing in vitest not yet validated (open question #3)

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable -- Svelte 5 rune APIs are finalized)
