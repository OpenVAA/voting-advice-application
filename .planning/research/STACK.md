# Technology Stack: Svelte 5 Content Migration (Voter App)

**Project:** OpenVAA v1.3 -- Svelte 5 Content Migration
**Researched:** 2026-03-18

## Stack Baseline (Already In Place -- DO NOT Change)

These were validated in v1.2. No version bumps or additions needed for content migration.

| Technology | Version | Status |
|------------|---------|--------|
| Svelte | ^5.53.12 | Installed, catalog-managed |
| SvelteKit | ^2.55.0 | Installed, catalog-managed |
| @sveltejs/vite-plugin-svelte | ^5.1.1 | Installed |
| Tailwind CSS 4 | ^4.2.1 | Installed, catalog-managed |
| DaisyUI 5 | ^5.5.14 | Installed, catalog-managed |
| Paraglide JS | ^2.15.0 | Installed (replaced sveltekit-i18n in v1.2) |
| Node.js | 22 | Engine requirement |
| Yarn | 4.13 | Package manager |
| Turborepo | 2.8 | Build orchestration |
| Vite | ^6.4.1 | Build tool |
| Vitest | ^3.2.4 | Unit tests |
| Playwright | ^1.58.2 | E2E tests (92 tests, regression gate) |
| svelte-check | ^4.4.5 | Type checking |

## Migration Tooling

### Primary: `sv migrate` CLI

| Tool | Command | Purpose | Confidence |
|------|---------|---------|------------|
| `sv migrate svelte-5` | `npx sv migrate svelte-5` | Automated Svelte 4 to Svelte 5 syntax transforms | HIGH |
| `sv migrate app-state` | `npx sv migrate app-state` | Convert `$app/stores` to `$app/state` in .svelte files | HIGH |

**What `sv migrate svelte-5` automates:**
- `let x = 0` to `let x = $state(0)` (reactive top-level variables)
- `export let prop` to `let { prop } = $props()` with destructuring
- `$:` reactive declarations to `$derived()` or `$effect()` (heuristic-based)
- `on:click` to `onclick` (DOM event attributes)
- `<slot />` to `{@render children?.()}` with `children` prop
- `<div slot="name">` to `{#snippet name()}<div>...</div>{/snippet}`
- Named slots to snippet props

**What `sv migrate svelte-5` does NOT automate (manual work required):**
- `createEventDispatcher` to callback props -- too risky to auto-convert because it changes the component's public API
- `beforeUpdate`/`afterUpdate` to `$effect.pre`/`$effect` -- intent cannot be reliably determined
- Complex `$:` blocks with mixed derivation+effects -- may produce `run()` from `svelte/legacy` as a stopgap
- Store-based context patterns to runes-based patterns -- no automated path exists
- `$app/stores` usage in `.ts` files -- `sv migrate app-state` only handles `.svelte` files

**Important:** The migration script inserts `@migration` comment annotations in places needing manual review. Search for these after running.

### Secondary: VS Code Extension

The Svelte VS Code extension offers a "Migrate Component to Svelte 5 Syntax" command palette action for per-component migration. Useful for incremental work but not needed if running `sv migrate svelte-5` on the full project.

### NOT Needed -- No External Migration Libraries

Do NOT add any migration helper libraries. The migration is a one-time code transformation, not an ongoing runtime dependency. Svelte's built-in compatibility layer handles mixed old/new syntax during the transition.

## Key API Changes for Content Migration

### Runes (replace implicit reactivity)

| Old Pattern | New Pattern | Files Affected | Notes |
|-------------|-------------|----------------|-------|
| `let x = 0` (reactive) | `let x = $state(0)` | All .svelte components | Only top-level variables that are read in templates |
| `export let prop` | `let { prop } = $props()` | All components with props | Destructured; rest props via `...rest` |
| `export let prop = default` | `let { prop = default } = $props()` | Components with defaults | Same syntax |
| `$: derived = expr` | `let derived = $derived(expr)` | ~52 occurrences across 30 files | Pure derivations only |
| `$: { sideEffect() }` | `$effect(() => { sideEffect() })` | ~52 occurrences across 30 files | Side effects, DOM reads |
| `$: if (cond) { ... }` | `$effect(() => { if (cond) { ... } })` | Mixed in above count | Conditional effects |
| `$$restProps` | `let { ...rest } = $props()` | Components forwarding attrs | Use spread: `{...rest}` |
| `$$props` | `let { ...allProps } = $props()` | Rare | Avoid; prefer named props |

### Event Handlers (replace directive syntax)

