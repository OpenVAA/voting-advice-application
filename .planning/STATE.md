---
gsd_state_version: 1.0
milestone: v2.5
milestone_name: milestone
status: planning
stopped_at: Phases 57/58/59 context gathered — ready for plan+execute chain
last_updated: "2026-04-23T07:34:15.019Z"
last_activity: 2026-04-23
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 27
  completed_plans: 17
  percent: 63
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-22)

**Core value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.
**Current focus:** Phase 57 — latent-factor-answer-model

## Current Position

Phase: 58
Plan: Not started
Status: Ready to plan
Last activity: 2026-04-23

## Performance Metrics

**Cumulative:**

- Milestones shipped: 9 (v1.0, v1.1, v1.2, v1.3, v1.4, v2.0, v2.1, v2.3, v2.4) + 1 paused (v2.2)
- Total plans completed: 162 + 6 tasks
- Timeline: 28 days (2026-03-01 to 2026-03-28)

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

Key context for v2.5:

- `@openvaa/dev-tools` workspace already exists (added post-v2.4); the seeder extends it rather than starting a new package.
- Scope boundary: non-system public tables only (accounts, projects, elections, constituency_groups, constituencies, constituency_group_constituencies, election_constituency_groups, organizations, candidates, factions, alliances, question_categories, questions, nominations, app_settings, feedback). Skips admin_jobs, user_roles, storage_config, private.feedback_rate_limits.
- `apps/supabase/supabase/seed.sql` bootstrap (default account + project) stays as-is — the generator layers on top.
- Template model is unified (no binary curated/synthetic split); smart defaults fill unspecified fields; hand-authored rows mix with synthetic rows per collection.
- Localization: flat `generateTranslationsForAllLocales: boolean` setting; honors `staticSettings.supportedLocales` (en/fi/sv/da).
- Primary CLI: `yarn workspace @openvaa/dev-tools seed --template <name-or-path>`; root shortcut `yarn dev:reset-with-data`; teardown `seed:teardown` uses `external_id` prefix for targeted deletion.
- `tests/seed-test-data.ts` rewritten to invoke the new generator; legacy JSON fixtures (`default-dataset.json`, `voter-dataset.json`, `candidate-addendum.json`) retired once E2E verified green.
- Matching realism: synthetic candidate positions clustered along party ideological axes (not uniform random) so matching results are visually coherent during dev testing.
- `@faker-js/faker` already in the Yarn catalog; `SupabaseAdminClient` helper already exists in `tests/tests/utils/`; leverage both rather than rebuild.
- Research skipped: milestone is codebase-internal (schema + data model fully knowable from the repo).
- Phase numbering continues from v2.4 (last phase: 55); v2.5 spans Phases 56-59.
- Phase shape: 56 = foundations/plumbing, 57 = latent-factor answer model (algorithmic slice), 58 = templates/CLI/default dataset (user-facing surface), 59 = E2E fixture migration (parity checkpoint before JSON-fixture deletion).
- Plan 56-01: @openvaa/dev-seed scaffolded as tsx-only private workspace (D-28). Follows apps/frontend precedent for supabase-types import (no TS project reference). Uses vitest --passWithNoTests for empty-src baseline.
- 56-02: SupabaseAdminClient base split into @openvaa/dev-seed per D-24; client/projectId made protected for tests/ subclass reuse
- Plan 56-03: Faker seeded per-instance via .seed() on fresh Faker() instance (not module-level); plan's  is not a valid @faker-js/faker v10 API.
- Plan 56-03: defaultRandomValidEmit uses function declaration (not const-arrow) to satisfy func-style:declaration eslint rule; seam contract preserved via explicit AnswerEmitter-typed assertion.
- Plan 56-03: Template schema stays declarative (no .default()); defaults live in per-generator defaults(ctx) per D-08 so Phase 57/58 .extend() does not fight per-field defaults.
- Plan 56-03: Shared types barrel (types.ts) re-exports only — Ctx/AnswerEmitter/Template stay in their canonical modules to avoid circular-import hazards while still giving consumers one import path.
- Plan 56-04: Foundation generators use canonical D-04/D-08/D-26 pattern — class with ctor capturing ctx, defaults(ctx) per-call, generate(fragment) returning TablesInsert rows; sentinel enrichment (_constituencyGroups, _constituencies) is explicitly DEFERRED to Plan 07's post-topo pass so generators stay sentinel-free for clean unit tests.
- Plan 56-04: AccountsGenerator + ProjectsGenerator are explicit pass-through per D-11 (return [] + ctx.logger warn on non-empty fragment). The pattern — class with ctor/defaults/generate — is preserved so Plan 07's pipeline class map can uniformly instantiate without a special branch for bootstrap-only tables.
- Plan 56-04: ESLint no-unused-vars does not honor ^_ prefix by default; used eslint-disable-next-line comments on each defaults(ctx) method (matches packages/core/src/controller/controller.ts:72 codebase convention). The ctx param stays on the signature to preserve the D-08 contract for Phase 57/58 generators that read ctx.
- Plan 56-05: QuestionsGenerator uses JSONB `name` column (migration line 608, not `text` as plan example showed); QuestionRow relaxes both `category_id` AND `type` from TablesInsert because Fragment<T>.fixed[] is Partial<T>
- Plan 56-05: CandidatesGenerator ships the D-27 seam (`ctx.answerEmitter ?? defaultRandomValidEmit`) with candidateForEmit narrowing so Phase 57's latent emitter drops in without touching this file
- Plan 56-05: AppSettingsGenerator clamps count to <=1 and flags for Plan 07 writer to route through updateAppSettings (merge_jsonb_column) rather than bulk_import — avoids UNIQUE(project_id) conflict with seed.sql bootstrap row
- Plan 56-05: FeedbackGenerator is minimal stub per Claude's Discretion; fixed[] discards Fragment.external_id (feedback table has no external_id column)
- Plan 56-06: NominationRow uses Omit<TablesInsert<'nominations'>, 'election_id'|'constituency_id'> — same ref-sentinel relaxation pattern as QuestionsGenerator's category_id (Plan 05)
- Plan 56-06: Dropped legacy tests/ 'emit both candidate+organization, strip one' workaround per RESEARCH §9 — dev-seed emits only authoritative ref since party-candidate relationship is already in candidates.organization_id
- Plan 56-06: GEN-08 assertRefsPopulated collects ALL missing ref categories into one throw (not short-circuit) for better multi-entity misconfiguration UX
- Plan 56-06: Phase 56 generator path produces candidate-type nominations ONLY (wired to refs.elections[0] × refs.constituencies[0]); polymorphism variants via fixed[] pass-through; Phase 58 extends via nominations override hook
- 56-08: D-22 boundary enforced via import shape (no createClient/rpc); makeCtx shared factory with overrides-last pattern avoids per-scenario factories; CandidatesGenerator D-27 seam tested both default and injected emitter paths (Phase 57 drop-in contract)
- Plan 56-09: Template schema projectId validator uses UUID-shape regex not zod v4 .uuid() — strict RFC 4122 v1-v8 rejects documented TEST_PROJECT_ID default
- Plan 56-09: Writer tests use vi.mock (greenfield in this monorepo) to isolate SupabaseAdminClient — mock factory tracks instances via __getLastInstance for per-test inspection
- Plan 56-09: ISS-05 GEN-08 end-to-end nomination integration test placed in pipeline.test.ts — only runtime proof Phase 56 Success Criterion 5 wires correctly (default {} template emits 0 nominations)
- Plan 56-10: tests/ admin client is a subclass of @openvaa/dev-seed base (D-24 complete); dev-seed package.json needed main/types/exports pointing at src/index.ts so Node ESM resolver finds entry from other workspaces (playwright/tsx)

### Blockers/Concerns

- Local imgproxy Docker container crashes intermittently (502 on image upload) — not a code issue.
- 19 pre-existing data-loading race E2E failures + 55 cascade failures carry over from v2.4; E2E fixture migration must not make this worse, and passing tests must remain passing after switch-over.
- NF-01 <10s seed budget pressures the generator toward bulk RPCs vs per-row inserts — Phase 56 picks the approach.
- E2E-03 zero-regression bar requires an explicit baseline-vs-post-swap Playwright comparison in Phase 59 before fixtures are deleted.
- supabaseAdminClient home (stays in tests/ vs moves to dev-tools) is a Phase 59 implementation-time call.

## Session Continuity

Last session: --stopped-at
Stopped at: Phases 57/58/59 context gathered — ready for plan+execute chain
Resume file: --resume-file
Next action: `/gsd-plan-phase 56`

**Planned Phase:** 58 () — 0 plans — 2026-04-23T07:34:15.014Z
