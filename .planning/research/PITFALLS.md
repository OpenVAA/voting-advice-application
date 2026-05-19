# Domain Pitfalls: Svelte 5 Context System Rewrite and Global Runes Enablement

**Domain:** Svelte 5 migration completion for existing SvelteKit 2 VAA framework
**Researched:** 2026-03-27

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: DataRoot Mutable Object + Signal Equality

**What goes wrong:** DataRoot from `@openvaa/data` is mutated in-place and signals changes via an imperative `subscribe()` callback. Svelte 5's `$state` uses `Object.is()` equality, so re-assigning the same reference will not trigger re-renders.
**Why it happens:** The current `alwaysNotifyStore` workaround in `dataContext.ts` manually bypasses equality checking. A naive `$state` replacement (`let dataRoot = $state(new DataRoot(...))`) would lose reactivity on mutations because the reference never changes.
**Consequences:** UI freezes after initial data load. Elections, constituencies, questions appear stale or empty. No error thrown -- silent failure.
**Prevention:** Use a version counter pattern: increment a `$state` counter in DataRoot's subscribe callback. All `$derived` values that depend on DataRoot must reference the counter to establish a dependency. See ARCHITECTURE.md "DataRoot Special Case".
**Detection:** If elections/questions do not update after initial load in dev mode, the DataRoot reactivity bridge is broken.

### Pitfall 2: Context Initialization Order Violation

**What goes wrong:** Contexts have strict initialization dependencies (I18n -> Component -> Data -> App -> Voter/Candidate/Admin). If the rewrite changes when/how contexts are initialized, downstream contexts will call `getContext` before the parent has called `setContext`, causing a 500 error.
**Why it happens:** The inheritance pattern uses `...getAppContext()` inside `initVoterContext()`. If AppContext is not yet initialized at that point (e.g., due to async initialization or moved to a different layout level), the Symbol lookup fails.
**Consequences:** Hard 500 error: "getAppContext() called before initAppContext()". App does not render.
**Prevention:** Preserve the exact initialization order in root `+layout.svelte`. Do not make context initialization async. Do not move context init calls to different layout files.
**Detection:** Immediate on page load -- error is thrown synchronously.

### Pitfall 3: Module-Level `$state` Causing SSR Data Leakage

**What goes wrong:** If any `$state` is declared at module scope (outside of `setContext`), it persists across server-side requests. User A's data leaks to User B.
**Why it happens:** Node.js modules are singletons. Module-level state is shared across all SSR requests. Svelte 4 stores have the same issue, but the existing code already avoids it by using `setContext`. During the rewrite, a developer might accidentally extract state to module scope for "cleaner code".
**Consequences:** Security vulnerability: user data leakage in production SSR.
**Prevention:** All `$state` must be declared inside `initXxxContext()` functions or class constructors called from those functions. Code review must flag any module-level `$state`.
**Detection:** Only visible in production SSR with concurrent users. Not detectable in dev mode (single user).

### Pitfall 4: `$effect` for Data Loading Instead of `$derived`

**What goes wrong:** The root `+layout.svelte` currently uses `$: {}` blocks for async data loading. If replaced with `$effect`, the timing changes: `$effect` runs after DOM update, not synchronously. This can cause a flash of empty content or double-render.
**Why it happens:** `$:` in Svelte 4 runs synchronously before render. `$effect` in Svelte 5 runs after render. The data loading pattern in root layout sets `ready = false`, then async loads data, then sets `ready = true`. If `ready` flashes to `false` on every navigation, the loading screen flickers.
**Consequences:** Loading screen flickers on every navigation. Possible layout shifts. Poor UX.
**Prevention:** Use `$derived` for synchronous computed values. Use `$effect` only for the async data fetching side effect. Consider whether the root layout data loading can be moved entirely to `+layout.ts` load function (which already exists and already handles the async work). In v2.1, the `+layout.ts` was refactored to `await` all data before returning, so `page.data` already contains resolved values -- the `Promise.all` in root layout may be unnecessary.
**Detection:** Visible in dev mode during page navigation. Loading spinner appears briefly between pages.

## Moderate Pitfalls

### Pitfall 5: Bulk Consumer Update Inconsistency

**What goes wrong:** With 141 component files to update, some files get missed or partially updated. A component uses `$answers` (store syntax) when the context now exposes `answers` as a plain `$state` property.
**Prevention:** Grep-based verification after each batch. Search for `$` prefix on known context property names. TypeScript compiler will catch some cases (type mismatch), but template expressions may not be type-checked.
**Detection:** Runtime error: "Cannot read property 'subscribe' of undefined" or similar. TypeScript errors in `.ts` sections.

### Pitfall 6: `storageStore` Persistence Timing with `$effect`

