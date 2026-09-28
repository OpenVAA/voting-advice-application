# Phase 22: Leaf Component Migration - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate all shared, dynamic, voter-app, candidate-app, and admin leaf components to Svelte 5 runes mode. This includes converting `export let` to `$props()`, replacing `$$restProps`/`$$slots`/`$$Props` with runes equivalents, converting event forwarding to callback props, adding `$bindable()` for bound props, resolving `svelte:self`/`svelte:component` deprecations, and replacing event modifiers with inline JavaScript. All call sites across both voter and candidate apps are updated immediately to keep both apps compilable throughout.

Container components with named `<slot>` elements are Phase 23. Route-level migration is Phase 24.

</domain>

<decisions>
## Implementation Decisions

### Cross-app call site updates
- Update ALL call sites (voter + candidate + admin) immediately as each shared component is migrated
- Both apps must remain compilable throughout the migration — no temporary breakage accepted
- Candidate-only components (7 in lib/candidate/components/) are included in Phase 22 migration scope
- Any other candidate components that are rational to migrate alongside leaf work should also be included
- Admin components (4 in lib/admin/components/) are included in Phase 22 migration scope

### Runes mode activation
- Use per-component `<svelte:options runes />` in each migrated file — NOT global `runes: true`
- Global `compilerOptions.runes = true` switch deferred to Phase 26 (Validation Gate), after all components and routes are migrated
- This allows incremental migration across Phases 22–24 without breaking unmigrated files

### Props typing pattern
- Keep using existing ComponentProps type declarations (rename from `type $$Props` to a non-deprecated name)
- Destructure with: `let { prop1, prop2, ...restProps } = $props<ComponentProps>()`
- Match the existing pattern's level of type safety — minimal churn

### TODO[Svelte 5] markers
- Resolve markers that align with the migration work being done (snippet conversions, event refactors, etc.)
- Defer markers that require deeper redesign beyond syntax migration to Phase 25 Cleanup
- Keep existing `TODO[Svelte 5]` tag on deferred markers — no phase number re-tagging needed
- Phase 25 already defines its scope as resolving all remaining TODO[Svelte 5] markers

### Dynamic-components scope
- Leaf dynamic-components (no named slots) are in scope for Phase 22
- Dynamic-components with named slots go to Phase 23 (container migration)
- EntityCard (svelte:self recursion) and Navigation (sub-component tree) are flagged as high-attention items but get the same migration treatment as other leaf components

### Verification approach
- E2E tests verified at phase end, not per-component or per-batch
- All 92 E2E tests must pass after the full leaf component migration is complete
- Individual component migrations are low-risk syntax transforms — batch verification is acceptable

### Claude's Discretion
- Migration ordering within the phase (which components first)
- Exact `concatClass`/`concatProps` utility adaptation for rest props
- How to handle edge cases in event modifier replacement
- Compression algorithm for batching related component migrations

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Svelte 5 migration patterns
- `apps/frontend/svelte.config.js` — Current compiler config; per-component runes opt-in goes here
- Svelte 5 migration guide (external) — `$props()`, `$bindable()`, callback props, `<svelte:options runes />`

### Component inventory
- `apps/frontend/src/lib/components/` — 59 shared leaf components (primary migration target)
- `apps/frontend/src/lib/dynamic-components/` — 31 dynamic components (leaf ones in scope)
- `apps/frontend/src/lib/candidate/components/` — 7 candidate-only leaf components (in scope)
- `apps/frontend/src/lib/admin/components/` — 4 admin leaf components (in scope)

### Component documentation generation
- `apps/docs/` — Has automatic component documentation generation scripts that depend on component API shapes; migration must preserve enough structure for these scripts to be updated later

### Requirements
- `.planning/REQUIREMENTS.md` — COMP-01, COMP-02, COMP-03, COMP-06, COMP-07, COMP-08, COMP-09

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `concatClass()` and `concatProps()` utilities — Used in ~100 files for `$$restProps` spreading. Will need adaptation for `$props()` rest syntax
- `type $$Props` pattern — Consistent typing across all components. Rename to non-deprecated name during migration
- Existing `<svelte:options>` tag usage — Some components already have options tags; add `runes` to existing

### Established Patterns
- Nearly universal `export let` + `type $$Props` + `$$restProps` via `concatClass`/`concatProps` — all 100+ components follow this pattern
- Event forwarding via `on:click` etc. — 74+ occurrences across leaf components
- `bind:` directives in 43 files (bind:this, bind:value, bind:checked, bind:group, media bindings)

### Integration Points
- Shared components consumed by voter app routes (Phase 24 consumers)
- Shared components consumed by candidate app routes (call sites updated in Phase 22)
- Dynamic-components consumed via dynamic imports in route pages
- `apps/docs/` documentation generation scripts depend on component API shapes

### High-Attention Components
- `Input.svelte` — Largest/most complex leaf component, 2 TODO[Svelte 5] markers, complex state management
- `Video.svelte` — Multiple bind patterns, event modifiers (|once, |capture), media bindings
- `EntityCard.svelte` — Uses `svelte:self` for recursion (COMP-07), TODO[Svelte 5] marker
- `EntityTag.svelte` — Uses `svelte:self` (COMP-07)
- `Navigation` sub-component tree — Multiple related components to migrate together
- `Button.svelte` — Named "badge" slot (Phase 23) but event forwarding (Phase 22); leaf aspects migrated now

</code_context>

<specifics>
## Specific Ideas

- When migrating component APIs, ensure enough detail about API shape changes is preserved/documented so that the automatic component documentation generation scripts in the docs package can be updated later
- Candidate-only components should be migrated opportunistically — include any candidate components that make sense alongside the leaf migration work, not just the 7 in lib/candidate/components/

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 22-leaf-component-migration*
*Context gathered: 2026-03-18*
