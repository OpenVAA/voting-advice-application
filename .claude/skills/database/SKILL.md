---
name: database
description: 'Domain expert for the OpenVAA Supabase backend: 21-table PostgreSQL schema with JSONB localization, 108 RLS policies over a single grant model (four scopes, two role levels, a 23-member permission enum and one user_can predicate), JWT claims via Access Token Hook, invitations that promise a grant ahead of time, nominations held to their election's type, written by an entity's editor through one function or stated by an admin's invitation, 3 Edge Functions, bulk import/delete RPCs with external_id-based idempotent upsert, a 2603-assertion pgTAP estate, storage bucket configuration, and a frozen baseline migration followed by appended numbered migrations listed in a manifest. Activate when working in apps/supabase/ or packages/supabase-types/, writing migrations, RLS policies, database functions, pgTAP tests, or understanding the Supabase auth and service layer.'
targets:
  - apps/supabase/
  - packages/supabase-types/
---

# OpenVAA Database Expert

## Backend Overview

Supabase backend with a PostgreSQL schema of 21 tables in `public` and 4 in `private`, multi-tenant
via accounts and projects.
All content tables reference `projects` via `project_id` FK with `ON DELETE CASCADE`.

Every count in this section was measured on 2026-10-11, and the pgTAP counts on 2026-10-18; § _Freshness
Record_ names the command behind each. A count is a snapshot: re-run its command before relying on it.

- JSONB localization for all user-facing text (name, short_name, info) using locale-keyed objects
- GoTrue authentication; authority is rows of `public.grants` (four scopes, two roles), read by
  row-level security for `(SELECT auth.uid())` and projected into the JWT by the Access Token Hook for
  the frontend's app-entry gates
- 108 RLS policies (93 in `public`, 15 in `storage`) enforcing tenant isolation
- Nominations: an election's type (`nomination_shape`, four members) says which entity types it
  admits; an entity's editor writes the entity's whole set through `set_entity_nominations`
  (Schema Conventions § 7, RLS and Auth Patterns § 9)
- Invitations: a row of `public.invitations` promises one grant; `create_invitations` seeds, stating
  whether each invited entity is confirmed and which nominations it holds, `claim_invitations`
  fulfils, and an open candidate or organization invitation is honoured only under a registration mode
  its project allows for that type (RLS and Auth Patterns § 10)
- 3 Edge Functions: `account-access`, `identity-callback`, `send-email`
- Bulk import/delete RPCs with external_id-based idempotent upsert
- 2603 pgTAP assertions in 47 files: 46 files declare plans summing to 2594, and `00-helpers.test.sql`
  runs 9 under `no_plan()` (53,569 lines in all)
- Schema files: `apps/supabase/supabase/schema/` (29 SQL files, `000-enums.sql` through
  `900-test-helpers.sql`, numbered by **concern**: `0xx` types and functions, `1xx` content tables,
  `200` indexes, `3xx` auth and RLS, `400` storage, `5xx` RPCs, `900` test helpers)

**The migrations are frozen: a schema change is appended, never edited in.** `supabase/schema/` is the
hand-edited current view of the schema, organised by concern; `config.toml` sets
`[db.migrations] schema_paths = []`, so the CLI **never** reads it. `supabase/migrations/` is what a
database is built from: the frozen baseline `00001_initial_schema.sql` and, after it, appended
migrations named by the next five-digit version, an underscore and a name (for example
`00002_add_example.sql`); `supabase db reset` and `supabase db push` apply them in version order. Each
is listed with its sha256 in `supabase/migrations.manifest.json`, and a listed migration is never
edited. A file that `supabase migration new` names with a timestamp is renamed to the next number. So a
schema change is **one commit with three parts** -- the `schema/` edit, the numbered migration, and its
manifest line -- after which `yarn check:schema-equivalence` builds one database from `schema/` and
one from the migrations and fails when they differ; it needs Docker and is not part of
`yarn lint:check`. **A gate keeps the migrations frozen**: `yarn assert:schema-migration-parity`, a
link of `yarn lint:check`, fails when a listed migration's bytes change, when a migration has no
manifest line, and when versions repeat, go down or leave a gap; `yarn schema:regenerate` refuses and
prints the three steps. Two obligations no tool enforces: **read the migration you wrote** in that same
commit, and run `yarn db:types` so `packages/supabase-types/` matches. The two storage buckets are
created by the migration; a deployment's own rows are written by `infra/scripts/bootstrap.sql`. Full
treatment: `apps/supabase/README.md`.

## Schema Conventions

1. **Common column pattern**: Every content table (elections, candidates, etc.) shares these
   columns:
   - `id` (uuid PK, `gen_random_uuid()`)
   - `project_id` (uuid FK to projects, NOT NULL, ON DELETE CASCADE)
   - `name`, `short_name`, `info` (jsonb -- localized)
   - `color`, `image` (jsonb). On the four entity tables `color` is held to one shape by the trigger
     `validate_entity_color`: null, or an object whose only members are `normal` and `dark`, each absent,
     null or `#` and three or six hexadecimal digits. The other content tables' `color` is not validated.
   - `sort_order` (integer)
   - `subtype` (text)
   - `custom_data` (jsonb)
   - `created_at`, `updated_at` (timestamptz, auto-managed by `set_updated_at` trigger)
   - `external_id` (text, nullable, composite unique with project_id)

2. **JSONB localization storage**: Store all user-facing text as locale-keyed JSONB:
   `{"en": "Election 2024", "fi": "Vaalit 2024"}`. Never use bare strings for localizable
   content.
   - `get_localized(val, locale, default_locale)` provides 3-tier fallback: requested locale
     -> project default locale -> first available key -> NULL. Marked IMMUTABLE for query
     planner optimization. Source: `apps/supabase/supabase/schema/010-utility-functions.sql`.
   - `get_localized()` is used only in email helpers (`resolve_email_variables` in
     `502-email-helpers.sql`), NOT for API responses -- client-side locale selection per v2.0
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
   - Source: `apps/supabase/supabase/schema/105-answers.sql`.

4. **StoredImage structure**: Image columns store:
   `{"path": "project-id/entity/id/file.jpg", "pathDark": "...", "alt": "...", "width": 800, "height": 600, "focalPoint": {"x": 0.5, "y": 0.3}}`.
   Required: `path`. Optional: `pathDark`, `alt`, `width`, `height`, `focalPoint` (with `x`
   and `y`).

5. **4 enums**: Define all type-safe enumerations in `010-utility-functions.sql`:
   - `question_type` (9 values): text, number, boolean, image, date, multipleText,
     singleChoiceOrdinal, singleChoiceCategorical, multipleChoiceCategorical
   - `entity_type` (4 values): candidate, organization, faction, alliance
   - `category_type` (3 values): info, opinion, default
   - `grant_scope_type` (4 values, in `000-enums.sql`): global, account, project, entity
   - `grant_role_type` (2 values, in `000-enums.sql`): admin, editor -- deliberately two and not
     three (`000-enums.sql:28`)
   - `grant_permission` (23 values, in `000-enums.sql`): the verbs `user_can` is written in,
     canonical in `162-IMPLEMENTATION-BRIEF.md` section 3.2. `scripts/assert-grant-permission-enum.mjs`
     holds the same list as a committed canon and reddens `lint:check` on drift.
   - `storage_verb` (2 values, in `000-enums.sql`): read, write
   - TODO: add test or type assertion ensuring DB enums stay in sync with data package
     TypeScript equivalents (ENTITY_TYPE, QUESTION_TYPE, QUESTION_CATEGORY_TYPE).

6. **External ID system**: Nullable `external_id` column on all 11 content tables.
   - Composite unique partial index: `(project_id, external_id) WHERE external_id IS NOT NULL`.
   - Immutability trigger: once set, cannot change (NULL -> value allowed; value -> different
     value blocked; value -> NULL blocked).
   - Used by `bulk_import` for idempotent upsert matching.
   - Source: `apps/supabase/supabase/schema/500-external-id.sql`.

