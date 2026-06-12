# Phase 109: appContext Orchestrator + Spread Fix + PoC Removal - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning
**Mode:** Smart discuss — infrastructure phase detected (orchestrator class conversion; technical success criteria only)

<domain>
## Phase Boundary

The `appContext` orchestrator is a class that composes the converted leaf + producer contexts via explicit getter forwarding, with the Phase-102 PoC scaffolding removed. Requirement CLASS-04.

Success criteria from ROADMAP:
1. `appContext` is a class; the `{ ...dataCtx }` / `{ ...componentCtx }` instance-spread is replaced with **explicit getter forwarding** (spreading a class instance silently drops prototype getters / `$state` accessors — spike finding A in CONTEXT-CLASS-PROOF).
2. The Phase-102 `_poc*` scaffolding is gone — `_pocDarkMode`/`_pocAppType`/`_pocGetRoute` surfaces removed AND the `_poc*` PoC test objects deleted; a grep confirms zero `_poc` references remain in contexts.
3. The SSR-correct `appSettings`/`appCustomization` merge is preserved — effective settings derived at `$state` field init / via a `$derived` field (never `$effect`), so server-rendered HTML reflects the DB-override merge with no post-hydration flash (spike 008/023; the v2.11 fix holds).
4. `yarn build` (client + SSR) + `yarn vitest run src/lib/contexts/` + `yarn svelte-check` all green with zero new errors; downstream consumers of `appContext` surfaces are unbroken.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices at Claude's discretion — pure infrastructure phase. Follow:
- Phase 106/107/108 class idiom (AuthContextProvider, ComponentContextProvider, GetRoute/Survey/TrackingServiceImpl, PopupStore).
- `.planning/spikes/CONVENTIONS.md` §17–22; `.planning/spikes/CONTEXT-CLASS-PROOF.md` (spike finding A: spread drops prototype getters — the reason for explicit getter forwarding); `.planning/spikes/CONTEXT-MEMBER-AUDIT.md`.
- **Phase 107 spread-safety gate:** downstream consumers of appContext surfaces may destructure stable refs or spread — explicit getter forwarding must keep the consumer-visible surface shape identical. NOTE: voterContext/candidateContext/adminContext (Phases 110–112, NOT yet converted) consume appContext — they must keep working unmodified this phase.
- `createDarkMode()` back-compat factory in darkMode.svelte.ts exists solely for the Phase-102 PoC test — remove it together with the PoC test (it was kept in 107 explicitly "until Phase 109").
- appContext.type.ts contains `_poc*` surface types — remove them (type-only change is allowed here; consumer byte-identity applies to *downstream* consumers, not the appContext files themselves).
- SSR merge: preserve the v2.11 appSettings/appCustomization merge mechanics exactly (no `$effect`).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` (368 lines) — conversion target; spreads `{ ...tracking }` (L299) and componentCtx/dataCtx; direct-keys getRoute (L313), popupQueue (L315), survey (L322).
- `apps/frontend/src/lib/contexts/app/appContext.type.ts` — `_poc*` type surfaces to remove.
- `apps/frontend/src/lib/contexts/app/appContext.poc.svelte.test.ts` (145 lines) — Phase-102 PoC test file to DELETE.
- `apps/frontend/src/lib/contexts/component/darkMode.svelte.ts` — `createDarkMode()` back-compat factory + `_poc` reference to remove now that the PoC test goes away.
- All composed producers/leaves are already classes (Phases 106–108).

### Established Patterns
- Explicit getter forwarding for composition (never instance spread of class instances).
- Spread-safety: own-enumerable accessors where a downstream spread exists; verify each consumer's access pattern before choosing getter shape.
- No `$effect` for initial-value derivation; SSR-safe synchronous init (spike 008/023).

### Integration Points
- Downstream consumers: voterContext, candidateContext, adminContext (unconverted until 110–112) + any `getAppContext()` component consumers — surface must stay shape-identical.
- `apps/frontend/src/lib/contexts/app/index.ts` barrel.
- Test gate: `yarn build` + `yarn vitest run src/lib/contexts/` (in apps/frontend; 101/101 baseline minus the deleted PoC test file's count) + `yarn svelte-check` (151-error baseline, zero new).

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond ROADMAP success criteria. Not parallel-eligible (gates 110/111/112).

</specifics>

<deferred>
## Deferred Ideas

None — discuss skipped (infrastructure detection). Sibling orchestrators (voter/candidate/admin) → Phases 110–112; handle flatten → Phase 113.

</deferred>
