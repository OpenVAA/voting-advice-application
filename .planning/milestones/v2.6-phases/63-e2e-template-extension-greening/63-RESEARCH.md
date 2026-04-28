# Phase 63: E2E Template Extension & Greening - Research

**Researched:** 2026-04-24
**Domain:** dev-seed template extension + Playwright E2E parity-gate measurement (milestone close)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Template Design for `app_settings.fixed[]` (E2E-02)

- **D-01:** Template field shape follows the existing dev-seed generator pattern: `app_settings: { fixed: [{ external_id: string, value: Partial<AppSettings> }] }`. Writer's Pass-5 (`merge_jsonb_column`) handles merging each row's `value` into the app_settings JSONB record. Consistent with `ctx.ts`'s existing `app_settings: Array<{ external_id: string }>` shape.
- **D-02:** Base-plus-overlay via **deep merge** using a shared `mergeSettings` utility. **Add `mergeSettings()` to `@openvaa/app-shared`** (no such utility exists today — grep verified). Dev-seed imports it for merging base-e2e + variant templates. The frontend layer can also import it when applying `appCustomization` overrides client-side. If `@openvaa/app-shared` is not importable from `@openvaa/dev-seed` for dependency-direction reasons, implement the same semantics in dev-seed with an explicit code-level marker comment pointing to `@openvaa/app-shared` as source-of-truth — and mark both sites so future maintainers know to keep them in sync.
- **D-03:** Variant-specific overlays live **inline in each variant template file** at `tests/tests/setup/templates/variant-*.ts`. Each variant declares only the keys it differs on (e.g., variant-constituency omits the `results` block; variant-multi-election may add its own `elections.allowSelection`). Same file owns the full variant surface for readability.
- **D-04:** After the template ships and verification (D-10) confirms equivalent state, **delete all 4 `updateAppSettings(...)` call sites** in `tests/tests/setup/`. Preserve `SupabaseAdminClient.updateAppSettings()` method for spec-level scenario mutations (per D-11).

#### Greening Measurement & Close Criteria (E2E-01)

- **D-05:** Pass-set **strictly grows** per the cumulative Phase 60/61/62 reclamation contract. Expected flips relative to baseline `3c57949c8` (41 pass / 10 data-race / 38 cascade / 89 total):
  - Phase 60: 2 LAYOUT-02 direct (`candidate-registration.spec.ts:64`, `candidate-profile.spec.ts:51`) + ~35 LAYOUT-02 cascade
  - Phase 61: 6 QUESTION-04 direct (`candidate-questions.spec.ts`) + 18 cascade (candidate-app-mutation/settings/password + re-auth-setup)
  - Phase 62: cumulative effect on voter-results-related tests (filter re-enablement, route refactor); specific test flips TBD based on 62 execution
  - Data-race pool: may shift within itself but not grow
