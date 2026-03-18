---
name: database
description: "Domain expert for the OpenVAA Supabase backend: 17-table PostgreSQL schema with JSONB localization, 97 RLS policies across 5 role types (candidate through super_admin), JWT claims via Access Token Hook, 3 Edge Functions, bulk import/delete RPCs with external_id-based idempotent upsert, 204 pgTAP tests, and storage bucket configuration. Activate when working in apps/supabase/ or packages/supabase-types/, writing migrations, RLS policies, database functions, pgTAP tests, or understanding the Supabase auth and service layer."
targets:
  - apps/supabase/
  - packages/supabase-types/
---

# OpenVAA Database Expert

## Backend Overview

Supabase backend with a 17-table PostgreSQL schema, multi-tenant via accounts and projects.
All content tables reference `projects` via `project_id` FK with `ON DELETE CASCADE`.

- JSONB localization for all user-facing text (name, short_name, info) using locale-keyed objects
- GoTrue authentication with 5 role types and JWT custom claims via Access Token Hook
- 97 RLS policies (80 content + 2 auth + 15 storage) enforcing tenant isolation
- 3 Edge Functions: `invite-candidate`, `signicat-callback`, `send-email`
- Bulk import/delete RPCs with external_id-based idempotent upsert
- 204 pgTAP tests across 10 test files (~2,870 lines)
- Schema files: `apps/supabase/supabase/schema/` (18 SQL files, `000-functions.sql` through `017-email-helpers.sql`)

## Schema Conventions

1. **Common column pattern**: Every content table (elections, candidates, etc.) shares these
   columns:
   - `id` (uuid PK, `gen_random_uuid()`)
   - `project_id` (uuid FK to projects, NOT NULL, ON DELETE CASCADE)
   - `name`, `short_name`, `info` (jsonb -- localized)
   - `color`, `image` (jsonb)
   - `sort_order` (integer)
   - `subtype` (text)
   - `custom_data` (jsonb)
   - `is_generated` (boolean DEFAULT false)
   - `created_at`, `updated_at` (timestamptz, auto-managed by `set_updated_at` trigger)
   - `published` (boolean NOT NULL DEFAULT false)
   - `external_id` (text, nullable, composite unique with project_id)

2. **JSONB localization storage**: Store all user-facing text as locale-keyed JSONB:
   `{"en": "Election 2024", "fi": "Vaalit 2024"}`. Never use bare strings for localizable
   content.
   - `get_localized(val, locale, default_locale)` provides 3-tier fallback: requested locale
     -> project default locale -> first available key -> NULL. Marked IMMUTABLE for query
     planner optimization. Source: `apps/supabase/supabase/schema/000-functions.sql`.
   - `get_localized()` is used only in email helpers (`resolve_email_variables` in
     `017-email-helpers.sql`), NOT for API responses -- client-side locale selection per v2.0
     decision.
   - Cross-reference: the data skill owns the TypeScript `LocalizedValue` type.

3. **Answer storage as JSONB**: Candidates and organizations store answers in a JSONB column:
   `{"question-uuid": {"value": 3, "info": "Optional explanation"}}`.
   - Smart validation trigger (`validate_answers_jsonb`) only validates changed keys on UPDATE,
     short-circuits when the answers column is unchanged.
   - Question delete cascade removes orphaned answer keys via the JSONB `-` operator
     (`cascade_question_delete_to_jsonb_answers`).
   - Question type change protection prevents type/choices changes that would invalidate
     existing answers (`validate_question_type_change`).
   - Source: `apps/supabase/supabase/schema/006-answers-jsonb.sql`.

4. **StoredImage structure**: Image columns store:
   `{"path": "project-id/entity/id/file.jpg", "pathDark": "...", "alt": "...", "width": 800, "height": 600, "focalPoint": {"x": 0.5, "y": 0.3}}`.
   Required: `path`. Optional: `pathDark`, `alt`, `width`, `height`, `focalPoint` (with `x`
   and `y`).