7. **Nominations CHECK constraint**: The nominations table uses separate FK columns
   (candidate_id, organization_id, faction_id, alliance_id) with a CHECK constraint enforcing
   exactly one is NOT NULL. A generated `entity_type` column derives from whichever FK is set.
   `parent_nomination_id` enables hierarchy. The `validate_nomination()` trigger enforces the
   election-type rule, parent-child type rules and election/constituency/round consistency. Source:
   `011-validation-functions.sql` and `104-nominations.sql`.
   - **The election type decides who may be nominated.** `elections.election_type` is a
     `public.nomination_shape`: `organization_only`, `candidate_only`, `organization_list` or
     `organization_list_and_independents`, the last being the column's default.
     `public.nomination_shape_rule(shape, entity_type)` is the matrix, stated ONCE in SQL: it answers
     `admitted`, `parent_required` or `refused`, and NULL for a pair it does not name, which every caller
     treats as a refusal. A function that needs the answer asks it, never a copy. The TypeScript
     statement of the same matrix is `isNominableInShape` / `allowedParentTypes` in `@openvaa/data`
     (the data skill), and `packages/data/README.md` § _Nomination rules: the data model and the
     database_ compares the two.
   - **The row rule.** `validate_nomination` refuses, on INSERT and UPDATE and for every writer (the
     service role and `bulk_import` included), a row whose entity type its election's type does not
     admit: `Nomination shape refused: …`, SQLSTATE `23514`. Changing an election's type re-checks
     nothing; a later write of a row the new type refuses is refused.
   - **The constituency rule.** `validate_nomination` also refuses, for every writer, a row whose
     constituency no constituency group of its election holds (`election_constituency_groups` joined to
     `constituency_group_constituencies`): `Nomination constituency <id> is no constituency of its
     election <id>`, SQLSTATE `23514`. It judges every INSERT and an UPDATE that changes `election_id` or
     `constituency_id`; a stored row that stays where it is is not judged again, so it can still be
     edited after its constituency is unlinked. A writer links an election to its constituencies before
     it inserts a nomination there (`bulk_import`'s link keys, Service Patterns § 2).
     `54-nomination-constituency-rule.test.sql` pins it.
   - **The end-of-transaction rule.** `nominations_parent_required` is the schema's one CONSTRAINT
     TRIGGER, `DEFERRABLE INITIALLY DEFERRED`: where the matrix answers `parent_required` (a candidate
     in an `organization_list` election), the row must, when the transaction ends, have a parent
     nomination or `requestedParentOrganization` in `custom_data`: `Nomination parent required: …`,
     `23514`. Deferred so that a writer may insert the candidate's row, then its party's, then link
     them. Its function re-reads the row by id and never judges the row the queued event carries.
   - **Forcing the deferred rule.** A function that must report that refusal inside its own call runs
     `SET CONSTRAINTS public.nominations_parent_required IMMEDIATE;` and then
     `SET CONSTRAINTS public.nominations_parent_required DEFERRED;` before it returns. The second
     statement is not optional: while the constraint is immediate, a candidate's row without a parent is
     refused at its own statement. In a pgTAP file, which never commits, the rule does not fire by
     itself: assert it through `set_entity_nominations`, or with `SET CONSTRAINTS ALL IMMEDIATE` inside
     the asserted statement, and leave no statement in the mode IMMEDIATE.
   - `custom_data.requestedParentOrganization` holds the typed name of a parent that is not in the
     system, a party for a candidate and an alliance for an organization. A row that carries it cannot
     be confirmed (`enforce_nomination_confirmation`, rule 1, which is judged before an edit turns the
     confirmation off — so an UPDATE that adds the key to a confirmed row must state `confirmed` false
     in the same statement, as `set_entity_nominations` does).

8. **Trigger conventions**: Follow these naming patterns:
   - `set_updated_at` on all content tables (BEFORE UPDATE)
   - `validate_answers_jsonb` on candidates and organizations (BEFORE INSERT OR UPDATE)
   - `enforce_external_id_immutability` on all 11 content tables (BEFORE UPDATE)
   - `validate_nomination`, `enforce_nomination_entity_columns` and `enforce_nomination_confirmation`
     on nominations (BEFORE INSERT OR UPDATE), and the constraint trigger `nominations_parent_required`
     (AFTER INSERT OR UPDATE, deferred to the end of the transaction; § 7)
   - `validate_question_type_change` on questions (BEFORE UPDATE)
   - `enforce_entity_immutability` on the four entity tables (BEFORE UPDATE OF the protected columns and
     `confirmed`). Registered with the columns it protects: `first_name`, `last_name`, `short_name` on
     `candidates`; `name`, `short_name` on `organizations`, `factions` and `alliances`. A change to
     `confirmed` needs `entity.confirm`; a change to a protected column of a row that was already
     confirmed needs `entity.edit_immutable`. It binds the `authenticated` role alone, so a service-role
     write is not refused. `19-entity-immutability.test.sql`.
   - `validate_entity_color` on the four entity tables (BEFORE INSERT OR UPDATE OF color) and
     `validate_entity_type_list` on `question_categories` and `questions` (BEFORE INSERT OR UPDATE OF
     entity_type). Both are SECURITY INVOKER with `search_path = ''`, read no role and no grant, and so
     bind every writer, the service role and `bulk_import` included. `entity_type` on those two tables is
     a filter list: null or an empty array addresses every entity type, any other value is a JSON array
     of `entity_type` enum values. `40-entity-type-list.test.sql`, `41-entity-color.test.sql`.
   - All three functions are in `011-validation-functions.sql`.
   - Storage cleanup triggers, all in `400-storage.sql`: `cleanup_storage_on_delete` (AFTER DELETE,
     ten tables), `cleanup_image_on_update` (BEFORE UPDATE, ten tables) and
     `cleanup_answer_files_on_update` (BEFORE UPDATE, `candidates` and `organizations`). Each deletes
     through `delete_storage_object()`, which sends ONE object per call via `net.http_delete` on
     `/storage/v1/object/{bucket}/{path}`; pg_net sends only after the transaction commits.
   - A path is deleted only if it matches the upload-convention whitelist
     (`<uuid>/<table>/<uuid>/<uuid>.<ext>` in `public-assets`/`private-assets`), lies in the row's own
     folder `<project_id>/<table>/<id>/`, and is no longer referenced by the new row
     (`referenced_storage_paths (to_jsonb (NEW))`) -- 162.1 D-20. Stored paths are written by the
     entity's editor, so all three limits are load-bearing.
   - Source: individual schema files; cleanup triggers in `400-storage.sql`.

9. **Indexing strategy**: Add these indexes for every new content table:
   - B-tree on `project_id` (tenant isolation queries)
   - B-tree on any FK columns (account_id, organization_id, category_id, parent_id)
   - Composite unique partial index on `(project_id, external_id) WHERE external_id IS NOT NULL`

## RLS and Auth Patterns

Full inventory: `.claude/skills/database/rls-policy-map.md`, derived from the applied database.

1. **The grant model, and no other decides authority.** A grant is a row of `public.grants`:
   `(user_id, scope, target_type, target_id, role)`. The eight user types of
   `162-IMPLEMENTATION-BRIEF.md` section 3.1 are eight shapes of that row -- RootAdmin `(global, admin)`,
   AccountAdmin `(account, admin)`, ProjectAdmin `(project, admin)`, ProjectEditor `(project, editor)`,
   and the four entity editors `(entity, <type>, id, editor)`. Source:
   `apps/supabase/supabase/schema/300-auth-tables.sql`.
   - **An entity-scope grant carrying the `admin` role opens NOTHING.** The CHECK constraints admit the
     shape, the user-type mapping never produces it, and the matrix gives it the empty set. Never gate on
     a role name without a scope beside it.
   - **The one exception is a self-row table for a statement a user makes about themself.**
     `public.terms_of_use_acceptances` (`304-terms-of-use-acceptances.sql`) records a user's acceptance of
     a project's terms of use: its two policies are keyed on `user_id = (SELECT auth.uid())` and ask no
     grant, and nothing that decides authority or visibility reads it. Columns, keys and privileges are
     in `schema-reference.md`; the policies, the linter exemption and the pgTAP census that keeps the
     table unread are in `rls-policy-map.md` § _The one table outside the grant model_.

2. **JWT claims via Access Token Hook**: `custom_access_token_hook(event jsonb)` in
   `301-auth-functions.sql` runs on every token refresh/issue. It projects `public.grants` and injects
   `{"grants": [{"scope": "...", "target_type": "...", "target_id": "...", "role": "..."}]}` into the JWT
   claims. Configured in `config.toml` under `[auth.hook.custom_access_token]`. **No row-level-security
   decision reads the claim**: `user_can` and `user_has_account_grant` read the caller's rows of
   `public.grants` for `(SELECT auth.uid())`, so a grant counts from the moment it is written and a
   deleted grant is denied at once, for the next read and the next write made with the same token. The
   claim is written for the frontend's app-entry gates only (`apps/frontend/src/lib/auth/roles.ts`),
   which decide which app a signed-in user is shown, so a session is still refreshed after a claim.
   The second hook, `send_email_hook(event jsonb)` in the same file, takes every mail the auth service
   would send and sends none (`[auth.hook.send_email]`): the application's mails are sent by
   `account-access` alone. Only `supabase_auth_admin` may execute it, because its event holds an
   address and a token. `07-rpc-security.test.sql` § 8d censuses the functions of `public` that
   `supabase_auth_admin` can execute and no API role can: exactly the two hooks. `[auth]` keys and hook
   tables are served only after `yarn db:stop` and `yarn db:start`; a reset does not serve them.

3. **`public.grants` isolation**: only `supabase_auth_admin` and `service_role` reach the table --
   `auth_admin_read_grants` and `service_role_manage_grants` are its only two policies, and
   `authenticated` / `anon` are REVOKEd. The two authority functions read it as SECURITY DEFINER, keyed
   on `(SELECT auth.uid())`, and no policy on the table reads it, so there is no circular RLS. No index is
   added for that read: the unique key `grants_user_scope_target_role_key` leads with `user_id`. Source:
   `300-auth-tables.sql`.

4. **One authority function.** `public.user_can(scope, target_id, permission, target_type)` is the single place the
   role x permission matrix is encoded, delegating to `public.grant_role_permissions`. It reads the
   caller's rows of `public.grants` for `(SELECT auth.uid())`, never the token's claim, and resolves them
   DOWNWARD: `global` answers for every account, `account` for every project it owns, `project` for every
   entity in it, and `entity` for that entity and -- through `is_child_nominee` -- its child nominees.
   - **At entity scope the entity is named by its type and id together**, because the four entity tables
     have independent primary keys and a project admin chooses an inserted entity's `id`: one uuid can name
     a candidate in one project and an organization in another. A NULL `target_type` denies at entity
     scope, an entity grant reaches only the entity of its own `target_type`, and every hop resolves the
     pair (`private.entity_project_id(entity_type, uuid)`, `private.is_child_nominee(parent_type,
     parent_id, child_type, child_id)`). Every entity-scope call passes the type; at every other scope
     `target_type` defaults to NULL, so project-scope RPC callers pass three arguments.
     `33-entity-type-collision.test.sql` is the negative control. `get_entity_basic_data(entity_type,
     uuid)` probes only the named table.
   Named `SECURITY DEFINER` helpers a policy may reach INSTEAD of `user_can`, each the single definition
   of one question:
   - `user_has_account_grant(account_id)`: grant EXISTENCE, which `user_can` cannot express because
     `user_can` takes a permission. The `accounts` read asks this. It reads the caller's rows of
     `public.grants`, as `user_can` does.
   - `project_open_for_voters(project_id)` and `entity_has_confirmed_nomination(type, id, project_id)`:
     the two anon visibility sub-rules.
   - `storage_path_can(scope, project, type, id, verb)` and `storage_path_is_public(project, type, id)`:
     the storage authority and visibility questions, asked of a PATH.
   - Source: `apps/supabase/supabase/schema/301-auth-functions.sql`, `302-rls.sql`, `400-storage.sql`.
   - **Policy-only hops live in the `private` schema** (162-REVIEW WR-01): `entity_project_id`,
     `is_child_nominee`, `entity_has_confirmed_nomination`, `nomination_entities_confirmed`,
     `election_project_id`, `constituency_group_project_id`, `project_nominations_locked`,
     `project_answers_locked`, `nomination_exists_in_contest`, `caller_nominated_in_contest`,
     `caller_unconfirmed_originated_count` -- eleven, the census at the end of
     `07-rpc-security.test.sql` § 8d (`'11/0/11'`).
     `private.nomination_id_in_contest` lives beside them and is not policy-only:
     `private.parent_nomination_resolved` asks it, for both nomination writers, for the id of a parent's
     nomination the caller cannot read (no parent first, then the oldest, then the lowest id).
     Two more definer functions in `private` answer a fact about the caller rather than a policy
     question, and are executable by `authenticated` alone: `private.caller_password_set` and
     `private.caller_pending_email_taken`, both read by `get_user_entities` (§ 9).
     A SECURITY DEFINER function in `public` is a PostgREST RPC endpoint, and these answer questions RLS
     refuses the caller. `private` is not an exposed schema; `anon`/`authenticated` keep USAGE + EXECUTE so
     policies (which run as the caller) can still call them. Always call them qualified (`private.x(...)`).
     `07-rpc-security.test.sql` § 8c holds three censuses of the definer functions left in `public`:
     six that `anon` can execute (`contestant_app_public_config`, `project_open_for_voters`,
     `storage_path_can`, `storage_path_is_public`, `user_can`, `user_has_account_grant`); for
     `authenticated`, ten: the same six plus `claim_invitations`, `get_entity_basic_data`,
     `get_entity_nominations` and `get_nomination_parent_options`; and thirteen that `service_role` can
     execute and neither API role can (`address_confirmation_release`, `address_confirmation_request`,
     `address_holds_open_invitation`, `delete_storage_object`,
     `identity_entity_find_or_create`, the six `invitation_*` helpers, `recovery_link_request`, `resolve_email_variables`).
     `identity_entity_find_or_create(p_user_id, p_project_id, p_entity_type, p_first_name, p_last_name)` serialises
     an identity provider's first sign-ins of one user with `pg_advisory_xact_lock` keyed on
     `hashtext('identity-entity:' || p_user_id)`, reads the user's `registered_entities` record inside that lock,
     and answers `found`, `gone` or `created`, writing the entity, its editor grant and the record in the same
     transaction for `created` only (`56-identity-entity-find-or-create.test.sql`). The censuses leave out trigger functions and
     `test_`-prefixed helpers. A new definer function in `public` reddens the first two when an API role
     can execute it, and the third when it is left to the service role, so it is added to one of them on
     purpose.
   - **The nomination writers' shared rules are SECURITY INVOKER functions in `private`**, not definer
     helpers, so the censuses above do not count them: `private.nomination_list_checked(jsonb, text,
     text)` (a JSON array of at most 1000 nominations, asked before any member is read),
     `private.nomination_object_checked(jsonb, entity_type, text, text)` (the shape of one object, with the
     white-space class, the trim and the 50- and 100-character caps; it answers the normalised object)
     and `private.parent_nomination_resolved(...)` (it refuses a parent that is no entity of the
     nomination's project, then answers the parent's nomination at the contest, inserting the bare,
     unconfirmed row as the caller where there is none). All three are in `503-entity-rpcs.sql` and take a
     message prefix and an item label, so each writer's messages keep its own words.
     `set_entity_nominations` and `create_invitations` ask all three, and no copy of their rules exists
     in SQL. Each carries its own `REVOKE ... FROM PUBLIC, anon` and `GRANT ... TO authenticated,
     service_role`: the blanket grant of `301-auth-functions.sql` reaches only the functions defined
     before it. `46-nomination-write-helpers.test.sql` pins them.
   - `contestant_app_public_config(project_id)` (`106-app-settings.sql`) is the one of them **no policy
     reaches**. The frontend adapter calls it when the caller can read no `app_settings` row of a
     project that is closed for voters, which is the normal state while contestants register. It
     answers one `jsonb` object holding exactly `access.contestantApp`, `access.answersLocked`,
     `contestantApp.entityTypes`, `contestantApp.registrationModes` and `analytics.trackEvents`, raw and unvalidated, and the same all-null object for a
     project with no row, a project that declares nothing and an id that names no project.
     `anon_select_app_settings` is not widened by it. A later anon-readable value is added as a member
     of that object, at its storage path, never as a second function.
     `38-contestant-app-public-config.test.sql` pins the surface.

5. **Standard 5-policy pattern** for project-scoped content tables:
   - `anon_select_{table}` -- USING (`project_open_for_voters(project_id)`) TO anon
   - `authenticated_select_{table}` -- USING (`user_can('project', project_id, 'project.read_structure')`
     OR `project_open_for_voters(project_id)`) TO authenticated
   - `admin_insert_{table}` -- WITH CHECK (`user_can('project', project_id, '<write member>')`) TO authenticated
   - `admin_update_{table}` -- USING + WITH CHECK (the same write member) TO authenticated
   - `admin_delete_{table}` -- USING (the same write member) TO authenticated
   - The write member is the one section 3.3 names for that table: `project.edit_structure` for elections,
     constituencies and constituency groups; `project.edit_questions` for questions and categories;
     `project.edit_entities` for the four entity tables; `project.edit_nominations` for nominations.
   - **The read member and the write member must differ.** Check 9001 in
     `apps/supabase/scripts/lint-schema.mjs` is an ERROR-level build gate over the whole estate that
     reddens when a table's read-permission set intersects its write-permission set, when a read policy
     and a write policy share a predicate, or when a policy reaches neither a permission literal nor a
     named mechanism helper. Source: `apps/supabase/supabase/schema/302-rls.sql`.

6. **Special table policies**: not every table follows the standard pattern:
   - `accounts`: the SELECT asks `user_has_account_grant(id)` -- grant existence -- while the writes ask
     `account.edit_settings` at account scope. No `project_id` column.
   - `projects`: SELECT asks `project.read_structure` at project scope; UPDATE asks
     `project.edit_project_settings`; INSERT/DELETE ask `account.manage_projects` at account scope.
   - The four entity tables add an `entity_update_own_{table}` policy asking
     `user_can('entity', id, 'entity.edit_answers', '<the table's entity type>'::public.entity_type)`
     and, in USING and WITH CHECK, `AND NOT private.project_answers_locked(project_id)` (the answers lock,
     below).
   - `nominations` carries three INSERT policies: `admin_insert_nominations`, `entity_insert_nominations`
     and `entity_insert_parent_nominations` (the placeholder-parent path, with its guards), and two
     DELETE policies: `admin_delete_nominations` and `entity_delete_nominations`, the entity's own
     nomination, confirmed or not, under the member 'nomination.edit' on the entity. A placeholder the caller created for another
     entity is not the caller's own; the foreign key on `parent_nomination_id` (NO ACTION) refuses the
     delete while a nomination is listed under the row.
   - **The parent policy pairs the row with the caller.** `entity_insert_parent_nominations` admits an
     organization's or an alliance's unconfirmed row to a caller that already holds, at that contest, a
     nomination of a type that stands under it: `private.caller_nominated_in_contest` takes the caller
     types as its fifth argument, `{candidate, faction}` for an organization's row and `{organization}`
     for an alliance's. All four entity editor roles hold `nomination.create_parent`. The cap of 10
     unconfirmed originated parent nominations is by user (`created_by`) and counts rows the caller
     inserted for an organization or an alliance it edits itself.
   - **The nominations lock is an app setting.** `private.project_nominations_locked(project_id)` reads
     `access.nominationsLocked` from the project's `app_settings` row, and `entity_insert_nominations`,
     `entity_insert_parent_nominations`, `entity_update_nominations` and `entity_delete_nominations` each
     hold `AND NOT` it. The admin policies do not ask it. Only the JSON boolean `true` locks: no row, no key, the string "true" and a
     JSON null are unlocked, and an id that names no project is locked. The row is written under
     `project.edit_app_settings`, which ProjectEditor holds, so a project editor can lock and unlock.
     The frontend reads the same key as the contestant context's `nominationsLocked`.
   - **The answers lock is the other app setting, and it binds every entity-scope write.**
     `private.project_answers_locked(project_id)`, the twin of the nominations lock's helper, reads
     `access.answersLocked` with the same truth table. While it holds, an entity's own editor writes nothing
     of the entity: it is a conjunct of the four `entity_update_own_*` policies and of the four entity-scope
     nomination policies (beside the nominations lock); `storage_path_can` refuses an entity-scope write,
     reading the key inline so no second definer call is nested in it; and `upsert_answers` and
     `set_entity_nominations` refuse with `42501` and `<function>: answers are locked in this project` a
     caller that does not hold `project.edit_entities` / `project.edit_nominations` on the project, so the
     data writer can tell the lock from a row it may not write. **Project grant holders pass it**: no
     admin, project-scope or storage project-scope policy reads it, so a project editor and a project admin
     keep editing answers, profiles, nominations and files while answers are locked.
     `55-answers-lock.test.sql` asserts both sides on every site. The frontend reads the same key as the
     contestant context's `answersLocked`.
   - `feedback`: anon and authenticated INSERT WITH CHECK (true) -- submission is open by design; the
     read and delete sides ask `feedback.read` / `feedback.manage`.
   - Join tables (`constituency_group_constituencies`, `election_constituency_groups`): SELECT delegates
     to the parent `constituency_groups` row through an EXISTS; INSERT/DELETE ask
     `project.edit_structure` through `constituency_group_project_id` / `election_project_id`.

6b. **Never nest a `SECURITY DEFINER` call inside another.** Such a function can never be inlined by the
   planner, so a composition calling two of them pays the per-row cost at depth 2. Measured on the entity
   SELECT path: 271.9 ms anon / 351.9 ms authenticated nested, against 39.4 / 30.0 for the two helpers
   called directly from each policy qual. The eight entity SELECT policies therefore ASSEMBLE the
   visibility rule rather than composing it, and that duplication is guarded -- relatively and absolutely
   -- by `25-matrix-conformance.test.sql` section 5.

7. **Scalar subquery optimization**: ALWAYS use `(SELECT auth.uid())` and `(SELECT auth.jwt())`
   in RLS policies -- wrapping in a subselect makes the planner evaluate them once per query
   instead of once per row. ALWAYS specify `TO anon` or `TO authenticated` on every policy --
   never omit the role target.

8. **Column-level restrictions**: REVOKE table-level UPDATE from authenticated, then GRANT
   UPDATE only on allowed columns. Applies to:
   - `candidates`: protected columns are project_id, external_id, id, sort_order, created_at,
     updated_at.
   - `organizations`: protected columns are project_id, external_id, id, sort_order, created_at,
     updated_at.
   - Admin operations needing protected columns use `service_role` via Edge Functions, which
     bypasses column-level grants.
   - A column grant is one global pair per role and cannot depend on the row. The name columns,
     `short_name` and `confirmed` are therefore in the entity tables' grants and guarded by the trigger
     `enforce_entity_immutability` (Schema Conventions § 8): a confirmed entity's name columns and
     `short_name` are frozen for its own editor.
   - Source: `apps/supabase/supabase/schema/303-column-grants.sql`.

9. **Which entities are mine: the grant is the only link from an auth user to an entity.** No entity
   table carries an auth user id column; an identity is linked to a candidate or an organization by an
   `(entity, <type>, <id>, editor)` row in `public.grants` and by nothing else. One user may hold
   several such rows in one project.
   - `get_user_entities(p_project_id)` lists them. It returns ONE `jsonb` object whose `entities`
     array holds one entry per candidate and per organization the caller edits in that project, each
     with the card fields (`entity_type`, `id`, `first_name` and `last_name` or `name`, `short_name`,
     `image`, `color`, `confirmed`), candidates first and each type by id. A caller with no entity
     still gets one row, with an empty array: the top level is for facts about the caller, and every
     per-entity fact sits inside `entities`. Factions and alliances have no arm. The two facts about the
     caller are `password_set`, whether the caller's own account holds a password, answered by
     `private.caller_password_set()`, and `pending_email_taken`, whether the address the caller's own
     account is changing to (`auth.users.email_change`, non-empty) is already another account's address,
     compared trimmed and lower-cased, answered by `private.caller_pending_email_taken()` (false with no
     pending address and with no caller). Both are in `301-auth-functions.sql`, SECURITY DEFINER with
     an empty search_path, executable by `authenticated` alone, and take no argument, so neither says
     anything about an address or an account the caller merely names. The Contestant App's set-password
     gate reads `password_set` on every load; `36-entity-identity.test.sql` pins both.
   - `get_entity_user_data(p_project_id, p_entity_type, p_entity_id)` returns the editable row of one
     such entity, at most one row. For an entity that is not the caller's, a type that does not match
     the id, another project's entity and an id that does not exist it returns NO ROW. Neither
     function raises, so neither tells "not yours" from "does not exist".
   - `get_entity_nominations(p_project_id, p_entity_type, p_entity_id)` returns the nominations of
     one such candidate or organization, confirmed or not, as ONE `jsonb` array ordered by
     `sort_order` (nulls last) and then `id`. Each element is an allow-list built key by key: `id`,
     `election_id`, `election_name`, `constituency_id`, `constituency_name`, `election_round`,
     `election_symbol`, `confirmed`, `custom_data` and `parent` -- a JSON null, or exactly
     `entity_type`, `entity_id`, `name` and `short_name` of the entity the parent nomination nominates. The two
     names and the parent's are the localized columns as stored. **An empty array means "your entity
     has no nomination"; `NULL` means "no such entity for you"** -- a NULL parameter, a faction or an
     alliance (refused even to its own editor), another user's entity, another project's, an id that
     does not exist. It never raises. It is a SECURITY DEFINER function, as the parent-options read below is and the
     first two reads are not
     (`LANGUAGE plpgsql`, `STABLE`, `search_path = ''`, EXECUTE for `authenticated` only), because a
     parent may be a row the caller's own SELECT policies refuse. Its gate is the same
     `private.caller_entity_ids` lookup, asked before any read, and `user_can` is not asked, so the
     editor of a parent organization does not learn which other parties its candidate stands for.
     `42-entity-nominations.test.sql` pins it; the frontend's one caller is the data writer's
     `getEntityUserData({ loadNominations: true })`.
   - `get_nomination_parent_options(p_project_id, p_entity_type, p_entity_id, p_contests)` returns the
     entities one such candidate or organization may stand under: for a candidate every confirmed
     organization of the project, for an organization every alliance, confirmed or not. One `jsonb`
     array ordered by `sort_order` (nulls last) and then `id`; each element is an allow-list of `id`,
     `entity_type`, `name`, `short_name`, `color`, `image` and `nominated`, the last being those of the
     asked contests at which the option holds a nomination at the election's current round.
     `p_contests` is a JSON array of `{election_id, constituency_id}` objects, and its length is not
     bounded. `NULL`, never a raise, for a refused caller and for a malformed argument; an empty array
     says the project lists nothing the entity may name. SECURITY DEFINER with the same
     `private.caller_entity_ids` gate on the named entity, so a project admin is refused.
     `44-nomination-parent-options.test.sql` pins it; the frontend's one caller is the data writer's
     `getNominationParentOptions`.
   - **The write: `set_entity_nominations(p_entity_type, p_entity_id, p_nominations)`.** The whole set
     of one candidate's or organization's nominations in one call, SECURITY INVOKER with
     `search_path = ''`, EXECUTE granted to `authenticated` by name (the catalogue also lists
     `service_role`, through Supabase's default privileges; `anon` is refused). It inserts what the
     set adds, updates what differs, deletes what the set leaves out and creates the nomination of a
     named parent that has none at the contest; all of it is stored or none. Keys of one object: `id`
     (absent for a new nomination; a JSON null is refused), `election_id`, `constituency_id` (with `id`, another value
     than the stored one is a move: a delete and an insert), `election_symbol` (trimmed, at most 50
     characters) and `parent`, one of `{"kind":"none"}`, `{"kind":"entity","entity_type","entity_id"}`,
     `{"kind":"other","name"}` (trimmed, at most 100 characters) and `{"kind":"keep"}` (only with an
     `id`, not on a move). It answers `{"inserted","updated","deleted","unchanged","parents_created"}`.
     It asks `private.nomination_list_checked` for the array, `private.nomination_object_checked` for
     each object's shape before its own row checks, and `private.parent_nomination_resolved` for an
     `entity` parent (RLS and Auth Patterns § 4).
     - Its reach is the entity's nominations the caller can read, at their election's current round,
       in an election whose type admits the entity's type. A nomination in reach that the set does not
       name is deleted; every other one is left alone, and an `id` that names one is refused.
     - Its own refusals are `22023` (a malformed argument or object, the message beginning
       `set_entity_nominations: ` and naming `p_nominations[<index>]`) and `42501` (no
       'nomination.edit' on the entity; `set_entity_nominations: answers are locked in this project` for a
       caller without `project.edit_nominations` on the project while its answers are locked, asked right
       after the first and before the set is read; a row that could not be written). The guards' refusals pass
       through: `23503` for a removed or moved nomination with nominations listed under it, `P0001`
       beginning `A caller may originate at most ` for the cap, `23514` for the two election-type rules and the constituency rule.
     - **RLS refuses an UPDATE and a DELETE silently**, so the function reads the row count of each and
       raises `42501` on a shortfall. A function that writes under invoker rights and reports success
       must do the same.
     - A row whose values did not change is not written and keeps its confirmation. Every UPDATE that
       writes the custom data states `confirmed` too: off where the custom data carries a requested
       name, as stored otherwise. It can never turn the confirmation on.
     - `entity` compares by the id `private.parent_nomination_resolved` answers through
       `private.nomination_id_in_contest`, so a caller that has not
       changed a stored parent sends `keep`; `entity` over a link to another nomination of the same
       party repoints the row and unconfirms it.
     - Bounded and held to the project: `p_nominations` holds at most 1000 objects, refused before any
       object is read (`set_entity_nominations: p_nominations holds more than 1000 nominations`), and a
       parent that is no entity of the entity's project, an id that names no entity included, is
       refused with `22023` (`set_entity_nominations: p_nominations[<i>] names a parent that is no
       entity of the nomination's project`) for every caller, a project admin included.
     - Not enforced: the named parent is not held to the options of `get_nomination_parent_options`,
       two calls that create the same parent's nomination at once are not reconciled (the second is
       refused whole on `nominations_entity_parent_contest_key` and succeeds when made again; no test
       runs two calls in parallel), and a move leaves behind the parent's nomination an earlier call
       created at the old contest.
     - `43-set-entity-nominations.test.sql` pins it; the frontend's one caller is the data writer's
       `setEntityNominations`, which maps the `23503` and the cap's `P0001` to the named refusals
       `hasCandidates` and `tooManyPending`. The call is listed as scoped by identity in
       `scripts/assert-project-scoped-queries.mjs`: the function takes no project.
   - The first two are SECURITY INVOKER, `LANGUAGE sql`, with no parameter default, refused to `anon` by
     privilege. Both resolve the caller's entities through
     `private.caller_entity_ids(p_project_id, p_entity_type)`, a SECURITY DEFINER helper in
     `301-auth-functions.sql` that reads `public.grants` for `user_id = auth.uid()`,
     `scope = 'entity'`, `role = 'editor'` and the requested type, keeping only entities in the
     requested project.
   - Only the `editor` role names an entity, and `user_can` is never asked: `user_can` answers yes for
     project, account and global admins, and an entity-scope `admin` grant confers nothing. An admin
     with no editor grant is listed with nothing.
   - **An entity is listed exactly when the one-entity read returns it.** Both are "the table says the
     caller edits it" AND "the caller's row-level security admits the row", and row-level security
     reads the table too. So a grant written after the token was issued is listed, read and written at
     once, and a grant removed from the table stops being served at once: the token that still carries
     it reads no row of the entity and its next write is refused. `36-entity-identity.test.sql` pins
     both directions (its `RVK: ` rows).
   - Nothing at write time stops one user editing two candidates in one project.
   - `idx_grants_one_candidate_editor` (a UNIQUE partial index on `grants (target_id)` for
     candidate-editor rows, in `300-auth-tables.sql`) allows one editor per candidate. Organizations
     admit several editors.
   - The editor grant of an identity provider's entity is written by
     `identity_entity_find_or_create` (§ 4), in the transaction that creates the entity; no Edge
     Function writes a grant row.
   - The anon-exposure census in `36-entity-identity.test.sql` permits exactly one column holding an
     auth user id on a table anon can select: `nominations.created_by`. A new exposure turns it red;
     never widen the exemption list to make it pass.
   - `identity-callback` never asks which entities a user edits: one user may edit several, given
     by an administrator or claimed from invitations. It asks whether the one entity the identity
     registered is still its own, and creates it when there is none, in ONE call of
     `identity_entity_find_or_create` (§ 4): one transaction under a per-user advisory lock. The
     function reads the id the account's `app_metadata.registered_entities[<project>][<type>]`
     names inside the lock and confirms it by the user's `(entity, <type>, <that id>, editor)`
     grant and the row in the entity table of that type, in the project. No record: it creates the
     entity, its editor grant and the record in the same transaction, so first sign-ins of one
     identity that arrive together make one entity, and no entity is ever left without its grant.
     A record whose grant or row is gone: `gone`, which the Edge Function answers as `no_entity`,
     and nothing is created, so identifying again does not undo an administrator's removal.
     `findOrCreateOutcome` (`functions/identity-callback/ownEntity.ts`) reads the answer and throws
     (`ERR_ENTITY_RESOLVE_FAILED`) on any other shape, as the Edge Function does on a reported error.

10. **Invitations: a promise mirrors a grant, and the claim is the one function that fulfils it.**
    `public.invitations` (`apps/supabase/supabase/schema/305-invitations.sql`) holds one row per
    promised grant, in the four columns of `public.grants` and with their types, bound to exactly one
    of an email address and the hash of a code. Columns, constraints, indexes, privileges and every
    function's grantees are in `schema-reference.md`; the three policies are in `rls-policy-map.md`
    § _Invitations: the authority map_.
    - **The promise mirrors `grants`.** Same four columns, same two shape CHECKs, no foreign key on
      `target_id`; three more CHECKs admit only project and entity scope, a project-scope target that
      is the row's own project, and a shape whose `grant_role_permissions` is not empty. Account- and
      global-scope promises are refused for every role, the service role included.
    - **The authority map is the policy, written inline.** One policy per command; each arm asks
      `user_can` with a permission literal (`project.edit_entities`, `project.manage_editors`,
      `account.manage_admins`), because check 9001 and the enforcement census read the literals out of
      the policy text. Never move the map into a helper. `create_invitations` is SECURITY INVOKER and
      holds no rule of its own, so a direct insert and the function meet the same refusals.
    - **Server-only columns are filled by a trigger and a transaction-local setting.** `authenticated`
      holds INSERT on the promise, the address and the expiry only. `prepare_invitation` normalises
      the address and generates the code and its hash; the code itself travels to `create_invitations`
      through `openvaa.generated_invitation_code`, is returned once, and is stored nowhere. No API role
      can select `code_hash`, `pending_email` or `pending_email_at`, and nobody holds UPDATE: a row is
      immutable, and "claimed" is `claimed_at IS NOT NULL`.
    - **The duplicate rule is two unique indexes**: one OPEN promise per address per target per
      project whatever the role (`invitations_email_target_key`, NULLS NOT DISTINCT, `WHERE email IS
      NOT NULL AND claimed_at IS NULL`: a claimed row admits a new invitation), and one row per code
      hash per project, claimed or not (`invitations_code_hash_key`).
    - **`claim_invitations(p_project_id)` is the one definer function that writes `grants` for a
      user.** `authenticated` alone may execute it. It trusts the caller's own CONFIRMED address in
      the auth schema's users table (`auth.uid()`'s row), never the token's `email` claim, and takes no address, user
      id or invitation id. An account whose `raw_app_meta_data` names an `identity_provider` claims
      nothing, whatever its confirmed address: the identity provider created it, and its address does
      not decide who the person is (`39-invitations.test.sql` § 24). It claims the open rows addressed to that address and the code rows bound
      to it, each row by itself: a candidate that already has an editor is skipped
      (`candidate_has_editor`) and stays open; an entity no longer in the row's project is skipped
      (`target_not_in_project`); a grant the caller already holds marks the row claimed without a
      second grant. It returns `{claimed, skipped, password_set}`.
    - **The claim cannot know HOW an address was confirmed.** It is sound only while the auth service
      refuses public sign-up and confirms by mail: `config.toml` `[auth] enable_signup = false` and
      `[auth.email] enable_confirmations = true`, held locally by `yarn assert:auth-signup-closed`
      and the E2E project `auth-service-contract`. There is NO in-database guard; on a hosted project
      the dashboard is the control.
    - **A grant reaches a token only when one is issued.** Every entry point runs session, claim,
      refresh, then gates (`apps/frontend/src/lib/auth/sessionAdmission.ts` and the auth callback).
    - **The helpers behind `account-access` are in `public` and executable by `service_role` only**:
      `invitation_code_status`, `invitation_link_request`, `invitation_link_release`,
      `invitation_code_claimant_email`, `invitation_link_witness_open`, `invitation_link_witness`,
      `recovery_link_request`, `address_confirmation_request`, `address_confirmation_release` and
      `address_holds_open_invitation`. Each is SECURITY DEFINER and checks nothing about its caller, so EXECUTE
      is revoked from `PUBLIC`, `anon` and `authenticated` by name: published to an API role, the code
      check is a code oracle and the link request an account oracle that also writes.
    - **The registration-mode condition.** An open invitation for a candidate or an organization is
      honoured only under the mode its binding names (`code` for a row with a code hash, `email` for a
      row bound to an address), for its target type, as the project's stored
      `contestantApp.registrationModes` allows. `private.invitation_mode_allowed(invitations)`
      (`506-invitation-rpcs.sql`) states it once and asks `private.registration_mode_allowed(project,
      type, mode)`, which reads the settings row and asks the IMMUTABLE rule
      `private.registration_mode_allowed_in(settings, type, mode)` (both in `301-auth-functions.sql`;
      false for a project with no row). `invitation_code_status`, `invitation_link_request`,
      `recovery_link_request` and `claim_invitations` treat a refused row as absent (`unknown`; no
      address; neither claimed nor skipped). Project-scope, faction and alliance rows are not judged,
      claimed rows are never judged, and `create_invitations` does not ask. A project that stores no
      matrix honours no candidate or organization invitation (the shipped default allows nothing;
      `seed.sql`'s default project stores a matrix that allows `email` and `code` for candidates and
      nothing for organizations): a pgTAP file with projects of its own writes a matrix in its setup.
      `45-registration-mode-matrix.test.sql` is the rule's truth table, and
      `packages/dev-seed/tests/registrationModeMatrixParity.test.ts` holds the client's
      `isRegistrationModeAllowed` to the same table.
    - **`recovery_link_request(p_project_id, p_email)`** answers `{email, mail}` with `mail`
      `recovery` for a user with that confirmed address holding a grant in the project
      (`private.email_holds_grant_in_project`, shared with `invitation_link_request`), `sign-in` for an
      address with no such user and an open, allowed invitation, and null otherwise. A non-null answer
      takes the address's `link:` and `link-address:` slots, the same slots a link request takes, so
      the two requests are limited together and a later link of either kind stops an earlier unopened one; the caller sends
      exactly one mail of that kind or gives the slot back with `invitation_link_release`. It creates
      no account and binds no address.
    - **Limits live in `private.invitation_throttle`** and are keyed on what a request is about: one
      mail per address per project per 60 s (`link:`), twenty mails per address per day in every
      project together (`link-address:`), one binding per code row per 60 s and five bindings to
      another address per code row per day (`code-bind:<invitation id>`), ten claimant look-ups per
      used code per 15 minutes, which only the code sign-in takes. With an open code the row is bound
      and its cooldown spent before the address's slots are asked, so what the code holder can observe
      does not depend on whether the typed address is invited or holds a grant. An unknown code is defended by its 60 bits alone; nothing counts
      those look-ups. The one key on a caller is `confirm:<user id>`, below.
    - **`address_confirmation_request(p_project_id, p_user_id, p_email)`** decides whether one
      address-confirmation mail may go to an address for a signed-in account. Neither slot is per
      project: a project the request names freely would hand a caller a fresh budget per project id. It
      answers false, writing nothing, unless the user's `registered_entities` record (in
      `raw_app_meta_data`, written by the service role alone) names `p_project_id`; then it takes the
      account's slot (`confirm:<user id>`, ten per 15 minutes, counted even when refused) and the
      address's slot (`confirm-address:<sha256 hex>`, one per 60 s), and answers true only when both
      were taken. The address's slot is not the link mails' `link:` slot: a change-of-address link
      neither stops nor is stopped by a sign-in or recovery link, so the two kinds are limited each on
      its own. The operation that sends that mail tells its caller whether the address is another
      account's, so the account's own slot keeps it from being a bulk address oracle. A null or blank
      argument answers false and writes nothing; it writes nothing but the two throttle rows, and
      `address_confirmation_release(p_email)` gives the address's slot back. Service role only;
      `48-address-confirmation-request.test.sql` pins both.
    - **`address_holds_open_invitation(p_project_id, p_email)`** answers whether an OPEN invitation of
      the project holds the address, trimmed and lower-cased, as its `email` or its `pending_email`:
      `claimed_at IS NULL` and no `expires_at` or one in the future; the registration-mode matrix is
      not asked. A null argument or a blank address answers false; it writes nothing. `confirm-address`
      asks it after `address_confirmation_request` has taken both slots and answers `in-use` on true,
      so an identity provider's account, which claims no invitation, cannot take an invited address.
      Service role only; `57-address-holds-open-invitation.test.sql` (`AOI: `) pins it.
    - **`create_invitations(p_project_id, p_invitations, p_confirm_entity)`: the call states the
      confirmation.** `p_confirm_entity` is required and has no DEFAULT, there is no two-argument form,
      and `NULL` is refused (`create_invitations: p_confirm_entity must be true or false`). `true`
      confirms each named entity of the batch (`confirmed = true`, as the caller, so
      `enforce_entity_immutability` asks `entity.confirm`; a candidate is named when both its names are
      non-blank, another type when its `name` has text); `false` confirms none; no call unconfirms an
      entity, and no item key overrides the call's value. `SupabaseAdminClient.createInvitations`
      (`@openvaa/dev-seed`) sends `true` unless told otherwise; the E2E admin client's `inviteByEmail`
      and every `invitationFlow` seeding step require the value. A confirmed entity with a confirmed
      nomination is public once its project opens, whether or not anyone signed in, so an invitation
      changes what voters see only by what its call states. A direct insert into the table confirms
      nothing.
    - **The `nominations` key.** An entity-scope item for a candidate or an organization may carry
      `nominations`, a JSON array of at most 1000 objects: `set_entity_nominations`' keys
      (`election_id`, `constituency_id`, `election_symbol`, `parent`) plus `confirmed` (required), an
      optional `id` of the invited entity's nomination to update, an optional `election_round` (the
      election's current round when absent), `custom_data` (never carrying
      `requestedParentOrganization`) and the presentation columns. Every id is a uuid. The objects are
      checked by the three private functions `set_entity_nominations` asks, under the label
      `p_invitations[<i>].nominations[<j>]`, and written as the caller, created or updated and never
      deleted; an `id` object moves nothing (its election, constituency and a stated round must be the
      stored row's). A parent's nomination the call creates is unconfirmed, so a confirmed nomination
      under an unconfirmed parent nomination is a state the call can produce (how the voter app shows
      it is unobserved). Every UPDATE reads back the confirmation it wrote and raises `42501`
      `... could not be written as stated` on a difference. Refused with `22023`: the key on a
      project-scope item or for a faction or an alliance, one entity's nominations on two items, and an
      invited entity that is no entity of the project the caller can read (so an unreadable entity and an absent id get the same refusal), or a parent that is no entity of the project. A call that wrote a nomination
      forces `nominations_parent_required` after its last item. Each item answers `entity_confirmed`
      (null on a project-scope item) and, when it stated the key, `nominations` =
      `{"inserted","updated","unchanged","parents_created"}`.
    - **The map is asked when the row is written and not again**: a claim honours a promise whose
      seeder has since lost authority, and a promise is withdrawn by deleting the unclaimed row.
    - `39-invitations.test.sql` holds all of the above but the `nominations` key, which
      `47-invitation-nominations.test.sql` holds with the confirmation's states and the answer;
      `07-rpc-security.test.sql` § 8c and
      `25-matrix-conformance.test.sql` hold the censuses the model moved.

## Service Patterns

1. **Edge Function pattern**: 3 Edge Functions in `apps/supabase/supabase/functions/`:
   `account-access`, `identity-callback` and `send-email`. No function decides authority in
   TypeScript and none reads the token's `grants` claim.
   - **A function that acts for a signed-in caller asks `public.user_can` through the caller's OWN
     token**, via `apps/supabase/supabase/functions/send-email/callerAuthority.ts`
     (`callerMayOnProject(callerClient, projectId, 'project.edit_entities')`, which fails closed on
     anything but a literal `true`), and refuses
     with 403 BEFORE the `service_role` client is created. An entity-scope question goes through the
     same file's `callerMayOnEntity(callerClient, entityType, entityId, permission)`, which makes the
     type mandatory: `user_can`'s `p_target_type` is optional, so an untyped entity-scope call
     compiles and is silently denied. Only after that gate does the function use `createClient()`
     with `service_role` for privileged operations. `send-email` is the one such function, so the
     module exists once; a second function that needs the gate holds a byte-identical copy and the
     module joins `DUPLICATED_MODULES` in `scripts/assert-edge-env-defaults.mjs`.
   - `account-access`: ANONYMOUS by design for four of its five operations (called with the anon
     key and no user token); the fifth, `confirm-address`, takes the caller's OWN access token and
     acts for that account alone. It decides no authority in TypeScript either: it asks the
     database. One `POST` endpoint, every body carrying `operation` and `project_id` -- the project
     comes from the REQUEST, and the function reads none from its environment. `check-code` answers `valid` / `used` / `unknown`
     from `invitation_code_status`. `request-link` answers `{ accepted: true }` ALWAYS and BEFORE
     any work (`EdgeRuntime.waitUntil`), so status, body and timing say nothing about an address;
     `invitation_link_request` then decides whom a mail may go to (one per address per 60 s).
     `request-recovery` answers the same way, before any work, and then asks
     `recovery_link_request`: for `recovery` it mints a `recovery` token for the existing account
     (`generateLink({ type: 'recovery' })`) and mails the recovery mail; for `sign-in` it does what
     `request-link` does; for null it stops. `code-sign-in` asks `invitation_code_claimant_email` and
     the auth service's password grant; it does not ask the registration-mode matrix. All of these
     are `service_role`-only functions in `506-invitation-rpcs.sql`. A link is issued
     only when the served auth settings say `disable_signup: true` and `mailer_autoconfirm: false`
     and the redirect allowlist admits `<SITE_URL>/<locale>/auth/confirm`. A first-time
     invitee's user is created WITHOUT a password (`generateLink({ type: 'invite' })`, token
     discarded), then a `magiclink` token is minted and mailed as a fixed text in one of seven
     locales. It writes NO grant: an invitation is a row of `public.invitations` that promises one,
     `create_invitations` seeds rows and sends nothing, and `claim_invitations` (a definer RPC only
     `authenticated` may execute) writes the promised grants for the caller's own confirmed
     address. A grant reaches a token only when one is issued: claim, THEN refresh the session.
     `confirm-address` (`addressConfirmation.ts`) proves a typed address for an account an
     identity provider made, still on its placeholder: with no accepted token it answers 401
     `unauthenticated`; an account whose `app_metadata` names no `identity_provider`, or whose
     address is no longer the placeholder, a project its `registered_entities` record does not
     name, and a typed address on the placeholder domain are `refused` before any slot. It then
     takes the account's `confirm:` slot and the address's `confirm-address:` slot, neither per
     project, through `address_confirmation_request` (both, or `refused`), asks
     `address_holds_open_invitation` whether an open invitation of the project holds the address
     (true is `in-use`, slot given back: the account claims no invitation, so the invited person
     signs in by email), asks the auth
     service for `generateLink` `email_change_current` and `email_change_new` (an `email_exists`
     answer is `in-use`, slot given back), verifies the current address's token itself (which
     leaves the typed address pending and changes nothing else) and mails the new address's
     `type=email_change` link. The typed address is never written to the account: it becomes the
     account's only when that link is opened. The one admin update carrying an address
     (`restoreAddress`) puts the account's own placeholder back when verifying the current token
     answered with a session, i.e. the change completed alone because the auth service's secure
     email change (`double_confirm_changes`) is off; the request is then `refused` and nothing is
     mailed. That setting is a required deployment setting. The `in-use` answer is the one address-existence
     answer, given to a signed-in caller about their own typed address behind both slots; it says
     that another account holds the address or that an open invitation does, and the second is an
     invitation-existence answer ACCEPTED as a residual under the same bounds. The auth
     service answers the same question to an account's own `PUT /auth/v1/user` with an address
     another account holds (422 `email_exists`), outside these slots; that oracle is ACCEPTED as a
     residual (no auth hook runs before a user's own email change; a hosted project's per-IP limit
     on `/auth/v1/user` applies).
   - `identity-callback`: answers the FRONTEND SERVER ALONE. A request without the
     `x-identity-callback-secret` header, or with a value other than
     `IDENTITY_CALLBACK_SERVER_SECRET` (constant-time compare, `serverCredential.ts`), is answered
     401 `refused` before the body, the configuration or the token is read. Body:
     `{ id_token, project_id (uuid, required), entity_type? }`; the project comes from the REQUEST
     and the function reads none from its environment. It verifies the JWE/JWT, decides the entity
     type from the project's stored registration-mode matrix BEFORE any account or row is touched
     (`registrationMatrix.ts`; the authority, the frontend's checks only select), finds the account
     by `app_metadata.identity_match_value` or creates it by `generateLink({ type: 'invite' })` on
     a placeholder address (no password, no `createUser`); a failed invite is followed by a look-up
     of the account on the placeholder, so a request that lost the race to create the account goes
     on with the one another request made. It then finds or creates the identity's own entity
     through ONE call of `identity_entity_find_or_create` (RLS and Auth Patterns § 9): one
     transaction under a per-user advisory lock, which creates a confirmed candidate or an
     unconfirmed nameless organization with its editor grant and the `registered_entities` record.
     Only after that call does it write `app_metadata` (with the placeholder's confirmation for an
     account it has just created), because the auth service writes the whole of `app_metadata` from
     the copy it read when the update began; and only THEN generates a `magiclink` for the
     account's current address, so the session the caller makes already carries the grant. It
     AUTHENTICATES an identity and has its entity grant written; it authorises nothing.
     `app_metadata` holds exactly `identity_provider`, `identity_match_prop`,
     `identity_match_value` and `registered_entities` (`appMetadata.ts`); the Edge Function's write
     carries no record, which the database function alone writes, and sends `hetu` and `birthdate`
     as null, which removes them. Every answer is one closed `result` (`requestContract.ts`):
     `created`, `found`, `no_entity` (200, with `token`), `refused` (401), `mode_not_allowed` (403),
     `invalid_token` (401), `bad_request` (400), `configuration` (500), `unavailable` (503).
   - `send-email`: gated as above; resolves per-recipient email variables in the configured
     project and sends via SMTP (nodemailer).

2. **Bulk import RPC**: `bulk_import(data jsonb)` processes collections in dependency order:
   elections -> constituency_groups -> constituencies -> organizations -> alliances -> factions
   -> candidates -> question_categories -> questions -> nominations -> app_settings. Uses
   `_bulk_upsert_record()` helper with `INSERT ON CONFLICT (project_id, external_id) DO UPDATE`.
   Relationship fields resolved via `resolve_external_ref()`. SECURITY INVOKER -- admin RLS
   policies enforced. Source: `apps/supabase/supabase/schema/501-bulk-operations.sql`.
   - The helper skips the keys in its `skip_columns` list: `id`, `created_at`, `updated_at`,
     `project_id` (added by the helper itself) and `entity_type`. **`entity_type` is skipped on
     `nominations` only**, where the column is generated; on `question_categories` and `questions` it
     is carried, and `validate_entity_type_list` checks it. An item states it as an array
     (`["organization"]`), never as a bare string.
   - An import meets both validation triggers: a refused `entity_type` or entity `color` raises and the
     whole call rolls back.
   - **Two keys are links, not columns.** An `elections` item may carry `constituency_groups` and a
     `constituency_groups` item `constituencies`, each a JSON array of references `resolve_external_ref`
     reads, every one naming a row of the item's own project. `bulk_import` takes the key off the item
     with `-` before `_bulk_upsert_record` (so `skip_columns` does not name them and the counts are those
     of the item without them) and writes `election_constituency_groups` and
     `constituency_group_constituencies` with `ON CONFLICT DO NOTHING` once the `constituencies` turn is
     done, whether or not the payload holds that collection, and before `nominations`: a nomination is
     judged against its election's constituencies when it is inserted. No link is ever removed.
     A value that is not an array raises `Collection "<c>" item <id>: <key> must be a JSON array of
     references`. The join tables' own write policies decide under a project admin's call.
     `53-bulk-import-constituency-links.test.sql` pins it; dev-seed's `SupabaseAdminClient.bulkImport`
     sends the links this way.
   - `DENIED_BY_TABLE` in `packages/dev-seed/src/template/permittedKeys.ts` mirrors the skip condition,
     and a parity test in that package reads `skip_columns` from the SQL, so the two change together.

3. **Bulk delete RPC**: `bulk_delete(data jsonb)` processes in reverse dependency order to avoid
   FK violations. Deletion modes: prefix-based (LIKE prefix%), UUID list, external_id list.
   SECURITY INVOKER. Source: `501-bulk-operations.sql`.

4. **Storage buckets**: `public-assets` (public=true, 500MiB) and `private-assets` (public=false,
   500MiB).
   - Path convention: `{project_id}/{entity_type}/{entity_id}/filename.ext`.
   - Path convention, precisely: `{project_id}/{type segment}/{entity_id}/filename.ext`, where the
     type segment is the TABLE NAME (`candidates`, `elections`, `questions`, ... or `project`).
   - 15 storage RLS policies, partitioned across exactly TWO mechanisms: **14** route their authority
     question through `storage_path_can` -> `user_can`, and **1** -- `anon_select_public_assets` --
     routes through `storage_path_is_public`, because anon has no `auth.uid()`, so it holds no grant row
     and `user_can` denies it by construction. **None routes through neither.**
   - `storage_path_can` refuses an entity-scope write while the project's answers are locked (RLS and
     Auth Patterns § 6); a project-scope write and every read are unaffected.
   - ⚠ No storage policy names `user_can` in its own `pg_policies` expression; the reach is through
     `storage_path_can`. Anything measuring that partition must compute reach TRANSITIVELY.
   - Storage cleanup (162.1): `delete_storage_object()` deletes ONE object per call via
     `net.http_delete` on `/storage/v1/object/{bucket}/{path}`, and only a path that matches the
     upload-convention whitelist, lies in the row's own folder and is no longer referenced by the new
     row (D-20). Storage never expands a prefix, so an entity DELETE enumerates its own folder from
     `storage.objects` with `starts_with` (not LIKE: `_` in `constituency_groups` is a wildcard) and
     deletes each object. An image UPDATE deletes the old `image.path`/`pathDark`; an `answers` UPDATE
     deletes old answer photos via `cleanup_old_answer_files`, detected by value shape (never a
     `questions` join, because the question-delete cascade strips the key after the question is gone).
   - `delete_storage_object` and `referenced_storage_paths` are NOT callable by API roles (EXECUTE
     revoked from PUBLIC, anon, authenticated); only the SECURITY DEFINER triggers call them.
   - Testing: pgTAP (`31-storage-cleanup.test.sql`) asserts the ENQUEUED request on
     `net.http_request_queue`, never the disappearance, because pg_net sends after COMMIT and every
     pgTAP file rolls back. `tests/tests/specs/storage/storage-cleanup.spec.ts` observes the
     disappearance in committed state (public GET of a deleted object answers 400).
   - Policy C1+ (random UUID names; a once-public URL stays valid after unpublishing) and the orphan
     residue left before 162.1 (no sweep) are recorded above `delete_storage_object`.
   - Source: `apps/supabase/supabase/schema/400-storage.sql`.

