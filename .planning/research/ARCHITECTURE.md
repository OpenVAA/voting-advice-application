# Architecture: Svelte 5 Context System Rewrite

**Domain:** Svelte 5 context migration in existing SvelteKit 2 app
**Researched:** 2026-03-27
**Confidence:** HIGH (all findings based on codebase analysis + official Svelte 5 docs)

## Current Architecture

### Context Hierarchy

The application uses a layered context inheritance pattern where each context level extends its parent by spreading its properties. Contexts are initialized in layout files using `setContext()` with Symbol keys.

```
Root +layout.svelte
  initI18nContext()        -> I18nContext (locale, locales, t, translate)
  initComponentContext()   -> ComponentContext = I18nContext + { darkMode }
  initDataContext()        -> DataContext { dataRoot: Readable<DataRoot> }
  initAppContext()         -> AppContext = ComponentContext + DataContext + TrackingService + { appSettings, popupQueue, ... }
  initLayoutContext()      -> LayoutContext { pageStyles, topBarSettings, progress, navigation, ... }
  initAuthContext()        -> AuthContext { isAuthenticated, logout, resetPassword, ... }

  (voters)/+layout.svelte
    initVoterContext()     -> VoterContext = AppContext + { answers, matches, filters, ... }

  candidate/+layout.svelte
    initCandidateContext() -> CandidateContext = AppContext + AuthContext + { userData, ... }

  admin/+layout.svelte
    initAdminContext()     -> AdminContext = AppContext + AuthContext + { jobs, ... }
```

### Store Infrastructure (40 files, 51 `svelte/store` imports)

The context system is built on Svelte 4 stores throughout:

| Store Type | Count | Files Using It |
|------------|-------|----------------|
| `writable()` | ~25 | appContext, layoutContext, trackingService, candidateContext, adminContext, storageStore, popupStore, stackedStore |
| `derived()` | ~15 | authContext, candidateContext, candidateUserDataStore, getRoute, survey, popupStore, darkMode |
| `parsimoniusDerived()` | ~20 | voterContext, candidateContext, paramStore, pageDatumStore, questionCategoryStore, questionStore, questionBlockStore, matchStore, filterStore, nominationAndQuestionStore, dataCollectionStore |
| `localStorageWritable()` | 4 | appContext (userPreferences), voterContext (answers), candidateUserDataStore (editedAnswers), candidateContext (isPreregistered) |
| `sessionStorageWritable()` | 3 | voterContext (selectedQuestionCategoryIds, firstQuestionId), candidateContext (preregistrationElectionIds, preregistrationConstituencyIds) |

### Dependencies on `$app/stores`

Five context files import `page` from `$app/stores`:

1. **`authContext.ts`** -- `derived(page, ...)` for `isAuthenticated`
2. **`candidateContext.ts`** -- `derived(page, ...)` for `idTokenClaims`
3. **`pageDatumStore.ts`** -- `parsimoniusDerived(page, ...)` for page data subscriptions
4. **`paramStore.ts`** -- `parsimoniusDerived(page, ...)` for route parameters
5. **`getRoute.ts`** -- `derived(page, ...)` for route building

### Custom Store Abstractions

Three custom store utilities form the backbone of the reactivity system:

1. **`parsimoniusDerived`** -- Wraps Svelte's `derived` with equality-checking and SSR-safe eager subscription. Avoids re-running derivation on every re-subscribe. Used in ~20 places.

2. **`storageStore`** (localStorage/sessionStorage) -- Creates `writable()` stores that auto-persist to browser storage. Used for voter answers, user preferences, candidate edited answers.

3. **`stackedStore`** -- Push/pop pattern for layout settings. Components push overrides on mount, pop on destroy. Used for `topBarSettings`, `pageStyles`, `navigationSettings`.

### Consumer Pattern (141 component files)

Components retrieve context via `getVoterContext()` / `getAppContext()` / etc, destructure the properties they need, and subscribe using Svelte's `$store` syntax:

```svelte
const { answers, appSettings, t } = getVoterContext();
// In template: $answers, $appSettings, t(key)
```

All 141 consumer files will be affected when store types change to rune-based state, because `$store` syntax becomes direct property access (no `$` prefix).

### Legacy Mode Files (16 remaining)