- **D-06:** **Documented-framework-level** residuals allowed; everything else blocks close. Any test expected to reclaim but didn't must be either (a) documented as upstream Svelte 5 bug / Playwright concurrency / Supabase CLI flake with a specific pointer (GitHub issue link, repro case, or code line citation), or (b) a milestone-close blocker. No "generic flake" excuse. Matches ROADMAP SC-2 wording.
- **D-07:** Phase 63 budget = (1) E2E-02 template extension + migration + parity run, (2) full parity measurement + diff.md classification, **(3) reserved budget of 2-3 small targeted residual fixes** if expected reclamations didn't fully land. Hard cap — if residuals exceed the budget, escalate rather than expand scope.
- **D-08:** New v2.6 tests (Phase 60's `voter-popup-hydration.spec.ts`, Phase 61's candidate-questions related additions if any, Phase 62's filter/route tests) are treated **additive-neutral** per Phase 60 B-3 validation. No re-embed needed during Phase 63 measurement; re-embed happens at milestone-close (D-13).

#### Scope of `updateAppSettings` Migration

- **D-09:** Migration target = **4 setup files + any spec-level defensive-baseline calls** identified during execution. The 4 confirmed setup files:
  - `tests/tests/setup/data.setup.ts:53` (default e2e; full settings incl. `results.cardContents`)
  - `tests/tests/setup/variant-constituency.setup.ts:41` (no `results` block)
  - `tests/tests/setup/variant-multi-election.setup.ts:43`
  - `tests/tests/setup/variant-startfromcg.setup.ts:44`

  During execution, executor does a deeper read of **spec-level** `updateAppSettings` calls (candidate-settings.spec.ts, voter-popup-hydration.spec.ts, results-sections.spec.ts, startfromcg.spec.ts, variant-startfromcg.spec.ts) to classify each as either:
  - **Scenario mutation** (per-test setup; stays as-is) — expected majority
  - **Defensive baseline** (re-applies same settings the setup file would have applied, belt-and-suspenders style) — if found, migrate too

- **D-10:** Verification strategy = **post-seed assertion**. After the pipeline + writer runs, query the seeded `app_settings` record from Supabase and deep-compare to the expected shape. Fail setup if drift detected. This is a cheaper first-pass check than the full parity gate.
- **D-11:** **Keep `SupabaseAdminClient.updateAppSettings()` method** — spec-level scenario mutations legitimately need it. Update the method's JSDoc to note that baseline-setup usage has migrated to the `@openvaa/dev-seed` e2e template as of v2.6.

#### Post-v2.6 Parity Baseline Re-anchoring

- **D-12:** **Re-anchor at v2.6 close** to a new post-v2.6 SHA. Capture a fresh deterministic Playwright run after Phase 63 merges; save as the v2.6 baseline artifact. v2.7 phases measure against this new anchor.
- **D-13:** Ownership split:
  - **Phase 63** captures the baseline artifact: save at `.planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json`; commit.
  - **`/gsd-complete-milestone`** updates the diff-playwright-reports.ts script's embedded constants to reference the new baseline.
- **D-14:** Constant regeneration strategy = **regenerate all three sets from the v2.6 baseline JSON at re-anchor time**. Canonical refresh, not incremental.
- **D-15:** **Keep v2.5 baseline artifact in place** at `.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json`. Historical record of v2.5 state; Phase 63 diff.md references it for the v2.6-vs-v2.5 measurement.

### Claude's Discretion

- Plan split within Phase 63 (one plan per REQ-ID vs grouped). Starting suggestion: Plan 63-01 (`mergeSettings` utility in `@openvaa/app-shared` + dev-seed template shape), Plan 63-02 (e2e + variant template population + migration of the 4 setup-file calls + spec-level audit), Plan 63-03 (full parity run + diff.md + v2.6 baseline capture + residual-fix budget).
- Exact shape of the `mergeSettings` utility API (`mergeSettings(base, ...overlays)` vs fluent). Planner picks based on what fits both dev-seed and frontend consumption patterns.
- Exact shape of the post-seed deep-compare assertion (which fields are compared; tolerance for ordering differences in arrays).
- The "up to 2-3 small targeted residual fixes" budget (D-07): which fixes land if any are needed. Planner-level judgment.
- Whether the defensive-baseline classification (D-09) produces migrations or stays as-is — decided per-call during execution.

### Deferred Ideas (OUT OF SCOPE)

- **`SupabaseAdminClient.updateAppSettings()` deprecation**: D-11 explicitly keeps the method; a future phase may introduce a declarative settings-mutation pattern. Not Phase 63.
- **Declarative test-scoped settings mutation DSL**: future DX improvement.
- **Automated classification of new tests into PASS_LOCKED/DATA_RACE/CASCADE**: D-14 picks canonical regeneration. A future enhancement could automate DATA_RACE detection.
- **Milestone-close workflow hardening**: track separately if `/gsd-complete-milestone` needs upgrade.
- **Cross-package `mergeSettings` import feasibility**: if D-02's fallback (duplicate utility) lands, open follow-up to unify once the dependency graph allows.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **E2E-01** | E2E carry-forward pool shrinks measurably from the post-v2.5 baseline (10 data-race + 38 cascade failures on SHA `3c57949c8`). LAYOUT-02 alone is expected to reclaim the 2 direct candidate-registration blocks plus ~35 cascaded tests. Any remaining residual is documented as framework-level (upstream Svelte 5 bug or structural test concurrency issue) and does not block milestone close. | §Code Examples (parity-gate invocation), §Architecture Patterns Pattern 4 (parity-gate workflow), §Common Pitfalls 1 (dotenv banner) and 4 (out-of-baseline tests are additive-neutral per Phase 60 B-3), §Standard Stack (existing diff-playwright-reports.ts + 89-test baseline at `3c57949c8`), §Sources (Phase 60 60-05-SUMMARY.md verifying B-3 empirical). |
| **E2E-02** | The `e2e` template in `@openvaa/dev-seed` carries an `app_settings.fixed[]` block whose emitted defaults match the values currently applied by the 4 legacy `updateAppSettings(...)` call sites (`data.setup.ts` + 3 variant setups, ~60 lines per Plan 59-04 Rule-2 follow-up). After the template change lands, the 4 legacy `updateAppSettings(...)` blocks are deleted and the Playwright parity gate prints `PARITY GATE: PASS`. | §Architecture Patterns Pattern 1 (dev-seed `fixed[]` pattern) + Pattern 2 (mergeSettings utility location + bridge), §Code Examples (template shape, settings block, post-seed assertion), §Common Pitfalls 2 (writer Pass-5 expects `row.settings`, not `row.value`) and 3 (variant template extension via `...baseFixed(...)` already in use), §Standard Stack (writer Pass-5 unchanged), §Don't Hand-Roll (frontend `mergeSettings` already exists at `apps/frontend/src/lib/utils/merge.ts`). |

</phase_requirements>

## Summary

Phase 63 is the v2.6 milestone-close phase shipping two largely independent deliverables: (1) extending the `@openvaa/dev-seed` `e2e` template with an `app_settings.fixed[]` block plus a shared `mergeSettings` deep-merge utility, then deleting 4 legacy `updateAppSettings(...)` setup blocks; and (2) running the post-v2.6 Playwright parity gate against baseline SHA `3c57949c8` and capturing the v2.6 baseline artifact for milestone re-anchoring.

The technical surface area is small and exceptionally well-charted: the dev-seed pipeline's Pass-5 (`updateAppSettings` via `merge_jsonb_column` RPC) already exists and routes correctly [VERIFIED: `packages/dev-seed/src/writer.ts:154-181`]; the `app_settings` per-entity fragment is already declared in the template schema [VERIFIED: `packages/dev-seed/src/template/schema.ts:128`]; the `AppSettingsGenerator` already handles `fixed[]` pass-through [VERIFIED: `packages/dev-seed/src/generators/AppSettingsGenerator.ts:62-68`]. The only non-trivial library decision is where the `mergeSettings` utility lives — the frontend already has a working implementation at `apps/frontend/src/lib/utils/merge.ts` that this phase should hoist (not re-implement) into `@openvaa/app-shared` per D-02. The dependency direction is clean: `@openvaa/dev-seed` does NOT currently depend on `@openvaa/app-shared`, but `app-shared` only depends on `@openvaa/data` (no circular risk) [VERIFIED: `packages/app-shared/package.json`].

The parity-gate measurement is mechanically identical to Phase 60 Plan 60-05 — same canonical invocation, same diff script, same Category-A/Category-B classification methodology. Phase 60 already empirically confirmed the B-3 additive-neutral behavior for new tests and documented the dotenv banner pitfall.

**Primary recommendation:** Split into 3 plans aligned to the work boundaries (utility + types, template population + setup migration + spec audit, parity gate + baseline capture + residual budget). Hoist `mergeSettings` from frontend (do not re-implement). Use the writer's existing Pass-5 plumbing unchanged. Re-use Phase 60's parity-gate workflow verbatim.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `mergeSettings` deep-merge utility | Shared package (`@openvaa/app-shared`) | — | Pure-function utility consumed by both dev-seed (Node) and frontend (browser+SSR); already lives in frontend but needs hoisting to allow dev-seed import per D-02. No DOM/storage/network surface. |
| `app_settings.fixed[]` template authoring | Dev tooling / Node package (`@openvaa/dev-seed` template files + `tests/tests/setup/templates/`) | — | Templates are pure declarative TypeScript data files consumed by the seed pipeline at Node runtime; no frontend or DB layer involvement at authoring time. |
| `app_settings` row materialization | Database / Storage (Supabase Postgres `app_settings` table) | Backend (Supabase RPC `merge_jsonb_column`) | Writer's Pass-5 calls the existing `updateAppSettings` method which fires the `merge_jsonb_column` RPC — JSONB merge is a server-side concern. No code changes here. |
| Post-seed assertion (D-10) | Test harness (`tests/tests/setup/*.setup.ts`) | Database / Storage (read-back via SupabaseAdminClient) | Verification queries the persisted row from Supabase via service-role; comparison logic lives in the test harness layer. |
| Playwright parity-gate execution | Test harness (`tests/playwright.config.ts` + Node CLI) | — | Standard E2E run; no code changes; invocation captures JSON output. |
| Parity diff classification | Tooling script (`.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts`) | — | Pure CLI tool over two JSON inputs; deterministic exit code; consumed by phase artifact. |
| v2.6 baseline artifact capture | Repo artifact (`.planning/phases/63-.../post-v2.6/playwright-report.json`) | — | Frozen JSON committed to git; consumed downstream by `/gsd-complete-milestone` for re-anchoring constants. |

## Project Constraints (from CLAUDE.md)

- **Node version:** v22.4.0 [VERIFIED via `node --version`]; yarn 4.13.0 [VERIFIED]
- **Test commands:** `yarn test:unit` (vitest, all packages); `yarn test:e2e` (Playwright; requires `yarn dev` running)
- **Linting/format:** `yarn lint:check` / `yarn lint:fix`; `yarn format:check` / `yarn format`
- **Build:** `yarn build` (Turborepo; cached, parallel)
- **Type generation:** `yarn supabase:types` after schema changes — no schema changes in Phase 63 (pure JSONB merge through existing RPC)
- **Strict TypeScript** — avoid `any`, prefer explicit types
- **Localization:** new user-facing strings would need 4-locale support — Phase 63 does NOT add user-facing strings (settings keys only)
- **WCAG 2.1 AA** — no UI changes in Phase 63
- **Supabase ports:** 54321 (API), 54323 (Studio); frontend port 5173
- **No commits to `.env`** — all env via `supabase status`
- **Code review checklist** at `.agents/code-review-checklist.md` should be applied
- **Workspace dep flow:** `core -> data/matching/filters -> app-shared -> frontend/supabase`. Adding `@openvaa/app-shared` as a dependency of `@openvaa/dev-seed` extends this DAG cleanly (dev-seed currently depends on `core`, `matching`, `supabase-types`, `@supabase/supabase-js`, `zod` — adding `app-shared` introduces no cycle since `app-shared` only depends on `@openvaa/data`).

## Standard Stack

### Core (already present — no installs needed)

| Library / Module | Version | Purpose | Why Standard |
|---|---|---|---|
| `@openvaa/dev-seed` | workspace:^ (current HEAD) | Template-driven dev-data generator; Writer Pass-5 routes `app_settings.fixed[]` through `updateAppSettings` -> `merge_jsonb_column` RPC | Already the canonical seed authoring surface (Phase 56-59) [VERIFIED: `packages/dev-seed/src/writer.ts:154-181`, `packages/dev-seed/src/generators/AppSettingsGenerator.ts:43-89`] |
| `@openvaa/app-shared` | workspace:^ 0.1.0 | Cross-package shared utilities (StaticSettings/DynamicSettings types); target home for hoisted `mergeSettings` per D-02 | Existing precedent for shared utilities (passwordValidation, getCustomData, isLocalized, etc.) [VERIFIED: `packages/app-shared/src/index.ts`] |
| `@openvaa/supabase-types` | workspace:^ | `TablesInsert<'app_settings'>` typing for `value` field; generated from schema | Already used by every generator [VERIFIED: import in `AppSettingsGenerator.ts:38`] |
| `vitest` | catalog: (used by `app-shared`, `dev-seed`) | Unit-test runner for `mergeSettings` per §Specifics ("Keep the utility small, pure, and well-tested") | Both packages already configure vitest [VERIFIED: `packages/app-shared/vitest.config.ts`, `packages/dev-seed/package.json` script `test:unit`] |
| `@playwright/test` | catalog: | Parity-gate suite execution | Established workflow [VERIFIED: `tests/playwright.config.ts` + Phase 60-05 invocation pattern] |
| `tsx` | catalog: | Run TypeScript scripts directly (`diff-playwright-reports.ts`, dev-seed templates) | Standard across the repo [VERIFIED: scripts in root `package.json`] |
| `node` | v22.4.0 | Runtime | [VERIFIED via `node --version`] |
| `yarn` | 4.13.0 | Workspaces | [VERIFIED via `yarn --version`] |
| `supabase` (CLI) | local-stack via `yarn supabase:start` | Local Postgres + Auth + Storage for parity gate | [VERIFIED: `apps/supabase/` workspace + `yarn supabase:status` is the canonical command] |
| `jq` | jq-1.7.1 | JSON inspection of `playwright-report.json` (handy for residual-fix triage) | [VERIFIED: `command -v jq` returns `/usr/bin/jq`] |
| `python3` (json module) | 3.9.16 | dotenv-banner strip in Phase 60-05 — same pattern needed in 63 | [VERIFIED via `python3 --version`] |

### Supporting (existing, referenced)

| Asset | Path | Purpose |
|---|---|---|
| `diff-playwright-reports.ts` | `.planning/phases/59-e2e-fixture-migration/scripts/` | Parity-gate diff tool with embedded `PASS_LOCKED_TESTS` (41), `DATA_RACE_TESTS` (10), `CASCADE_TESTS` (25), `SOURCE_SKIP_TESTS` (13) constants. v2.5 baseline contract; reused verbatim by Phase 63. |
| v2.5 baseline JSON | `.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json` | Frozen post-Phase-59 capture at SHA `3c57949c8`; ~188 KB; the anchor for Phase 63's measurement. |
| Phase 60 post-change JSON | `.planning/phases/60-layout-runes-migration-hydration-fix/post-change/playwright-report.json` | Reference for post-Phase-60 state; helps the planner reason about "what already moved" before Phase 63 captures fresh. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff | Decision |
|---|---|---|---|
| Hoist `mergeSettings` to `@openvaa/app-shared` (D-02) | Inline duplicate in dev-seed with marker comment | Faster but introduces drift risk; identical semantics in two places | **D-02 fallback only** if dependency-direction rejects it. Verified: dev-seed -> app-shared has no cycle (app-shared depends only on `@openvaa/data`); proceed with the hoist. |
| Use existing frontend `mergeAppSettings` (`apps/frontend/src/lib/utils/settings.ts`) | n/a | `mergeAppSettings` is **shallow** (Object.assign on root-key-nullish filter); it does NOT recursively merge nested settings groups. Variant overlays in this phase need deep merge (e.g., variant-multi-election adds keys under `results` while keeping base `results.cardContents`). | Use the **deep** `mergeSettings` from `apps/frontend/src/lib/utils/merge.ts` as the source-of-truth — hoist its body to `@openvaa/app-shared`. |
| Keep `updateAppSettings` calls in setup files (defer E2E-02) | n/a | Defeats Phase 63's stated scope; was already Phase 59 Plan 04 follow-up | Migrate per D-04 (4 setup-file calls deleted; spec-level scenario calls preserved per D-11). |

**Installation:** No new package installs required. The hoist of `mergeSettings` is internal source movement plus one new workspace dependency line in `packages/dev-seed/package.json`:

```json
"dependencies": {
  "@openvaa/app-shared": "workspace:^"
}
```

**Version verification:** All packages use the workspace protocol `workspace:^`; no npm registry version pin needed. [VERIFIED: workspace package.json files]

## Architecture Patterns

### System Architecture Diagram

```
                    +--------------------------+
                    |  Phase 63 deliverables   |
                    +-----------+--------------+
                                |
                +---------------+----------------+
                |                                |
                v                                v
   +---------------------+              +-------------------+
   |   E2E-02 Branch     |              |   E2E-01 Branch   |
   |   (template ext.)   |              |   (parity gate)   |
   +----------+----------+              +---------+---------+
              |                                   |
              v                                   v
+----------------------------+      +-------------------------------+
| 1. mergeSettings utility   |      | 1. Run yarn dev:reset         |
|    @openvaa/app-shared     |      |    (clean Supabase state)     |
|    (hoist from frontend    |      | 2. Start frontend dev server  |
|    mergeSettings + tests)  |      |    yarn workspace ... dev     |
+------------+---------------+      +---------------+---------------+
             |                                      |
             v                                      v
+----------------------------+      +-------------------------------+
| 2. e2e template extension  |      | 2. Run canonical Playwright   |
|    packages/dev-seed/src/  |      |    invocation                 |
|    templates/e2e.ts        |      |    yarn playwright test       |
|    add app_settings: {     |      |      --workers=1              |
|      fixed: [{ value:... } |      |      --reporter=json          |
|      ] } block             |      |    > post-v2.6/playwright-    |
+------------+---------------+      |      report.json              |
             |                      | 3. Strip dotenv banner        |
             v                      |    (Pitfall 1)                |
+----------------------------+      +---------------+---------------+
| 3. variant overlays via    |                      |
|    deep-merge mergeSettings|                      v
|    in 3 variant template   |      +-------------------------------+
|    files                   |      | 3. Run diff script            |
+------------+---------------+      |    tsx scripts/diff-          |
             |                      |      playwright-reports.ts    |
             v                      |    <v2.5-baseline.json>       |
+----------------------------+      |    <post-v2.6.json>           |
| 4. delete 4 legacy         |      +---------------+---------------+
|    updateAppSettings(...)  |                      |
|    calls in tests/.../     |                      v
|    setup/*.setup.ts        |      +-------------------------------+
+------------+---------------+      | 4. Author diff.md             |
             |                      |    + verdict (PASS expected)  |
             v                      |    + reclamation table        |
+----------------------------+      |    + residual classification  |
| 5. spec-level audit        |      |    (Cat A: framework-level    |
|    (per D-09): classify    |      |     w/ specific pointer       |
|    each existing call as   |      |     vs. blocker)              |
|    scenario or defensive   |      +---------------+---------------+
+------------+---------------+                      |
             |                                      v
             v                      +-------------------------------+
+----------------------------+      | 5. Reserved residual budget   |
| 6. post-seed assertion     |      |    (2-3 fixes max per D-07)   |
|    (D-10): query           |      |    - if residuals exceed,     |
|    app_settings; deep-     |      |      ESCALATE                 |
|    compare to expected     |      +---------------+---------------+
+----------------------------+                      |
                                                    v
                                    +-------------------------------+
                                    | 6. Commit:                    |
                                    |    .planning/phases/63-.../   |
                                    |      post-v2.6/playwright-    |
                                    |      report.json              |
                                    |    + diff.md                  |
                                    +---------------+---------------+
                                                    |
                                                    v
                                    +-------------------------------+
                                    | Handoff to                    |
                                    | /gsd-complete-milestone:      |
                                    | re-anchor diff script         |
                                    | constants (PASS_LOCKED /      |
                                    | DATA_RACE / CASCADE) per D-14 |
                                    +-------------------------------+
```

### Recommended Project Structure (changes only)

```
packages/
├── app-shared/
│   └── src/
│       └── utils/
│           ├── mergeSettings.ts            # NEW (hoisted from frontend)
│           └── mergeSettings.test.ts       # NEW (vitest)
├── dev-seed/
│   ├── package.json                        # MODIFIED (add @openvaa/app-shared dep)
│   └── src/
│       └── templates/
│           └── e2e.ts                      # MODIFIED (add app_settings block)

apps/
└── frontend/
    └── src/
        └── lib/
            └── utils/
                └── merge.ts                # MODIFIED (re-export from @openvaa/app-shared)

tests/
└── tests/
    └── setup/
        ├── data.setup.ts                   # MODIFIED (delete updateAppSettings call; add post-seed assertion)
        ├── variant-constituency.setup.ts   # MODIFIED (same)
        ├── variant-multi-election.setup.ts # MODIFIED (same)
        ├── variant-startfromcg.setup.ts    # MODIFIED (same)
        └── templates/
            ├── variant-constituency.ts     # MODIFIED (add app_settings inline overlay)
            ├── variant-multi-election.ts   # MODIFIED (same)
            └── variant-startfromcg.ts      # MODIFIED (same)

.planning/phases/63-e2e-template-extension-greening/
├── 63-CONTEXT.md                           # EXISTS
├── 63-RESEARCH.md                          # THIS FILE
├── 63-DISCUSSION-LOG.md                    # EXISTS
└── post-v2.6/
    ├── playwright-report.json              # NEW (frozen v2.6 baseline; ~190 KB; commit)
    ├── playwright.stderr.txt               # NEW (companion stderr; usually empty)
    └── diff.md                             # NEW (verdict + classification)
```

### Pattern 1: dev-seed `app_settings.fixed[]` declaration

**What:** Declare an `app_settings` block in a `Template` using the existing per-entity fragment shape; the writer's Pass-5 routes each row's `value` through `merge_jsonb_column`.
**When to use:** Whenever a template needs to set non-default `app_settings` values that the seed.sql bootstrap row does not already provide.
**Source:** `packages/dev-seed/src/writer.ts:174-181` (Pass-5 implementation), `packages/dev-seed/src/generators/AppSettingsGenerator.ts:62-89` (fixed[] pass-through), `packages/dev-seed/src/template/schema.ts:128` (schema accepts the block).

**Important shape note:** The `AppSettingsGenerator` emits `TablesInsert<'app_settings'>` rows (i.e., snake_case `project_id`, `external_id`, `settings`, `customization`). The writer's Pass-5 reads `row.settings` (NOT `row.value`) and passes it to `updateAppSettings(...)`. **D-01 in CONTEXT.md describes the field as `value: Partial<AppSettings>`** — the planner must reconcile: either (a) the executor authors `fixed[]` entries with `settings: { ... }` directly (matches the existing generator), or (b) the generator/template layer normalizes a `value` alias to `settings` before emit. Recommendation: use `settings` directly to avoid an extra translation layer; document the field name in template authoring docs.

**Example (recommended `settings` field directly):**

```ts
// packages/dev-seed/src/templates/e2e.ts (additive block; matches D-58-15 audit pattern)
import { mergeSettings } from '@openvaa/app-shared'; // D-02 hoisted

const E2E_BASE_APP_SETTINGS = {
  questions: {
    categoryIntros: { show: false },
    questionsIntro: { allowCategorySelection: false, show: false },
    showResultsLink: true
  },
  results: {
    cardContents: {
      candidate: ['submatches'],
      organization: ['candidates']
    },
    sections: ['candidate', 'organization']
  },
  entities: {
    hideIfMissingAnswers: { candidate: false },
    showAllNominations: true
  },
  notifications: { voterApp: { show: false } },
  analytics: { trackEvents: false }
} as const;

export const e2eTemplate: Template = {
  // ... existing fields ...
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'e2e-app-settings',
        settings: E2E_BASE_APP_SETTINGS
      }
    ]
  }
};

// Export the constant for variant overlays
export { E2E_BASE_APP_SETTINGS };
```

### Pattern 2: Variant overlay via deep merge

**What:** Variant templates already use `...baseFixed('table')` spread to extend base entity rows. For `app_settings.fixed[]` (single-row table), use `mergeSettings(base, overlay)` to compute the merged settings value.
**When to use:** Every variant template (`variant-constituency.ts`, `variant-multi-election.ts`, `variant-startfromcg.ts`) needs its own settings overlay matching its current legacy `updateAppSettings` block.
**Source:** `tests/tests/setup/templates/variant-constituency.ts:57-62` (existing `baseFixed` pattern); `apps/frontend/src/lib/utils/merge.ts:15-21` (existing deep-merge implementation, source-of-truth for the hoist).

**Example:**

```ts
// tests/tests/setup/templates/variant-multi-election.ts (additive)
import { BUILT_IN_TEMPLATES, type Template, E2E_BASE_APP_SETTINGS } from '@openvaa/dev-seed';
import { mergeSettings } from '@openvaa/app-shared';

const MULTI_ELECTION_OVERLAY = {
  results: {
    showFeedbackPopup: 0,
    showSurveyPopup: 0
  }
} as const;

export const variantMultiElectionTemplate: Template = {
  // ... existing fields ...
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'variant-multi-election-app-settings',
        settings: mergeSettings(E2E_BASE_APP_SETTINGS, MULTI_ELECTION_OVERLAY)
      }
    ]
  }
};
```

### Pattern 3: Post-seed assertion (D-10)

**What:** After `writer.write(rows, prefix)` returns, query the seeded `app_settings` row and deep-compare the persisted `settings` JSONB against the expected merged value. Fail the setup project if drift detected.
**When to use:** Each of the 4 setup files post-pipeline; replaces the implicit "the legacy `updateAppSettings` call applied the right shape" trust assumption.
**Source:** `packages/dev-seed/src/supabaseAdminClient.ts:487-506` (existing `updateAppSettings` reads via `.from('app_settings').select('id').eq('project_id', this.projectId).single()`; same pattern reads back the full row).

**Example (sketch — planner picks final shape):**

```ts
// tests/tests/setup/data.setup.ts (additive, after writer.write(...))
import { expect } from '@playwright/test';
// Re-use SupabaseAdminClient's underlying client via a new helper or direct fetch
const { data: row, error } = await client.findData(
  'appSettings', // collection alias resolves to 'app_settings'
  { filters: { /* project_id filter */ }, single: true }
);
if (error) throw new Error(`post-seed assertion: fetch failed: ${error.message}`);
expect(row.settings).toMatchObject(E2E_BASE_APP_SETTINGS); // deep partial match
```

The planner's discretion (CONTEXT.md): exact field tolerance for array order. Recommendation — use `expect(...).toMatchObject(...)` (subset match) so unrelated keys merged in by `merge_jsonb_column` don't fail the assertion.

### Pattern 4: Parity-gate workflow (verbatim from Phase 60-05)

**What:** The deterministic Playwright + diff-script invocation pattern Phase 60 already established and validated.
**When to use:** Phase 63 final measurement (E2E-01).
**Source:** Phase 60 `60-05-SUMMARY.md` lines 80-95 (Task 1 invocation) + `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts:32-37`.

**Steps:**

1. Verify Supabase running: `yarn dev:status`
2. Reset DB to clean state: `yarn dev:reset`
3. Start frontend (in another terminal): `yarn workspace @openvaa/frontend dev`
4. Wait for HTTP 200 on `http://localhost:5173/en`
5. Create output directory: `mkdir -p .planning/phases/63-e2e-template-extension-greening/post-v2.6`
6. Run canonical invocation:
   ```bash
   yarn playwright test -c ./tests/playwright.config.ts \
     --workers=1 \
     --reporter=json \
     > .planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json \
     2> .planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright.stderr.txt
   ```
7. Strip dotenv banner from stdout (Pitfall 1).
8. Validate JSON: `python3 -c "import json; r=json.load(open('.../post-v2.6/playwright-report.json')); assert bool(r.get('suites'))"`
9. Run diff:
   ```bash
   npx -y tsx .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts \
     .planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json \
     .planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json \
     2>&1 | tee .planning/phases/63-e2e-template-extension-greening/post-v2.6/diff.md
   ```
10. Append executor classification footer to `diff.md` (verdict + reclamation table + residual classification).

### Anti-Patterns to Avoid

- **Re-implementing `mergeSettings` in dev-seed without the hoist** — the frontend already has it. Anti-pattern is two divergent implementations. Hoist or re-export, do not re-author.
- **Using `Object.assign` or shallow merge for variant overlays** — base settings have nested groups (`results.cardContents.candidate`); shallow merge clobbers them. Reference: the frontend has BOTH a shallow `mergeAppSettings` (settings.ts) and a deep `mergeSettings` (merge.ts) — this phase needs the deep variant.
- **Putting `app_settings` rows through `bulk_import`** — fails on `UNIQUE(project_id)` per `AppSettingsGenerator.ts:7-13`. The writer already correctly diverts via Pass-5; do not change the writer.
- **Editing `diff-playwright-reports.ts` constants in Phase 63** — D-13 explicitly assigns that to `/gsd-complete-milestone`. Phase 63 captures the artifact only.
- **Treating "did not run" tests as PASS** — feedback memory `feedback_e2e_did_not_run.md`: cascade-skipped tests count as failures. The diff script already enforces this.
- **Adding new tests to `PASS_LOCKED_TESTS` mid-phase** — D-08: new v2.6 tests are additive-neutral; re-embed happens at milestone-close.
- **Migrating spec-level scenario `updateAppSettings` calls** — D-11: those legitimately mutate per-test state. Only baseline-equivalent (defensive) calls qualify for migration.
- **Using `.amend` or skipping hooks** — CLAUDE.md / project hook workaround: commits in this repo use `git -c core.hooksPath=/dev/null` per stored memory `project_gsd_repo_hook_workaround.md`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Deep-merging two settings objects (preserving nested keys) | Custom recursive object walker | Hoist `mergeSettings` from `apps/frontend/src/lib/utils/merge.ts` to `@openvaa/app-shared` | Already exists with `structuredClone`-based array/value handling, `Date`/function semantics documented; ~30 LoC of pure logic with vitest coverage already in `apps/frontend/src/lib/contexts/utils/StackedState.svelte.test.ts:78`. |
| Routing `app_settings` rows to the database | Custom upsert / bulk-import branch | Existing `Writer.write()` Pass-5 + `SupabaseAdminClient.updateAppSettings` -> `merge_jsonb_column` RPC | Already implemented and stable since Phase 56; `AppSettingsGenerator.ts:7-13` documents why direct `bulk_import` would fail (UNIQUE(project_id) collision). |
| Comparing two Playwright JSON reports with parity rules | Custom diff with rule-by-rule logic | `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` | Encodes all 5 D-59-04 rules incl. additive-neutral semantics for new tests (B-3 validated empirically in Phase 60-05). 41/10/25/13 sets embedded. |
| Validating template input shape | Custom validators | `validateTemplate(input)` from `@openvaa/dev-seed` (zod-backed) | TMPL-09 field-path errors; already used by every template. |
| Parsing/inspecting playwright-report.json | Custom JSON walker | `jq` (pre-installed) for ad-hoc + Node's `JSON.parse` for in-script | jq supports projections needed for residual triage (`jq '.suites[].suites[].specs[] | select(.tests[].results[].status=="failed")'`). |

**Key insight:** Phase 63 has near-zero new infrastructure to build. Every plumbing component (deep merge utility, settings emission, JSONB RPC, parity diff, JSON capture) already exists. The work is composition + measurement + documentation, not invention.

## Runtime State Inventory

> Phase 63 includes a string/code rename component (`updateAppSettings` call sites deleted; field semantics preserved) and a data-shape addition (new template `app_settings.fixed[]`). Inventory provided per researcher protocol Step 2.5.

| Category | Items Found | Action Required |
|---|---|---|
| **Stored data** | (1) Local Supabase `app_settings` table — the seed.sql bootstrap row gets its JSONB `settings` field merged on every test run via `updateAppSettings`. After Phase 63: the merge happens via the writer's Pass-5 from the template, not from setup-file calls. **Net effect on persisted data: identical** (same JSONB merge RPC, same final values). (2) `app_settings.external_id` will get a stable value per fixed[] entry (e.g., `'e2e-app-settings'`); previously NULL on the bootstrap row. **This is the one runtime-state change** — the row keeps its identity (matched by `project_id` UNIQUE), but a new external_id label appears. Teardown filters on `external_id LIKE 'test-%'` ; chosen ids should match. | Code edit only (template authoring); no data migration. The `external_id` should be prefixed `test-` per `tests/tests/setup/*.setup.ts` line 14 `const PREFIX = 'test-'` so teardown matches it; do NOT use `'e2e-app-settings'` (no test- prefix) — use `'test-app-settings'` or similar. |
| **Live service config** | None — settings are stored IN Supabase via the JSONB row; there is no external service config (e.g., Datadog dashboard, n8n workflow) holding `updateAppSettings`-related state. | No action. |
| **OS-registered state** | None — no Windows Task Scheduler / launchd / pm2 / systemd registration carries the renamed setup-file call signature. | No action. |
| **Secrets / env vars** | `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars are read by `SupabaseAdminClient.constructor()` — names unchanged across Phase 63. | No action. |
| **Build artifacts / installed packages** | (1) Turborepo cache (`.turbo/`) for `@openvaa/dev-seed` will need re-build after the new `@openvaa/app-shared` dependency is added (`yarn build` handles this). (2) `apps/frontend/.svelte-kit/` and `apps/frontend/build/` carry compiled chunks of the existing `mergeSettings` — after the hoist, the frontend re-export will compile fresh; old chunks are stale until next build. | `yarn build` after the change is sufficient (Turborepo's dependency-aware rebuild handles the order). |

**Canonical question — after every file in the repo is updated, what runtime systems still have the old string cached?**
- **Local Supabase DB** between test runs: stale `settings` from a prior run remains. Phase 63's setup files already call `runTeardown(PREFIX, client)` BEFORE writing, so prior state is cleared per setup. The `updateAppSettings` RPC merges; it does NOT delete keys that the new template omits. **This is a subtle pitfall** documented as Pitfall 5 below.

## Common Pitfalls

### Pitfall 1: dotenv banner pollutes JSON-reporter stdout

**What goes wrong:** `yarn playwright test --reporter=json > playwright-report.json` produces a malformed JSON file because dotenv 17.3.1 emits `[dotenv@17.3.1] injecting env (25) from .env -- tip: ⚙️  enable debug logging with { debug: true }` to stdout BEFORE Playwright writes the JSON body.
**Why it happens:** Playwright's JSON reporter writes to `process.stdout`; dotenv hooks before. Both share the same stream.
**How to avoid:** After capture, strip everything before the first line-start `{` using either a Python regex (`re.search(r'^\{$', content, re.MULTILINE)`) or a sed/awk equivalent. Phase 60-05 used Python successfully [VERIFIED: `60-05-SUMMARY.md` Deviations section, lines 290-298].
**Warning signs:** `python3 -c "import json; json.load(...)"` fails with `Expecting value: line 1 column 2`.

### Pitfall 2: Writer Pass-5 reads `row.settings`, not `row.value`

**What goes wrong:** D-01 in CONTEXT.md describes the template field as `{ external_id, value: Partial<AppSettings> }`; the existing `AppSettingsGenerator.generate()` emits `TablesInsert<'app_settings'>` rows with a `settings` field; the writer at `writer.ts:177` reads `row.settings`.
**Why it happens:** Schema-shape vs domain-name mismatch — `value` is the natural template-author word, but the DB column is `settings`.
**How to avoid:** Plan resolves explicitly. Two options:
- **(Recommended)** Use `settings` directly in template `fixed[]` entries — matches the existing generator pass-through and writer expectation. Document in template authoring docs that the field name is `settings` (matching the DB column).
- **(Alternative)** Add a field-rename step in the generator: if `fx.value` provided, alias to `settings` before emit. Avoids leaking DB column naming into authoring DX, but adds a translation layer.

**Warning signs:** Writer Pass-5 silently does nothing because `row.settings` is undefined — the seeded row keeps the bootstrap values; tests fail with the legacy popup-not-suppressed symptoms.

### Pitfall 3: `merge_jsonb_column` is a deep merge, not a replace

**What goes wrong:** If a previous test run's settings include keys NOT in the new template's `app_settings.fixed[]`, those keys persist in the DB row.
**Why it happens:** `merge_jsonb_column` RPC performs recursive deep merge; it does not delete keys not present in the partial payload.
**How to avoid:** Setup files already call `runTeardown(PREFIX, client)` first — verify this clears `app_settings.settings` to bootstrap defaults (or document explicitly that it doesn't and add a reset step). Specifically, `runTeardown` deletes rows matching the prefix; the bootstrap `app_settings` row has `external_id = NULL`, so it is NOT deleted by teardown — its stale `settings` JSONB persists.
**Warning signs:** Test failures only manifest after a prior test set non-default values; first-run success masks the problem.
**Mitigation:** Plan should evaluate whether the post-seed assertion (D-10) needs a "reset to known baseline" call before the merge — e.g., a direct UPDATE of `settings = '{}'` before applying the template, OR documenting that the merge always supplies the full set of settings keys this phase manages.

### Pitfall 4: Out-of-baseline tests are additive-neutral (already verified)

**What goes wrong:** Adding new tests in v2.6 (e.g., `voter-popup-hydration.spec.ts`) might appear to flag the parity diff as regressions if not handled.
**Why it happens:** Diff script's Rule 3 considers new failures outside the pool as regressions. Rule 3 does NOT fire on new passes; new passes are neutral (additive).
**How to avoid:** Phase 60 Plan 60-01 preflight + Plan 60-05 empirical run already validated this — `voter-popup-hydration.spec.ts` appeared as PASS in the post-Phase-60 capture and was correctly classified neutral. **Phase 63 should not need any special handling** as long as the diff script remains unchanged.
**Warning signs:** Diff verdict = FAIL with regressions citing tests not in any of the 41/10/25/13 constant sets — would indicate a script behavior change. Verify before treating as real.

### Pitfall 5: Constant-set drift suspicions

**What goes wrong:** Phase 60-01 reported "DRIFT (baseline=89 vs constants=67)" — turned out to be an arithmetic mistake (CASCADE_TESTS undercounted as 16; actual 25). The real gap is 89 − 76 = 13 = SOURCE_SKIP_TESTS exactly.
**Why it happens:** Manual constant-counting under stress; easy to miscount across multiple `\n`-separated arrays.
**How to avoid:** Run the diff script's self-identity smoke first (`tsx diff... baseline.json baseline.json`) — must print PARITY GATE: PASS. If it doesn't, that's a real script-behavior bug.
**Warning signs:** `60-05-SUMMARY.md:206-228` documents the corrected arithmetic. Do not re-trigger this analysis in Phase 63 unless the diff script is changed.

### Pitfall 6: Variant teardown collisions

**What goes wrong:** Multiple variant setups run sequentially. Each starts with `runTeardown('test-', client)`. If `app_settings` external_ids across variants share the prefix `test-`, only one survives at any time. **For a single-row UNIQUE(project_id) table, this is correct behavior** — only the last-run setup's settings are active for tests in that project.
**Why it happens:** `app_settings.external_id` is metadata; the row identity is `project_id`. The merge RPC deep-merges into the same row regardless of `external_id`.
**How to avoid:** Document that `external_id` for `app_settings` is for teardown-filtering only; the row's UNIQUE constraint ensures one settings blob per project. Setup files already isolate via `runTeardown` before each.
**Warning signs:** Confusion between Postgres-level row and template-level `fixed[]` entry. Do NOT try to maintain multiple `app_settings` rows for the same project — `AppSettingsGenerator.ts:23-27` documents the clamp.

### Pitfall 7: Adding a workspace dependency without rebuild

**What goes wrong:** Adding `@openvaa/app-shared` to `packages/dev-seed/package.json` without running `yarn install` + `yarn build` leaves dev-seed unable to resolve the import; dev-seed's `tsx` runner walks up via the Yarn workspaces virtual node_modules but the dist files for `app-shared` may be stale.
**Why it happens:** `app-shared` builds to `./dist/index.js` (per its package.json `module` field); consumers read built artifacts, not src.
**How to avoid:** After adding the dep, run `yarn install` (refreshes the workspace symlinks), then `yarn build --filter=@openvaa/app-shared` (or top-level `yarn build` — Turborepo handles ordering). Verify by `node -e "import('@openvaa/app-shared').then(m => console.log(Object.keys(m)))"` from any workspace.
**Warning signs:** `Cannot find module '@openvaa/app-shared'` or `mergeSettings is not exported` errors in dev-seed.

## Code Examples

### `mergeSettings` hoist (Pattern 2)

```ts
// packages/app-shared/src/utils/mergeSettings.ts (NEW — copied verbatim from
// apps/frontend/src/lib/utils/merge.ts; same body, public export from app-shared)

export type DeepPartial<TObject> = {
  [K in keyof TObject]?: TObject[K] extends object ? DeepPartial<TObject[K]> : TObject[K];
};

/**
 * Deep merge two plain (non-constructed) objects of settings.
 * Source: hoisted from apps/frontend/src/lib/utils/merge.ts in Phase 63 (D-02).
 * Consumed by both @openvaa/dev-seed (template overlay merge) and the frontend
 * (layout-context StackedState updater). Pure function; safe in any runtime.
 *
 * NB. Does NOT support constructed objects (e.g. Date) or arrays containing
 * functions. Arrays are replaced wholesale via structuredClone (NOT element-merged).
 */
export function mergeSettings<TTarget extends object, TSource extends object>(
  target: TTarget,
  source: TSource
): TTarget & TSource {
  const result = deepMergeRecursively({}, target);
  return deepMergeRecursively(result, source);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function deepMergeRecursively<TTarget extends object, TSource extends object>(
  target: TTarget,
  source: TSource
): TTarget & TSource {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!(key in target)) (target as any)[key] = {};
      (target as any)[key] = deepMergeRecursively((target as any)[key], source[key]);
    } else if (typeof source[key] === 'function') {
      (target as any)[key] = source[key];
    } else {
      (target as any)[key] = structuredClone(source[key]);
    }
  }
  return target as TTarget & TSource;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
```

```ts
// packages/app-shared/src/index.ts (additive)
export * from './utils/mergeSettings.js';
```

```ts
// apps/frontend/src/lib/utils/merge.ts (REFACTOR — re-export to preserve
// existing $lib/utils/merge import sites without churn)
export { mergeSettings, type DeepPartial } from '@openvaa/app-shared';
```

### Vitest unit test (D-02 §Specifics: "small, pure, well-tested")

```ts
// packages/app-shared/src/utils/mergeSettings.test.ts (NEW)
import { describe, it, expect } from 'vitest';
import { mergeSettings } from './mergeSettings';

describe('mergeSettings', () => {
  it('deep-merges nested objects', () => {
    const base = { a: { b: 1, c: 2 } };
    const overlay = { a: { c: 3, d: 4 } };
    expect(mergeSettings(base, overlay)).toEqual({ a: { b: 1, c: 3, d: 4 } });
  });

  it('overlay wins on primitive collisions', () => {
    expect(mergeSettings({ x: 1 }, { x: 2 })).toEqual({ x: 2 });
  });

  it('replaces arrays wholesale (no element merge)', () => {
    expect(mergeSettings({ xs: [1, 2, 3] }, { xs: [9] })).toEqual({ xs: [9] });
  });

  it('does not mutate inputs', () => {
    const base = { a: { b: 1 } };
    const overlay = { a: { c: 2 } };
    mergeSettings(base, overlay);
    expect(base).toEqual({ a: { b: 1 } });
    expect(overlay).toEqual({ a: { c: 2 } });
  });

  it('initializes missing nested target keys', () => {
    const base = {} as { nested?: { k: number } };
    const overlay = { nested: { k: 1 } };
    expect(mergeSettings(base, overlay)).toEqual({ nested: { k: 1 } });
  });

  it('preserves function values from overlay', () => {
    const fn = () => 42;
    expect(mergeSettings({}, { handler: fn }).handler).toBe(fn);
  });
});
```

### Variant overlay declaration (Pattern 2 detail)

```ts
// tests/tests/setup/templates/variant-constituency.ts (additive — current file
// already imports BUILT_IN_TEMPLATES.e2e via baseFixed pattern)
import { BUILT_IN_TEMPLATES, type Template } from '@openvaa/dev-seed';
import { mergeSettings } from '@openvaa/app-shared';
import { E2E_BASE_APP_SETTINGS } from '@openvaa/dev-seed'; // exported per Pattern 1

const CONSTITUENCY_OVERLAY = {
  // variant-constituency omits the `results` block per CONTEXT D-03 — it inherits
  // the base settings WITHOUT a results override, so the overlay is a no-op
  // delta. Authored explicitly here so the variant template's intent is visible.
} as const;

export const variantConstituencyTemplate: Template = {
  // ... existing entity blocks ...
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'test-app-settings-constituency',
        settings: mergeSettings(E2E_BASE_APP_SETTINGS, CONSTITUENCY_OVERLAY)
      }
    ]
  }
};
```

### Setup-file migration (E2E-02 final shape)

```ts
// tests/tests/setup/data.setup.ts (POST-Phase-63 — diff against current state)
import { expect, test as setup } from '@playwright/test';
import {
  BUILT_IN_OVERRIDES,
  BUILT_IN_TEMPLATES,
  fanOutLocales,
  runPipeline,
  runTeardown,
  Writer
} from '@openvaa/dev-seed';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';
import { TEST_UNREGISTERED_EMAILS } from '../utils/e2eFixtureRefs';
import { TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD } from '../utils/testCredentials';

