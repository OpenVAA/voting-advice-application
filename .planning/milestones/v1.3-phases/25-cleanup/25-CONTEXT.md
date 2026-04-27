# Phase 25: Cleanup - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning
**Source:** Auto-selected defaults

<domain>
## Phase Boundary

Resolve all v1.3-scoped TODO[Svelte 5] markers in voter/shared component scope and update candidate app call sites where shared components changed API (snippet syntax, callback props). This is NOT a full candidate app migration (deferred to v1.4 as CAND-01) — only syntax-only fixes where shared component APIs broke existing candidate call sites.

</domain>

<decisions>
## Implementation Decisions

### TODO[Svelte 5] marker scoping (CLEAN-01)
- **v1.3 scope (resolve in this phase):**
  - `apps/frontend/src/lib/components/entityFilters/EntityFilters.svelte:35` — "Check if needed" (type guard wrapper function)
  - `apps/frontend/src/lib/components/video/Video.svelte:520` — "Convert to init function" (load() method)
  - `apps/frontend/src/lib/components/input/Input.svelte:337` — "Use snippets instead of class variables"
  - `apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte:82` — "Check if necessary" (update() wrapper function)
  - `apps/frontend/src/lib/i18n/tests/utils.test.ts:6` — "Probably not needed anymore" (vi.mock for $env)
  - `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte:6` — "Maybe convert into $snippet"
- **Deferred to v1.4 (context system / admin scope — do NOT resolve):**
  - `apps/frontend/src/lib/contexts/admin/jobStores.ts:53` — subscription counting (CTX scope)
  - `apps/frontend/src/lib/contexts/admin/jobStores.type.ts:21,26` — subscription counting types (CTX scope)
  - `apps/frontend/src/lib/contexts/utils/pageDatumStore.ts:7` — subproperty subscriptions (CTX-02 scope)
  - `apps/frontend/src/lib/contexts/data/dataContext.ts:60` — native reactivity replacement (CTX-03 scope)
  - `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte:7` — subscription counting (admin scope)
  - `apps/frontend/src/routes/(voters)/(located)/+layout.svelte:90` — awaitNominationsSettled rewrite (depends on store-to-runes, explicitly deferred in Phase 24)
  - `apps/frontend/src/routes/+layout.svelte:56` — centralized page.data handling (CTX scope)

### Resolution approach for ambiguous markers
- "Check if needed" / "Check if necessary" markers (EntityFilters, ConstituencySelector): Investigate whether the wrapper function is still needed in Svelte 5 runes mode. If the underlying issue is resolved by runes, remove the wrapper and the TODO. If the wrapper is still necessary, remove only the TODO marker.
- "Probably not needed anymore" (i18n test mock): Test without the mock. If tests pass, remove the mock and the TODO. If they fail, keep the mock and remove the TODO.
- "Maybe convert into $snippet" (EntityCardAction): Evaluate whether converting to a snippet is a clean improvement. If yes, convert. If it requires significant refactoring beyond this phase's scope, remove the TODO marker and add a regular TODO for future work.
- "Use snippets instead of class variables" (Input): Evaluate if snippets for label/input/icon areas is a reasonable improvement. If it requires significant consumer changes, defer and remove the TODO marker.
- "Convert to init function" (Video.load): Refactor to an init pattern that's called on first use. This is a localized change within the Video component.

### Candidate call site update depth (CLEAN-02)
- **Syntax-only fixes** — update candidate app code ONLY where a shared component's API changed and the old call site no longer works
- Do NOT add `<svelte:options runes />` to candidate route files
- Do NOT convert candidate `$:` reactive statements, `export let`, or `on:event` directives — that's CAND-01 (v1.4)
- Do NOT convert candidate `<slot />` in candidate layouts — that's candidate-specific code, not a shared component API change
- **Known breakage points to check:**
  - Candidate routes using `Expander` component — verify callback prop API still works (onExpand/onCollapse vs on:expand/on:collapse)
  - Candidate routes using `MainContent` — already updated to snippet syntax (confirmed in codebase scout)
  - Candidate routes with `on:submit|preventDefault` and `on:change` — these are native HTML events on candidate-owned elements, NOT shared component API changes. Leave as-is for CAND-01.

