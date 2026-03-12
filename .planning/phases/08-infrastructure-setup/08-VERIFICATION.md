---
phase: 08-infrastructure-setup
verified: 2026-03-12T00:00:00Z
status: gaps_found
score: 7/8 must-haves verified
gaps:
  - truth: "Running `supabase db reset` loads seed data that populates the database with a usable test dataset visible in Studio"
    status: partial
    reason: "seed.sql contains only a RAISE NOTICE placeholder — no INSERT statements produce visible rows in Studio. The ROADMAP success criterion #4 requires a usable test dataset; the PLAN deliberately scoped this to mechanism-only for Phase 8, deferring real data to Phase 9. The requirement INFRA-03 is marked [x] complete in REQUIREMENTS.md, but the ROADMAP success criterion is not satisfied at the data level."
    artifacts:
      - path: "apps/supabase/supabase/seed.sql"
        issue: "Contains only `RAISE NOTICE 'OpenVAA seed data executed successfully'` — no rows are inserted, so Studio shows empty tables after reset"
    missing:
      - "Either: (a) accept this as a Phase 8 scoped decision and update the ROADMAP success criterion to reflect mechanism-only validation, OR (b) add at least one meaningful INSERT into a non-custom table (e.g., a comment/config row) so Studio shows data"
      - "Note: Phase 9 will add real INSERT statements once schema tables exist — if the ROADMAP criterion was intentionally deferred, update REQUIREMENTS.md and ROADMAP success criterion to reflect that"
human_verification:
  - test: "Open Supabase Studio at http://localhost:54323"
    expected: "Dashboard loads showing connected database with no custom tables (fresh schema)"
    why_human: "Browser-based visual check — cannot verify UI render programmatically"
  - test: "Run `supabase db reset` from apps/supabase and check Studio Table Editor"
    expected: "Studio shows no error; seed mechanism fires (RAISE NOTICE in logs); database has zero custom-table rows (expected at this stage)"
    why_human: "Requires live running stack and visual inspection of Studio"
---

# Phase 8: Infrastructure Setup Verification Report

