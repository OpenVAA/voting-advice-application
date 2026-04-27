# Feature Landscape: Svelte 5 Context System Rewrite & Global Runes

**Domain:** Svelte 5 migration completion (context system, global runes mode, pushState fix)
**Researched:** 2026-03-27
**Svelte version:** 5.53.12
**SvelteKit version:** 2.55.0

## Table Stakes

Features that are necessary to call the Svelte 5 migration "complete." Without these, the codebase remains in a mixed Svelte 4/5 state with known bugs.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Context system rewrite to `$state`/`$derived` | 40 context files use `svelte/store` (writable, derived, readable). This is the last major Svelte 4 pattern remaining. Stores are the deprecated direction in Svelte 5. | **High** | 9 context modules, ~55 store instances, 40+ files with store imports. Core data flow for entire app. |
| Consumer component updates (`$store` to property access) | All components that use store auto-subscription syntax must switch to direct property access. | **High** (volume) | 151+ components, but mechanical find-and-replace per context. |
| Context type interface updates | Current types use `Readable<T>`/`Writable<T>` from `svelte/store`. Must be replaced with plain reactive interfaces. | **Medium** | ~15 `.type.ts` files across all 9 context modules. |
| Root layout runes migration | Root `+layout.svelte` is the only layout still in full Svelte 4 legacy mode (`export let data`, `$:`, `<slot />`). Blocks global runes enablement. | **Medium** | Single file but high-risk -- initializes all contexts, handles data loading, manages error/ready states. `.then()` hydration bug documented. |
| `$app/stores` to `$app/state` migration | `$app/stores` is deprecated since SvelteKit 2.12. 11 files still import from it. `$app/state` provides fine-grained `$state.raw`-based reactivity. | **Medium** | Critical: context `.ts` files that import `page` from `$app/stores` must become `.svelte.ts` files to use `$app/state` (runes only work in `.svelte.ts`). |
| Remaining legacy file migration | 12 files still use `$:` reactive declarations. 6 files use `export let`. 7 files use `<slot>`. Most are admin routes + root layout + Header. | **Medium** | Admin routes are lower-traffic but still block global runes. Header.svelte uses `on:click`. |
| Global runes enablement | 151 `.svelte` files have per-file `<svelte:options runes />` directives. Global mode removes all of them and prevents new Svelte 4 code. | **Low** (after prerequisites) | Must use `dynamicCompileOptions` in vite config to exclude `node_modules`. Cannot enable until ALL `.svelte` files are runes-compatible. |
| Remove per-file `<svelte:options runes />` directives | 151 files with redundant opt-in after global mode is enabled. Noise removal. | **Low** | Mechanical find-and-replace after global runes is verified. |
| Fix skipped E2E tests (pushState/hydration reactivity) | Tests are `test.fixme` or effectively dead. 3 voter tests (settings, results-sections x2) + voter-detail tab switching + candidate registration cascade. | **Medium-High** | Root cause: `$state` writes in `.then()` callbacks from `$effect` don't trigger re-renders after SSR+hydration. Context rewrite likely resolves by eliminating the `.then()` pattern. |
| Preserve existing API shape | `getXxxContext()` / `initXxxContext()` pattern must continue working for consumers. | **Low** | Change internals, keep external function signatures. |

## Differentiators

