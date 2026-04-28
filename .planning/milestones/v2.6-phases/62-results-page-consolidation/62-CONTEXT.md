# Phase 62: Results Page Consolidation - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning
**Milestone:** v2.6 Svelte 5 Migration Cleanup

<domain>
## Phase Boundary

Fix the voter results-page infinite `$effect` loop, consolidate `EntityListControls` + `EntityList` into a single compound component, migrate the route shape to a 4-segment optional-param path (`/results/[electionId]/[[entityTypePlural]]/[[entityTypeSingular]]/[[id]]`) that supports both list-only and list+drawer rendering and cleanly handles the org-list-with-candidate-drawer edge case, re-enable filters in the results layout, and elevate filter state to a shared `filterContext` so a future LLM chat can read and mutate the voter's active filters.

Scope covers RESULTS-01, RESULTS-02, RESULTS-03. Success measured by:
- `EntityListControls.svelte` line 56 circular callback chain is gone; filtered list flows through `$derived` on reactive filter state.
- Filters are re-enabled and functional on `/results`; no infinite-loop symptoms when toggled.
- `/results/+page.svelte` is deleted; the new nested optional-param route handles list-only, list+drawer, and the org-list + candidate-drawer edge case via separate plural/singular entity-type segments.
- `entityTypePlural` in the URL drives the Tabs component; all selector changes (election / plural-tab / entity click) mutate the URL; drawer opens iff both singular + id segments are present.
- Filter state is exposed via a new `filterContext` bundled through `voterContext`; LLM chat will later consume the same context.

Out of scope for this phase: voter-app question flow (Phase 61), E2E carry-forward greening (Phase 63), `@openvaa/filters` internal refactor, shorter IDs in URLs, multi-election/constituency selection handling, extending URL-based election/constituency carrying to /questions or /elections, centralized overlay architecture (deferred from Phase 60), `fromStore()` bridge retirement.

</domain>

<decisions>
## Implementation Decisions

### Merge Strategy — `EntityListWithControls` Compound Component

- **D-01:** Introduce a new compound component `EntityListWithControls` that wraps the existing `EntityList` primitive. Search + filter controls render above; `EntityList` renders the list below. `EntityListControls.svelte` is deleted once the new component is wired in at every call site used by the results layout.
- **D-02:** `EntityList` stays unchanged as a primitive. `EntityListWithControls` is **additive** — no breaking change to existing `EntityList` consumers in other surfaces (candidate-app list views, etc.). **Follow-up todo (captured in `<deferred>` below):** sweep existing `EntityList` consumers across the app and migrate most-or-all of them to `EntityListWithControls` where controls are wanted.
- **D-03:** Fixed visual layout inside `EntityListWithControls` — search input + filter-modal trigger stacked above the list. Matches the current `EntityListControls` visual idiom. No snippet-based slotting in this phase; a future consumer requiring a custom controls layout can revisit.

### `$derived` Refactor — Loop Elimination + Global Filter State

- **D-04:** Replace the `$effect + filterGroup.onChange + updateFilters + filterGroup.apply` circular chain with a pure `$derived` computation. The `filterGroup.onChange(updateFilters)` callback registration (line 56) is **dropped entirely**. Filtered output is derived as `filteredEntities = $derived(filterGroup ? filterGroup.apply(entities) : [...entities])` (shape subject to planner refinement based on FilterGroup state reactivity). Same pattern applies to `searchFilter` on line 57.
- **D-05:** Filter state lives in a **dedicated `filterContext` module** at `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts`. The context is **bundled through `voterContext`** for ergonomic consumption (following the existing pattern where voterContext composes with app/data/component/i18n contexts). Two valid consumption paths: `getFilterContext()` directly (used by future LLM chat integration) and `getVoterContext()` with filter accessors on the return object (used by the voter flow UI).
- **D-06:** API shape of `filterContext` exposes a **direct `FilterGroup` reference + typed mutator methods**: `{ filterGroup: FilterGroup, setFilter(id, value), resetFilters(), addFilter(spec), removeFilter(id) }`. LLM chat and UI call the same mutators. Reads live state via `$derived` on `filterGroup.filters`. No new serialization layer; no dispatch/action indirection. Simple extension of existing FilterGroup shape; zero wrapping ceremony.
- **D-07:** **No changes to `@openvaa/filters`** in this phase. All global-state work is consumer-side, in `apps/frontend/src/lib/contexts/filter/`. Respects REQUIREMENTS.md §Out of Scope constraint (packages/filters/ refactor is a separate effort) and preserves the 165 intra-package-deps carry-forward.