| Old Pattern | New Pattern | Files Affected |
|-------------|-------------|----------------|
| `on:click={handler}` | `onclick={handler}` | ~46 occurrences across 30 files |
| `on:click\|preventDefault` | `onclick={e => { e.preventDefault(); handler(e) }}` | Check each usage |
| `on:click\|stopPropagation` | `onclick={e => { e.stopPropagation(); handler(e) }}` | Check each usage |
| `createEventDispatcher()` | Callback props: `let { onclick } = $props()` | 6 files, 12 occurrences |
| `dispatch('eventName', data)` | `oneventname?.(data)` | 6 files |

### Slots to Snippets

| Old Pattern | New Pattern | Files Affected |
|-------------|-------------|----------------|
| `<slot />` | `let { children } = $props(); {@render children?.()}` | 41 files with `<slot` |
| `<slot name="x" />` | `let { x } = $props(); {@render x?.()}` | Named slots in ~15 files |
| `<slot let:data>` | Snippet with params: `{#snippet item(data)}...{/snippet}` | EntityCard and others |
| `<Component><div slot="x">` | `<Component>{#snippet x()}<div>...</div>{/snippet}</Component>` | Consumer side |

### Lifecycle Hooks

| Old Pattern | New Pattern | Status | Files |
|-------------|-------------|--------|-------|
| `onMount(() => {})` | `onMount(() => {})` | **NOT deprecated** -- keep as-is | ~30 files |
| `onDestroy(() => {})` | Return cleanup from `$effect` | Migrate where it pairs with `$effect` | ~30 files |
| `beforeUpdate(() => {})` | `$effect.pre(() => {})` | **Deprecated** -- must migrate | Check usage |
| `afterUpdate(() => {})` | `$effect(() => {})` | **Deprecated** -- must migrate | Check usage |

**Important nuance:** `onMount` and `onDestroy` are NOT deprecated in Svelte 5. They remain valid and recommended for component lifecycle. Only `beforeUpdate` and `afterUpdate` are deprecated. Do not blindly convert all `onMount` to `$effect`.

### SvelteKit `$app/stores` to `$app/state`

| Old Pattern | New Pattern | Files Affected |
|-------------|-------------|----------------|
| `import { page } from '$app/stores'` | `import { page } from '$app/state'` | 21 files |
| `$page.data` | `page.data` | 21 files (remove `$` prefix) |
| `import { updated } from '$app/stores'` | `import { updated } from '$app/state'` | 1 file |

`$app/stores` is deprecated and will be removed in SvelteKit 3. The `sv migrate app-state` command handles `.svelte` files automatically, but **2 `.ts` context files** (`paramStore.ts`, `authContext.ts`) and **1 utility** (`pageDatumStore.ts`) import from `$app/stores` and must be migrated manually.

### Context API

| Old Pattern | New Pattern | When |
|-------------|-------------|------|
| `setContext(SYMBOL, value)` | `setContext(SYMBOL, value)` | **No change needed** -- same API |
| `getContext<T>(SYMBOL)` | `getContext<T>(SYMBOL)` | **No change needed** |
| Store-valued contexts | `$state`-valued contexts | Aspirational, deferred (see below) |

**`createContext<T>()`** -- available since Svelte 5.40 (project has 5.53.12) -- provides typed context without manual key management. Returns `[get, set]` tuple. Evaluate for adoption during migration but do NOT treat as a blocker.

## Store-to-Runes Strategy

This is the hardest part of the migration. The codebase has 22 files importing from `svelte/store`, 9 context modules using `setContext`/`getContext`, and deep store chains (`parsimoniusDerived`, `stackedStore`, `paramStore`, etc.).

### What NOT to do

Do NOT attempt a big-bang store-to-runes rewrite of context modules. The store-based architecture is deeply interconnected:

```
dataContext (alwaysNotifyStore) --> appContext (writable, pageDatumStore)
    --> voterContext (parsimoniusDerived chains, paramStore, sessionStorageWritable)
        --> ~15 voter route components subscribing via $storeName
```

### Recommended Strategy: Incremental, Inside-Out

**Phase 1 -- Components (automated):** Run `sv migrate svelte-5` on all `.svelte` files. This converts `$:`, `on:`, `<slot>`, `export let` to runes. Store subscriptions via `$storeName` auto-syntax continue to work because Svelte 5's store compatibility layer handles them.

**Phase 2 -- `$app/stores` to `$app/state`:** Run `sv migrate app-state`. Manually fix the 3 `.ts` utility files that import `$app/stores`.

**Phase 3 -- Event dispatchers:** Manually convert 6 files using `createEventDispatcher` to callback props.