Features that go beyond minimum viable migration and provide additional value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| `createContext` API adoption (Svelte 5.40+) | Type-safe `[get, set]` pair from `createContext<T>()`. Eliminates Symbol keys and manual `getContext<T>` typing. Available since Svelte 5.40 (current: 5.53). | **Low** | Drop-in improvement during context rewrite. Each context module's `getXContext()`/`initXContext()` pair maps directly. |
| `parsimoniusDerived` elimination | Custom utility wrapping `derived` with caching/SSR guards. With `$derived`/`$derived.by()`, this workaround is unnecessary. | **Medium** | Used in 15+ places across voter/candidate contexts. Replacement is `$derived.by()` with manual equality checks where needed. |
| `alwaysNotifyStore` elimination in DataContext | Custom store that bypasses `Object.is()` equality to force notifications on same-reference mutations. Version-counter pattern with `$state` is simpler. | **Medium** | DataRoot is mutated in-place with `.subscribe()` callback. Version counter triggers re-derivation without custom store. |
| Storage stores as runes | Replace `localStorageWritable`/`sessionStorageWritable` with `$state` + `$effect` for persistence. Cleaner API, no manual subscribe. | **Medium** | Used for answers, user preferences, candidate data. `$effect` auto-tracks and syncs to storage. |
| `pageDatumStore` elimination | Derives individual keys from `$page.data`. With `$app/state`, access `page.data.someKey` directly -- fine-grained reactivity built in. | **Low** | 2 call sites in appContext. Direct `$app/state` access replaces the utility entirely. |
| Stacked store as runes class | `stackedStore` uses `writable`/`derived`. A class-based `$state` version avoids store subscription overhead. | **Medium** | Used for layoutContext (pageStyles, topBarSettings, navigationSettings). |
| Fine-grained page reactivity | `$app/state` page object uses `$state.raw` internally. Updates to `page.state` do not invalidate `page.data` and vice-versa. | **Low** | Free performance gain from `$app/state` migration. |
| `Tween` class replacing `tweened()` | `tweened()` from `svelte/motion` is deprecated in favor of the `Tween` class. | **Low** | Simple 1:1 replacement in layoutContext's progress store. |
| pushState reactivity improvement | Fine-grained `$app/state` should resolve the Svelte 5 pushState reactivity bug, potentially fixing more than just the 3 known skipped tests. | **Low** | Verification needed after migration. |

## Anti-Features

Features to explicitly NOT build during this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Complete admin app runes rewrite | Admin routes are experimental/low-traffic. Full rewrite is out of scope. | Minimum migration for global runes compatibility. Defer deep refactoring to Admin App Migration milestone. |
| State management library (Zustand, etc.) | Svelte 5 runes provide native state management. External library adds dep and learning curve. | Use `$state` + `$derived` + `setContext`/`getContext` or `createContext`. |
| Store compatibility layer (fromStore/toStore) | Bridge utilities create dual systems and maintenance burden. | Clean break: migrate all contexts and consumers together per module. |
| Partial context migration (some stores, some runes) | Mixed patterns in the same context module are confusing and harder to maintain. | Rewrite each context module completely in one pass. |
| Reactive DataRoot proxy | Wrapping DataRoot in a Proxy to intercept mutations for Svelte 5 reactivity. | Version counter is simpler. DataRoot already has `subscribe()`. |
| Signal-based DataRoot | Rewriting `@openvaa/data`'s DataRoot to use signals internally. | Out of scope. DataRoot is a shared package used by non-Svelte consumers. |
| Svelte 5 `$state.raw` for all context values | Premature optimization that loses automatic deep reactivity. | Use `$state` by default. `$state.raw` only for large immutable collections. |
| SvelteKit 3 upgrade | Separate major version migration. | Stay on SvelteKit 2.55.x. `$app/state` API is stable. |

## Feature Dependencies

```
Context file rename (.ts --> .svelte.ts)
    --> Context system rewrite (stores to $state/$derived)
    --> $app/stores --> $app/state migration

parsimoniusDerived replacement --> all context rewrites that use it
storageStore replacement --> voterContext answerStore, appContext userPreferences, candidateUserDataStore
stackedStore replacement --> layoutContext

I18nContext rewrite --> ComponentContext rewrite
ComponentContext rewrite --> AppContext rewrite
DataContext rewrite --> AppContext rewrite
AppContext rewrite --> VoterContext, CandidateContext, AdminContext rewrites

Context system rewrite --> Consumer component updates ($store -> property)
Context system rewrite --> Fix pushState/hydration reactivity (eliminates .then() pattern)

Root layout runes migration --> Global runes enablement
Remaining legacy file migration --> Global runes enablement
Global runes enablement --> Per-file opt-in removal

$app/state migration --> E2E test fixes (pushState reactivity)
Root layout runes migration --> E2E test fixes (hydration .then() bug)
```

**Critical path:** Context `.ts` --> `.svelte.ts` rename + utility store rewrites --> context rewrites bottom-up --> consumer updates + `$app/state` migration --> root layout + legacy file migration --> global runes --> E2E verification.

## Detailed Feature Analysis

### F-01: Context System Rewrite

