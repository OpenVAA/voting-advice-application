---
title: Per-instance project scoping in frontend data provider
priority: high
source: Phase 58 UAT session (2026-04-23) — user observation after first live seed
---

The frontend's Supabase data provider (`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`) currently queries all content tables (`elections`, `constituencies`, `candidates`, `nominations`, `questions`, `question_categories`, `organizations`, `app_settings`, …) without a `project_id` filter. Multi-tenant separation today relies entirely on RLS (`anon` sees only `published = true` rows) — it does not scope by project.

Each deployed instance of the VAA is expected to serve exactly one project, so the project id should be resolved once from env and applied as a `.eq('project_id', …)` filter on every query the anon/voter client issues.

**Minimal shape of the fix:**

1. Add `PUBLIC_PROJECT_ID` to `.env.example` and document it in `CLAUDE.md` (Deployment section).
2. Expose it via `constants.PUBLIC_PROJECT_ID` alongside `PUBLIC_SUPABASE_URL` (`apps/frontend/src/lib/utils/constants.ts`).
3. In `supabaseDataProvider.ts`, chain `.eq('project_id', constants.PUBLIC_PROJECT_ID)` on every query against a project-scoped table. `app_settings` is `UNIQUE(project_id)` so `.single()` + `.eq` is the right shape there.
4. `get_nominations` RPC already receives `p_election_id`/`p_constituency_id`; confirm whether it also needs a `p_project_id` parameter or whether the join chain guarantees project scoping transitively.
5. If `PUBLIC_PROJECT_ID` is unset, fail fast with a descriptive error at adapter construction (same style as D-15 env enforcement in dev-seed).

**Why high priority:** without this, a multi-project Supabase instance (e.g. production with multiple tenants, or a dev DB seeded with more than one project) would leak rows across instances. Currently only masked because every deployment runs one project at a time.

**Scope boundaries:**
- Voter (anon) paths only in this ticket. Candidate/admin paths authenticate and already have project context via `can_access_project()`.
- No schema change needed — `project_id` is already on every content table.

**Related:** project-bootstrap flow (`apps/supabase/supabase/schema/100-tenancy.sql`) emits a stable `00000000-0000-0000-0000-000000000001` for the dev test project; production instances will have their own uuid. Dev env: set `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001` in `.env`.

---

## Closed — 2026-09-05 (Phase 161, plan 09)

All five items of the proposed fix are on disk, each measured:

1. `.env.example` carries `PUBLIC_PROJECT_ID` under a `# Project scoping` block, and `CLAUDE.md`
   documents the variable and its no-fallback throw.
2. `constants.PUBLIC_PROJECT_ID` exists beside `PUBLIC_SUPABASE_URL` in
   `apps/frontend/src/lib/utils/constants.ts`.
3. The provider no longer chains `.eq('project_id', ...)` by hand — it cannot issue an unscoped query
   at all. `scopedFrom` is a typed facade whose `insert`/`update` signatures `Omit` the project column,
   and `scripts/assert-project-scoped-queries.mjs` (wired into `lint:check`) forbids the raw client
   shape in every adapter source, including the three aliasing / destructuring / computed-access
   evasions.
4. Item 4's open question is answered: the join chain did NOT guarantee project scoping transitively.
   `get_nominations` gained a required `p_project_id` (migration 00005) and its four entity joins gained
   the same predicate (migration 00007), the second of which fixes a nomination in one project being
   able to display another project's entity.
5. `resolveProjectId` throws at adapter construction on an unset, blank or non-canonical value.

Scope note: this todo's own boundary said "voter (anon) paths only", and that is what is closed. Project
isolation at the DATABASE security boundary is NOT closed — all 13 `anon_select_*` policies in
`schema/302-rls.sql` remain project-unscoped (measured: 13 policies, 0 `project_id` references), which is
why the fix above is an application-layer one. That is Phase 162's criteria 2 and 5.