These files lack `<svelte:options runes />` and use `$:` reactive declarations:

- **Root layout** (`+layout.svelte`) -- Initializes all global contexts, uses `$: {}` for data loading
- **Header.svelte, Banner.svelte, MaintenancePage.svelte** -- Shared layout components
- **+error.svelte** -- Error page
- **Admin app** (10 files) -- Entire admin subtree (`admin/+layout.svelte`, all pages)
- **PreviewColorContrast.svelte** -- Utility component

## Recommended Architecture

### Approach: Reactive Object Contexts with `$state`

Replace store-based contexts with plain JavaScript objects containing `$state` and `$derived` properties passed through `setContext/getContext`. Use Svelte 5.40+ `createContext()` for type-safe get/set pairs.

**Why this approach:**
- Svelte 5 officially recommends `$state` objects over stores for shared state
- Objects passed via context are reactive when they contain `$state`/`$derived` fields
- Eliminates all `$store` subscription boilerplate
- Fine-grained reactivity: changing one property does not invalidate unrelated consumers
- The existing `setContext/getContext` pattern maps directly (change internal implementation, not external API shape)

### Migration from `$app/stores` to `$app/state`

Replace all 5 files that import `page` from `$app/stores`:

| File | Current | Replacement |
|------|---------|-------------|
| `authContext.ts` | `derived(page, (p) => !!p.data.session)` | Direct `$derived(() => !!page.data.session)` using `page` from `$app/state` |
| `candidateContext.ts` | `derived(page, (page) => page.data.claims)` | Direct `$derived(() => page.data.claims)` |
| `pageDatumStore.ts` | `parsimoniusDerived(page, ...)` | Replaced by direct `$derived` reading `page.data[key]` |
| `paramStore.ts` | `parsimoniusDerived(page, ...)` | Direct `$derived` using `page` from `$app/state` |
| `getRoute.ts` | `derived(page, ...)` | Direct `$derived` or computed function |

**Critical benefit:** `$app/state`'s `page` object provides fine-grained reactivity. Updates to `page.state` will not invalidate `page.data` and vice versa. This directly addresses the pushState reactivity bug that causes 3+ skipped E2E tests.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Context modules** (`contexts/*`) | Reactive state management, data derivation | API adapters (read), layout system, components (expose state) |
| **Layout files** (`routes/+layout.svelte`, etc.) | Context initialization, data loading | Context modules (init), SvelteKit load functions (data) |
| **Route pages** | UI rendering, user interaction | Context modules (read/write state) |
| **API adapters** (`api/adapters/`) | Data fetching, mutation | Supabase backend. No changes needed -- adapter interface is stable |
| **Utility stores** (`contexts/utils/`) | Derived computations, persistence | Context modules (compose reactive values) |

### New Context Type Pattern

```typescript
// Before (store-based)
export type AppContext = {
  appSettings: Writable<AppSettings>;
  userPreferences: Writable<UserPreferences>;
  surveyLink: Readable<string | undefined>;
};

// After (rune-based)
export type AppContext = {
  readonly appSettings: AppSettings;          // $state, read by consumers
  readonly userPreferences: UserPreferences;  // $state, read by consumers
  readonly surveyLink: string | undefined;    // $derived
  setAppSettings(v: AppSettings): void;       // explicit setter if needed
};
```

### Data Flow Changes

**Before (store subscriptions):**
```
+layout.ts load() -> page.data -> pageDatumStore -> derived store -> appSettings store
                                                                   -> subscribers ($appSettings)
```

**After (direct reactive state):**
```
+layout.ts load() -> page.data (via $app/state) -> $derived in context -> context.appSettings
                                                                        -> direct reads (context.appSettings)
```

The key change: no intermediate `Readable`/`Writable` wrappers. Context properties are read directly as reactive values. Components access them without the `$` prefix.

### DataRoot Special Case

`DataRoot` is a mutable object that signals changes via an imperative `subscribe()` callback. The current `alwaysNotifyStore` workaround bypasses Svelte's equality checking. The Svelte 5 replacement:

```typescript
// Wrap DataRoot mutations in a version counter
let dataRootVersion = $state(0);
const dataRoot = new DataRoot({ locale: getLocale() });
dataRoot.subscribe(() => dataRootVersion++);

// Consumers use $derived that depends on version
const elections = $derived.by(() => {
  dataRootVersion; // track dependency
  return dataRoot.elections;
});
```

