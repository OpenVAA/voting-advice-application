# Requirements: v2.5 Dev Data Seeding Toolkit

**Milestone:** v2.5
**Created:** 2026-04-22
**Status:** Active

## Goal

Ship a template-driven, modular data generator in `@openvaa/dev-tools` that populates a freshly-reset local Supabase database with realistic OpenVAA data in a single command, and retire the hand-maintained E2E JSON fixtures in favor of generator-produced data.

**Success criteria:**
- `yarn dev:reset-with-data` produces a browseable local app state (elections, parties, candidates, questions, nominations) across all supported locales without manual data entry.
- `tests/seed-test-data.ts` is rewritten on top of the new generator; legacy `default-dataset.json`, `voter-dataset.json`, `candidate-addendum.json` fixtures are deleted.
- Full E2E suite passes against generator-produced data with no regression vs current baseline (15 passing remain passing; pre-existing 19-test data-loading race is not made worse).
- Templates are authorable by users — a custom `.ts` template file in any path invocable via `--template <path>` produces valid data.

---

## Requirements

### GEN: Generator Core

Modular per-entity generators, one per non-system public table, composable into a full-graph seeder. Leverages `@openvaa/data` types, `@faker-js/faker` (in catalog), and the existing `SupabaseAdminClient` helper.

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| GEN-01 | One independent generator module per non-system public table | P1 | Tables: accounts, projects, elections, constituency_groups, constituencies, constituency_group_constituencies, election_constituency_groups, organizations, candidates, factions, alliances, question_categories, questions, nominations, app_settings, feedback |
| GEN-02 | Generators accept a template fragment and return typed rows ready for bulk upsert | P1 | Uses `@openvaa/supabase-types` row types; no direct DB writes inside generators |
| GEN-03 | Any single generator is overridable by consumers without forking the pipeline | P1 | Plug-in shape: `{ [table]: (fragment, ctx) => Rows[] }` map merged with built-ins (amended per D-25 — override receives ctx for seeded faker / projectId / refs access) |
| GEN-04 | All generator-produced rows carry an `external_id` with a configurable prefix (default `seed_`) | P1 | Enables idempotent upsert via existing bulk RPCs and targeted teardown |
| GEN-05 | Writes happen through a service-role Supabase client that bypasses RLS | P1 | Reuse existing `SupabaseAdminClient` from `tests/tests/utils/`; move into `@openvaa/dev-tools` if cross-workspace reuse is needed |
| GEN-06 | Answer-space generative model (latent-factor / PCA-inspired) — produces realistic candidate answers with visible party clustering and plausible inter-question correlations | P1 | Broken into 6 modular sub-steps (GEN-06a..f); each sub-step is independently overridable |
| GEN-06a | Configurable number of latent dimensions (optionally with eigenvalues / variance weights) defining the answer space | P1 | Constants with sensible defaults; exposed on the template for overriding |
| GEN-06b | Party centroids sampled in the latent space with spread enforcement — centroids cover the space rather than clustering in one region | P1 | Default strategy ensures min-distance between centroids (e.g. farthest-point sampling, max-min distance, or Latin hypercube). Template can supply explicit centroids per party to override. |
| GEN-06c | Per-party spread parameter controls avg candidate deviation from party centroid | P1 | Random or set per party in the template |
| GEN-06d | Candidate latent positions sampled from party centroid ± spread | P1 | Normal distribution around centroid using spread as std. dev. |
| GEN-06e | Question loadings (question × latent dimension) define inter-question correlations | P1 | Random by default; template can override loadings per question to fix specific correlations |
| GEN-06f | Each candidate's answer per question = projection of its latent position through the question loadings, with a noise term applied by default | P1 | Noise is on by default (small magnitude relative to latent spread); template can reduce to zero for noise-free runs. Answers mapped to valid question-type range (Likert scale, categorical choice, etc.) |
| GEN-06g | Each sub-step (06a–06f) is a standalone pluggable module the developer can replace or edit without touching neighboring steps | P1 | Pipeline exposes hooks at dimension/centroid/spread/position/loading/answer boundaries |
| GEN-07 | Categorical-question subdimensions handled correctly | P1 | Per `@openvaa/matching` subdimension conventions; `MISSING_VALUE` from `@openvaa/core` for explicit skips |
| GEN-08 | Nominations wire candidates and parties to elections × constituencies with valid referential integrity | P1 | Generator enforces graph constraints the schema expects |
| GEN-09 | Candidate portrait images seeded from a small curated batch of stock portraits, cycled across generated candidates | P1 | Uploads to Supabase Storage via service-role client; `candidates.image_id` (or equivalent field) populated. If lightweight synthetic-portrait generation is viable later, swap in without changing the interface. |
| GEN-10 | Portrait batch lives in `packages/dev-tools/src/seed/assets/portraits/` (or similar), checked into the repo | P1 | Small fixed set (~10-20 images); licensing must be permissive for distribution with the repo |