**What goes wrong:** The current `storageStore` subscribes synchronously and writes to storage on every value change. With `$effect`, storage writes happen asynchronously (after render). If the user navigates away before the effect fires, data may be lost.
**Prevention:** Use `$effect.pre` or synchronous writes in setters instead of `$effect` for critical persistence (voter answers, user preferences). Alternatively, keep the eager subscription pattern inside the persisted state utility.
**Detection:** Voter loses answers after navigating away from question page. Candidate edits disappear on page refresh.

### Pitfall 7: `Tweened` Store in LayoutContext

**What goes wrong:** The progress bar uses `tweened()` from `svelte/motion`, which returns a writable store. If the context type changes to expect `$state` but the tweened store is not adapted, the progress animation breaks.
**Prevention:** Keep `tweened()` as-is. It returns a store-compatible object that works in Svelte 5. Wrap it in the context type as-is or use the tweened value directly.
**Detection:** Progress bar jumps instead of animating, or does not update at all.

### Pitfall 8: `getLayoutContext(onDestroy)` Revert Pattern

**What goes wrong:** `getLayoutContext` takes `onDestroy` as a parameter and registers cleanup callbacks to revert stacked settings. If the `StackedState` class replacement changes the revert semantics (e.g., index-based vs count-based), components may not properly clean up their layout overrides.
**Prevention:** Preserve the exact same index-tracking and revert API. Test with nested layouts that push and pop settings.
**Detection:** Top bar settings or page styles "leak" from one route to another. Wrong buttons visible after navigation.

## Minor Pitfalls

### Pitfall 9: `export let data` in Legacy Admin Files

**What goes wrong:** The 10 admin files use `export let data: PageData` (Svelte 4 syntax). When migrating to runes, this becomes `let { data } = $props()`. If the migration is incomplete, TypeScript accepts the old syntax but it will not work in runes mode.
**Prevention:** Migrate all `export let` to `$props()` in admin files before enabling global runes.
**Detection:** TypeScript may not catch this if the file is in legacy mode. Only fails when global runes is enabled.

### Pitfall 10: `bind:this` for FeedbackModal and UmamiAnalytics

**What goes wrong:** Root layout uses `bind:this` to get references to FeedbackModal and UmamiAnalytics. The callback pattern (`feedbackModalRef.openFeedback`) must continue working with runes-mode components.
**Prevention:** Ensure bound components export functions via `export function` (which works in runes mode). Verify `bind:this` gives a reference with the expected methods.
**Detection:** Feedback modal does not open. Analytics events are not tracked.

### Pitfall 11: `svelte:component` Dynamic Imports in Root Layout

**What goes wrong:** Root layout uses `{#await import(...)} ... <svelte:component this={X.default}>` pattern for lazy-loading UmamiAnalytics and VisibilityChange. In runes mode, `svelte:component` is deprecated in favor of `<Component>` syntax.
**Prevention:** Replace `<svelte:component this={Component}>` with `<Component>` when migrating root layout to runes.
**Detection:** Svelte compiler warning. Component may not render.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Core Infrastructure | Storage timing (#6) | Test persistence round-trip in voter answer flow |
| Leaf Contexts | Tweened store (#7) | Keep tweened as-is, verify animation |
| DataContext | DataRoot equality (#1) | Version counter pattern, test with data updates |
| AppContext | pageDatumStore removal timing | Ensure data flow from +layout.ts -> context works without intermediate store |
| VoterContext | 20 parsimoniusDerived -> $derived | Each conversion needs correct dependency tracking |
| CandidateContext | candidateUserDataStore derived chain | 7 internal derived stores must maintain correct update order |
| Consumer Updates | Missed files (#5) | Grep verification, TypeScript strict mode |
| Root Layout Migration | $effect timing (#4) | Test loading state transitions carefully |
| Admin Migration | export let (#9) | Batch all 10 files together |
| Global Runes | Hidden legacy patterns (#9, #11) | Compiler will catch most; manual review for template patterns |
| E2E Fixes | pushState reactivity | May need additional investigation if $app/state alone does not fix it |

## Sources

- Codebase analysis of all 40 context files, 16 legacy files, 141 consumer components
- DataRoot `alwaysNotifyStore` workaround with documented TODO: `TODO[Svelte 5]: Replace with Svelte 5 native reactivity`
- Svelte 5 documentation on `$effect` timing and SSR state management
- [Runes and Global State: do's and don'ts (Mainmatter)](https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/) -- SSR data leakage warning
- Known project issue: Svelte 5 pushState reactivity bug (10 E2E tests skipped, per PROJECT.md)
- Known project pattern: `PopupRenderer` runes-mode wrapper (v2.1 workaround for async store updates)