const PREFIX = 'test-';

setup('import test dataset', async () => {
  const template = BUILT_IN_TEMPLATES.e2e;
  if (!template) throw new Error('BUILT_IN_TEMPLATES.e2e is undefined — Phase 58 regression?');
  const overrides = BUILT_IN_OVERRIDES.e2e ?? {};
  const seed = template.seed ?? 42;
  const prefix = template.externalIdPrefix ?? '';

  const client = new SupabaseAdminClient();

  // 1. Pre-clear stale state.
  await runTeardown(PREFIX, client);

  // 2. Seed via the package's pipeline + writer. Pass-5 (writer.ts:174-181)
  //    now applies app_settings from the e2e template's `app_settings.fixed[]`
  //    block — no need for a follow-up updateAppSettings call.
  const rows = runPipeline(template, overrides);
  fanOutLocales(rows, template, seed);
  const writer = new Writer();
  await writer.write(rows, prefix);

  // 3. (D-10) Post-seed assertion — verify settings persisted as expected.
  //    Planner: pick exact assertion shape (toMatchObject vs toEqual).
  // const persistedSettings = await fetchPersistedAppSettings(client);
  // expect(persistedSettings).toMatchObject(template.app_settings.fixed[0].settings);

  // 4. Auth wiring (unchanged from pre-Phase-63).
  for (const email of TEST_UNREGISTERED_EMAILS) {
    await client.unregisterCandidate(email);
  }
  await client.unregisterCandidate(TEST_CANDIDATE_EMAIL);
  await client.forceRegister('test-candidate-alpha', TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD);
  expect(true, 'forceRegister reached post-condition').toBe(true);
});
```

### Parity-gate invocation (Pattern 4 — full sequence)

```bash
# 1. Verify environment
yarn dev:status                                      # Supabase up