**Acceptance:** Each generator has unit tests; an integration test applies the default template to a throwaway Supabase and asserts row counts + shape per entity. Matching scores across candidates show visible party clustering (not uniform noise) and plausible inter-question correlations. Candidate profile pages render portraits end-to-end.

### TMPL: Template System

A unified declarative template config with smart defaults; any collection can mix hand-authored and synthetic rows; custom templates loadable from any path.

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| TMPL-01 | Single template schema (TypeScript type) covers counts, distributions, relational wiring, and per-entity overrides | P1 | Everything the user can tweak is in one declarative object |
| TMPL-02 | Every template field optional; unspecified fields fall back to smart defaults | P1 | A `{}` template produces a usable app state |
| TMPL-03 | Collections accept hand-authored rows + generator count in the same definition | P1 | E.g. `organizations: { count: 8, fixed: [{name:'Vihreät',...}, {name:'Kokoomus',...}] }` — 2 fixed + 6 synthetic |
| TMPL-04 | Built-in `default` template — realistic Finnish-flavored election with 1 election, ~6 constituencies, ~8 parties, ~40 candidates, ~20 questions | P1 | This is what `yarn dev:reset-with-data` uses |
| TMPL-05 | Built-in `e2e` template — shape matches what existing E2E specs depend on (same testIds, same relational wiring contracts) | P1 | Powers the rewritten `tests/seed-test-data.ts` |
| TMPL-06 | Custom templates loadable from arbitrary path via `--template <path>` | P1 | Accepts `.ts`, `.js`, or `.json` |
| TMPL-07 | Flat top-level `generateTranslationsForAllLocales: boolean` honoring `staticSettings.supportedLocales` | P1 | `false` (default) = default locale only; `true` = all supported locales |
| TMPL-08 | Optional top-level `seed: number` for reproducible faker output | P2 | Nice-to-have; cheap since faker supports seeded RNG |
| TMPL-09 | Template-validation error messages point at the offending field | P2 | Zod or equivalent runtime validation |

**Acceptance:** Default and E2E templates produce expected row counts and pass validation; a custom user-supplied template loads and runs without modifying the package.

### CLI: Command Surface

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| CLI-01 | `yarn workspace @openvaa/dev-tools seed --template <name-or-path>` seeds the active local Supabase | P1 | `<name>` resolves built-in templates; `<path>` loads custom |
| CLI-02 | Root-level `yarn dev:reset-with-data` shortcut = `supabase db reset` + seed with `default` template | P1 | Added to root `package.json` scripts |
| CLI-03 | `yarn workspace @openvaa/dev-tools seed:teardown` removes only generator-produced rows (via `external_id` prefix) | P1 | Non-destructive for bootstrap data in `seed.sql` |
| CLI-04 | `--help` output documents flags, built-in templates, and how to author a custom template | P1 | Consistent with `keygen` / `pem-to-jwk` help style |
| CLI-05 | CLI surfaces a concise summary after success: rows-per-entity, template applied, time elapsed | P2 | DX sugar; helps catch silent no-ops |

**Acceptance:** All three commands run successfully against a local `supabase start`; teardown leaves bootstrap rows from `seed.sql` intact.

### E2E: Fixture Replacement

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| E2E-01 | `tests/seed-test-data.ts` rewritten to invoke `@openvaa/dev-tools` with the `e2e` template | P1 | No behavioral change visible to Playwright specs |
| E2E-02 | Legacy fixtures retired — `default-dataset.json`, `voter-dataset.json`, `candidate-addendum.json` deleted | P1 | After E2E parity is proven, not before |
| E2E-03 | Full Playwright suite passes with no regression vs current baseline | P1 | Baseline: 15 passing, 19 data-race failing, 55 cascade. Post-migration: same or better |
| E2E-04 | `tests/tests/utils/supabaseAdminClient.ts` either stays in `tests/` or moves to `@openvaa/dev-tools` based on cleanest dependency graph | P2 | Judgment call during implementation; avoid circular deps |

**Acceptance:** `yarn test:e2e` with seeder-produced data produces the same pass/fail set as the baseline, ±0 regressions.

### DX: Developer Experience

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| DX-01 | Documentation (inline header comment or short README) explains how to author a custom template | P1 | Worked examples for mixing fixed + synthetic rows |
| DX-02 | Unit tests for each generator (per-entity coverage) | P1 | Catches schema drift early |
| DX-03 | Integration test: default template applied to a real local Supabase, asserts row counts and spot-checks relational wiring | P1 | Guards against breakage as schema evolves |
| DX-04 | Documentation added to `CLAUDE.md` "Common Workflows" section (seeding command) | P2 | Keeps AI pair-programming aware of the new tool |

**Acceptance:** Generator coverage via `yarn test:unit` includes the new suite and passes; a new contributor can author a template by reading only the inline docs + existing templates.

---