5. **Email variable resolution**: `resolve_email_variables(p_user_ids, p_template_body,
p_template_subject)` is SECURITY DEFINER (reads auth.users). For each user: looks up role via
   `public.grants`, resolves candidate fields (first_name, last_name, organization.name), nomination
   context (constituency.name, election.name). Returns user_id, email, preferred_locale,
   variables as flat JSONB. Source: `apps/supabase/supabase/schema/502-email-helpers.sql`.
   - **The `p_` prefix is load-bearing when calling from JS.** PostgREST resolves function
     overloads by **named** argument, so `supabaseAdmin.rpc('resolve_email_variables', { user_ids,
... })` does not resolve to this function at all -- it fails at the call, not at compile time.
     Argument keys must match the SQL parameter names exactly (`502-email-helpers.sql:22-25`).
   - Known gap: the function currently ignores `p_template_body` / `p_template_subject` and returns
     the full variable set regardless. Filtering to the variables a template actually references is
     scheduled work, not present behaviour.

6. **`identity-callback` binds both audience and issuer UNCONDITIONALLY, and fails closed when
   either is unconfigured.** `IDENTITY_PROVIDER_CLIENT_ID` sets `jose` `audience`;
   `IDENTITY_PROVIDER_ISSUER` sets `issuer`. The issuer check is what binds a signature-valid token
   to the provider we configured -- the frontend's verifier
   (`lib/api/utils/auth/getIdTokenClaims.ts`) already applied it, and this function is reachable
   directly at `/functions/v1/identity-callback` without passing through the frontend, so omitting
   it left the weaker of the two paths publicly callable.
   - `requireVerifyClaimBinding()` in `functions/identity-callback/verifyConfig.ts` sits on the path
     to `jose.jwtVerify`, so the binding is structural for every caller rather than a single env read
     beside one call site. An absent value and an empty string are treated alike as unconfigured, and
     it throws `ERR_AUDIENCE_UNCONFIGURED` / `ERR_ISSUER_UNCONFIGURED` -- the same code strings the
     frontend verifier uses. Throw messages are opaque and echo no configured value, because the
     caller who triggers them is unauthenticated.
   - **Why an optional binding buys nothing:** `jose` performs a PRESENCE check on `aud` / `iss`
     whenever the option is not `undefined`, but compares the option's VALUE only under a truthiness
     test. An omitted option is no binding at all; an empty-string option requires only that the
     claim exist. Either way the verifier accepts any token signed by a key in the configured JWK
     set, including one minted by a different issuer for a different relying party.
   - ⚠ **This paragraph previously said the opposite** -- "each only when configured", and that a
     deployment which had configured neither "keeps its behaviour instead of failing closed on
     upgrade". That fail-open was removed by `869a01d60` (REVIEW-EDGE-05, operator decision O1),
     which also deleted the in-source comment arguing for it. Do not reintroduce the optional form.