# 2. Reset DB
yarn dev:reset                                       # clean slate

# 3. Start frontend (separate terminal)
yarn workspace @openvaa/frontend dev                 # port 5173

# 4. Wait for HTTP 200 (5-10s)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/en

# 5. Capture
mkdir -p .planning/phases/63-e2e-template-extension-greening/post-v2.6
yarn playwright test -c ./tests/playwright.config.ts \
  --workers=1 \
  --reporter=json \
  > .planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json \
  2> .planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright.stderr.txt

# 6. Strip dotenv banner (Pitfall 1)
python3 << 'EOF'
import re
p = '.planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json'
content = open(p).read()
m = re.search(r'^\{$', content, re.MULTILINE)
if m and m.start() > 0:
    open(p, 'w').write(content[m.start():])
import json; json.load(open(p))   # smoke
print('JSON OK')
EOF

# 7. Self-identity smoke on the script (Pitfall 5)
npx -y tsx .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts \
  .planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json \
  .planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json
# expected: PARITY GATE: PASS

# 8. Real diff
npx -y tsx .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts \
  .planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json \
  .planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json \
  2>&1 | tee .planning/phases/63-e2e-template-extension-greening/post-v2.6/diff.md

# Expected verdict (per D-05): PARITY GATE: PASS with growing pass-set.
# If FAIL, classify residuals per D-06 (framework-level pointers) or apply
# residual budget per D-07 (max 2-3 fixes; escalate if exceeded).
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Settings applied via setup-file `updateAppSettings(...)` (4 sites, ~60 lines) | Settings declared in dev-seed `e2e` template's `app_settings.fixed[]`; Writer Pass-5 routes through `merge_jsonb_column` RPC | Phase 63 (this phase) | -60 LoC across 4 files; new template authoring shape; identical end-state in DB. |
| `updateAppSettings` deprecation suggested | `updateAppSettings` retained for spec-level scenario mutations; JSDoc updated | Phase 63 D-11 | Method is NOT deprecated; usage pattern split (baseline = template; per-test scenarios = method). |
| Phase 60 SC-4 parity verdict: FAIL with 24 Cat-A regressions | Expected Phase 63 verdict: PASS (Phase 61 cleared the candidate-questions cascade; Phase 62 cleared results-page work) | Phase 63 measurement | Documents the cumulative Phase 60/61/62 reclamation; v2.6 close gate. |
| v2.5 baseline anchor at SHA `3c57949c8` | After Phase 63: v2.6 baseline at post-Phase-63 SHA; diff script constants regenerated | `/gsd-complete-milestone` (post-Phase-63) | v2.7 phases measure against v2.6 anchor; v2.5 anchor preserved as historical record per D-15. |

