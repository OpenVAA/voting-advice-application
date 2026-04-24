# Phase 62: Results Page Consolidation - Research

**Researched:** 2026-04-24
**Domain:** SvelteKit 2 + Svelte 5 runes — consumer-side component merge, route refactor with optional param matchers, shared-context filter state, URL-driven Tabs, $derived-based reactivity refactor to eliminate circular $effect/onChange chain
**Confidence:** HIGH (codebase + CONTEXT.md + Svelte 5 docs) / MEDIUM (FilterGroup + $derived interaction — requires planner-level wrapping decision)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Merge Strategy — `EntityListWithControls` Compound Component**

- **D-01:** Introduce a new compound component `EntityListWithControls` that wraps the existing `EntityList` primitive. Search + filter controls render above; `EntityList` renders the list below. `EntityListControls.svelte` is deleted once the new component is wired in at every call site used by the results layout.
- **D-02:** `EntityList` stays unchanged as a primitive. `EntityListWithControls` is **additive** — no breaking change to existing `EntityList` consumers in other surfaces (candidate-app list views, etc.). **Follow-up todo (captured in Deferred):** sweep existing `EntityList` consumers across the app and migrate most-or-all of them to `EntityListWithControls` where controls are wanted.
- **D-03:** Fixed visual layout inside `EntityListWithControls` — search input + filter-modal trigger stacked above the list. Matches the current `EntityListControls` visual idiom. No snippet-based slotting in this phase; a future consumer requiring a custom controls layout can revisit.

**`$derived` Refactor — Loop Elimination + Global Filter State**

- **D-04:** Replace the `$effect + filterGroup.onChange + updateFilters + filterGroup.apply` circular chain with a pure `$derived` computation. The `filterGroup.onChange(updateFilters)` callback registration (line 56) is **dropped entirely**. Filtered output is derived as `filteredEntities = $derived(filterGroup ? filterGroup.apply(entities) : [...entities])` (shape subject to planner refinement based on FilterGroup state reactivity). Same pattern applies to `searchFilter` on line 57.
- **D-05:** Filter state lives in a **dedicated `filterContext` module** at `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts`. The context is **bundled through `voterContext`** for ergonomic consumption (following the existing pattern where voterContext composes with app/data/component/i18n contexts). Two valid consumption paths: `getFilterContext()` directly (used by future LLM chat integration) and `getVoterContext()` with filter accessors on the return object (used by the voter flow UI).
- **D-06:** API shape of `filterContext` exposes a **direct `FilterGroup` reference + typed mutator methods**: `{ filterGroup: FilterGroup, setFilter(id, value), resetFilters(), addFilter(spec), removeFilter(id) }`. LLM chat and UI call the same mutators. Reads live state via `$derived` on `filterGroup.filters`. No new serialization layer; no dispatch/action indirection. Simple extension of existing FilterGroup shape; zero wrapping ceremony.
- **D-07:** **No changes to `@openvaa/filters`** in this phase. All global-state work is consumer-side, in `apps/frontend/src/lib/contexts/filter/`. Respects REQUIREMENTS.md §Out of Scope constraint (packages/filters/ refactor is a separate effort) and preserves the 165 intra-package-deps carry-forward.

**Route Collapse — Shared `[electionId]/[[entityTypePlural]]/[[entityTypeSingular]]/[[id]]`**

- **D-08:** Route shape is `/results/[electionId]/[[entityTypePlural=entityPluralMatcher]]/[[entityTypeSingular=entitySingularMatcher]]/[[id]]`. `electionId` is required; all three entity segments are independently optional under SvelteKit's double-brackets. Four valid shapes: (1) list-only default, (2) list with explicit plural tab, (3) list + matching-type drawer, (4) **edge case** — organisations list with candidate drawer.
- **D-09:** URL mutation rules — **all selector changes push the URL**: election change, plural-tab change, entity click, drawer close. Drawer is shown iff both `entityTypeSingular` and `id` are present. No local-state drawer-open flag.
- **D-10:** On full-page-load to a detail URL, **prioritize drawer rendering over list rendering**. Mechanism is planner's discretion (streaming SSR / prioritized load / CSS paint-order).
- **D-11:** Param matchers: `entityTypePlural` ∈ {candidates, organisations}, `entityTypeSingular` ∈ {candidate, organisation}. Other values → 404.
- **D-12:** Phase 62 scope includes full /results path refactor (D-08 + D-09 + D-10 + D-11). Does NOT include: shorter IDs in URLs, multi-election/constituency selection, extending URL carrying to /questions or /elections.

**Active Tab Wiring + Filter-State Persistence**

- **D-13:** Tabs component is **URL-driven** — active tab derived directly from `$page.params.entityTypePlural`. Tab click pushes the URL via SvelteKit navigation. No local `$state` for `activeTab`, no `$effect`-based sync.
- **D-14:** Filter state is scoped to the **(election, plural)** tuple. Switching either resets filters. Internally keyed on `${electionId}:${entityTypePlural}`.
- **D-15:** Filter state **survives drawer open/close**. Drawer is a visual overlay, not a context change.

### Claude's Discretion

- Plan split within Phase 62 (one plan per RESULTS-NN vs one plan per concern). Starting suggestion: Plan 62-01 (`filterContext` scaffold + `EntityListWithControls` merge), Plan 62-02 (route refactor + param matchers), Plan 62-03 (URL wiring + drawer prioritization + filter scoping + re-enable filters).
- Exact shape of the drawer-prioritization mechanism for D-10 (streaming data vs paint-order vs load-function priority).
- Exact shape of `FilterGroup` reactivity wrapping at the consumer — whether to snapshot into `$state` locally or rely on wrapping the `filterGroup` instance in a reactive proxy. Planner picks based on how `FilterGroup.filters` mutation surfaces observationally.
- Fallback rendering for `/results/[electionId]` (no plural segment) — does the URL canonicalize to the default plural via a load-function redirect, or does the layout render with a default without URL change? Planner picks based on URL-sharing UX considerations.
- Exact i18n keys for the new Tabs labels if labels change (existing labels likely fine).

### Deferred Ideas (OUT OF SCOPE)

- **Sweep existing `EntityList` consumers to adopt `EntityListWithControls`** where controls are wanted. Follow-up todo. D-02 preserves backward compatibility.
- **Shorter IDs in URLs** (UUIDs are long).
- **Multi-election / multi-constituency selection** for voters across elections.
- **Extend URL-based election/constituency carrying to upstream voter routes** (`/questions`, `/elections`).
- **`@openvaa/filters` internal refactor** to expose `$state`-backed reactive filter state natively.
- **Redux-style snapshot + dispatch API for LLM chat** (instead of direct FilterGroup ref + mutators).
- **Snippet-based controls customization** for `EntityListWithControls`.
- **Centralized overlay architecture** — carried forward from Phase 60.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RESULTS-01 | `EntityListControls` and `EntityList` merged into one; infinite `$effect` loop on line 56 of `EntityListControls.svelte` eliminated by replacing `$effect` + `filterGroup.onChange` + `updateFilters` circular chain with `$derived`-based computation. | Circular chain verified in `EntityListControls.svelte:56-73`. `FilterGroup.apply` is a pure function (`packages/filters/src/group/filterGroup.ts:46-52`) — safe inside `$derived`. Constraint: FilterGroup internal rule state is plain JS (not `$state`), so the consumer must make the triggering signal reactive — see Pitfall 1 + Pattern 3 below. |
| RESULTS-02 | Filters re-enabled on the voter results page (currently temporarily disabled per the todo). No regressions when filters are toggled in the layout-based render path. Filter state exposed via shared `filterContext` module (bundled through `voterContext`), scoped per (election, plural) tuple, preserved across drawer open/close. | Re-enable the single `<EntityList>` on `results/+layout.svelte:270` by swapping to `<EntityListWithControls>` + `filterContext` FilterGroup. Scoping per D-14 done inside filterContext (keyed map, reset-on-change via `$derived`). |
| RESULTS-03 | Empty `results/+page.svelte` removed. `[entityType]/[entityId]` route params made optional so list and drawer share the same route. `entityType` route param drives initially active entity tab. | D-08 expands this into 4-segment shape: `[electionId]/[[entityTypePlural]]/[[entityTypeSingular]]/[[id]]`. Matchers (D-11) constrain each param. Coupling rule: `[[entityTypeSingular]]` + `[[id]]` must appear together (enforced in load function). |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Yarn 4 workspaces + Turborepo:** Dependencies added to a workspace `package.json` with `workspace:^` version; no new workspace deps expected for Phase 62 (all internal).
- **Runes mode globally enabled:** `apps/frontend/svelte.config.js` sets `compilerOptions.runes: true` `[VERIFIED: file read]`. Every new component MUST use `$props`, `$state`, `$derived`, `$effect`, `{@render children()}`. No `export let`, no `$:`, no `<slot />`.
- **WCAG 2.1 AA:** Per CLAUDE.md §Important Implementation Notes. The new `EntityListWithControls` + the new route shape must preserve existing keyboard/focus/ARIA behaviours (modal focus trap, tabs arrow navigation, drawer focus return, deeplink crawlability) — baseline inherited from the existing components (see UI-SPEC Accessibility Contract).
- **Localization:** All user-facing strings must exist in all 7 locales: `en`, `fi`, `sv`, `fr`, `et`, `da`, `lb` `[VERIFIED: ls apps/frontend/src/lib/i18n/translations/]`. UI-SPEC reuses existing keys; this phase introduces **zero new user-facing strings** in the happy path (optional `results.drawer.loadingDetails` only if D-10 picks a mechanism that surfaces a visible loading state).
- **TypeScript strict, no `any`:** Per CLAUDE.md §Important. New types for `FilterContext`, `EntityListWithControlsProps`, matcher return types must be explicit.
- **Code Review Checklist:** Per CLAUDE.md §Code Review, every plan must check against `.agents/code-review-checklist.md`.
- **Single production data adapter = Supabase:** No adapter switch. Nothing in this phase touches the adapter layer.
- **Route file convention:** `apps/frontend/src/routes/` uses `(voters)/(located)/results/` — **no `[[lang=locale]]` wrapper** `[VERIFIED: ls apps/frontend/src/routes/]`. CLAUDE.md is wrong about the locale wrapper for this route tree. Plan MUST use the actual path.