This replaces the `alwaysNotifyStore` hack with explicit change tracking.

### Storage Persistence Pattern

Replace `localStorageWritable` / `sessionStorageWritable` with `$state` + `$effect` for persistence:

```typescript
function createPersistedState<T>(key: string, defaultValue: T, storage: 'local' | 'session'): { value: T } {
  const stored = browser ? loadFromStorage(key, storage) : null;
  let value = $state(stored ?? defaultValue);

  $effect(() => {
    saveToStorage(key, value, storage);
  });

  return {
    get value() { return value; },
    set value(v) { value = v; }
  };
}
```

### Stacked Store Pattern

The `stackedStore` for layout settings (push on mount, pop on destroy) can become a class:

```typescript
class StackedState<T, TAddition = T> {
  #stack = $state<T[]>([]);
  readonly current = $derived(this.#stack[this.#stack.length - 1]);

  constructor(initial: T, private updater: (stack: T[], value: TAddition) => T[]) {
    this.#stack = [initial];
  }

  push(value: TAddition) { this.#stack = this.updater(this.#stack, value); }
  revert(index: number) { this.#stack = this.#stack.slice(0, index + 1); }
  getLength() { return this.#stack.length; }
}
```

### parsimoniusDerived Replacement

The 20 uses of `parsimoniusDerived` all become direct `$derived` or `$derived.by()`. The equality-checking and SSR-safe eager subscription behavior that `parsimoniusDerived` provides is built into Svelte 5's `$derived` rune natively. No custom utility needed.

**However:** Some uses have a custom `differenceChecker` (e.g., `JSON.stringify` for deep equality on `paramStore` and `pageDatumStore`). For these, use `$derived.by()` with manual comparison if needed, though in practice most can become plain `$derived` because `$derived` only re-evaluates when its dependencies change (unlike stores which re-fire on every subscription).

## Patterns to Follow

### Pattern 1: Context Class with Runes

**What:** Encapsulate context state and methods in a class using `$state` and `$derived`.
**When:** For contexts with both state and methods (AppContext, VoterContext, CandidateContext).
**Example:**
```typescript
import { createContext } from 'svelte';

const [getAppContext, setAppContext] = createContext<AppContext>('app');

class AppContextImpl {
  appSettings = $state<AppSettings>(mergeAppSettings(staticSettings, dynamicSettings));
  userPreferences = $state<UserPreferences>({} as UserPreferences);
  readonly surveyLink = $derived.by(() => /* ... */);

  setDataConsent(consent: UserDataCollectionConsent) {
    this.userPreferences = {
      ...this.userPreferences,
      dataCollection: { consent, date: new Date().toISOString() }
    };
  }
}

// In layout:
export function initAppContext() {
  const ctx = new AppContextImpl();
  setAppContext(ctx);
  return ctx;
}
```

### Pattern 2: Preserve Get/Init API

**What:** Keep the `getXxxContext()` / `initXxxContext()` function pair pattern.
**When:** Always. This is the established API consumed by 141 files.
**Why:** Minimizes consumer-side changes. Components call the same function, just stop using `$` prefix.

### Pattern 3: Opt-In to Runes Per-File During Transition

**What:** Add `<svelte:options runes />` to each file as it is migrated, before enabling global runes.
**When:** During the migration of the 16 legacy-mode files.
**Why:** Allows incremental migration. Global runes enablement is the final step.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Reassigning Context Object References

**What:** Replacing the entire context object rather than mutating its `$state` properties.
**Why bad:** Breaks the reactive connection. Child components holding a reference to the old object will not see updates.
**Instead:** Always mutate properties on the existing object. Use class instances where the reference is stable.

### Anti-Pattern 2: Wrapping `$state` in Stores for Backward Compatibility

**What:** Creating `writable()` wrappers around `$state` to maintain the old `Readable/Writable` types.
**Why bad:** Adds unnecessary indirection. Two reactivity systems fighting each other.
**Instead:** Clean break from store types. Update consumer types in the same phase as context rewrite.

### Anti-Pattern 3: Using `$effect` Where `$derived` Suffices