5. **4 enums**: Define all type-safe enumerations in `000-functions.sql`:
   - `question_type` (9 values): text, number, boolean, image, date, multipleText,
     singleChoiceOrdinal, singleChoiceCategorical, multipleChoiceCategorical
   - `entity_type` (4 values): candidate, organization, faction, alliance
   - `category_type` (3 values): info, opinion, default
   - `user_role_type` (5 values, in `011-auth-tables.sql`): candidate, party, project_admin,
     account_admin, super_admin
   - TODO: add test or type assertion ensuring DB enums stay in sync with data package
     TypeScript equivalents (ENTITY_TYPE, QUESTION_TYPE, QUESTION_CATEGORY_TYPE).

6. **External ID system**: Nullable `external_id` column on all 11 content tables.
   - Composite unique partial index: `(project_id, external_id) WHERE external_id IS NOT NULL`.
   - Immutability trigger: once set, cannot change (NULL -> value allowed; value -> different
     value blocked; value -> NULL blocked).
   - Used by `bulk_import` for idempotent upsert matching.
   - Source: `apps/supabase/supabase/schema/015-external-id.sql`.

7. **Nominations CHECK constraint**: The nominations table uses separate FK columns
   (candidate_id, organization_id, faction_id, alliance_id) with a CHECK constraint enforcing
   exactly one is NOT NULL. A generated `entity_type` column derives from whichever FK is set.
   `parent_nomination_id` enables hierarchy. The `validate_nomination()` trigger enforces
   parent-child type rules and election/constituency consistency. Source: `000-functions.sql`
   and `005-nominations.sql`.

8. **Trigger conventions**: Follow these naming patterns:
   - `set_updated_at` on all content tables (BEFORE UPDATE)
   - `validate_answers_jsonb` on candidates and organizations (BEFORE INSERT OR UPDATE)
   - `enforce_external_id_immutability` on all 11 content tables (BEFORE UPDATE)
   - `validate_nomination` on nominations (BEFORE INSERT OR UPDATE)
   - `validate_question_type_change` on questions (BEFORE UPDATE)
   - Storage cleanup triggers (AFTER DELETE and BEFORE UPDATE on image column) use
     `delete_storage_object()` via pg_net async HTTP. Requests fire only after transaction
     commits.
   - Source: individual schema files; cleanup triggers in `014-storage.sql`.

9. **Indexing strategy**: Add these indexes for every new content table:
   - B-tree on `project_id` (tenant isolation queries)
   - B-tree on any FK columns (account_id, organization_id, category_id, parent_id)
   - B-tree on `auth_user_id` if the table has one (candidates, organizations)
   - Partial index on `published WHERE published = true` for efficient anon RLS
   - Composite unique partial index on `(project_id, external_id) WHERE external_id IS NOT NULL`

## RLS and Auth Patterns

1. **5 role types** with scoping:
   - `super_admin`: global access, scope_type='global', scope_id=NULL
   - `account_admin`: scope_type='account', scope_id=account UUID
   - `project_admin`: scope_type='project', scope_id=project UUID
   - `party`: scope_type='party', scope_id=organization UUID
   - `candidate`: scope_type='candidate', scope_id=candidate UUID
   - Roles stored in `user_roles` table. Source: `apps/supabase/supabase/schema/011-auth-tables.sql`.

2. **JWT claims via Access Token Hook**: `custom_access_token_hook(event jsonb)` in
   `012-auth-hooks.sql` runs on every token refresh/issue. Reads the `user_roles` table and
   injects `{"user_roles": [{"role": "...", "scope_type": "...", "scope_id": "..."}]}` into JWT
   claims. Configured in `config.toml` under `[auth.hook.custom_access_token]`.