---

## Summary

Phase 62 is a pure consumer-side refactor inside `apps/frontend/src/`. Three concerns, all interlocked through the same `+layout.svelte` file at `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` (306 lines `[VERIFIED: wc -l]`): (1) an infinite `$effect` loop in `EntityListControls.svelte:56-73` that chains `$effect → filterGroup.apply → filterGroup.onChange → updateFilters → $state write → $effect` — this was hidden when the controls rendered inside `+page.svelte` but became load-bearing when the list moved into `+layout.svelte` to enable the persistent-list-with-drawer pattern; (2) a stale empty `+page.svelte` + single-purpose `[entityType]/[entityId]/+page.svelte` that together don't cleanly express the "list + drawer over same list" lifecycle or the org-list-with-candidate-drawer edge case; (3) filter state currently siloed inside the `EntityListControls` component — CONTEXT.md makes this global via a `filterContext` module so a future LLM chat can read/mutate the voter's active filters.

The heart of the phase is the `$derived` refactor. `FilterGroup.apply(entities)` is a pure function with no side effects — safe to call from a `$derived` body. BUT `FilterGroup.filters` is a plain JS array whose elements hold `_rules` in plain JS (not `$state`). That means `$derived(filterGroup.apply(entities))` alone won't re-run when a filter's rules change — Svelte has no reactive dependency on the internal `_rules` object. The fix has two equivalent idiomatic shapes: (A) make the `filterGroup` instance itself a `$state`-wrapped reference so re-assignment triggers re-derivation (combine with a tiny "version counter" bumped inside the `filterContext` mutator methods), or (B) use the existing `filterGroup.onChange(...)` listener to bump a `$state` version counter, and include that counter as a dependency in the `$derived` expression. Option B is a small, surgical pattern that reuses the existing onChange API; Option A is more architecturally clean. Planner picks; both are valid under D-06's "no wrapping ceremony" directive.

The route collapse is straightforward under SvelteKit's `[[optional]]` syntax with param matchers `[VERIFIED: https://svelte.dev/docs/kit/advanced-routing]`. The org-list + candidate-drawer edge case (D-08 shape 4) is the forcing function for separating plural from singular segments. URL-driven Tabs (D-13) is an established pattern already used in this codebase for locale and route-based state. Drawer-first paint on deeplink (D-10) has no single idiomatic SvelteKit pattern — planner discretion, with streaming SSR via `load` function as the strongest candidate.

**Primary recommendation:** Execute as three plans per CONTEXT.md's starting suggestion. Plan 62-01 scaffolds `filterContext` + `EntityListWithControls` (unblocks the merge and makes the global-state surface available). Plan 62-02 adds the new 4-segment route + matchers + guards (moves the list under the new path). Plan 62-03 wires up URL-driven Tabs, drawer-first-paint, filter scoping per (election, plural), and re-enables filters end-to-end. Use Option B (version-counter via onChange) for the `$derived` reactivity bridge — it's 3 lines inside `filterContext`, reuses the existing onChange API, doesn't require wrapping `FilterGroup` in a Svelte proxy, and leaves `@openvaa/filters` untouched per D-07.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Route param validation (`entityTypePlural`, `entityTypeSingular`) | Frontend Server (SvelteKit matcher `src/params/*.ts`) | Browser (matcher also runs client-side) | SvelteKit matchers run on both server and browser `[CITED: https://svelte.dev/docs/kit/advanced-routing]`. Param validation happens before the route is chosen. |
| Route param + id coupling guard (singular+id together) | Frontend Server (`+layout.ts` / `+page.ts` load fn) | Browser (load fn re-runs on client nav) | Single source of truth for the coupling rule. Decide to redirect or 404 when violated (D-11 planner discretion). |
| Active-tab state | Browser (runes-mode `+layout.svelte` reading `$page.params`) | — | D-13: URL is the single source of truth. `$derived` from `page.params.entityTypePlural`. Browser Back/Forward → natural tab transitions. |
| Drawer visibility state | Browser (runes-mode `+layout.svelte` `$derived` from `page.params`) | — | D-09: Drawer shown iff `[[entityTypeSingular]]` + `[[id]]` both present. No local `$state`. |
| Filter state (current rules + scoping per (election, plural)) | Browser (new `filterContext.svelte.ts` module) | — | D-05, D-14. Module is SPA-scoped — same lifetime as the voter session. |
| Filter application to entities (pure computation) | Browser (`$derived` inside `EntityListWithControls`) | — | D-04: `FilterGroup.apply(entities)` is pure; safe inside `$derived`. |
| Filter mutation API (setFilter / reset / add / remove) | Browser (typed methods on `filterContext` return) | — | D-06: shared API for UI + future LLM chat. |
| Entity-click → drawer open (navigation) | Browser (`<a>` link + SvelteKit `goto`) | — | Preserves right-click-to-new-tab (UI-SPEC explicit preservation). |
| Drawer data load (deeplink full-page-load) | Frontend Server (`+page.ts` for the detail segment) | Browser (on client nav, runs on client) | D-10: planner picks streaming vs. prioritized load fn. SSR path gives first paint faster. |
| Drawer data load (client-side tab/entity clicks) | Browser (reads existing `matches` + `dataRoot` already loaded by `(located)/+layout.ts`) | — | No extra fetch needed; the data is already in the voter context. |
| Loader-wide `(located)/+layout.ts` data (matches, dataRoot) | Frontend Server (already exists) | Browser (hydrated) | Unchanged by this phase. |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | ^5.53.12 | Runes mode for new components, `$derived` for filter computation, `$state` for reactivity bridge, `$effect` only for side-effects | `[VERIFIED: .yarnrc.yml line 26 — 'svelte: ^5.53.12']` Project-pinned version. Runes mode globally enabled via `apps/frontend/svelte.config.js` `compilerOptions.runes: true` `[VERIFIED: file read]`. |
| @sveltejs/kit | ^2.55.0 | Optional param brackets `[[param=matcher]]`, `$app/navigation` `goto`, `$app/state` `page`, param matchers in `src/params/` | `[VERIFIED: .yarnrc.yml]` Existing project version. `[[param]]` and matchers are stable features `[CITED: https://svelte.dev/docs/kit/advanced-routing]`. |
| @openvaa/filters | workspace:^ | `FilterGroup`, `TextPropertyFilter`, `Filter` classes — consumed read-only per D-07 | `[VERIFIED: .planning/config.json — D-07 of CONTEXT.md]` Package is NOT modified in this phase. |
| @openvaa/data | workspace:^ | `EntityType`, `ENTITY_TYPE` constants (`candidate`, `organization`, `faction`, `alliance`) | `[VERIFIED: packages/data/src/objects/entities/base/entityTypes.ts]` Existing. |
| @openvaa/core | workspace:^ | `Id` type for param typing | `[VERIFIED: existing imports]` Existing. |
| daisyui | ^5.5.14 | Existing UI theme via Tailwind 4 plugin | `[VERIFIED: .yarnrc.yml]` No new component added that goes outside the current idiom. |
| @playwright/test | ^1.58.2 | E2E voter results tests | `[VERIFIED: catalog via package.json]` Existing infrastructure at `tests/tests/specs/voter/voter-results.spec.ts`. |
| vitest | ^3.2.4 | Frontend unit tests | `[VERIFIED: .yarnrc.yml line 22]` Existing `apps/frontend/vitest.config.ts` with jsdom env. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `$app/state` `page` | (builtin, SvelteKit 2.12+) | Reactive `page.params`, `page.route.id`, `page.url` | Use in runes-mode components. The existing `+layout.svelte:19` already imports this. `[VERIFIED: codebase read]` |
| `$app/navigation` `goto` | (builtin) | Push new URL without full reload; D-09 URL-driven mutations | Already used on `+layout.svelte:187` for `handleDrawerClose`. Add calls at each selector change (election / tab / entity click / drawer close). |
| `svelte` `untrack` | (builtin, Svelte 5) | Break circular `$effect` chains — read a dependency without establishing a reactive relationship | Prefer `$derived` instead. Fall back to `untrack()` if a write inside `$effect` is unavoidable `[CITED: https://svelte.dev/docs/svelte/svelte — 'untrack']`. |
| Existing `filterStore` (voterContext) | (internal) | Builds the per-`(election, entityType)` FilterTree of FilterGroups | Located at `apps/frontend/src/lib/contexts/voter/filters/filterStore.svelte.ts`. Currently exposed as `voterContext.entityFilters: FilterTree`. `filterContext` consumes/wraps this — do NOT duplicate the FilterGroup construction logic. |
| Existing `paramStore` (voter utils) | (internal) | Reactive URL param reader | `apps/frontend/src/lib/contexts/voter/utils/paramStore.svelte.ts` used in voterContext for `electionId`/`constituencyId`. `filterContext` could use the same pattern for the scoping key. |
| `fromStore` / `toStore` (Svelte 5 builtin) | (builtin) | Classic store ↔ runes bridge | Retained in this phase (D-06 defers retirement). Used where voterContext already uses it. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Option B `onChange → version counter` for `$derived` reactivity | Option A: wrap `filterGroup` in `$state` and reassign on every mutation | A is more idiomatic Svelte 5 but requires every mutation path to go through `filterContext` (no direct `filterGroup.filters[0].exclude = 'x'` writes). B preserves ergonomics of direct filter mutation from UI (existing `EntityFilters` component writes directly). Planner picks; both satisfy D-06. |
| `$derived` for filter reactivity bridge | Option C: eager `$state` snapshot inside filterContext — mutation writes to the snapshot, `apply` reads the snapshot | More code, more invariants to maintain, more places to drift out of sync. Do not pursue unless A and B both fail empirical smoke tests. |
| Typed matchers (D-11) | Generic route params with runtime validation in the load function | Matchers give 404 before the page component mounts — cleaner UX for invalid URLs. Existing `src/params/entityType.ts` is the template `[VERIFIED: file read]`. |
| Route files nested under `[[entityTypePlural]]/[[entityTypeSingular]]/[[id]]` | Route groups `(list)` + `(drawer)` with shared `+layout.svelte` | Nested optional brackets are the simpler shape and match CONTEXT.md D-08 verbatim. Route groups would add indirection for no clear gain. |
| Load function redirect `/results/[electionId]` → `/results/[electionId]/candidates` | Render-with-default (no URL change) | Redirect gives shareable URLs that canonicalize. Render-with-default preserves the user's "bare" URL but is less shareable. CONTEXT.md Claude's Discretion — recommend redirect unless a product constraint surfaces. |