### Route Collapse — Shared `[electionId]/[[entityTypePlural]]/[[entityTypeSingular]]/[[id]]`

- **D-08:** Route shape is `/results/[electionId]/[[entityTypePlural=entityPluralMatcher]]/[[entityTypeSingular=entitySingularMatcher]]/[[id]]`. `electionId` is required; all three entity segments are independently optional under SvelteKit's double-brackets. Four valid shapes:
  1. `/results/[electionId]` — list view, default plural (tab fallback)
  2. `/results/[electionId]/[entityTypePlural]` — list view with explicit plural tab
  3. `/results/[electionId]/[entityTypePlural]/[entityTypeSingular]/[id]` — list + drawer (matching entity types)
  4. `/results/[electionId]/organisations/candidate/[id]` — **edge case**: organisations list view with a candidate drawer (org card contains top-X candidates; clicking one opens a candidate drawer over the org list). This drove the decision to separate plural-list-mode from singular-drawer-entity. Same schema handles this cleanly without special-case routing.

  `entityTypeSingular` and `id` are always coupled — one cannot be present without the other. Planner adds a load-function guard: if either is present alone, redirect or 404.

- **D-09:** URL mutation rules in the browsing view — **all selector changes push the URL**:
  - Election change → path update
  - Plural-tab change → path update (different segment than election; doesn't change election)
  - Entity click → path update appending singular + id (drawer opens)
  - Drawer close → remove singular + id from path (back to list-only for current plural)
  - Drawer is shown **iff** both `entityTypeSingular` and `id` are present in the URL. No local-state drawer-open flag.

- **D-10:** On full-page-load to a detail URL (`/results/elec-X/organisations/candidate/123`), **prioritize drawer rendering over list rendering**. List renders in the background (asynchronous / lower priority) so the drawer content reaches first paint faster. This matters because users arriving via deeplink came to see that entity, not the list. Exact mechanism (SvelteKit streaming data / prioritized load function / CSS paint-order hint) is planner's discretion.

- **D-11:** Param matchers:
  - `src/params/entityTypePlural.ts` accepts `candidates | organisations`; other values → 404
  - `src/params/entityTypeSingular.ts` accepts `candidate | organisation`; other values → 404
  - Matches the existing `[[lang=locale]]` matcher pattern in the codebase.

- **D-12:** Phase 62 scope **includes** the full /results path refactor (D-08 + D-09 + D-10 + D-11). Does NOT include:
  - Shorter IDs in URLs (deferred todo; see `<deferred>`)
  - Multi-election/constituency selection handling for voters participating in multiple elections (deferred)
  - Extending URL-based election/constituency carrying to upstream voter routes (`/questions`, `/elections`) (deferred)

### Active Tab Wiring + Filter-State Persistence

- **D-13:** Tabs component is **URL-driven** — active tab is derived directly from `$page.params.entityTypePlural`. Tab click pushes the URL via SvelteKit navigation; URL is the single source of truth for active tab. No local `$state` for `activeTab`, no `$effect`-based sync. Browser Back/Forward naturally steps through tab selections.

- **D-14:** Filter state is scoped to the **(election, plural)** tuple. Switching elections **resets** filters (different candidate pool, different applicable filter IDs). Switching plural (candidates ↔ organisations) **resets** filters (different entity type, different filter schemas). The `filterContext` implements this scoping — internally keyed on `${electionId}:${entityTypePlural}`, cleared when either changes.

- **D-15:** Filter state **survives drawer open/close**. The drawer is a visual overlay, not a context change — same list pool underneath. Opening or closing the drawer does not alter filter state. This fixes the incidental bug where the current `+layout.svelte`'s re-render on drawer open lost filter state.

### Claude's Discretion

- Plan split within Phase 62 (one plan per RESULTS-NN vs one plan per concern). Planner decides. Starting suggestion: Plan 62-01 (`filterContext` scaffold + `EntityListWithControls` merge), Plan 62-02 (route refactor + param matchers), Plan 62-03 (URL wiring + drawer prioritization + filter scoping + re-enable filters).
- Exact shape of the drawer-prioritization mechanism for D-10 (streaming data vs paint-order vs load-function priority).
- Exact shape of `FilterGroup` reactivity wrapping at the consumer — whether to snapshot into `$state` locally or rely on wrapping the `filterGroup` instance in a reactive proxy. Planner picks based on how `FilterGroup.filters` mutation surfaces observationally.
- Fallback rendering for `/results/[electionId]` (no plural segment) — does the URL canonicalize to the default plural via a load-function redirect, or does the layout render with a default without URL change? Planner picks based on URL-sharing UX considerations.
- Exact i18n keys for the new Tabs labels if labels change (existing labels likely fine).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements

- `.planning/ROADMAP.md` §Phase 62 — Goal, Depends on, Requirements (RESULTS-01/02/03), Success Criteria 1-4 (SC-3 updated during this discussion to reflect the path-refactor scope)
- `.planning/REQUIREMENTS.md` §RESULTS — requirement text for RESULTS-01/02/03
- `.planning/todos/pending/entity-list-controls-infinite-loop.md` — original loop description, failed attempts (untrack, queueMicrotask), 5-step refactor intent

### Prior-Phase Patterns (read for pattern reuse)

- `.planning/phases/60-layout-runes-migration-hydration-fix/60-CONTEXT.md` D-01/D-03 — `$derived` for validation + dedicated `$effect` for side-effects (template for breaking the loop)
- `.planning/phases/60-layout-runes-migration-hydration-fix/60-RESEARCH.md` §Common Pitfalls — `effect_update_depth_exceeded` root cause; `get(store) + untrack(() => store.update(...))` fix pattern (apply if any FilterGroup mutation happens inside `$effect`)
- `apps/frontend/src/routes/+layout.svelte` — Phase 60 reference: `$derived.by()` validation + dedicated `$effect` for store writes
- `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` — Phase 60 reference: same pattern applied

### Target Files (Merge + Refactor)

- `apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte` — 161 lines; circular-chain site at lines 56-73; target of deletion after merge
- `apps/frontend/src/lib/dynamic-components/entityList/EntityList.svelte` — 119 lines; unchanged primitive
- `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte` — **new** compound component (D-01)
- `apps/frontend/src/lib/dynamic-components/entityList/index.ts` — barrel export; add EntityListWithControls
- `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` — **new** (D-05); follows the `lib/contexts/*/xxxContext.svelte.ts` pattern
- `apps/frontend/src/lib/contexts/filter/index.ts` — **new** barrel
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` — bundle filter context here (D-05)

### Target Files (Route Refactor)

- `apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/+layout.svelte` — 306 lines; migrate list rendering + drawer logic; Tabs URL-driven
- `apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/+page.svelte` — 8-line empty page; **delete**
- `apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/[entityType]/[entityId]/+page.svelte` — 121 lines; replace with the new optional-param shape
- `apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/+page.svelte` — **new** (shape TBD based on D-08's folder migration; planner decides optimal on-disk shape)
- `apps/frontend/src/params/entityTypePlural.ts` — **new** matcher (D-11)
- `apps/frontend/src/params/entityTypeSingular.ts` — **new** matcher (D-11)

### Target Files (FilterGroup + Filters)

- `packages/filters/` — **read-only** for this phase (D-07); FilterGroup API is consumed as-is
- `apps/frontend/src/lib/` — any existing FilterGroup instantiation sites (found via grep); migrate to use filterContext

### E2E Surfaces

- `tests/tests/specs/voter/voter-results.spec.ts` (or similar) — voter results E2E; extend for filter toggle + drawer + deeplink cases
- `tests/playwright.config.ts` — invoke via `yarn playwright test -c ./tests/playwright.config.ts <spec> --workers=1`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`TextPropertyFilter`** (used at EntityListControls.svelte:50-54) — already works as search; reuse in `EntityListWithControls` with same wiring but via `$derived`, not callback.
- **`FilterGroup.apply(entities)`** — pure function; no side effects on entities. Safe to call inside `$derived`.
- **`FilterGroup.filters`** array with `.active` flag — current source of `numActiveFilters` computation; still the right input for that derivation.
- **Existing `EntityDetailsDrawer` component** — already handles drawer rendering; reuse unchanged.
- **`AccordionSelect` / `Tabs` components** — used by results layout; reuse with URL-driven activation per D-13.
- **Existing `voterContext.svelte.ts`** — already composes with app/data/component/i18n contexts; bundle filterContext following the same pattern (D-05).
- **SvelteKit optional-bracket route syntax `[[param]]`** — stable feature; used elsewhere in the codebase (e.g., `[[lang=locale]]` in the voter root path).
- **Param matcher pattern** — existing `src/params/locale.ts` (or similar) serves as the template for the two new matchers (D-11).
- **`$derived` + dedicated `$effect` split pattern from Phase 60** — proven for reactive loop prevention.
- **`get(store) + untrack(() => store.update(...))` idiom** — Phase 60 Rule-1 fix; apply if any filter-state write inside `$effect` would trigger `effect_update_depth_exceeded`.

### Established Patterns

- **Context-per-concern composition:** Each `lib/contexts/<concern>/<concern>Context.svelte.ts` module exports `init<Concern>Context()` and `get<Concern>Context()`. Downstream contexts compose (voterContext uses getAppContext(), etc.). `filterContext` follows this pattern (D-05).
- **Typed route params via SvelteKit matchers:** `[[lang=locale]]` already uses a matcher. New matchers `entityTypePlural` and `entityTypeSingular` follow the same shape (D-11).
- **URL as single source of truth for routable state:** The codebase already uses `$page.params` for route-driven rendering. Extend to Tabs state (D-13).
- **Additive-not-breaking for library changes:** EntityListWithControls is additive (D-02); `@openvaa/filters` is untouched (D-07). Preserves downstream stability.

### Integration Points

- **`results/+layout.svelte`** is where controls, list, tabs, and drawer all compose. After the refactor, this file:
  - Reads `entityTypePlural` and (`entityTypeSingular`, `id`) from `$page.params`
  - Calls `getFilterContext()` (via voterContext or directly) to access filter state
  - Renders `EntityListWithControls` for the list + controls
  - Renders `EntityDetailsDrawer` iff both singular + id are present
- **`voterContext.svelte.ts`** re-exposes `filterContext` accessors so `getVoterContext()` consumers can reach filters without a separate `getFilterContext()` call.
- **`EntityListWithControls`** consumes the filter state — receives `FilterGroup` via `filterContext` (preferred) or as an optional prop (for off-context use in candidate-app if that migration happens in the follow-up todo).
- **Future LLM chat integration** will call `getFilterContext()` to read + mutate filters. No wiring work in this phase beyond exposing the context API (D-06).

</code_context>

<specifics>
## Specific Ideas

- **LLM chat as a future consumer of `filterContext`** is a motivating design driver (user direction 2026-04-24). Exposing filters as a shared, globally-accessible context rather than component-local state is specifically to support an eventual LLM chat that can both read voter-active filters and mutate them via the same typed mutators the UI uses. This justifies the extra ceremony of `filterContext` even though Phase 62 has only one UI consumer today.
- **Drawer rendering priority over list** on full-page-load (D-10) is a specific perceived-performance requirement (user direction). The user arriving at `/results/elec-X/organisations/candidate/123` came to see that candidate; the list is background context. Exact mechanism is planner's discretion but the commitment is observable UX.
- **Org-list with candidate-drawer edge case** (D-08 shape 4) is the reason the URL schema separates `entityTypePlural` from `entityTypeSingular`. A simpler `[[entityType]]/[[id]]` shape couldn't express it.
- **Filter scoping per (election, plural) tuple** (D-14) acknowledges that filter IDs may not be stable across elections or entity types. A filter like "party: Green Alliance" has no meaning in a different election's candidate pool; a filter like "gender" may not apply to organisations. Scoping prevents stale/inapplicable filters from leaking across selector changes.

</specifics>

<deferred>
## Deferred Ideas

- **Sweep existing `EntityList` consumers to adopt `EntityListWithControls`** where controls are wanted. Follow-up todo. D-02 preserves backward compatibility; Phase 62 does not force the migration.
- **Shorter IDs in URLs** — UUIDs are long; URL ergonomics and human-shareability would improve with slug-style short IDs (e.g., `elec-2026-01` instead of UUID). Requires an ID-mapping layer at the data provider. Part of the URL-refactor follow-up.
- **Multi-election / multi-constituency selection** handling for voters participating across elections or constituencies. Current model assumes a single (election, constituency) per voter session. Needs a concrete product decision + data-model work.
- **Extend URL-based election/constituency carrying to upstream voter routes** (`/questions`, `/elections`). Phase 62 migrates only `/results`. Full voter-flow URL consistency is a follow-up.
- **`@openvaa/filters` internal refactor** to expose `$state`-backed reactive filter state natively. D-07 keeps this out of Phase 62 scope; acknowledges it as valuable long-term.
- **Redux-style snapshot + dispatch API for LLM chat** (instead of direct FilterGroup ref + mutators per D-06). If the LLM chat tool-use pattern later reveals a mismatch with the direct-ref approach, revisit.
- **Snippet-based controls customization** for `EntityListWithControls`. D-03 locks fixed layout; if a future consumer needs different controls, revisit.
- **Centralized overlay architecture** — carried forward from Phase 60 deferred; unchanged.

### Reviewed Todos (not folded)

- `frontend-project-id-scoping.md` — architecture multi-tenant prep; related but out of v2.6 scope
- `session-storage-election-constituency.md` — partially addressed by D-08 (election now in URL for results), but broader session-storage question carries forward

</deferred>

---

*Phase: 62-results-page-consolidation*
*Context gathered: 2026-04-24*
