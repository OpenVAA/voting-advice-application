---
gsd_state_version: 1.0
milestone: v2.5
milestone_name: milestone
status: planning
stopped_at: Phase 56 context refined (D-24..D-28)
last_updated: "2026-04-22T12:27:35.849Z"
last_activity: 2026-04-22 — ROADMAP.md written, 44/44 requirements mapped across phases 56-59
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 10
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-22)

**Core value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.
**Current focus:** v2.5 Dev Data Seeding Toolkit — template-driven data generator in @openvaa/dev-tools

## Current Position

Phase: 56 — Generator Foundations & Plumbing (not started)
Plan: —
Status: Roadmap complete; awaiting phase planning
Last activity: 2026-04-22 — ROADMAP.md written, 44/44 requirements mapped across phases 56-59

## Performance Metrics

**Cumulative:**

- Milestones shipped: 9 (v1.0, v1.1, v1.2, v1.3, v1.4, v2.0, v2.1, v2.3, v2.4) + 1 paused (v2.2)
- Total plans completed: 155 + 6 tasks
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

### Blockers/Concerns

- Local imgproxy Docker container crashes intermittently (502 on image upload) — not a code issue.
- 19 pre-existing data-loading race E2E failures + 55 cascade failures carry over from v2.4; E2E fixture migration must not make this worse, and passing tests must remain passing after switch-over.
- NF-01 <10s seed budget pressures the generator toward bulk RPCs vs per-row inserts — Phase 56 picks the approach.
- E2E-03 zero-regression bar requires an explicit baseline-vs-post-swap Playwright comparison in Phase 59 before fixtures are deleted.
- supabaseAdminClient home (stays in tests/ vs moves to dev-tools) is a Phase 59 implementation-time call.

## Session Continuity

Last session: --stopped-at
Stopped at: Phase 56 context refined (D-24..D-28)
Resume file: --resume-file
Next action: `/gsd-plan-phase 56`

**Planned Phase:** 56 (generator-foundations-plumbing) — 10 plans — 2026-04-22T12:27:35.846Z
