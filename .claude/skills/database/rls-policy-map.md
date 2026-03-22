# RLS Policy Map

Complete RLS policy listing for the OpenVAA Supabase backend. 97 total policies: 80 content, 2 auth, 15 storage. Source: `apps/supabase/supabase/schema/010-rls.sql`, `011-auth-tables.sql`, `013-auth-rls.sql`, `014-storage.sql`.

## Role Hierarchy

5 roles in ascending privilege order, defined in `user_role_type` enum:

1. **candidate** -- scope_type='candidate', scope_id=candidate UUID. Can view published data + edit own candidate record.
2. **party** -- scope_type='party', scope_id=organization UUID. Can view published data + edit own organization record.
3. **project_admin** -- scope_type='project', scope_id=project UUID. Full CRUD on all tables within their project.
4. **account_admin** -- scope_type='account', scope_id=account UUID. Full CRUD on all projects under their account.
5. **super_admin** -- scope_type='global', scope_id=NULL. Full CRUD on everything.

Admin access is checked via `can_access_project(project_id)` which returns true for project_admin (scoped), account_admin (via project's account), or super_admin (always).

## Role-Capability Matrix

| Table | anon | candidate | party | project_admin | account_admin | super_admin |
|---|---|---|---|---|---|---|
| accounts | - | - | - | - | R | RCUD |
| projects | - | - | - | RUD | RCUD | RCUD |
| elections | R* | R* | R* | RCUD | RCUD | RCUD |
| constituency_groups | R* | R* | R* | RCUD | RCUD | RCUD |
| constituencies | R* | R* | R* | RCUD | RCUD | RCUD |
| constituency_group_constituencies | R | R | R | RCD | RCD | RCD |
| election_constituency_groups | R | R | R | RCD | RCD | RCD |
| candidates | R* | R*U[1] | R*U[6] | RCUD | RCUD | RCUD |
| organizations | R* | R* | R*U[2] | RCUD | RCUD | RCUD |
| factions | R* | R* | R* | RCUD | RCUD | RCUD |
| alliances | R* | R* | R* | RCUD | RCUD | RCUD |
| question_categories | R* | R* | R* | RCUD | RCUD | RCUD |
| questions | R* | R* | R* | RCUD | RCUD | RCUD |
| nominations | R* | R* | R* | RCUD | RCUD | RCUD |
| app_settings | R[3] | R[3] | R[3] | RCUD | RCUD | RCUD |
| user_roles | - | - | - | - | - | -[5] |
| storage_config | - | - | - | - | - | -[5] |

R* = published records only. R = all records. RCUD = read/create/update/delete.

**Footnotes:**
- [1] **candidate_update_own**: candidates can update their own record via `auth_user_id = auth.uid()`, restricted to allowed columns only [6]
- [2] **party_update_own**: organizations can be updated by their linked user (`auth_user_id = auth.uid()`) or party role holder (`has_role('party', 'party', id)`), restricted to allowed columns only [6]
- [3] **app_settings**: anon/authenticated SELECT USING (true) -- voter app needs settings without auth
- [4] **join tables**: anon/authenticated SELECT USING (true), admin INSERT/DELETE checked via parent entity's project_id
- [5] **user_roles and storage_config**: only supabase_auth_admin and service_role can access. All other roles REVOKEd.
- [6] **column restrictions**: candidates and organizations have REVOKE/GRANT column-level UPDATE (see Column-Level Restrictions section)

## Policy Listing by Table

### Standard 5-Policy Pattern

8 tables follow the identical standard pattern from `010-rls.sql`:
**elections, constituency_groups, constituencies, factions, alliances, question_categories, questions, nominations**

Each table has exactly these 5 policies:
1. `anon_select_{table}` -- FOR SELECT TO anon USING (published = true)
2. `authenticated_select_{table}` -- FOR SELECT TO authenticated USING (can_access_project(project_id) OR published = true)
3. `admin_insert_{table}` -- FOR INSERT TO authenticated WITH CHECK (can_access_project(project_id))
4. `admin_update_{table}` -- FOR UPDATE TO authenticated USING/WITH CHECK (can_access_project(project_id))
5. `admin_delete_{table}` -- FOR DELETE TO authenticated USING (can_access_project(project_id))

### Special Tables

**accounts** (4 policies, no project_id, no published):
- `authenticated_select_accounts` -- USING (has_role('account_admin', 'account', id) OR has_role('super_admin'))
- `admin_insert_accounts` -- WITH CHECK (has_role('super_admin'))
- `admin_update_accounts` -- USING/WITH CHECK (has_role('super_admin'))
- `admin_delete_accounts` -- USING (has_role('super_admin'))

**projects** (4 policies, uses account_id):
- `authenticated_select_projects` -- USING (can_access_project(id) OR has_role('account_admin', 'account', account_id) OR has_role('super_admin'))
- `admin_insert_projects` -- WITH CHECK (has_role('account_admin', 'account', account_id) OR has_role('super_admin'))
- `admin_update_projects` -- USING/WITH CHECK (can_access_project(id))
- `admin_delete_projects` -- USING (can_access_project(id))

**candidates** (7 policies, standard 5 + self-edit + party-read):
- Standard 5 policies (anon_select, authenticated_select, admin_insert, admin_update, admin_delete)
- `authenticated_select_candidates` also includes: `auth_user_id = auth.uid() OR has_role('party', 'party', organization_id)`
- `candidate_update_own` -- FOR UPDATE TO authenticated USING/WITH CHECK (auth_user_id = auth.uid())

**organizations** (7 policies, standard 5 + self-edit + expanded select):
- Standard 5 policies
- `authenticated_select_organizations` also includes: `auth_user_id = auth.uid() OR has_role('party', 'party', id)`
- `party_update_own_organizations` -- FOR UPDATE TO authenticated USING/WITH CHECK (auth_user_id = auth.uid() OR has_role('party', 'party', id))

**app_settings** (5 policies, no published column):
- `anon_select_app_settings` -- USING (true)
- `authenticated_select_app_settings` -- USING (true)
- `admin_insert_app_settings` -- WITH CHECK (can_access_project(project_id))
- `admin_update_app_settings` -- USING/WITH CHECK (can_access_project(project_id))
- `admin_delete_app_settings` -- USING (can_access_project(project_id))

**constituency_group_constituencies** (4 policies, join table):
- `anon_select_constituency_group_constituencies` -- USING (true)
- `authenticated_select_constituency_group_constituencies` -- USING (true)
- `admin_insert_constituency_group_constituencies` -- WITH CHECK (EXISTS via constituency_groups.project_id)
- `admin_delete_constituency_group_constituencies` -- USING (EXISTS via constituency_groups.project_id)

**election_constituency_groups** (4 policies, join table):
- `anon_select_election_constituency_groups` -- USING (true)
- `authenticated_select_election_constituency_groups` -- USING (true)
- `admin_insert_election_constituency_groups` -- WITH CHECK (EXISTS via elections.project_id)
- `admin_delete_election_constituency_groups` -- USING (EXISTS via elections.project_id)

**user_roles** (2 policies, `011-auth-tables.sql`):
- `auth_admin_read_user_roles` -- FOR SELECT TO supabase_auth_admin USING (true)
- `service_role_manage_user_roles` -- FOR ALL TO service_role USING (true) WITH CHECK (true)
- All other roles REVOKEd: `REVOKE ALL ON TABLE public.user_roles FROM authenticated, anon, public`

## Storage Policies

15 policies on `storage.objects` in `014-storage.sql`, organized by bucket and operation. Path convention: `{project_id}/{entity_type}/{entity_id}/filename.ext`.

**SELECT (3 policies):**
- `anon_select_public_assets` -- public-assets, published entities only (via is_storage_entity_published)
- `authenticated_select_public_assets` -- public-assets: published OR admin project access OR own entity (auth_user_id)
- `authenticated_select_private_assets` -- private-assets: admin project access OR own entity

**INSERT (4 policies):**
- `candidate_insert_public_assets` -- public-assets, own entity folder (candidates table, auth_user_id check)
- `admin_insert_public_assets` -- public-assets, any file in project (can_access_project)
- `candidate_insert_private_assets` -- private-assets, own entity folder
- `admin_insert_private_assets` -- private-assets, any file in project

**UPDATE (4 policies):**
- `candidate_update_public_assets` -- public-assets, own entity files
- `admin_update_public_assets` -- public-assets, any project file
- `candidate_update_private_assets` -- private-assets, own entity files
- `admin_update_private_assets` -- private-assets, any project file

**DELETE (4 policies):**
- `candidate_delete_public_assets` -- public-assets, own entity files
- `admin_delete_public_assets` -- public-assets, any project file
- `candidate_delete_private_assets` -- private-assets, own entity files
- `admin_delete_private_assets` -- private-assets, any project file

Path segments extracted via `(storage.foldername(storage.objects.name))[N]` where [1]=project_id, [2]=entity_type, [3]=entity_id.

**Storage helper functions:**
- `is_storage_entity_published(entity_type_segment, entity_id_segment)` -- SECURITY DEFINER, looks up `published` column on the entity table matching the type segment. Returns true for 'project' type (project-level files always accessible). Returns false if entity not found.
- Entity ownership check uses EXISTS subquery against candidates/organizations tables matching auth_user_id to `(SELECT auth.uid())`.

**Two buckets** configured in `config.toml`:
- `public-assets` -- public=true, 500MiB limit. Entity images, project-level public files.
- `private-assets` -- public=false, 500MiB limit. Private documents and assets.

## Column-Level Restrictions

Source: `013-auth-rls.sql`. Prevents authenticated users from modifying structural columns via PostgREST.

**Pattern:** REVOKE table-level UPDATE, then GRANT UPDATE on specific columns only.

**candidates** -- allowed columns for self-edit:
- name, short_name, info, color, image, sort_order, subtype, custom_data, first_name, last_name, answers, created_at, updated_at

**organizations** -- allowed columns for party admin self-edit:
- name, short_name, info, color, image, sort_order, subtype, custom_data, answers, created_at, updated_at

**Protected columns** (require service_role, i.e., Edge Functions):
- candidates: project_id, auth_user_id, organization_id, published, id, is_generated, external_id
- organizations: project_id, auth_user_id, published, id, is_generated, external_id

**Why this pattern:** PostgreSQL column-level REVOKE is ineffective when table-level UPDATE exists. The approach is: REVOKE all UPDATE, then GRANT only the safe columns. Admin operations requiring protected columns use service_role client (Edge Functions like invite-candidate), which bypasses column-level grants entirely.

**Important:** The external_id column is also protected by the `enforce_external_id_immutability()` trigger, which prevents changing external_id once set regardless of column grants.

## Policy Naming Convention

Pattern: `{role}_{operation}_{table}` where:
- **role**: anon, authenticated, admin, candidate_update_own, party_update_own
- **operation**: select, insert, update, delete
- **table**: plural table name (e.g., elections, candidates)

Examples: `anon_select_elections`, `admin_insert_elections`, `candidate_update_own`, `party_update_own_organizations`.

**Exceptions to the naming convention:**
- Storage policies use bucket names: `anon_select_public_assets`, `admin_insert_private_assets`
- Auth policies: `auth_admin_read_user_roles`, `service_role_manage_user_roles`

## Policy Implementation Rules

These rules apply to ALL RLS policies in the schema (source: `010-rls.sql` header comments):

1. **Scalar subqueries for optimizer caching:** Always use `(SELECT auth.uid())` and `(SELECT auth.jwt())` -- never bare `auth.uid()`. The scalar subquery is evaluated once per query, not once per row.
2. **Explicit role target:** Always specify `TO anon` or `TO authenticated` -- never omit the role target.
3. **Operation clause rules:** SELECT uses USING only. INSERT uses WITH CHECK only. UPDATE uses USING + WITH CHECK. DELETE uses USING only.
4. **RLS enable required:** Every table must have `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY` before policies take effect.
5. **user_roles isolation:** The user_roles table must never have policies that reference JWT claims (circular dependency with Custom Access Token Hook). Only supabase_auth_admin and service_role access it.
