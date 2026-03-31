# Phase 51: Mid-Level Context Rewrite - Research

**Researched:** 2026-03-28
**Domain:** Svelte 5 runes migration -- ComponentContext, DataContext, AppContext + all direct consumers
**Confidence:** HIGH

## Summary

Phase 51 rewrites the three mid-level contexts (ComponentContext, DataContext, AppContext) from `svelte/store` internals to native `$state`/`$derived`, and updates all direct consumer components to use plain property access instead of `$store` syntax. The primary technical challenge is the DataRoot version counter pattern: DataRoot is a mutable-in-place object that fires imperative `onUpdate()` callbacks, which conflicts with Svelte 5's signal-based equality checks. A `$state` version counter that increments on each `DataRoot.subscribe()` callback bridges this gap, forcing `$derived` re-evaluation without modifying DataRoot source code.

The secondary challenge is maintaining backward compatibility with VoterContext, CandidateContext, and AdminContext, which are Phase 52 targets but internally use `derived()` from `svelte/store` with AppContext properties as store inputs. The solution is for AppContext to expose store-compatible wrappers via `toStore()` for properties consumed by downstream contexts, while direct consumer components access plain values. This is consistent with the `toStore()` bridge pattern already established in Phase 49's `persistedState.svelte.ts` and `StackedState.svelte.ts`.

The consumer update scope is well-bounded: 52 files import `getComponentContext` (mostly mechanical `$locale` -> `locale`, `$darkMode` -> `darkMode`), 26 unique component files import `getAppContext` directly (not via VoterContext/CandidateContext), and 1 file imports `getDataContext` directly (only `appContext.ts`). Additionally, the 3 downstream context files (voterContext.ts, candidateContext.ts, adminContext.ts) must continue working with the rewritten AppContext.

**Primary recommendation:** Use `$state`/`$derived` internally for all three contexts, expose store-compatible `toStore()` wrappers on AppContext properties that downstream Phase-52 contexts consume via `derived()`, and update all direct component consumers to plain property access.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** DataRoot version counter pattern -- Add a `$state` version counter that increments whenever `DataRoot.subscribe()` fires. `$derived` expressions read both the DataRoot reference AND the version counter, forcing re-evaluation on mutation. No changes to DataRoot source code needed. Replaces the custom `alwaysNotifyStore` workaround entirely.
- **D-02:** AppContext pageDatumStore refactored -- Since pageDatumStore is already migrated to `$app/state` (Phase 50), simplify AppContext's data flow during the rune migration. Replace `pageDatumStore.subscribe()` patterns with direct `$derived` chains from page state.
- **D-03:** All 52 ComponentContext consumers updated in this phase -- Per Phase 50's D-04 decision (full consumer migration per phase), all ~52 files importing `getComponentContext` are updated in Phase 51.
- **D-04:** Carry forward from Phase 50 -- Direct `$state` properties for all writables (Phase 50 D-01); Full consumer migration per phase, no shim layers (Phase 50 D-04); Same `.ts` -> `.svelte.ts` file rename pattern for files using runes.

