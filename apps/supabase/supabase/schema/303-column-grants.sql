-- Column-level protections for structural fields
--
-- Prevents authenticated users (candidates, organization admins) from modifying structural columns via PostgREST. Admin operations that need to update these columns use service_role (Edge Functions), which bypasses column-level grants entirely.
--
-- Approach: REVOKE table-level UPDATE, then GRANT UPDATE only on allowed columns.
-- (Column-level REVOKE is ineffective when table-level UPDATE exists.)
--
-- ⚠ WHAT THIS FILE CANNOT EXPRESS, STATED ONCE SO THE NEXT READER NEED NOT RE-DERIVE IT. Every block below is a SINGLE GLOBAL REVOKE/GRANT PAIR AGAINST ONE ROLE. It therefore cannot make a rule conditional on a ROW'S STATE -- "only while a flag on the row is false" is not sayable here at all -- and it cannot distinguish two CALLERS of the same role, so "a candidate may not set this but a project administrator may" is not sayable either. That is 162-IMPLEMENTATION-BRIEF.md fact 27 and 162-CONTEXT.md D-11a, reached independently from the `nominations` side by 162-12 and from the entity side by 162-13. Where a rule needs either of those two things, it lives in a TRIGGER and this file expresses only the coarse outer bound around it: `enforce_entity_immutability()` (011-validation-functions.sql) carries the entity confirmation gate and the conditional name freeze; `enforce_nomination_confirmation()` carries the nomination one. A block here that looks like it protects the confirmation column no longer does, and the comments say so per block.
--
-- Depends on: 102-entities.sql (candidates, organizations, factions, alliances tables)
--             105-answers.sql (answers column) 302-rls.sql (RLS policies already applied)
-- =====================================================================
-- candidates: restrict updatable columns
-- =====================================================================
-- Protected (admin-only) columns:
--   project_id      - determines project tenancy auth_user_id    - links candidate to auth user, set during invite/registration id              - primary key, immutable is_generated    - system flag for mock/generated data sort_order      - presentation order, admin-controlled created_at      - audit field, maintained by the database updated_at      - audit field, maintained by the set_updated_at trigger external_id     - the import identity, owned by bulk_import
--
-- ⚠ `confirmed` MOVED OUT OF THE PROTECTED HALF IN 162-13, AND IT IS A LOSS OF ENFORCEMENT RATHER THAN A SIMPLIFICATION. It sat here by OMISSION from the list below, which refused it to EVERY authenticated caller -- including the project administrator who holds `entity.confirm` under section 3.3, for whom the permission was therefore unexercisable through the role the application uses. MEASURED as a live 42501 before the change: `user_can('entity', <row>, 'entity.confirm')` answered TRUE for that administrator and the statement was still refused "permission denied for table candidates". A single global grant pair against one role cannot say "a candidate may not but an administrator may" -- D-11a's finding about this file, which 162-12 reached independently from the `nominations` side. So the column enters the allow-list below and the fine rule moves to `enforce_entity_immutability()`'s rule 1, which refuses exactly the caller the privilege cannot distinguish, in BOTH directions. 19-entity-immutability.test.sql observes that refusal on this table rather than arguing for it.
--
-- ⚠ THE PROTECTED NAME COLUMNS STAY IN THE LIST, and their absence would be a defect rather than a tightening. Removing `first_name` and `last_name` would freeze a name on an UNCONFIRMED entity and make the sign-up flow impossible, which section 11.2 forbids: the freeze is conditional on the row's confirmation state, and no column grant can express a condition on a row. The trigger's rule 2 is where the condition lives.
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
--   project_id   - determines project tenancy auth_user_id - links organization to auth user id           - primary key, immutable is_generated - system flag for mock/generated data sort_order   - presentation order, admin-controlled created_at   - audit field, maintained by the database updated_at   - audit field, maintained by the set_updated_at trigger external_id  - the import identity, owned by bulk_import
--
-- ⚠ `confirmed` MOVED OUT OF THE PROTECTED HALF IN 162-13, for the reason stated in full on the `candidates` block above and summarised here: the bar it had by omission refused EVERY authenticated caller, the project administrator holding `entity.confirm` included, and a single global pair against one role cannot tell the two apart. Its replacement is `enforce_entity_immutability()`'s rule 1. The name column STAYS in the list below, because removing it would freeze a name on an unconfirmed entity and make the sign-up flow impossible.
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
-- NEW IN 162-10, AND IT IS THE BOUND ON A WRITE PATH THAT DID NOT EXIST BEFORE IT. Until this commit no UPDATE policy on `factions` admitted a non-admin, so the absence of a REVOKE here cost nothing: the policy layer was the only restraint and it admitted nobody. `entity_update_own_factions` (302-rls.sql, P-3(a)) changes that, and `authenticated` held TABLE-LEVEL UPDATE on this table -- so without the pair below a faction editor could rewrite `project_id` and move the row into another tenant's project. The bound lands in the same commit as the policy for exactly that reason, rather than deferring to 162-13.
--
-- Protected (admin-only) columns:
--   project_id      - determines project tenancy organization_id - the parent association, structural id              - primary key, immutable is_generated    - system flag for mock/generated data sort_order      - presentation order, admin-controlled external_id     - the import identity, owned by bulk_import created_at      - audit field, maintained by the database updated_at      - audit field, maintained by the set_updated_at trigger
--
-- ⚠ `confirmed` LEFT THIS LIST IN 162-13 AND ENTERED THE ONE BELOW, and the line it used to occupy said the right thing for the wrong mechanism. It read "gated by entity.confirm rather than by a self-edit" -- but a grant against a single global role cannot gate on a permission at all: it refused the holder of `entity.confirm` exactly as it refused the faction editor. The gate is now real and it is `enforce_entity_immutability()`'s rule 1, which asks `user_can` and refuses in both directions. The name column stays below for the sign-up reason given on the blocks above.
--
-- Allowed columns for faction editors (self-edit):
--   name, short_name, info, color, image, subtype, custom_data, confirmed The organizations list minus `answers`, which is not a column on this table (105-answers.sql gives it to candidates and organizations only).
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
-- NEW IN 162-10, for the same reason and with the same shape as the `factions` pair above: a first non-admin write path needs a first column bound, in the same commit.
--
-- Protected (admin-only) columns:
--   project_id   - determines project tenancy id           - primary key, immutable is_generated - system flag for mock/generated data sort_order   - presentation order, admin-controlled external_id  - the import identity, owned by bulk_import created_at   - audit field, maintained by the database updated_at   - audit field, maintained by the set_updated_at trigger
--
-- ⚠ `confirmed` LEFT THIS LIST IN 162-13 AND ENTERED THE ONE BELOW, on the same reasoning and with the same replacement as the `factions` block above.
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
-- NEW IN 162-12, AND THE FIRST COLUMN GRANT THIS TABLE HAS EVER CARRIED. Fact 34: this file mentioned `nominations` ZERO times, which was harmless while the table was ADMIN-ONLY to write (fact 19). The moment a candidate holds INSERT, EVERY column is theirs to set -- including the confirmation flag, the originator, `election_symbol` and `name`. Section 11.5 calls this the amendment's SHARPEST EDGE: without the block below, "create an UNCONFIRMED parent" is a request the database has no way to insist on.
--
-- ⚠ THE ASYMMETRY BETWEEN THE TWO LISTS IS THE DESIGN, NOT AN OVERSIGHT. The confirmation flag is ABSENT from INSERT and PRESENT in UPDATE. Absent above, because that is what makes section 11.5 guard 2 true for a caller who cannot name the column: an omitted column takes its declared default, which `104-nominations.sql` sets to `false`. Present below, because CONFIRMING IS AN UPDATE, an admin performs it through this same role, and a grant against a single global role CANNOT SAY "a candidate may not but an admin may" -- that is D-11a's finding about this file and it applies here verbatim. What stops an entity user confirming is `enforce_nomination_confirmation`'s rule 2, a trigger.
--
-- ⚠ THE CONSEQUENCE, STATED AND PAID RATHER THAN DISCOVERED: an AUTHENTICATED administrator creating a nomination now needs TWO statements -- insert, then confirm -- because the flag is not insertable through this role. That population was MEASURED AT ZERO today: no tracked source writes `nominations` through PostgREST at all (fact 22 records that the candidate app collects nominations and the writer silently discards them), and the estate's only non-owner write attempt is `03-anon-read.test.sql`'s probe asserting an anonymous caller is refused.
--
-- ⚠ THE BULK PATHS ARE UNAFFECTED, and the reason is the role rather than the function. `bulk_import` and `bulk_delete` are both SECURITY INVOKER, so they run AS THEIR CALLER: dev-seed calls them on the service-role client and the pgTAP estate runs as the database owner. A REVOKE naming only `authenticated` reaches neither.
--
-- REVOKE before GRANT, for the reason this file's header states: a column-level REVOKE is INEFFECTIVE while the table-level privilege exists. That applies to INSERT exactly as it does to UPDATE.
--
-- Protected on INSERT (and why):
--   confirmed             - section 11.5 guard 2. Absent here is what makes "created unconfirmed" enforceable by PRIVILEGE rather than only by predicate created_by             - the originator the cap counts. Absent here is what stops a caller forging someone else's authorship and resetting their own count id                    - primary key, immutable created_at, updated_at - audit fields, maintained by the database and the set_updated_at trigger is_generated          - system flag for mock/generated data external_id           - the import identity, owned by bulk_import sort_order            - presentation order, admin-controlled name, short_name, info, color, image, subtype - an organization's DISPLAY fields are not a candidate's to author election_symbol       - a ballot number is assigned by the electoral authority, not chosen by a nominee
--
-- Allowed on INSERT: the ten columns a nominating caller legitimately authors -- project_id, candidate_id, organization_id, faction_id, alliance_id, election_id, constituency_id, election_round, parent_nomination_id, custom_data -- PLUS, since 162-REVIEW WR-05, the nine presentation and bookkeeping columns a PROJECT ADMIN writes: name, short_name, info, color, image, sort_order, subtype, election_symbol, external_id. The grant cannot tell the two callers apart, so it admits the union, and `enforce_nomination_entity_columns()` (011-validation-functions.sql) refuses the nine to a caller without `project.edit_nominations`. Without the widening a project admin's nomination insert naming `election_symbol` was refused `permission denied for table nominations`.
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

