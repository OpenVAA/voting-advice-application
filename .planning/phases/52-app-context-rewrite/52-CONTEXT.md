# Phase 52: App Context Rewrite - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Rewrite VoterContext, CandidateContext, and AdminContext from `svelte/store` to `$state`/`$derived`. Achieve zero `$store` context references and zero `svelte/store` imports in all frontend context and component files. Update all ~59 consumer components.

</domain>

<decisions>
## Implementation Decisions

### D-01: VoterContext derived chains — Claude's discretion
VoterContext has ~20 derived stores for matching, filtering, question blocks, etc. Claude decides whether to do mechanical `$derived` conversion or consolidate into fewer reactive blocks based on the actual dependency graph. The guiding principle: keep the same semantic structure unless consolidation provides clear benefits.

### D-02: CandidateContext async patterns — Claude's discretion
Apply the same patterns as AppContext (Phase 51): page data subscriptions become `$derived` chains from `$app/state`, auth state becomes `$derived` from page session. Async data writer methods stay as plain functions (they're not reactive). Claude decides specifics based on candidateContext.ts code.

### D-03: Grep sweep validation for zero-$store milestone
Add explicit grep validation to the plan's success criteria:
- `grep -r 'from.*svelte/store' apps/frontend/src/lib/contexts/ apps/frontend/src/lib/components/` → 0 matches
- `grep -r '$app/stores' apps/frontend/src/` → 0 matches
This is a scriptable, one-time validation at phase completion. Not a CI rule (those can be added later if desired).

### D-04: Carry forward from Phases 50-51
- Direct $state properties for all writables (Phase 50 D-01)
- Full consumer migration per phase, no shim layers (Phase 50 D-04)
- Version counter pattern for DataRoot reactivity (Phase 51 D-01)

### Claude's Discretion
- VoterContext internal structure decisions (mechanical vs consolidation)
- CandidateContext specific conversion patterns
- AdminContext conversion (simplest at 116 lines)
- Sub-module handling (answerStore, matchStore, filterStore, nominationAndQuestionStore, etc.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Context implementations
- `apps/frontend/src/lib/contexts/voter/voterContext.ts` — VoterContext (264 lines, ~20 derived stores, matching/filtering)
- `apps/frontend/src/lib/contexts/voter/voterContext.type.ts` — VoterContext types
- `apps/frontend/src/lib/contexts/candidate/candidateContext.ts` — CandidateContext (333 lines, auth/data writers/pre-registration)
- `apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts` — CandidateContext types
- `apps/frontend/src/lib/contexts/admin/adminContext.ts` — AdminContext (116 lines)
- `apps/frontend/src/lib/contexts/admin/adminContext.type.ts` — AdminContext types

### VoterContext sub-modules
- `apps/frontend/src/lib/contexts/voter/answerStore.ts` — Voter answer persistence
- `apps/frontend/src/lib/contexts/voter/matchStore.ts` — Match computation store
- `apps/frontend/src/lib/contexts/voter/filters/filterStore.ts` — Filter state management
- `apps/frontend/src/lib/contexts/voter/nominationAndQuestionStore.ts` — Nomination/question filtering
- `apps/frontend/src/lib/contexts/voter/countAnswers.ts` — Answer counting utility
- `apps/frontend/src/lib/contexts/utils/paramStore.ts` — Route parameter extraction
- `apps/frontend/src/lib/contexts/utils/questionBlockStore.ts` — Question block grouping
- `apps/frontend/src/lib/contexts/utils/questionCategoryStore.ts` — Question category extraction
- `apps/frontend/src/lib/contexts/utils/questionStore.ts` — Question data store

### Prior phase artifacts
- `.planning/phases/50-leaf-context-rewrite/50-CONTEXT.md` — D-01 through D-04
- `.planning/phases/51-mid-level-context-rewrite/51-CONTEXT.md` — D-01 through D-04

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `persistedState.svelte.ts` — `sessionStorageWritable` used by VoterContext for answer persistence
- `memoizedDerived.ts` — May be useful for expensive matching computations
- Phase 51's DataRoot version counter — VoterContext reads DataRoot extensively

### Established Patterns
- VoterContext spreads AppContext: `...getAppContext()` — after Phase 51, AppContext properties are $state-based
- CandidateContext spreads AppContext + AuthContext
- AdminContext spreads AppContext + AuthContext
- Sub-modules (answerStore, matchStore, filterStore) return store objects — these need conversion too

### Integration Points
- VoterContext consumers: route files in `(voters)/` and dynamic components (EntityCard, EntityList, QuestionHeading)
- CandidateContext consumers: route files in `candidate/` and candidate components
- AdminContext consumers: route files in `admin/` and admin components
- This is the final context phase — after this, zero $store patterns should remain for context values

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 52-app-context-rewrite*
*Context gathered: 2026-03-28*
