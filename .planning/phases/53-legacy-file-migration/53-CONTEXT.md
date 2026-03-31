# Phase 53: Legacy File Migration - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate the 16 remaining non-runes .svelte files to Svelte 5 runes syntax. This includes the root +layout.svelte (highest risk — initializes all contexts, handles data loading), Header, Banner, MaintenancePage, +error, 8 admin routes, 2 admin layouts, and a preview utility. After this phase, every .svelte file in the codebase is runes-compatible.

</domain>

<decisions>
## Implementation Decisions

### D-01: Root +layout.svelte — full runes rewrite in one pass
Convert all legacy patterns at once: `export let data` → `$props()`, `$:` → `$derived`/`$effect`, `<slot>` → `{@render children()}`, `$store` → direct access (context APIs already $state-based from Phases 50-52). No incremental approach — do it all in one commit.

### D-02: <svelte:component> → direct component render
Replace `<svelte:component this={Module.default}>` with direct rendering `<Module.default>` inside `{#await}` blocks. This is idiomatic Svelte 5 and eliminates the deprecated `<svelte:component>` tag.

### D-03: Admin routes — mechanical bulk migration
All 8 admin route files + 2 admin layouts follow the same pattern (`export let data`, `$:` blocks). Apply identical runes conversion mechanically. No special handling needed.

### Claude's Discretion
- Root layout's `$effect` structure for the Promise.all data loading pattern
- How to handle `on:hidden` event on VisibilityChange component (Svelte 5 callback prop or `onhidden` event)
- Header, Banner, MaintenancePage, +error specific conversion details
- PreviewColorContrast.svelte migration approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files to migrate (16 total)
- `apps/frontend/src/routes/+layout.svelte` — Root layout (176 lines, highest risk)
- `apps/frontend/src/routes/Header.svelte` — Shared header component
- `apps/frontend/src/routes/Banner.svelte` — Banner component
- `apps/frontend/src/routes/MaintenancePage.svelte` — Maintenance page
- `apps/frontend/src/routes/+error.svelte` — Error page
- `apps/frontend/src/routes/admin/+layout.svelte` — Admin layout
- `apps/frontend/src/routes/admin/login/+page.svelte` — Admin login
- `apps/frontend/src/routes/admin/(protected)/+layout.svelte` — Protected admin layout
- `apps/frontend/src/routes/admin/(protected)/+page.svelte` — Admin dashboard
- `apps/frontend/src/routes/admin/(protected)/argument-condensation/+layout.svelte`
- `apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.svelte`
- `apps/frontend/src/routes/admin/(protected)/question-info/+layout.svelte`
- `apps/frontend/src/routes/admin/(protected)/question-info/+page.svelte`
- `apps/frontend/src/routes/admin/(protected)/jobs/+layout.svelte`
- `apps/frontend/src/routes/admin/(protected)/jobs/+page.svelte`
- `apps/frontend/src/lib/utils/color/PreviewColorContrast.svelte` — Utility preview

### Prior phase artifacts
- `.planning/phases/50-leaf-context-rewrite/50-CONTEXT.md` — Context API decisions
- `.planning/phases/51-mid-level-context-rewrite/51-CONTEXT.md` — DataRoot version counter
- `.planning/phases/52-app-context-rewrite/52-CONTEXT.md` — Final context patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Key Patterns in Root Layout
- `export let data: LayoutData` — standard SvelteKit layout data prop
- `$:` blocks for reactive data loading with Promise.all
- `$dataRoot.update()` for providing election/constituency data
- `$sendTrackingEvent`, `$openFeedbackModal`, `$appSettings` store subscriptions
- `<slot />` for child route rendering
- `<svelte:component>` for dynamic imports (UmamiAnalytics, VisibilityChange)
- `on:hidden` event handler on VisibilityChange

### Post-Context-Rewrite State
After Phases 50-52, all context values are `$state`-based. Root layout consumers will access them directly (no `$` prefix). The `$:` blocks that depend on context stores will become `$effect` or `$derived`.

### Admin Route Pattern
All admin routes follow: `export let data: PageData` + `$:` reactive blocks + standard template. Mechanical conversion to `$props()` + `$derived`/`$effect`.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 53-legacy-file-migration*
*Context gathered: 2026-03-28*
