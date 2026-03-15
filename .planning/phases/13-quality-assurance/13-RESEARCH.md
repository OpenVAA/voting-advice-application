# Phase 13: Quality Assurance - Research

**Researched:** 2026-03-15
**Domain:** pgTAP database testing for RLS policies, triggers, and RPC functions in Supabase
**Confidence:** HIGH

## Summary

Phase 13 implements comprehensive pgTAP tests verifying the security layer built in Phases 9-12: 79 RLS policies across 16+ tables, column-level REVOKE/GRANT protections, 5 role types, storage bucket policies, RPC function security, and data integrity triggers. The testing infrastructure uses Supabase's built-in `supabase test db` command which runs pgTAP test files from `supabase/tests/database/`.

The core mechanism for simulating authenticated users with custom JWT claims is `set_config('request.jwt.claims', ..., true)` combined with `set_config('role', 'authenticated', true)`. This is how Supabase's `auth.uid()` and `auth.jwt()` functions resolve at the database level -- they read from `current_setting('request.jwt.claims', true)`. Since this project uses a Custom Access Token Hook that injects `user_roles` into JWT claims, the test helpers must construct JWT payloads that include this array.

The supabase-test-helpers library (v0.0.6) provides `tests.create_supabase_user()`, `tests.authenticate_as()`, and `tests.clear_authentication()`. However, since `authenticate_as()` only sets standard JWT fields (sub, email, phone) and does NOT inject custom claims like `user_roles`, we need a custom `set_test_user()` helper that explicitly sets the `user_roles` claim alongside the standard fields. This is the single most important technical decision in this phase.

**Primary recommendation:** Build a custom `set_test_user(role, user_id, user_roles_json)` helper that wraps `set_config('role', ...)` + `set_config('request.jwt.claims', ...)` with full control over JWT claim contents. Do NOT rely on supabase-test-helpers `authenticate_as()` since it cannot inject custom claims.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Comprehensive coverage**: Test every RLS policy across all tables, not just the 3 explicit requirements (QUAL-01/02/03)
- **Every table individually**: Each of the 16+ tables gets explicit test assertions -- no "representative table per pattern" shortcuts
- **All 5 role types tested**: anon, candidate, party admin, project_admin/account_admin, super_admin
- **Tables + RPCs**: Test table-level RLS AND RPC function security (bulk_import, bulk_delete, resolve_email_variables enforce role checks internally)
- **Access + triggers**: Test data integrity triggers alongside access control -- answer validation, nomination validation, external_id immutability, storage cleanup
- **Storage RLS included**: Storage bucket policies (public-assets, private-assets) tested for all role types
- **Mock JWT claims**: Use `set_config('request.jwt.claims', ...)` to inject fake JWT payloads with user_roles arrays -- no real auth users needed
- **Shared test fixture**: A helper file creates a standard dataset (2 accounts, 2 projects, candidates/elections per project, various role assignments) used by all test files
- **Transaction rollback**: pgTAP's standard approach -- BEGIN at start, ROLLBACK at end. No residual test data. Each `supabase test db` run starts clean
- **Helper function for user switching**: Create a `set_test_user(role_name, user_id, user_roles_json)` function that wraps `SET ROLE` + `set_config()`. All test files use this helper for clean, readable role switching
- **By access pattern**: Files organized by what's being tested, mapping to requirements + extras:
  - `00-helpers.test.sql` -- shared helpers, fixtures, constants
  - `01-tenant-isolation.test.sql` -- QUAL-01: cross-project data isolation
  - `02-candidate-self-edit.test.sql` -- QUAL-02: candidate own-record access
  - `03-anon-read.test.sql` -- QUAL-03: public read, no write
  - `04-admin-crud.test.sql` -- project_admin, account_admin, super_admin operations
  - `05-party-admin.test.sql` -- party admin scope (own party + its candidates)
  - `06-storage-rls.test.sql` -- storage bucket policies
  - `07-rpc-security.test.sql` -- bulk_import, bulk_delete, resolve_email_variables role checks
  - `08-triggers.test.sql` -- data integrity triggers (answer validation, nomination, external_id, storage cleanup)
  - `09-column-restrictions.test.sql` -- column-level REVOKE/GRANT enforcement