**What:** Using `$effect(() => { someState = computeValue() })` instead of `$derived`.
**Why bad:** Effects run asynchronously (after DOM update), causing flash of stale content. `$derived` is synchronous.
**Instead:** Use `$derived` for all computed values. Reserve `$effect` for side effects (storage persistence, DOM manipulation, timers).

### Anti-Pattern 4: Global Module-Level `$state` for Server-Shared State

**What:** Declaring `$state` at module scope (outside components/context initialization).
**Why bad:** Module-level state is shared across all server-side requests, causing data leakage between users.
**Instead:** Always use `setContext/getContext` which scopes state to the component tree.

## Integration Points

### Contexts <-> API Adapters

**No changes required.** The `DataProvider`, `DataWriter`, `AdminWriter`, and `FeedbackWriter` interfaces return plain data (`Promise<T>`). Contexts currently call these via async functions and `set()` the resulting data into stores. After migration, contexts will assign results to `$state` properties instead. The adapter interface is unaffected.

### Contexts <-> Routes (Load Functions)

**Moderate changes.** The root `+layout.ts` load function returns data via `page.data`. Currently, `pageDatumStore` subscribes to `page` from `$app/stores` and republishes data. After migration:
- Root `+layout.svelte` reads `page.data` directly from `$app/state`
- No intermediate `pageDatumStore` needed
- `appSettings` and `appCustomization` are set directly on the context object

### Contexts <-> Components (141 files)

**Bulk mechanical changes.** Every component that destructures stores from a context and uses `$store` will change:
```svelte
// Before
const { appSettings, t } = getAppContext();
// Template: {$appSettings.header.showHelp}

// After
const { appSettings, t } = getAppContext();
// Template: {appSettings.header.showHelp}
```
The change is removing `$` prefix from template and script references. For `Writable` stores that components `.set()` or `.update()`, the pattern changes to direct assignment or calling a setter method.

### Contexts <-> Layout System

**StackedStore replacement.** The `LayoutContext` uses `stackedStore` for `topBarSettings`, `pageStyles`, and `navigationSettings`. After migration, these become `StackedState` class instances. The `getLayoutContext(onDestroy)` pattern with automatic revert-on-destroy remains but uses the class methods instead of store methods.

### Context Initialization Chain (Dependency Order)

The contexts have a strict initialization order that must be preserved:

```
1. I18nContext           (standalone - no dependencies)
2. ComponentContext      (depends on: I18nContext)
3. DataContext           (depends on: I18nContext)
4. AppContext            (depends on: ComponentContext, DataContext)
5. LayoutContext         (standalone at init, uses navigation hooks)
6. AuthContext           (depends on: page data)
7. VoterContext          (depends on: AppContext)
8. CandidateContext      (depends on: AppContext, AuthContext)
9. AdminContext          (depends on: AppContext, AuthContext)
```

## Build Order (Suggested Phase Structure)

### Phase 1: Core Infrastructure

Rewrite the utility layer that everything depends on:
1. `parsimoniusDerived` -> direct `$derived` (document replacement patterns)
2. `storageStore` -> persisted `$state` utility
3. `stackedStore` -> `StackedState` class
4. `pageDatumStore` -> removed (replaced by direct `$app/state` page access)
5. `paramStore` -> direct `$derived` using `$app/state` page

**Why first:** Every context depends on these utilities. Changing them forces changes in all consumers.

### Phase 2: Leaf Contexts (No Dependents)

Rewrite contexts that no other context depends on:
1. `I18nContext` -- Simple; wraps Paraglide values. Stores become plain values or `$state`.
2. `LayoutContext` -- Self-contained. `stackedStore` -> `StackedState`. Tweened store for progress may stay as-is (motion stores are still valid in Svelte 5).
3. `AuthContext` -- Depends on `page` from `$app/stores` -> `$app/state`.

**Why second:** These can be migrated independently without cascading changes.

### Phase 3: Mid-Level Contexts

1. `ComponentContext` -- Trivial; spreads `I18nContext` + `darkMode`.
2. `DataContext` -- Address the `alwaysNotifyStore` / `DataRoot` problem with version counter pattern.
3. `AppContext` -- Largest context. Depends on Component + Data contexts. Migrate stores, tracking, popups, survey.