## Non-Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| NF-01 | Full default-template seed completes in < 10 seconds on a local Supabase | P1 | Use bulk RPCs, not row-at-a-time inserts |
| NF-02 | Zero secrets in generator code or built-in templates | P1 | Reads `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` from env; fails loudly if missing |
| NF-03 | TypeScript strict mode, no `any` in public surface | P1 | Consistent with rest of monorepo |
| NF-04 | Seeder output deterministic given a fixed `seed` template field | P2 | Depends on TMPL-08 |
| NF-05 | Fails cleanly and rolls back on partial insert errors | P2 | Use DB transactions where bulk RPCs support them; otherwise document partial-write behavior |

---

## Out of Scope

| Item | Reason |
|------|--------|
| Admin-job seeding (`admin_jobs` table) | Operational table; no test value in synthetic jobs |
| User role / auth seeding (`user_roles`, auth.users) | Auth is orthogonal; bootstrap candidate login handled by existing `invite-candidate` Edge Function flow |
| General storage/object-store seeding beyond candidate portraits | Other object categories (campaign media, party logos, attached docs) out of scope; candidate portraits carved out via GEN-09 because they materially affect UI realism |
| `storage_config` table seeding | Bootstrap-only table populated by `apps/supabase/supabase/seed.sql` |
| Production data migration tooling | This is a dev/test tool; production deployments have their own import paths |
| Seed-data snapshot management (save/load arbitrary DB states) | Overkill for this milestone; templates are the snapshot primitive |
| UI for template authoring | Templates are code; no in-app editor needed |
| Deployer-facing demo datasets ("sales demo" variants) | Out of primary audience; templates can be added later without milestone scope creep |

---

## Constraints

- Must integrate with existing monorepo tooling: Yarn 4 workspace, Turborepo, tsx runner, catalog deps.
- No new external dependencies unless already in catalog (`@faker-js/faker`, `@supabase/supabase-js`).
- Writes only via service-role client; no assumptions about RLS bypass in other contexts.
- Must not break `apps/supabase/supabase/seed.sql` bootstrap (accounts + projects + storage_config).
- Template schemas must use `@openvaa/supabase-types` + `@openvaa/data` types as sources of truth — no hand-redeclared row shapes.

---

## Dependencies

- `@faker-js/faker` (catalog) — RNG for synthetic rows
- `@supabase/supabase-js` (catalog) — service-role client
- `@openvaa/data` (workspace) — entity types, `MISSING_VALUE`
- `@openvaa/supabase-types` (workspace) — generated Supabase row types
- `tsx` (catalog) — TS runner
- Local Supabase via `supabase start` — target for seed writes
- Existing `tests/tests/utils/supabaseAdminClient.ts` — bulk-import helpers

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GEN-01 | Phase 56 | Pending |
| GEN-02 | Phase 56 | Pending |
| GEN-03 | Phase 56 | Pending |
| GEN-04 | Phase 56 | Pending |
| GEN-05 | Phase 56 | Pending |
| GEN-06 | Phase 57 | Pending |
| GEN-06a | Phase 57 | Pending |
| GEN-06b | Phase 57 | Pending |
| GEN-06c | Phase 57 | Pending |
| GEN-06d | Phase 57 | Pending |
| GEN-06e | Phase 57 | Pending |
| GEN-06f | Phase 57 | Pending |
| GEN-06g | Phase 57 | Pending |
| GEN-07 | Phase 56 | Pending |
| GEN-08 | Phase 56 | Pending |
| GEN-09 | Phase 58 | Pending |
| GEN-10 | Phase 58 | Pending |
| TMPL-01 | Phase 56 | Complete (56-03) |
| TMPL-02 | Phase 56 | Complete (56-03) |
| TMPL-03 | Phase 58 | Pending |
| TMPL-04 | Phase 58 | Pending |
| TMPL-05 | Phase 58 | Pending |
| TMPL-06 | Phase 58 | Pending |
| TMPL-07 | Phase 58 | Pending |
| TMPL-08 | Phase 56 | Complete (56-03) |
| TMPL-09 | Phase 56 | Complete (56-03) |
| CLI-01 | Phase 58 | Pending |
| CLI-02 | Phase 58 | Pending |
| CLI-03 | Phase 58 | Pending |
| CLI-04 | Phase 58 | Pending |
| CLI-05 | Phase 58 | Pending |
| E2E-01 | Phase 59 | Pending |
| E2E-02 | Phase 59 | Pending |
| E2E-03 | Phase 59 | Pending |
| E2E-04 | Phase 59 | Pending |
| DX-01 | Phase 58 | Pending |
| DX-02 | Phase 56 | Pending |
| DX-03 | Phase 58 | Pending |
| DX-04 | Phase 58 | Pending |
| NF-01 | Phase 56 | Pending |
| NF-02 | Phase 56 | Pending |
| NF-03 | Phase 56 | Complete (56-03) |
| NF-04 | Phase 58 | Pending |
| NF-05 | Phase 56 | Pending |