**Phase 4 -- Context store internals (aspirational):** Convert `alwaysNotifyStore` in `dataContext.ts` to use `$state` directly. This eliminates the core workaround documented in the TODO. Requires `.svelte.ts` file extension for runes support in non-component files.

### Stores Are NOT Deprecated

`svelte/store` (writable, readable, derived, get) is explicitly **not deprecated** in Svelte 5. The Svelte team has confirmed stores are not going away. They remain valid for:
- Cross-component shared state
- Integration with imperative APIs (like DataRoot's `onUpdate` callback)
- Load function return values
- Anywhere runes cannot be used (plain `.ts` files without `.svelte.ts` extension)

Stores and runes can coexist. The `$storeName` auto-subscription syntax works in runes-mode components. Do not force-migrate stores where they work correctly.

### When to Use .svelte.ts Files

Runes (`$state`, `$derived`, `$effect`) only work in `.svelte` and `.svelte.ts`/`.svelte.js` files. To use runes in utility/context modules:
- Rename `foo.ts` to `foo.svelte.ts`
- The Svelte compiler will then process these files for runes support

**Caution with .svelte.ts for shared state:** In SSR contexts, module-level `$state()` in `.svelte.ts` files creates shared state between requests. Always use `setContext` to scope state per-request, not module-level exports. Context-based patterns (which this codebase already uses) are SSR-safe.

## Packages to Add

**None.** The content migration requires zero new dependencies. All tooling is already in the Svelte ecosystem:
- `sv migrate` ships with `svelte` (via `svelte-migrate` package, invoked through `npx sv migrate`)
- Runes, snippets, and `$app/state` are built into the installed Svelte 5.53.12 and SvelteKit 2.55.0

## Packages to Remove (During Migration)

| Package | When | Reason |
|---------|------|--------|
| None during v1.3 | -- | All removals were handled in v1.2 infrastructure phase |

## Packages to Evaluate for Future Removal (Post-Migration)

| Package | Question | When |
|---------|----------|------|
| `svelte-visibility-change@^0.6.0` | Svelte 5 compatible? Still needed? | During v1.3 if voter app uses it |

## Anti-Recommendations: What NOT to Add

| Package/Tool | Why NOT |
|-------------|---------|
| `svelte-migrate` (direct install) | Invoked via `npx sv migrate`; no need to install |
| `svelte-5-ui-lib` or similar | Migration is about idiom conversion, not adding UI libraries |
| Store-replacement libraries | Runes ARE the replacement; no wrapper needed |
| `@sveltejs/svelte-scma` or codemods | `sv migrate` IS the official codemod |
| State management libraries (zustand, jotai, etc.) | Svelte 5 runes handle all state management natively |
| `.svelte.ts` for all files | Only rename when actually using runes in that file |

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| sv migrate capabilities | HIGH | Official Svelte docs, verified against installed version |
| Runes API patterns | HIGH | Official docs, multiple verified sources |
| Store compatibility status | HIGH | Svelte team statements, official migration guide |
| createContext availability | HIGH | Svelte 5.40+ feature, project has 5.53.12 |
| $app/state migration | HIGH | SvelteKit official docs, automated tool exists |
| Store-to-runes conversion strategy | MEDIUM | Pattern is documented but no official automated tool; project-specific complexity with DataRoot |
| createEventDispatcher migration | HIGH | Official docs; 6 files clearly identified |

## Sources

- [Svelte 5 migration guide](https://svelte.dev/docs/svelte/v5-migration-guide) -- comprehensive runes/snippets/events migration patterns
- [sv migrate CLI docs](https://svelte.dev/docs/cli/sv-migrate) -- available migrations and automated transforms
- [$app/state docs](https://svelte.dev/docs/kit/$app-state) -- SvelteKit page/navigating/updated state objects
- [Svelte 5 context API](https://svelte.dev/docs/svelte/context) -- createContext, setContext, getContext patterns
- [Svelte lifecycle hooks](https://svelte.dev/docs/svelte/lifecycle-hooks) -- onMount/onDestroy NOT deprecated, beforeUpdate/afterUpdate deprecated
- [Refactoring Svelte stores to $state runes (Loopwerk)](https://www.loopwerk.io/articles/2025/svelte-5-stores/) -- writable store limitations with $state
- [Global state in Svelte 5 (Mainmatter)](https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/) -- SSR safety, context vs module state
- [$app/stores deprecation](https://svelte.dev/docs/kit/$app-stores) -- deprecated, subject to removal in SvelteKit 3
- [Svelte legacy overview](https://svelte.dev/docs/svelte/legacy-overview) -- deprecated vs supported features
- [Snippet docs](https://svelte.dev/docs/svelte/snippet) -- snippet syntax and patterns