**Why third:** AppContext is the most complex single context and serves as the base for all app-specific contexts.

### Phase 4: App-Specific Contexts

1. `VoterContext` -- ~20 derived stores (matching, filtering, question blocks). All `parsimoniusDerived` become `$derived`.
2. `CandidateContext` -- Similar structure to Voter + DataWriter integration + candidateUserDataStore.
3. `AdminContext` -- Simplest of the three; wraps DataWriter methods + jobStores.

**Why fourth:** These are the most complex contexts but all their dependencies are already migrated.

### Phase 5: Consumer Component Updates + Legacy File Migration

Update all 141 consumer components to use new context types (remove `$` prefix, use setters instead of `.set()`), and migrate the 16 legacy-mode files:
1. Root `+layout.svelte` -- The most critical file. Remove `$:` blocks, use `$effect` for data loading.
2. `Header.svelte`, `Banner.svelte`, `MaintenancePage.svelte` -- Shared layout.
3. `+error.svelte` -- Simple.
4. Admin app (10 files) -- Standalone subtree.
5. `PreviewColorContrast.svelte` -- Utility.

### Phase 6: Global Runes Enablement

1. Remove all `<svelte:options runes />` from 151 files (no longer needed).
2. Add `compilerOptions: { runes: true }` to `svelte.config.js`.
3. Verify no legacy patterns remain.
4. Run full E2E suite.

### Phase 7: E2E Test Fixes

Fix the 3 skipped E2E tests (results-sections variant tests: fixme'd due to reactivity issues with settings changes). The `$app/state` fine-grained reactivity should resolve the underlying pushState/settings reactivity bugs.

## Files Changed vs New Files

### New Files

| File | Purpose |
|------|---------|
| `contexts/utils/persistedState.ts` | Replacement for `storageStore.ts` using `$state` + `$effect` |
| `contexts/utils/StackedState.svelte.ts` | Class-based replacement for `stackedStore.ts` using `$state` |

### Modified Files (Context Core -- 40 files)

All 40 files in `contexts/` that import from `svelte/store` will be modified to remove store imports and use runes.

### Modified Files (Consumers -- 141 .svelte files)

All 141 `.svelte` files that call `getXxxContext()` will need `$store` -> direct access changes. This is a mechanical, searchable transformation.

### Deleted Files

| File | Reason |
|------|--------|
| `contexts/utils/parsimoniusDerived.ts` | Replaced by native `$derived` |
| `contexts/utils/pageDatumStore.ts` | Replaced by direct `$app/state` page access |
| `contexts/utils/paramStore.ts` | Inlined as `$derived` in consuming context |

### Unchanged Files

- All API adapter files (`api/adapters/`, `api/base/`, `api/utils/`)
- All packages (`@openvaa/core`, `@openvaa/data`, `@openvaa/matching`, `@openvaa/filters`)
- All Supabase files (`apps/supabase/`)
- E2E test files (tests themselves do not change; only the app behavior they verify)

## Scalability Considerations

| Concern | Current (Stores) | After ($state) |
|---------|-------------------|----------------|
| Reactivity granularity | Store-level (entire object) | Property-level (fine-grained) |
| Memory overhead | One subscription per store per consumer | Tracked at signal level, lighter |
| SSR safety | `parsimoniusDerived` skips SSR subscription | `$derived` handles SSR natively |
| DevTools debugging | Svelte 4 store inspector | Svelte 5 state inspector (better) |
| New developer onboarding | Must understand stores + `$:` | Standard `$state`/`$derived` |

## Sources

- [Svelte 5 Context documentation](https://svelte.dev/docs/svelte/context) -- `createContext()` API (v5.40+)
- [$app/state SvelteKit docs](https://svelte.dev/docs/kit/$app-state) -- Fine-grained page state
- [$app/stores deprecation](https://svelte.dev/docs/kit/$app-stores) -- Deprecated, use $app/state
- [Svelte 5 State Management guide](https://svelte.dev/docs/kit/state-management) -- Context + $state patterns
- [Runes and Global State best practices (Mainmatter)](https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/) -- SSR safety, module-level state pitfalls
- Codebase analysis: 40 context files, 141 consumer components, 16 legacy-mode files
- Svelte 5.53.12 and SvelteKit 2.55.0 (verified from yarn.lock)
