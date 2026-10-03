-- Column-level protections for structural fields
--
-- Prevents authenticated users (candidates, organization admins) from modifying structural columns via PostgREST. Admin operations that need to update these columns use service_role (Edge Functions), which bypasses column-level grants entirely.
--
-- Approach: REVOKE table-level UPDATE, then GRANT UPDATE only on allowed columns.
-- (Column-level REVOKE is ineffective when table-level UPDATE exists.)
--
-- Each block is one global REVOKE/GRANT pair against one role, so it cannot depend on a row's state or tell two callers of the same role apart. Rules that need either live in triggers: `enforce_entity_immutability()` and `enforce_nomination_confirmation()` (011-validation-functions.sql).
--
-- Depends on:
-- - 102-entities.sql (candidates, organizations, factions, alliances tables)
-- - 105-answers.sql (answers column)
-- - 302-rls.sql (RLS policies already applied)
-- =====================================================================
-- candidates: restrict updatable columns
-- =====================================================================
-- Protected (admin-only) columns:
-- - project_id - determines project tenancy
-- - id - primary key, immutable
-- - sort_order - presentation order, admin-controlled
-- - created_at - audit field, maintained by the database
-- - updated_at - audit field, maintained by the set_updated_at trigger
-- - external_id - the import identity, owned by bulk_import
--
-- `confirmed` is in the allowed list because a column grant cannot tell a candidate from a project administrator holding `entity.confirm`. Rule 1 of `enforce_entity_immutability()` refuses a change to it, in either direction, by a caller without that permission; 19-entity-immutability.test.sql asserts the refusal.
--
-- `first_name` and `last_name` are allowed too: an unconfirmed entity must be able to set its name during sign-up, and the freeze once confirmed is the trigger's rule 2.
--
-- Allowed columns for candidates (self-edit):
--   short_name, info, color, image, subtype, custom_data, first_name, last_name, answers, terms_of_use_accepted, confirmed
REVOKE
UPDATE ON public.candidates
FROM
  authenticated;

GRANT
UPDATE (
  short_name,
  info,
  color,
  image,
  subtype,
  custom_data,
  first_name,
  last_name,
  answers,
  terms_of_use_accepted,
  confirmed
) ON public.candidates TO authenticated;

-- =====================================================================
-- organizations: restrict updatable columns
-- =====================================================================
-- Protected (admin-only) columns:
-- - project_id - determines project tenancy
-- - id - primary key, immutable
-- - sort_order - presentation order, admin-controlled
-- - created_at - audit field, maintained by the database
-- - updated_at - audit field, maintained by the set_updated_at trigger
-- - external_id - the import identity, owned by bulk_import
--
-- `confirmed` and `name` are allowed and guarded by `enforce_entity_immutability()`, as on `candidates`.
--
-- Allowed columns for organization admins (self-edit):
--   name, short_name, info, color, image, subtype, custom_data, answers, confirmed
REVOKE
UPDATE ON public.organizations
FROM
  authenticated;

GRANT
UPDATE (
  name,
  short_name,
  info,
  color,
  image,
  subtype,
  custom_data,
  answers,
  confirmed
) ON public.organizations TO authenticated;

-- =====================================================================
-- factions: restrict updatable columns
-- =====================================================================
-- `entity_update_own_factions` (302-rls.sql) admits a non-admin editor, so without this pair a faction editor could rewrite `project_id` and move the row into another project.
--
-- Protected (admin-only) columns:
-- - project_id - determines project tenancy
-- - organization_id - the parent association, structural
-- - id - primary key, immutable
-- - sort_order - presentation order, admin-controlled
-- - external_id - the import identity, owned by bulk_import
-- - created_at - audit field, maintained by the database
-- - updated_at - audit field, maintained by the set_updated_at trigger
--
-- `confirmed` and `name` are allowed and guarded by `enforce_entity_immutability()`, as on `candidates`.
--
-- The allowed list is the organizations list minus `answers`, which 105-answers.sql adds to candidates and organizations only.
--
-- Allowed columns for faction editors (self-edit):
--   name, short_name, info, color, image, subtype, custom_data, confirmed
REVOKE
UPDATE ON public.factions
FROM
  authenticated;

GRANT
UPDATE (
  name,
  short_name,
  info,
  color,
  image,
  subtype,
  custom_data,
  confirmed
) ON public.factions TO authenticated;

