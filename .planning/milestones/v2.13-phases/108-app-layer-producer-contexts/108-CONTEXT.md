# Phase 108: App-Layer Producer Contexts - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning
**Mode:** Smart discuss — infrastructure phase detected (pure class-conversion refactor; consumers byte-identical; technical success criteria only)

<domain>
## Phase Boundary

The app-layer producer contexts that feed `appContext` are Svelte 5 classes, so the orchestrator can compose them in Phase 109. Requirement CLASS-03.

Success criteria from ROADMAP:
1. `getRoute`, `survey` (`surveyLink`), `trackingService`, and `popupStore` are each a Svelte 5 class — projections are `$derived` fields, detachable callbacks are arrow-function fields.
2. `getRoute` preserves the spike-012 per-field `page` read (`$derived.by` over individual `$app/state.page` fields) — it does NOT read the page proxy as a single object (which would short-circuit reactivity).
3. No `$effect` is used for initial-value derivation in these producers (synchronous field initializers / `$derived` fields only — spike 023); `survey`'s `$derived.by` over `appSettings.current` + `sessionId.current` recomputes reactively.
4. `yarn build` (client + SSR) + `yarn vitest run src/lib/contexts/` + `yarn svelte-check` are all green with zero new errors; consumers byte-identical.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Follow:
- The Phase 106/107 class idiom (freshest examples: `contexts/app/popup/popupStore.svelte.ts` class PopupStore — already a class from Phase 106; `contexts/auth/authContext.svelte.ts` AuthContextProvider; `contexts/component/componentContext.svelte.ts` ComponentContextProvider).
- `.planning/spikes/CONVENTIONS.md` §17–22; `.planning/spikes/CONTEXT-MEMBER-AUDIT.md`.
- **Phase 107 spread-safety gate (load-bearing, recorded in STATE.md):** Svelte 5 compiles `$state`/`$derived` class fields to prototype accessors that are NOT own-enumerable and are DROPPED by object spread. Any surface consumed via `{ ...instance }` (appContext composes these producers, spread fix lands only in Phase 109) must use private backing field + own-enumerable constructor accessor (dataContext precedent) or `Object.assign` own properties.
- Spike rules: detachable methods = arrow-function fields (spike 020); no `$effect` for initial-value derivation (spike 023); getRoute per-field `page` reads (spike 012).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts` — conversion target (spike-012 per-field page reads MUST be preserved).
- `apps/frontend/src/lib/contexts/app/survey.svelte.ts` — `surveyLink()` factory → class; `$derived.by` over `appSettings.current` + `sessionId.current`.
- `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts` (+ test) — conversion target.
- `apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.ts` — `class PopupStore` already exists from Phase 106; this phase converts/formalizes the producer wrapper around it if any factory remains.
- Phase 107 conversions (AuthContextProvider, ComponentContextProvider) — canonical leaf-class examples including spread-safety mechanics.

### Established Patterns
- Class with `$state`/`$derived` fields; arrow-function fields for detachable callbacks; spread-consumed surfaces need own-enumerable accessors.
- Back-compat handles (`{ readonly current }` / `reactiveFoo`) stay until Phase 113 — consumers byte-identical.
- Existing tests: `popupStore.svelte.test.ts`, `trackingService.svelte.test.ts`, `survey.svelte.test.ts` must stay green.

### Integration Points
- `apps/frontend/src/lib/contexts/app/index.ts` + sub-barrels — exported surface identical.
- `appContext.svelte.ts` composes these producers (Phase 109 converts it — do NOT touch appContext here beyond what byte-identity allows).
- Test gate: `yarn build` + `yarn vitest run src/lib/contexts/` (in apps/frontend) + `yarn svelte-check` (151-error baseline; zero new).

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond ROADMAP success criteria — infrastructure phase. Parallel-eligible with Phase 107 per roadmap (107 already complete; sequential in this run).

</specifics>

<deferred>
## Deferred Ideas

None — discuss skipped (infrastructure detection). appContext orchestrator conversion + `_poc*` removal → Phase 109; handle flatten → Phase 113.

</deferred>
