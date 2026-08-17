---
phase: 110-votercontext-orchestrator-voter-sub-stores
plan: 02
subsystem: ui
tags: [svelte5, runes, derived-projection, context-as-class, refactor]

# Dependency graph
requires:
  - phase: 110-01 (answerStore + paramStore class conversion)
    provides: derived-projection-store-as-class precedent (#value = $derived field read via prototype getter)
  - phase: 106-* (FilterContextProvider #filterGroup $derived-field-as-member precedent)
    provides: $derived.by-as-class-field lazy-init pattern (constructor-legal)
provides:
  - matchStore as Svelte 5 class (MatchStoreImpl) with byte-identical factory signature + { readonly value } surface
  - nominationAndQuestionStore as Svelte 5 class (NominationAndQuestionStoreImpl) with byte-identical factory + surface
  - filterStore as Svelte 5 class (FilterStoreImpl) with byte-identical factory + surface
  - MatchTree / NominationAndQuestionTree / FilterTree type exports preserved at original locations
affects: [110-03, voterContext-orchestrator-conversion]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Derived-projection sub-store as class: #deps constructor field + private #value = $derived.by(...) read through a get value() prototype getter"
    - "Getter-arg call sites rewritten to this.#deps.X() (deps object stored whole as single private field for minimal diff)"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts
    - apps/frontend/src/lib/contexts/voter/nominationAndQuestionStore.svelte.ts
    - apps/frontend/src/lib/contexts/voter/filters/filterStore.svelte.ts

key-decisions:
  - "Stored the destructured-args object as a single #deps private field (minimal diff) rather than per-arg private fields"
  - "Factory signature widened to a named deps type (MatchStoreDeps etc.) but the structural shape is byte-identical to the prior inline destructured-args type — no caller change, no surface change"
  - "$derived.by kept as a private FIELD (lazy first-read; CONVENTIONS §20 projection-in-$derived); get value() prototype getter (CONVENTIONS §17 — none of the three sub-stores is spread, only voterContext reads .value)"

patterns-established:
  - "Derived-projection-store-as-class (3rd–5th application after paramStore in 110-01): #deps field, #value = $derived.by, prototype get value()"

requirements-completed: [CLASS-05]

# Metrics
duration: 2min
completed: 2026-06-13
---

# Phase 110 Plan 02: voterContext Derived-Projection Sub-Stores (matchStore + nominationAndQuestionStore + filterStore) Summary

**The three derived-projection voter sub-stores converted to Svelte 5 classes with private `$derived.by` value fields read through `get value()` getters; factory signatures, `{ readonly value }` surfaces, and MatchTree/NominationAndQuestionTree/FilterTree type exports all preserved byte-identically.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-06-13T00:06:20Z
- **Completed:** 2026-06-13T00:07:57Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- `matchStore` is now `MatchStoreImpl` — a `#deps` constructor field plus a private `#value = $derived.by(...)` field exposed through a `get value()` prototype getter. The Phase 69 D-06 cross-iteration org-proxy cache, the Org-first invariant comment block, and the `imputeParentAnswers`/`unwrapProxiedMatch` logic are preserved verbatim; getter-arg call sites rewritten to `this.#deps.answers.answers`, `this.#deps.nominationsAndQuestions()`, `this.#deps.algorithm`, `this.#deps.minAnswers()`, `this.#deps.calcSubmatches()`, `this.#deps.parentMatchingMethod()`.
- `nominationAndQuestionStore` is now `NominationAndQuestionStoreImpl` — same mechanics; the `getApplicableConstituency` try/catch hierarchy-edge handling, the candidate `hideIfMissing` answer filter, and the organization child-purge logic are preserved verbatim; getter calls rewritten to `this.#deps.dataRoot()` / `.constituencies()` / `.elections()` / `.entityTypes()` / `.hideIfMissingAnswers()`.
- `filterStore` is now `FilterStoreImpl` — same shape; the `buildParentFilters` / `filterableQuestions` / `buildQuestionFilter` / `new FilterGroup(filters)` projection plus the alliance-skip branch and the filterable-question comment are preserved verbatim; getter calls rewritten to `this.#deps.nominationsAndQuestions()` / `.locale()` / `.t()`.
- All three factory wrappers (`matchStore(deps)`, `nominationAndQuestionStore(deps)`, `filterStore(deps)`) keep their byte-identical structural signatures and return `{ readonly value }` — no caller change required.
- The exported type aliases `MatchTree`, `NominationAndQuestionTree`, and `FilterTree` remain at their original module locations with unchanged names, so every cross-tree importer (lib/utils/matches.ts, lib/utils/entityDetails.ts, results statistics +page.svelte, voterContext.type.ts, filterContext.type.ts, filterContext.svelte.test.ts, __tests__/FilterContextHarness.svelte) resolves unchanged.

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert matchStore + nominationAndQuestionStore to classes** - `b30b5b970` (refactor)
2. **Task 2: Convert filters/filterStore to a class** - `92dc77e9c` (refactor)

## Files Created/Modified
- `apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts` - Factory rewritten as `MatchStoreImpl` class + byte-identical `matchStore` factory wrapper; `MatchStoreDeps` type extracted from the prior inline args type
- `apps/frontend/src/lib/contexts/voter/nominationAndQuestionStore.svelte.ts` - Rewritten as `NominationAndQuestionStoreImpl` class + byte-identical factory wrapper; `NominationAndQuestionStoreDeps` type extracted
- `apps/frontend/src/lib/contexts/voter/filters/filterStore.svelte.ts` - Rewritten as `FilterStoreImpl` class + byte-identical factory wrapper; `FilterStoreDeps` type extracted

## Decisions Made
- **Single `#deps` private field over per-arg fields:** the whole destructured-args object is stored as one `#deps` private field, minimizing the diff and keeping projection-body call sites a one-line mechanical rewrite (`x()` → `this.#deps.x()`).
- **Named deps type extraction is surface-neutral:** the inline destructured-args object type was lifted to a named alias (`MatchStoreDeps` etc.) so the factory and constructor share it. The structural shape is identical to the prior inline type — callers (voterContext) pass the same object literal, and the `{ readonly value }` return surface is unchanged (CLASS-05 byte-identical-signature constraint satisfied).
- **`$derived.by` field, not `$effect`; prototype getter, not spread:** the projections are pure transforms, so they stay in `$derived` (CONVENTIONS §20). None of the three sub-stores is spread by any consumer — only voterContext reads `.value` — so a plain `get value()` prototype getter is spread-safe (CONVENTIONS §17). The `$derived.by` field initializer runs lazily on first read, so it is constructor-legal with no effect-context issue (FilterContextProvider `#filterGroup` precedent).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs
None - pure refactor; no placeholder values, mock data, or unwired components introduced. The projection bodies are byte-for-byte the prior logic, so matching/filtering output is identical.

## Threat Flags
None - pure in-process refactor of three derived-projection sub-stores. No new network endpoints, auth paths, file access, or schema changes. Type-alias-rename risk (T-110-04) mitigated by keeping all three type exports at identical names/locations (build gate confirms no importer breaks).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All five voter sub-stores (answerStore + paramStore from Plan 01; matchStore + nominationAndQuestionStore + filterStore from this plan) are now class-shaped, fully de-risking the Plan 03 voterContext orchestrator conversion — its sub-store dependencies are class instances with stable `{ readonly value }` / method surfaces.
- Frontend builds; filterContext unit test green (8/8). The final voter-app E2E behavior gate is in Plan 04. No blockers.

## Self-Check: PASSED

- All 3 modified files exist on disk with `class MatchStoreImpl` / `class NominationAndQuestionStoreImpl` / `class FilterStoreImpl`
- Both task commits (`b30b5b970`, `92dc77e9c`) found in git history
- `yarn build --filter=@openvaa/frontend` succeeds; `filterContext.svelte.test.ts` passes 8/8

---
*Phase: 110-votercontext-orchestrator-voter-sub-stores*
*Completed: 2026-06-13*
