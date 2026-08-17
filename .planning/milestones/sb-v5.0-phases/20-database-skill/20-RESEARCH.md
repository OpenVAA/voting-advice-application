# Phase 20 Research: Database Skill

**Researched:** 2026-03-15
**Phase goal:** Claude automatically loads deep Supabase/database expertise when developers work on the backend

## Source Material

All research comes from direct reading of the implemented codebase:
- `apps/supabase/supabase/schema/` (18 SQL files, ~2,900 lines total in migration)
- `apps/supabase/supabase/tests/database/` (10 test files, ~2,870 lines)
- `apps/supabase/supabase/functions/` (3 Edge Functions, ~900 lines TypeScript)
- `apps/supabase/supabase/config.toml` (393 lines)
- `apps/supabase/supabase/seed.sql` (123 lines)
- `packages/supabase-types/src/` (3 files: database.ts, column-map.ts, index.ts)
- `.claude/skills/database/SKILL.md` (existing stub from Phase 16)
- `.claude/skills/BOUNDARIES.md` (ownership map)
- `.planning/research/ARCHITECTURE.md` (skill patterns)
- `.planning/PROJECT.md` (key decisions)

## Schema Overview

### 17 Tables (organized by domain)

**Multi-tenancy (2):**
- `accounts` -- top-level organizational unit
- `projects` -- tenant scope; all content tables reference via `project_id` FK with ON DELETE CASCADE

**Elections domain (4):**
- `elections` -- with localized name/shortName/info as JSONB, election_date, multiple_rounds
- `constituency_groups` -- groups of constituencies
- `constituencies` -- with optional parent_id (nested districts)
- Join tables: `constituency_group_constituencies`, `election_constituency_groups` (composite PKs)

**Entity domain (4):**
- `candidates` -- has `first_name`, `last_name`, `organization_id` FK, `auth_user_id` FK, `answers` JSONB
- `organizations` -- has `auth_user_id` FK, `answers` JSONB
- `factions` -- simple entity
- `alliances` -- simple entity

**Questions domain (2):**
- `question_categories` -- with `category_type` enum (info, opinion, default), election/constituency scoping
- `questions` -- with `type` enum (9 types), `category_id` FK, `choices` JSONB, `settings` JSONB

**Nominations (1):**
- `nominations` -- uses separate FK columns (candidate_id, organization_id, faction_id, alliance_id) with CHECK exactly-one constraint. Generated `entity_type` column. `parent_nomination_id` for hierarchy. Validated by trigger.

**Auth (1):**
- `user_roles` -- links auth.users to roles via (user_id, role, scope_type, scope_id). Unique constraint. RLS prevents direct user access (only supabase_auth_admin and service_role).

**Settings (1):**
- `app_settings` -- one row per project (UNIQUE on project_id), stores arbitrary JSONB settings

**Infrastructure (1):**
- `storage_config` -- stores supabase_url and service_role_key for pg_net storage cleanup triggers

### Common Column Patterns

Every content table (elections, candidates, etc.) shares a common set of columns:
- `id` (uuid PK, gen_random_uuid())
- `project_id` (uuid NOT NULL, FK to projects)
- `name` (jsonb) -- localized: `{"en": "Name", "fi": "Nimi"}`
- `short_name` (jsonb) -- localized
- `info` (jsonb) -- localized
- `color` (jsonb)
- `image` (jsonb) -- StoredImage structure: `{path, pathDark?, alt?, width?, height?, focalPoint?}`
- `sort_order` (integer)
- `subtype` (text)
- `custom_data` (jsonb)
- `is_generated` (boolean DEFAULT false)
- `created_at`, `updated_at` (timestamptz, auto-managed by triggers)
- `published` (boolean NOT NULL DEFAULT false) -- added in 011-auth-tables.sql
- `external_id` (text, nullable) -- added in 015-external-id.sql, composite unique with project_id

### 3 Enums

- `question_type`: text, number, boolean, image, date, multipleText, singleChoiceOrdinal, singleChoiceCategorical, multipleChoiceCategorical
- `entity_type`: candidate, organization, faction, alliance
- `category_type`: info, opinion, default
- `user_role_type`: candidate, party, project_admin, account_admin, super_admin

