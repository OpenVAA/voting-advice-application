# Feature Landscape: Svelte 5 Content Migration (Voter App)

**Domain:** Frontend framework migration -- Svelte 4 idioms to Svelte 5 runes/snippets/callback props
**Researched:** 2026-03-18
**Overall confidence:** HIGH (official Svelte docs verified, codebase fully analyzed)

## Codebase Migration Surface

Measured from `apps/frontend/src/` via grep analysis:

| Legacy Pattern | Files | Occurrences | Voter Routes | Shared Components | Dynamic Components |
|----------------|-------|-------------|--------------|-------------------|--------------------|
| `$:` reactive statements | 80 | ~100+ | 13 | 53 | 16 |
| `on:event` directives | 77 | ~122 | 5 | 78 | 39 |
| `<slot>` elements | 41 | ~50 | layouts only | 10+ | 5+ |
| `export let` props | 105+ | ~570 | all routes | all components | all components |
| `$$Props`/`$$restProps`/`$$slots` | 105 | 570 | routes | components | dynamic components |
| `createEventDispatcher` | 6 | 6 | 0 | 3 | 3 |
| `svelte/store` imports (contexts) | 30 | 30 | 0 | 0 | 2 |
| `svelte/store` imports (other) | 14 | 14 | 1 | 1 | 0 |
| `svelte:element` dynamic tags | 3 | 3 | 0 | 1 (Button) | 2 |
| `onMount`/`onDestroy` lifecycle | 55 | ~60 | many | some | some |
| `beforeUpdate`/`afterUpdate` | 0 | 0 | -- | -- | -- |

**Key scope note:** Voter routes = 19 `.svelte` files. Shared components (`lib/components/`) = 63 `.svelte` files. Dynamic components (`lib/dynamic-components/`) = 30 `.svelte` files. These shared/dynamic components are used by BOTH voter and candidate apps.

## Table Stakes

Migration conversions that must happen. Missing any leaves the codebase in a hybrid state that contradicts the "zero legacy patterns" bar.

### 1. `export let` to `$props()` Rune

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Convert all `export let` to `let { ... } = $props()` | Core Svelte 5 idiom; `export let` is deprecated in runes mode | **Med** | ~570 occurrences across 105+ files. Mechanical but requires per-component type annotation. |
| Replace `$$Props` type annotations | `$$Props` does not exist in runes mode | **Med** | 105 files. Replace with inline types: `let { text, variant = 'normal' }: ButtonProps = $props()`. |
| Replace `$$restProps` with rest destructuring | `$$restProps` does not exist in runes mode | **Med** | Pervasive. `let { known, ...rest } = $props()` then spread `{...rest}`. The `concatClass` utility works unchanged. |
| Replace `$$slots` checks | `$$slots` does not exist in runes mode | **Low** | Conditional rendering like `{#if $$slots.badge}` becomes `{#if badge}` where `badge` is a `Snippet` prop. |
| Mark bindable props with `$bindable()` | Svelte 5 requires explicit opt-in for two-way binding | **Med** | Modal (`bind:openModal`, `bind:closeModal`), Input (`bind:value`), Layout (`bind:isDrawerOpen`). Each needs `$bindable()` in `$props()`. |
| Root layout `export let data` | SvelteKit page data must use `$props()` | **Low** | `export let data: LayoutData` becomes `let { data }: { data: LayoutData } = $props()`. Applied to all `+page.svelte` and `+layout.svelte` files. |

**Dependency:** None -- foundational conversion everything builds on.