-- Allowed on UPDATE: the six columns an editing caller legitimately changes -- election_id, constituency_id, election_round, parent_nomination_id, custom_data, confirmed -- PLUS, since 162-REVIEW WR-05, the nine presentation columns and the four entity foreign keys a project admin may change. `enforce_nomination_entity_columns()` holds those thirteen unchanged for a caller without `project.edit_nominations`.
--
-- `created_by` is protected on BOTH verbs: an originator a caller could rewrite after the fact would make the cap and the admin queue equally worthless.
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
-- projects: restrict updatable columns (162-REVIEW CR-04)
-- =====================================================================
-- `admin_update_projects` asks `project.edit_project_settings` of the row's `id`, which a rewrite of `account_id` leaves unchanged -- so without a column grant a project admin could re-parent its project into ANY account whose id it knew, escaping its own account admins and handing the project to another tenant. Re-parenting is not a feature; if it ever becomes one it needs `account.manage_projects` on BOTH the old and the new account, which a single permissive policy cannot ask.
--
-- Allowed on UPDATE: name, default_locale, open_for_voters, lock_nominations. Protected: id, account_id, created_at, updated_at (the set_updated_at trigger writes updated_at without needing a column privilege). INSERT is untouched: `admin_insert_projects` already asks `account.manage_projects` of the new row's `account_id`.
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