## JSONB Patterns

### Localization

All user-facing text columns (name, short_name, info) store JSONB locale maps:
```json
{"en": "Election 2024", "fi": "Vaalit 2024", "sv": "Val 2024"}
```

`get_localized(val, locale, default_locale)` provides 3-tier fallback:
1. `val->>locale` (requested locale)
2. `val->>default_locale` (project default from projects.default_locale)
3. First available key (any content better than NULL)
4. NULL (if val is NULL or empty)

Marked IMMUTABLE for query planner optimization.

Two localized views (`elections_localized`, `questions_localized`) resolve JSONB to plain text via `set_config('app.locale', 'fi', TRUE)` session variable.

### Answer Storage

Answers stored as JSONB column on `candidates` and `organizations`:
```json
{"question-uuid-1": {"value": 3, "info": "Optional explanation"}, "question-uuid-2": {"value": true}}
```

Key features:
- Smart validation trigger (`validate_answers_jsonb`) -- only validates changed keys on UPDATE
- Question delete cascade removes orphaned answer keys via JSONB `-` operator
- Question type change protection prevents type changes that would invalidate existing answers
- `validate_answer_value()` validates against question type including StoredImage structure

### StoredImage Structure

```json
{"path": "project-id/candidates/cand-id/photo.jpg", "pathDark": "...", "alt": "...", "width": 800, "height": 600, "focalPoint": {"x": 0.5, "y": 0.3}}
```

Required: `path`. Optional: `pathDark`, `alt`, `width`, `height`, `focalPoint` (with `x` and `y`).

## RLS and Auth Patterns

### 5 Role Types

1. **super_admin** -- global access to everything, scope_type='global', scope_id=NULL
2. **account_admin** -- manages all projects under their account, scope_type='account', scope_id=account UUID
3. **project_admin** -- manages a specific project, scope_type='project', scope_id=project UUID
4. **party** -- manages their organization record, scope_type='party', scope_id=organization UUID
5. **candidate** -- manages their own candidate record, scope_type='candidate', scope_id=candidate UUID

### JWT Claims and Custom Access Token Hook

`custom_access_token_hook(event jsonb)` is called by Supabase Auth on every token refresh/issue. It reads `user_roles` table and injects roles into JWT claims as:
```json
{"user_roles": [{"role": "project_admin", "scope_type": "project", "scope_id": "uuid"}]}
```

Configured in config.toml:
```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"
```

Critical: `user_roles` table has special RLS -- only `supabase_auth_admin` and `service_role` can read it. Regular `authenticated` and `anon` roles are REVOKEd. This prevents circular RLS (the hook reads roles to build JWT, but JWT is used in RLS policies).

### Helper Functions

