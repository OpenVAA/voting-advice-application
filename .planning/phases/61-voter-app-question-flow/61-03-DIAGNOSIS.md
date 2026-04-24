# Phase 61 Plan 03 — Candidate-Questions TestId Visibility Diagnosis

**Date:** 2026-04-24
**Author:** Plan-61-03 executor (Claude) — Task 1 diagnostic pass
**Status:** Complete — Hypothesis A confirmed (with preceding Vite-cache surface bug)

## Summary

Root cause of the 6 direct `candidate-questions.spec.ts` failures is a **compound bug**:

1. **Surface bug (Vite pre-bundle cache):** Plan 61-01 added `isBooleanQuestion` to `@openvaa/data`. Vite's dep-optimizer did not re-bundle `@openvaa_data.js` because workspace-package content changes do not bust Vite's lockfile/config-hash cache. Any cold dev-server session after Plan 61-01 landed serves the stale pre-bundle → browser throws `SyntaxError: ... does not provide an export named 'isBooleanQuestion'` on import → protected layout's validity-derived goes into `error` state → page renders `<ErrorMessage>` ("Internal Error") instead of Loading/ready. **Fix: force re-optimization via `rm -rf apps/frontend/node_modules/.vite` + restart dev server.**

2. **Deep bug (reactivity chain):** After the Vite-cache surface is cleared, a second failure emerges. The candidateContext `$derived` chain (`selectedElections → _questionCategories → _opinionQuestionCategories → _opinionQuestions`) is captured at component-init time with initial (pre-data) values and **never re-evaluates after `reactiveDataRoot` and `userData.savedData` are populated by the protected layout `$effect`**. Console-trace confirmation: each derivation runs exactly once with all-zero counts; the `dataRoot.subscribe` → `version++` bridge DOES fire twice (once for protected's `provideQuestionData`/`provideEntityData`/`provideNominationData` and once for root's `provideElectionData`/`provideConstituencyData`), but no downstream `$derived` re-runs. This is the same reactivity-class bug pattern as QUESTION-03 — the reactive signal doesn't propagate across the function-accessor boundary used by `questionCategoryStore`/`questionStore` helpers.

## Hypothesis A

Per plan §Pattern 3, this is **Hypothesis A (reactivity)**. The `$derived` chain in `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` does not propagate dependency invalidation across the helper-store function-accessor boundary (`() => selectedElections` / `() => reactiveDataRoot.current`). Same reactivity class as Plan 61-02 QUESTION-03 fixed it on the voter side; the candidate side still has this issue on `selectedElections` + `selectedConstituencies` (plus the downstream chain).