7. **Edge Function environment variables are required, never defaulted.** `requireEnv(name, value)`
   throws `ERR_ENV_UNCONFIGURED` naming the variable; an absent value and an empty string are both
   unconfigured, and every other string is returned unchanged, including `'0'` and `'false'`.
   - Required per function, all read through `requireEnv`: `identity-callback` --
     `IDENTITY_PROVIDER_TYPE`, `IDENTITY_PROVIDER_DECRYPTION_JWKS`, `IDENTITY_PROVIDER_JWKS_URI`,
     `IDENTITY_PROVIDER_CLIENT_ID`, `IDENTITY_PROVIDER_ISSUER` (the last two through
     `requireVerifyClaimBinding`, § 6) and `IDENTITY_CALLBACK_SERVER_SECRET`, the server's
     credential, which the frontend server holds too (`$lib/server/constants`) and sends in
     `x-identity-callback-secret`; it is read only for a request that carries the header, so an
     anonymous call is refused before any configuration is read. No `PUBLIC_PROJECT_ID` and no
     `SITE_URL`: the project is the request's, and the sign-in token is handed to the caller, not
     mailed. `account-access` -- `SITE_URL`, `SMTP_HOST`, `SMTP_PORT` and `SMTP_FROM`
     (and no project variable: its project is the request's); `send-email` -- `PUBLIC_PROJECT_ID`,
     `SMTP_HOST`, `SMTP_PORT`, and `SMTP_FROM` (always the sender; a request `from` is refused
     unless it equals it -- 162-REVIEW WR-02).
   - `envConfig.ts` is a **byte-identical triplicate**, one copy per function directory
     (`account-access`, `identity-callback`, `send-email`), because
     Supabase treats each top-level function directory as its own deployment unit and this repo has
     no shared-module directory for Edge Functions. The copies are held identical by
     `scripts/assert-edge-env-defaults.mjs`, whose `DUPLICATED_MODULES` names this module alone.
     Edit all three or none. Its test is
     `apps/supabase/supabase/functions/send-email/envConfig.test.ts`.
   - The defect this replaced: a `Deno.env.get('X') || fallback` chain fell back from `SITE_URL` to
     the Supabase API host, so an unset variable addressed candidate invite links at the API origin
     -- a link the recipient cannot use, from a deployment that reported no error at all.

8. **JWT segments are decoded as base64url, not base64.** `decodeJwtSegment()` in
   `apps/supabase/supabase/functions/send-email/jwtSegment.ts`, the one copy; no `index.ts` imports
   it, because no function decodes a token itself. RFC 7515 §2 has required base64url for
   JOSE segments since 2015, and Deno has no `Buffer`, so `Buffer.from(seg, 'base64url')` is
   unavailable inside an Edge Function. Two measured corrections recorded in that file, both
   contradicting how the fix was originally requested: it is the **alphabet** that breaks, not the
   padding (`atob` implements WHATWG forgiving-base64 and accepts unpadded input at every length
   class a real JWT segment can produce; it rejects `-` and `_`), and the defect is **latent** -- 0
   of 2,205 realistic Supabase access-token payloads produced a segment containing either character.

9. **`send-email` placeholder substitution is whitespace-tolerant and looks keys up FLAT.**
   `renderTemplate(text, vars)` in `functions/send-email/templateVars.ts`. A captured key containing
   a dot is one key whose text contains a dot -- **not** a path into a nested object.
   `public.resolve_email_variables` (`502-email-helpers.sql`) is the producer and emits its keys
   already dotted (`candidate.first_name`, `organization.name`,
   `nomination.constituency.name`) via `jsonb_build_object` into a single flat JSONB object with no
   nesting anywhere. Resolving the `(?:\.\w+)*` group as a traversal would find nothing and break
   every placeholder in the product; decision D-D4 rejected that and kept the lookup flat.

## pgTAP Testing Conventions

1. **Test infrastructure**: pgTAP extension loaded in `00-helpers.test.sql`. **47** files in
   `apps/supabase/supabase/tests/database/` (`00` to `47`; there is no file `13`), alphabetically
   ordered execution: `00-helpers` is the persistent-helper phase and runs its own smoke tests under
   `no_plan()`, and the other **46** declare plans summing to **2594**. A run reports
   `Files=47, Tests=2603` (the difference of 9 is `00-helpers`). Run with
   `supabase db reset` to reload helpers, then `supabase test db`. The largest file is
   `39-invitations.test.sql`, `plan (329)`; `07-rpc-security.test.sql` is `plan (44)`.
   - `39-invitations.test.sql` counts only the `private.invitation_link_witness` records it opens, so
     the rows an E2E run leaves there (no teardown removes them) do not redden it. For the per-file
     plans, read them from the files:
   `git grep -n -E "^  plan \(" -- 'apps/supabase/supabase/tests/database/*.test.sql'`.
   - The suite is run on a freshly reset database by every gate, so it is shown green on migrations
     plus `seed.sql` only; a run on a database that holds seeded or E2E data is unmeasured.

2. **Two-phase architecture**: Phase 1 (persistent helpers): `00-helpers.test.sql` creates
   functions OUTSIDE a transaction (COMMITted). These persist for subsequent test files.
   Phase 2+ (test transactions): each file runs in BEGIN/ROLLBACK. Calls `create_test_data()`
   for fresh fixtures, runs tests, ROLLBACKs for clean isolation.

3. **4 core helper functions**:
   - `test_user_id(name)`: returns predictable UUID for 8 test users (admin_a, admin_b,
     candidate_a, candidate_b, candidate_a2, organization_a, super_admin, account_admin_a).
   - `test_id(entity_name)`: returns predictable UUID for ~25 test entities.
   - `test_user_grants(name)`: returns the `public.grants` ROWS a named identity holds, as the
     fixture's authority map -- written down in exactly one place, and this is it. **There is no
     `test_user_roles`; 162-15 renamed it and the question it answered no longer exists.**
   - `test_seed_fixture_grants()`: writes the whole fixture's authority rows into `public.grants`.
     Whole-fixture deliberately: a per-identity write reddens assertions about an identity that was
     read about but never impersonated.
   - `set_test_user(role, user_id?, user_grants?)`: simulates an authenticated/anon user by setting
     role, request.jwt.claims and request.jwt.claim.sub via `set_config()`. The claim is projected
     from `public.grants` by `test_grants_claim`, the same path the Access Token Hook takes; `user_can`
     reads the table for the `sub`, so a file that edits the claim by hand changes nothing it decides. The third
     argument WRITES the rows it describes AND asserts they are set-equal to the table's projection;
     pass `'[]'::jsonb` when the identity's authority is already in the table.

4. **User impersonation pattern**: Always call `set_test_user('authenticated',
test_user_id('admin_a'), test_user_grants('admin_a'))` before assertions, and `reset_role()`
   after to switch back to postgres superuser for fixture operations. A file that inserts its own
   grant rows passes `'[]'::jsonb` instead, so the claim comes from the table and from nowhere else.

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
   accounts, 2 projects, 8 auth.users, full entity hierarchy. Project A is `open_for_voters` and its
   entities and nominations are `confirmed`; Project B is neither. This enables testing both the
   public and the non-public direction, and cross-tenant isolation.

## Reviewing Database Changes

1. Every new content table has all common columns (id, project_id, name, external_id,
   etc.) with correct types and defaults. There is no per-row publication column: 162-16 deleted the
   last of them, and public visibility is section 3.4's all-of rule
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
    order in `501-bulk-operations.sql`)