**Installation:** No new dependencies. All tools already in the project.

**Version verification:**
- `svelte@^5.53.12` — `[VERIFIED: .yarnrc.yml]` Currently in catalog.
- `@sveltejs/kit@^2.55.0` — `[VERIFIED: .yarnrc.yml]` Currently in catalog.
- `@openvaa/filters` workspace — read-only per D-07.

---

## Architecture Patterns

### System Architecture Diagram

```
                                 ┌────────────────────────────────────┐
    URL change / entity click    │ SvelteKit routing layer            │
    /results/elec-X/...          │                                    │
             │                   │  src/params/entityTypePlural.ts    │
             ▼                   │  src/params/entityTypeSingular.ts  │
    ┌────────────────┐           │  (matcher gates, 404 on mismatch)  │
    │  goto()        ├──────────▶│                                    │
    └────────────────┘           │  +layout.ts (voter located)        │
                                 │   - provides dataRoot, matches     │
                                 │                                    │
                                 │  +page.ts (new, detail segment)    │
                                 │   - reads [[entityTypeSingular]],  │
                                 │     [[id]] — load fn guards        │
                                 │     coupling + optionally returns  │
                                 │     drawer-first streamed data     │
                                 └────────────────┬───────────────────┘
                                                  │
                                                  ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │ Browser runtime (runes mode)                                    │
   │                                                                 │
   │ voterContext.svelte.ts                                          │
   │   ├─ entityFilters: FilterTree  (unchanged — filterStore)       │
   │   └─ bundled via return object:                                 │
   │      ├─ filterContext.filterGroup  ──┐                          │
   │      ├─ filterContext.setFilter()    │  D-05                    │
   │      ├─ filterContext.resetFilters() │  D-06                    │
   │      └─ filterContext.addFilter()    │                          │
   │                                      │                          │
   │ filterContext.svelte.ts  (NEW)       │                          │
   │   ├─ reads FilterTree from voterCtx  │                          │
   │   ├─ scopes by ($electionId, $plural)│  D-14                    │
   │   ├─ version counter via onChange ◀──┘  (Option B bridge)       │
   │   └─ exposes scoped filterGroup + mutators                      │
   │                                                                 │
   │ EntityListWithControls.svelte  (NEW, D-01/D-03)                 │
   │   entities: prop                                                │
   │   filterGroup: prop (or via filterContext)                      │
   │   filteredEntities = $derived( filterGroup.apply(entities) )    │
   │       + includes version counter as dependency                  │
   │   ├─ search input (TextPropertyFilter via TextEntityFilter)     │
   │   ├─ filter trigger Button (color varies on numActiveFilters)   │
   │   ├─ Modal wrapping EntityFilters (unchanged)                   │
   │   └─ <EntityList cards={filteredEntities.map(...)} />           │
   │                                                                 │
   │ results/+layout.svelte (refactored)                             │
   │   - active plural  = $derived(page.params.entityTypePlural)     │
   │   - drawer visible = $derived(!!(page.params.entityTypeSingular │
   │                                   && page.params.id))           │
   │   - Tabs URL-driven (D-13); click → goto(...)                   │
   │   - AccordionSelect election → goto(...)                        │
   │   - <EntityListWithControls entities={activeMatches} />         │
   │   - {#if drawerVisible}<EntityDetailsDrawer .../>{/if}          │
   │                                                                 │
   │ EntityDetailsDrawer (unchanged)                                 │
   └─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
apps/frontend/src/
├── params/
│   ├── entityType.ts                  # EXISTING — keep for backward compat or migrate
│   ├── entityTypePlural.ts            # NEW (D-11) — accepts 'candidates' | 'organizations'
│   └── entityTypeSingular.ts          # NEW (D-11) — accepts 'candidate' | 'organization'
│
├── lib/contexts/
│   ├── filter/                        # NEW (D-05)
│   │   ├── filterContext.svelte.ts
│   │   ├── filterContext.type.ts
│   │   └── index.ts                   # barrel: export * from './filterContext.svelte'
│   └── voter/
│       └── voterContext.svelte.ts     # UPDATED — bundles filterContext accessors
│
├── lib/dynamic-components/entityList/
│   ├── EntityList.svelte              # UNCHANGED (D-02)
│   ├── EntityList.type.ts             # UNCHANGED
│   ├── EntityListControls.svelte      # DELETED after migration (D-01; see Pitfall 4 for sequence)
│   ├── EntityListControls.type.ts     # DELETED after migration
│   ├── EntityListWithControls.svelte  # NEW (D-01, D-03, D-04)
│   ├── EntityListWithControls.type.ts # NEW
│   └── index.ts                       # UPDATED barrel
│
└── routes/(voters)/(located)/results/
    ├── +layout.svelte                 # REFACTORED — URL-driven tabs + drawer
    ├── +page.svelte                   # DELETED (RESULTS-03)
    ├── [entityType]/                  # DELETED wholesale (superseded by new shape)
    │   └── [entityId]/+page.svelte
    ├── [[entityTypePlural=entityTypePlural]]/         # NEW
    │   └── [[entityTypeSingular=entityTypeSingular]]/ # NEW
    │       └── [[id]]/
    │           ├── +page.svelte       # NEW — hosts drawer-first content
    │           └── +page.ts           # NEW — coupling guard + drawer-first load (D-10)
    └── statistics/                    # UNCHANGED
```

**Note on `src/params/entityType.ts`:** The pre-existing matcher `entityType.ts` accepts `candidate | party` (singular) — note the value `party` does NOT match the `ENTITY_TYPE.Organization = 'organization'` used everywhere else in the codebase `[VERIFIED: packages/data/src/objects/entities/base/entityTypes.ts]`. This looks like an unresolved legacy bit. Do NOT reuse this matcher; author the two new matchers (`entityTypePlural`, `entityTypeSingular`) fresh per D-11. See Open Question 2 for the `party` vs `organization` discrepancy.

### Pattern 1: FilterContext with per-`(election, plural)` scoping

**What:** A new runes-mode context module that exposes a scoped `FilterGroup` + typed mutators. The scope key (`${electionId}:${entityType}`) is a `$derived` computation — when the key changes, the context returns a different `FilterGroup` from the underlying `FilterTree`. Filter resets on scope change are implicit (different FilterGroup instance).

**When to use:** In every consumer that needs active-filter state — the results layout UI today, and the future LLM chat. All mutations go through the same typed API (D-06).

**Example:**
```ts
// Source: derived from existing voterContext.svelte.ts pattern + D-05/D-06
// apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts

import { error, getContext, hasContext, setContext } from 'svelte';
import { page } from '$app/state';
import type { FilterGroup } from '@openvaa/filters';
import type { EntityType } from '@openvaa/data';
import type { FilterTree } from '$lib/contexts/voter/filters/filterStore.svelte';

const CONTEXT_KEY = Symbol();

export function getFilterContext() {
  if (!hasContext(CONTEXT_KEY))
    error(500, 'getFilterContext() called before initFilterContext()');
  return getContext<FilterContext>(CONTEXT_KEY);
}

export function initFilterContext({
  entityFilters
}: {
  entityFilters: () => FilterTree;
}) {
  if (hasContext(CONTEXT_KEY))
    error(500, 'initFilterContext() called twice');

  // Version counter for the $derived reactivity bridge (Option B).
  // Bumped inside onChange — makes any $derived that reads `version`
  // re-run whenever any filter in the active group changes.
  let version = $state(0);

  // Scope key driven by URL (D-14)
  const scopeKey = $derived.by<{ electionId: string | undefined; entityType: EntityType | undefined }>(() => ({
    electionId: page.params.electionId,
    entityType: (page.params.entityTypePlural === 'candidates'
      ? 'candidate'
      : page.params.entityTypePlural === 'organizations'
        ? 'organization'
        : undefined) as EntityType | undefined
  }));

  // Derived FilterGroup — note the `version` read makes this $derived
  // re-run when onChange fires, even though filterGroup.filters mutates
  // internal state that Svelte can't observe directly.
  const _filterGroup = $derived.by<FilterGroup<MaybeWrappedEntityVariant> | undefined>(() => {
    version; // subscribe to version counter
    const tree = entityFilters();
    const { electionId, entityType } = scopeKey;
    if (!electionId || !entityType) return undefined;
    return tree[electionId]?.[entityType];
  });

  // Subscribe onChange to bump the version counter.
  // Use $effect to attach/detach on scope change.
  $effect(() => {
    const fg = _filterGroup;
    if (!fg) return;
    const handler = () => { version++; };
    fg.onChange(handler);
    return () => fg.onChange(handler, false);
  });

  const context = {
    get filterGroup() { return _filterGroup; },
    setFilter: (id: string, value: unknown) => {
      const fg = _filterGroup;
      const f = fg?.filters.find((x) => x.name === id);
      if (!f) return;
      // Example — real API depends on which filter subclass
      // Point is: mutation flows through onChange → version++ → $derived re-run
    },
    resetFilters: () => _filterGroup?.reset(),
    // addFilter / removeFilter omitted in this sketch
  };

  return setContext<FilterContext>(CONTEXT_KEY, context);
}
```

