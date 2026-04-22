---
gsd_state_version: 1.0
milestone: v2.5
milestone_name: Dev Data Seeding Toolkit
status: defining-requirements
stopped_at: Milestone v2.5 started — REQUIREMENTS.md next
last_updated: "2026-04-22T00:00:00Z"
last_activity: 2026-04-22
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-22)

**Core value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.
**Current focus:** v2.5 Dev Data Seeding Toolkit — template-driven data generator in @openvaa/dev-tools

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-22 — Milestone v2.5 started

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

### Blockers/Concerns

- Local imgproxy Docker container crashes intermittently (502 on image upload) — not a code issue.
- 19 pre-existing data-loading race E2E failures + 55 cascade failures carry over from v2.4; E2E fixture migration must not make this worse, and passing tests must remain passing after switch-over.

## Session Continuity

Last session: 2026-04-22T00:00:00Z
Stopped at: Milestone v2.5 started — defining REQUIREMENTS.md
Resume file: .planning/REQUIREMENTS.md (once created)
