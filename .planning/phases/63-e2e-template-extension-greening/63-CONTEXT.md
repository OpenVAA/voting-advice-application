# Phase 63: E2E Template Extension & Greening - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning
**Milestone:** v2.6 Svelte 5 Migration Cleanup (closing phase)

<domain>
## Phase Boundary

Close milestone v2.6 on two fronts:

1. **E2E-02 (Template Extension):** Extend the `@openvaa/dev-seed` e2e template with an `app_settings.fixed[]` block so the 4 legacy `updateAppSettings(...)` calls in test setup files (`data.setup.ts` + 3 variant setups, ~60 lines) can be deleted. Variant-specific settings differences preserved via base-plus-overlay deep merge.

2. **E2E-01 (Greening Measurement):** Run the final v2.6 parity capture against baseline SHA `3c57949c8` and produce a `diff.md` documenting the cumulative reclamation from Phases 60/61/62 (expected ≈61 test flips: 2 LAYOUT-02 direct + 6 QUESTION-04 direct + ~53 cascades). Any non-reclaimed residuals are documented as framework-level (upstream Svelte bug, Playwright concurrency issue) with specific pointers, or they block close. Phase 63 reserves a small budget (2-3 fixes) for targeted residual work if the expected reclamation didn't fully land; exceeding the budget escalates.

Also ships: the v2.6 post-close baseline artifact for `/gsd-complete-milestone` to consume when re-anchoring the parity-gate script's embedded constants.

Scope covers RESULTS from E2E-01, E2E-02. Success measured by:
- 4 legacy `updateAppSettings(...)` blocks deleted from `tests/tests/setup/` files; no equivalent settings state loss.
- Playwright parity gate verdict against `3c57949c8`: pass-set strictly grown per the Phase 60/61/62 cumulative contract; no documented-framework-level-exempt residuals.
- Fresh post-v2.6 baseline JSON captured and committed at `.planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json`.

Out of scope for this phase: spec-level `updateAppSettings` calls that are scenario-specific test mutations (stay as-is), `SupabaseAdminClient.updateAppSettings()` method deprecation (stays; JSDoc updated), any non-v2.6-planned greening work, milestone-close mechanics (re-anchoring script constants happens in `/gsd-complete-milestone` using the artifact Phase 63 produces).

</domain>

<decisions>
## Implementation Decisions

### Template Design for `app_settings.fixed[]` (E2E-02)

- **D-01:** Template field shape follows the existing dev-seed generator pattern: `app_settings: { fixed: [{ external_id: string, value: Partial<AppSettings> }] }`. Writer's Pass-5 (`merge_jsonb_column`) handles merging each row's `value` into the app_settings JSONB record. Consistent with `ctx.ts`'s existing `app_settings: Array<{ external_id: string }>` shape.
- **D-02:** Base-plus-overlay via **deep merge** using a shared `mergeSettings` utility. **Add `mergeSettings()` to `@openvaa/app-shared`** (no such utility exists today — grep verified). Dev-seed imports it for merging base-e2e + variant templates. The frontend layer can also import it when applying `appCustomization` overrides client-side. If `@openvaa/app-shared` is not importable from `@openvaa/dev-seed` for dependency-direction reasons, implement the same semantics in dev-seed with an explicit code-level marker comment pointing to `@openvaa/app-shared` as source-of-truth — and mark both sites so future maintainers know to keep them in sync.
- **D-03:** Variant-specific overlays live **inline in each variant template file** at `tests/tests/setup/templates/variant-*.ts`. Each variant declares only the keys it differs on (e.g., variant-constituency omits the `results` block; variant-multi-election may add its own `elections.allowSelection`). Same file owns the full variant surface for readability.
- **D-04:** After the template ships and verification (D-10) confirms equivalent state, **delete all 4 `updateAppSettings(...)` call sites** in `tests/tests/setup/`. Preserve `SupabaseAdminClient.updateAppSettings()` method for spec-level scenario mutations (per D-11).