- `has_role(check_role, check_scope_type?, check_scope_id?)` -- checks JWT claims for a role. SECURITY DEFINER with empty search_path. Used in all RLS policies.
- `can_access_project(project_id)` -- returns true for super_admin, project_admin (scoped to project), or account_admin (scoped to project's account). SECURITY DEFINER.
- `is_candidate_self(auth_user_id)` -- simple `auth_user_id = auth.uid()` check.

### Policy Patterns

97 CREATE POLICY statements total (80 content + 2 auth + 15 storage):

**Standard content table pattern (5 policies per table with published column):**
1. `anon_select_*` -- USING (published = true) TO anon
2. `authenticated_select_*` -- USING (can_access_project(project_id) OR published = true) TO authenticated
3. `admin_insert_*` -- WITH CHECK (can_access_project(project_id)) TO authenticated
4. `admin_update_*` -- USING + WITH CHECK (can_access_project(project_id)) TO authenticated
5. `admin_delete_*` -- USING (can_access_project(project_id)) TO authenticated

**Special table patterns:**
- `accounts` -- no project_id; uses has_role('account_admin', 'account', id) or has_role('super_admin')
- `projects` -- uses can_access_project(id) OR has_role('account_admin', 'account', account_id)
- `candidates` -- adds candidate_update_own policy: USING (auth_user_id = auth.uid())
- `organizations` -- adds party_update_own policy: USING (auth_user_id = auth.uid() OR has_role('party', 'party', id))
- `app_settings` -- anon SELECT USING (true) (voter app needs settings)
- Join tables -- SELECT USING (true), INSERT/DELETE via parent table access check

**Policy rules:**
- Always use `(SELECT auth.uid())` and `(SELECT auth.jwt())` for optimizer caching (scalar subquery evaluated once)
- Always specify `TO anon` or `TO authenticated`
- SELECT: USING only; INSERT: WITH CHECK only; UPDATE: USING + WITH CHECK; DELETE: USING only

### Column-Level Restrictions

REVOKE table-level UPDATE from authenticated, then GRANT UPDATE only on allowed columns:
- **candidates**: allowed: name, short_name, info, color, image, sort_order, subtype, custom_data, first_name, last_name, answers, created_at, updated_at. Protected: project_id, auth_user_id, organization_id, published, id, is_generated.
- **organizations**: same pattern, protected: project_id, auth_user_id, published, id, is_generated.

Admin operations that need protected columns use service_role (Edge Functions), which bypasses column-level grants.

## Service Patterns

### Edge Functions (3)

**invite-candidate:**
- POST with {firstName, lastName, email, projectId, organizationId?}
- Verifies caller is admin via JWT claims (project_admin, account_admin, or super_admin)
- Uses service_role client to: (1) create candidate record, (2) invite user via auth.admin.inviteUserByEmail, (3) create candidate role in user_roles, (4) link auth_user_id to candidate
- Rollback: deletes candidate if invite email fails
- Returns {candidateId, userId}

**signicat-callback:**
- POST with {id_token, project_id?}
- Handles JWE-encrypted or plain JWT id_tokens from Signicat OIDC bank auth
- Decrypts JWE using SIGNICAT_DECRYPTION_JWKS private keys
- Verifies JWT signature against SIGNICAT_JWKS_URI public JWKS
- Extracts identity: given_name, family_name, birthdate
- Finds existing user by birthdate_id in app_metadata, or creates new one
- Creates candidate record and role assignment for new users
- Returns magic link session for immediate login

**send-email:**
- POST with {templates: Record<locale, {subject, body}>, recipient_user_ids, from?, dry_run?}
- Verifies caller is admin via JWT claims
- Calls resolve_email_variables() RPC for per-recipient variable resolution
- Renders templates with {{variable.path}} substitution
- dry_run mode returns rendered content without sending
- Sends via SMTP (nodemailer) with configurable transport

### Bulk Import/Delete RPCs

**bulk_import(data jsonb):**
- Input: collection-keyed JSON with external_id-based upserts
- Processing order follows dependency chain: elections -> constituency_groups -> constituencies -> organizations -> alliances -> factions -> candidates -> question_categories -> questions -> nominations -> app_settings
- Uses `_bulk_upsert_record()` helper with INSERT ON CONFLICT (project_id, external_id) DO UPDATE
- Relationship fields (e.g., "organization": {"external_id": "party-sdp"}) resolved via resolve_external_ref()
- SECURITY INVOKER -- admin RLS policies enforced
- Returns {collection: {created: N, updated: M}} per collection

**bulk_delete(data jsonb):**
- Input: {project_id, collections: {table: {prefix | ids | external_ids}}}
- Deletion modes: prefix-based (LIKE prefix%), UUID list, external_id list
- Processes in reverse dependency order to avoid FK violations
- SECURITY INVOKER -- admin RLS enforced
- Returns {collection: {deleted: N}} per collection

### External ID System

- Nullable `external_id` column on all 11 content tables
- Composite unique index: `(project_id, external_id) WHERE external_id IS NOT NULL`
- Immutability trigger: once set, external_id cannot be changed (NULL -> value allowed; value -> different value blocked)
- Used by bulk_import for idempotent upsert matching

### Email Variable Resolution

`resolve_email_variables(user_ids, template_body, template_subject)`:
- SECURITY DEFINER (reads auth.users)
- For each user: looks up role (candidate or party) via user_roles table
- Resolves candidate fields: first_name, last_name, organization.name
- Resolves nomination context: nomination.constituency.name, nomination.election.name
- Returns: user_id, email, preferred_locale, variables (flat JSONB)

### Storage

Two buckets configured in config.toml:
- `public-assets` -- public=true, 500MiB limit. Entity images, project-level public files.
- `private-assets` -- public=false, 500MiB limit. Private files.

Path convention: `{project_id}/{entity_type}/{entity_id}/filename.ext`

15 storage RLS policies on storage.objects covering:
- Anon: read published entity files only (via is_storage_entity_published helper)
- Authenticated: read published + own entity + admin project files
- Candidates: upload/update/delete their own entity folder
- Admins: upload/update/delete any file in their project

Storage cleanup triggers:
- `cleanup_entity_storage_files()` -- AFTER DELETE on entity tables, deletes all files under path prefix in both buckets
- `cleanup_old_image_file()` -- BEFORE UPDATE on image column, deletes old file(s) from storage
- Both use `delete_storage_object()` which calls Storage API via pg_net async HTTP
- pg_net requests fire only after transaction commits

## pgTAP Testing Patterns

### Test Infrastructure

- pgTAP extension loaded in `00-helpers.test.sql`
- 10 test files, alphabetically ordered execution
- Total: 204 tests across 2,870 lines

### Test Architecture

**Phase 1 (persistent helpers):** `00-helpers.test.sql` creates functions OUTSIDE transaction (COMMITted). These persist for subsequent test files. `supabase db reset` between test runs removes them.

**Phase 2+ (test transactions):** Each test file runs in BEGIN/ROLLBACK. Calls `create_test_data()` for fresh fixtures, runs tests, ROLLBACKs. Clean isolation.

### Helper Functions

- `test_user_id(name)` -- predictable UUID mapping for 8 test users (admin_a, admin_b, candidate_a, candidate_b, candidate_a2, party_a, super_admin, account_admin_a)
- `test_id(entity_name)` -- predictable UUID mapping for ~25 test entities
- `test_user_roles(name)` -- returns JWT user_roles claim array for a named user
- `set_test_user(role, user_id?, user_roles?)` -- simulates authenticated/anon user by setting role, request.jwt.claims, request.jwt.claim.sub via set_config()
- `reset_role()` -- switches back to postgres superuser for fixture operations
- `create_test_data()` -- creates complete multi-tenant dataset: 2 accounts, 2 projects, 8 auth.users, full entity hierarchy. Project A: published=true, Project B: published=false.

### Test File Organization

| File | Focus | Tests |
|------|-------|-------|
| 00-helpers.test.sql | Helper functions, fixture smoke tests | ~8 |
| 01-tenant-isolation.test.sql | Cross-project data isolation | 26 |
| 02-candidate-self-edit.test.sql | Candidate own-record access | 15 |
| 03-anon-read.test.sql | Anonymous user read access | ~30 |
| 04-admin-crud.test.sql | Admin CRUD operations | ~25 |
| 05-party-admin.test.sql | Party admin permissions | ~15 |
| 06-storage-rls.test.sql | Storage bucket RLS | ~20 |
| 07-rpc-security.test.sql | Bulk import/delete RPC security | ~15 |
| 08-triggers.test.sql | Validation triggers, cascades | ~25 |
| 09-column-restrictions.test.sql | Column-level update restrictions | ~25 |

### Test Patterns

**User impersonation pattern:**
```sql
SELECT set_test_user('authenticated', test_user_id('admin_a'), test_user_roles('admin_a'));
-- ... run assertions ...
SELECT reset_role();
```

**Positive assertion:**
```sql
SELECT ok((SELECT count(*) FROM elections WHERE project_id = test_id('project_a'))::integer >= 1, 'admin can see own elections');
```

**Negative assertion (silent no-op):**
```sql
SELECT lives_ok(format($$UPDATE elections SET name = '...' WHERE id = '%s'$$, test_id('election_a')), 'update does not raise error');
SELECT reset_role();
SELECT is((SELECT name->>'en' FROM elections WHERE id = test_id('election_a')), 'Election A', 'update had no effect');
```

**Error assertion:**
```sql
SELECT throws_ok(format($$INSERT INTO elections (id, project_id, name) VALUES (gen_random_uuid(), '%s', '...')$$, test_id('project_a')), '42501', NULL, 'cannot INSERT');
```

**Transaction boundary pattern:**
```sql
BEGIN;
SET search_path = public, extensions;
DROP TABLE IF EXISTS __tcache__; -- Reset pgTAP state from previous files
SELECT plan(N);
SELECT create_test_data();
-- ... tests ...
SELECT * FROM finish();
ROLLBACK;
```

## COLUMN_MAP / PROPERTY_MAP Type Bridge

`packages/supabase-types/` provides:
- `database.ts` -- generated Database type with Row/Insert/Update types per table
- `column-map.ts` -- bidirectional mapping between snake_case DB columns and camelCase TypeScript properties
- Only maps columns where names differ (e.g., sort_order -> order, first_name -> firstName)
- `PROPERTY_MAP` is the auto-generated reverse of `COLUMN_MAP`
- Used by data adapters to convert between DB and TypeScript conventions

## Triggers Summary

| Trigger | Table(s) | Event | Function |
|---------|----------|-------|----------|
| set_updated_at | all content tables | BEFORE UPDATE | update_updated_at() |
| validate_nomination | nominations | BEFORE INSERT/UPDATE | validate_nomination() |
| validate_answers | candidates, organizations | BEFORE INSERT/UPDATE | validate_answers_jsonb() |
| cascade_question_delete | questions | AFTER DELETE | cascade_question_delete_to_jsonb_answers() |
| validate_question_type_change | questions | BEFORE UPDATE | validate_question_type_change() |
| enforce_external_id_immutability | all 11 content tables | BEFORE UPDATE | enforce_external_id_immutability() |
| cleanup_storage_on_delete | 10 entity tables | AFTER DELETE | cleanup_entity_storage_files() |
| cleanup_image_on_update | 10 entity tables | BEFORE UPDATE | cleanup_old_image_file() |

## Indexes Summary

- B-tree on project_id for every content table (11 indexes)
- B-tree on FK columns: account_id, organization_id, category_id, parent_id, all nomination FKs
- B-tree on auth_user_id for candidates and organizations
- Partial indexes on published WHERE published = true (5 tables)
- Composite unique partial indexes on (project_id, external_id) WHERE external_id IS NOT NULL (11 tables)
- Index on user_roles.user_id

## Skill Content Requirements (from REQUIREMENTS.md)

| Requirement | What to Document | Target File |
|------------|-----------------|-------------|
| DB-01 | SKILL.md with auto-trigger description | .claude/skills/database/SKILL.md |
| DB-02 | Schema conventions (tables, JSONB, enums, localization) | .claude/skills/database/SKILL.md |
| DB-03 | RLS and auth patterns (policies, roles, JWT, hooks) | .claude/skills/database/SKILL.md |
| DB-04 | Service patterns (bulk RPCs, Edge Functions, storage) | .claude/skills/database/SKILL.md |
| DB-05 | pgTAP testing conventions (helpers, patterns, structure) | .claude/skills/database/SKILL.md |
| DB-06 | Reference files for schema diagram and RLS policy map | Reference files in .claude/skills/database/ |

## Skill Structure Recommendation

Following ARCHITECTURE.md patterns (SKILL.md under 500 lines with supporting reference files):

### SKILL.md (~300 lines)
Core knowledge that Claude needs when working in `apps/supabase/`:
- Schema conventions (common columns, JSONB patterns, enums, localization)
- RLS and auth patterns (role hierarchy, helper functions, policy patterns)
- Service patterns (Edge Functions, bulk RPCs, email, storage)
- pgTAP testing conventions (helpers, file structure, patterns)
- Review checklist for database changes
- Key source locations

### schema-reference.md (~200 lines)
- Complete table listing with columns and relationships
- Trigger map
- Index summary
- COLUMN_MAP/PROPERTY_MAP bridge explanation

### rls-policy-map.md (~200 lines)
- Complete policy listing organized by table
- Policy naming convention
- Role-to-policy mapping showing what each role can do on each table
- Storage policy summary

This matches the architecture pattern: SKILL.md has core knowledge, supporting files have detailed references. All files directly referenced from SKILL.md (one level deep).

---

*Research completed: 2026-03-15*