3. **user_roles table isolation**: `user_roles` has special RLS -- only `supabase_auth_admin` and
   `service_role` can read it. Regular `authenticated` and `anon` are REVOKEd via
   `REVOKE ALL ON TABLE public.user_roles FROM authenticated, anon, public`. This prevents
   circular RLS: the hook reads roles to build JWT, but JWT is used in RLS policies. Source:
   `011-auth-tables.sql`.

4. **3 helper functions** (all SECURITY DEFINER with `search_path = ''`):
   - `has_role(check_role, check_scope_type?, check_scope_id?)`: checks JWT claims for a role.
     Super_admin matches without scope check.
   - `can_access_project(project_id)`: returns true for super_admin, project_admin (scoped to
     project), or account_admin (scoped to the project's account via projects.account_id
     lookup).
   - `is_candidate_self(auth_user_id)`: checks `auth_user_id = auth.uid()`.
   - Source: `apps/supabase/supabase/schema/012-auth-hooks.sql`.

5. **Standard 5-policy pattern** for content tables with a published column:
   - `anon_select_{table}` -- USING (published = true) TO anon
   - `authenticated_select_{table}` -- USING (can_access_project(project_id) OR published = true) TO authenticated
   - `admin_insert_{table}` -- WITH CHECK (can_access_project(project_id)) TO authenticated
   - `admin_update_{table}` -- USING + WITH CHECK (can_access_project(project_id)) TO authenticated
   - `admin_delete_{table}` -- USING (can_access_project(project_id)) TO authenticated
   - Source: `apps/supabase/supabase/schema/010-rls.sql`.

6. **Special table policies**: Not every table follows the standard 5-policy pattern:
   - `accounts`: uses `has_role('account_admin', 'account', id)` or `has_role('super_admin')` --
     no project_id column.
   - `projects`: uses `can_access_project(id)` for the project's own row.
   - `candidates`: adds `candidate_update_own` policy: USING (auth_user_id = auth.uid()).
   - `organizations`: adds `party_update_own_organizations` policy: USING (auth_user_id =
     auth.uid() OR has_role('party', 'party', id)).
   - `app_settings`: anon SELECT USING (true) -- voter app needs settings without auth.
   - Join tables (constituency_group_constituencies, election_constituency_groups): SELECT
     USING (true), INSERT/DELETE via parent table access check using EXISTS subquery.

7. **Scalar subquery optimization**: ALWAYS use `(SELECT auth.uid())` and `(SELECT auth.jwt())`
   in RLS policies -- wrapping in a subselect makes the planner evaluate them once per query
   instead of once per row. ALWAYS specify `TO anon` or `TO authenticated` on every policy --
   never omit the role target.

8. **Column-level restrictions**: REVOKE table-level UPDATE from authenticated, then GRANT
   UPDATE only on allowed columns. Applies to:
   - `candidates`: protected columns are project_id, auth_user_id, organization_id, published,
     id, is_generated.
   - `organizations`: protected columns are project_id, auth_user_id, published, id,
     is_generated.
   - Admin operations needing protected columns use `service_role` via Edge Functions, which
     bypasses column-level grants.
   - Source: `apps/supabase/supabase/schema/013-auth-rls.sql`.

## Service Patterns

1. **Edge Function pattern**: 3 Edge Functions in `apps/supabase/supabase/functions/`. Each
   verifies the caller is admin via JWT claims. Each uses `createClient()` with `service_role`
   for privileged operations (creating records, inviting users, reading auth.users).
   - `invite-candidate`: creates candidate + auth user + role assignment with rollback on
     failure.
   - `signicat-callback`: handles JWE/JWT from bank auth, creates user + candidate + magic link
     session.
   - `send-email`: resolves per-recipient email variables and sends via SMTP (nodemailer).

2. **Bulk import RPC**: `bulk_import(data jsonb)` processes collections in dependency order:
   elections -> constituency_groups -> constituencies -> organizations -> alliances -> factions
   -> candidates -> question_categories -> questions -> nominations -> app_settings. Uses
   `_bulk_upsert_record()` helper with `INSERT ON CONFLICT (project_id, external_id) DO UPDATE`.
   Relationship fields resolved via `resolve_external_ref()`. SECURITY INVOKER -- admin RLS
   policies enforced. Source: `apps/supabase/supabase/schema/016-bulk-operations.sql`.

