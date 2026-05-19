# Rewrite parent answer imputation logic — broader refactor

**Captured:** 2026-05-09 (Phase 69 close)
**Status:** pending — v2.9+ backlog candidate
**Origin:** `.planning/phases/69-alliance-card-lane-a/69-CONTEXT.md` "Deferred Ideas / New Todo to Capture (Post-Phase 69)"
**Title (per CONTEXT verbatim):** Rewrite parent answer imputation logic so that entity answers are not overwritten ad hoc.

## Background

Phase 69 (Alliance Card Lane A) added a targeted extension to the parent-answer-imputation pipeline:

- `apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts` was generalised to accept proxy-children via an optional `childProxies?: Map<Id, MatchingProxy<AnyNominationVariant>>` parameter (commit `194e0a5aa`).
- `apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts` was refactored to a sequential `for...of` accumulator that runs Org Pass 1 before Alliance Pass 2, with the org proxies cached as `orgProxiesById` and passed to the alliance pass via the new `childProxies` arg (commits `18c614327` + `1f645683b`).
- A regression-guard unit test was added at `apps/frontend/src/lib/utils/matching/imputeParentAnswers.test.ts` (commit `727a9d551`).

This works for the alliance use case but the underlying imputation paradigm has deeper structural debt. The Phase 69 patch is targeted; the broader rewrite is deliberately deferred so the alliance render/cascade ship could land without coupling to a structural refactor.

## Structural debt items the broader refactor would address

1. **Implicit ordering invariant.** The Org-first invariant in `matchStore` is enforced structurally (alliance branch sits below org branch in the if-else chain) AND documented in inline comments — but a customer override that reorders `appSettings.results.sections` would silently degrade the cascade. There is no runtime check.
2. **Per-entity-type matching method is a single global knob.** `appSettings.matching.organizationMatching.parentMatchingMethod` is one string applied uniformly to all parent entity types in the loop (Organization, Faction, Alliance — the v2.8 verified Case A shape). If a deployment wants `'impute'` for orgs but `'answersOnly'` for alliances (or vice versa), the current shape doesn't support it. A first-class per-entity-type config would live in `packages/app-shared/src/settings/dynamicSettings.type.ts` (e.g. `matching.parentMatchingMethod: { organization?, faction?, alliance? }`).
3. **Imputation strategy is intertwined with the match loop.** The imputation logic (median for ordinal/number, mode for categorical) is hard-coded inside `imputeParentAnswers`. Different VAA instances may want different aggregation strategies (mean instead of median, weighted average by candidate vote share, etc.). A strategy-pattern split (function -> strategy object) would unblock that.
4. **Cascade depth is implicit.** Phase 69 implements a 2-level cascade (candidates → orgs → alliances). A future requirement for a 3-level cascade (e.g. candidates → factions → orgs → alliances when faction proxies need to feed both org imputation AND alliance imputation) would require another `factionProxiesById`-style cache and another `else if` arm. The pattern is mechanical but not first-class.
5. **Proxy-children pattern abstraction.** Phase 69 chose the proxy-children extension over the entity-write quick-fix (CONTEXT D-05). Whether the proxy-children pattern is the right long-term abstraction — vs. e.g. a declarative parent→children graph that the matching engine traverses — is itself an architecture question to revisit. The proxy approach keeps imputation scoped to the matching pipeline (no entity mutation) and that property should be preserved.

## Proposed refactor (sketch — for v2.9+ planning)

1. **Per-entity-type matching method.** Extend `appSettings.matching` to support `parentMatchingMethod: { organization?: ..., faction?: ..., alliance?: ... }` while keeping the legacy single-string shape backwards-compatible (if no per-type entry, fall back to the global `organizationMatching.parentMatchingMethod`). New type lives in `packages/app-shared/src/settings/dynamicSettings.type.ts`.
2. **Strategy-pattern imputation.** Refactor `imputeParentAnswers` to accept a strategy object (default = current median/mode/median) so customers can plug alternative aggregation strategies without forking the function. Keep the proxy-children pattern (no entity writes).
3. **Declarative cascade-depth.** Build a small graph of parent-type to children-type relations (Org → Candidate, Org+factions → Faction, Faction → Candidate, Alliance → Org) and topologically sort the impute passes — eliminates the implicit ordering invariant in `matchStore` and makes cascade-depth configurable.
4. **Runtime invariant check.** When `imputeParentAnswers` runs with a `childProxies` arg whose Map is unexpectedly empty (signalling a pre-pass didn't fire), log a debug warning so silent cascade-degradation is observable.
5. **Evaluate proxy-children vs alternatives.** As part of the refactor, explicitly weigh the proxy-children pattern (Phase 69) against alternatives (entity-write with tagged "imputed" flag; strategy-pattern with on-the-fly read; pre-computed materialised view) and pick deliberately rather than by inheritance from Phase 69's targeted patch.

## Out of v2.8 scope

- This is a structural refactor — risky to land alongside the alliance render/cascade ship. Phase 69 took the targeted-extension path (per CONTEXT D-05); this todo captures the deeper rewrite for a future milestone.
- Touches `@openvaa/app-shared` (settings shape), `apps/frontend/src/lib/utils/matching/` (imputation function), `apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts` (cascade orchestration). Cross-package coordination + behaviour-equivalence verification (via the parity gate + new unit tests) makes this a non-trivial milestone.

## Acceptance criteria when this todo gets planned

- Per-entity-type `parentMatchingMethod` with backwards-compat for the single-string legacy shape.
- Strategy pattern: `imputeParentAnswers` accepts an optional aggregation-strategy object; default behaviour matches Phase 69's median/mode/median.
- `matchStore` cascade orchestration is data-driven (parent→children graph), not hand-coded if-else.
- Runtime invariant warning when cascade ordering is broken at runtime.
- All Phase 69 voter-app behaviour preserved (parity gate continues to pass).
- Unit-test coverage extended for the strategy-pattern + declarative cascade graph.
- Architecture decision recorded: proxy-children pattern kept / replaced / supplemented (deliberate rather than inherited).

## Cross-references

- `.planning/phases/69-alliance-card-lane-a/69-CONTEXT.md` "Deferred Ideas"
- `.planning/phases/69-alliance-card-lane-a/69-RESEARCH.md` "Risk Register" Risks #1 + #7
- `apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts` (post-Phase-69) JSDoc anchor "# Future refactor"
- Phase 69 partial-step commits: `194e0a5aa` (impute generalisation) + `1f645683b` (matchStore cascade) + `727a9d551` (regression-guard test)