- **Numeric prefixes**: Match the schema file convention already in the project. Helpers always run first
- **Subtests per table**: Within each file, use pgTAP subtest grouping -- one subtest block per table. Clear output showing which table failed
- **Separate helpers file**: `00-helpers.test.sql` loaded first, contains `set_test_user()`, `create_test_data()`, and test constants
- **Every table, every operation**: For each table, test that denied operations actually fail -- cross-tenant reads return 0 rows, unauthorized inserts raise exceptions, cross-candidate updates blocked
- **Anon write denial on every table**: Test that anon INSERT/UPDATE/DELETE fails on every single table, not just voter-facing ones
- **Column-level restriction tests**: Verify candidates cannot UPDATE protected columns (published, project_id, auth_user_id, organization_id, is_generated) on their own record. Same for party admins on organizations
- **Trigger rejection tests**: Verify triggers raise exceptions on invalid input -- malformed answer values, invalid nomination hierarchy, external_id mutation attempts
- **Use PL/pgSQL loops for repetitive checks**: When testing a pattern across all tables (e.g., anon write denial), use FOR loops iterating over table names instead of copy-pasted assertions per table. Keep tests DRY and maintainable
- **Loops for pattern coverage, explicit assertions for edge cases**: Use loops for "anon can't write to any table" and "cross-tenant returns 0 rows on all project_id tables", but write explicit assertions for table-specific behaviors (e.g., candidate self-edit, party admin scope)

### Claude's Discretion
- pgTAP assertion function choices (ok, is, isnt, throws_ok, lives_ok, etc.)
- Exact test fixture data (how many elections, candidates, questions per project)
- How to structure the loop-based tests (dynamic SQL via EXECUTE, or function-per-table)
- Whether to use pgTAP's `runtests()` or explicit `SELECT plan()` + assertions
- How to test storage policies (direct storage.objects manipulation vs RLS on storage schema)
- RPC test approach (direct function calls as different roles vs testing via PostgREST simulation)