3. **Bulk delete RPC**: `bulk_delete(data jsonb)` processes in reverse dependency order to avoid
   FK violations. Deletion modes: prefix-based (LIKE prefix%), UUID list, external_id list.
   SECURITY INVOKER. Source: `016-bulk-operations.sql`.

4. **Storage buckets**: `public-assets` (public=true, 500MiB) and `private-assets` (public=false,
   500MiB).
   - Path convention: `{project_id}/{entity_type}/{entity_id}/filename.ext`.
   - 15 storage RLS policies cover anon read (published only), authenticated read
     (published + own + admin), candidate upload/update/delete (own folder), admin
     upload/update/delete (project-wide).
   - Storage cleanup triggers delete files on entity DELETE and old files on image UPDATE, using
     `delete_storage_object()` via pg_net async HTTP.
   - Source: `apps/supabase/supabase/schema/014-storage.sql`.

5. **Email variable resolution**: `resolve_email_variables(user_ids, template_body,
   template_subject)` is SECURITY DEFINER (reads auth.users). For each user: looks up role via
   user_roles, resolves candidate fields (first_name, last_name, organization.name), nomination
   context (constituency.name, election.name). Returns user_id, email, preferred_locale,
   variables as flat JSONB. Source: `apps/supabase/supabase/schema/017-email-helpers.sql`.

## pgTAP Testing Conventions

1. **Test infrastructure**: pgTAP extension loaded in `00-helpers.test.sql`. 10 test files in
   `apps/supabase/supabase/tests/database/`, alphabetically ordered execution. Total: 204 tests
   across ~2,870 lines. Run with `supabase db reset` to reload helpers, then `supabase test db`.

2. **Two-phase architecture**: Phase 1 (persistent helpers): `00-helpers.test.sql` creates
   functions OUTSIDE a transaction (COMMITted). These persist for subsequent test files.
   Phase 2+ (test transactions): each file runs in BEGIN/ROLLBACK. Calls `create_test_data()`
   for fresh fixtures, runs tests, ROLLBACKs for clean isolation.

3. **4 core helper functions**:
   - `test_user_id(name)`: returns predictable UUID for 8 test users (admin_a, admin_b,
     candidate_a, candidate_b, candidate_a2, party_a, super_admin, account_admin_a).
   - `test_id(entity_name)`: returns predictable UUID for ~25 test entities.
   - `test_user_roles(name)`: returns JWT user_roles claim array for a named user.
   - `set_test_user(role, user_id?, user_roles?)`: simulates authenticated/anon user by setting
     role, request.jwt.claims, request.jwt.claim.sub via `set_config()`.

4. **User impersonation pattern**: Always call `set_test_user('authenticated',
   test_user_id('admin_a'), test_user_roles('admin_a'))` before assertions, and `reset_role()`
   after to switch back to postgres superuser for fixture operations.

5. **3 assertion patterns**:
   - Positive: `ok((SELECT count(*) ...)::integer >= 1, 'description')`.
   - Negative (silent no-op RLS): `lives_ok($$UPDATE ...$$, 'no error')` followed by
     `reset_role()` then `is((SELECT actual), expected, 'no effect')`.
   - Error: `throws_ok($$INSERT ...$$, '42501', NULL, 'cannot INSERT')`.

6. **Transaction boundary**: Every test file starts with
   `BEGIN; SET search_path = public, extensions; DROP TABLE IF EXISTS __tcache__;
   SELECT plan(N); SELECT create_test_data();` and ends with
   `SELECT * FROM finish(); ROLLBACK;`. The `__tcache__` drop resets pgTAP state from previous
   files.