The Vite-cache surface bug (compound #1) is outside the plan's 4-hypothesis framework but is the FIRST thing that must be fixed to expose hypothesis A. Without clearing `.vite/deps`, diagnostic becomes impossible because the page never reaches the reactivity layer.

## Evidence

### Evidence 1 — Vite Pre-bundle Cache SyntaxError (Trace 1)

Initial failure (before any diagnostic): Playwright snapshot shows `heading "Internal Error"` — the protected layout's `<ErrorMessage>` branch. Parsed browser console from `tests/playwright-results/candidate-questions-candid-1f3f7-anized-by-category-CAND-05--candidate-app/trace.zip`:

```
[error] SyntaxError: The requested module '/node_modules/.vite/deps/@openvaa_data.js?v=bb442381'
        does not provide an export named 'isBooleanQuestion'
```

Verified:
- `grep -c "isBooleanQuestion" packages/data/dist/index.js` → 2 (the data package IS built with the export)
- `grep -c "isBooleanQuestion" apps/frontend/node_modules/.vite/deps/@openvaa_data.js` → **0** (stale pre-bundle DOES NOT export it)
- `ls -la apps/frontend/node_modules/.vite/deps/@openvaa_data.js` → `Apr 23 15:58` (from before Plan 61-01 landed `isBooleanQuestion` on `2026-04-24`)

Resolution: `rm -rf apps/frontend/node_modules/.vite` + restart `yarn dev` forces Vite to re-scan and re-bundle. Post-restart `@openvaa_data.js` contains `isBooleanQuestion` (2 matches) and is dated `Apr 24 21:19`.

### Evidence 2 — Reactivity Chain Stuck (Trace 2, post-cache-clear)

After the Vite-cache fix, the page no longer shows Internal Error. Instead, it shows "There are no questions related to your constituency in the Election Compass yet." (the `error.noQuestions` fallback in `candidate/(protected)/questions/+layout.svelte:60` — the intermediate questions layout). This is triggered by the layout's `{#if unansweredRequiredInfoQuestions.length === 0 && opinionQuestions.length > 0}` guard evaluating FALSE because `opinionQuestions.length === 0`.

I added targeted `console.log('[DIAG Q4 ...]', ...)` statements at each node in the chain (candidateContext, questionStore, questionCategoryStore, dataContext). Diagnostic trace output (ordered by browser timeline):

```
[DIAG Q4 selectedElections]       {drElections: 0, hasCurrent: false, hasScd: false, nominationsLen: n/a}
[DIAG Q4 questionCategoryStore]   {drElectionsLen: 0, drQuestionCategoriesLen: 0, electionsLen: 0, constituenciesLen: 0, entityType: candidate}
[DIAG Q4 questionStore]           {appType: candidate, catsLen: 0, electionsLen: 0, constituenciesLen: 0}
[DIAG Q4] (questions/+layout)     {runNumber: 1, opinionQuestionsLen: 0, unansweredOpinionQuestionsLen: 0, unansweredRequiredInfoQuestionsLen: 0, ts: 96783}
[DIAG Q4 dataRoot.subscribe]      {version: 1, elections: 0, questionCategories: 5}
[DIAG Q4 protected] ((protected)/+layout)  {validityState: resolved, layoutState: ready, hasSavedCandidateData: true, drElectionsLen: 0, drQuestionCategoriesLen: 5}
[DIAG Q4 dataRoot.subscribe]      {version: 2, elections: 2, questionCategories: 5}
[DIAG Q4 root] (/+layout)         {hasValidityError: false, drElectionsLenAfter: 2, loaderElectionDataType: array(2)}
```

Key observations:
1. **All four `$derived` nodes in the candidateContext chain run EXACTLY ONCE**, with initial (empty) values — before any data is provided.
2. **The `dataRoot.subscribe` callback fires twice** with `version: 1` (after protected's update) and `version: 2` (after root's update), proving the DataRoot → dataContext `version++` bridge is working.
3. **At version=2, DataRoot has `elections: 2, questionCategories: 5`** (fully populated), but NO downstream `$derived` re-evaluates.
4. **The child `questions/+layout.svelte` `$effect` runs exactly once** (`runNumber: 1`, `opinionQuestionsLen: 0`) — it never re-fires, so the `{#if opinionQuestions.length > 0}` branch in its template stays false → "no questions" fallback persists for the full 15s test window.
5. **Effect execution order (innermost → outermost):** child questions layout `$effect` → protected layout `$effect` → root layout `$effect`. The protected layout provides question/entity/nomination data BEFORE the root layout provides election/constituency data. The inner-first order means `provideNominationData` runs when `dr.elections` is still empty.

This matches RESEARCH §Pitfall 2 (`effect_update_depth_exceeded` root-cause family) and §Pattern 3 Hypothesis A exactly: the `$derived` chain bridging `reactiveDataRoot.current` and `userData.current` through helper-store function accessors (`selectedElections: () => selectedElections`) does not establish a reactive edge that survives the `version++` / `savedData = data` writes.

### Evidence 3 — Plan 61-01 E2E Was Never Run

Per `61-01-SUMMARY.md` and `61-02-SUMMARY.md`, E2E specs were not run during those plans:

> "E2E `yarn playwright test ... voter-questions.spec.ts --workers=1` → NOT RUN in session"

So the Vite-cache surface bug introduced by Plan 61-01 has been latent on main since 2026-04-24, surfacing only at Plan 61-03 Task 1 when the Playwright spec actually ran against a cold dev server.

## Fix Location

**Deep bug (reactivity chain):** `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` lines 108-149.

The `$derived.by` declarations for `selectedElections`, `selectedConstituencies`, `_questionCategories`, `_infoQuestionCategories`, `_opinionQuestionCategories`, `_infoQuestions`, `_opinionQuestions`, `_questionBlocks` collectively form a chain that captures dependencies at component-init but fails to re-derive after `reactiveDataRoot.current.elections` and `userData.savedCandidateData` change.

**Surface bug (Vite pre-bundle cache):** Dev-server hygiene. Two possible code-landable fixes:
1. Add `optimizeDeps.exclude: ['@openvaa/data', '@openvaa/core', '@openvaa/app-shared', '@openvaa/matching', '@openvaa/filters']` to `apps/frontend/vite.config.ts` — tells Vite to NOT pre-bundle workspace packages; always consumes built `dist/` directly. This is the idiomatic Vite pattern for monorepo workspace deps and prevents the stale-cache class of bugs entirely.
2. Alternatively, hook the build/dev scripts to run `rm -rf apps/frontend/node_modules/.vite` after `yarn build --filter=@openvaa/data` (less robust — relies on build-ordering discipline).

Option 1 is simpler, self-documenting in the config, and prevents recurrence. Apply alongside the reactivity fix.

## Fix Shape

Apply **Branch A (reactivity fix)** per plan §Task 2, with additional surface-level hygiene:

### Part 1 — Push-based reactive bridge (Branch A canonical fix)

Replace the `selectedElections` / `selectedConstituencies` `$derived.by` pattern with an `$effect`-pushed `$state` mirror. This matches the Phase 60 "split $derived + $effect" idiom where push semantics are needed instead of pull. The minimal change:

```ts
// BEFORE (stuck pull-chain):
const selectedElections = $derived.by(() => {
  const dr = reactiveDataRoot.current;
  const current = userData.current;
  if (!current) return [];
  return removeDuplicates(current.nominations.nominations.map((n) => dr.getElection(n.electionId)));
});

// AFTER (push-based via $state + $effect):
let selectedElections = $state<Array<Election>>([]);
$effect(() => {
  const dr = reactiveDataRoot.current;
  const current = userData.current;
  if (!current || dr.elections.length === 0) {
    selectedElections = [];
    return;
  }
  selectedElections = removeDuplicates(current.nominations.nominations.map((n) => dr.getElection(n.electionId)));
});
```

Same transformation for `selectedConstituencies`. The downstream `$derived` chain (`_questionCategories`, `_opinionQuestions`, etc.) will pull the updated value because the `$state` write eagerly notifies consumers — unlike the pull-only `$derived.by` chain, which is never pulled past its initial evaluation when consumers (the child layout `$effect`) fire only once at mount.

Verify:
- Effect runs at least twice during page load (once for initial evaluation, once after data is provided).
- No `effect_update_depth_exceeded` warnings (the effect writes `$state` but doesn't re-read it).
- `selectedElections`'s getter on the context object returns the `$state` directly.

### Part 2 — Surface-level Vite hygiene (additive, prevents recurrence)

In `apps/frontend/vite.config.ts`, add:

```ts
optimizeDeps: {
  exclude: [
    '@openvaa/app-shared',
    '@openvaa/core',
    '@openvaa/data',
    '@openvaa/filters',
    '@openvaa/matching'
  ]
}
```

This tells Vite to skip pre-bundling these workspace packages so changes to their built `dist/` output are picked up immediately on dev-server restart without requiring a `.vite/deps` wipe. This is the Vite-recommended pattern for monorepo workspace packages (https://vitejs.dev/config/dep-optimization-options.html#optimizedeps-exclude).

### Part 3 — Spec timeout expectation

No spec-side change needed. The existing `waitForLoad({ timeout: 15000 })` is adequate once the reactivity chain propagates.

## Console Warnings / Errors Encountered

- **[CRITICAL] SyntaxError** on `@openvaa_data.js?v=bb442381` — root cause of surface failure; disappears after `.vite/deps` wipe.
- **[warning] The next HMR update will cause the page to reload** — Vite HMR notice, benign.
- **[warning] svelte-visibility-change has svelte field but no exports condition** — pre-existing, orthogonal.
- No `effect_update_depth_exceeded` warnings detected.
- No Svelte 5 deprecation warnings related to the candidate flow.

## Estimated Impact

- **Direct tests (candidate-questions.spec.ts):** fixes all 6 direct failures.
- **Cascade tests:** candidate-app-mutation (registration/profile), candidate-app-settings, candidate-app-password, re-auth-setup — 18 tests that run AFTER the candidate-app project in the Playwright dependency chain. The cascade-block was because the candidate-app project never completed `auth-setup → candidate-app` cleanly; with the gate test now passing, downstream projects run. Cascade PASS count vs FAIL count depends on orthogonal state; the plan only requires them to RUN (not necessarily pass), per ROADMAP SC-4 contract.
- **Voter app:** The equivalent reactivity chain in `voterContext.svelte.ts` uses the same helper-store accessor pattern. Plan 61-02 addressed `_selectedQuestionCategoryIds` but did NOT touch `selectedElections`/`selectedConstituencies`. If the voter-app Playwright tests also have this issue, they may surface after this fix lands. Plan 61-02 SUMMARY notes E2E was not run. Risk: voter-side reactivity may need a follow-up fix (out of 61-03 scope — see Deferred Items below).

## Outcome

_(To be filled during Task 2)_

Post-fix spec run results will go here after Task 2 applies the canonical fix.

## Deferred Items (Out of 61-03 Scope)

1. **Voter-context parallel reactivity break:** `voterContext.svelte.ts` has the same `$derived.by(() => { ...reactiveDataRoot.current, ..._electionId.value... })` pattern as candidate's `selectedElections`. If voter E2E surfaces equivalent failures, open a follow-up requirement under `QUESTION-05` (or equivalent) in Phase 62/63.

2. **Structural refactor of helper-store function accessors:** The `questionCategoryStore({ selectedElections: () => selectedElections })` pattern is used in both voter and candidate contexts. A broader refactor to pass `$state` refs (or use `setContext`-style reactive sources) would eliminate the whole class. Deferred to a future structural-cleanup milestone.

3. **Plan-01 E2E gap:** Plan 61-01 + Plan 61-02 both marked E2E as "deferred to phase-verifier / user's next `yarn dev && yarn test:e2e` run". Consider adding a mandatory E2E smoke-test command to the plan template for reactivity-touching plans so that Vite-cache surface bugs surface at plan-time, not Phase 63.

## References

- `tests/playwright-results/candidate-questions-candid-1f3f7-anized-by-category-CAND-05--candidate-app/trace.zip`
- `apps/frontend/src/routes/candidate/(protected)/+layout.svelte:115-136` (parent $effect)
- `apps/frontend/src/routes/candidate/(protected)/questions/+layout.svelte:57` (intermediate gate)
- `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte:49-55` (page completion enum)
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:108-149` (reactivity-broken chain)
- `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts:56-77` (_current derivation)
- `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts:37-39` (dataRoot.subscribe → version++ bridge)
- `.planning/phases/61-voter-app-question-flow/61-RESEARCH.md` §Pattern 3 §Pitfall 2 §Pitfall 4
- `.planning/phases/60-layout-runes-migration-hydration-fix/60-RESEARCH.md` §Common Pitfalls (Phase 60's canonical `get() + untrack()` pattern — reference only; this plan uses the push-based $state+$effect variant instead, because the issue here is pull-chain staleness, not effect self-retrigger)
