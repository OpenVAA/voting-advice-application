# Phase 13: Quality Assurance - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated pgTAP tests verifying that RLS policies, column-level protections, RPC function security, and data integrity triggers all work correctly. Covers all 16+ tables, all 5 role types, storage buckets, bulk operations, and trigger behaviors. Frontend adapter, Strapi removal, and Admin App UI are separate milestones.

</domain>

<decisions>
## Implementation Decisions

### Coverage scope
- **Comprehensive coverage**: Test every RLS policy across all tables, not just the 3 explicit requirements (QUAL-01/02/03)
- **Every table individually**: Each of the 16+ tables gets explicit test assertions — no "representative table per pattern" shortcuts
- **All 5 role types tested**: anon, candidate, party admin, project_admin/account_admin, super_admin
- **Tables + RPCs**: Test table-level RLS AND RPC function security (bulk_import, bulk_delete, resolve_email_variables enforce role checks internally)
- **Access + triggers**: Test data integrity triggers alongside access control — answer validation, nomination validation, external_id immutability, storage cleanup
- **Storage RLS included**: Storage bucket policies (public-assets, private-assets) tested for all role types

### Test data setup
- **Mock JWT claims**: Use `set_config('request.jwt.claims', ...)` to inject fake JWT payloads with user_roles arrays — no real auth users needed
- **Shared test fixture**: A helper file creates a standard dataset (2 accounts, 2 projects, candidates/elections per project, various role assignments) used by all test files
- **Transaction rollback**: pgTAP's standard approach — BEGIN at start, ROLLBACK at end. No residual test data. Each `supabase test db` run starts clean
- **Helper function for user switching**: Create a `set_test_user(role_name, user_id, user_roles_json)` function that wraps `SET ROLE` + `set_config()`. All test files use this helper for clean, readable role switching

### Test organization
- **By access pattern**: Files organized by what's being tested, mapping to requirements + extras:
  - `00-helpers.test.sql` — shared helpers, fixtures, constants
  - `01-tenant-isolation.test.sql` — QUAL-01: cross-project data isolation
  - `02-candidate-self-edit.test.sql` — QUAL-02: candidate own-record access
  - `03-anon-read.test.sql` — QUAL-03: public read, no write
  - `04-admin-crud.test.sql` — project_admin, account_admin, super_admin operations
  - `05-party-admin.test.sql` — party admin scope (own party + its candidates)
  - `06-storage-rls.test.sql` — storage bucket policies
  - `07-rpc-security.test.sql` — bulk_import, bulk_delete, resolve_email_variables role checks
  - `08-triggers.test.sql` — data integrity triggers (answer validation, nomination, external_id, storage cleanup)
  - `09-column-restrictions.test.sql` — column-level REVOKE/GRANT enforcement
- **Numeric prefixes**: Match the schema file convention already in the project. Helpers always run first
- **Subtests per table**: Within each file, use pgTAP subtest grouping — one subtest block per table. Clear output showing which table failed
- **Separate helpers file**: `00-helpers.test.sql` loaded first, contains `set_test_user()`, `create_test_data()`, and test constants

### Negative test depth
- **Every table, every operation**: For each table, test that denied operations actually fail — cross-tenant reads return 0 rows, unauthorized inserts raise exceptions, cross-candidate updates blocked
- **Anon write denial on every table**: Test that anon INSERT/UPDATE/DELETE fails on every single table, not just voter-facing ones
- **Column-level restriction tests**: Verify candidates cannot UPDATE protected columns (published, project_id, auth_user_id, organization_id, is_generated) on their own record. Same for party admins on organizations
- **Trigger rejection tests**: Verify triggers raise exceptions on invalid input — malformed answer values, invalid nomination hierarchy, external_id mutation attempts

### Test code style
- **Use PL/pgSQL loops for repetitive checks**: When testing a pattern across all tables (e.g., anon write denial), use FOR loops iterating over table names instead of copy-pasted assertions per table. Keep tests DRY and maintainable
- **Loops for pattern coverage, explicit assertions for edge cases**: Use loops for "anon can't write to any table" and "cross-tenant returns 0 rows on all project_id tables", but write explicit assertions for table-specific behaviors (e.g., candidate self-edit, party admin scope)

### Claude's Discretion
- pgTAP assertion function choices (ok, is, isnt, throws_ok, lives_ok, etc.)
- Exact test fixture data (how many elections, candidates, questions per project)
- How to structure the loop-based tests (dynamic SQL via EXECUTE, or function-per-table)
- Whether to use pgTAP's `runtests()` or explicit `SELECT plan()` + assertions
- How to test storage policies (direct storage.objects manipulation vs RLS on storage schema)
- RPC test approach (direct function calls as different roles vs testing via PostgREST simulation)

</decisions>

<specifics>
## Specific Ideas

- The test helpers should be reusable and well-documented — these patterns (set_test_user, fixture creation, loop-based assertions) will inform a future db-expert skill for Claude
- Column-level REVOKE/GRANT is a separate mechanism from RLS — both need independent test coverage since they fail in different ways (RLS returns empty results, column restrictions raise errors)
- The 79 existing RLS policies use three main helper functions (can_access_project, has_role, is_candidate_self) — test helpers should mirror this structure for clarity
- All planning docs from phases 8-12 (schema decisions, RLS patterns, auth hooks, service architecture) combined with this phase's testing context should serve as knowledge base for a db-expert skill

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `012-auth-hooks.sql`: `has_role()`, `can_access_project()`, `is_candidate_self()` — the RLS helper functions being tested
- `010-rls.sql`: 79 per-operation RLS policies across all content tables — the primary test target
- `013-auth-rls.sql`: Column-level REVOKE/GRANT on candidates and organizations — separate test target
- `014-storage.sql`: Storage bucket policies for public-assets and private-assets
- `016-bulk-operations.sql`: `bulk_import()` and `bulk_delete()` RPC functions with internal role checks
- `017-email-helpers.sql`: `resolve_email_variables()` SECURITY DEFINER function
- `000-functions.sql`: `validate_answer_value()`, `validate_nomination()` triggers
- `015-external-id.sql`: External ID immutability trigger

### Established Patterns
- Schema files use numeric prefix ordering (000-017) — test files should match
- RLS policies use `(SELECT auth.jwt())` and `(SELECT auth.uid())` for optimizer caching
- SECURITY DEFINER functions with `SET search_path = ''` for security
- JOIN-table RLS checks parent table via EXISTS subquery
- Published flag controls anon visibility on content tables
- Declarative schema in schema/ folder, migrations generated via concatenation

### Integration Points
- `apps/supabase/supabase/tests/` — directory to create (does not exist yet)
- `apps/supabase/supabase/config.toml` — may need pgTAP/test configuration
- `supabase test db` — the command that runs pgTAP tests
- Migration file `00001_initial_schema.sql` — tests run against this schema

</code_context>

<deferred>
## Deferred Ideas

- **DB-expert Claude skill**: The testing patterns, schema decisions (phases 8-12), and QA conventions from this phase should be compiled into a db-expert skill for Claude. Separate initiative from test implementation.

</deferred>

---

*Phase: 13-quality-assurance*
*Context gathered: 2026-03-15*