**Why this works:** `FilterGroup.filters` is plain JS. Mutations to `filter._rules` (via `setRule`) internally call `doOnChange` which notifies all `_onChange` listeners `[VERIFIED: packages/filters/src/filter/base/filter.ts:139-145, 168-171]`. By attaching a listener that increments a `$state` counter and referencing that counter inside every consumer's `$derived`, we create the reactive edge that Svelte needs.

### Pattern 2: Filtered list via `$derived` (no onChange callback, no $effect)

**What:** Inside `EntityListWithControls`, compute `filteredEntities` with `$derived`. Read `version` from filterContext so re-derivation fires when filters mutate. `FilterGroup.apply` is a pure function `[VERIFIED: packages/filters/src/group/filterGroup.ts:46-52]` — safe inside `$derived` (no side effects, `$derived` is allowed to re-run freely).

**When to use:** Always, for any consumer of a FilterGroup in this phase. Replaces the `$effect + onChange callback + $state write` anti-pattern.

**Example:**
```svelte
<!-- Source: D-04 + packages/filters/src/group/filterGroup.ts -->
<script lang="ts">
  import { getFilterContext } from '$lib/contexts/filter';
  import { TextPropertyFilter } from '@openvaa/filters';
  import { getAppContext } from '$lib/contexts/app';

  let { entities, searchProperty = 'name' } = $props<{
    entities: Array<MaybeWrappedEntityVariant>;
    searchProperty?: string;
  }>();

  const { locale, t } = getAppContext();
  const { filterGroup } = getFilterContext();

  const searchFilter = searchProperty
    ? new TextPropertyFilter({ property: searchProperty }, locale)
    : undefined;

  // Search filter version bridge — local, not via filterContext
  let searchVersion = $state(0);
  $effect(() => {
    if (!searchFilter) return;
    const h = () => { searchVersion++; };
    searchFilter.onChange(h);
    return () => searchFilter.onChange(h, false);
  });

  const filtered = $derived.by(() => {
    // Touch both version counters so $derived re-runs on any mutation
    searchVersion;
    const group = filterGroup;
    const afterGroup = group ? group.apply(entities) : [...entities];
    return searchFilter ? searchFilter.apply(afterGroup) : afterGroup;
  });

  const numActiveFilters = $derived(
    filterGroup ? filterGroup.filters.filter((f) => f.active).length : 0
  );
</script>

<!-- ...UI identical in idiom to existing EntityListControls, but passing filtered cards -->
<EntityList cards={filtered.map((e) => ({ entity: e }))} class="mb-lg" data-testid="voter-results-list" />
```

**Why this works:** No `$effect(() => updateFilters())`. No `filterGroup.onChange(updateFilters)` registration that also calls `filterGroup.apply()`. No circular chain. The `$derived` re-runs when `entities` change OR when a version counter bumps. Pure.

### Pattern 3: URL-driven Tabs (D-13)

**What:** Tabs' `activeIndex` is a `$derived` computation off `page.params.entityTypePlural`. Tab click calls `goto(...)`. No local `$state` sync.

**When to use:** Anywhere tab state should be deeplinkable.

**Example:**
```svelte
<!-- Source: D-13 + $page.params (SvelteKit 2) + existing Tabs.svelte API -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Tabs } from '$lib/components/tabs';

  const ENTITY_PLURALS = ['candidates', 'organizations'] as const;

  const activeIndex = $derived.by(() => {
    const p = page.params.entityTypePlural ?? 'candidates';
    const i = ENTITY_PLURALS.indexOf(p as typeof ENTITY_PLURALS[number]);
    return i === -1 ? 0 : i;
  });

  function handleTabChange({ index }: { index?: number }) {
    if (index == null) return;
    const plural = ENTITY_PLURALS[index];
    const electionId = page.params.electionId;
    goto(`/results/${electionId}/${plural}`);
  }
</script>

<Tabs tabs={[{ label: 'Candidates' }, { label: 'Parties' }]} {activeIndex} onChange={handleTabChange} />
```

**Note on `activeIndex` binding:** existing `Tabs.svelte` accepts `activeIndex` as `$bindable(0)` `[VERIFIED: apps/frontend/src/lib/components/tabs/Tabs.svelte:30]`. Passing a `$derived` value as `activeIndex` without `bind:` is supported — the child can still call `onChange` and the parent updates via goto → URL → page.params → $derived. Do NOT `bind:activeIndex` in the URL-driven pattern (would create an uncontrolled second source of truth).

### Pattern 4: SvelteKit optional params with matchers (D-08, D-11)

**What:** Route folder names use `[[param=matcher]]` syntax. Matchers live in `src/params/*.ts` and export a `match(param: string): boolean` function `[CITED: https://svelte.dev/docs/kit/advanced-routing]`.

**Example:**
```ts
// Source: https://svelte.dev/docs/kit/advanced-routing + existing src/params/entityType.ts
// apps/frontend/src/params/entityTypePlural.ts
import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) =>
  param === 'candidates' || param === 'organizations';
```

Route folder: `apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/...`.

### Pattern 5: Drawer-first paint via SvelteKit streaming (D-10 — one option)

**What:** The `+page.ts` load function for the detail segment returns a promise for non-critical list data while resolving the drawer entity synchronously. In Svelte components `{#await ...}` holds the list area while the drawer renders immediately.

**Example:**
```ts
// apps/frontend/src/routes/(voters)/(located)/results/.../[[id]]/+page.ts
// Source: D-10 + https://svelte.dev/docs/kit/load#streaming-with-promises
import { redirect, error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
  const { entityTypeSingular, id, entityTypePlural, electionId } = params;

  // Coupling guard (D-11): both present, or both absent
  if ((entityTypeSingular && !id) || (!entityTypeSingular && id)) {
    throw redirect(307, `/results/${electionId}/${entityTypePlural ?? ''}`);
  }

  // Parent layout has dataRoot + matches already loaded
  const { dataRoot } = await parent();

  // Drawer entity resolved synchronously for first paint
  const drawerEntity = entityTypeSingular && id
    ? dataRoot.tryGetEntity?.(entityTypeSingular, id)  // API shape TBD per existing getEntityAndTitle
    : undefined;

  return { drawerEntity };
};
```

Planner picks among: (a) streaming load fn (sketched above), (b) CSS `content-visibility: auto` on the list container (cheap, browser-optimized), (c) `{#await}` pattern with a deferred list promise. Option (b) is the cheapest and most foolproof for the stated UX requirement.

### Anti-Patterns to Avoid

- **`$effect(() => { entities; updateFilters(); })` + `filterGroup.onChange(updateFilters)` together** — the exact bug. `updateFilters` calls `filterGroup.apply(entities)` which triggers onChange inside the same $effect cycle. `[CITED: .planning/todos/pending/entity-list-controls-infinite-loop.md]`
- **`queueMicrotask` or `untrack()` wrapping around the state write inside `$effect`** — both were attempted and failed per the todo. Microtask deferral doesn't break the chain because the next tick still has the same circular cause. `untrack()` on the write side prevents re-triggering but also silences legitimate reactivity. The fix is to remove the $effect altogether (use $derived).
- **Mutating `filterGroup.filters[i]._rules.x = value` directly from the component** — works today but bypasses the onChange → version counter bridge. Always go through `filter.setRule(...)` (which already calls `doOnChange`) or through the `filterContext` mutator methods. `EntityFilters` component already uses the getter/setter accessors so this is safe.
- **`activeTab` as local `$state` synced to URL via `$effect`** — D-13 explicitly rejects this. URL is the single source of truth; local state is a derivation of URL, not a twin.
- **`bind:activeIndex={activeTabIndex}` where `activeTabIndex` is derived from URL** — conflict: bind creates a second writer. Pass as non-bound prop; let onChange callback issue `goto(...)`.
- **Importing `EntityListWithControls` from a candidate-app surface** — out of scope this phase (D-02). The migration of other EntityList sites is explicitly deferred.
- **Using British spelling `organisation` / `organisations` in code or matchers** — the codebase uses American `organization` / `organizations` everywhere (`ENTITY_TYPE.Organization = 'organization'`, `common.organization.plural = 'organizations'`, app settings `sections: ['candidate', 'organization']`) `[VERIFIED: packages/data/src/objects/entities/base/entityTypes.ts:16; apps/frontend/src/lib/i18n/translations/en/common.json; packages/app-shared/src/settings/dynamicSettings.ts:66]`. CONTEXT.md uses British spelling in a few places (`organisations`, `organisation` in D-08/D-11); follow the codebase convention and use American spelling in matchers/routes. See Open Question 1.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Build per-`(election, entityType)` FilterGroups | A new scoped filter-builder | Existing `filterStore` at `apps/frontend/src/lib/contexts/voter/filters/filterStore.svelte.ts` | Already produces `FilterTree = SelectionTree<FilterGroup>`. `filterContext` reads from it — construction stays in voter context. |
| Drawer component for entity details | A new Drawer | Existing `EntityDetailsDrawer` at `apps/frontend/src/lib/dynamic-components/entityDetails/` | Already handles overlay + focus trap + close-on-ESC. Reused unchanged per UI-SPEC Component Inventory. |
| Tabs component with active indicator | A new Tabs | Existing `Tabs` at `apps/frontend/src/lib/components/tabs/` | Accepts `activeIndex` as a non-bound prop for URL-driven consumption. |
| Search input | A new text input | Existing `TextEntityFilter` + `TextPropertyFilter` (from `@openvaa/filters`) | Already used in `EntityListControls.svelte:99-104`. Port unchanged. |
| Filter modal | A new modal + EntityFilters | Existing `Modal` + `EntityFilters` | Already used in `EntityListControls.svelte:148-160`. Port unchanged. |
| Filter count badge | A custom counter | Existing `InfoBadge` | Already used in `EntityListControls.svelte:116`. Port unchanged. |
| Pagination / "Show more" button | A new pager | Existing `EntityList` (the primitive, D-02 unchanged) | Accepts `cards: Array<EntityCardProps>`; manages pages internally. |
| `getEntityAndTitle` lookup by `entityType` + `entityId` | A new resolver | Existing `$lib/utils/entityDetails.getEntityAndTitle` | Currently used in `+layout.svelte:158-164` and `[entityType]/[entityId]/+page.svelte:72-77`. Signature accepts `entityType, entityId, nominationId`. |
| Coupling-rule guard for `[[entityTypeSingular]]` + `[[id]]` | Client-side assertions in the component | SvelteKit load function — throw `redirect(307, ...)` or `error(404)` per D-11 | Load function runs before the component mounts; single source of truth. |
| URL-driven reactivity for tabs / drawer | `$effect` syncing page.params → local $state | `$derived(page.params.X)` directly | D-13; simpler, no second source of truth. |
| Reactivity bridge for third-party class (FilterGroup) | Deep `$state` proxy of the FilterGroup instance | Option B version counter via existing `onChange` listener | FilterGroup's onChange API exists (`packages/filters/src/filter/base/filter.ts:156-162` and `src/group/filterGroup.ts:109-115`) and is already how the package emits change signals. Wrap once in filterContext; consumers just read a counter. |

