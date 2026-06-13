# Phase 110: voterContext Orchestrator + Voter Sub-Stores - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning
**Mode:** Smart discuss — infrastructure phase detected (orchestrator + sub-store class conversion; voter app behaves identically; technical success criteria only)

<domain>
## Phase Boundary

The `voterContext` orchestrator and its voter sub-stores are classes, with every reactive accessor and the destructure-trap contract preserved, and the voter app green. Requirement CLASS-05.

Success criteria from ROADMAP:
1. `voterContext` is a class, and its sub-stores `answerStore`, `matchStore`, `nominationAndQuestionStore`, `filters/filterStore`, and the `utils/*` derived projections (`paramStore`/`questionBlockStore`/`questionCategoryStore`/`questionStore`) are classes.
2. Every reactive accessor (`selectedElections`, `selectedConstituencies`, `opinionQuestions`, `infoQuestions`, `matches`, `resultsAvailable`, `nominationsAvailable`, etc.) stays reactive when read via `ctx.X`; the destructure-trap contract is preserved (consumers do NOT destructure reactive accessors).
3. The `answerStore` Group-C version-bridge (localStorageState, frozen payload) keeps its `setX`/`untrack` encapsulation; its `#version` private `$state` does not silently spin (spike 022).
4. `yarn build` + `yarn vitest run` + the voter-app E2E suite (incl. a11y-smoke) are green — the voter app behaves identically.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices at Claude's discretion — pure infrastructure phase. Follow:
- Phase 106–109 class idiom; freshest orchestrator example: `AppContextProvider` (appContext.svelte.ts) with own-enumerable forwarding + stable constructor-allocated handle fields (post-review commit cbd3f0bd3 shape).
- **Spread/consumer audit FIRST:** voterContext spreads `{ ...appContext }` (voterContext.svelte.ts:488). Determine for each voterContext surface member how consumers access it (CLAUDE.md Context Destructuring Rule: reactive accessors read via `ctx.X` — these can be prototype getters ONLY if no consumer spreads voterContext; verify with grep `{ ...voterContext }` / `...getVoterContext()` before choosing shapes; own-enumerable where spread/destructure-stable contract requires).
- `.planning/spikes/CONVENTIONS.md` §17–22; spike 022 (version bridge — `#version` must not spin); spike 020 (arrow fields); spike 023 (no `$effect` init).
- D1 field-init-order landmine: `$derived` reading other fields installs in constructor body after dependencies assigned (TrackingServiceImpl precedent).
- Sub-store factory signatures + exported surfaces byte-identical; back-compat handles stay until Phase 113.

### E2E gate (SC-4)
The voter-app E2E suite (incl. a11y-smoke) must run green. Procedure per CLAUDE.md: `yarn db:reset && yarn db:seed --template e2e/base --likert-only`, dev stack via `yarn dev`, then targeted voter-app Playwright specs + a11y-smoke. Restart dev server if HMR staleness suspected (project memory). This belongs in the FINAL plan as the phase gate.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` (+ `.type.ts`) — orchestrator conversion target; spreads `{ ...appContext }` at ~L488.
- `apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts` (+ test) — Group-C version-bridge (localStorageState, frozen payload, untrack) — KEEP bridge semantics (spike 022).
- `apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts`, `nominationAndQuestionStore.svelte.ts` — sub-store targets.
- `apps/frontend/src/lib/contexts/voter/filters/filterStore.svelte.ts`, `paramStore.svelte.ts`, `questionBlockStore.svelte.ts`, `questionCategoryStore.svelte.ts`, `questionStore.svelte.ts` — derived-projection targets (exact dirs: verify — roadmap calls them `utils/*`).
- Canonical conversions: AppContextProvider, AuthContextProvider, ComponentContextProvider, TrackingServiceImpl, dataContext/filterContext version-bridge classes.

### Established Patterns
- Own-enumerable surfaces where spreads exist; stable constructor-allocated handle fields; arrow-function fields for detached methods; `$derived` install in constructor when reading other fields; never `$effect` for initial values.
- Destructure-trap contract (CLAUDE.md): reactive accessors must re-invoke getters on `ctx.X` reads — class getters preserve this naturally; verify the canonical results-layout consumer still works.

### Integration Points
- Voter app routes `apps/frontend/src/routes/[[lang=locale]]/(voters)/` — consumers MUST be byte-identical.
- Test gate: `yarn build` + `yarn vitest run` (full unit) + voter-app E2E incl. a11y-smoke (see E2E gate above) + `yarn svelte-check` (151 baseline).

</code_context>

<specifics>
## Specific Ideas

Roadmap marks 110 ∥ 111 ∥ 112 parallel-eligible; this autonomous run executes sequentially (worktrees disabled). E2E gate runs once at phase end, not per-plan.

</specifics>

<deferred>
## Deferred Ideas

None — discuss skipped (infrastructure detection). Handle flatten + `.current` codemod → Phase 113; Store→State rename → Phase 114.

</deferred>