### Greening Measurement & Close Criteria (E2E-01)

- **D-05:** Pass-set **strictly grows** per the cumulative Phase 60/61/62 reclamation contract. Expected flips relative to baseline `3c57949c8` (41 pass / 10 data-race / 38 cascade / 89 total):
  - Phase 60: 2 LAYOUT-02 direct (`candidate-registration.spec.ts:64`, `candidate-profile.spec.ts:51`) + ~35 LAYOUT-02 cascade
  - Phase 61: 6 QUESTION-04 direct (`candidate-questions.spec.ts`) + 18 cascade (candidate-app-mutation/settings/password + re-auth-setup)
  - Phase 62: cumulative effect on voter-results-related tests (filter re-enablement, route refactor); specific test flips TBD based on 62 execution
  - Data-race pool: may shift within itself but not grow
- **D-06:** **Documented-framework-level** residuals allowed; everything else blocks close. Any test expected to reclaim but didn't must be either (a) documented as upstream Svelte 5 bug / Playwright concurrency / Supabase CLI flake with a specific pointer (GitHub issue link, repro case, or code line citation), or (b) a milestone-close blocker. No "generic flake" excuse. Matches ROADMAP SC-2 wording.
- **D-07:** Phase 63 budget = (1) E2E-02 template extension + migration + parity run, (2) full parity measurement + diff.md classification, **(3) reserved budget of 2-3 small targeted residual fixes** if expected reclamations didn't fully land. Hard cap — if residuals exceed the budget, escalate rather than expand scope. This allows Phase 63 to be a measurement-plus-polish phase without becoming an open-ended greening sinkhole.
- **D-08:** New v2.6 tests (Phase 60's `voter-popup-hydration.spec.ts`, Phase 61's candidate-questions related additions if any, Phase 62's filter/route tests) are treated **additive-neutral** per Phase 60 B-3 validation (empirically confirmed that the parity script's out-of-baseline handling classifies new tests as non-regression). No re-embed needed during Phase 63 measurement; re-embed happens at milestone-close (D-13).

### Scope of `updateAppSettings` Migration

- **D-09:** Migration target = **4 setup files + any spec-level defensive-baseline calls** identified during execution. The 4 confirmed setup files:
  - `tests/tests/setup/data.setup.ts:53` (default e2e; full settings incl. `results.cardContents`)
  - `tests/tests/setup/variant-constituency.setup.ts:41` (no `results` block)
  - `tests/tests/setup/variant-multi-election.setup.ts:43`
  - `tests/tests/setup/variant-startfromcg.setup.ts:44`

  During execution, executor does a deeper read of **spec-level** `updateAppSettings` calls (candidate-settings.spec.ts, voter-popup-hydration.spec.ts, results-sections.spec.ts, startfromcg.spec.ts, variant-startfromcg.spec.ts) to classify each as either:
  - **Scenario mutation** (per-test setup; stays as-is) — expected majority
  - **Defensive baseline** (re-applies same settings the setup file would have applied, belt-and-suspenders style) — if found, migrate too

- **D-10:** Verification strategy = **post-seed assertion**. After the pipeline + writer runs, query the seeded `app_settings` record from Supabase and deep-compare to the expected shape. Fail setup if drift detected. This is a cheaper first-pass check than the full parity gate; the parity gate in D-05 still implicitly validates end-to-end equivalent state.

- **D-11:** **Keep `SupabaseAdminClient.updateAppSettings()` method** — spec-level scenario mutations (e.g., `candidate-settings.spec.ts` testing settings-related behavior) legitimately need it. Update the method's JSDoc to note that baseline-setup usage has migrated to the `@openvaa/dev-seed` e2e template as of v2.6; the method is retained for per-test scenario mutations. No deprecation flag.

### Post-v2.6 Parity Baseline Re-anchoring