13. The change is one commit with three parts: the `schema/` edit, a new numbered migration
    appended after the last one, and its line in `migrations.manifest.json`; no listed migration is
    edited. `yarn check:schema-equivalence` passes, and the new migration is read before it is
    committed

### What `yarn db:lint:sql` does and does not reach

`apps/supabase/scripts/lint-schema.mjs` runs `supabase db lint` plus its own checks against a **live
local database** at `DATABASE_URL`, defaulting to `postgresql://postgres:postgres@127.0.0.1:54322/postgres`.
It therefore requires `yarn db:start` first; against a stopped stack it reports nothing useful.

Two corrections worth knowing, because both made this gate report confidently wrong things:

- **The port default was `54332`** -- a database that exists nowhere in this project (`config.toml`
  binds Postgres to `54322`). The linter had been "passing" against a connection it never made.
- **The FK-index check compared misaligned column arrays.** `pg_constraint.conkey` is a **1-based**
  `smallint[]`; `pg_index.indkey` is an `int2vector`, which is **0-based**. Slicing both from 1
  compared the FK's columns against the index's _second..Nth_ columns, so **every single-column FK**
  came back `'{n}' = '{}'` and was reported as unindexed. `indkey` is now sliced from 0, and the
  check is scoped to `connamespace = 'public'` so the report is not dominated by Supabase-managed
  `auth.*` and `storage.*` tables the project cannot act on.

