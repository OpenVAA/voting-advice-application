---
phase: 110-votercontext-orchestrator-voter-sub-stores
plan: 03
subsystem: ui
tags: [svelte5, runes, context-as-class, orchestrator, refactor, destructure-trap]

# Dependency graph
requires:
  - phase: 110-01 (answerStore + paramStore class conversion)
    provides: class-shaped persisted/param sub-stores with byte-identical factory signatures
  - phase: 110-02 (matchStore + nominationAndQuestionStore + filterStore class conversion)
    provides: class-shaped derived-projection sub-stores with { readonly value } surfaces
  - phase: 109-* (appContext own-enumerable forwarding)
    provides: AppContextProvider instance whose members are own-enumerable (Object.assign-copyable)
  - phase: 106-* (FilterContextProvider #filterGroup $derived-field-as-member precedent)
    provides: lazy $derived.by field-initializer pattern (reads constructor-assigned deps on first read)
provides:
  - voterContext as Svelte 5 class (VoterContextProvider implements VoterContext) with byte-identical initVoterContext/getVoterContext factory wrappers + CONTEXT_KEY guard
  - inherited ...appContext spread reproduced via Object.assign(this, appContext)
  - all reactive accessors as prototype getters (destructure-trap contract preserved)
affects: [110-04, voter-app-e2e-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Orchestrator-context-as-class: stable refs + sub-store producers + $derived projections as field initializers (lazy bodies, D1 declaration order); $effect blocks + side-effect init calls in the constructor"
    - "Inherited-context spread reproduced via Object.assign(this, parentInstance) from an own-enumerable parent + explicit `readonly x!` declarations of the inherited members for `implements`"
    - "$derived field initializer reading a constructor/earlier-field dep is TS-legal when the dep's field initializer precedes it in declaration order (FilterContextProvider #filterGroup precedent)"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts

key-decisions:
  - "Stable refs + 4 producers + 11 $derived projections kept as FIELD INITIALIZERS (not constructor assignments) — Svelte 5 only compiles $derived in field initializers / `let x = $derived`, not `this.#x = $derived(...)`; field-init declaration order (appContext → stable refs → producers → $derived) satisfies TS init-order analysis because the lazy bodies defer reads"
  - "Inherited appContext members declared explicitly as `readonly x!: AppContext['x']` so the class satisfies `implements VoterContext` (= AppContext & {...}); Object.assign installs them at runtime"
  - "Object.assign(this, this.#appContext) reproduces the L488 ...appContext spread from the own-enumerable Phase-109 AppContextProvider instance (no object-literal re-spread, no prototype-getter passthrough)"
  - "OWN members exposed as plain prototype get/set accessors — voterContext is spread by NO consumer (§17 safe), so the Phase-109 own-enumerable discipline was NOT needed for them"

patterns-established:
  - "Orchestrator-context-as-class field-init order: parent context → stable refs → sub-store producers → $derived projections (all field initializers) → constructor ($effect + side-effect init)"

requirements-completed: [CLASS-05]

# Metrics
duration: 18min
completed: 2026-06-13
---

# Phase 110 Plan 03: voterContext Orchestrator Class Conversion Summary

**voterContext converted to `VoterContextProvider implements VoterContext` — a 559-line object-literal factory replaced by a class with byte-identical factory wrappers, the inherited `...appContext` spread reproduced via `Object.assign`, all reactive accessors as prototype getters (destructure-trap contract preserved), and the 4 sub-store producers + 11 `$derived` projections as lazy field initializers with the 5 `$effect` blocks in the constructor.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-06-13T03:14:00Z
- **Completed:** 2026-06-13T03:21:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- `voterContext.svelte.ts` is now `export class VoterContextProvider implements VoterContext`, with `getVoterContext()` (hasContext-500 guard verbatim) and `initVoterContext()` returning `setContext(CONTEXT_KEY, new VoterContextProvider())` — byte-identical factory contract, unchanged CONTEXT_KEY Symbol, unchanged import lines (the Plan 01/02 sub-store factories kept their signatures).
- The inherited `...appContext` spread (former L488) is reproduced via `Object.assign(this, this.#appContext)` from the own-enumerable Phase-109 AppContextProvider instance; the inherited members are declared as `readonly x!: AppContext['x']` so the class structurally satisfies `implements VoterContext` (= `AppContext & {...}`).
- All reactive accessors (`selectedElections`, `selectedConstituencies`, `opinionQuestions`, `infoQuestions`, `matches`, `resultsAvailable`, `nominationsAvailable`, `currentResultsElection`, `currentResultsEntityType`, `entityFilters`, `selectedQuestionBlocks`, `infoQuestionCategories`, `opinionQuestionCategories`, `electionsSelectable`, `constituenciesSelectable`) are prototype getters backed by private `#field`s — re-invoked per `ctx.X` read, preserving the destructure-trap contract. `firstQuestionId` + `selectedQuestionCategoryIds` keep `get`+`set`; `filterContext` delegates to `getFilterContext()` verbatim.
- `resetVoterData` is an arrow-function field (§18 — survives detach as an `onclick`); the QUESTION-03 comment is preserved.
- The 4 sub-store producers (`#answers`/`#nominationsAndQuestions`/`#matches`/`#entityFilters`) and 11 `$derived` projections are field initializers in D1 declaration order (parent context → stable refs → producers → `$derived`); their lazy bodies defer reads, so TS init-order analysis is satisfied (FilterContextProvider `#filterGroup` precedent). The 5 `$effect` blocks (2 selection mirrors, question-chain, seed-default-categories with `untrack`, selectedQuestionBlocks build) and the `initFilterContext({...})` side-effect call live in the constructor.
- Every load-bearing comment is preserved verbatim: the `sameRefs` content-equality rationale, both DataRoot-throw navigation-race catches, the Phase-61 inlined-helper-store note, the QUESTION-03 pure-`$state` note, the seed-guard rationale, the QuestionBlocks `firstQuestionId`-reorder logic, the SEMANTIC-DISSOCIATION block, and the D-05 `filterContext` getter-delegation rationale.

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert voterContext to the VoterContextProvider class** - `ce5b1365a` (refactor)

_Task 2 (verify the destructure-trap contract + full frontend unit + svelte-check) is verification-only — no production-code change, so no separate commit. There is no dedicated voterContext unit test; behavior is gated by the full frontend unit suite (759/759 green) + the live voter-app E2E gate deferred to Plan 04. TDD note: this is a behavior-preserving structural refactor (mirroring the 110-01/02 precedent), so the "GREEN" gate is the unchanged full suite rather than a new test file._

## Files Created/Modified
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` - Rewritten as `VoterContextProvider` class + byte-identical `getVoterContext`/`initVoterContext` factory wrappers (528 insertions / 419 deletions)

## Decisions Made
- **Field initializers, not constructor `$derived` assignments:** an initial attempt installed the producers + `$derived` projections via `this.#x = $derived(...)` in the constructor. Svelte 5 only compiles `$derived`/`$derived.by` in FIELD INITIALIZERS (or `let x = $derived`), not as `this.#x = ` assignments — and the FilterContextProvider `#filterGroup` precedent confirms a field-initializer `$derived` whose lazy body reads a constructor-assigned field is correct (the body defers to first read). Reverted to field initializers in declaration order (appContext → stable refs → producers → `$derived`), which also resolved the TS "used before initialization" errors that the constructor-assignment shape would otherwise force.
- **Explicit `readonly x!` inherited-member declarations:** `Object.assign(this, appContext)` installs the inherited members at runtime but TypeScript does not see them as class members, so `implements VoterContext` failed (`missing t, translate, ...`). Declared each inherited AppContext member as `readonly x!: AppContext['x']` (mirroring AppContextProvider's own-member declaration discipline) so the class type-checks; the values are still supplied by `Object.assign`.
- **Prototype getters for OWN members (not own-enumerable forwarding):** voterContext is spread by NO consumer (`{ ...voterContext }` → zero hits; re-confirmed via grep), so its own surface members are plain prototype `get`/`set` accessors (§17 spread-safe). The Phase-109 own-enumerable discipline applies only to the INHERITED appContext members.

## Deviations from Plan

None affecting scope or behavior. Two mechanical refinements within the plan's stated latitude:
- **[Plan-sanctioned] $derived projections as field initializers rather than constructor-installed.** The plan's step 2 explicitly allowed "If TypeScript field-ordering or readability forces it, declare these `$derived` as constructor-installed fields after the producers (D1 order)." In practice Svelte 5's compiler requires `$derived` in field initializers (not `this.#x =` assignments), so the projections are field initializers ordered after the stable-ref + producer field initializers — equivalent D1 ordering, achieved via declaration order rather than constructor statement order.
- **[Plan-sanctioned] Inherited members declared as `readonly x!` for `implements`.** The plan said "do NOT re-spread with an object literal, do NOT use prototype-getter passthrough" — both honored. The explicit `readonly x!` declarations are the type-only counterpart to `Object.assign` (the AppContextProvider analog uses the identical idiom) and were necessary for `implements VoterContext` to type-check.

## Issues Encountered
- A `git stash` used to measure the svelte-check baseline interacted with a lint-staged backup stash and briefly reverted the working file; recovered cleanly via `git stash pop`. No work lost.
- svelte-check baseline is **152 errors**, not the "151" cited in the plan/110-CONTEXT.md (the figure was slightly stale). The meaningful gate — ZERO new errors and ZERO errors in `voterContext.svelte.ts` — is satisfied: the converted file and the pre-conversion file both produce 152 total errors.

## Known Stubs
None — behavior-preserving structural refactor. Every `$effect`/`$derived` body and every sub-store-producer call is the byte-for-byte prior logic; no placeholder values, mock data, or unwired surface introduced.

## Threat Flags
None — pure in-process refactor of the voter orchestrator context. No new network endpoints, auth paths, file access, or schema changes. The CONTEXT_KEY Symbol + factory contract is unchanged, so the voter-app routes/components interact with an identical surface. Threat register dispositions T-110-05 (destructure-trap regression), T-110-06 (D1 init-order bug), and T-110-07 (inherited spread loss) are all mitigated: prototype getters preserve the reactive edge; field-init declaration order + lazy `$derived` bodies prevent TDZ/undefined reads; `Object.assign` from the own-enumerable parent reproduces the spread (build + svelte-check + 759-test suite all green).

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- voterContext is now class-shaped, completing the per-context conversion slice of CLASS-05; Plan 04 runs the live voter-app E2E + a11y-smoke gate (deferred from this plan) to confirm runtime behavior end-to-end.
- All five voter sub-stores (Plans 01+02) and the orchestrator (this plan) are classes with byte-identical factory contracts; no consumer was touched. Frontend builds; full unit suite 759/759 green; svelte-check at baseline with zero new errors. No blockers.

## Self-Check: PASSED

- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` exists with `export class VoterContextProvider implements VoterContext`
- Task 1 commit `ce5b1365a` found in git history
- `yarn build --filter=@openvaa/frontend` succeeds; `yarn vitest run` 759/759 passing; `yarn svelte-check` 152 (== baseline), zero in voterContext

---
*Phase: 110-votercontext-orchestrator-voter-sub-stores*
*Completed: 2026-06-13*