7. **Test data fixture**: `create_test_data()` creates a complete multi-tenant dataset: 2
   accounts, 2 projects, 8 auth.users, full entity hierarchy. Project A has published=true
   entities, Project B has published=false. This enables testing both published/unpublished and
   cross-tenant isolation.

## Reviewing Database Changes

1. Every new content table has all common columns (id, project_id, name, published, external_id,
   etc.) with correct types and defaults
2. New JSONB text columns follow locale-keyed format `{"en": "...", "fi": "..."}` -- never bare
   strings
3. RLS enabled on new tables with at least the standard 5-policy pattern (anon_select,
   authenticated_select, admin_insert, admin_update, admin_delete)
4. RLS policies use `(SELECT auth.uid())` and `(SELECT auth.jwt())` scalar subqueries -- never
   bare `auth.uid()` or `auth.jwt()`
5. RLS policies specify `TO anon` or `TO authenticated` -- never omit the role
6. New SECURITY DEFINER functions use schema-qualified calls and set `search_path = ''`
7. New tables have B-tree indexes on project_id and any FK columns
8. Triggers follow naming convention: `set_updated_at`, `validate_{thing}`,
   `enforce_{constraint}`, `cleanup_{resource}`
9. New pgTAP tests follow the transaction boundary pattern (BEGIN/ROLLBACK) and use
   `create_test_data()` for fixtures
10. New test assertions use the correct pattern: `ok()` for positive, `lives_ok()`+`is()` for
    silent RLS denial, `throws_ok()` for expected errors
11. external_id system respected: composite unique partial index and immutability trigger added
    if new content table created
12. Bulk import/delete RPCs updated if new content table needs bulk operations (add to dependency
    order in `016-bulk-operations.sql`)

## Key Source Locations

- Schema files: `apps/supabase/supabase/schema/000-functions.sql` through `017-email-helpers.sql` (18 files)
- RLS policies: `apps/supabase/supabase/schema/010-rls.sql` (main), `013-auth-rls.sql` (column restrictions), `014-storage.sql` (storage policies)
- Auth hooks: `apps/supabase/supabase/schema/012-auth-hooks.sql`
- Edge Functions: `apps/supabase/supabase/functions/invite-candidate/`, `signicat-callback/`, `send-email/`
- Bulk RPCs: `apps/supabase/supabase/schema/016-bulk-operations.sql`
- pgTAP tests: `apps/supabase/supabase/tests/database/` (10 files, `00-helpers` through `09-column-restrictions`)
- Supabase config: `apps/supabase/supabase/config.toml`
- Generated types: `packages/supabase-types/src/database.ts`
- Column/property maps: `packages/supabase-types/src/column-map.ts` (COLUMN_MAP, PROPERTY_MAP)
- Seed data: `apps/supabase/supabase/seed.sql`

## Cross-Skill Interfaces

- JSONB localization storage `{"en": "...", "fi": "..."}` maps to TypeScript `LocalizedValue` -- the data skill owns the TypeScript type; this skill owns the SQL storage format and `get_localized()` function.
- DB enums (entity_type, question_type, category_type) must stay in sync with the data package's TypeScript equivalents (ENTITY_TYPE, QUESTION_TYPE, QUESTION_CATEGORY_TYPE).
- `packages/supabase-types/` provides the bridge: `database.ts` has generated Row/Insert/Update types per table; `column-map.ts` has bidirectional COLUMN_MAP (snake_case DB -> camelCase TS) and PROPERTY_MAP (reverse). Only maps columns where names differ (e.g., sort_order -> order, first_name -> firstName). Used by frontend data adapters.

## Reference Files

- For complete table column listings, triggers, indexes, and the COLUMN_MAP/PROPERTY_MAP bridge, read [schema-reference.md](schema-reference.md)
- For the role-capability matrix showing what each role can do on each table, read [rls-policy-map.md](rls-policy-map.md)
- For step-by-step guides to adding tables, RLS policies, and pgTAP tests, read [extension-patterns.md](extension-patterns.md)