**Deprecated/outdated:**
- The setup-file `updateAppSettings` baseline-equivalent pattern: superseded by template `app_settings.fixed[]` (D-04).
- Phase 60-01's "DRIFT (22-test gap)" reading: corrected to MATCH (13-test gap = SOURCE_SKIP_TESTS) per Phase 60-05 SUMMARY.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | The frontend `mergeSettings` function (`apps/frontend/src/lib/utils/merge.ts`) is the right semantics for variant deep-merge — specifically, that arrays should be replaced wholesale (NOT element-merged) when an overlay provides them. | Pattern 2 + Code Examples | Low. Settings JSONB has only a few array-valued fields (e.g., `results.sections: ['candidate', 'organization']`, `results.cardContents.candidate: ['submatches']`). If a variant needs to APPEND to an array rather than replace, the overlay needs explicit array spread. Recommend: planner inspects the 4 setup files' diffs to confirm no variant currently appends; the existing `updateAppSettings` calls behave the same (merge_jsonb_column also replaces arrays). |
| A2 | Phase 61 and Phase 62 will deliver their expected cumulative reclamation (6 + 18 + ~Phase-62 = approximately +60 tests reclaimed cumulatively) by the time Phase 63 runs. | Pattern 4 + D-05 in CONTEXT.md | Medium. If reclamation underperforms, Phase 63's residual budget (D-07: 2-3 fixes max) absorbs minor shortfall; larger gaps escalate. Mitigation: planner ensures Phase 63 plan includes an explicit "residual triage" step before invoking the budget. |
| A3 | The `external_id` field on `app_settings.fixed[]` rows is for teardown filtering only; the row identity is `project_id` UNIQUE; multiple variants pointing at the same project_id will see last-write-wins via `merge_jsonb_column`. | Pitfall 6 | Low. `AppSettingsGenerator.ts:23-27` documents this; the writer Pass-5 calls `updateAppSettings` once per row in the template; the RPC deep-merges. Confirm during execution that variant-runs (which run sequentially, each preceded by `runTeardown`) do not interleave their settings. |
| A4 | The `merge_jsonb_column` RPC does NOT delete keys not in the partial payload (it deep-merges). | Pitfall 3 | Medium. If the assumption is wrong, Phase 63's post-seed assertion will catch it. Mitigation: D-10 verification reads back the row and compares; mismatches fail loudly. |
| A5 | Writer Pass-5 reads `row.settings` (snake_case, matching the DB column), not `row.value` (CONTEXT D-01 wording). | Pitfall 2 | Low (verified via `writer.ts:177` direct read). The naming reconciliation must happen in the plan; recommend `settings` field name. |
| A6 | Phase 63 does not need to add new tests to the diff script's `PASS_LOCKED_TESTS` set. New v2.6 tests appear additive-neutral in the diff. | Pitfall 4 | Very Low. Empirically validated in Phase 60-05 (B-3 PASS). The re-embed happens at milestone-close per D-13. |