### 2. `$:` Reactive Statements to `$derived` / `$effect`

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Simple derivations: `$: x = expr` to `let x = $derived(expr)` | Direct 1:1 mapping | **Low** | Most common pattern. Button: `$: effectiveText = ...` becomes `let effectiveText = $derived(...)`. |
| Block derivations: `$: { ... }` to `$derived.by()` | Multi-statement computations that produce a value | **Med** | Button class-building blocks, component setup blocks. Requires judgment: is this a derivation or a side effect? |
| Side effect blocks: `$: { ... }` to `$effect()` | Blocks that perform mutations, async ops, or DOM effects | **High** | Root layout data-loading uses `$:` with `Promise.all().then()` -- these are effects. `$: if (error) logDebugError()` is also an effect. Must NOT use `$derived` for these. |
| Remove excessive reactivity workarounds | Svelte 5 fine-grained reactivity eliminates guarded function patterns | **Low** | 4 TODO markers note "probably unnecessary." `setSelected()` wrapper functions in elections/constituencies pages. |
| Class-building reactive blocks | Button, NavItem rebuild CSS class strings | **Low** | `$: { classes = '...'; switch(variant) { ... } }` becomes `let classes = $derived.by(() => { ... })`. |

**Dependency:** Requires `$props()` conversion first. Also affected by how store values are accessed (if contexts change from stores to runes).

### 3. `on:event` Directives to Native Event Attributes / Callback Props

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| DOM `on:click` to `onclick` | Standard HTML attributes replace Svelte-specific syntax | **Low** | Mechanical. `on:click={handler}` becomes `onclick={handler}`. ~122 occurrences. |
| DOM `on:change`, `on:input`, `on:submit`, etc. | Same pattern for all DOM events | **Low** | Direct mapping. |
| Component event forwarding to callback props | Svelte 5 has no implicit event forwarding (`on:click` on a component) | **Med** | Button uses bare `on:click` forwarding via `<svelte:element on:click>`. Must add `onclick` prop. EntityCardAction, NavItem also forward events. Affects call sites in parent components. |
| `createEventDispatcher` to callback props | Deprecated API | **Low** | Only 6 files: Alert, DataConsent, Expander, Feedback, Navigation, SurveyButton. Replace `dispatch('close')` with `onClose?.()` callback prop. |

**Dependency:** `$props()` conversion should happen first so callback props are declared in same destructuring.

### 4. `<slot>` to Snippets (`{@render}`)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Default `<slot />` to `{@render children?.()}` | Core content projection | **Med** | 41 files. Component must declare `children: Snippet` in props. `import type { Snippet } from 'svelte'`. |
| Named `<slot name="x">` to `{@render x?.()}` | Named slots become snippet props | **Med** | Modal (`slot="actions"`), Button (`slot="badge"`), Layout (`slot="menu"`). Each named slot becomes a typed `Snippet` prop. |
| Caller-side `<div slot="x">` to `{#snippet x()}<div>...</div>{/snippet}` | Usage sites change syntax | **Med** | All call sites for named slots. E.g., `<div slot="actions" class="...">` becomes `{#snippet actions()}<div class="...">...</div>{/snippet}`. |
| Conditional slot checks to snippet truthiness | `$$slots.x` replacement | **Low** | Button: `{#if $$slots.badge}` becomes `{#if badge}`. Modal: `{#if $$slots.actions}` becomes `{#if actions}`. |

**Dependency:** `$props()` conversion should happen first. Snippet types need `import type { Snippet } from 'svelte'`.