### Deferred Ideas (OUT OF SCOPE)
- **DB-expert Claude skill**: The testing patterns, schema decisions (phases 8-12), and QA conventions from this phase should be compiled into a db-expert skill for Claude. Separate initiative from test implementation.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QUAL-01 | pgTAP tests verify project-level tenant isolation (Project A cannot read Project B's data) | Test file `01-tenant-isolation.test.sql`: create data in Project A, switch to user with Project B roles, verify SELECT returns 0 rows across all 16+ tables. Uses `set_test_user()` with project-scoped JWT claims. Must test all tables with `project_id` column including join tables that check parent via EXISTS. |
| QUAL-02 | pgTAP tests verify candidate can only edit own data | Test file `02-candidate-self-edit.test.sql`: create 2 candidates with different `auth_user_id`, switch to candidate A, verify SELECT/UPDATE own record succeeds, verify SELECT/UPDATE candidate B's record fails. Must also test column-level restrictions (cannot set published, project_id, etc.). |
| QUAL-03 | pgTAP tests verify public read access for voter-facing data | Test file `03-anon-read.test.sql`: switch to anon role, verify SELECT on published records succeeds for voter-facing tables, verify SELECT on unpublished returns 0 rows, verify INSERT/UPDATE/DELETE fails on ALL tables. Must test both content tables and join tables. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pgTAP | built-in to Supabase | SQL-based TAP testing framework for PostgreSQL | Only supported testing framework for `supabase test db` |
| Supabase CLI | >= 1.11.4 | `supabase test db` command runner | Official test runner, manages pgTAP execution |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| supabase-test-helpers | 0.0.6 | User creation, authentication helpers | Optional -- useful for `rls_enabled()` assertion but NOT for custom JWT claims |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| supabase-test-helpers `authenticate_as()` | Custom `set_test_user()` | Custom helper gives full control over JWT claims including `user_roles` array -- REQUIRED for this project |
| dbdev package manager | Manual SQL inclusion | dbdev adds complexity; since we only need a subset of helpers, manual inclusion is simpler |

**Installation:**
pgTAP is pre-installed in Supabase; no installation needed. Tests go in `supabase/tests/database/`.

## Architecture Patterns

### Recommended Project Structure
```
apps/supabase/supabase/tests/
  database/
    00-helpers.test.sql           # Shared helpers, fixtures, constants
    01-tenant-isolation.test.sql  # QUAL-01
    02-candidate-self-edit.test.sql # QUAL-02
    03-anon-read.test.sql         # QUAL-03
    04-admin-crud.test.sql        # Admin role operations
    05-party-admin.test.sql       # Party admin scope
    06-storage-rls.test.sql       # Storage bucket policies
    07-rpc-security.test.sql      # RPC function security
    08-triggers.test.sql          # Data integrity triggers
    09-column-restrictions.test.sql # Column-level protections
```

### Pattern 1: User Context Switching via set_test_user()

**What:** A helper function that configures the PostgreSQL session to simulate a specific Supabase user with custom JWT claims.

**When to use:** Before every RLS test assertion to establish the acting user's identity and roles.

**How it works internally:**

Supabase's `auth.uid()` reads from `current_setting('request.jwt.claim.sub', true)` and `auth.jwt()` reads from `current_setting('request.jwt.claims', true)::jsonb`. The PostgREST layer normally sets these from the incoming JWT. In tests, we set them manually.

**Example:**
```sql
-- Source: supabase-test-helpers v0.0.6 + project custom extension
CREATE OR REPLACE FUNCTION set_test_user(
  p_role text,        -- 'anon' or 'authenticated'
  p_user_id uuid DEFAULT NULL,
  p_user_roles jsonb DEFAULT '[]'::jsonb
)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF p_role = 'anon' THEN
    PERFORM set_config('role', 'anon', true);
    PERFORM set_config('request.jwt.claims', '', true);
    RETURN;
  END IF;

  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', p_user_id::text,
    'role', 'authenticated',
    'user_roles', p_user_roles
  )::text, true);
END;
$$;
```

**Critical note:** The `set_config(..., true)` third parameter means the setting is LOCAL to the current transaction, which is perfect since pgTAP tests wrap everything in BEGIN/ROLLBACK.

### Pattern 2: Shared Test Fixture via create_test_data()

**What:** A function that creates a complete test dataset with 2 accounts, 2 projects, and entities across both projects. Returns a composite type or populates known variables.

**When to use:** Called at the start of each test file after BEGIN. Since tests ROLLBACK, each file gets a fresh dataset.

**Example fixture structure:**
```sql
-- Account A -> Project A -> election_a, candidate_a, org_a, etc.
-- Account B -> Project B -> election_b, candidate_b, org_b, etc.
-- Auth users: user_admin_a (project_admin for A), user_candidate_a (candidate in A),
--             user_party_a (party admin for org_a), user_super (super_admin),
--             user_account_a (account_admin for account A)
```

### Pattern 3: Loop-Based Pattern Coverage

**What:** Use PL/pgSQL loops to test the same assertion across all tables, reducing copy-paste.

**When to use:** For universal patterns like "anon cannot write to any table" or "cross-tenant reads return 0 rows".

**Example:**
```sql
-- Source: project convention from CONTEXT.md
DO $$
DECLARE
  tbl text;
  cnt bigint;
  tables_with_project_id text[] := ARRAY[
    'elections', 'candidates', 'organizations', 'factions', 'alliances',
    'constituency_groups', 'constituencies', 'nominations',
    'question_templates', 'question_categories', 'questions', 'app_settings'
  ];
BEGIN
  -- Switch to user with Project B roles
  PERFORM set_test_user('authenticated', 'user-b-id'::uuid,
    '[{"role":"project_admin","scope_type":"project","scope_id":"project-b-id"}]'::jsonb);

  FOREACH tbl IN ARRAY tables_with_project_id
  LOOP
    EXECUTE format('SELECT count(*) FROM %I WHERE project_id = $1', tbl)
      INTO cnt USING 'project-a-id'::uuid;
    -- Use pgTAP ok() assertion
    PERFORM ok(cnt = 0, format('User B cannot see Project A data in %s', tbl));
  END LOOP;
END;
$$;
```

### Pattern 4: Testing Column-Level REVOKE/GRANT

**What:** Verify that `REVOKE UPDATE ON table FROM authenticated` + `GRANT UPDATE (specific_cols)` works correctly. Column-level restrictions raise errors (not empty results like RLS).

**When to use:** For candidates and organizations tables where structural columns are protected.

**Example:**
```sql
-- As candidate, attempt to UPDATE a protected column
SELECT throws_ok(
  format($$
    UPDATE candidates SET published = true WHERE id = '%s'
  $$, candidate_a_id),
  '42501',  -- insufficient_privilege error code
  NULL,
  'Candidate cannot update published column on own record'
);

-- As candidate, verify allowed column succeeds
SELECT lives_ok(
  format($$
    UPDATE candidates SET first_name = 'Updated' WHERE id = '%s'
  $$, candidate_a_id),
  'Candidate can update first_name on own record'
);
```

### Pattern 5: Testing Triggers with throws_ok

**What:** Verify that data integrity triggers raise the expected exceptions.

**When to use:** For validate_answer_value, validate_nomination, enforce_external_id_immutability triggers.

**Example:**
```sql
-- Test external_id immutability
SELECT throws_ok(
  format($$
    UPDATE elections SET external_id = 'changed' WHERE id = '%s'
  $$, election_with_ext_id),
  NULL,
  'external_id cannot be changed once set',
  'external_id immutability trigger fires on value change'
);

-- Test that NULL -> value is allowed
SELECT lives_ok(
  format($$
    UPDATE elections SET external_id = 'new-id' WHERE id = '%s'
  $$, election_without_ext_id),
  'external_id can be set from NULL'
);
```

### Anti-Patterns to Avoid
- **Using supabase-test-helpers `authenticate_as()` for custom claims:** It only sets sub, email, phone -- NOT `user_roles`. Your RLS policies read `auth.jwt() -> 'user_roles'` which would be NULL.
- **Forgetting to reset role between tests:** If a test sets role to `authenticated` and the next assertion expects `anon`, stale state causes false passes/failures. Always call `set_test_user()` before each assertion group.
- **Testing with postgres superuser role:** The postgres role bypasses ALL RLS. Tests must use `anon` or `authenticated` roles to exercise actual policies.
- **Inserting test data as authenticated role:** Test fixture data should be inserted as `postgres` (before switching roles) or using SECURITY DEFINER helpers that bypass RLS. Otherwise RLS will block the test setup itself.
- **Using `SET ROLE` instead of `set_config('role', ...)`:** `SET ROLE` is a DDL statement that cannot be easily wrapped in a function. Use `set_config('role', 'authenticated', true)` which is transactional.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT claim simulation | Raw `set_config` calls scattered across tests | Centralized `set_test_user()` helper | DRY, consistent, readable, and less error-prone |
| Test data creation | Inline INSERT statements in every test file | Shared `create_test_data()` function in helpers file | 10 test files would duplicate hundreds of INSERT statements |
| RLS enabled verification | Manual pg_class queries | pgTAP `has_table()` + custom check or supabase-test-helpers `rls_enabled()` | Standard assertion, no need to reimplement |
| Plan count tracking | Manual counting of assertions | pgTAP `no_plan()` instead of `plan(N)` | Avoids brittle test counts that break when adding assertions |

**Key insight:** The test helpers file (00-helpers.test.sql) is the foundation. Every other test file depends on it. Get the helpers right and the individual test files become straightforward.

## Common Pitfalls

### Pitfall 1: auth.jwt() Returns NULL Without request.jwt.claims
**What goes wrong:** RLS policies using `has_role()` or `can_access_project()` silently return false, making every query return 0 rows.
**Why it happens:** Forgetting to call `set_test_user()` or setting `request.jwt.claims` to empty string instead of valid JSON.
**How to avoid:** Always set `request.jwt.claims` to a complete JSON object. Even for anon, set it explicitly (or null it out). Have `set_test_user('anon')` explicitly clear it.
**Warning signs:** All authenticated tests return 0 rows regardless of what data exists.

### Pitfall 2: Test File Execution Order
**What goes wrong:** A test file references a helper function that hasn't been created yet.
**Why it happens:** `supabase test db` runs files alphabetically. If helpers are in `helpers.test.sql` (starts with 'h'), they run after `01-...`.
**How to avoid:** Name helpers file `00-helpers.test.sql` to ensure it runs first. All other files use numeric prefix >= 01.
**Warning signs:** "function does not exist" errors on first test run.

### Pitfall 3: pgTAP Extension Not Loaded
**What goes wrong:** `select plan(1)` fails with "function plan(integer) does not exist".
**Why it happens:** pgTAP extension not enabled in the test database.
**How to avoid:** Include `CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;` at the top of `00-helpers.test.sql`. Also may need `SET search_path = public, extensions;` so pgTAP functions are visible without schema prefix.
**Warning signs:** First test file fails immediately on any pgTAP function call.

### Pitfall 4: Column-Level Restrictions vs RLS Confusion
**What goes wrong:** Testing column restriction via `SELECT` instead of `UPDATE`, or expecting empty results instead of an error.
**Why it happens:** RLS returns empty result sets for unauthorized reads. Column-level REVOKE raises `42501` (insufficient_privilege) errors on UPDATE.
**How to avoid:** Use `throws_ok()` with error code `42501` for column restriction tests. Use `is()` with count = 0 for RLS tests.
**Warning signs:** Tests pass when they should fail because the wrong assertion type is used.

### Pitfall 5: SECURITY DEFINER Functions Bypass Role Checks
**What goes wrong:** Testing `has_role()` or `can_access_project()` directly as authenticated user succeeds even without proper JWT claims.
**Why it happens:** These functions are SECURITY DEFINER and execute as the function owner (postgres). However, they internally read `auth.jwt()` which reads from `request.jwt.claims`, so they DO respect the simulated context.
**How to avoid:** Understand that SECURITY DEFINER changes the executing role but `current_setting('request.jwt.claims')` is session-level and persists. The functions work correctly in tests as long as `request.jwt.claims` is properly set.
**Warning signs:** Functions return unexpected results when called directly vs through RLS.

### Pitfall 6: Inserting Into Tables With Triggers During Test Setup
**What goes wrong:** Test data insertion fails because triggers (like validate_nomination or validate_answers_jsonb) reject the data.
**Why it happens:** Triggers run even during test setup. If test data doesn't satisfy constraints, setup fails.
**How to avoid:** Ensure test fixture data is valid according to all triggers. For nomination data, create entities in correct dependency order: elections, constituencies, entities, then nominations. For answers, create questions first with proper types.
**Warning signs:** Test setup fails with trigger exception messages.

### Pitfall 7: storage.objects Testing Requires Specific Path Format
**What goes wrong:** Storage RLS tests fail because test data doesn't match the expected path format.
**Why it happens:** Storage policies parse paths using `storage.foldername()` expecting `{project_id}/{entity_type}/{entity_id}/filename.ext`.
**How to avoid:** Insert test rows into `storage.objects` with properly formatted `name` column matching the expected path convention. Set `bucket_id` to 'public-assets' or 'private-assets'.
**Warning signs:** All storage policy tests return false because path parsing returns NULL.

### Pitfall 8: RPC Functions Are SECURITY INVOKER
**What goes wrong:** Expecting `bulk_import()` and `bulk_delete()` to bypass RLS.
**Why it happens:** Both functions are `SECURITY INVOKER`, meaning they execute with the caller's permissions. RLS policies apply.
**How to avoid:** When testing RPC access, ensure the user has appropriate roles. A candidate calling `bulk_import()` should fail because the underlying INSERT RLS checks `can_access_project()`.
**Warning signs:** RPC calls succeed when they should fail, or vice versa.

## Code Examples

### Complete Test File Template
```sql
-- Source: Supabase docs + project conventions
BEGIN;

-- Load pgTAP (already available from 00-helpers.test.sql)
-- SET search_path already configured

SELECT no_plan();

-- Create test fixture data (defined in 00-helpers.test.sql)
SELECT create_test_data();

-- =====================================================================
-- Test: [description]
-- =====================================================================

-- Switch to specific user context
SELECT set_test_user('authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a'));

-- Assert something
SELECT is(
  (SELECT count(*) FROM candidates WHERE id = test_id('candidate_a'))::integer,
  1,
  'Candidate A can read own record'
);

-- Switch to different context
SELECT set_test_user('anon');

-- Assert another thing
SELECT is(
  (SELECT count(*) FROM candidates WHERE published = false)::integer,
  0,
  'Anon cannot see unpublished candidates'
);

SELECT * FROM finish();
ROLLBACK;
```

### Helper Function: create_test_data()
```sql
-- Source: project conventions
-- Creates 2 accounts, 2 projects, and full entity hierarchy in each
CREATE OR REPLACE FUNCTION create_test_data()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  -- Use predictable UUIDs for easy reference
  acct_a_id  uuid := '11111111-1111-1111-1111-111111111111';
  acct_b_id  uuid := '22222222-2222-2222-2222-222222222222';
  proj_a_id  uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  proj_b_id  uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  -- ... user UUIDs, entity UUIDs
BEGIN
  -- Insert accounts, projects, auth users, entities
  -- Inserted as postgres role (before any role switching)
  INSERT INTO accounts (id, name) VALUES
    (acct_a_id, 'Account A'),
    (acct_b_id, 'Account B');
  INSERT INTO projects (id, account_id, name) VALUES
    (proj_a_id, acct_a_id, 'Project A'),
    (proj_b_id, acct_b_id, 'Project B');
  -- ... elections, candidates, orgs, questions, etc.
  -- Create auth.users for test users
  -- Create user_roles entries
END;
$$;
```

### Testing anon write denial with loop
```sql
-- Source: project CONTEXT.md decision
DO $$
DECLARE
  tbl text;
  all_tables text[] := ARRAY[
    'accounts', 'projects', 'elections', 'candidates', 'organizations',
    'factions', 'alliances', 'constituency_groups', 'constituencies',
    'nominations', 'question_templates', 'question_categories',
    'questions', 'app_settings'
  ];
BEGIN
  PERFORM set_test_user('anon');

  FOREACH tbl IN ARRAY all_tables LOOP
    -- Test INSERT denial
    PERFORM throws_ok(
      format('INSERT INTO %I DEFAULT VALUES', tbl),
      '42501',
      NULL,
      format('Anon cannot INSERT into %s', tbl)
    );
  END LOOP;
END;
$$;
```

**Important note about loop-based tests:** pgTAP assertion functions like `ok()`, `is()`, `throws_ok()` are SELECT-returning functions. Inside a PL/pgSQL DO block, you must use `PERFORM` to call them (discarding the result). The TAP output is still emitted. Alternatively, define the loop as a function that returns SETOF text and call it with SELECT.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual role switching with `SET ROLE` | `set_config('role', ..., true)` in functions | Supabase test-helpers v0.0.3+ | Enables role switching within PL/pgSQL functions |
| Testing via PostgREST HTTP | Direct pgTAP SQL testing | Supabase CLI 1.11+ | Faster, more direct, tests DB layer not API layer |
| `plan(N)` with exact count | `no_plan()` with `finish()` | pgTAP best practice | Avoids brittle test counts that break when adding tests |

## Complete Table Inventory for Testing

All tables requiring RLS test coverage:

| Table | Has project_id | Has published | Has auth_user_id | Special Access |
|-------|---------------|---------------|-------------------|----------------|
| accounts | No | No | No | account_admin, super_admin only |
| projects | No (IS project) | No | No | can_access_project, account_admin |
| elections | Yes | Yes | No | Standard pattern |
| constituency_groups | Yes | Yes | No | Standard pattern |
| constituencies | Yes | Yes | No | Standard pattern |
| constituency_group_constituencies | No (join) | No | No | Always readable, admin write via parent |
| election_constituency_groups | No (join) | No | No | Always readable, admin write via parent |
| organizations | Yes | Yes | Yes | Party admin self-edit |
| candidates | Yes | Yes | Yes | Candidate self-edit + column restrictions |
| factions | Yes | Yes | No | Standard pattern |
| alliances | Yes | Yes | No | Standard pattern |
| question_templates | Yes | No | No | Admin-only, no anon access |
| question_categories | Yes | Yes | No | Standard pattern |
| questions | Yes | Yes | No | Standard pattern |
| nominations | Yes | Yes | No | Standard pattern |
| app_settings | Yes | No | No | Anon readable, admin write |
| user_roles | No | No | No | service_role + auth_admin only |
| storage_config | No | No | No | service_role only, no API exposure |
| storage.objects | N/A | N/A | N/A | Bucket-based + path-based policies |

## Open Questions

1. **pgTAP plan() vs no_plan()**
   - What we know: `no_plan()` is more maintainable since adding tests doesn't require updating a count. `plan(N)` catches accidental extra/missing tests.
   - What's unclear: Whether `supabase test db` output is cleaner with one vs the other.
   - Recommendation: Use `no_plan()` for all test files. The maintenance cost of exact plan counts across 100+ assertions per file is too high.

2. **DO blocks vs SELECT for loop-based assertions**
   - What we know: pgTAP functions return `text` (TAP output). In DO blocks, `PERFORM` calls them but the TAP protocol still works. Alternatively, helper functions can `RETURN NEXT` the TAP lines.
   - What's unclear: Whether `PERFORM ok(...)` inside DO blocks properly increments the test counter for pgTAP's plan/finish tracking.
   - Recommendation: Test with a minimal example first. If DO block + PERFORM works with `no_plan()` + `finish()`, use that pattern. Otherwise, define loop functions that return SETOF text.

3. **Storage policy testing approach**
   - What we know: Storage policies operate on `storage.objects` table. We can insert directly into `storage.objects` as postgres, then test SELECT/INSERT/UPDATE/DELETE as different roles.
   - What's unclear: Whether `storage.foldername()` function is available in the test context, and whether direct `storage.objects` manipulation correctly exercises the RLS policies.
   - Recommendation: Insert test rows into `storage.objects` with proper `bucket_id` and `name` (path) values. The `storage.foldername()` function should be available since it's a Supabase built-in.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pgTAP (built into Supabase) |
| Config file | `apps/supabase/supabase/config.toml` (no special test config needed) |
| Quick run command | `cd apps/supabase && npx supabase test db` |
| Full suite command | `cd apps/supabase && npx supabase test db` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QUAL-01 | Tenant isolation: Project A cannot read Project B data | integration | `cd apps/supabase && npx supabase test db` | No -- Wave 0 |
| QUAL-02 | Candidate self-edit: can edit own, cannot edit others | integration | `cd apps/supabase && npx supabase test db` | No -- Wave 0 |
| QUAL-03 | Anon read: published data readable, no writes | integration | `cd apps/supabase && npx supabase test db` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/supabase && npx supabase test db`
- **Per wave merge:** `cd apps/supabase && npx supabase test db`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/supabase/supabase/tests/database/` directory -- does not exist yet
- [ ] `00-helpers.test.sql` -- shared helpers, fixtures, constants
- [ ] `01-tenant-isolation.test.sql` -- QUAL-01 tests
- [ ] `02-candidate-self-edit.test.sql` -- QUAL-02 tests
- [ ] `03-anon-read.test.sql` -- QUAL-03 tests
- [ ] `04-admin-crud.test.sql` -- admin role tests
- [ ] `05-party-admin.test.sql` -- party admin tests
- [ ] `06-storage-rls.test.sql` -- storage policies
- [ ] `07-rpc-security.test.sql` -- RPC function security
- [ ] `08-triggers.test.sql` -- trigger tests
- [ ] `09-column-restrictions.test.sql` -- column-level protection tests
- [ ] Verify pgTAP extension availability -- confirm `supabase test db` works with minimal test

## Sources

### Primary (HIGH confidence)
- supabase-test-helpers v0.0.6 source code (GitHub API) -- complete implementation of `authenticate_as()`, `create_supabase_user()`, `clear_authentication()` showing exact `set_config()` mechanism
- Project schema files (010-rls.sql, 012-auth-hooks.sql, 013-auth-rls.sql, 014-storage.sql, 015-external-id.sql, 016-bulk-operations.sql, 017-email-helpers.sql, 000-functions.sql, 006-answers-jsonb.sql) -- complete policy and function definitions

### Secondary (MEDIUM confidence)
- [Supabase pgTAP docs](https://supabase.com/docs/guides/database/extensions/pgtap) -- basic setup and assertion examples
- [Supabase advanced pgTAP testing docs](https://supabase.com/docs/guides/local-development/testing/pgtap-extended) -- helper installation and RLS testing patterns
- [Supabase database testing docs](https://supabase.com/docs/guides/database/testing) -- test file conventions and `supabase test db` usage
- [Basejump testing guide](https://usebasejump.com/blog/testing-on-supabase-with-pgtap) -- practical RLS testing patterns
- [RLS testing gist by mansueli](https://gist.github.com/mansueli/ede3563e5dec3e3d4beb88dcaaf66879) -- manual JWT claim setting via `set_config`

### Tertiary (LOW confidence)
- [pgTAP documentation](https://pgtap.org/documentation.html) -- assertion function reference (verified existence, not all edge cases)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- pgTAP is the only supported framework, verified via official docs and source code
- Architecture: HIGH -- test file structure locked by CONTEXT.md decisions, JWT mechanism verified from supabase-test-helpers source
- Pitfalls: HIGH -- derived from actual schema analysis and verified Supabase auth internals
- Code examples: MEDIUM -- patterns are sound but loop-based pgTAP assertions in DO blocks need runtime verification

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (pgTAP and Supabase testing infrastructure are stable)