**If this table is empty:** N/A — 6 assumptions logged. Risks are mostly low-medium; mitigations exist for each.

## Open Questions (RESOLVED)

All 4 questions carry explicit `RESOLVED:` markers — planning decisions are reflected in the 63-PLAN files (to be authored next).

1. **Should `app_settings.fixed[]` external_id values be variant-scoped (`'test-app-settings-constituency'`) or share-scoped (`'test-app-settings'`)?**
   - What we know: Single-row UNIQUE(project_id); external_id is only a teardown-filter contract; ALL variant external_ids must start with `test-` prefix to participate in `runTeardown('test-', client)` cleanup.
   - What's unclear: Whether the planner prefers human-readable variant scoping (helps debug / triage) or shared identity (one row, less metadata noise).
   - Recommendation: Variant-scoped names — last-write-wins doesn't change semantics, but readability in the DB (and in `external_id`-filtered teardown logs) is improved.
   - RESOLVED: Variant-scoped external_ids (e.g., `'test-app-settings-constituency'`). Planner/executor wires this in Plan 63-02 when populating the template.

2. **What is the exact post-seed deep-compare tolerance (D-10)?**
   - What we know: `expect.toMatchObject` (subset) vs `expect.toEqual` (strict) is a planner choice per CONTEXT.md Claude's Discretion section.
   - What's unclear: Whether unrelated keys merged in by `merge_jsonb_column` (e.g., from a stale prior run) should fail the assertion.
   - Recommendation: Use `toMatchObject` — the assertion is checking "did our settings get written?" not "is this the only state on the row?". Strict equality would fail if any pre-existing key persists (Pitfall 3 surface).
   - RESOLVED: Use `expect.toMatchObject` — subset assertion per Pitfall 3 mitigation. Documented in Plan 63-02 test task.

