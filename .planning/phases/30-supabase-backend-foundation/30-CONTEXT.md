# Phase 30: Supabase Backend Foundation - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate the `apps/supabase/` workspace (106 files) and `packages/supabase-types/` (5 files) from the parallel branch into this monorepo. Add `@supabase/supabase-js` to the Yarn catalog. Verify that `supabase start` works, pgTAP tests pass, and Edge Functions respond. No frontend changes.

</domain>

<decisions>
## Implementation Decisions

### Workspace integration (BACK-01)
- **D-01:** Copy `apps/supabase/` directory from parallel branch as-is (106 files: 24 schema SQL, 10 pgTAP tests, 3 Edge Functions, benchmarks, seed.sql, config.toml)
- **D-02:** Workspace glob `apps/*` in root `package.json` already covers `apps/supabase/` — no workspace config change needed
- **D-03:** Turbo.json does not need supabase-specific tasks — supabase workspace uses supabase CLI scripts only (start, stop, reset, lint)

### Type package (BACK-02)
- **D-04:** Copy `packages/supabase-types/` from parallel branch (5 files: Database types, COLUMN_MAP, PROPERTY_MAP/TABLE_MAP, index.ts, tsconfig.json)
- **D-05:** Package uses raw .ts source exports (no build step) — `"build": "echo 'Raw .ts source'"` in package.json
- **D-06:** Workspace glob `packages/*` already covers `packages/supabase-types/`

### Supabase dependency (BACK-04)
- **D-07:** Add `supabase` CLI to Yarn catalog (shared across `apps/supabase` and `packages/supabase-types`)
- **D-08:** Add `@supabase/supabase-js` to Yarn catalog (will be consumed by frontend adapter in Phase 34+)
- **D-09:** Both workspace package.json files reference catalog versions

### Verification
- **D-10:** Run `supabase start` and verify local instance launches with migrations applied and seed data loaded
- **D-11:** Run pgTAP tests against local instance — all 229 tests must pass
- **D-12:** Invoke each Edge Function (invite-candidate, send-email, signicat-callback) and verify they respond (not full E2E, just that they're deployable and reachable)

### Claude's Discretion
- Whether to pin or use caret ranges for supabase CLI version in catalog
- Order of verification steps
- Whether benchmarks directory needs any cleanup

</decisions>

<specifics>
## Specific Ideas

- Supabase CLI should go in Yarn catalog like all other shared deps (established pattern from v1.1)
- pgTAP tests and Edge Functions should be verified now, not deferred — catch integration issues early

</specifics>

<canonical_refs>
## Canonical References

### Supabase workspace (parallel branch)
- `git show feat-gsd-supabase-migration:apps/supabase/package.json` — Workspace scripts and supabase CLI version
- `git show feat-gsd-supabase-migration:apps/supabase/supabase/config.toml` — Local Supabase project config (ports, project_id)
- `git show feat-gsd-supabase-migration:apps/supabase/supabase/seed.sql` — Seed data for local development

### Schema and tests (parallel branch)
- `git show feat-gsd-supabase-migration:apps/supabase/supabase/schema/` — 24 numbered schema files (000-enums through 900-test-helpers)
- `git show feat-gsd-supabase-migration:apps/supabase/supabase/tests/database/` — 10 pgTAP test files (229 tests)
- `git show feat-gsd-supabase-migration:apps/supabase/supabase/migrations/00001_initial_schema.sql` — Initial migration

### Edge Functions (parallel branch)
- `git show feat-gsd-supabase-migration:apps/supabase/supabase/functions/invite-candidate/index.ts` — Candidate invite flow
- `git show feat-gsd-supabase-migration:apps/supabase/supabase/functions/send-email/index.ts` — Transactional email
- `git show feat-gsd-supabase-migration:apps/supabase/supabase/functions/signicat-callback/index.ts` — Bank auth callback

### Type package (parallel branch)
- `git show feat-gsd-supabase-migration:packages/supabase-types/src/column-map.ts` — COLUMN_MAP snake_case↔camelCase mappings
- `git show feat-gsd-supabase-migration:packages/supabase-types/src/database.ts` — Generated Supabase Database types
- `git show feat-gsd-supabase-migration:packages/supabase-types/src/index.ts` — Package exports

### Current branch targets
- `package.json` — Workspace globs (already covers apps/* and packages/*)
- `turbo.json` — Task definitions (no changes expected)
- `.yarnrc.yml` or equivalent — Yarn catalog for shared dependency versions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Yarn catalog pattern established in v1.1 (30 entries) — supabase CLI and @supabase/supabase-js follow same pattern
- `packages/*` workspace glob already includes new type package location

### Established Patterns
- Raw .ts source packages (no build step) are a new pattern — existing publishable packages use tsup
- `packages/supabase-types/` is private (not published to npm), so raw .ts is acceptable
- Schema files use numbered naming convention (000, 010, 100-108, 200, 300-303, 400, 500-504, 900)

### Integration Points
- `@openvaa/supabase-types` will be consumed by frontend adapter (Phase 34+)
- `@supabase/supabase-js` will be consumed by frontend auth/adapter code (Phase 32+)
- `supabase start` will replace `docker compose up` for backend in Phase 38

</code_context>

<deferred>
## Deferred Ideas

- SQL file linting and formatting tooling — captured as TODO
- Schema reorganization (Phase 31) — numbered files, p_ prefixes, public. qualifiers
- Supabase port conflict with existing Postgres (port 5432 vs 54322) — config.toml already uses 54322

</deferred>

---

*Phase: 30-supabase-backend-foundation*
*Context gathered: 2026-03-22*