**Current state:** 9 context modules use `setContext`/`getContext` with Symbol keys. All reactive values are `Writable<T>` or `Readable<T>` from `svelte/store`. Context types reference `Writable`/`Readable`. ~51 store import occurrences across 40 files.

**Target state:** Context modules export `$state` objects via `setContext` (or `createContext`). Types define plain reactive interfaces. Consumer components access values directly.

**Key pattern change:**

Before (current):
```typescript
// appContext.ts
import { writable } from 'svelte/store';
const appType: Writable<AppType> = writable();
return setContext(CONTEXT_KEY, { appType, ... });

// consumer.svelte
const { appType } = getAppContext();
$appType = 'voter'; // store auto-subscription
```

After (target):
```typescript
// appContext.svelte.ts
let appType = $state<AppType>();
return setContext(CONTEXT_KEY, {
  get appType() { return appType; },
  set appType(v) { appType = v; },
  ...
});

// consumer.svelte
const ctx = getAppContext();
ctx.appType = 'voter'; // direct assignment, reactive via getter/setter
```

**Critical design choice: getter/setter vs object mutation.** Svelte 5 context reactivity requires that the context object identity stays stable (never reassigned). For primitive values, use getter/setter pairs. For object values, `$state({ ... })` with property mutation works because Svelte wraps in Proxy.

**Affected modules (9), ordered by dependency chain:**
1. `i18nContext` -- Wraps Paraglide values as readable stores. Simplest (values static per page).
2. `componentContext` -- Inherits i18nContext + darkMode store. Simple.
3. `dataContext` -- `alwaysNotifyStore` workaround for DataRoot. Needs version-counter `$state` bridge.
4. `authContext` -- Derived from `page` store for `isAuthenticated`. Simple.
5. `layoutContext` -- Stacked stores for page styles, top bar. `tweened` motion for progress.
6. `appContext` -- Largest context. Writables for settings, preferences, popups. Uses `pageDatumStore`.
7. `voterContext` -- Heaviest derived chain. 15+ `parsimoniusDerived` calls. Matching, filtering.
8. `candidateContext` -- Auth, data writer methods, pre-registration stores.
9. `adminContext` -- Writable for userData, job stores. `prepareDataWriter` pattern.

**Utility stores to rewrite:**
- `parsimoniusDerived` (15+ usages) --> `$derived.by()` with equality checks
- `paramStore` (2 usages) --> direct `$app/state` page.params access
- `pageDatumStore` (2 usages) --> direct `$app/state` page.data access
- `getRoute` (1 usage) --> `$derived` based on `page.params`, `page.route`, `page.url`
- `storageStore` (6 usages) --> `$state` + `$effect` for persistence
- `stackedStore` (3 usages) --> class with `$state` array
- `questionBlockStore`, `questionStore`, `questionCategoryStore` --> `$derived.by()`
- `filterStore`, `matchStore` --> `$derived.by()`
- `answerStore` --> `$state` with persistence `$effect`

### F-02: File Extension Rename (.ts to .svelte.ts)

**Why required:** Runes (`$state`, `$derived`, `$effect`) only work in `.svelte` and `.svelte.ts` files. The current context system lives in `.ts` files. To use `$app/state` and runes, they must be `.svelte.ts`.

**Scope:** All context implementation files. Type-only files (`.type.ts`) can stay as `.ts` since they contain no runtime runes.

**Risk:** LOW. Vite and Svelte compiler handle `.svelte.ts` natively.

### F-03: Root Layout Runes Migration

**Current state:** `+layout.svelte` uses `export let data`, 3 `$:` reactive blocks, `<slot />`, and the `.then()` pattern for async data loading.

**Target state:** `$props()`, `$derived`/`$effect`, `{@render children()}`.

**Key challenge:** The `.then()` pattern resolves 4 promises and sets `ready = true`. Options:
1. `{#await Promise.all(...)}` in template (simplest, avoids hydration bug)
2. `$effect` without `.then()` (restructure async handling)
3. Move validation to `+layout.ts` load function

**Additional root layout changes:** `bind:this` refs, `svelte:component` dynamic imports, `on:hidden` event handler.

### F-04: Global Runes Enablement