### 5. Context and Store Architecture

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Keep store auto-subscription (`$store`) working during migration | Stores are NOT deprecated; `$store` syntax works in Svelte 5 runes mode | **None** | Components using `$dataRoot`, `$appSettings` etc. continue working. This is the backward compatibility escape hatch. |
| Replace `alwaysNotifyStore` in dataContext | Custom workaround for Object.is equality on same-reference mutations | **High** | DataRoot mutates in-place and fires `onUpdate()`. Svelte 5 `$state` uses proxy-based deep tracking, but DataRoot comes from `@openvaa/data` (framework-agnostic). Need version-counter signal pattern or thin reactive wrapper. |
| Convert `parsimoniusDerived` or keep as utility | Custom derived store with caching + SSR-safe subscription | **High** | Used in 16+ stores in voterContext. Svelte 5 `$derived` has built-in memoization. But conversion requires context files to be `.svelte.ts` and all inputs to be rune-based. Can be migrated incrementally. |
| Convert `paramStore` to use `$app/state` | `$app/stores` is soft-deprecated in favor of `$app/state` | **Med** | `page` from `$app/state` provides reactive object usable with `$derived()`. Eliminates need for `parsimoniusDerived` wrapper around page store. |
| Convert `pageDatumStore` to `$derived` from `$page.data` | Custom derived substore for page data keys | **Med** | With `$app/state`, can use `let settings = $derived(page.data.appSettingsData)` directly. |
| Convert `storageStore` (localStorage/sessionStorage) | Writable stores with storage sync | **Med** | Can become class with `$state` properties and `$effect` for sync. File needs `.svelte.ts` extension. |
| Convert voter-specific stores (answerStore, matchStore, filterStore) | Custom stores with methods | **Med** | Pattern: function returns `{ subscribe, setAnswer, deleteAnswer }`. Can become class with `$state` + methods in `.svelte.ts`. |
| Convert `stackedStore` utility | Push/revert stack store | **Med** | Used for layout context. Can become class with `$state` array. |

**Dependency:** This is the most interconnected feature area. The architectural decision (keep stores vs. convert to runes) cascades through every component. Must be decided before component migration begins.

### 6. Resolve All TODO[Svelte 5] Markers (v1.3 scope: 10 of 13)

| Marker | Location | Complexity | Resolution |
|--------|----------|------------|------------|
| Root layout data centralization | `+layout.svelte:56` | **Med** | Use `$effect` to watch page data changes instead of `$:` block. |
| Elections reactivity check | `elections/+page.svelte:38` | **Low** | Remove wrapper; use `$derived` directly. |
| Elections `setSelected` wrapper | `elections/+page.svelte:49` | **Low** | Remove; Svelte 5 fine-grained reactivity handles this. |
| Constituencies reactivity check | `constituencies/+page.svelte:46` | **Low** | Same as elections. |
| Constituencies `setSelected` wrapper | `constituencies/+page.svelte:53` | **Low** | Same as elections. |
| Located layout nominations settled | `(located)/+layout.svelte:84` | **High** | Complex Promise + timeout + subscription. Rewrite with `$effect` and `$derived`. |
| EntityCard whitespace | `EntityCard.svelte:264` | **None** | Verify Svelte 5 fixes the `:empty` whitespace issue automatically. |
| EntityCardAction snippet | `EntityCardAction.svelte:4` | **Low** | Convert utility component to `{#snippet}`. |
| DataContext alwaysNotifyStore | `dataContext.ts:60` | **High** | Central reactivity workaround. See store architecture above. |
| Input snippets | `Input.svelte:337` | **Med** | Refactor class-variable layout sections to snippets. |
| Alert refactor | `Alert.svelte:73` | **Low** | Remove `createEventDispatcher`, use `onClose` callback. |
| ConstituencySelector reactivity | `ConstituencySelector.svelte:79` | **Low** | Verify if function wrapper needed with `$derived`. |
| i18n test mock | `i18n/tests/utils.test.ts:6` | **None** | Verify if `$env/dynamic/public` mock still needed. |

3 additional markers (`jobStores.type.ts:21,26`, `WithPolling.svelte:5`) are admin-scope and deferred to later milestone.

### 7. E2E Test Regression Gate

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| All 92 E2E tests passing after migration | Non-negotiable quality bar | **High** | Tests cover voter flows (landing, elections, constituencies, questions, results, entity details) and candidate flows. Component API changes (callback props, snippets) may break test selectors if testIds change. |
| E2E tests updated if component APIs change | Tests may use selectors that depend on HTML structure | **Low** | Snippet migration changes whitespace/wrapper elements. Test selectors use `data-testid` attributes which should be preserved. |

