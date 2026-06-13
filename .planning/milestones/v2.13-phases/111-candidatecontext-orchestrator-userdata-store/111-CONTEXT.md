# Phase 111: candidateContext Orchestrator + UserData Store - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning
**Mode:** Smart discuss — infrastructure phase detected (orchestrator + composite-bridge class conversion; candidate app behaves identically; technical success criteria only)

<domain>
## Phase Boundary

The `candidateContext` orchestrator and `candidateUserDataStore` composite bridge are classes, with all reactive accessors preserved and the candidate app green. Requirement CLASS-06.

Success criteria from ROADMAP:
1. `candidateContext` is a class, and `candidateUserDataStore` (the Group-C composite of `savedData` + `edited*`) is a class with its `$derived.by` composite merge preserved.
2. Every reactive accessor (`answersLocked`, `profileComplete`, `selectedElections`, `opinionQuestions`, `questionBlocks`, `requiredInfoQuestions`, `unanswered*`, `idTokenClaims`, `isPreregistered`, `preregistration*`, etc.) stays reactive when read via `ctx.X`; the destructure-trap contract is preserved.
3. Persisted fields (`isPreregistered`, `preregistration*Ids`, `firstQuestionId`) round-trip through their `localStorageState`/`sessionStorageState` class without `$effect`-driven init (spike 021/023).
4. `yarn build` + `yarn vitest run` + the candidate-app E2E suite (incl. a11y-smoke) are green — the candidate app behaves identically.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices at Claude's discretion — pure infrastructure phase. Follow:
- Phase 106–110 class idiom; closest analog: **VoterContextProvider** (voterContext.svelte.ts — sibling orchestrator on the appContext base, converted in Phase 110: `Object.assign(this, this.#appContext)` inheritance + `readonly x!:` declarations, prototype getters for reactive accessors, $derived field initializers in D1 order, $effects in constructor, @internal JSDoc + type-only barrel export precedent a3045494b).
- **candidateContext spreads `{ ...authContext }` AND `{ ...appContext }`** (verify lines — candidateContext.svelte.ts ~L366-367ish) — both sources are own-enumerable class instances since Phases 107/109, so `Object.assign(this, ...)` reproduces them.
- **Spread/consumer audit FIRST:** grep whether anything spreads `{ ...candidateContext }` — if zero (like voterContext), reactive accessors can be plain prototype getters (§17).
- candidateUserDataStore: Group-C composite — preserve the `$derived.by` composite merge (savedData + edited*) and existing test green (candidateUserDataStore.svelte.test.ts).
- Persisted fields round-trip through localStorageState/sessionStorageState classes — imperative init, never `$effect` (spike 021/023).
- D1 field-init order; arrow fields for detached methods; factory signatures + initCandidateContext()/getCandidateContext() byte-identical; back-compat handles until Phase 113.
- The CLAUDE.md Context Destructuring Rule's canonical candidateContext diagnostic (v2.6 Phase 61) — the `$derived` chain capture bug — is the origin story for the destructure-trap contract: class getters preserve it; do not regress.

### E2E gate (SC-4)
Candidate-app E2E suite incl. a11y-smoke in the FINAL plan: `yarn db:reset && yarn db:seed --template e2e/base --likert-only`, dev stack up, candidate-app Playwright project(s) + a11y-smoke. "Did not run" counts as failure. Restart dev server on HMR staleness. Note from v2.10: perm teardowns unregister invited auth users (fixed) — candidate E2E re-runs should be safe.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` (+ `.type.ts`) — orchestrator conversion target.
- `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts` (+ test + `.type.ts`) — Group-C composite bridge target.
- Phase 110 VoterContextProvider — the directly-analogous sibling conversion (same inheritance mechanics).
- `candidateContext.svelte.ts:106-123` — in-tree destructure-trap explanation (per CLAUDE.md).

### Established Patterns
- Own-enumerable inherited members via Object.assign from class instances; prototype getters for own reactive accessors (when no downstream spread); stable handle fields; arrow-function fields; $derived field initializers in declaration order; $effects in constructor; @internal class export + type-only barrel.

### Integration Points
- Candidate app routes `apps/frontend/src/routes/[[lang=locale]]/candidate/` — consumers byte-identical.
- adminContext reads authContext directly (Phase 112 concern — do not touch).
- Test gate: `yarn build` + full `yarn vitest run` + candidate-app E2E incl. a11y-smoke + `yarn svelte-check` (151 baseline, zero new).

</code_context>

<specifics>
## Specific Ideas

Roadmap marks 110 ∥ 111 ∥ 112; this run executes sequentially. E2E gate once at phase end.

</specifics>

<deferred>
## Deferred Ideas

None — discuss skipped (infrastructure detection). Handle flatten → Phase 113; Store→State rename → Phase 114 (candidateUserDataStore stays *Store-named this phase).

</deferred>
