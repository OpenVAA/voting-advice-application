# Roadmap: v2.5 Dev Data Seeding Toolkit

## Overview

Ship a template-driven, modular data generator in `@openvaa/dev-tools` that populates a freshly-reset local Supabase database with realistic OpenVAA data in one command, and retire the hand-maintained E2E JSON fixtures in favor of generator-produced data. The milestone proceeds bottom-up: generator plumbing and per-entity row builders first, then the latent-factor answer model (a focused, algorithmic slice), then the template system + CLI + built-in templates that make the generator user-facing, and finally the E2E fixture migration that proves parity with the current Playwright baseline before legacy JSON fixtures are deleted.

## Phases

**Phase Numbering:**
- Continues from v2.4 (last phase: 55)
- Integer phases (56, 57, ...): Planned milestone work
- Decimal phases (56.1, 56.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 56: Generator Foundations & Plumbing** — Per-entity generator scaffolding, service-role client, external_id tagging, template schema core, bulk-upsert strategy
- [x] **Phase 57: Latent-Factor Answer Model** — PCA-inspired pluggable pipeline producing party-clustered candidate answers with inter-question correlations (completed 2026-04-23)
- [x] **Phase 58: Templates, CLI & Default Dataset** — Default + E2E built-in templates, custom-template loading, `seed`/`seed:teardown`/`dev:reset-with-data` CLI, portrait seeding, localization flag (completed 2026-04-23)
- [ ] **Phase 59: E2E Fixture Migration** — Rewrite `tests/seed-test-data.ts` on top of the new generator, prove parity with current Playwright baseline, retire legacy JSON fixtures

## Phase Details

### Phase 56: Generator Foundations & Plumbing
**Goal**: A developer can invoke each per-entity generator in isolation, get typed rows back, override any single generator, and bulk-upsert the result into a local Supabase via a service-role client — without any template DSL or CLI in place yet.
**Depends on**: Nothing (first phase of v2.5)
**Requirements**: GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, GEN-07, GEN-08, TMPL-01, TMPL-02, TMPL-08, TMPL-09, NF-01, NF-02, NF-03, NF-05, DX-02
**Success Criteria** (what must be TRUE):
  1. A per-entity generator module exists for every non-system public table (accounts, projects, elections, constituency_groups, constituencies, constituency_group_constituencies, election_constituency_groups, organizations, candidates, factions, alliances, question_categories, questions, nominations, app_settings, feedback); each returns rows typed against `@openvaa/supabase-types` with no inline `any` on public surfaces.
  2. A developer can replace any single generator via a `{ [table]: (fragment) => Rows }` override map without forking the pipeline, and the replacement is picked up by the full-graph seeder.
  3. Every generator-produced row carries an `external_id` with a configurable prefix (default `seed_`), and writes flow through the service-role `SupabaseAdminClient` (reused from `tests/tests/utils/` or moved into `@openvaa/dev-tools`, decided during implementation) with bulk RPCs chosen to stay under the NF-01 <10s budget.
  4. The core template schema (TypeScript type + runtime validator with field-pointing error messages, optional `seed: number` honored by faker) compiles cleanly and accepts a `{}` input that produces a valid but trivial row-set across all entities.
  5. Nominations wire candidates and parties to elections × constituencies with referential integrity enforced by the generator (no orphan FKs reach the DB); categorical-question subdimensions and `MISSING_VALUE` handling follow `@openvaa/matching` / `@openvaa/core` conventions.
  6. Per-entity unit tests run via `yarn test:unit` and pass; the suite fails loudly when `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are missing at runtime, and partial-insert failures either roll back via DB transactions or document the partial-write behavior explicitly.
**Plans**: 10 plans

Plans:
- [ ] 56-01-PLAN.md — Package scaffolding (@openvaa/dev-seed) + root devDep + GEN-03 amendment
- [ ] 56-02-PLAN.md — SupabaseAdminClient base (D-24 split, bulk-write surface)
- [ ] 56-03-PLAN.md — Template schema + ctx factory + answer emitter + shared types
- [ ] 56-04-PLAN.md — 8 foundation generators (elections, constituency_groups, constituencies, organizations, alliances, factions, accounts, projects)
- [ ] 56-05-PLAN.md — 5 content generators (question_categories, questions, candidates with D-27 seam, app_settings, feedback)
- [ ] 56-06-PLAN.md — NominationsGenerator (polymorphic, GEN-08 ref validation)
- [ ] 56-07-PLAN.md — Pipeline + Writer + public API (D-25/D-26 bridge, D-11 routing, D-15 env enforcement)
- [x] 56-08-PLAN.md — 14 per-generator unit tests + shared makeCtx utils (DX-02)
- [ ] 56-09-PLAN.md — Cross-cutting tests (pipeline, writer, determinism, template validator)
- [ ] 56-10-PLAN.md — Rewrite tests/tests/utils/supabaseAdminClient.ts as subclass + final verification

### Phase 57: Latent-Factor Answer Model
**Goal**: Synthetic candidate answers exhibit visible party clustering and plausible inter-question correlations, produced by a pluggable pipeline where each sub-step (latent dimensions, centroids, spread, positions, loadings, projection+noise) can be replaced independently.
**Depends on**: Phase 56
**Requirements**: GEN-06, GEN-06a, GEN-06b, GEN-06c, GEN-06d, GEN-06e, GEN-06f, GEN-06g
**Success Criteria** (what must be TRUE):
  1. A latent answer space with a configurable number of dimensions (with optional eigenvalues / variance weights) is constructed from template input, with sensible defaults that work without any override.
  2. Party centroids are sampled with spread enforcement (default: farthest-point / max-min distance or Latin hypercube) so that centroids cover the latent space rather than clustering in one region, and templates can supply explicit centroids per party to override.
  3. Candidate latent positions are sampled from each party's centroid with a per-party spread parameter as standard deviation, and question loadings (question × dimension) define inter-question correlations overridable per question.
  4. Each candidate's answer per question is the projection of its latent position through the question loadings plus a default noise term (small magnitude relative to latent spread, reducible to zero via template), mapped to the valid range of every question type (Likert, categorical choice, etc.).
  5. Running `@openvaa/matching` across the generated candidates shows visible party clustering (intra-party distances < inter-party distances by a measurable margin) and non-trivial inter-question correlations — verified by an integration test, not just by eye.
  6. Each of the six sub-steps (06a-06f) is exposed as a standalone hook on the pipeline and can be swapped by a consumer without editing neighboring steps; unit tests cover each hook in isolation.
**Plans**: 7 plans

Plans:
- [x] 57-01-PLAN.md — Foundation (workspace deps + LatentHooks types + boxMuller + Ctx.latent + TemplateSchema.latent)
- [x] 57-02-PLAN.md — defaultDimensions (D-57-01/02) + defaultSpread (D-57-04)
- [x] 57-03-PLAN.md — defaultCentroids (D-57-03/05, farthest-point)
- [x] 57-04-PLAN.md — defaultPositions (D-57-04 isotropic Gaussian per-candidate)
- [x] 57-05-PLAN.md — defaultLoadings (D-57-06/07 N(0,1) matrix + per-question override)
- [x] 57-06-PLAN.md — defaultProject (D-57-08/09/10/11 per-type dispatch) + QuestionsGenerator A2 fix
- [x] 57-07-PLAN.md — latentAnswerEmitter shell + pipeline wire-in + barrel exports + clustering integration test

### Phase 58: Templates, CLI & Default Dataset
**Goal**: A developer runs one command (`yarn dev:reset-with-data`) against a freshly-reset local Supabase and gets a browseable, locale-complete, portrait-illustrated voting advice app — using only built-in templates. Custom templates load from arbitrary paths; `seed:teardown` cleanly reverses generator writes.
**Depends on**: Phase 57
**Requirements**: GEN-09, GEN-10, TMPL-03, TMPL-04, TMPL-05, TMPL-06, TMPL-07, CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, NF-04, DX-01, DX-03, DX-04
**Success Criteria** (what must be TRUE):
  1. `yarn workspace @openvaa/dev-tools seed --template default` populates a fresh local Supabase in <10s with 1 election, ~6 constituencies, ~8 parties, ~40 candidates, and ~20 questions; every seeded candidate profile renders an end-to-end portrait sourced from the curated batch in `packages/dev-tools/src/seed/assets/portraits/` (10-20 permissively-licensed images, repo-checked-in).
  2. `yarn dev:reset-with-data` at the repo root runs `supabase db reset` followed by the default seed in one step; collections accept mixed hand-authored + synthetic rows (e.g. `organizations: { count: 8, fixed: [{name:'Vihreät'},{name:'Kokoomus'}] }`) and the `generateTranslationsForAllLocales` flag, when true, produces translations for every locale listed in `staticSettings.supportedLocales` (en/fi/sv/da).
  3. `--template <path>` loads a `.ts`, `.js`, or `.json` template from any filesystem path and runs it without modifying the package; a built-in `e2e` template exists whose relational wiring and testIds match what existing Playwright specs depend on.
  4. `yarn workspace @openvaa/dev-tools seed:teardown` removes only rows carrying the generator's `external_id` prefix, leaving bootstrap rows from `apps/supabase/supabase/seed.sql` (default account + project + storage_config) intact — verified by pre/post row counts.
  5. `--help` output documents every flag, lists built-in templates, and links to a worked example of authoring a custom template; a successful run prints a rows-per-entity summary, the template applied, and the elapsed time.
  6. Fixing `seed: <N>` in a template produces byte-identical row output across two runs (deterministic faker); an integration test applies the default template against a real local Supabase and asserts row counts + spot-checks relational wiring; `CLAUDE.md` "Common Workflows" documents the seeding command.
**Plans**: 10 plans
**UI hint**: yes

Plans:
- [x] 58-01-PLAN.md — E2E Playwright spec audit (58-E2E-AUDIT.md inventory doc)
- [x] 58-02-PLAN.md — Portrait assets + download script + LICENSE
- [x] 58-03-PLAN.md — Schema extension (generateTranslationsForAllLocales) + Template JSDoc + locales.ts fan-out utility
- [x] 58-04-PLAN.md — Writer portrait-upload extension + SupabaseAdminClient portrait methods
- [x] 58-05-PLAN.md — CLI shell (seed.ts + resolve-template + help + summary) + package.json seed script
- [x] 58-06-PLAN.md — Default template + non-uniform distribution override + type-mix override + BUILT_IN_TEMPLATES
- [x] 58-07-PLAN.md — Teardown CLI + root dev:seed / dev:seed:teardown / dev:reset-with-data scripts
- [x] 58-08-PLAN.md — E2E template authored from 58-E2E-AUDIT.md
- [x] 58-09-PLAN.md — DX-03 integration test + locale fan-out determinism extension
- [x] 58-10-PLAN.md — packages/dev-seed/README.md + CLAUDE.md Common Workflows extension

### Phase 59: E2E Fixture Migration
**Goal**: The Playwright suite runs against generator-produced data with zero regression vs the current JSON-fixture baseline, the legacy fixtures are deleted, and the `supabaseAdminClient` location reflects the cleanest dependency graph.
**Depends on**: Phase 58
**Requirements**: E2E-01, E2E-02, E2E-03, E2E-04
**Success Criteria** (what must be TRUE):
  1. `tests/seed-test-data.ts` is rewritten to invoke `@openvaa/dev-tools` with the built-in `e2e` template; no behavioral change is visible to Playwright specs (same testIds, same relational wiring contracts).
  2. A baseline Playwright run is captured against the current JSON fixtures (expected: 15 passed / 19 data-race failed / 55 cascade) before the swap, and a post-swap run produces the same-or-better pass/fail set — specifically, all currently-passing tests remain passing, and the 19 pre-existing data-race failures and 55 cascades are not made worse.
  3. Only after the parity check passes are `tests/fixtures/default-dataset.json`, `tests/fixtures/voter-dataset.json`, and `tests/fixtures/candidate-addendum.json` deleted from the repo; the repo has zero remaining references to these files.
  4. `tests/tests/utils/supabaseAdminClient.ts` either stays in `tests/` or moves to `@openvaa/dev-tools` based on a documented dependency-graph decision made during implementation, with no circular dependencies introduced.
**Plans**: 7 plans

Plans:
- [x] 59-01-PLAN.md — Baseline Playwright capture + wait-for-healthy + summary.md (E2E-03) — complete 2026-04-23, SHA `0e58dc4c3`. Actual baseline split: 41 pass / 10 data-race / 25 cascade / 13 test.skip (89 total).
- [x] 59-02-PLAN.md — Migrate 8 fixture consumers off JSON imports (E2E-01, E2E-02) — complete 2026-04-23, commits `ba268f421` / `553b5d88b` / `0b14287f3`. 9 files touched (1 new + 8 modified); zero JSON-fixture imports remain in tests/tests/utils/ + tests/tests/specs/; yarn build exit 0.
- [x] 59-03-PLAN.md — Author variant templates + parity diff script (E2E-02, E2E-03) — complete 2026-04-23, commits `c3c8e2bec` / `45d4d8abb` / `5b449ab73`. 4 files created (3 variant templates + diff script); every overlay external_id (67 total across 3 overlays) covered by template+base; self-identity smoke test prints PARITY GATE: PASS; yarn build exit 0.
- [x] 59-04-PLAN.md — Core swap: seed-test-data + data.setup/teardown + variant setups (E2E-01) — complete 2026-04-23, commits `7b2c9083d` / `7143f08ff` / `58d86fa7f` / `9c9e6363f`. 7 files modified; zero JSON-fixture imports remain in tests/seed-test-data.ts + tests/tests/setup/; runTeardown('test-', client) at all 5 call sites; yarn build exit 0; playwright test --list enumerates 89 specs with zero import errors.
- [x] 59-05-PLAN.md — Post-swap capture + parity diff verdict (E2E-03) — complete 2026-04-24, commits `9d36cdb35` / `e67be2bf0`. **PARITY GATE: FAIL — 22 regressions across 3 root causes** (runTeardown prefix mismatch × 2, candidate-questions CAND-12 persist-comment timeout → 18-test cascade, baseline summary ID cosmetic drift). Data-race pool SHRANK (9 of 10 baseline flakes now pass). Post-swap HEAD `4ce228c82`; swap itself at `9c9e6363f`. Phase 59 remains OPEN per D-59-12 fix-forward; Plan 06 BLOCKED pending parity green.
- [ ] 59-06-PLAN.md — Delete legacy fixtures + mergeDatasets util (E2E-02) — **BLOCKED by parity FAIL from 59-05; see post-swap/diff.md for 3-root-cause fix-forward work list**
- [ ] 59-07-PLAN.md — VERIFICATION.md + deps-check.txt (E2E-04)

## Progress

**Execution Order:**
Phases execute in numeric order: 56 -> 57 -> 58 -> 59

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 56. Generator Foundations & Plumbing | 8/10 | In progress | - |
| 57. Latent-Factor Answer Model | 7/7 | Complete    | 2026-04-23 |
| 58. Templates, CLI & Default Dataset | 10/10 | Complete    | 2026-04-23 |
| 59. E2E Fixture Migration | 5/7 | In progress (PARITY FAIL — fix-forward) | - |