Check `0013` covers only the **"RLS enabled"** half of the standard policy pattern -- a table with
RLS on and a single policy passes it. Nothing checks the 5-policy shape, the `(SELECT auth.uid())`
scalar-subquery form, or the common-column set. Those are review items, not gate items; do not cite
`db:lint:sql` as evidence for them.

## Key Source Locations

- Schema files (the hand-edited source): `apps/supabase/supabase/schema/000-enums.sql` through `900-test-helpers.sql` (29 files)
- Migrations (what `db reset` and `db push` apply, never edited once listed): `apps/supabase/supabase/migrations/` (1 file, the frozen baseline `00001_initial_schema.sql`), listed with their sha256 in `apps/supabase/supabase/migrations.manifest.json`
- Invitations: `apps/supabase/supabase/schema/305-invitations.sql` (table, policies, code functions), `506-invitation-rpcs.sql` (seeding with the stated confirmation and nominations, the claim, the `service_role` helpers, the throttle and witness tables)
- Schema linter: `apps/supabase/scripts/lint-schema.mjs` (`yarn db:lint:sql`)
- RLS policies: `apps/supabase/supabase/schema/302-rls.sql` (main), `303-column-grants.sql` (column restrictions), `400-storage.sql` (storage policies)
- Auth hooks: `apps/supabase/supabase/schema/301-auth-functions.sql`
- Validation triggers (nominations, entity immutability, entity type list, entity colour): `apps/supabase/supabase/schema/011-validation-functions.sql`
- Edge Functions: `apps/supabase/supabase/functions/account-access/`, `identity-callback/`, `send-email/`
- Bulk RPCs: `apps/supabase/supabase/schema/501-bulk-operations.sql`
- pgTAP tests: `apps/supabase/supabase/tests/database/` (47 files, `00-helpers` through `47-invitation-nominations`)
- Nominations: `apps/supabase/supabase/schema/104-nominations.sql` (table, triggers, the constraint trigger), `011-validation-functions.sql` (the matrix and the trigger functions), `301-auth-functions.sql` (the `private` guards), `302-rls.sql` (the policies), `503-entity-rpcs.sql` (`get_entity_nominations`, `get_nomination_parent_options`, `set_entity_nominations`, and the three private write rules `nomination_list_checked`, `nomination_object_checked` and `parent_nomination_resolved`)
- Supabase config: `apps/supabase/supabase/config.toml`
- Generated types: `packages/supabase-types/src/database.ts`
- Column/property maps: `packages/supabase-types/src/column-map.ts` (COLUMN_MAP, PROPERTY_MAP)
- Seed data: `apps/supabase/supabase/seed.sql`