## Differentiators

Improvements beyond minimum migration. Valuable but not required for v1.3 completion.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Class-based context state objects | Better V8 performance, cleaner API than bag-of-stores | **High** | Convert `initVoterContext()` from returning 20+ stores to a class with `$state` properties. Major refactor but eliminates `parsimoniusDerived` chains. |
| `createContext` API adoption (Svelte 5.40+) | Type-safe contexts without manual Symbol keys | **Low** | Available in installed Svelte 5.53. Returns `[get, set]` tuple. Eliminates `CONTEXT_KEY` symbol + `hasContext` boilerplate. |
| `$app/state` adoption replacing `$app/stores` | Modern SvelteKit API; `$derived` without store subscription | **Med** | `page` from `$app/state` is a reactive object. Eliminates `pageDatumStore` utility entirely. |
| Fine-grained `$derived` chains replacing `parsimoniusDerived` | Eliminate 57-line custom utility; use standard API | **High** | Svelte 5 `$derived` is inherently memoized. But requires all context files to be `.svelte.ts`. |
| Snippet-based decomposition of Input component | Input.svelte is 649 lines; snippets improve readability | **Med** | Each input type section (boolean, date, image, number, select, text, textarea) can be a snippet. |
| Automated migration tool as starting point | `npx sv migrate svelte-5` handles ~60-70% of mechanical changes per file | **Low** | Run per-component. Handles `export let` to `$props()`, `$:` to runes, `on:` to attributes, `<slot>` to `{@render}`. |

## Anti-Features

Conversions or patterns to explicitly NOT pursue during this migration.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Migrate candidate app routes | Out of v1.3 scope. 10 route files + 7 candidate components. | Defer to v1.4. Only update call sites for shared components that change API. |
| Migrate admin app routes | Out of scope entirely. Admin app planned for rebuild. | Leave as-is. |
| Global module-level `$state` exports | Server-side data leakage between SSR requests. | Use context-based state (setContext/getContext) which is per-request safe. This is what the codebase already does correctly. |
| Deep-proxy DataRoot with `$state()` | DataRoot is a large mutable object from `@openvaa/data`. Deep proxying could break `instanceof` checks and cause performance issues. | Keep DataRoot as non-proxied. Use version-counter signal pattern to trigger reactivity on mutations. |
| Blanket `npx sv migrate svelte-5` on entire codebase | Misclassifies complex `$:` blocks as effects (inserts `run()` from `svelte/legacy`), loses JSDoc comments, cannot handle custom stores. | Run per-file, review each, use VS Code command for individual components. |
| Convert `onMount`/`onDestroy` to `$effect` | NOT deprecated. `$effect` has different semantics (reruns on dependency change). | Keep `onMount`/`onDestroy` as-is. They work correctly in runes mode. |
| Migrate `@openvaa/data`, `@openvaa/matching`, or other packages to runes | Framework-agnostic npm packages. Must not depend on Svelte reactivity primitives. | Keep packages framework-agnostic. Reactivity integration stays in frontend context layer. |
| Remove all `svelte/store` imports immediately | Stores still work in Svelte 5 and the store compatibility layer is officially supported. Forced removal creates unnecessary risk. | Migrate incrementally. Context stores consumed only by voter app migrate first. Cross-app utilities retain store interface until candidate app migrates. |
| Force-rename all `.ts` to `.svelte.ts` | Only needed where runes (`$state`, `$derived`, `$effect`) are used. Adds Svelte compiler overhead to plain utility files. | Rename only files that actually use runes. |

## Feature Dependencies

```
$props() conversion (1) ─────────────────────────────────────────────┐
    |                                                                 |
    v                                                                 v
$derived/$effect (2)               slots-to-snippets (4)            on:event-to-callbacks (3)
    |                                     |                           |
    v                                     v                           v
Store/Context architecture (5) <── all component conversions depend on context design
    |
    v
TODO[Svelte 5] markers (6) ── most depend on (5) being resolved
    |
    v
E2E regression gate (7) ── validates everything works
```

