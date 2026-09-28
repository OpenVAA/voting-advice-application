# Phase 62: Results Page Consolidation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-04-24
**Phase:** 62-results-page-consolidation
**Areas discussed:** Merge strategy, `$derived` refactor (loop + global filter state), Route collapse, Active-tab wiring + filter persistence

---

## Gray Area Selection

All 4 areas selected.

---

## Merge Strategy

### Q1: Target shape

| Option | Selected |
|--------|----------|
| New combined `EntityListWithControls` wrapping EntityList | ✓ |
| Fold controls INTO EntityList | |
| Inline controls into results/+layout.svelte | |

### Q2: Backward compatibility

| Option | Selected |
|--------|----------|
| EntityList unchanged; EntityListWithControls additive | ✓ (user note: add todo to sweep EL consumers → ELWC later) |
| Breaking: delete EntityList, consumers migrate | |
| Rename: EntityList → EntityListCore, new EntityList = combined | |

### Q3: Controls layout inside new component

| Option | Selected |
|--------|----------|
| Fixed layout — search + filter above list | ✓ |
| Snippet-based | |
| CSS-variable customization | |

---

## `$derived` Refactor — Loop Elimination + Global Filter State

### Q1: Loop fix shape

| Option | Selected |
|--------|----------|
| Full $derived — drop filterGroup.onChange entirely | ✓ |
| Keep onChange, gate with version counter | |
| Rewrite FilterGroup to be $state-native | |

### Q2: Filter state home (after user pivot — "globally accessible for future LLM chat")

| Option | Selected |
|--------|----------|
| New dedicated filterContext (parallel to voterContext) | ✓ (user note: "bundle it in the voterContext for convenience like other inherited ctxs") |
| Extend voterContext with filter state | |
| Module-level runes store | |
| Inside appContext | |

**User note:** Dedicated `filterContext` module, but bundle/re-export through voterContext for ergonomic consumption. Matches how voterContext composes with app/data/component/i18n contexts today. LLM chat consumes `getFilterContext()` directly; voter flow uses voterContext convenience.

### Q3: API shape

| Option | Selected |
|--------|----------|
| Direct FilterGroup ref + typed mutator methods | ✓ |
| Snapshot + dispatch (Redux-style) | |
| Pub/sub observable + imperative mutators | |
| Design deferred | |

### Q4: @openvaa/filters scope

| Option | Selected |
|--------|----------|
| No — all work consumer-side | ✓ |
| Minimal — add reactive wrapper helper | |
| Partial FilterGroup refactor | |

---

## Route Collapse

### Q1 (first pass): Optional brackets

| Option | Selected |
|--------|----------|
| SvelteKit optional brackets `[[entityType]]/[[entityId]]` + delete empty +page.svelte | ✓ |
| Keep structure + matcher fallback | |
| Flatten into query string | |

### Q2 (first pass): URL + history behavior

| Option | Selected |
|--------|----------|
| Path-based (current behavior) | ✓ |
| pushState without navigation | |
| Hash-based | |

### Q3 (first pass): Standalone deeplink behavior

| Option | Selected |
|--------|----------|
| List + drawer open | ✓ (user note: "if possible, let the list render in the bg while prioritising the drawer") |
| Just the detail (full-page) | |
| Redirect to list with query flag | |

**User note:** Prioritize drawer rendering over list on full-page-load — drawer is focal, list is background. D-10.

### Q4 (first pass): Invalid entityType handling

| Option | Selected |
|--------|----------|
| Typed matcher rejects invalid → 404 | ✓ (user note: "also make a note that we must still carry the election and constituency selection in the url") |
| Accept any, fall back to first tab | |
| Accept any, render 'not found' in drawer | |

**User note:** Election + constituency must be carried in the URL so new-window deeplinks work. Previously `session-storage-election-constituency` todo; now partly in Phase 62 scope.

### Q1 (second pass, election placement): Query params vs path

| Option | Selected |
|--------|----------|
| Path prefix: /results/[electionId]/[constituencyId]/... | |
| Query params | ✓ (initial answer — later superseded by path-based plural/singular shape below) |
| Session-with-URL-fallback | |
| New base /vote/... | |

**User note (initial):** Query params for Phase 62, with a separate todo for shorter IDs + multi-election/constituency selection refactor.

**User re-clarification:** "The results page also includes an election selector when there are many elections. Perhaps we should add this to the results route path before entityType, bc with these 3 details we can always find the right nomination to show... also, there's an edge case in which the user has selected 'organisation' as the entity type but we render in the entity list the top-X candidates for each party i.e. organisation; now if the user clicks on a candidate and we just append the entityId to the path, it won't do. So in the end it seems that we must separate the entity shown, from the results view selected. We could map this as /results/[electionId]/[entityTypePlural]/[entityTypeSingular]/[id]"

This superseded the query-param direction. The path-based shape with plural/singular separation was adopted. Final schema:

### Q1 (third pass — final path schema)

| Option | Selected |
|--------|----------|
| Both plural and (singular+id) independently optional: `/results/[electionId]/[[entityTypePlural]]/[[entityTypeSingular]]/[[id]]` | ✓ |
| plural required, singular+id optional | |
| All four required past election | |

### Q2 (third pass — URL mutation rules)

| Option | Selected |
|--------|----------|
| Election / plural-tab / entity click all update URL; drawer shown iff singular+id present | ✓ |
| Debounce rapid tab toggles | |
| Election reloads, others pushState | |

### Q3 (third pass — Phase 62 scope)

| Option | Selected |
|--------|----------|
| Full /results path refactor in Phase 62 + separate todo for follow-ups | ✓ |
| Narrow Phase 62, add RESULTS-04 for path refactor | |
| Full voter-flow migration in Phase 62 | |

---

## Active Tab Wiring + Filter State Persistence

### Q1: Tab wiring

| Option | Selected |
|--------|----------|
| URL-driven (read $page.params) | ✓ |
| Hybrid ($state synced via $effect) | |
| Load-function derived | |

### Q2: Filter state scoping

| Option | Selected |
|--------|----------|
| Per (election, plural) tuple | ✓ |
| Session-global | |
| Per-plural only | |
| Per-election only | |

### Q3: Drawer open/close persistence

| Option | Selected |
|--------|----------|
| Filters survive drawer open/close | ✓ |
| Reset on drawer close | |
| Reset on drawer open | |

---

## Claude's Discretion

- Plan split within Phase 62
- Exact drawer-prioritization mechanism for D-10
- FilterGroup reactivity wrapping shape at consumer
- Canonicalization redirect for `/results/[electionId]` → default plural
- Tabs label i18n if copy changes

## Deferred Ideas

- Sweep EntityList consumers to adopt EntityListWithControls
- Shorter IDs in URLs
- Multi-election/constituency selection handling
- Extend URL-based carrying to /questions, /elections
- @openvaa/filters internal refactor
- Redux-style snapshot+dispatch API for LLM chat (if direct-ref proves insufficient)
- Snippet-based controls customization
- Centralized overlay architecture (carried forward from Phase 60)
