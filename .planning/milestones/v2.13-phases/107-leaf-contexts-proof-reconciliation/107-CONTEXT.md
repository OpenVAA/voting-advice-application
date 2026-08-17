# Phase 107: Leaf Contexts + Proof Reconciliation - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning
**Mode:** Smart discuss — infrastructure phase detected (pure class-conversion refactor; consumers byte-identical; technical success criteria only)

<domain>
## Phase Boundary

The leaf contexts `authContext` and `componentContext` are Svelte 5 classes, and the three already-landed proof conversions (`darkMode`, `dataContext`, `filterContext`) are reconciled to one consistent final class idiom. Requirement CLASS-02.

Success criteria from ROADMAP:
1. `authContext` is a class — `isAuthenticated` is a `$derived` field (read off `page.data.session`); the four DataWriter wrappers (`logout`/`requestForgotPasswordEmail`/`resetPassword`/`setPassword`) are arrow-function fields (detached by consumers).
2. `componentContext` is a class exposing the i18n surface + a `get darkMode()` that reads the `DarkMode` helper class — no `{ current }` handle re-export.
3. `darkMode`, `dataContext`, and `filterContext` are reconciled to the final idiom — consistent field/method shape, no spike-era residue (the `reactiveDataRoot.instance` back-compat read documented as intentional-until-flatten, not orphaned).
4. `yarn build` (client + SSR) + `yarn vitest run src/lib/contexts/` + `yarn svelte-check` all green with zero new errors; consumers untouched.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase (class-conversion refactor with byte-identical consumers). Follow:
- The Phase 106 class idiom as the established template (PopupStore, SettingsOverlay, persistedState, VideoController conversions in `.planning/milestones/` Phase 106 artifacts and the converted source files).
- `.planning/spikes/CONVENTIONS.md` §17–22 (class-conversion conventions).
- `.planning/spikes/CONTEXT-CLASS-PROOF.md` (3 proof conversions = darkMode/dataContext/filterContext, this phase reconciles them) and `.planning/spikes/CONTEXT-MEMBER-AUDIT.md` (member-by-member classification).
- Spike rules: detachable methods = arrow-function fields (spike 020); no `$effect` for initial-value derivation (spike 023); imperative persistence (spike 021).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts` (+ `.type.ts`) — conversion target 1.
- `apps/frontend/src/lib/contexts/component/componentContext.svelte.ts` (+ `darkMode.svelte.ts`) — conversion target 2; composes the DarkMode helper class.
- `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts`, `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` — proof conversions to reconcile.
- `apps/frontend/src/lib/contexts/_spikes-020-class-conversion/*.spike.svelte.test.ts` — verified class-conversion patterns (core, localStorage, version bridge, SSR/effect).
- Phase 106 helper classes (PopupStore, SettingsOverlay, persistedState, VideoController) — the freshest in-tree examples of the final idiom.

### Established Patterns
- Class with `$state`/`$derived` fields; arrow-function fields for detachable methods; getters for reactive surface forwarding; no factory-closure return objects.
- Back-compat handles (`{ readonly current }` / `reactiveFoo`) stay until Phase 113 FLATTEN — do NOT remove consumer-facing handles in this phase; consumers must remain byte-identical.
- `reactiveDataRoot.instance` back-compat read: document as intentional-until-flatten.

### Integration Points
- `apps/frontend/src/lib/contexts/{auth,component,data,filter}/index.ts` barrels — keep exported surface identical.
- Test gate: `yarn build` + `yarn vitest run src/lib/contexts/` (run in `apps/frontend`) + `yarn svelte-check`.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond ROADMAP success criteria — infrastructure phase. Parallel-eligible with Phase 108 (disjoint files), but autonomous run executes sequentially.

</specifics>

<deferred>
## Deferred Ideas

None — discuss skipped (infrastructure detection). Back-compat handle removal and `.current` codemod deferred to Phase 113 per roadmap.

</deferred>