- **D-12:** **Re-anchor at v2.6 close** to a new post-v2.6 SHA. Capture a fresh deterministic Playwright run (`yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json`) after Phase 63 merges; save as the v2.6 baseline artifact. v2.7 phases measure against this new anchor.
- **D-13:** Ownership split:
  - **Phase 63** captures the baseline artifact: save at `.planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json`; commit.
  - **`/gsd-complete-milestone`** updates the diff-playwright-reports.ts script's embedded constants (PASS_LOCKED / DATA_RACE / CASCADE test sets) to reference the new baseline. This is milestone-infrastructure work, not phase-deliverable work. Separation of concerns keeps Phase 63's acceptance criteria clean.
- **D-14:** Constant regeneration strategy = **regenerate all three sets from the v2.6 baseline JSON at re-anchor time**. Given the new baseline, derive: `PASS_LOCKED` = tests with status `passed` or `expected`; `DATA_RACE` = flaky-by-criterion per existing classification rules (multi-run comparison if available, or heuristic from test file); `CASCADE` = remaining expected-failure set. Uses the same classification logic Phase 59 established. Canonical refresh, not incremental.
- **D-15:** **Keep v2.5 baseline artifact in place** at `.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json`. Historical record of v2.5 state; Phase 63 diff.md references it for the v2.6-vs-v2.5 measurement. Cheap (~188 KB) and preserves the audit trail.

### Claude's Discretion

- Plan split within Phase 63 (one plan per REQ-ID vs grouped). Starting suggestion: Plan 63-01 (`mergeSettings` utility in `@openvaa/app-shared` + dev-seed template shape), Plan 63-02 (e2e + variant template population + migration of the 4 setup-file calls + spec-level audit), Plan 63-03 (full parity run + diff.md + v2.6 baseline capture + residual-fix budget).
- Exact shape of the `mergeSettings` utility API (`mergeSettings(base, ...overlays)` vs fluent). Planner picks based on what fits both dev-seed and frontend consumption patterns.
- Exact shape of the post-seed deep-compare assertion (which fields are compared; tolerance for ordering differences in arrays).
- The "up to 2-3 small targeted residual fixes" budget (D-07): which fixes land if any are needed. Planner-level judgment.
- Whether the defensive-baseline classification (D-09) produces migrations or stays as-is — decided per-call during execution.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements

- `.planning/ROADMAP.md` §Phase 63 — Goal, Depends on, Requirements (E2E-01/02), Success Criteria
- `.planning/REQUIREMENTS.md` §E2E — requirement text for E2E-01 and E2E-02 (NOTE: E2E-01 was auto-marked complete by Phase 60's `phase.complete` handler due to LAYOUT-02 expected reclamation; Phase 63 is the authoritative close)

### Prior-Phase Artifacts (measurement input)

- `.planning/phases/60-layout-runes-migration-hydration-fix/post-change/diff.md` — Phase 60 parity classification; 24 Category A regressions with full classification
- `.planning/phases/60-layout-runes-migration-hydration-fix/post-change/playwright-report.json` — Phase 60 post-change baseline
- `.planning/phases/60-layout-runes-migration-hydration-fix/60-VERIFICATION.md` — goal-backward analysis
- `.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json` — v2.5 baseline (`3c57949c8`); anchor reference for Phase 63
- `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` — parity gate tool; B-3 validated as additive-neutral for out-of-baseline tests in Phase 60

### Target Files (E2E-02 Migration)

- `tests/tests/setup/data.setup.ts` — lines 53-72 (full settings block); migrate
- `tests/tests/setup/variant-constituency.setup.ts` — lines 41-51 (no `results` block)
- `tests/tests/setup/variant-multi-election.setup.ts` — line 43+
- `tests/tests/setup/variant-startfromcg.setup.ts` — line 44+
- `tests/tests/setup/templates/variant-constituency.ts` — target for variant-specific `app_settings.fixed[]` overlay
- `tests/tests/setup/templates/variant-multi-election.ts` — same
- `tests/tests/setup/templates/variant-startfromcg.ts` — same
- `packages/dev-seed/src/templates/e2e.ts` — target for base `app_settings.fixed[]` block
- `packages/dev-seed/src/types.ts` — add `app_settings` field to template type
- `packages/dev-seed/src/writer.ts:121-155` — existing app_settings Pass-5 routing (reference; no changes needed)
- `packages/dev-seed/src/pipeline.ts:89` — `'app_settings'` already in entity list (reference)
- `packages/app-shared/src/settings/` — location for new `mergeSettings` utility (D-02)
- `tests/tests/utils/supabaseAdminClient.ts` — update JSDoc for `updateAppSettings()` per D-11

### Spec-Level Files (audit for defensive-baseline classification per D-09)

- `tests/tests/specs/candidate/candidate-settings.spec.ts` (9+ updateAppSettings calls; expect scenario mutations)
- `tests/tests/specs/voter/voter-popup-hydration.spec.ts` (new in Phase 60; setTimeout popup trigger uses updateAppSettings)
- `tests/tests/specs/variants/results-sections.spec.ts` (4+ calls)
- `tests/tests/specs/variants/startfromcg.spec.ts` (2 calls)

### E2E Surfaces

- `tests/playwright.config.ts` — invoke via `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json` for deterministic capture
- `.planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json` — target path for v2.6 baseline artifact (D-13)

### Cross-Phase References

- Phase 60 `60-CONTEXT.md` D-11 — parity gate methodology origin (SHA `3c57949c8`, `--workers=1`, delta rule)
- Phase 60 diff.md — Category A classification pattern for orthogonal surfaced failures
- Phase 61 `61-CONTEXT.md` — QUESTION-04 expected cumulative contribution (6 direct + 18 cascade)
- Phase 62 `62-CONTEXT.md` — RESULTS scope cumulative contribution (exact test deltas TBD based on 62 execution)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **Dev-seed writer Pass-5 (`updateAppSettings` via merge_jsonb_column RPC)** — already implemented in `packages/dev-seed/src/writer.ts:154-173`. No changes to the writer needed; template just needs to declare `app_settings.fixed[]`.
- **Existing dev-seed ctx shape** — `ctx.ts:47,103` already tracks `app_settings: Array<{ external_id: string }>`. Matches D-01.
- **Pipeline entity enumeration** — `packages/dev-seed/src/pipeline.ts:89` already lists `'app_settings'`. Matches D-01.
- **`runPipeline(template, overrides) + Writer.write(rows, prefix)` flow** — already used by all 4 setup files; migration just removes the post-pipeline `updateAppSettings` call.
- **Phase 59 parity diff script** — canonical comparison tool; B-3 validated for out-of-baseline tests; reuse for Phase 63 measurement.
- **Phase 60 Category A classification pattern** — orthogonal-failure classification methodology is reusable for Phase 63 residuals if any.

### Established Patterns

- **Template generator pattern**: every fixed-rows entity declares `{ fixed: [{ external_id, value: ... }], count, ... }`. `app_settings` follows the same shape (D-01).
- **Variant template extending base**: variants import the base e2e template and spread + override (`{ ...e2eBase, entities: { ... } }`). Deep merge via `mergeSettings` utility (D-02) extends this pattern to `app_settings`.
- **`@openvaa/app-shared` for cross-module utilities**: existing precedent for shared utilities between frontend and package code (e.g., `staticSettings`, `getCustomData`, etc.). New `mergeSettings` fits this pattern.
- **Parity gate as final measurement**: `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json` → diff-playwright-reports.ts → verdict. Same pattern as Phase 60 Plan 60-05.

### Integration Points

- **`mergeSettings` utility**: called by dev-seed template loading (for base+variant merge) and potentially by frontend `appCustomization` overlay application. Shared type shape: `(base: Partial<AppSettings>, ...overlays: Array<Partial<AppSettings> | undefined>) => Partial<AppSettings>`.
- **Post-seed assertion** (D-10): called by each of the 4 setup files after `writer.write(...)`. Reads `app_settings` row via `SupabaseAdminClient` (or direct Supabase client), deep-compares to the expected settings (derived from the template's `mergeSettings(base, variant)` output).
- **`/gsd-complete-milestone` handoff** (D-13): milestone-close workflow reads `.planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json` and updates `diff-playwright-reports.ts` constants. Phase 63 doesn't touch the script; it just delivers the artifact.

</code_context>

<specifics>
## Specific Ideas

- **`mergeSettings` shared utility** (D-02) is the single biggest cross-cutting addition in Phase 63. Its location in `@openvaa/app-shared` opens future reuse: the frontend's `appCustomization` layer currently applies translation overrides; it could use `mergeSettings` for other cross-level merges too. Keep the utility small, pure, and well-tested (Vitest unit coverage).
- **Defensive-baseline classification** (D-09) is a judgment call per call site. Rule of thumb: if the spec's `updateAppSettings(...)` matches the setup file's block exactly (or is a subset), it's defensive (migrate); if it changes specific keys to test behavior-under-different-settings (e.g., `{ notifications: { voterApp: { show: true } } }` when the setup disabled it), it's a scenario mutation (keep).
- **Residual-fix budget** (D-07) matters because Phase 60 already showed cascade reclamation is compound (Category A vs Category B). Phase 63 may encounter test flips that don't match the expected contract; the budget gives room to fix 1-3 without re-opening phase scope.
- **Re-anchor split** (D-13) is specifically designed so Phase 63's verification (post-seed assertion + parity gate) has a clean acceptance without depending on script constants that Phase 63 itself is about to update. The clean separation: Phase 63 measures against v2.5 anchor; milestone-close establishes v2.6 anchor using Phase 63's artifact; v2.7 phases use v2.6 anchor.

</specifics>

<deferred>
## Deferred Ideas

- **`SupabaseAdminClient.updateAppSettings()` deprecation**: D-11 explicitly keeps the method; a future phase may introduce a declarative settings-mutation pattern (e.g., test-scoped settings override that auto-restores) and at that point the method could be deprecated. Not Phase 63.
- **Declarative test-scoped settings mutation DSL**: spec-level calls currently use imperative `await client.updateAppSettings({...})`. A declarative alternative (e.g., `test.use({ appSettings: { notifications: {...} } })`) would clean up per-test mutations. Future DX improvement.
- **Automated classification of new tests into PASS_LOCKED/DATA_RACE/CASCADE**: D-14 picks canonical regeneration from the v2.6 baseline. A future enhancement could automate the DATA_RACE classification (multi-run detection), but the current heuristic-based classification is adequate.
- **Milestone-close workflow hardening**: D-13 describes the Phase-63→milestone-close handoff. The `/gsd-complete-milestone` workflow may need enhancement to handle the re-anchor consistently (if it doesn't already). Track separately.
- **Cross-package `mergeSettings` import feasibility**: D-02 describes the fallback of duplicating the utility if `@openvaa/dev-seed` can't import from `@openvaa/app-shared`. If the fallback lands, open a follow-up to unify once the dependency graph allows (likely at the `fromStore/toStore bridge retirement` milestone or a dep-graph refactor).

### Reviewed Todos (not folded)

None — the Phase 58 UAT findings (`svelte5-cleanup.md`) flow to Phase 61; the Phase 59 Plan 04 follow-up (`app_settings.fixed[]`) is exactly E2E-02 (folded); `entity-list-controls-infinite-loop.md` flows to Phase 62. No uncategorized todos apply to Phase 63.

</deferred>

---

*Phase: 63-e2e-template-extension-greening*
*Context gathered: 2026-04-24*