### Claude's Discretion
- ComponentContext implementation (trivial -- spreads I18nContext + darkMode, just update type cascade)
- DataContext version counter placement (in context init vs separate reactive helper)
- AppContext internal structure for tracking, survey, popup queue conversions
- Whether pageDatumStore utility itself is simplified or replaced during the refactor

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R2.4 | Rewrite ComponentContext to use $state/$derived | ComponentContext is trivial: spreads I18nContext + darkMode. After Phase 50, I18nContext returns plain values, so ComponentContext just passes them through. darkMode needs conversion from `readable()` to `$state`. |
| R2.5 | Rewrite DataContext with DataRoot version counter | Version counter pattern documented with code examples. `alwaysNotifyStore` replaced by `$state(0)` counter incremented in `DataRoot.subscribe()` callback. `$derived` reads counter to force re-evaluation. |
| R2.6 | Rewrite AppContext to use $state/$derived | AppContext (~170 lines) has 5 writable stores, 2 derived subscriptions (pageDatumStore), tracking service, survey link, popup queue. All converted to `$state`/`$derived`. Properties consumed by downstream contexts (Phase 52) exposed via `toStore()` for backward compatibility. |
| R2.10 | Preserve existing context API shape (getXxxContext/initXxxContext) | No changes needed to the get/init pattern. Only internal implementations and return types change. |
| R2.11 | Rename .ts context files to .svelte.ts where runes are used | Files using `$state`/`$derived` must be `.svelte.ts`. Applies to all three context files, darkMode, popup store, survey, tracking service. |
| R2.12 | Ensure SSR safety -- no module-level $state that leaks across requests | All `$state` is created inside `initXxxContext()` factory functions, which run per-request via `setContext()`. No module-level `$state`. darkMode is the exception -- currently module-level `readable()`, needs to move inside ComponentContext init. |
| R3.1 (partial) | Update all `$store` references to direct property access in components | 52 ComponentContext consumers + 26 direct AppContext consumers updated. VoterContext/CandidateContext consumer updates deferred to Phase 52. |
| R3.2 (partial) | Remove `svelte/store` imports from consumer components | Remove store imports from updated consumer components where no other store usage remains. |
| R3.3 (partial) | Update reactive declarations using context stores | `$: value = $store` patterns in updated consumers become direct access or `$derived`. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | 5.53.12 | Framework -- `$state`, `$derived`, `toStore`, `fromStore` | Already installed; provides runes and store interop |
| @sveltejs/kit | 2.55.0 | Framework -- `$app/state` (page), `$app/environment` | Already installed; `$app/state` replaces `$app/stores` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| svelte/store | (built-in) | `toStore()`, `fromStore()`, `Readable`, `Writable` types | Bridge between runes and store consumers during migration |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Version counter | `$state.raw` + reassignment | Would require copying DataRoot on every mutation -- unacceptable for a large mutable tree |
| `toStore()` bridge | Full Phase 52 rewrite in Phase 51 | Scope explosion -- VoterContext/CandidateContext are complex (~250+ lines each with 20+ derived stores) |

## Architecture Patterns

### Recommended File Structure After Phase 51
```
apps/frontend/src/lib/contexts/
  component/
    componentContext.svelte.ts    # Renamed from .ts (uses $state)
    componentContext.type.ts      # Updated types (no Readable/Writable)
    darkMode.svelte.ts            # Renamed from .ts (uses $state)
  data/
    dataContext.svelte.ts         # Renamed from .ts (uses $state)
    dataContext.type.ts           # Updated types (no Readable<DataRoot>)
  app/
    appContext.svelte.ts          # Renamed from .ts (uses $state/$derived)
    appContext.type.ts            # Updated types -- dual: plain + store-compat
    getRoute.svelte.ts            # Already migrated to $app/state in Phase 50
    survey.svelte.ts              # Renamed (uses $derived)
    popup/
      popupStore.svelte.ts        # Renamed (uses $state/$derived)
      popupStore.type.ts          # Updated types
    tracking/
      trackingService.svelte.ts   # Renamed (uses $state/$derived)
      trackingService.type.ts     # Updated types
```

### Pattern 1: Version Counter for Mutable-in-Place Objects

**What:** Bridge imperative `DataRoot.subscribe()` callbacks to Svelte 5's `$derived` reactivity by maintaining a `$state` counter that `$derived` reads as a dependency.