**Key insight:** Every primitive for Phase 62 already exists. The refactor is mostly **composition + routing** work. No new libraries, no new rendering primitives, no changes to `@openvaa/filters`. The three net-new modules — `filterContext.svelte.ts`, `EntityListWithControls.svelte`, and the two param matchers — are thin adapters over existing code.

---

## Runtime State Inventory

This phase is a source-code-only refactor. No rename, no data migration, no binary renaming.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — filter state is SPA-scoped, not persisted. Filters have **never** been in sessionStorage/localStorage in this codebase `[VERIFIED: grep 'filter' apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts returns no hits on filter state]`. No database writes involve filter state. | None. |
| Live service config | None — no Supabase, Datadog, analytics, or external service stores filter state or references the old route path. | None. |
| OS-registered state | None — no OS-level registrations reference `EntityListControls` or `/results/[entityType]/[entityId]`. | None. |
| Secrets/env vars | None — the refactor does not read or change any environment variable. | None. |
| Build artifacts | None — no compiled/published package depends on `EntityListControls` as a public export. `@openvaa/filters` is untouched (D-07). `apps/frontend/.svelte-kit/` regenerates on next build. | None. Running `yarn build` after the refactor regenerates types and client bundle. |

**External callers audit** (important — not RSI but adjacent):

`EntityListControls` has **2 call sites outside the results surface** that must be left in working order per D-02 until the deferred follow-up sweep:

1. `apps/frontend/src/lib/dynamic-components/entityDetails/EntityChildren.svelte:46` — shows filter controls for org → child candidates. Uses `onUpdate` callback pattern.
2. `apps/frontend/src/routes/(voters)/nominations/+page.svelte:63` — nominations page. Uses full `filterGroup` + `onUpdate` pattern.

**Decision required:** D-01 says `EntityListControls.svelte` is **deleted once every call site in the results layout** is migrated. D-02 says `EntityListWithControls` is additive and doesn't force migration of other surfaces. These directives conflict: deleting `EntityListControls` breaks the 2 non-results callers. Resolution: **keep `EntityListControls` alive** — the deletion in D-01 means "deleted from the results-surface import". The file stays on disk until the follow-up sweep migrates `EntityChildren` and `nominations/+page.svelte`. See Open Question 3.

---

## Common Pitfalls

### Pitfall 1: `$derived(filterGroup.apply(entities))` does NOT re-run on filter mutation

**What goes wrong:** A naïve `$derived(filterGroup?.apply(entities) ?? entities)` inside `EntityListWithControls` compiles fine, passes typecheck, and updates on `entities` changes — but does NOT re-run when the user toggles a filter in the modal. The list appears frozen at the pre-mutation state.

**Why it happens:** `FilterGroup.filters[i]._rules` is plain JavaScript state. Svelte 5's `$derived` only tracks reads of `$state` / `$derived` / rune-aware getters. `filterGroup.apply()` reads `filterGroup.filters` (a plain array reference that doesn't change) and invokes each filter's `apply()` which reads `_rules` (plain JS). No reactive edge.

**How to avoid:** Implement the reactivity bridge per Pattern 1 (Option B): subscribe to `filterGroup.onChange(...)` from inside the filterContext's `$effect`, bump a `$state` version counter, reference the counter in every `$derived` that depends on filter output. Three lines of context code; zero ceremony at the call site beyond `filtered = $derived.by(() => { version; return filterGroup.apply(entities); })`.

**Warning signs:** Unit test or E2E clicks a filter checkbox, no DOM update; Svelte devtools inspector shows the filterGroup reference is the same object; `numActiveFilters` badge doesn't update.

### Pitfall 2: `$effect` re-registering `onChange` listener on every pass causes leaked handlers

**What goes wrong:** Registering `filterGroup.onChange(handler)` inside a `$effect` without a cleanup closure leaks one handler per effect re-run. Memory slowly grows; every filter mutation triggers N listener callbacks; eventually the version counter bumps at a multiple that looks like the bug is fixed but on a tab switch the user sees a burst of re-renders.

**Why it happens:** `$effect` re-runs when its dependencies change. `FilterGroup.onChange` with `add = true` (default) adds to a Set; without `add = false` cleanup it persists across effect re-runs.

**How to avoid:** Return a cleanup function from `$effect`:
```ts
$effect(() => {
  const fg = _filterGroup;
  if (!fg) return;
  const handler = () => { version++; };
  fg.onChange(handler, true);
  return () => fg.onChange(handler, false);  // cleanup
});
```
`$effect` calls the returned function before the next re-run and on destroy `[CITED: https://svelte.dev/docs/svelte/$effect]`. Same shape used already in `EntityListControls.svelte:64-67` for `onDestroy`, but now as `$effect` cleanup.

**Warning signs:** Console shows duplicate debug logs per mutation; version counter increments by >1 per expected change; Playwright "wait for list to update" flakes randomly.

### Pitfall 3: Tabs passing a `$derived` value as `activeIndex` while also using `bind:activeIndex`

