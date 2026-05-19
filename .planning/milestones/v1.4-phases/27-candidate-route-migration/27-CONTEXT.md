# Phase 27: Candidate Route Migration - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

All 25 candidate app route files (`+page.svelte`, `+layout.svelte` under `candidate/`) are migrated from Svelte 4 reactive patterns to Svelte 5 runes. This includes converting `$:` reactive statements to the correct rune (`$derived`, `$derived.by()`, `$effect`), replacing `on:event` directives with native attributes, converting standalone `onMount` to `$effect`, converting standalone `onDestroy` to `$effect` cleanup, migrating `$page` store to the `page()` rune, and adding `<svelte:options runes />` to each file.

Context stores (`$storeName` shorthand) and `getLayoutContext(onDestroy)` calls remain unchanged — store-to-runes migration and context system rewrite are separate milestones.

</domain>

<decisions>
## Implementation Decisions

### Lifecycle + Context pattern
- **D-01:** `getLayoutContext(onDestroy)` calls (13 files) are kept as-is — the `onDestroy` import stays for these files. Converting would require changing the context API signature, which is deferred scope.
- **D-02:** Standalone `onMount` (6 files — login focus, OIDC redirect, popup queue) converted to `$effect`. These are simple init-once effects not tied to the context system.
- **D-03:** Standalone `onDestroy` calls (not `getLayoutContext`) converted to `$effect` with cleanup return. Only `getLayoutContext(onDestroy)` calls keep the `onDestroy` import.

### Rune selection for $: statements (carries forward from Phase 24)
- **D-04:** Single-expression derivations → `$derived()` (e.g., `canSubmit`, `cancelLabel`, `nominations`, `allRequiredFilled`)
- **D-05:** Multi-statement if/else chains that derive multiple values → `$derived.by(() => { ... return { submitRoute, submitLabel } })` (e.g., profile and [questionId] submit routing blocks)
- **D-06:** `$:` blocks with side effects (async calls, navigation, state mutation) → `$effect`

### Mixed block splitting
- **D-07:** The [questionId]/+page.svelte big `$:` block (line 73) is split: question/customData/nextQuestionId extraction → `$derived.by()`, video.load() and status mutation → separate `$effect` watching the derived values. Clean derivation/effect separation.

### Auth flow side effects
- **D-08:** OIDC callback `$:` block (authorizationCode extraction + exchangeCodeForIdToken/goto) → single `$effect`. The whole block is a side effect watching URL params.
- **D-09:** Register page `$:` block watching registrationKey to set changedAfterCheck → `$effect`. Side effect of input changes.
- **D-10:** (protected)/+layout.svelte async Promise.all data-loading block → `$effect` (NOT `$derived`), with `$state()` for ready/error. Same pattern as Phase 24's (located)/+layout.svelte. Infinite-loop guard function stays.

### Event directives (carries forward from Phase 22/23)
- **D-11:** `on:click` → `onclick`, `on:submit|preventDefault` → `onsubmit` with `e.preventDefault()` in handler. Only 2 instances remain across all candidate routes.

### Route-level conventions (carries forward from Phase 24)
- **D-12:** Every migrated candidate route file gets `<svelte:options runes />`
- **D-13:** `export let data` → `let { data } = $props()` in all route files
- **D-14:** `$page` store → `page()` rune from `$app/state`
- **D-15:** `$store` shorthand kept for all context stores (getCandidateContext(), etc.)
- **D-16:** `<slot />` → `{@render children?.()}` in layout files

### Claude's Discretion
- Migration ordering and plan batching across the 25 candidate route files
- Exact cleanup of redundant imports after migration
- How to handle edge cases in `$effect` cleanup/teardown
- Whether to batch by route group (auth, protected, preregister) or by complexity

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Svelte 5 migration patterns
- `apps/frontend/svelte.config.js` — Compiler config; per-component runes opt-in
- Svelte 5 migration guide (external) — `$props()`, `$derived`, `$derived.by()`, `$effect`, `$state`, `{@render}` snippets

### SvelteKit runes
- SvelteKit `$app/state` module (external) — `page()` rune replacing `$page` store