**Mechanism:** Use `dynamicCompileOptions` to enable runes for project files only:

```javascript
// svelte.config.js
dynamicCompileOptions({ filename }) {
  if (!filename.includes('node_modules')) {
    return { runes: true };
  }
}
```

**Do NOT use** `compilerOptions: { runes: true }` directly -- forces runes on node_modules, breaking third-party components.

**Remaining blockers:** 12 files with `$:`, 6 with `export let`, 7 with `<slot>`, 2 with `on:event`. Mostly admin routes + root layout + Header.

### F-05: Fix Skipped E2E Tests

**Root causes:** (1) `$state` writes inside `.then()` from `$effect` don't trigger re-renders after SSR+hydration. (2) Tab switching `$state` mutations don't propagate to layout templates.

**Tests:** voter-settings (1), results-sections (2), voter-detail (1), candidate registration cascade (2 direct + 35 cascading).

**Expected resolution:** Context rewrite eliminates `.then()` pattern. Verification required after rewrite.

## Scope Quantification

| Category | File Count | Effort |
|----------|-----------|--------|
| Context modules to rewrite | 9 modules (~20 implementation files) | High |
| Utility store files to rewrite | ~12 files | Medium |
| Context files to rename (.ts --> .svelte.ts) | ~40 files | Low |
| Type definition files to update | ~15 files | Medium |
| Component files needing `$store` --> property changes | 151+ | High (volume) |
| Legacy .svelte files to migrate | ~16 | Medium |
| `<svelte:options runes />` directives to remove | 151 | Low |
| `$app/stores` imports to migrate | 11 | Medium |
| E2E tests to fix and verify | 10 (~4 spec files) | Medium |

## MVP Recommendation

All table stakes features are required for the milestone. Prioritize in dependency order:

1. **Context file rename** (.ts --> .svelte.ts) -- zero behavior change, unblocks runes
2. **Utility store rewrites** (parsimoniusDerived, storageStore, stackedStore) -- shared infrastructure
3. **Context system rewrite** bottom-up following dependency chain -- core work (~70% of effort)
4. **Consumer updates** ($store --> property access) -- follows each context module
5. **$app/stores --> $app/state** -- naturally follows context rewrite
6. **Root layout + remaining legacy migration** -- unblocks global runes
7. **Global runes enablement** + directive removal -- milestone gate
8. **E2E test fix verification** -- validates everything

Defer: AdminWriter rename (independent, trivial). Deep admin route refactoring (minimum for global runes only).

## Sources

### Official Documentation (HIGH confidence)
- [Svelte 5 Context Docs](https://svelte.dev/docs/svelte/context) -- `createContext` API, reactive state in context
- [Svelte 5 Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide) -- `$props`, `$derived`, `$effect`
- [$app/state Docs](https://svelte.dev/docs/kit/$app-state) -- reactive page object (SvelteKit 2.12+)
- [$app/stores Deprecation](https://svelte.dev/docs/kit/$app-stores) -- deprecated, removed in SvelteKit 3
- [$state Docs](https://svelte.dev/docs/svelte/$state) -- `.svelte.ts` requirement for runes outside components
- [SvelteKit Shallow Routing](https://svelte.dev/docs/kit/shallow-routing) -- `pushState`/`replaceState` with `$app/state`
- [vite-plugin-svelte dynamicCompileOptions](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md) -- per-file runes excluding node_modules

### Verified Community Sources (MEDIUM confidence)
- [Global State in Svelte 5 (Mainmatter)](https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/) -- closure pattern, `.svelte.ts` requirement
- [createContext PR #16948](https://github.com/sveltejs/svelte/pull/16948) -- added in Svelte 5.40
- [compilerOptions.runes issue #9632](https://github.com/sveltejs/svelte/issues/9632) -- node_modules enforcement problem

### Codebase Analysis (HIGH confidence)
- `.planning/todos/pending/root-layout-runes-migration.md` -- hydration bug details
- `.planning/todos/pending/svelte5-hydration-effect-then-bug.md` -- `.then()` bug analysis
- Direct inspection of all 9 context modules, 12 utility stores, consumer components
- grep analysis: 151 runes directives, 12 `$:` files, 6 `export let` files, 7 `<slot>` files, 11 `$app/stores` imports
