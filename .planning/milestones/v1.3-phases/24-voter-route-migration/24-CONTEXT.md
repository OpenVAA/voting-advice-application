# Phase 24: Voter Route Migration - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

All voter route pages and layouts (`+page.svelte`, `+layout.svelte` under `(voters)/`) are migrated from Svelte 4 reactive patterns to Svelte 5 runes. This includes converting `$:` reactive statements to the correct rune (`$derived`, `$derived.by()`, `$effect`), replacing remaining `on:event` directives with native attributes, converting `<slot />` to `{@render children?.()}`, migrating `export let data` to `$props()`, and converting `$page` store to the `page()` rune.

Context stores (`$storeName` shorthand) remain unchanged — store-to-runes migration is a separate milestone.

</domain>

<decisions>
## Implementation Decisions

### Async data-loading pattern (ROUTE-04)
- The `(located)/+layout.svelte` `$:` block watching `data` is converted to `$effect` — NOT `$derived` (it has async side effects)
- `ready`, `error`, and `hasNominations` are converted to `$state()` since they drive conditional rendering
- The `awaitNominationsSettled` function and its store-based subscription pattern are kept as-is — the TODO[Svelte 5] stays for a future phase when stores are replaced with native reactivity
- Only the reactive trigger mechanism changes (`$:` → `$effect`), not the underlying async logic

### Rune selection for $: statements
- Single-expression derivations use `$derived()` — e.g. `$: canSubmit = selected?.length > 0` → `let canSubmit = $derived(selected?.length > 0)`
- Multi-statement `$:` blocks use `$derived.by(() => { ... })` for pure computations
- `$:` blocks with side effects (async calls, navigation, store mutations) use `$effect`
- Mixed blocks that combine derivation and side effects are split: pure derivation extracted to `$derived`, side effects isolated in `$effect`

### Route-level runes opt-in
- Every migrated voter route file gets `<svelte:options runes />` — consistent with Phase 22's per-component pattern
- This validates runes behavior immediately per-file, rather than deferring to Phase 26's global switch

### Props and page state
- `export let data` → `let { data } = $props()` in all route files
- `$page` store access converted to `page()` rune from `$app/state` (idiomatic Svelte 5, avoids compat layer)

### Store access pattern
- `$store` shorthand kept for all context stores (getVoterContext(), getAppContext(), etc.)
- `$store` syntax works correctly in Svelte 5 runes mode — no conversion needed
- Full store-to-runes migration is out of scope (separate milestone)

### Slot conversion (ROUTE-03)
- All 5 `<slot />` usages in voter route layouts → `{@render children?.()}` (consistent with Phase 23 convention)

### Cross-phase conventions carried forward
- Per-component `<svelte:options runes />` (Phase 22)
- `children` for default slot content (Phase 23)
- E2E test verification at phase end, not per-file (Phase 22)
- Both apps must remain compilable throughout (Phase 22)

### Claude's Discretion
- Migration ordering and plan batching across the 19 voter route files
- Exact cleanup of any redundant imports after migration
- How to handle edge cases in `$effect` cleanup/teardown

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Svelte 5 migration patterns
- `apps/frontend/svelte.config.js` — Compiler config; per-component runes opt-in
- Svelte 5 migration guide (external) — `$props()`, `$derived`, `$derived.by()`, `$effect`, `$state`, `{@render}` snippets

### SvelteKit runes
- SvelteKit `$app/state` module (external) — `page()` rune replacing `$page` store

### Voter route files (migration targets)
- `apps/frontend/src/routes/(voters)/(located)/+layout.svelte` — Async data-loading pattern (ROUTE-04), most complex migration
- `apps/frontend/src/routes/(voters)/elections/+page.svelte` — 2x `$:` (derivation + block)
- `apps/frontend/src/routes/(voters)/constituencies/+page.svelte` — 2x `$:` (block + derivation)
- `apps/frontend/src/routes/(voters)/(located)/results/+page.svelte` — 2x `$:` with conditional side effects
- `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte` — 1x `$:` block
- `apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte` — 1x `$:` block
- `apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte` — 1x `$:` derivation
- `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte` — 1x `$:` (progress.max.set)
- `apps/frontend/src/routes/(voters)/nominations/+layout.svelte` — 1x `$:` block
- `apps/frontend/src/routes/(voters)/(located)/results/[entityType]/[entityId]/+page.svelte` — 1x `$:` block

### Voter route layouts with <slot />
- `apps/frontend/src/routes/(voters)/+layout.svelte` — Root voter layout
- `apps/frontend/src/routes/(voters)/(located)/+layout.svelte` — Located section layout
- `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte` — Questions layout
- `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` — Results layout
- `apps/frontend/src/routes/(voters)/nominations/+layout.svelte` — Nominations layout

### Prior phase context
- `.planning/phases/22-leaf-component-migration/22-CONTEXT.md` — Runes patterns, props typing, verification approach
- `.planning/phases/23-container-components-and-layouts/23-CONTEXT.md` — Snippet conventions, callback naming, layout migration patterns

### Requirements
- `.planning/REQUIREMENTS.md` — ROUTE-01, ROUTE-02, ROUTE-03, ROUTE-04

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 22/23 established all runes patterns: `$props()`, `$state()`, `$derived()`, `$effect`, `{@render children?.()}`
- `concatClass()` utility already adapted for `...restProps` pattern
- Layout.svelte, MainContent.svelte already in runes mode from Phase 23

### Established Patterns
- Per-component `<svelte:options runes />` — consistent across 100+ components
- Callback props: native events lowercase (`onclick`), custom callbacks camelCase (`onExpand`)
- `children` for default slot content
- `$bindable()` for bound props
- Store access via `$store` shorthand (no conversion)

### Integration Points
- Voter route files consume migrated components from Phase 22/23 (already in runes mode)
- Route layouts pass snippet content to Layout.svelte and MainContent.svelte (already snippet-based from Phase 23)
- Context stores (getVoterContext) used extensively — `$store` shorthand preserved
- `data` prop from SvelteKit load functions in +page.svelte and +layout.svelte files

### Migration Scope
- 19 total voter route files (10 with `$:` statements, 5 with `<slot />`, all need `export let data` → `$props()`)
- 13 `$:` reactive statements to convert
- 0 remaining `on:event` directives (already handled in Phase 23)

</code_context>

<specifics>
## Specific Ideas

- When converting the `(located)/+layout.svelte`, group `ready`, `error`, and `hasNominations` together as `$state()` variables
- The `awaitNominationsSettled` TODO[Svelte 5] marker stays — it's explicitly deferred until store-to-runes migration
- `$page` → `page()` conversion should be done across all voter routes that use it, not just the ones with `$:` statements

</specifics>

<deferred>
## Deferred Ideas

- **Layout → +layout conversion** (from Phase 23): Converting Layout.svelte, MainContent.svelte into proper `+layout` files using Svelte 5 snippets
- **Store-to-runes migration**: Replacing context stores with native Svelte 5 reactivity (separate milestone)
- **awaitNominationsSettled rewrite**: Rewriting with `$derived`/`$effect` once stores are replaced

</deferred>

---

*Phase: 24-voter-route-migration*
*Context gathered: 2026-03-19*