## Cross-Skill Interfaces

- JSONB localization storage `{"en": "...", "fi": "..."}` maps to TypeScript `LocalizedValue` -- the data skill owns the TypeScript type; this skill owns the SQL storage format and `get_localized()` function.
- DB enums (entity_type, question_type, category_type) must stay in sync with the data package's TypeScript equivalents (ENTITY_TYPE, QUESTION_TYPE, QUESTION_CATEGORY_TYPE).
- The nomination-shape matrix is stated twice, in `public.nomination_shape_rule` here and in `nominationShape.ts` of the data package (the data skill owns it). The four names of `NOMINATION_SHAPE` are held equal to the members of the enum `nomination_shape`, and a grid over the same sixteen cells is asserted on each side: `nominationShape.test.ts` and the election-type section of `08-triggers.test.sql`. A change to one statement changes the other in the same commit.
- `packages/supabase-types/` provides the bridge: `database.ts` has generated Row/Insert/Update types per table; `column-map.ts` has bidirectional COLUMN_MAP (snake_case DB -> camelCase TS) and PROPERTY_MAP (reverse). Only maps columns where names differ (e.g., sort_order -> order, first_name -> firstName). Used by frontend data adapters.

## Reference Files

- For complete table column listings, triggers, indexes, and the COLUMN_MAP/PROPERTY_MAP bridge, read [schema-reference.md](schema-reference.md)
- For the role-capability matrix showing what each role can do on each table, read [rls-policy-map.md](rls-policy-map.md)
- For step-by-step guides to adding tables, RLS policies, and pgTAP tests, read [extension-patterns.md](extension-patterns.md)

## Freshness Record

**Reviewed 2026-08-29** (Phase 153, plan 153-08) at HEAD `7d6aaac47`, branch
`integration/ship-12-squash`. Previous baseline -- the last commit touching `.claude/skills/database/`
-- was `14afb2d80` (2026-08-17). `.claude/scripts/audit-skill-drift.sh` reported
`DRIFT 21 commits, 69 files` across this skill's two targets: `apps/supabase/` (18 commits, 66 files)
and `packages/supabase-types/` (3 commits, 3 files).

**Updated 2026-09-18** (Phase 162.1, plan 162.1-03): storage cleanup rewritten in Schema Conventions
§ 8 and Service Patterns § 4 -- single-object `net.http_delete`, the D-20 whitelist and own-folder
limits, folder enumeration on entity delete, `cleanup_old_answer_files`, the revoked EXECUTE, and the
`31-storage-cleanup.test.sql` / `storage-cleanup.spec.ts` split between enqueued and observed. The
2026-08-29 review below is otherwise unchanged.