**Critical path:** Context/store architecture decision (5) must be made before component migration. It determines whether components access state via `$store` subscription or `context.property`.

**Blast radius concern:** Shared components in `lib/components/` and `lib/dynamic-components/` are used by BOTH voter and candidate apps. Migrating them changes the component API (callback props instead of event forwarding, snippets instead of slots). Candidate app call sites must be updated for syntax compatibility even though candidate logic migration is deferred.

**Recommended approach:** Accept the blast radius. Migrate shared components fully, update candidate app call sites for syntax only (no logic refactoring). Svelte 5 compatibility mode keeps unmigrated Svelte 4 consumer code working, but the goal is zero legacy patterns in shared components.

## MVP Recommendation

Prioritize in dependency order:

1. **Context/store architecture decision** -- Design how contexts will expose state in Svelte 5. Two viable options:
   - **Conservative:** Keep store interface, contexts return `Readable<T>`, components use `$store`. Least risk, most incremental.
   - **Full runes:** Convert to `.svelte.ts`, contexts use `$state`/`$derived`, components access properties directly. Cleaner but higher blast radius.

2. **Shared components** -- Migrate `$props()`, `on:event`, `<slot>` patterns in `lib/components/` (63 files) and `lib/dynamic-components/` (30 files). Update candidate app call sites for syntax compatibility.

3. **Voter route files** -- 19 `.svelte` files. Convert `$:` blocks, `on:event` usage, `export let data` patterns.

4. **Root layout and shared layouts** -- `+layout.svelte`, `Layout.svelte`, `Header.svelte`. Context initialization and data flow.

5. **TODO[Svelte 5] markers** -- Resolve the 10 v1.3-scoped markers.

6. **E2E validation** -- All 92 tests passing.

**Defer to later:**
- Candidate routes/components (v1.4)
- Admin routes/components (admin app rebuild milestone)
- `alwaysNotifyStore` and `parsimoniusDerived` elimination if too risky for v1.3

## Sources

- [Svelte 5 Migration Guide (Official)](https://svelte.dev/docs/svelte/v5-migration-guide) -- HIGH confidence
- [Svelte Snippets Documentation](https://svelte.dev/docs/svelte/snippet) -- HIGH confidence
- [$props Rune Documentation](https://svelte.dev/docs/svelte/$props) -- HIGH confidence
- [$derived Rune Documentation](https://svelte.dev/docs/svelte/$derived) -- HIGH confidence
- [Svelte Stores Documentation](https://svelte.dev/docs/svelte/stores) -- HIGH confidence
- [sv migrate CLI Documentation](https://svelte.dev/docs/cli/sv-migrate) -- HIGH confidence
- [Svelte Lifecycle Hooks](https://svelte.dev/docs/svelte/lifecycle-hooks) -- HIGH confidence
- [Runes and Global State Do's and Don'ts (Mainmatter)](https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/) -- MEDIUM confidence
- [Refactoring Svelte Stores to $state Runes (Loopwerk)](https://www.loopwerk.io/articles/2025/svelte-5-stores/) -- MEDIUM confidence
- [Experiences and Caveats of Svelte 5 Migration (sveltejs/svelte Discussion #14131)](https://github.com/sveltejs/svelte/discussions/14131) -- MEDIUM confidence
- [Svelte 5 Patterns: Shared State with Runes (fubits)](https://fubits.dev/notes/svelte-5-patterns-simple-shared-state-getcontext-tweened-stores-with-runes/) -- MEDIUM confidence
- [Migration: $$Props type issues (sveltejs/svelte #13471)](https://github.com/sveltejs/svelte/issues/13471) -- MEDIUM confidence
- Codebase analysis: direct grep of `apps/frontend/src/` for all legacy patterns -- HIGH confidence