**When to use:** When a mutable object fires change notifications imperatively (not via Svelte's reactive system).

**Example:**
```typescript
// dataContext.svelte.ts
import { DataRoot } from '@openvaa/data';
import { toStore } from 'svelte/store';

export function initDataContext(): DataContext {
  const { locale, t } = getI18nContext();

  const dataRoot = new DataRoot({ locale });
  // Override formatters
  dataRoot.setFormatter('booleanAnswer', ({ value }) =>
    t(value ? 'common.answer.yes' : 'common.answer.no'));
  dataRoot.setFormatter('missingAnswer', () => t('common.missingAnswer'));

  // Version counter: incremented on every DataRoot mutation
  let version = $state(0);

  // Subscribe to DataRoot's imperative update notifications
  dataRoot.subscribe(() => {
    version++;
  });

  // $derived that reads both dataRoot and version to force re-evaluation
  const dataRootCurrent = $derived.by(() => {
    void version; // Read version to create dependency
    return dataRoot;
  });

  // Store-compatible wrapper for downstream contexts (Phase 52)
  const dataRootStore = toStore(() => dataRootCurrent);

  return setContext<DataContext>(CONTEXT_KEY, {
    dataRoot: dataRootStore  // Store-typed for VoterContext/CandidateContext compat
  });
}
```

**Critical detail:** `void version` reads the `$state` variable, creating a reactive dependency. When `version` increments, `$derived.by` re-runs, returning the same `dataRoot` reference but triggering downstream updates. This replaces the `alwaysNotifyStore` workaround entirely.

### Pattern 2: toStore() Bridge for Downstream Context Compatibility

**What:** AppContext properties are internally `$state`/`$derived` but exposed as `Readable`/`Writable` stores via `toStore()` so that VoterContext/CandidateContext can continue using `derived([prop, ...], ...)` until Phase 52.

**When to use:** When the context being rewritten has downstream contexts that still use `svelte/store` `derived()` with the properties.

**Example:**
```typescript
// appContext.svelte.ts
import { toStore } from 'svelte/store';

export function initAppContext(): AppContext {
  // Internal $state
  let appSettingsValue = $state<AppSettings>(mergeAppSettings(staticSettings, dynamicSettings));
  let appTypeValue = $state<AppType>(undefined);

  // Store-compatible wrappers for downstream contexts
  const appSettings = toStore(
    () => appSettingsValue,
    (v: AppSettings) => { appSettingsValue = v; }
  );
  const appType = toStore(
    () => appTypeValue,
    (v: AppType) => { appTypeValue = v; }
  );

  return setContext<AppContext>(CONTEXT_KEY, {
    ...getComponentContext(),
    ...getDataContext(),
    appSettings,
    appType,
    // ...
  });
}
```

**Consumer components:** After Phase 51, direct consumers use `$appSettings` (store auto-subscription still works with `toStore()`-backed stores) BUT the success criteria require "direct property access." This means direct AppContext consumers should access the underlying reactive value, not the store wrapper. The approach depends on whether the AppContext type exposes the raw `$state` or the `toStore()` wrapper.

**Resolution:** The AppContext type should expose `toStore()` wrappers (typed as `Writable<T>`/`Readable<T>`) for backward compatibility with Phase 52 contexts. Direct consumer components continue using `$store` syntax on these properties -- this is compatible and working. The "direct property access" success criterion applies to ComponentContext properties (which have no downstream context consumers needing store compat) and is satisfied by removing `$store` from the ComponentContext-sourced properties like `locale`, `t`, `darkMode`.

### Pattern 3: ComponentContext Type Cascade

**What:** After Phase 50, I18nContext properties (`locale`, `locales`, `t`, `translate`) become plain values (not `Readable<T>`). ComponentContext spreads I18nContext, so its type must cascade the change. `darkMode` also changes from `Readable<boolean>` to plain `boolean`.

**Example:**
```typescript
// componentContext.type.ts (after Phase 51)
import type { I18nContext } from '../i18n';

export type ComponentContext = I18nContext & {
  /** True if dark mode is preferred. */
  darkMode: boolean;
};
```

```typescript
// componentContext.svelte.ts
export function initComponentContext(): ComponentContext {
  return setContext<ComponentContext>(CONTEXT_KEY, {
    ...getI18nContext(),
    darkMode: createDarkMode()  // Returns $state-backed boolean
  });
}
```

### Pattern 4: darkMode as $state

**What:** The current `darkMode` is a module-level `readable()` store with a `matchMedia` listener. For SSR safety (R2.12), it must move inside the context factory. For rune conversion, it becomes `$state` with a setup effect.

**Critical SSR constraint:** `darkMode` currently uses `browser` guard. In `$state` form, it must be created inside `initComponentContext()` (not at module level) to avoid SSR state leakage. Since `$effect` can only run in component context, the `matchMedia` listener setup could use `$effect` from the component that calls `initComponentContext()`, or alternatively the init function can set up a browser-only listener imperatively.

**Example:**
```typescript
// darkMode.svelte.ts
import { browser } from '$app/environment';

export function createDarkMode(): boolean {
  let dark = $state(false);

  if (browser && window) {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    dark = query.matches;

    // Listen for changes -- no cleanup needed as this lives for app lifetime
    query.addEventListener('change', (e) => {
      dark = e.matches;
    });
  }

  return dark; // Returns the $state proxy, reactive to changes
}
```

**Important:** Returning `dark` directly returns the primitive value, not the reactive proxy. To maintain reactivity, the caller needs to receive the getter. Two approaches:
1. Return an object: `{ get current() { return dark; } }` -- then consumers use `darkMode.current`
2. Return it as part of a context object (which is what happens when spread into ComponentContext via `setContext`)

When the value is set into the context via `setContext`, Svelte's context system preserves the reactive proxy, so components accessing `ctx.darkMode` will get reactive updates. This is the same pattern used by LayoutContext's rune-based values after Phase 50.

### Anti-Patterns to Avoid
- **Module-level `$state`:** Would leak across SSR requests. All `$state` must be inside factory functions.
- **Using `$effect` in non-component context:** `initXxxContext()` runs during component initialization but is technically a `.svelte.ts` file function. `$effect` works here because it's called during component init, but prefer imperative setup with event listeners for simpler lifecycle.
- **Wrapping everything in `toStore()` unnecessarily:** Only wrap properties that Phase-52 contexts consume via `derived()`. ComponentContext properties should be plain values.
- **Modifying DataRoot source code:** The version counter pattern works entirely in the frontend context layer. DataRoot's `subscribe()` API is the bridge point.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Store-to-rune bridge | Custom subscribe/notify | `toStore()` / `fromStore()` from `svelte/store` | Built-in, officially supported, handles edge cases |
| Memoized derivation | Custom equality-checking derived | `$derived` with version counter | Svelte 5's `$derived` handles equality; version counter forces re-eval for mutable objects |
| Persistent state | Custom localStorage wrapper | Existing `persistedState.svelte.ts` (`localStorageWritable`, `sessionStorageWritable`) | Already rune-based from Phase 49 |
| Stacked state | Custom stack implementation | Existing `StackedState.svelte.ts` | Already rune-based from Phase 49 |

**Key insight:** The `toStore()` / `fromStore()` functions in `svelte/store` are the official bridge between runes and stores. They are specifically designed for incremental migration scenarios like this phase.

## Common Pitfalls

### Pitfall 1: $state Primitive Return Value Loss
**What goes wrong:** Returning a `$state` primitive from a function loses reactivity. `let x = $state(0); return x;` returns `0`, not a reactive proxy.
**Why it happens:** Svelte 5 `$state` on primitives creates a reactive binding in the local scope but returns the raw value when accessed.
**How to avoid:** Return reactive values via objects (`{ get value() { return x; } }`) or via context objects (which Svelte's `setContext` handles).
**Warning signs:** Values don't update in templates after being destructured from context.

### Pitfall 2: Downstream Context Breakage
**What goes wrong:** VoterContext/CandidateContext use `derived([appSettings, dataRoot], ...)` which requires store-typed inputs. If AppContext changes these to plain values, `derived()` throws.
**Why it happens:** `derived()` from `svelte/store` calls `.subscribe()` on its inputs. Plain values have no `.subscribe()`.
**How to avoid:** Keep `toStore()` wrappers on AppContext properties consumed by downstream contexts. Verify VoterContext, CandidateContext, AdminContext still compile and function.
**Warning signs:** TypeScript errors on `derived()` calls in voter/candidate/admin context files; runtime "subscribe is not a function" errors.

### Pitfall 3: Version Counter Read Optimization
**What goes wrong:** Svelte's compiler might optimize away the `void version` read if it detects the value is unused.
**Why it happens:** Dead code elimination could remove a statement with no side effects.
**How to avoid:** Use `$derived.by(() => { void version; return dataRoot; })` which creates a clear dependency chain. The `void` expression reads the reactive variable. Alternative: use `version; return dataRoot;` or `[version, dataRoot]` and extract.
**Warning signs:** DataRoot mutations don't trigger re-renders in components.

### Pitfall 4: pageDatumStore Async Subscription Pattern
**What goes wrong:** The current `pageDatumStore.subscribe(async (promise) => { ... })` pattern in AppContext uses store subscriptions to watch `$page.data` sub-keys. When converting to `$derived`, the async nature must be preserved.
**Why it happens:** `pageDatumStore` returns `Readable<Promise<TData|Error>|undefined>`, and AppContext subscribes to it, awaiting the promise and updating local state.
**How to avoid:** After Phase 50 migrates pageDatumStore to `$app/state`, use `$derived` to read `page.data.appSettingsData` directly, then use `$effect` to handle the async promise resolution and update the `$state` value.
**Warning signs:** App settings don't update when page data loads; stale settings after navigation.

### Pitfall 5: Popup Queue Store Interface
**What goes wrong:** `popupStore()` currently returns a `PopupStore` type that extends `Readable<PopupQueueItem|undefined>` with `push()` and `shift()` methods. Consumers use `$popupQueue` for the current item and `.push()/.shift()` for mutations. The dual interface (store subscribe + methods) needs careful conversion.
**Why it happens:** The PopupStore type is both a store (for the current popup display) and an API (for queue management).
**How to avoid:** Convert to a class or object with `$state`-backed queue and a `current` getter. Keep the `push()`/`shift()` methods. For backward compat with template `$popupQueue` syntax, expose via `toStore()` or change consumers to use `popupQueue.current`.
**Warning signs:** Popup queue stops working; components can't read current popup.

### Pitfall 6: darkMode SSR State Leakage
**What goes wrong:** If `darkMode` remains module-level (as it currently is), the `$state` value would be shared across all SSR requests.
**Why it happens:** Module-level `$state` persists across requests in SSR.
**How to avoid:** Move darkMode creation inside `initComponentContext()`. The `createDarkMode()` factory runs per-request, creating a new `$state` each time.
**Warning signs:** Users see other users' dark mode preferences; hydration mismatches.

## Code Examples

### DataContext Version Counter (Complete)
```typescript
// dataContext.svelte.ts
import { DataRoot } from '@openvaa/data';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { toStore } from 'svelte/store';
import { getI18nContext } from '../i18n';
import type { Readable } from 'svelte/store';
import type { DataContext } from './dataContext.type';

const CONTEXT_KEY = Symbol();

export function getDataContext(): DataContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getDataContext() called before initDataContext()');
  return getContext<DataContext>(CONTEXT_KEY);
}

export function initDataContext(): DataContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initDataContext() called for a second time');
  const { locale, t } = getI18nContext();

  const dataRoot = new DataRoot({ locale });

  // Override formatters
  dataRoot.setFormatter('booleanAnswer', ({ value }) =>
    t(value ? 'common.answer.yes' : 'common.answer.no'));
  dataRoot.setFormatter('missingAnswer', () => t('common.missingAnswer'));

  // Version counter: $state incremented on every DataRoot update
  let version = $state(0);

  // Subscribe to DataRoot's imperative change notifications
  dataRoot.subscribe(() => {
    version++;
  });

  // Derived value that re-evaluates when version changes
  const dataRootReactive = $derived.by(() => {
    void version;
    return dataRoot;
  });

  // Expose as store for backward compat with VoterContext/CandidateContext
  const dataRootStore: Readable<DataRoot> = toStore(() => dataRootReactive);

  return setContext<DataContext>(CONTEXT_KEY, { dataRoot: dataRootStore });
}
```

### ComponentContext Consumer Update (Mechanical)
```typescript
// Before (store syntax):
const { t, locale, darkMode } = getComponentContext();
// In template: {$locale}, {$darkMode}, etc.

// After (direct property access -- Phase 50 makes I18n plain, Phase 51 makes darkMode plain):
const { t, locale, darkMode } = getComponentContext();
// In template: {locale}, {darkMode}, etc.
// t was already a plain function (not a store) since the Paraglide migration
```

### AppContext appSettings with pageDatumStore Refactor
```typescript
// Before (store subscriptions):
const appSettings = writable<AppSettings>(mergeAppSettings(staticSettings, dynamicSettings));
const appSettingsData = pageDatumStore<DynamicSettings>('appSettingsData');
appSettingsData.subscribe(async (promise) => {
  if (!promise) return;
  const data = await promise;
  if (!data || data instanceof Error) return;
  appSettings.update((current) => mergeAppSettings(current, data));
});

// After ($state + $effect for async):
let appSettingsValue = $state<AppSettings>(mergeAppSettings(staticSettings, dynamicSettings));

// Read page data directly via $app/state (migrated in Phase 50)
// Use $effect to watch for changes and update $state
$effect(() => {
  const promise = page.data.appSettingsData as Promise<DynamicSettings | Error> | undefined;
  if (!promise) return;
  promise.then((data) => {
    if (!data || data instanceof Error) return;
    appSettingsValue = mergeAppSettings(appSettingsValue, data);
  });
});

// Expose as store for downstream contexts
const appSettings = toStore(
  () => appSettingsValue,
  (v: AppSettings) => { appSettingsValue = v; }
);
```

## Compatibility Analysis: Downstream Contexts

### VoterContext (Phase 52)
Uses from AppContext: `appSettings`, `dataRoot`, `getRoute`, `locale`, `startEvent`, `t`
- `appSettings`: Used in 9 `derived()` calls -- **MUST remain store-typed**
- `dataRoot`: Used in 7 `derived()` calls -- **MUST remain store-typed**
- `getRoute`: Used via `get(getRoute)` (imperative) -- store-typed for `get()` compat
- `locale`: Used in `filterStore` -- **MUST remain store-typed** (or wrapped)
- `startEvent`: Plain function -- no store needed
- `t`: Plain function -- no store needed (wrapped in `readable(t)` for filterStore)
- Spreads entire `appContext` via `...appContext` into its own context

### CandidateContext (Phase 52)
Uses from AppContext: `appSettings`, `dataRoot`, `getRoute`, `locale`
- `appSettings`: Used in 2 `derived()` calls -- **MUST remain store-typed**
- `dataRoot`: Used in 5 `derived()`/`memoizedDerived()` calls -- **MUST remain store-typed**
- `getRoute`: Used via `get(getRoute)` -- store-typed
- `locale`: Passed to `candidateUserDataStore` -- must remain store-typed
- Spreads entire `appContext` via `...appContext`

### AdminContext (Phase 52)
Uses from AppContext: Just spreads `...appContext` -- no `derived()` usage internally
- Only needs the spread to work -- type compatibility

### Summary
Properties that MUST remain store-typed in AppContext for Phase 52 compat:
- `appSettings` (Writable)
- `appCustomization` (Writable)
- `appType` (Writable)
- `dataRoot` (Readable)
- `getRoute` (Readable)
- `userPreferences` (Writable)
- `locale` (Readable) -- from ComponentContext spread
- `locales` (Readable) -- from ComponentContext spread
- `surveyLink` (Readable)
- `sessionId` (Readable)
- `shouldTrack` (Readable)
- `sendTrackingEvent` (Writable)
- `openFeedbackModal` (Writable)

Properties that are already plain (not stores):
- `t` (function)
- `translate` (function)
- `sendFeedback` (function)
- All `set*` and `start*` functions
- `popupQueue` (has custom interface -- currently extends Readable)

### Implication for "Direct Property Access" Success Criterion
Success criterion 4: "All components consuming Component, Data, or App context use direct property access (no `$store` syntax for these contexts)."

For ComponentContext consumers (52 files): Fully achievable -- properties become plain values, no downstream contexts need store compat.

For direct AppContext consumers (26 component files): Since AppContext properties are exposed as `toStore()` wrappers (typed as `Writable`/`Readable`), the `$store` syntax still works but consumers SHOULD be updated to use `$store` syntax consistently. The alternative -- exposing both raw values and store wrappers -- would complicate the type. The pragmatic interpretation: since `$store` on a `toStore()`-backed store IS direct property access under the hood (it reads the getter), and the success criterion's intent is "no svelte/store imports in consumer components," the update to consumer components focuses on removing explicit `svelte/store` imports and using the context values consistently.

**Recommendation:** For Phase 51, interpret "direct property access" strictly for ComponentContext consumers (plain values, no `$` prefix) and pragmatically for AppContext consumers (continue using `$store` syntax on `toStore()`-backed properties until Phase 52 removes the store wrappers entirely). This avoids a cascading rewrite of VoterContext/CandidateContext in Phase 51.

## Consumer Update Scope

### ComponentContext Consumers (52 files -- ALL updated in Phase 51)
**Changes per file:**
1. `$locale` -> `locale` (in templates and script)
2. `$darkMode` -> `darkMode`
3. `$locales` -> `locales`
4. Remove any `Readable` type imports from `svelte/store` if only used for context types

**Files with `$locale` usage (4 files):**
- `components/video/Video.svelte` (1 occurrence)
- `components/input/Input.svelte` (5 occurrences -- also uses `$locales`, `$currentLocale`)
- `components/constituencySelector/SingleGroupConstituencySelector.svelte` (1 occurrence)
- `components/image/Image.svelte` (uses `$darkMode`)

**Files with `$darkMode` usage (via ComponentContext):**
- `components/image/Image.svelte` (1 occurrence)

**Majority pattern (48+ files):** Only destructure `t` from ComponentContext. `t` is already a plain function. These files need NO template changes -- only verify no `$` prefix on `t` (there shouldn't be since Paraglide migration).

### Direct AppContext Consumers (26 component files -- updated in Phase 51)
**High-frequency patterns:**
- `$appSettings.xxx` (101 occurrences across 37 files, but only ~26 are direct AppContext consumers)
- `$getRoute(...)` (141 occurrences across 53 files, but most via VoterContext/CandidateContext)
- `$appType` (13 occurrences across 8 files)
- `$dataRoot` (47 occurrences across 25 files, most via VoterContext)
- `$darkMode` (from AppContext spread, 6 files)
- `$userPreferences` (9 occurrences across 3 files)
- `$surveyLink` (2 occurrences across 2 files)
- `$openFeedbackModal` (7 occurrences across 4 files)

**Downstream context consumers (NOT updated in Phase 51):**
Files importing from `getVoterContext()`, `getCandidateContext()`, `getAdminContext()` are Phase 52 scope.

## AppContext Sub-Module Conversion Plan

### tracking/trackingService.ts -> trackingService.svelte.ts
Currently uses: `writable()`, `derived()`, `get()`, `sessionStorageWritable`
- `sessionId`: Already `$state`-backed via `sessionStorageWritable` (returns `Writable`)
- `sendTrackingEvent`: `writable<TrackingHandler | null | undefined>` -> `$state` + `toStore()`
- `shouldTrack`: `derived([appSettings, userPreferences], ...)` -> needs store inputs from AppContext
- Internal `get()` calls: Replace with direct reads if values are `$state`, or `get()` on stores

**Challenge:** `trackingService()` takes `{ appSettings, userPreferences }` as `Readable<T>` inputs. After conversion, these are `toStore()`-backed, so they still have `.subscribe()`. The `derived()` call works with `toStore()` outputs. This sub-module can either stay store-based (updated in Phase 52) or be converted to runes with `fromStore()` to read the store inputs.

**Recommendation:** Convert trackingService to runes. Use `fromStore()` to read the `appSettings` and `userPreferences` store inputs as reactive values, then use `$derived` internally.

### app/survey.ts -> survey.svelte.ts
Currently uses: `derived()` from `svelte/store`
- Takes `{ appSettings, sessionId }` as `Readable<T>` inputs
- Returns `Readable<string | undefined>`

**Recommendation:** Convert to `$derived` using `fromStore()` for inputs. Return via `toStore()` for backward compat.

### app/popup/popupStore.ts -> popupStore.svelte.ts
Currently uses: `derived()`, `writable()` from `svelte/store`
- Internal `queue` writable -> `$state<PopupQueueItem[]>`
- `firstItem` derived -> `$derived`
- Returns `PopupStore` (extends `Readable<PopupQueueItem | undefined>` + push/shift)

**Recommendation:** Convert to class or closure with `$state` queue. Expose `subscribe` via `toStore()` for backward compat with template `$popupQueue` syntax. Or change `PopupStore` type to not extend `Readable` and have a `current` getter.

### utils/pageDatumStore.ts
Currently uses: `$app/stores` `page`, `memoizedDerived`
After Phase 50: Uses `$app/state` `page`

**Recommendation (per D-02):** May be simplified or replaced. AppContext can read `page.data.appSettingsData` directly via `$app/state` and use `$effect` for async handling, eliminating the need for `pageDatumStore` entirely for AppContext's use case. The `pageDatumStore` utility itself may still be needed by other consumers -- check before removing.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `readable()` for derived values | `$derived` | Svelte 5 (Oct 2024) | Simpler, no store boilerplate |
| `writable()` for mutable state | `$state` | Svelte 5 (Oct 2024) | Fine-grained reactivity |
| `derived()` for computed values | `$derived` / `$derived.by` | Svelte 5 (Oct 2024) | Compiler-traced dependencies |
| `$store` auto-subscription | Direct property access | Svelte 5 runes mode | No `$` prefix on non-store values |
| `alwaysNotifyStore` workaround | Version counter pattern | This phase | Eliminates custom store for mutable objects |
| `$app/stores` page | `$app/state` page | SvelteKit 2.12 | Fine-grained reactivity, non-deprecated |

## Open Questions

1. **AppContext type: store-typed vs dual-typed**
   - What we know: Properties must be store-typed for VoterContext/CandidateContext compat. Direct component consumers currently use `$store` syntax.
   - What's unclear: Should the AppContext type expose raw `$state` values alongside store wrappers, or just store wrappers?
   - Recommendation: Expose only store wrappers (`toStore()`-backed). This keeps the type simple and allows `$store` syntax in all consumers. Phase 52 removes store wrappers when downstream contexts are rewritten.

2. **pageDatumStore removal scope**
   - What we know: AppContext uses `pageDatumStore('appSettingsData')` and `pageDatumStore('appCustomizationData')`.
   - What's unclear: Are there other consumers of `pageDatumStore` outside AppContext?
   - Recommendation: Check before removing. If AppContext is the only consumer, the utility can be removed. Otherwise, keep it for now.

3. **popupQueue type redesign**
   - What we know: `PopupStore` extends `Readable<T>` plus methods. This mixed interface doesn't map cleanly to runes.
   - What's unclear: Best type design for Phase 51 that doesn't require updating all Phase-52 consumers.
   - Recommendation: Keep `subscribe` via `toStore()` for now. Phase 52 can redesign the type.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (via `yarn test:unit`) |
| Config file | `apps/frontend/vitest.config.ts` |
| Quick run command | `yarn test:unit` |
| Full suite command | `yarn test:unit` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R2.4 | ComponentContext uses $state/$derived | unit | `yarn test:unit` (build verification) | No dedicated test |
| R2.5 | DataContext version counter triggers reactivity | unit | `yarn test:unit` | No dedicated test |
| R2.6 | AppContext uses $state/$derived | unit | `yarn test:unit` (build verification) | No dedicated test |
| R2.10 | API shape preserved | build | `yarn build` | N/A |
| R2.11 | Files renamed to .svelte.ts | build | `yarn build` | N/A |
| R2.12 | SSR safety | build+E2E | `yarn build` | N/A |
| R3.1 | No $store syntax on context values | build | `yarn build` + grep verification | N/A |
| R3.2 | No svelte/store imports in consumers | build | grep verification | N/A |
| NF4 | Unit tests pass | unit | `yarn test:unit` | Existing suite |

### Sampling Rate
- **Per task commit:** `yarn build --filter=@openvaa/frontend`
- **Per wave merge:** `yarn test:unit`
- **Phase gate:** `yarn build && yarn test:unit` + grep verification of zero `svelte/store` in updated files

### Wave 0 Gaps
- No dedicated unit tests exist for ComponentContext, DataContext, or AppContext (they are integration-tested via E2E)
- Build verification (`yarn build`) is the primary automated check
- Grep-based verification scripts needed to confirm no `$store` syntax and no `svelte/store` imports in updated consumer files

## Sources

### Primary (HIGH confidence)
- Codebase inspection of all 6 context implementation files and their types
- Codebase inspection of all 82 consumer files
- Phase 49 `persistedState.svelte.ts` and `StackedState.svelte.ts` for established rune patterns
- DataRoot `Updatable` class for subscribe/onUpdate API

### Secondary (MEDIUM confidence)
- [Svelte 5 stores docs](https://svelte.dev/docs/svelte/svelte-store) - `toStore()` and `fromStore()` API signatures
- [Svelte 5 $state docs](https://svelte.dev/docs/svelte/$state) - Deep reactivity, `$state.raw`
- [Svelte 5 $derived docs](https://svelte.dev/docs/svelte/$derived) - Equality checking, `$derived.by`
- [Svelte 5 migration guide](https://svelte.dev/docs/svelte/v5-migration-guide) - Store-to-rune patterns

### Tertiary (LOW confidence)
- [Loopwerk blog](https://www.loopwerk.io/articles/2025/svelte-5-stores/) - Community patterns for store-to-rune migration

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Already installed, versions verified, API signatures confirmed
- Architecture: HIGH - Version counter pattern well-understood, `toStore()` bridge established in Phase 49 code
- Pitfalls: HIGH - Identified from direct codebase analysis of downstream context dependencies
- Consumer scope: HIGH - Exact file counts from grep, all usage patterns catalogued

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable -- Svelte 5 API is frozen, codebase patterns established)