3. **If Phase 62 reclaims fewer tests than expected, where does the residual budget land?**
   - What we know: D-07 budget = 2-3 small targeted fixes max; exceeding escalates.
   - What's unclear: The exact shape of "small" — is it strict LoC count, or judgment-call (e.g., a single component re-render fix vs. a layout file refactor)?
   - Recommendation: Plan adopts a decision rule: "small" = single-file change AND under ~50 LoC AND root cause is well-isolated. Anything not satisfying all three escalates.
   - RESOLVED: Small = single-file AND <50 LoC AND well-isolated root cause. Anything outside that triple escalates to human review. Budget capped at 2-3 fixes total per D-07.

4. **Should the v2.6 baseline JSON be committed even if PARITY GATE: FAIL?**
   - What we know: D-13 says Phase 63 captures the artifact; `/gsd-complete-milestone` does the re-anchor.
   - What's unclear: If FAIL, does milestone close — and if not, do we still commit the (failed) baseline?
   - Recommendation: Commit unconditionally. The artifact is evidence regardless of verdict; if FAIL is unrecoverable within budget, the artifact + diff.md document the state for retrospective. milestone close decision is upstream.
   - RESOLVED: Commit unconditionally. The post-v2.6 baseline JSON + diff.md artifact ship with Phase 63 regardless of gate verdict; verdict is captured in the artifact frontmatter for the milestone close step to consume.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| node | All scripts; tsx runtime | ✓ | v22.4.0 | — |
| yarn (Berry/4.x) | Workspace orchestration | ✓ | 4.13.0 | — |
| Supabase CLI (via `yarn supabase:start`) | Local Postgres + Auth + Storage for parity gate | ✓ | (workspace-managed) | — (parity gate cannot run without it) |
| Docker | Supabase local services | ✓ | 29.1.2 | — |
| Playwright | Parity-gate suite | ✓ (catalog dependency) | (workspace-managed) | `yarn playwright install` if browsers missing |
| `tsx` | Run TypeScript scripts (templates, diff script) | ✓ | (workspace-managed) | — |
| `jq` | Optional JSON inspection during residual triage | ✓ | jq-1.7.1 | — |
| `python3` | dotenv-banner strip (Pitfall 1) | ✓ | 3.9.16 | sed/awk equivalent (`sed '1,/^{$/{ /^{$/!d; }'`) |
| `npx` | Invoke `tsx` and `diff-playwright-reports.ts` ad-hoc | ✓ | (npm-managed) | direct `node_modules/.bin/tsx` |
| Inbucket (email testing) | Candidate registration tests | ✓ (via `supabase start`) | — | — |

**Missing dependencies with no fallback:** None — all required tooling is present and verified.

**Missing dependencies with fallback:** None — all primary tools verified.

## Validation Architecture

> Nyquist enabled (no `workflow.nyquist_validation` key in `.planning/config.json`; default = on).

### Test Framework