-- =====================================================================
-- alliances: restrict updatable columns
-- =====================================================================
-- Bounds `entity_update_own_alliances` (302-rls.sql), for the same reason as the `factions` pair above.
--
-- Protected (admin-only) columns:
-- - project_id - determines project tenancy
-- - id - primary key, immutable
-- - sort_order - presentation order, admin-controlled
-- - external_id - the import identity, owned by bulk_import
-- - created_at - audit field, maintained by the database
-- - updated_at - audit field, maintained by the set_updated_at trigger
--
-- `confirmed` and `name` are allowed and guarded by `enforce_entity_immutability()`, as on `candidates`.
--
-- Allowed columns for alliance editors (self-edit):
--   name, short_name, info, color, image, subtype, custom_data, confirmed
REVOKE
UPDATE ON public.alliances
FROM
  authenticated;

GRANT
UPDATE (
  name,
  short_name,
  info,
  color,
  image,
  subtype,
  custom_data,
  confirmed
) ON public.alliances TO authenticated;

-- =====================================================================
-- nominations: restrict insertable AND updatable columns
-- =====================================================================
-- A candidate holds INSERT on this table, so without these pairs every column would be theirs to set, including `confirmed`, `created_by`, `election_symbol` and `name`.
--
-- `confirmed` is absent from INSERT and present in UPDATE. An omitted column takes its default (`false`, 104-nominations.sql), so a new row is unconfirmed by privilege. Confirming is an UPDATE that an admin performs through this same role, so the grant admits it and rule 2 of `enforce_nomination_confirmation()` refuses it to an entity user.
--
-- An authenticated administrator therefore creates a confirmed nomination in two statements: insert, then confirm.
--
-- `bulk_import` and `bulk_delete` are SECURITY INVOKER and are called as service_role or the database owner, so a REVOKE naming only `authenticated` does not reach them.
--
-- The column-level REVOKE is ineffective while the table-level privilege exists, for INSERT as for UPDATE.
--
-- Protected on INSERT (and why):
-- - confirmed - a new row is unconfirmed by privilege, not only by predicate
-- - created_by - the originator the cap on unconfirmed parent nominations counts; a caller must not forge authorship or reset their own count
-- - id - primary key, immutable
-- - created_at, updated_at - audit fields, maintained by the database and the set_updated_at trigger
--
-- Allowed on INSERT: the ten columns a nominating caller authors (project_id, candidate_id, organization_id, faction_id, alliance_id, election_id, constituency_id, election_round, parent_nomination_id, custom_data) and the nine presentation and bookkeeping columns a project admin writes (name, short_name, info, color, image, sort_order, subtype, election_symbol, external_id). The grant cannot tell the two callers apart, so it admits the union, and `enforce_nomination_entity_columns()` (011-validation-functions.sql) refuses the nine to a caller without `project.edit_nominations`.
REVOKE INSERT ON public.nominations
FROM
  authenticated;

GRANT INSERT (
  project_id,
  candidate_id,
  organization_id,
  faction_id,
  alliance_id,
  election_id,
  constituency_id,
  election_round,
  parent_nomination_id,
  custom_data,
  name,
  short_name,
  info,
  color,
  image,
  sort_order,
  subtype,
  election_symbol,
  external_id
) ON public.nominations TO authenticated;

-- Allowed on UPDATE: the six columns an editing caller changes (election_id, constituency_id, election_round, parent_nomination_id, custom_data, confirmed), the nine presentation columns and the four entity foreign keys. `enforce_nomination_entity_columns()` holds the last thirteen unchanged for a caller without `project.edit_nominations`.
--
-- `created_by` is protected on both verbs: an originator a caller could rewrite would defeat the cap and the admin queue.
REVOKE
UPDATE ON public.nominations
FROM
  authenticated;

GRANT
UPDATE (
  election_id,
  constituency_id,
  election_round,
  parent_nomination_id,
  custom_data,
  confirmed,
  name,
  short_name,
  info,
  color,
  image,
  sort_order,
  subtype,
  election_symbol,
  external_id,
  candidate_id,
  organization_id,
  faction_id,
  alliance_id
) ON public.nominations TO authenticated;

-- =====================================================================
-- projects: restrict updatable columns
-- =====================================================================
-- `admin_update_projects` asks `project.edit_project_settings` of the row's `id`, which a rewrite of `account_id` leaves unchanged, so without this pair a project admin could move its project into any account whose id it knew. Re-parenting would need `account.manage_projects` on both the old and the new account, which a single permissive policy cannot ask.
--
-- Allowed on UPDATE: name, default_locale, open_for_voters, lock_nominations.
-- Protected: id, account_id, created_at, updated_at (the set_updated_at trigger writes updated_at without needing a column privilege).
-- INSERT is not restricted here: `admin_insert_projects` asks `account.manage_projects` of the new row's `account_id`.
REVOKE
UPDATE ON public.projects
FROM
  authenticated;

GRANT
UPDATE (
  name,
  default_locale,
  open_for_voters,
  lock_nominations
) ON public.projects TO authenticated;