**Phase Goal:** Developers can run `supabase start` and have a complete local backend with type generation, linting, and seed data
**Verified:** 2026-03-12
**Status:** gaps_found (1 gap — scope interpretation of INFRA-03 / success criterion #4)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `supabase start` from monorepo root launches Postgres, GoTrue, PostgREST, Storage, Mailpit, and Studio without manual configuration | VERIFIED | `apps/supabase/package.json` has `start: supabase start`; `supabase:start` root alias delegates; config.toml configures all services on ports 54321-54327; SUMMARY confirms all services healthy |
| 2 | Running type generation script produces a TypeScript file reflecting the current database schema importable by frontend | VERIFIED | `packages/supabase-types/src/database.ts` is generated output (contains `graphql_public` schema, not placeholder); `yarn supabase:types` alias wired correctly; `index.ts` re-exports all types |
| 3 | Running `supabase db lint` reports warnings for tables missing RLS policies or indexes on filtered columns | VERIFIED | `apps/supabase/package.json` has `lint: supabase db lint --schema public --fail-on warning` + `lint:schema: node scripts/lint-schema.mjs` + `lint:all`; `yarn supabase:lint` alias present; lint-schema.mjs implements both RLS and unindexed FK checks |
| 4 | Running `supabase db reset` loads seed data that populates the database with a usable test dataset visible in Studio | FAILED | seed.sql contains only `RAISE NOTICE` — no rows inserted into any table. Mechanism is wired (config.toml `[db.seed]` points to seed.sql) but no usable data is produced |

**Score:** 3/4 success criteria verified (7/8 individual must-haves verified — see below)

---

### Derived Observable Truths (from plan must_haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1a | Supabase stack uses default ports (API: 54321, DB: 54322, Studio: 54323, Inbucket: 54324) | VERIFIED | config.toml lines confirmed: api.port=54321, db.port=54322, studio.port=54323, inbucket.port=54324 |
| 1b | Root alias scripts delegate to @openvaa/supabase workspace | VERIFIED | All 6 supabase:* scripts present in root package.json, all correctly delegate via `yarn workspace @openvaa/supabase` or `@openvaa/supabase-types` |
| 2a | Type generation script formats output with prettier | VERIFIED | generate script: `supabase gen types typescript --local --workdir ../../apps/supabase > src/database.ts && prettier --write src/database.ts` |
| 3a | lint-schema.mjs reports tables with RLS disabled in public schema | VERIFIED | SQL_RLS_DISABLED query implemented, exits 1 on ERROR-level findings |
| 3b | lint-schema.mjs reports foreign keys without indexes | VERIFIED | SQL_UNINDEXED_FK query implemented, reports WARNING-level |
| 3c | lint:all runs both checks and exits non-zero if either fails | VERIFIED | `"lint:all": "yarn lint && yarn lint:schema"` — shell short-circuit ensures non-zero exit on failure |

---

## Required Artifacts

### Plan 08-01 Artifacts

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `apps/supabase/package.json` | @openvaa/supabase workspace with start/stop/reset scripts | VERIFIED | Contains name `@openvaa/supabase`, all 7 scripts present (start, stop, reset, status, lint, lint:schema, lint:all) |
| `apps/supabase/supabase/config.toml` | Supabase CLI local dev configuration | VERIFIED | 389 lines; `[project]` present; all required sections configured (api, db, db.seed, studio, inbucket, storage, auth, edge_runtime) |
| `apps/supabase/supabase/seed.sql` | Seed data placeholder validating the mechanism | VERIFIED (mechanism) / PARTIAL (data) | File exists, wired in config.toml via `sql_paths = ["./seed.sql"]`; contains "seed" in comment; executes without error; BUT contains no INSERT statements — no visible data in Studio |
| `package.json` | Root workspace registration and alias scripts | VERIFIED | `"apps/*"` present in workspaces array; all 6 `supabase:*` alias scripts present |

### Plan 08-02 Artifacts

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `packages/supabase-types/package.json` | @openvaa/supabase-types workspace with generate script | VERIFIED | name=`@openvaa/supabase-types`, generate and build scripts present, correct devDependencies |
| `packages/supabase-types/tsconfig.json` | TypeScript config extending shared base | VERIFIED | Extends `@openvaa/shared-config/ts`, `noEmit: true` |
| `packages/supabase-types/src/index.ts` | Re-export barrel file | VERIFIED | Exports Database, Json, Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes (types) + Constants (value) |
| `packages/supabase-types/src/database.ts` | Generated Database type with Row/Insert/Update interfaces | VERIFIED | 164 lines of actual generated output (not placeholder); contains graphql_public schema, helpers, Constants |

### Plan 08-03 Artifacts

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `apps/supabase/scripts/lint-schema.mjs` | Custom Splinter-derived lint script, min 50 lines | VERIFIED | 171 lines; implements SQL_RLS_DISABLED (0013) and SQL_UNINDEXED_FK (0001); --strict flag; ensurePostgresAvailable() guard; exits 1 on errors |
| `apps/supabase/package.json` (lint scripts) | Lint scripts lint, lint:schema, lint:all | VERIFIED | All three scripts present |

---

## Key Link Verification

### Plan 08-01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `package.json` | `apps/supabase/package.json` | workspaces array includes `apps/*` | WIRED | Line 72 of package.json: `"apps/*"` |
| `apps/supabase/supabase/config.toml` | `apps/supabase/supabase/seed.sql` | `[db.seed]` sql_paths references seed.sql | WIRED | Line 65: `sql_paths = ["./seed.sql"]` |

### Plan 08-02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/supabase-types/package.json` | `apps/supabase/supabase/config.toml` | generate script uses `--workdir ../../apps/supabase` | WIRED | Line 12: `--workdir ../../apps/supabase` confirmed |
| `packages/supabase-types/src/index.ts` | `packages/supabase-types/src/database.ts` | re-exports Database type | WIRED | Line 1: `export type {... Database ...} from './database.js'` |

### Plan 08-03 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `apps/supabase/scripts/lint-schema.mjs` | `postgresql://postgres:postgres@localhost:54322/postgres` | psql queries against local Supabase Postgres | WIRED | Line 27: `const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'` |
| `apps/supabase/package.json` | `apps/supabase/scripts/lint-schema.mjs` | lint:schema script runs the custom lint | WIRED | Line 11: `"lint:schema": "node scripts/lint-schema.mjs"` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| INFRA-01 | 08-01 | Supabase CLI initialized in monorepo with config.toml configured for local development | SATISFIED | `apps/supabase/supabase/config.toml` exists, 389 lines, project_id = "openvaa-local", all service sections configured |
| INFRA-02 | 08-01 | `supabase start` launches all backend services (Postgres, GoTrue, PostgREST, Storage, Mailpit, Studio) | SATISFIED | config.toml enables all services; `start` script wired; root alias present; SUMMARY confirms all services healthy on correct ports |
| INFRA-03 | 08-01 | Seed data replaces Strapi's `GENERATE_MOCK_DATA_ON_INITIALISE` mechanism | PARTIAL | Mechanism is wired (config.toml db.seed + seed.sql); `supabase db reset` executes seed without error; BUT seed.sql contains only a RAISE NOTICE — no actual data rows. REQUIREMENTS.md marks as [x] but ROADMAP success criterion #4 requires "usable test dataset visible in Studio." This is a scope interpretation gap. |
| INFRA-04 | 08-02 | Type generation script produces TypeScript types from Supabase schema | SATISFIED | `yarn supabase:types` runs `supabase gen types typescript --local --workdir ../../apps/supabase`; output written to `packages/supabase-types/src/database.ts`; file contains real generated types (164 lines); importable via `@openvaa/supabase-types` |
| INFRA-05 | 08-03 | `supabase db lint` configured to block on missing RLS and unindexed columns | SATISFIED | Two-layer lint: (1) `supabase db lint --schema public --fail-on warning` for PL/pgSQL; (2) custom `lint-schema.mjs` for RLS-disabled tables (ERROR) and unindexed FKs (WARNING); combined `lint:all` exits non-zero on errors; `yarn supabase:lint` root alias wired |

**No orphaned requirements** — all 5 INFRA requirements mapped to Phase 8 in REQUIREMENTS.md are accounted for by plans 08-01, 08-02, 08-03.

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `apps/supabase/supabase/seed.sql` | Placeholder comment: "Phase 9 will add substantive INSERT statements" | Info | Expected — documented scope decision. Not a code quality issue, but relevant to ROADMAP success criterion #4 |

No blocking anti-patterns found. The seed.sql placeholder is intentional and documented.

---

## Human Verification Required

### 1. Studio Accessibility

**Test:** Navigate to `http://localhost:54323` with local Supabase stack running
**Expected:** Supabase Studio dashboard loads showing the database connection
**Why human:** Browser-based visual check — cannot verify UI render programmatically

### 2. Seed Mechanism in Studio

**Test:** Run `cd apps/supabase && supabase db reset` and then open Studio Table Editor
**Expected:** No errors during reset; RAISE NOTICE appears in CLI output; Table Editor shows empty schema (no custom tables at Phase 8)
**Why human:** Requires live running stack and visual confirmation in Studio UI

---

## Gaps Summary

**One gap identified:** ROADMAP success criterion #4 ("Running `supabase db reset` loads seed data that populates the database with a usable test dataset visible in Studio") is not met.

The seed mechanism is correctly wired — config.toml points to seed.sql, and the file executes without errors on `supabase db reset`. However, `seed.sql` contains only a `RAISE NOTICE` statement. No rows are inserted into any table, so Studio shows an empty database after reset.

**Root cause:** The PLAN explicitly scoped Phase 8 seed to "a placeholder validating the mechanism" — real INSERT statements were deferred to Phase 9 when schema tables will exist. The REQUIREMENTS.md marks INFRA-03 as `[x]` complete. However, the ROADMAP success criterion uses stronger language ("usable test dataset visible in Studio") than what was implemented.

**Resolution paths:**

1. **Accept as scoped** — Update the ROADMAP success criterion #4 to reflect that Phase 8 validates the seed mechanism only, and Phase 9 delivers actual seed data. This is the most honest path given that no schema tables exist yet.
2. **Add minimal seed data** — Insert a comment or version row into a Supabase internal table (e.g., `supabase_migrations` comment), or create a simple non-business table in the seed to demonstrate Studio visibility. This would technically satisfy the criterion without requiring schema tables.

The gap does not block Phase 9, as the mechanism is fully wired and working. It is a documentation/expectation alignment issue between the PLAN's scoped execution and the ROADMAP's stated criterion.

---

_Verified: 2026-03-12_
_Verifier: Claude (gsd-verifier)_