**What goes wrong:** `<Tabs bind:activeIndex={derivedActiveIndex} ...>` where `derivedActiveIndex = $derived(...)` throws at compile time (can't bind to derived) or at runtime produces "derived not writable" errors.

**Why it happens:** `$bindable()` props require a writable target. `$derived` is read-only.

**How to avoid:** Pass `activeIndex` as a non-bound prop (`activeIndex={derivedActiveIndex}`). Handle the change via `onChange` callback → `goto(...)` → URL → `page.params` → `$derived` re-runs → `activeIndex` prop updates. Unidirectional data flow; no binding.

**Warning signs:** Svelte build warning "non-bindable prop passed with bind:"; runtime error "state_unsafe_mutation" or similar.

### Pitfall 4: Deleting `EntityListControls.svelte` before the 2 non-results callers are migrated

**What goes wrong:** D-01 says "delete once every call site used by the results layout". Reading this as "delete once every call site is migrated" breaks `EntityChildren.svelte:46` and `nominations/+page.svelte:63`. Build fails.

**Why it happens:** Semantic drift between "call site in results" (what D-01 means) and "call site anywhere" (what a grep-based refactorer might read).

**How to avoid:** Planner must explicitly gate the deletion on an external-caller audit. Concrete rule: **`EntityListControls.svelte` deletion is deferred** until all callers migrate (follow-up todo per CONTEXT.md Deferred). In Phase 62, only the results-layout caller is migrated; the file stays on disk, the `index.ts` barrel keeps exporting it. See Open Question 3.

**Warning signs:** `yarn build` errors "Cannot find module './EntityListControls'" in `EntityChildren.svelte` or `nominations/+page.svelte`; typecheck failures from the barrel re-export.

### Pitfall 5: New route folder co-exists with old `[entityType]/[entityId]/+page.svelte` — ambiguous matching

**What goes wrong:** If the new `[[entityTypePlural]]/[[entityTypeSingular]]/[[id]]` tree is added alongside the existing `[entityType]/[entityId]/` folder, SvelteKit's route resolver may match the wrong route for a given URL. Server 500 or wrong page renders.

**Why it happens:** SvelteKit routing has specificity rules but they are complex with overlapping optional params `[CITED: https://svelte.dev/docs/kit/advanced-routing — sorting]`.

**How to avoid:** Delete the old `[entityType]/[entityId]/` folder in the **same commit** as adding the new folder tree. Do NOT split across commits or plans — the intermediate state is broken.

**Warning signs:** `/results/elec-X/candidate/abc` routes to the wrong handler during intermediate state; `404` or `500` unexpectedly.

### Pitfall 6: `onMount` / `startEvent` side effects bound to old drawer-open semantics

**What goes wrong:** The current `+layout.svelte:78-86` `$effect` blocks fire `startFeedbackPopupCountdown` on app-settings change — unrelated to filters, but a sibling concern. Refactoring must not accidentally regress these.

**Why it happens:** The 306-line file has many intertwined concerns; mechanical refactors can drop or mis-order `$effect`s.

**How to avoid:** Audit the existing `+layout.svelte` for every `$effect` / `onMount` call before refactoring. Catalog: line 67-73 `onMount → startEvent('results_ranked'/'results_browse')`, line 78-81 `$effect feedback popup countdown`, line 83-86 `$effect survey popup countdown`, line 103-113 `$effect entity tabs + activeElection`, line 115-120 `$effect activeMatches`, line 175-184 `$effect drawer tracking event`. Migrate each deliberately — the tabs ones (103-120) get replaced by $derived-on-URL, the tracking ones (67, 175-184) port to the new shape preserving behaviour.

**Warning signs:** "Feedback popup stopped firing after results navigation" / "analytics events missing for drawer opens".

### Pitfall 7: URL parameter naming mismatch between matcher file and folder bracket

**What goes wrong:** Folder `[[entityTypePlural=entityTypePlural]]` looks for a matcher exported from `src/params/entityTypePlural.ts`. If the folder is named `[[entityTypePlural=plural]]` but the file is `entityTypePlural.ts`, SvelteKit errors with "no matcher named 'plural'".

**Why it happens:** Two independent naming spots; easy to drift.

**How to avoid:** Matcher file names and folder bracket matcher names MUST match exactly. Pattern in the codebase already: `src/params/entityType.ts` → `[entityType=entityType]`. Adopt the same convention.

**Warning signs:** `yarn dev` build error "Unknown matcher 'X'".

---

## Code Examples

Verified patterns from official Svelte docs and the existing codebase:

### Example 1: Minimal $derived pattern replacing $effect state writes
```js
// Source: https://svelte.dev/docs/svelte/%24derived
// [CITED from Svelte docs]
// DO this
let square = $derived(num * num);

// DON'T do this
let square;
$effect(() => {
  square = num * num;
});
```

### Example 2: $effect cleanup function
```ts
// Source: https://svelte.dev/docs/svelte/$effect
$effect(() => {
  const unsubscribe = store.subscribe(fn);
  return unsubscribe;  // Called before next re-run or on destroy
});
```

### Example 3: SvelteKit param matcher
```ts
// Source: https://svelte.dev/docs/kit/advanced-routing
// apps/frontend/src/params/entityTypePlural.ts
import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param): param is 'candidates' | 'organizations' =>
  param === 'candidates' || param === 'organizations';
```

### Example 4: Programmatic navigation via goto (D-09 URL mutations)
```ts
// Source: https://svelte.dev/docs/kit/$app-navigation
import { goto } from '$app/navigation';

// Election change
function handleElectionChange({ option }: { option: Election }) {
  goto(`/results/${option.id}/${page.params.entityTypePlural ?? 'candidates'}`);
}

// Tab change
function handleTabChange({ index }: { index?: number }) {
  if (index == null) return;
  goto(`/results/${page.params.electionId}/${ENTITY_PLURALS[index]}`);
}

// Entity click (card <a> href does this naturally — no goto needed for link click)

// Drawer close
function handleDrawerClose() {
  const { electionId, entityTypePlural } = page.params;
  goto(`/results/${electionId}/${entityTypePlural ?? ''}`);
}
```

### Example 5: Existing param matcher shape (template for new matchers)
```ts
// Source: apps/frontend/src/params/entityType.ts [VERIFIED: file read]
export function match(param: string) {
  return ['candidate', 'party'].includes(param);
}
```
Note `party` vs `organization` — see Open Question 2.

### Example 6: Existing voterContext Symbol-based setContext/getContext pattern (template for filterContext)
```ts
// Source: apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:23-35 [VERIFIED: file read]
const CONTEXT_KEY = Symbol();

export function getVoterContext(): VoterContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getVoterContext() called before initVoterContext()');
  return getContext<VoterContext>(CONTEXT_KEY);
}

export function initVoterContext(): VoterContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initVoterContext() called for a second time');
  // ... build context
  return setContext<VoterContext>(CONTEXT_KEY, { /* ... */ });
}
```

### Example 7: Filtered-list $derived using version counter bridge (Pattern 1 + Pattern 2 combined)
```ts
// Source: derived from patterns 1+2 above; no external verification — apply to filterContext
// In filterContext.svelte.ts
let version = $state(0);

$effect(() => {
  const fg = _filterGroup;
  if (!fg) return;
  const handler = () => { version++; };
  fg.onChange(handler);
  return () => fg.onChange(handler, false);
});

// In EntityListWithControls.svelte
import { getFilterContext } from '$lib/contexts/filter';
const fctx = getFilterContext();

const filtered = $derived.by(() => {
  fctx.version;  // subscribe
  return fctx.filterGroup ? fctx.filterGroup.apply(entities) : [...entities];
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `$effect(() => { state = compute(deps); })` | `let state = $derived(compute(deps));` | Svelte 5 GA (Oct 2024) `[CITED: https://svelte.dev/docs/svelte/$derived]` | Removes entire bug class — microtask races, circular chains, double-fires — because `$derived` is a pure read-only reactive expression with intrinsic dependency tracking. |
| `<slot />` in layout | `{@render children()}` | Svelte 5 GA | Existing results `+layout.svelte:40` already uses runes-mode `{ children }: { children: Snippet }` + `{@render children()}` pattern (implicit via page routing). Do NOT revert. |
| `$page` from `$app/stores` (classic store) | `page` from `$app/state` (rune-aware) | SvelteKit ~2.12, current in project | Existing `+layout.svelte:19` already uses `import { page } from '$app/state'` — continue this idiom. |
| Callback-based filter subscription (`filterGroup.onChange(updateFilters)` + local $state) | Derived + version counter (Pattern 1) | Phase 62 (this) | Single source of truth; no state sync needed; no circular chains. Keeps `@openvaa/filters` API unchanged (D-07). |
| One-route-per-page with separate list + detail routes | Optional-bracket shared route (D-08) | Phase 62 | Enables drawer-over-list pattern with shareable URLs; collapses 2 routes into 1. |

**Deprecated/outdated:**
- `$effect.pre` for pre-render state sync — not needed; use `$derived`.
- Manual `onMount` + `onDestroy` for subscription lifecycle — use `$effect` with cleanup return (Pitfall 2 example).
- `activeElectionId = $state<Id | undefined>(undefined)` in `+layout.svelte:94` — becomes `$derived(page.params.electionId)`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Option B (version counter via `onChange`) is the simplest $derived reactivity bridge; Option A (`$state`-wrap the FilterGroup instance) is viable but requires more invariants. | Standard Stack Alternatives Considered + Pattern 1 | LOW — both options satisfy D-06. If Option B misses a mutation path (e.g., a filter type that forgets to call `doOnChange`), switch to Option A. Empirically verifiable with a single toggle E2E. |
| A2 | Streaming SSR or `content-visibility: auto` are the cheapest drawer-first-paint mechanisms (D-10) vs paint-order CSS vs prioritized load function. | Pattern 5 | MEDIUM — planner's discretion per CONTEXT.md. If first-paint measurement on the chosen mechanism regresses vs the current `+layout.svelte` path, revisit. |
| A3 | Redirect `/results/[electionId]` → `/results/[electionId]/candidates` (canonicalize via load fn) is preferred over render-with-default. | Alternatives Considered | LOW — Claude's discretion per CONTEXT.md. Render-with-default is viable if product wants to preserve the "bare" URL. |
| A4 | The `EntityListControls.svelte` file stays on disk after Phase 62 (not deleted) because two non-results callers (`EntityChildren.svelte`, `nominations/+page.svelte`) still import it and their migration is deferred per CONTEXT.md. | Pitfall 4 + Runtime State Inventory | MEDIUM — conflicts with D-01's literal "delete" directive. Resolution via Open Question 3. |
| A5 | The refactor uses American spelling (`organization`, `organizations`) for matcher-returned values and URL segments, matching the existing `ENTITY_TYPE.Organization = 'organization'` constant and `common.organization.plural = 'organizations'` i18n value — NOT the British spelling used in parts of CONTEXT.md. | Anti-Patterns to Avoid + Open Question 1 | HIGH if ignored — breaks deep-linking if URLs use one spelling and code uses another. Resolution via Open Question 1 (recommend American spelling per codebase consistency). |
| A6 | `page.params.entityTypePlural` is `undefined` when the URL is `/results/[electionId]` with no plural segment (SvelteKit optional-bracket semantics). | Pattern 3 + Pattern 4 | LOW — standard SvelteKit behaviour `[CITED: https://svelte.dev/docs/kit/advanced-routing]`. Verified at runtime. |
| A7 | `FilterGroup.apply(entities)` is pure — no side effects on `entities` or on internal state beyond what's documented in `_onChange` emission. | Pattern 2 | LOW — `[VERIFIED: packages/filters/src/group/filterGroup.ts:46-52 — returns combineResults() over a map of filter.apply(targets); combineResults performs set operations, no mutation]`. |
| A8 | `TextPropertyFilter.apply` is pure w.r.t. entities. | Pattern 2 | LOW — `[VERIFIED: packages/filters/src/filter/base/filter.ts:92-105 — uses Array.filter, no mutation]`. |
| A9 | The 7-locale fan-out rule (en, fi, sv, fr, et, da, lb) applies when ANY new i18n key is introduced. | Project Constraints + UI-SPEC | LOW — UI-SPEC states zero new keys in happy path; only `results.drawer.loadingDetails` optional. `[VERIFIED: UI-SPEC Copywriting Contract]` |
| A10 | Filter state is session-scoped (per browser tab) — not persisted to localStorage or URL — and resetting on scope change (D-14) is via `$derived` returning a different `FilterGroup` instance from the `FilterTree` (no data migration). | Pattern 1 + Runtime State Inventory row "Stored data" | LOW — matches the existing filterStore construction, which rebuilds the tree on dependency changes. |

---

## Open Questions

1. **American vs British spelling in URL matchers and CONTEXT.md text.**
   - What we know: Codebase uses `organization` / `organizations` uniformly (ENTITY_TYPE enum, i18n keys, app settings). CONTEXT.md D-08/D-11 use `organisations` / `organisation`.
   - What's unclear: Whether CONTEXT.md's British spelling is a deliberate product choice (unlikely — no pattern elsewhere) or a drafting typo.
   - Recommendation: **Use American spelling** in matchers, route segments, and URLs: `/results/[electionId]/organizations/organization/[id]`. Treat CONTEXT.md's British spelling as a drafting typo. Flag in Plan 62-02 for user confirmation before committing the matcher.

2. **Existing `src/params/entityType.ts` matcher returns `candidate | party` — what does `party` refer to?**
   - What we know: `ENTITY_TYPE.Organization = 'organization'`, no `party` type exists in `@openvaa/data` `[VERIFIED: entityTypes.ts]`. i18n has `common.organization` and `results.organization`, no `results.party`. BUT Playwright tests assert on the string "parties" visible in the UI via i18n (e.g., `visibility-regression.spec.ts`, `voter-results.spec.ts:64` asserts `parties` tab label).
   - What's unclear: Is `party` a visible-to-user UI label that internally maps to `organization`? Does the existing matcher accepting `party` imply some legacy URL path uses `party` as an alias?
   - Recommendation: Grep the codebase for runtime route values matching `entityType = 'party'` — if none, the matcher is dead legacy code and the new `entityTypeSingular` matcher can safely accept `candidate | organization` (not `party`). Confirm in Plan 62-02 before authoring the new matchers. Existing matcher file `entityType.ts` should be **deleted** once the `[entityType]/[entityId]/` route folder is removed.

3. **`EntityListControls.svelte` deletion scope.**
   - What we know: D-01 says "deleted once every call site in the results layout is migrated". D-02 says `EntityListWithControls` is additive; other-surface migration is deferred. 2 external callers exist (`EntityChildren.svelte`, `nominations/+page.svelte`).
   - What's unclear: Whether "delete" in D-01 means file-level delete (breaks external callers) or import-level delete from the results layout only.
   - Recommendation: Interpret as import-level. Keep `EntityListControls.svelte` and its `.type.ts` on disk. Remove it from the results-layout import chain; leave barrel export intact. Delete in the deferred follow-up sweep when other callers migrate.

4. **Drawer-first-paint mechanism (D-10).**
   - What we know: CONTEXT.md lists 3 mechanisms (streaming SSR, prioritized load fn, CSS paint-order). UI-SPEC says "acceptance check: manual Playwright trace or Lighthouse LCP indicates the drawer content is painted before the list body on a cold load".
   - What's unclear: Which mechanism actually produces the observable UX; whether a naïve render-order (drawer markup before list markup in the DOM) plus `content-visibility: auto` on the list is sufficient.
   - Recommendation: Plan 62-03 should start with the cheapest option (source-order + `content-visibility: auto`) and only escalate to streaming SSR if measurement shows insufficient gap. Include a Playwright trace or Lighthouse screenshot in plan verification.

5. **`FilterGroup` reactivity wrapping shape (Option A vs Option B).**
   - What we know: CONTEXT.md Claude's Discretion leaves this open. Both options satisfy D-06.
   - What's unclear: Whether any existing consumer reaches into `filterGroup` state in a way that makes Option A (wrap instance in $state) break. `EntityFilters` component already assumes the FilterGroup reference is stable — Option B preserves that, Option A technically reassigns.
   - Recommendation: Use Option B. Only switch to Option A if Option B empirically fails for a specific filter type (which would indicate a bug in that filter's `doOnChange` path, not the bridge).

6. **`resultsAvailable` gating and the 4-segment route.**
   - What we know: The current `+layout.svelte` shows `results.title.results` vs `results.title.browse` based on `resultsAvailable`. The `resultsAvailable` computation (voterContext.svelte.ts:188-198) depends on `answers` + `opinionQuestions` + `minimumAnswers` setting, not on the URL.
   - What's unclear: Whether deeplinking to `/results/[electionId]/organizations/candidate/[id]` when `resultsAvailable === false` should still show the drawer, or redirect to the intro/questions flow.
   - Recommendation: Preserve current behaviour — the layout-level gate `{#if Object.values(nominationsAvailable).some(Boolean)}` wraps everything. Drawer deeplink in the no-nominations state degrades to the "no nominations" fallback page (existing behaviour). Confirm in Plan 62-02 load function.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | Yarn + Vite + Svelte build | ✓ | v22.4.0 `[VERIFIED: node --version]` | — |
| Yarn | Workspace commands | ✓ | 4.13.0 `[VERIFIED: yarn --version]` | — |
| Svelte compiler (via @sveltejs/vite-plugin-svelte) | Component compilation, runes | ✓ | via `svelte@^5.53.12` + `@sveltejs/vite-plugin-svelte@^5.1.1` | — |
| SvelteKit | Routing, matchers, optional params | ✓ | `^2.55.0` | — |
| Vitest | Unit test runner | ✓ | `^3.2.4` with jsdom env at `apps/frontend/vitest.config.ts` | — |
| Playwright | E2E test runner | ✓ | From `@playwright/test@catalog:` | — |
| TypeScript | Type checking | ✓ | `^5.8.3` | — |
| Supabase local | Integration for E2E | ✓ | via `yarn dev` / `supabase start` (not required for unit tests) | — |
| @openvaa/filters | Consumed read-only (D-07) | ✓ | workspace | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

Phase 62 is pure application-tier work — no external tools beyond the existing dev stack.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework (unit) | Vitest `^3.2.4` with jsdom environment `[VERIFIED: .yarnrc.yml + apps/frontend/vitest.config.ts]` |
| Framework (E2E) | Playwright via `@playwright/test` `[VERIFIED: package.json test:e2e script]` |
| Config file (unit, frontend) | `apps/frontend/vitest.config.ts` `[VERIFIED]` |
| Config file (E2E) | `tests/playwright.config.ts` `[VERIFIED: package.json — 'playwright test -c ./tests/playwright.config.ts ./tests']` |
| Quick run command (frontend unit) | `yarn workspace @openvaa/frontend test:unit` |
| Quick run command (single Vitest file) | `yarn workspace @openvaa/frontend test:unit -- run apps/frontend/src/lib/contexts/filter/filterContext.svelte.test.ts` |
| Quick run command (Playwright voter results) | `yarn playwright test -c ./tests/playwright.config.ts ./tests/tests/specs/voter/voter-results.spec.ts --workers=1` |
| Full suite command (frontend unit) | `yarn test:unit` (runs all workspaces) |
| Full suite command (E2E) | `yarn dev:reset && yarn dev && yarn test:e2e` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RESULTS-01 | `EntityListWithControls` renders entities; toggle filter → filtered list shrinks without infinite loop | unit (Vitest + @testing-library/svelte if available, else component instance snapshot) | `yarn workspace @openvaa/frontend test:unit -- run apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts` | ❌ Wave 0 |
| RESULTS-01 | No infinite loop when filters are toggled (smoke) | E2E | `yarn playwright test -c ./tests/playwright.config.ts ./tests/tests/specs/voter/voter-results.spec.ts -g "filter" --workers=1` | ⚠️ existing voter-results.spec.ts has no filter test — Wave 0 adds one |
| RESULTS-02 | Filter modal opens; checking a filter narrows candidate count; resetting filters restores full count; filter state persists across drawer open/close | E2E | same spec, new test | ⚠️ Wave 0 adds |
| RESULTS-02 | Filter state resets on plural-tab switch (candidates → organizations) | E2E | same spec, new test | ⚠️ Wave 0 adds |
| RESULTS-02 | Filter state resets on election switch | E2E | same spec, new test | ⚠️ Wave 0 adds |
| RESULTS-03 | List-only route `/results/[electionId]` renders the default plural | unit (param matcher) + E2E | matcher: `yarn workspace @openvaa/frontend test:unit -- run apps/frontend/src/params/entityTypePlural.test.ts`; E2E: existing voter-results.spec.ts `test('should display candidates section with result cards')` still passes against the new path | ❌ matcher test + ✅ existing list test |
| RESULTS-03 | List + drawer route `/results/[electionId]/candidates/candidate/[id]` renders both | E2E | new test in voter-results.spec.ts | ⚠️ Wave 0 adds |
| RESULTS-03 | Edge case `/results/[electionId]/organizations/candidate/[id]` renders orgs list with candidate drawer | E2E | new test | ⚠️ Wave 0 adds |
| RESULTS-03 | Browser Back/Forward steps through tab + drawer changes | E2E | new test | ⚠️ Wave 0 adds |
| RESULTS-03 | Invalid matcher value returns 404 | E2E | `goto('/results/elec-X/invalidplural')` → expect 404 | ⚠️ Wave 0 adds |
| RESULTS-03 | Coupling rule: `[[entityTypeSingular]]` alone (no `[[id]]`) → redirect or 404 | E2E | `goto('/results/elec-X/candidates/candidate')` → redirect/404 | ⚠️ Wave 0 adds |
| RESULTS-03 | Drawer-first paint on deeplink (D-10) | manual-only E2E with Playwright trace / Lighthouse LCP | manual verification with `npx playwright test --trace on` | manual — not blocking unit/E2E gate |

### Sampling Rate

- **Per task commit:** `yarn workspace @openvaa/frontend test:unit` + Svelte typecheck (`yarn workspace @openvaa/frontend check`) — fast, <30s for the affected files.
- **Per wave merge:** Full frontend Vitest + the `voter-results.spec.ts` E2E file under `--workers=1`.
- **Phase gate:** Full Vitest suite + full E2E suite with parity diff vs. SHA `3c57949c8` (Phase 63 baseline reference from STATE.md §Decisions).

### Wave 0 Gaps

- [ ] `apps/frontend/src/lib/contexts/filter/filterContext.svelte.test.ts` — unit test for `initFilterContext` + `getFilterContext` + version counter + scoping (covers RESULTS-02 reactivity contract).
- [ ] `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts` — unit test harness for the new component (covers RESULTS-01 contract: no infinite loop; filter mutation narrows list).
- [ ] `apps/frontend/src/params/entityTypePlural.test.ts` — matcher unit test (valid values return true; invalid return false).
- [ ] `apps/frontend/src/params/entityTypeSingular.test.ts` — matcher unit test.
- [ ] `tests/tests/specs/voter/voter-results.spec.ts` — extend with: filter toggle narrows list (RESULTS-02), filter state across drawer open/close (RESULTS-02, D-15), filter reset on plural switch (RESULTS-02, D-14), filter reset on election switch (RESULTS-02, D-14), deeplink drawer-only URL (RESULTS-03 edge case), org-list-with-candidate-drawer (RESULTS-03 edge case), Back/Forward tab navigation (RESULTS-03, D-13), matcher 404 (RESULTS-03), coupling-rule redirect (RESULTS-03).
- [ ] Framework install: not needed — Vitest + Playwright already configured.
- [ ] No shared fixtures needed — reuse `answeredVoterPage` from `tests/tests/fixtures/voter.fixture.ts` `[VERIFIED: voter-results.spec.ts:18]`.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | This phase doesn't touch auth. Voter flow is unauthenticated (anonymous session cookie). |
| V3 Session Management | no | No new session state. Filter state is SPA-local (not persisted). |
| V4 Access Control | no | No new access-controlled resources. Existing `(voters)/(located)/+layout.svelte` gate is preserved. |
| V5 Input Validation | yes | URL param values validated by SvelteKit param matchers (`entityTypePlural`, `entityTypeSingular`) before the route component mounts. Matcher function returns `false` → SvelteKit returns 404. Entity `id` is currently unvalidated by matcher — validated downstream by `getEntityAndTitle` (throws on not-found → caught and rendered as error). |
| V6 Cryptography | no | No cryptographic operations. |
| V7 Error Handling / Logging | partial | Existing `logDebugError` pattern preserved. Drawer-entity-not-found degrades silently to list view with debug log (existing behaviour — UI-SPEC confirms this is intentional). |
| V8 Data Protection | no | No sensitive data in URLs (IDs are UUIDs; public); no new persistence. |
| V13 Configuration | no | No new runtime config. |

### Known Threat Patterns for SvelteKit + Svelte 5 + URL-driven state

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| URL parameter tampering — deeplink with malformed `entityTypePlural` | Tampering | SvelteKit param matcher returns `false` → 404. New matchers MUST enforce the exact allowed value set (D-11). |
| URL parameter tampering — `[[id]]` pointing to an entity not in the current election's pool | Tampering / Information Disclosure (minor) | `getEntityAndTitle` throws → caught, debug-logged, drawer stays closed. Existing behaviour; UI-SPEC row "Deeplink to entity not found" confirms silent degradation is acceptable. |
| Coupling-rule bypass — `[[entityTypeSingular]]` without `[[id]]` | Tampering | Load function guard (redirect 307 or error 404 per D-11). |
| Stored XSS via entity name rendered in drawer | Tampering / Cross-site scripting | Existing `EntityDetails` component handles entity name rendering; Svelte's default `{...}` interpolation is HTML-safe. `{@html}` only used with `sanitizeHtml(...)` per `+layout.svelte:208-214`. No new entity-content rendering path introduced. |
| Open redirect via crafted URL in `goto(...)` | Tampering | `goto(...)` accepts only same-origin paths by default `[CITED: https://svelte.dev/docs/kit/$app-navigation]`. All `goto` calls in this phase construct paths from `page.params` (already validated) and literal route strings. No user-controlled string flows to `goto` URL. |

---

## Sources

### Primary (HIGH confidence)
- `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` — the 306-line target file `[VERIFIED: file read]`
- `apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte` — loop site lines 56-73 `[VERIFIED: file read]`
- `apps/frontend/src/lib/dynamic-components/entityList/EntityList.svelte` — primitive `[VERIFIED: file read]`
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` — context composition template `[VERIFIED: file read]`
- `apps/frontend/src/lib/contexts/voter/filters/filterStore.svelte.ts` — existing FilterTree builder `[VERIFIED: file read]`
- `apps/frontend/src/routes/(voters)/(located)/results/[entityType]/[entityId]/+page.svelte` — existing detail route `[VERIFIED: file read]`
- `apps/frontend/src/params/entityType.ts` — existing matcher template `[VERIFIED: file read]`
- `packages/filters/src/group/filterGroup.ts` — `apply`, `onChange`, `reset`, `doOnChange` semantics `[VERIFIED: file read]`
- `packages/filters/src/filter/base/filter.ts` — `setRule`, `onChange`, `active` semantics `[VERIFIED: file read]`
- `packages/filters/src/filter/text/textPropertyFilter.ts` + `textFilter.ts` — search filter used in UI `[VERIFIED: file read]`
- `packages/data/src/objects/entities/base/entityTypes.ts` — `ENTITY_TYPE` enum, confirms American spelling `[VERIFIED: file read]`
- `apps/frontend/svelte.config.js` — confirms `runes: true` global mode `[VERIFIED: file read]`
- `.yarnrc.yml` — pins `svelte ^5.53.12`, `@sveltejs/kit ^2.55.0`, `daisyui ^5.5.14`, `vitest ^3.2.4` `[VERIFIED: file read]`
- `apps/frontend/vitest.config.ts` — unit test config with jsdom env and path aliases `[VERIFIED: file read]`
- `tests/tests/specs/voter/voter-results.spec.ts` — existing E2E harness, `answeredVoterPage` fixture `[VERIFIED: file read]`
- `.planning/phases/62-results-page-consolidation/62-CONTEXT.md` — full D-01 through D-15 `[VERIFIED]`
- `.planning/phases/62-results-page-consolidation/62-UI-SPEC.md` — interaction contract, component inventory, copywriting `[VERIFIED]`
- `.planning/REQUIREMENTS.md` — RESULTS-01/02/03 text `[VERIFIED]`
- `.planning/ROADMAP.md` §Phase 62 — SC-1 through SC-4 `[VERIFIED]`
- `.planning/todos/pending/entity-list-controls-infinite-loop.md` — root cause + 2 failed attempts `[VERIFIED]`
- `.planning/phases/60-layout-runes-migration-hydration-fix/60-RESEARCH.md` §Common Pitfalls — `effect_update_depth_exceeded` + `untrack` pattern `[VERIFIED]`

### Secondary (MEDIUM confidence — verified against official docs)
- Svelte 5 `$derived` — `[CITED: https://svelte.dev/docs/svelte/%24derived]` via ctx7
- Svelte 5 `$state` in classes — `[CITED: https://svelte.dev/docs/svelte/%24state — 'Use Reactive State in Classes']` via ctx7
- Svelte 5 `untrack` — `[CITED: https://svelte.dev/docs/svelte/svelte — 'untrack function']` via ctx7
- Svelte 5 runtime error `effect_update_depth_exceeded` — `[CITED: https://svelte.dev/docs/svelte/runtime-errors/llms.txt]` via ctx7
- SvelteKit optional route params — `[CITED: https://svelte.dev/docs/kit/advanced-routing — 'Define Optional Route Parameter']` via ctx7
- SvelteKit param matchers — `[CITED: https://svelte.dev/docs/kit/llms.txt — 'Define a Custom Parameter Matcher']` via ctx7
- SvelteKit `goto` — `[CITED: https://svelte.dev/docs/kit/%24app-navigation — 'goto(url, opts)']` via ctx7
- SvelteKit shallow routing — `[CITED: https://svelte.dev/docs/kit/shallow-routing]` (not adopted — we use full navigation)

### Tertiary (LOW confidence — not used for load-bearing claims)
- None. All claims in this document map to Primary or Secondary sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all library versions verified against `.yarnrc.yml`, all new modules compose from existing files.
- Architecture: HIGH — Patterns 1/2/3/4/5 all grounded in Svelte 5 docs + codebase precedents (voterContext, existing matchers, existing Tabs).
- Pitfalls: HIGH — Pitfalls 1/2/3/4/5/6/7 cover every root cause I can identify; 4 of 7 are grounded in `[VERIFIED]` observations (loop chain, external callers, matcher naming, spelling); 3 (Pitfalls 2, 3, 6) are Svelte 5 / SvelteKit idiom hazards flagged by docs + general refactor discipline.
- Environment: HIGH — all tools already installed and verified.
- Validation: HIGH — existing test infrastructure (Vitest + Playwright + answeredVoterPage fixture) is load-bearing and well-documented; Wave 0 gaps are clearly enumerated.
- Security: MEDIUM — SvelteKit-idiom-level threat analysis only. No new auth, no crypto, no sensitive data flows; the 4 threat patterns above are the practical surface.

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (30 days — stable stack, no fast-moving dependencies). Re-verify if Svelte 5.x or SvelteKit 2.x releases a major change to `$derived` semantics or `[[param=matcher]]` syntax in the interim.