**Updated 2026-10-02** (Phase 166, plan 166-04): entity identity now comes from grants alone. RLS and
Auth Patterns gains § 9 (the grant as the only link from a user to an entity, through
`private.caller_entity_ids`, editor role only, per project, `idx_grants_one_candidate_editor`,
`writeEntityGrant`'s named idempotent key, the `36` anon census); the indexing bullet for the dropped
entity link column and that column's entries in § 8's protected lists are removed; Service Patterns
§ 1's `identity-callback` bullet describes the grant-only link and the compensating delete.

**Updated 2026-10-06** (Phase 171, plan 171-02): `contestant_app_public_config` added. RLS and Auth
Patterns § 4 names the six anon-executable definer functions the § 8c census holds and describes the
new one; `schema-reference.md` and `rls-policy-map.md` carry its row, and the latter lists
`38-contestant-app-public-config.test.sql` among the tests.

**Updated 2026-10-06** (Phase 173, plan 173-02): the caller's entities are a list. RLS and Auth
Patterns § 9 describes `get_user_entities` (one `jsonb` object with an `entities` array, one row even
for a caller with no entity) and `get_entity_user_data` (the editable row of one entity, or no row),
that neither raises, and that an entity is listed exactly when the read returns it, including under a
token older than a grant or one that outlives it. `schema-reference.md` carries both function rows.
`idx_grants_one_candidate_editor` and `writeEntityGrant` are as before.

**Updated 2026-10-07** (Phase 174, plan 174-07): the Edge Functions are `account-access`,
`identity-callback` and `send-email`. Service Patterns § 1 describes all three, `account-access`
as anonymous and asking the database; § 7 lists the variables each requires and names the three
directories of the `envConfig.ts` triplicate; § 8 and RLS and Auth Patterns § 9 name
`jwtSegment.ts`, `callerAuthority.ts` and `entityGrant.ts` as single copies. The counts this skill
states (tables, policies, schema files, pgTAP files and assertions, the definer census of
`07-rpc-security.test.sql` § 8c) are not re-measured by this update.

**Updated 2026-10-07** (Phase 174, plan 174-10): the invitation model, and every count this skill
states about tables, policies, schema files, migrations, pgTAP files and assertions, and the definer
census. RLS and Auth Patterns gains § 10 (the promise mirrors `grants`; the authority map is the
policy; server-only columns come from a trigger and a transaction-local setting; `claim_invitations`
is the one definer function that writes `grants` for a user; the `service_role`-only helpers; the
limits) and § 4 names the eight functions of the `authenticated` census. `schema-reference.md` carries
the `invitations` table, the two `private` tables and every function of the model with its grantees;
`rls-policy-map.md` carries the three policies, the four members no policy reads and the three
same-permission exemptions. Reviewing § 13 and two Key Source Locations entries said that a schema
change is applied to two copies by hand and that `migrations/` holds three files; both now describe
the generated single migration. Each number, with the command that produced it on this date:

| Statement | Value | Command |
|---|---|---|
| tables in the applied `public` and `private` schemas | 21 and 4 | `select table_schema, count(*) from information_schema.tables where table_schema in ('public','private') and table_type = 'BASE TABLE' group by 1` |
| `CREATE TABLE` statements in the schema files | 25 | `git grep -h "^CREATE TABLE" -- apps/supabase/supabase/schema \| wc -l` |
| policies in `public` and in `storage` | 92 and 15, 107 in all | `select schemaname, count(*) from pg_policies where schemaname in ('public','storage') group by 1`; the linter's census line reads `policies examined: 107, tables partitioned: 21, permission members: 23` |
| schema files | 29 | `git ls-files apps/supabase/supabase/schema \| wc -l` |
| migration files | 1 | `git ls-files apps/supabase/supabase/migrations \| wc -l` |
| pgTAP files | 39 | `git ls-files 'apps/supabase/supabase/tests/database/*.test.sql' \| wc -l` |
| pgTAP assertions | 1706 in a run; 1697 planned in 38 files | the `Files=39, Tests=1706` line of `yarn workspace @openvaa/supabase test:db` on a freshly reset database; the sum of `plan (N)` over the files |
| definer functions of `public` that `anon` / `authenticated` can execute, trigger functions and test helpers apart | 6 / 8 | the two lists in § 8c of `07-rpc-security.test.sql` |
| Edge Function directories, and copies of `envConfig.ts` | 3 and 3, byte-identical | `ls apps/supabase/supabase/functions`; `cmp` of each pair |
| entries of `SAME_PERMISSION_ALLOW`, `REACHES_NEITHER_ALLOW`, `MECHANISM_HELPERS` | 3, 10, 5 | read from `apps/supabase/scripts/lint-schema.mjs` |
| members of `m17_unenforced_ratified` | 4 | read from `25-matrix-conformance.test.sql` |

**Updated 2026-10-09** (Phase 175, plan 175-13): the nominations lock, the frozen columns, the two
validation triggers, what `bulk_import` skips, and the pgTAP counts. Schema Conventions § 1 states the
validated shape of an entity's `color` and § 8 lists `enforce_entity_immutability` with the columns it
protects on each entity table and the two validation triggers; RLS and Auth Patterns § 6 describes the
lock as the app setting `access.nominationsLocked`, which policies ask it and who writes it, and § 8
says why the name columns are in the grants; Service Patterns § 2 names the skipped keys and where
`entity_type` is carried. `schema-reference.md` carries the trigger and function rows and the one
settings key the database reads; `rls-policy-map.md` carries the lock's paragraph, the protected
columns and four rows of its test table. The counts in the table above that this entry re-measured,
each on a database reset from the migration and `seed.sql` on this date:

| Statement | Value | Command |
|---|---|---|
| tables in the applied `public` and `private` schemas | 21 and 4 | the first command of the table above |
| policies in `public` and in `storage` | 92 and 15, 107 in all | the `pg_policies` query of the table above |
| schema files, migration files | 29, 1 | `git ls-files apps/supabase/supabase/schema \| wc -l`; the same over `migrations` |
| pgTAP files | 41 | `git ls-files 'apps/supabase/supabase/tests/database/*.test.sql' \| wc -l` |
| pgTAP assertions | 1888 in a run; 1879 planned in 40 files | the `Files=41, Tests=1888` line of `yarn workspace @openvaa/supabase test:db` on a freshly reset database; the sum of `plan (N)` over the files |
| lines of the pgTAP files | 37,275 | `cat` of the 41 files piped to `wc -l` |
| registrations of `enforce_entity_immutability`, `validate_entity_color`, `validate_entity_type_list` | 4, 4, 2 | `pg_trigger` joined to `pg_class` for the three names in `public` |
| lock columns on `projects` | 0 | `information_schema.columns` for `public.projects` |

The rows of the 2026-10-07 table for pgTAP files and assertions are superseded by these. Its other
rows (the definer census, the Edge Function directories, the linter's three lists, the ratified list)
were not re-measured by this entry.

**Updated 2026-10-09** (Phase 176, plan 176-19): `get_entity_nominations`, and the counts it moved.
RLS and Auth Patterns § 9 describes the third entity-scoped read -- its answer's keys, what `NULL`
and an empty array mean, its gate and why it is the one definer function of the three -- and § 4
names the nine functions of the `authenticated` census. `schema-reference.md` carries the function's
row and `rls-policy-map.md` its paragraph and the row of `42-entity-nominations.test.sql` in its test
table. The rows of the two tables above for pgTAP files, assertions and lines and for the
`authenticated` census are superseded by these, each measured on this date:

| Statement | Value | Command |
|---|---|---|
| tables in the applied `public` and `private` schemas | 21 and 4 | the first command of the 2026-10-07 table |
| policies in `public` and in `storage` | 92 and 15, 107 in all | the `pg_policies` query of the 2026-10-07 table |
| schema files, migration files | 29, 1 | `git ls-files apps/supabase/supabase/schema \| wc -l`; the same over `migrations` |
| pgTAP files | 42 | `git ls-files 'apps/supabase/supabase/tests/database/*.test.sql' \| wc -l` |
| pgTAP assertions | 1957 in a run; 1948 planned in 41 files | the `Files=42, Tests=1957` line of the gate driver's pgTAP row on a freshly reset database; the sum of `plan (N)` over the files |
| lines of the pgTAP files | 38,685 | `cat` of the 42 files piped to `wc -l` |
| definer functions of `public` that `anon` / `authenticated` can execute, trigger functions and test helpers apart | 6 / 9 | the two lists in § 8c of `07-rpc-security.test.sql` |

The Edge Function directories, the linter's three lists and the ratified list were not re-measured
by this entry.

**Updated 2026-10-11** (Phase 177, plan 177-21): nominations an entity defines. Schema Conventions § 7
describes the election type and its four members, the matrix in `nomination_shape_rule`, the row rule,
the end-of-transaction rule as the schema's one constraint trigger and how a function forces it, and
the requested-name key; § 8 lists the nomination triggers. RLS and Auth Patterns § 4 names
`nomination_id_in_contest` and the ten functions of the `authenticated` census; § 6 describes
`entity_delete_nominations`, the pairing of the parent policy by caller type and the four policies
that hold the lock; § 9 describes `get_nomination_parent_options` and `set_entity_nominations` and
states the parent of `get_entity_nominations` with its four keys. `schema-reference.md` carries the
`election_type` row, the nominations table's foreign-key action, `created_by` and uniqueness key, the
four nomination triggers and the rows of the new functions; `rls-policy-map.md` carries the delete
policy, the organization editor's cell of `nomination.create_parent`, the two paragraphs on the new
functions and four rows of its test table. The rows of the tables above for policies, pgTAP files,
assertions and lines and for the `authenticated` census are superseded by these, each measured on this
date:

| Statement | Value | Command |
|---|---|---|
| tables in the applied `public` schema | 21 | `select count(*) from pg_tables where schemaname='public'` |
| policies in `public` and in `storage` | 93 and 15, 108 in all | the `pg_policies` query of the 2026-10-07 table |
| members of `grant_permission` and of `nomination_shape` | 23 and 4 | `pg_enum` joined to `pg_type` for the two names |
| schema files, migration files | 29, 1 | `git ls-files apps/supabase/supabase/schema \| wc -l`; the same over `migrations` |
| pgTAP files | 44 | `git ls-files 'apps/supabase/supabase/tests/database/*.test.sql' \| wc -l` |
| pgTAP assertions | 2312 in a run; 2303 planned in 43 files | the `Files=44, Tests=2312` line of the gate driver's pgTAP row on a freshly reset database; `git grep -h -E "^  plan \(" -- 'apps/supabase/supabase/tests/database/*.test.sql'`, summed |
| lines of the pgTAP files | 46,693 | `cat` of the 44 files piped to `wc -l` |
| definer functions of `public` that `anon` / `authenticated` can execute, trigger functions and test helpers apart | 6 / 10 | `pg_proc` where `prosecdef`, with `has_function_privilege` for the two roles, less the trigger functions and `test_grants_claim` |
| the default of `elections.election_type` | `organization_list_and_independents` | `information_schema.columns` for the column |
| constraint triggers on `public.nominations` | 1, `nominations_parent_required`, deferrable and initially deferred | `pg_trigger` for the table, `tgdeferrable` and `tginitdeferred` |
| permissions of the entity `editor` of an organization | seven, `nomination.create_parent` among them | `select unnest(public.grant_role_permissions('entity','editor','organization'))` |

The `private` schema's table count, the Edge Function directories, the linter's three lists and the
ratified list were not re-measured by this entry.

**Updated 2026-10-16** (Phase 178, plan 178-23): the sign-in, registration and recovery flow. RLS and
Auth Patterns § 2 names the mail hook and the hook census; § 4 states three definer censuses and the
fourth value of `contestant_app_public_config`; § 9 states `password_set` and
`private.caller_password_set`; § 10 states the registration-mode condition and
`recovery_link_request`; Service Patterns § 1 states the fourth operation of `account-access`.
`schema-reference.md` and `rls-policy-map.md` were not edited by this entry. Re-measured on this date:

| Statement | Value | Command |
|---|---|---|
| pgTAP files | 45 | `git ls-files 'apps/supabase/supabase/tests/database/*.test.sql' \| wc -l` |
| pgTAP assertions | 2435 in a run; 2426 planned in 44 files | the `Files=45, Tests=2435` line of the gate driver's pgTAP row in `tests/e2e-runs/178-gates/178-20-close` (head `cc2651c32`; no test or schema file has changed since); `git grep -h -E "^  plan \(" -- 'apps/supabase/supabase/tests/database/*.test.sql'`, summed |
| lines of the pgTAP files | 49,122 | `cat` of the 45 files piped to `wc -l` |
| schema files, migration files | 29, 1 | `git ls-files apps/supabase/supabase/schema \| wc -l`; the same over `migrations` |
| the three definer censuses and the hook census of `07-rpc-security.test.sql` | 6, 10, 9; 2 | the literal lists of § 8c and § 8d of the file |

A pgTAP run on this date did not complete: the `pg_prove` image was absent from the local Docker VM and
its pull did not finish, so the run count above is the 2026-10-14 run's. Tables, policies, enums and the
Edge Function directories were not re-measured by this entry.

The table and the sections below it that predate this entry state counts as of their own dates (17
tables, 97 policies, 24 schema files, 3 migrations on 2026-08-29); they are a record and are not
current. Statements this update did not check and that an agent should measure before relying on them:
the "4 enums" heading in Schema Conventions § 5 (the applied `public` schema holds eight enum types),
the "11 content tables" of the external-id system, and the fixture sizes under pgTAP § 3 and § 7.

**Updated 2026-10-18** (Phase 177.1, plan 177.1-07): an invitation states its entity's confirmation and
nominations, and the nomination writers share three private functions. RLS and Auth Patterns § 4
names `private.nomination_list_checked`, `private.nomination_object_checked` and
`private.parent_nomination_resolved` beside `nomination_id_in_contest`; § 9 states the bound of 1000,
the cross-project refusal, the functions `set_entity_nominations` asks and its EXECUTE as the
catalogue lists it; § 10 states `create_invitations`' three parameters, the `nominations` key and the
answer, and corrects the stored matrix of `seed.sql`'s default project; pgTAP § 1 drops the unscoped
witness count of file 39. `schema-reference.md` carries the three private functions, the
`set_entity_nominations` row and the three-parameter `create_invitations` row; `rls-policy-map.md` the
write-side paragraph, the `nomination_id_in_contest` row and the test rows of files 39, 46 and 47.
The commits under the targets since the 2026-10-16 entry (`bf3218bd3`): `a94d6ce2e` (`seed.sql`'s
default project stores a registration-mode matrix), `44211df80` `20a32b96e` `f074142d8` `91969bebb`
(the three private functions, file 46), `fc01c81e6` `764936c45` (files 39 and 47), `d204c3e12`
`d65814195` (`create_invitations`, the migration and `database.ts`), `dbfe44fdf`
(`apps/supabase/README.md`). Measured on this date:

| Statement | Value | Command |
|---|---|---|
| pgTAP files | 47 | `git ls-files 'apps/supabase/supabase/tests/database/*.test.sql' \| wc -l` |
| pgTAP assertions | 2603 in a run; 2594 planned in 46 files | the `Files=47, Tests=2603` line of the gate driver's pgTAP row in `tests/e2e-runs/177.1-gates/177.1-review-fix` (head `2ec1ec392`); `git grep -h -E "^  plan \(" -- 'apps/supabase/supabase/tests/database/*.test.sql'`, summed |
| lines of the pgTAP files | 53,569 | `git ls-files 'apps/supabase/supabase/tests/database/*.test.sql' \| xargs cat \| wc -l` |
| schema files, migration files | 29, 1 | `git ls-files apps/supabase/supabase/schema \| wc -l`; the same over `migrations` |
| functions the schema creates in `private` | 28, of which 3 in `503-entity-rpcs.sql` (25 at `a94d6ce2e`) | `git grep -h -E '^CREATE (OR REPLACE )?FUNCTION private\.' -- apps/supabase/supabase/schema \| wc -l`, and the same over `503-entity-rpcs.sql` |
| policies the schema creates | 108, unchanged | `git grep -h -E '^CREATE POLICY' -- apps/supabase/supabase/schema \| wc -l` |
| `create_invitations` in the catalogue | one row, `(uuid, jsonb, boolean)`, no parameter default, EXECUTE for `authenticated` and `service_role` and not `anon` | `pg_proc` for the name with `pronargdefaults` and `has_function_privilege`, read on the reset database of gate run `177.1-04-db` (`tests/e2e-runs/177.1-unit/177.1-04-catalogue.txt`) |

The definer censuses of `07-rpc-security.test.sql` are unchanged: the three new functions are SECURITY
INVOKER. Tables, enums, the Edge Function directories and the linter's lists were not re-measured by
this entry.

**Updated 2026-10-20**: the migration model. The paragraph of Backend Overview that begins "**The
migrations are frozen**", Reviewing § 13, the Key Source Locations entry for the migrations and the
description line state the frozen baseline `00001_initial_schema.sql`, the appended numbered
migrations, `migrations.manifest.json` and `yarn check:schema-equivalence`. The entries above that
speak of a generated single migration describe the model of their own dates. Measured on this date:

| Statement | Value | Command |
|---|---|---|
| migration files | 1 | `git ls-files apps/supabase/supabase/migrations \| wc -l` |
| entries of `migrations.manifest.json` | 1, the baseline | `node -e` reading `migrations.length` of the file |

No other count was re-measured by this entry.

**Updated 2026-10-22** (Phase 179, plan 179-22): the two Edge Functions the identity provider's
registration runs through. Service Patterns § 1 states `identity-callback` as it is served: the
server's credential first, the project from the request, the matrix decision before any write,
the invite recipe, `resolveOwnEntity`, the `app_metadata` it writes and its closed results; and
`account-access`'s fifth operation, `confirm-address`, with the caller's own token, its order and
the accepted auth-service oracle. § 7 lists `identity-callback`'s required variables, the server's
credential among them and neither `PUBLIC_PROJECT_ID` nor `SITE_URL`. RLS and Auth Patterns § 9's
last bullets describe the own-entity lookup through the `registered_entities` record confirmed by a
live grant. `schema-reference.md` and `rls-policy-map.md` were not edited by this entry, and no
count was re-measured.

**Updated 2026-10-26** (Phase 179.1, plan 179.1-05): the answers lock. RLS and Auth Patterns § 4 names
`project_answers_locked` among the eleven policy-only helpers; § 6 states the self-update policies'
conjunct and the answers lock beside the nominations lock; § 9 names `set_entity_nominations`' refusal;
Service Patterns § 4 the storage write it refuses. `schema-reference.md` carries the helper's row, the
two settings keys and the refusals of `upsert_answers`, `set_entity_nominations` and `storage_path_can`;
`rls-policy-map.md` the two locks' paragraph, the matrix cell and the storage mapping cell, and the row of
`55-answers-lock.test.sql`. Measured on this date: the pgTAP suite on a freshly reset database reads
`Files=55, Tests=2796` (`tests/e2e-runs/179.1-unit/179.1-05-pgtap-green-2.log`); migrations 16
(`git ls-files apps/supabase/supabase/migrations | wc -l`). No other count was re-measured.

**Updated 2026-10-26** (Phase 179.1, plan 179.1-09): `identity-callback` finds or creates an identity's
entity through one call of `identity_entity_find_or_create`. RLS and Auth Patterns § 9's last bullets and
Service Patterns § 1's `identity-callback` bullet describe the call, the look-up after a failed invite and
the `app_metadata` write made after the call without the record; the bullet on `writeEntityGrant` and the
compensating delete are gone with the modules `candidateRecord.ts`, `organizationRecord.ts` and
`entityGrant.ts`. `schema-reference.md`'s grant-key paragraph no longer names `writeEntityGrant`. No count
was re-measured.

### What changed under the targets, and what it did to this skill

| Source of drift | Commits | Effect on this skill |
|---|---|---|
| **Phase 155** -- Edge Function hardening | `61bb8cb36` `869a01d60` `eb6b4fa6d` `0bdfab19f` `f53f324d3` `6b2a6ec21` `465cc4bdd` `b5bf954dd` `1ecb51c54` `a6fe54d7d` `f0fdde5fb` `d0740772d` `bcae09a05` `17ef44ce4` | **Content was stale and is corrected.** Service Patterns § 6 rewritten (aud/iss are now bound unconditionally and fail closed -- the old text asserted the exact fail-open that `869a01d60` deleted); new § 7 (`requireEnv`, the byte-identical `envConfig.ts` triplicate, the required variable per function), § 8 (base64url JWT segment decoding), § 9 (flat-key placeholder substitution). |
| **Phase 152** -- comment/naming sweeps | `575de28f0` `2394fea57` `c08dc441a` `7390fd983` | **No effect.** Measured: `git diff -w <baseline>..HEAD -- schema/ migrations/ tests/` yields **0** changed lines that are not comments or blank. Every structural claim in this file -- 17 tables, 97 RLS policies, the 5-policy pattern, the trigger and index conventions, the bulk RPCs, the storage buckets -- is untouched by the sweeps. |
| **`packages/supabase-types/`** | `d5327830b` (barrel drops `.js` specifiers), `133e35f79` (untrack four build artefacts, incl. `tsconfig.tsbuildinfo`) | **No effect on the described contract.** `database.ts` and `column-map.ts` still export the same Row/Insert/Update types and the COLUMN_MAP / PROPERTY_MAP bridge; only import specifiers and VCS tracking changed. |
| **`4402124ce`** -- claim-config test under `apps/supabase/` | 1 | **No effect.** Test-only; adds assertions on `identity-callback`'s claim-config output. |

### Corrections made that the drift did NOT cause

The pgTAP counts were re-measured and were **already wrong at this skill's own baseline**: 11 files
and 264 planned assertions at `14afb2d80`, not the "10 test files … 204 tests" this file claimed,
which also contradicted its own Key Source Locations entry ("11 files"). Corrected here rather than
carried forward; see the ⚠ note under pgTAP Testing Conventions § 1.

### Verified still true

`resolve_email_variables` still declares `p_template_body` / `p_template_subject` (`502-email-helpers.sql:17-18`)
and still references neither in its body -- the "Known gap" under Service Patterns § 5 stands. The
three Edge Function directories are `account-access`, `identity-callback` and
`send-email`; `schema/` still holds 24 SQL files; `migrations/` still holds 3.