### Cross-phase conventions carried forward
- Per-component `<svelte:options runes />` (Phase 22) — applies to any newly-migrated shared components only, not candidate files
- E2E test verification at phase end, not per-file (Phase 22)
- Both apps must remain compilable throughout (Phase 22)

### Claude's Discretion
- Exact resolution approach for each TODO marker (within the guidelines above)
- Whether EntityCardAction snippet conversion is worthwhile or should be deferred
- Whether Input.svelte class variable → snippet conversion is feasible in this phase
- Plan batching and task ordering

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### TODO[Svelte 5] marker files (read each to understand the marker context)
- `apps/frontend/src/lib/components/entityFilters/EntityFilters.svelte` — Type guard wrapper TODO
- `apps/frontend/src/lib/components/video/Video.svelte` — load() init pattern TODO
- `apps/frontend/src/lib/components/input/Input.svelte` — Snippet class variables TODO
- `apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte` — Reactive update wrapper TODO
- `apps/frontend/src/lib/i18n/tests/utils.test.ts` — vi.mock removal TODO
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte` — Snippet conversion TODO

### Candidate app call sites (check for shared component API breakage)
- `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte` — Uses Expander
- `apps/frontend/src/routes/candidate/help/+page.svelte` — Uses Expander
- All candidate route files using MainContent (already updated to snippet syntax)

### Prior phase context
- `.planning/phases/22-leaf-component-migration/22-CONTEXT.md` — Runes patterns, TODO marker deferral policy
- `.planning/phases/23-container-components-and-layouts/23-CONTEXT.md` — Snippet conventions, callback naming, dispatcher migration

### Requirements
- `.planning/REQUIREMENTS.md` — CLEAN-01, CLEAN-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 22/23/24 established all runes patterns: `$props()`, `$state()`, `$derived()`, `$effect`, `{@render}` snippets
- All shared components already in runes mode from Phase 22/23
- Candidate routes already use snippet syntax for MainContent (hero, heading, primaryActions, etc.)

### Established Patterns
- Per-component `<svelte:options runes />` — consistent across 100+ components
- Callback props: native events lowercase (`onclick`), custom callbacks camelCase (`onExpand`)
- `children` for default slot content
- `$bindable()` for bound props

### Integration Points
- 6 v1.3-scoped TODO markers across 6 files in shared components
- ~2 candidate route files potentially affected by shared component API changes (Expander callback props)
- Candidate routes have many legacy Svelte 4 patterns (`$:`, `on:event`, `export let`, `<slot>`) but these are CAND-01 scope (v1.4), NOT this phase

</code_context>

<specifics>
## Specific Ideas

- The "Check if needed" markers (EntityFilters, ConstituencySelector) are likely wrapper functions added because Svelte 4 had issues with type parameters in templates — test in runes mode first
- The i18n test mock for `$env/dynamic/public` should be tested without it — Svelte 5's module system may handle this differently
- EntityCardAction → snippet conversion should be considered carefully — it's a utility component used by EntityCard which has complex rendering logic

</specifics>

<deferred>
## Deferred Ideas

- **Context system TODO markers** (7 markers) — CTX-01 to CTX-04 scope, deferred to v1.4
- **Admin component TODO markers** (WithPolling) — admin scope, separate milestone
- **Full candidate app migration** (CAND-01) — routes, layouts, reactive patterns — v1.4
- **awaitNominationsSettled rewrite** — depends on store-to-runes migration

</deferred>

---

*Phase: 25-cleanup*
*Context gathered: 2026-03-19 via auto-selected defaults*