### Candidate route files (migration targets — 25 files)
- `apps/frontend/src/routes/candidate/+layout.svelte` — Root layout, `getLayoutContext(onDestroy)`, `onMount`
- `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` — Async data-loading pattern (D-10), most complex layout
- `apps/frontend/src/routes/candidate/(protected)/+page.svelte` — 3x `$:` (data init block)
- `apps/frontend/src/routes/candidate/(protected)/preview/+page.svelte` — 1x `$:`, `onDestroy`
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte` — 6x `$:` (D-05, D-06), high complexity
- `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte` — 7x `$:` (D-07), highest complexity
- `apps/frontend/src/routes/candidate/(protected)/questions/+layout.svelte` — 2x `$:`, redirect + progress
- `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte` — 1x `$:`
- `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte` — 2x `$:`, password validation
- `apps/frontend/src/routes/candidate/forgot-password/+page.svelte` — `on:submit|preventDefault` (D-11)
- `apps/frontend/src/routes/candidate/help/+page.svelte` — Minimal, no `$:`
- `apps/frontend/src/routes/candidate/login/+page.svelte` — 3x `$:`, `on:click` (D-11), `onMount`
- `apps/frontend/src/routes/candidate/password-reset/+page.svelte` — 1x `$:`
- `apps/frontend/src/routes/candidate/privacy/+page.svelte` — Minimal, no `$:`
- `apps/frontend/src/routes/candidate/preregister/+layout.svelte` — `getLayoutContext(onDestroy)`
- `apps/frontend/src/routes/candidate/preregister/+page.svelte` — `onMount`, OIDC flow
- `apps/frontend/src/routes/candidate/preregister/(authenticated)/+layout.svelte` — `getLayoutContext(onDestroy)`
- `apps/frontend/src/routes/candidate/preregister/(authenticated)/constituencies/+page.svelte` — No `$:`
- `apps/frontend/src/routes/candidate/preregister/(authenticated)/elections/+page.svelte` — No `$:`
- `apps/frontend/src/routes/candidate/preregister/(authenticated)/email/+page.svelte` — No `$:`
- `apps/frontend/src/routes/candidate/preregister/signicat/oidc/callback/+page.svelte` — OIDC callback (D-08)
- `apps/frontend/src/routes/candidate/preregister/status/+page.svelte` — 1x `$:`
- `apps/frontend/src/routes/candidate/register/+layout.svelte` — `getLayoutContext(onDestroy)`
- `apps/frontend/src/routes/candidate/register/+page.svelte` — 2x `$:` (D-09)
- `apps/frontend/src/routes/candidate/register/password/+page.svelte` — 1x `$:`

### Context system (DO NOT modify)
- `apps/frontend/src/lib/contexts/layout/layoutContext.ts` — `getLayoutContext(onDestroy)` API; cleanup reverts page styles/navigation on unmount

### Prior phase context
- `.planning/milestones/v1.3-phases/22-leaf-component-migration/22-CONTEXT.md` — Runes patterns, props typing, verification approach
- `.planning/milestones/v1.3-phases/23-container-components-and-layouts/23-CONTEXT.md` — Snippet conventions, callback naming, layout migration patterns
- `.planning/milestones/v1.3-phases/24-voter-route-migration/24-CONTEXT.md` — Route-level rune selection rules, async data-loading pattern, store access

### Requirements
- `.planning/REQUIREMENTS.md` — ROUTE-01, ROUTE-02, ROUTE-03, ROUTE-04, EVNT-01, EVNT-02, LIFE-01

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 22/23/24 established all runes patterns: `$props()`, `$state()`, `$derived()`, `$derived.by()`, `$effect`, `{@render children?.()}`
- `concatClass()` utility already adapted for `...restProps` pattern
- Voter route migrations provide direct 1:1 pattern references for candidate routes

### Established Patterns
- Per-component `<svelte:options runes />` — consistent across 100+ components and 19 voter routes
- Callback props: native events lowercase (`onclick`), custom callbacks camelCase
- `children` for default slot content
- `$store` shorthand for context stores (no conversion)
- `page()` rune from `$app/state` replacing `$page` store
- Async data-loading: `$effect` + `$state()` for ready/error (Phase 24 pattern)

### Integration Points
- Candidate route files consume migrated components from Phase 22/23 (already in runes mode)
- Context stores (getCandidateContext, getLayoutContext) used extensively — `$store` shorthand preserved
- `getLayoutContext(onDestroy)` pattern in 13 files — onDestroy import kept for these
- `data` prop from SvelteKit load functions in +page.svelte and +layout.svelte files

### Migration Scope
- 25 total candidate route files (6 layouts + 19 pages)
- 34 `$:` reactive statements to convert
- 2 `on:event` directives to convert
- 6 `onMount` → `$effect` conversions
- 13 `getLayoutContext(onDestroy)` calls kept as-is
- Standalone `onDestroy` calls converted to `$effect` cleanup

</code_context>

<specifics>
## Specific Ideas

- The (protected)/+layout.svelte async pattern should mirror Phase 24's (located)/+layout.svelte exactly — same `$effect` + `$state()` approach, same infinite-loop guard pattern
- [questionId]/+page.svelte big block must be split: derivation extracted to `$derived.by()`, video.load() side effect in separate `$effect`
- Profile and [questionId] submit routing if/else chains → `$derived.by()` returning `{ submitRoute, submitLabel }` object

</specifics>

<deferred>
## Deferred Ideas

- **Context system rewrite** — Replacing `getLayoutContext(onDestroy)` with native Svelte 5 reactivity (separate milestone, CTX-01/02/03)
- **Store-to-runes migration** — Replacing context store `$store` shorthand with `$derived`/`$state` (separate milestone)
- **Layout → +layout conversion** — Converting Layout.svelte, MainContent.svelte into proper `+layout` files (carried from Phase 24)

</deferred>

---

*Phase: 27-candidate-route-migration*
*Context gathered: 2026-03-21*