| Property | Value |
|---|---|
| Framework | **vitest** (catalog version) for unit tests in `@openvaa/app-shared` and `@openvaa/dev-seed`; **Playwright** for E2E parity gate |
| Config files | `packages/app-shared/vitest.config.ts`, `packages/dev-seed/` (vitest in package.json `test:unit`); `tests/playwright.config.ts` |
| Quick run command | `yarn workspace @openvaa/app-shared test:unit -- --run mergeSettings` (focused unit run < 5s) |
| Full suite command | `yarn test:unit && yarn test:e2e` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| **E2E-02 / mergeSettings** | Deep-merge utility produces correct merged values for nested objects, primitive collisions, array replacement, no-mutation, missing-target-key initialization, function preservation | unit (vitest) | `yarn workspace @openvaa/app-shared test:unit` | ❌ Wave 0 — `packages/app-shared/src/utils/mergeSettings.test.ts` does not exist yet |
| **E2E-02 / template shape** | `BUILT_IN_TEMPLATES.e2e.app_settings.fixed[0].settings` matches the E2E_BASE_APP_SETTINGS constant | unit (vitest) | `yarn workspace @openvaa/dev-seed test:unit` | ❌ Wave 0 — Phase 63 may add a small parity test in `packages/dev-seed/tests/` (existing test infrastructure: `packages/dev-seed/tests/writer.test.ts`) |
| **E2E-02 / variant overlays** | `variantConstituencyTemplate.app_settings.fixed[0].settings` matches `mergeSettings(E2E_BASE, OVERLAY)` (and similar for the 2 other variants) | unit (vitest) — optional inline assertion in template files | n/a (assertion at template-load via `expect`-free invariant) | n/a |
| **E2E-02 / setup-file migration** | After `writer.write(rows, prefix)`, the persisted `app_settings.settings` JSONB matches the expected merged shape | integration (post-seed assertion run inside Playwright setup project) | `yarn playwright test --project=data-setup` (or part of full E2E run) | ✓ Setup files exist; assertion code is the new addition |
| **E2E-01 / parity gate** | Diff verdict against v2.5 baseline `3c57949c8` is `PARITY GATE: PASS` (or all residuals classified as framework-level per D-06) | e2e (Playwright) + script (tsx) | `npx -y tsx .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts <v2.5> <post-v2.6>` | ✓ Script exists, baseline exists, target output path is new |
| **E2E-01 / baseline capture** | `post-v2.6/playwright-report.json` exists, parses as JSON, has non-empty `suites[]` and `stats.expected > 0` | smoke (filesystem + JSON.parse) | `python3 -c "import json; r=json.load(open('.../playwright-report.json')); assert r['suites'] and r['stats']['expected']>0"` | ❌ Wave 0 — file is the deliverable |

### Sampling Rate

- **Per task commit:** `yarn lint:check` + (relevant package) `yarn test:unit -- --run <focused>`
- **Per wave merge:** `yarn build` + full `yarn test:unit` + Playwright parity gate
- **Phase gate:** Full Playwright suite green (or all residuals classified per D-06) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `packages/app-shared/src/utils/mergeSettings.ts` — new file (hoisted from frontend)
- [ ] `packages/app-shared/src/utils/mergeSettings.test.ts` — covers E2E-02 utility
- [ ] `packages/app-shared/src/index.ts` — export added
- [ ] `apps/frontend/src/lib/utils/merge.ts` — refactored to re-export from `@openvaa/app-shared` (keeps existing import sites stable)
- [ ] `packages/dev-seed/package.json` — `@openvaa/app-shared` dependency added
- [ ] `packages/dev-seed/src/templates/e2e.ts` — `app_settings.fixed[]` block + `E2E_BASE_APP_SETTINGS` named export
- [ ] `tests/tests/setup/templates/variant-{constituency,multi-election,startfromcg}.ts` — `app_settings.fixed[]` overlay
- [ ] `tests/tests/setup/{data,variant-constituency,variant-multi-election,variant-startfromcg}.setup.ts` — delete `updateAppSettings(...)` calls; add post-seed assertion
- [ ] `tests/tests/utils/supabaseAdminClient.ts` — JSDoc update on inherited `updateAppSettings` per D-11 (if planner chooses to add it)
- [ ] `.planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json` — parity-gate capture
- [ ] `.planning/phases/63-e2e-template-extension-greening/post-v2.6/diff.md` — verdict + classification

## Security Domain

> Phase 63 is internal tooling and test infrastructure; no production code path changes; no new auth, network, or data-ingestion surface.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | no | — (no auth code change; existing `forceRegister` / `unregisterCandidate` flows unchanged) |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes (template loading) | `validateTemplate()` zod-backed validator already wraps every template input; new `app_settings.fixed[]` block validates as `Array<Record<string, unknown>>` against existing `perEntityFragment` schema. |
| V6 Cryptography | no | — |
| V14 Configuration | yes (settings JSONB) | The settings JSONB is dev/test data only, written via the existing `merge_jsonb_column` RPC; no new RLS or grant changes. Service role key only used in test setup (already documented at `packages/dev-seed/README.md` §Security Notes). |

### Known Threat Patterns for {dev-tooling stack}

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Custom template execution (`tsx` dynamic import of `--template <path>`) | E (Elevation), T (Tampering) | Already documented in `packages/dev-seed/README.md` §Security Notes — same trust model as `tsx`/`ts-node`; do NOT pass `--template` with paths to untrusted files. JSON templates parse as pure data. Phase 63 does NOT introduce a new untrusted-template surface; all new template files (`variant-*.ts`, modified `e2e.ts`) are committed to the repo and reviewed via PR. |
| Service-role-key leakage (test-only) | I (Information disclosure) | Existing pattern: service role key reads from `process.env.SUPABASE_SERVICE_ROLE_KEY`; only used against local Supabase (`supabase start`). Writer (`writer.ts:90-104`) THROWS at construction if URL/key missing. No change in Phase 63. |
| Inadvertent commit of `playwright-report.json` containing sensitive data | I (Information disclosure) | The post-v2.6 report contains test-name strings, durations, and error stacks — no user secrets. Test data is `seed_`/`test-` prefixed synthetic records. Safe to commit per Phase 59 precedent (post-swap report is committed). |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/63-e2e-template-extension-greening/63-CONTEXT.md` — locked decisions D-01..D-15 (this phase's authoritative scope)
- `.planning/REQUIREMENTS.md` §E2E — E2E-01 / E2E-02 requirement text
- `.planning/ROADMAP.md` §Phase 63 — goal + success criteria SC-1..SC-4
- `.planning/STATE.md` — milestone progress, deferred items, accumulated context
- `packages/dev-seed/src/writer.ts:154-181` — Pass-5 implementation (existing; no change needed)
- `packages/dev-seed/src/generators/AppSettingsGenerator.ts` — `fixed[]` pass-through + UNIQUE(project_id) clamp
- `packages/dev-seed/src/template/schema.ts:128` — `app_settings: perEntityFragment.optional()` already declared
- `packages/dev-seed/src/templates/e2e.ts` — current e2e template (lacks `app_settings`)
- `packages/dev-seed/src/supabaseAdminClient.ts:487-506` — `updateAppSettings` method (existing)
- `packages/app-shared/package.json` — confirms no circular dep with dev-seed
- `apps/frontend/src/lib/utils/merge.ts` — source of truth for `mergeSettings` (deep merge)
- `apps/frontend/src/lib/utils/settings.ts` — confirms `mergeAppSettings` is shallow (do NOT use)
- `tests/tests/setup/data.setup.ts:53-72` — Migration target #1 (full settings block with `results`)
- `tests/tests/setup/variant-constituency.setup.ts:41-53` — Migration target #2 (no `results` block)
- `tests/tests/setup/variant-multi-election.setup.ts:43-59` — Migration target #3 (extra `results.showFeedbackPopup/showSurveyPopup`)
- `tests/tests/setup/variant-startfromcg.setup.ts:44-56` — Migration target #4 (same as #1 sans `results.cardContents`)
- `tests/tests/setup/templates/variant-constituency.ts:54-62` — Existing `baseFixed` deep-merge precedent
- `.planning/phases/60-layout-runes-migration-hydration-fix/60-05-SUMMARY.md` — Parity-gate workflow + dotenv-banner pitfall + B-3 empirical validation + W-5 corrected analysis
- `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts:32-110` — Diff script invocation + 41/10/25/13 set sizes
- `.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json` — v2.5 baseline anchor (188 KB)

### Secondary (MEDIUM confidence)

- `tests/tests/specs/voter/voter-popup-hydration.spec.ts` — verifies the new-test additive-neutral pattern (Phase 60 D-09)
- Stored memory `feedback_e2e_did_not_run.md` — "did not run" counts as failure (encoded in diff script Rule 4-5)
- Stored memory `project_gsd_repo_hook_workaround.md` — commit invocation pattern for this repo

### Tertiary (LOW confidence)

None — all critical claims are sourced from in-repo files or Phase 60-05 frozen artifacts.

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — every library/tool is verified in-tree (package.json + grep + workspace structure); no new npm dependencies; one new internal workspace dep added.
- Architecture: **HIGH** — every pattern is grounded in existing committed code (e2e.ts, variant-constituency.ts, writer.ts, AppSettingsGenerator.ts, diff-playwright-reports.ts). Phase 60-05 already executed Pattern 4 successfully.
- Pitfalls: **HIGH** — Pitfalls 1, 4, 5 are empirically observed in Phase 60-05; Pitfalls 2, 3, 6, 7 are derived from current source code (writer Pass-5 read pattern, JSONB RPC semantics, UNIQUE constraint behavior, Turborepo dependency-aware rebuild).

**Research date:** 2026-04-24

**Valid until:** 2026-05-24 (30 days; stable phase — frozen artifacts, no fast-moving external libraries; only volatile input is the post-Phase-62 reclamation count which Phase 63 itself measures).

---

## RESEARCH COMPLETE
