# Schema Reference

Column listing for the OpenVAA Supabase schema. The applied `public` schema holds 21 tables and the `private` schema 4 (`select table_schema, count(*) from information_schema.tables where table_schema in ('public','private') and table_type = 'BASE TABLE' group by 1`, measured 2026-10-07; the schema files hold the same 25 `CREATE TABLE` statements). 19 of the `public` tables are listed below, `admin_jobs` and `feedback` are not; of the `private` ones `deployment_settings`, `invitation_throttle` and `invitation_link_witness` are listed and `feedback_rate_limits` is not. Source: `apps/supabase/supabase/schema/` (29 SQL files, `git ls-files apps/supabase/supabase/schema | wc -l`).

## Table Reference

### Multi-tenancy

**accounts** (100-tenancy.sql)

- id: uuid PK DEFAULT gen_random_uuid()
- name: text NOT NULL
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()

**projects** (100-tenancy.sql)

- id: uuid PK DEFAULT gen_random_uuid()
- account_id: uuid NOT NULL FK accounts(id) ON DELETE CASCADE
- name: text NOT NULL
- default_locale: text NOT NULL DEFAULT 'en'
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()

### Elections

**elections** (101-elections.sql)

- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- election_date: date, election_start_date: date
- election_type: public.nomination_shape NOT NULL DEFAULT 'organization_list_and_independents' — which entity types the election admits as nominees. Four members: organization_only / candidate_only / organization_list / organization_list_and_independents. `public.nomination_shape_rule` (011) is the one statement in SQL of what each admits, and the triggers `validate_nomination` and `nominations_parent_required` enforce it on every write of a nomination; changing an election's type re-checks nothing. The frontend adapter maps the column to `ElectionData.nominationShape`. REPURPOSED in 162-07 (D-16): the column keeps its name, its previous meaning is deleted and its previous values are not members of the type, so a row carrying one is rejected by PostgreSQL. `subtype` on the same table is a DIFFERENT axis and is not this.
- multiple_rounds: boolean DEFAULT false, current_round: integer DEFAULT 1
- external_id: text (015)

**constituency_groups** (101-elections.sql)

- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- external_id: text (015)

**constituencies** (101-elections.sql)

- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- keywords: jsonb
- parent_id: uuid FK constituencies(id) ON DELETE SET NULL
- external_id: text (015)

**constituency_group_constituencies** (101-elections.sql) -- join table

- constituency_group_id: uuid NOT NULL FK constituency_groups(id) ON DELETE CASCADE
- constituency_id: uuid NOT NULL FK constituencies(id) ON DELETE CASCADE
- PRIMARY KEY (constituency_group_id, constituency_id)

**election_constituency_groups** (101-elections.sql) -- join table

- election_id: uuid NOT NULL FK elections(id) ON DELETE CASCADE
- constituency_group_id: uuid NOT NULL FK constituency_groups(id) ON DELETE CASCADE
- PRIMARY KEY (election_id, constituency_group_id)

### Entities

**organizations** (102-entities.sql)

- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- confirmed: boolean NOT NULL DEFAULT false
- **Frozen once confirmed, on all four entity tables:** the name columns and `short_name`. The trigger
  `enforce_entity_immutability` is registered per table with the columns it protects: `name` and
  `short_name` here and on `factions` and `alliances`, and `first_name`, `last_name` and `short_name` on
  `candidates`. A change to one of them on a row that was already confirmed, by the `authenticated` role,
  needs `entity.edit_immutable` on the entity; a change to `confirmed` needs `entity.confirm`.
- **`color` is validated on all four entity tables** by the trigger `validate_entity_color`: SQL null, or a
  JSON object whose only members are `normal` and `dark`, each absent, a JSON null or `#` followed by
  exactly three or six hexadecimal digits. Every writer is bound, the service role and `bulk_import`
  included. The `color` columns of the other content tables are not validated.
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- answers: jsonb DEFAULT '{}'::jsonb
- external_id: text

**candidates** (102-entities.sql)

- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- first_name: text NOT NULL, last_name: text NOT NULL
- short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- confirmed: boolean NOT NULL DEFAULT false
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- answers: jsonb DEFAULT '{}'::jsonb
- external_id: text
- No entity table carries a terms-of-use column. Acceptance is a row of `terms_of_use_acceptances` (see Auth), per user and project.

**factions** (102-entities.sql)

- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- organization_id: uuid NOT NULL FK organizations(id) ON DELETE CASCADE
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- confirmed: boolean NOT NULL DEFAULT false
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- external_id: text

**alliances** (102-entities.sql)

- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- confirmed: boolean NOT NULL DEFAULT false
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- external_id: text

### Questions

**question_categories** (103-questions.sql)

- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- category_type: category_type DEFAULT 'opinion'
- election_ids: jsonb, election_rounds: jsonb, constituency_ids: jsonb, entity_type: jsonb
- external_id: text (015)

**questions** (103-questions.sql)

- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- type: question_type NOT NULL
- category_id: uuid NOT NULL FK question_categories(id)
- choices: jsonb, settings: jsonb
- election_ids: jsonb, election_rounds: jsonb, constituency_ids: jsonb, entity_type: jsonb
- allow_open: boolean DEFAULT true, required: boolean DEFAULT true
- external_id: text (015)

`entity_type` on `question_categories` and `questions` is a filter list, validated by the trigger
`validate_entity_type_list`: SQL null or an empty JSON array addresses every entity type, and any other
value must be a JSON array whose every member is a string naming a value of the `entity_type` enum. A
bare string, a JSON null and an unknown member are refused for every writer. `bulk_import` carries the key
on these two tables.

### Nominations

**nominations** (104-nominations.sql)

- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- candidate_id: uuid FK candidates(id) ON DELETE CASCADE
- organization_id: uuid FK organizations(id) ON DELETE CASCADE
- faction_id: uuid FK factions(id) ON DELETE CASCADE
- alliance_id: uuid FK alliances(id) ON DELETE CASCADE
- entity_type: entity_type NOT NULL GENERATED ALWAYS AS (CASE WHEN candidate_id...) STORED -- `bulk_import` skips the key on this table
- election_id: uuid NOT NULL FK elections(id) ON DELETE CASCADE
- constituency_id: uuid NOT NULL FK constituencies(id) ON DELETE CASCADE
- election_round: integer DEFAULT 1, election_symbol: text
- parent_nomination_id: uuid FK nominations(id) ON DELETE NO ACTION -- a delete, or a move, of a nomination is refused (23503) while a nomination is listed under it
- confirmed: boolean NOT NULL DEFAULT false
- created_by: uuid FK auth.users(id) ON DELETE SET NULL DEFAULT auth.uid() -- the user who created the row, which the cap on unconfirmed parent nominations counts
- custom_data key `requestedParentOrganization`: the typed name of a parent that is not in the system (a party for a candidate, an alliance for an organization); a row that carries it cannot be confirmed
- CHECK (num_nonnulls(candidate_id, organization_id, faction_id, alliance_id) = 1)
- CONSTRAINT nominations_entity_parent_contest_key UNIQUE NULLS NOT DISTINCT (the four entity FKs, parent_nomination_id, election_id, constituency_id, election_round)
- external_id: text (015)

### Auth

**grants** (300-auth-tables.sql)

- id: uuid PK DEFAULT gen_random_uuid()
- user_id: uuid NOT NULL FK auth.users(id) ON DELETE CASCADE
- scope: grant_scope_type NOT NULL (values: 'global', 'account', 'project', 'entity')
- target_type: entity_type (NOT NULL exactly when scope = 'entity'; NULL otherwise)
- target_id: uuid (NULL exactly when scope = 'global')
- role: grant_role_type NOT NULL (values: 'admin', 'editor')
- created_at: timestamptz NOT NULL DEFAULT now()
- CONSTRAINT grants_user_scope_target_role_key
  **UNIQUE NULLS NOT DISTINCT** (user_id, scope, target_type, target_id, role)
  -- the NULLS clause is load-bearing and not decoration: three of the four scopes carry a NULL in the
  key, and a plain UNIQUE enforces NOTHING on them. Asserted by name and in both directions in
  `26-uniqueness-keys.test.sql`.
- CONSTRAINT grants_entity_scope_target_type_check
  CHECK ((target_type IS NOT NULL) = (scope = 'entity'))
- CONSTRAINT grants_target_id_scope_check
  CHECK ((target_id IS NULL) = (scope = 'global'))
- UNIQUE INDEX idx_grants_one_candidate_editor ON (target_id)
  WHERE scope = 'entity' AND target_type = 'candidate' AND role = 'editor'
  -- one editor per candidate, because a candidate-scope user IS the candidate. Organizations admit
  several editors, and an `admin`-role entity grant is outside the index. A second user's editor grant
  on a candidate is refused naming this index; an exact duplicate grant is refused naming
  `grants_user_scope_target_role_key`, which is checked first.
- **The grant is the only link from an auth user to an entity.** No entity table carries an auth user
  id column; "which entities are mine" is answered from the caller's `(entity, <type>, <id>, editor)`
  rows here, through `private.caller_entity_ids` (see Utility Functions). One user may hold several in
  one project, and `get_user_entities` lists every one of them.

**terms_of_use_acceptances** (304-terms-of-use-acceptances.sql)

- user_id: uuid NOT NULL DEFAULT auth.uid() FK auth.users(id) ON DELETE CASCADE
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- accepted_at: timestamptz NOT NULL DEFAULT now()
- PRIMARY KEY (user_id, project_id)
- INDEX idx_terms_of_use_acceptances_project_id ON (project_id)
- One row says that one user has accepted the terms of use of one project. The row's presence is the
  acceptance: there is no boolean and no version, and an acceptance for one project is not an acceptance
  for another. The row goes with its user and with its project, by the two cascades.
- RLS enabled, two policies, both `TO authenticated` and keyed on `user_id = (SELECT auth.uid())`:
  `authenticated_select_terms_of_use_acceptances` and `authenticated_insert_terms_of_use_acceptances`. No
  UPDATE or DELETE policy.
- Privileges: REVOKE ALL from anon, authenticated, public; GRANT SELECT to authenticated; GRANT INSERT
  (project_id) to authenticated. `anon` holds nothing. A caller states the project only: the database
  supplies `user_id` and `accepted_at`, and an insert naming either is refused with `42501`. A write is
  an ignore-duplicates upsert (`ON CONFLICT DO NOTHING`); the `DO UPDATE` form needs the UPDATE
  privilege, which `authenticated` does not hold.
- **The one table outside the grant model**, and nothing reads it: no policy, no function and no storage
  policy. See `rls-policy-map.md` § _The one table outside the grant model_ for the linter exemption and
  the pgTAP census that guards it.

**invitations** (305-invitations.sql)

One row promises ONE grant, in the four columns of `grants` and with their types, to whoever proves an
email address or a code. It is not a content table: no `name`, no `external_id`, no `updated_at`, no
`bulk_import` entry.

- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- scope: grant_scope_type NOT NULL, target_type: entity_type, target_id: uuid (NO foreign key, as on
  `grants`), role: grant_role_type NOT NULL -- the promised grant
- email: text -- the invited address, trimmed and lower-cased by the insert trigger; NULL on a code row
- code_hash: text -- lower-case hex sha256 of the normalised code; NULL on an email row
- pending_email: text, pending_email_at: timestamptz -- on a code row, the address a link request bound
  to the code and when
- expires_at: timestamptz -- NULL means no expiry; there is no default
- created_by: uuid DEFAULT auth.uid() FK auth.users(id) ON DELETE SET NULL
- created_at: timestamptz NOT NULL DEFAULT now()
- claimed_by: uuid FK auth.users(id) ON DELETE SET NULL
- claimed_at: timestamptz -- **"claimed" is `claimed_at IS NOT NULL`**, never `claimed_by`: both user
  columns go to NULL with their user, so deleting the claimant cannot reopen a claimed row
- Ten CHECK constraints:
  - `invitations_entity_scope_target_type_check` -- `(target_type IS NOT NULL) = (scope = 'entity')`
  - `invitations_target_id_scope_check` -- `(target_id IS NULL) = (scope = 'global')`
  - `invitations_scope_check` -- scope is `project` or `entity`; binds the service role too
  - `invitations_project_target_check` -- a project-scope promise names its own project
  - `invitations_role_confers_check` -- `grant_role_permissions(scope, role, target_type)` is not
    empty, so a shape that confers nothing (entity-scope admin) is refused for every role
  - `invitations_binding_check` -- exactly one of `email` and `code_hash`
  - `invitations_email_normalised_check` -- `email = lower(btrim(email))` and not empty
  - `invitations_code_hash_format_check` -- 64 lower-case hex characters
  - `invitations_pending_email_check` -- a pending address only on a code row, in the same normal form
  - `invitations_claimed_by_needs_claimed_at_check` -- `claimed_by` set implies `claimed_at` set
- Two UNIQUE indexes, which are the duplicate rule:
  - `invitations_email_target_key` ON (project_id, email, scope, target_type, target_id) **NULLS NOT
    DISTINCT** WHERE email IS NOT NULL -- one address is promised one target once, whatever the role
    and whether or not the first promise was claimed. NULLS NOT DISTINCT because `target_type` is NULL
    on a project-scope row
  - `invitations_code_hash_key` ON (project_id, code_hash) WHERE code_hash IS NOT NULL -- a code is
    looked up without a target, so within a project it names one row
- Triggers: `prepare_invitation` (BEFORE INSERT, SECURITY INVOKER) normalises `email` and, for a row
  with neither an address nor a hash, generates a code, stores its hash and puts the code into the
  transaction-local setting `openvaa.generated_invitation_code`; `cleanup_invitation_throttle`
  (AFTER DELETE) deletes the row's throttle keys. On the four entity tables,
  `cleanup_invitations_on_delete` (AFTER DELETE, SECURITY DEFINER) deletes the invitations whose
  target is the deleted entity, claimed ones included.
- RLS enabled, three policies, each `TO authenticated`: `admin_select_invitations`,
  `admin_insert_invitations`, `admin_delete_invitations`. No UPDATE policy. See `rls-policy-map.md`
  § _Invitations: the authority map_.
- Column privileges of `authenticated`: SELECT on `id, project_id, scope, target_type, target_id,
  role, email, expires_at, created_by, created_at, claimed_by, claimed_at` (so `SELECT *` is refused:
  `code_hash`, `pending_email` and `pending_email_at` are not selectable); INSERT on `project_id,
  scope, target_type, target_id, role, email, expires_at`; DELETE; **no UPDATE**. `anon` holds
  nothing. `service_role` keeps its default table privileges and bypasses the policies; the CHECK
  constraints are what bind it.

### Settings

**app_settings** (106-app-settings.sql)

- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL UNIQUE FK projects(id)
- settings: jsonb NOT NULL DEFAULT '{}'::jsonb
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()
- external_id: text (015)
- **One key of `settings` is read by the database: `access.nominationsLocked`.** It is the nominations
  lock. `private.project_nominations_locked(project_id)` compares `settings #> '{access,nominationsLocked}'`
  with the JSON boolean `true`, and the three `entity_*` nomination policies ask it. No settings row, no
  key and any value other than that boolean are unlocked; a project id that names no project is locked.
  `projects` carries no lock column. The row is written under `project.edit_app_settings`, which project
  editors hold. Every other key is read by the frontend alone.

### Infrastructure

**storage_config** (400-storage.sql)

- key: text PK
- value: text NOT NULL
- RLS enabled; REVOKE ALL from anon, authenticated, public; GRANT SELECT to service_role

**deployment_settings** (107-feedback.sql)

- Schema `private` (not exposed via PostgREST); a single row
- singleton: boolean PK DEFAULT true CHECK (singleton)
- behind_cloudflare: boolean NOT NULL DEFAULT false -- `check_feedback_rate_limit` trusts `cf-connecting-ip` only when true; a missing row reads as false. Operator statement: `UPDATE private.deployment_settings SET behind_cloudflare = true;` (only when every request reaches the API through Cloudflare; hosted Supabase does). seed.sql sets it true for the local stack
- RLS enabled; REVOKE ALL from public, anon, authenticated, service_role; only the owner reads it

**invitation_throttle** (506-invitation-rpcs.sql)

- Schema `private`
- key: text PK -- one of two forms: `link:<project id>:<sha256 hex of the address>` (sign-in mails to
  one address in one project) and `code:<project id>:<code hash>` (claimant look-ups of one used code).
  No key holds an address in clear, and none is derived from a request header
- count: integer NOT NULL DEFAULT 1 -- takes in the current window
- window_start: timestamptz NOT NULL DEFAULT now()
- RLS enabled with no policy; REVOKE ALL from public, anon, authenticated, service_role. Only the
  SECURITY DEFINER functions of the file read or write it, through `private.invitation_throttle_take`

**invitation_link_witness** (506-invitation-rpcs.sql)

- Schema `private`
- id: uuid PK DEFAULT gen_random_uuid()
- opened_at: timestamptz NOT NULL DEFAULT now(), completed_at: timestamptz
- outcome: text, CHECK (`invitation_link_witness_outcome_check`): NULL, `sent` or `not-sent`
- RLS enabled with no policy; REVOKE ALL from public, anon, authenticated, service_role. A record is
  opened by `invitation_link_witness_open` and completed by an UPDATE in `invitation_link_witness`,
  never by an insert, so an id nobody opened writes nothing

## Triggers

| Trigger Name                                | Table(s)                                | Event                | Function                                   | Source |
| ------------------------------------------- | --------------------------------------- | -------------------- | ------------------------------------------ | ------ |
| set_updated_at                              | all content tables + accounts, projects | BEFORE UPDATE        | update_updated_at()                        | 001+   |
| validate_nomination_before_insert_or_update | nominations                             | BEFORE INSERT/UPDATE | validate_nomination()                      | 011, 104 |
| nominations_parent_required (CONSTRAINT TRIGGER, DEFERRABLE INITIALLY DEFERRED) | nominations | AFTER INSERT/UPDATE, WHEN candidate_id IS NOT NULL AND parent_nomination_id IS NULL | validate_nomination_parent_required() | 011, 104 |
| enforce_nomination_columns_before_insert_or_update | nominations                      | BEFORE INSERT/UPDATE | enforce_nomination_entity_columns()        | 011, 104 |
| enforce_nomination_confirmation_before_insert_or_update | nominations                 | BEFORE INSERT/UPDATE | enforce_nomination_confirmation()          | 011, 104 |
| validate_answers_before_insert_or_update    | candidates, organizations               | BEFORE INSERT/UPDATE | validate_answers_jsonb()                   | 006    |
| cascade_question_delete_to_answers          | questions                               | AFTER DELETE         | cascade_question_delete_to_jsonb_answers() | 006    |
| validate_question_type_change_trigger       | questions                               | BEFORE UPDATE        | validate_question_type_change()            | 006    |
| enforce_external_id_immutability            | all 11 content tables                   | BEFORE UPDATE        | enforce_external_id_immutability()         | 015    |
| enforce_entity_immutability                 | candidates, organizations, factions, alliances | BEFORE UPDATE OF the protected columns and confirmed | enforce_entity_immutability(protected columns) | 011, 102 |
| validate_entity_color                       | candidates, organizations, factions, alliances | BEFORE INSERT/UPDATE OF color | validate_entity_color()           | 011, 102 |
| validate_entity_type_list                   | question_categories, questions          | BEFORE INSERT/UPDATE OF entity_type | validate_entity_type_list()  | 011, 103 |
| cleanup_storage_on_delete                   | 10 entity tables                        | AFTER DELETE         | cleanup_entity_storage_files()             | 014    |
| cleanup_image_on_update                     | 10 entity tables                        | BEFORE UPDATE        | cleanup_old_image_file()                   | 014    |
| prepare_invitation                          | invitations                             | BEFORE INSERT        | prepare_invitation()                       | 305    |
| cleanup_invitations_on_delete               | candidates, organizations, factions, alliances | AFTER DELETE  | cleanup_invitations_on_delete()            | 305    |
| cleanup_invitation_throttle                 | invitations                             | AFTER DELETE         | cleanup_invitation_throttle_on_delete()    | 506    |

Storage cleanup tables: candidates, organizations, factions, alliances, elections, constituencies, constituency_groups, nominations, question_categories, questions.

## Indexes

**project_id B-tree** (200-indexes.sql): idx\_{table}\_project_id on elections, constituency_groups, constituencies, organizations, candidates, factions, alliances, question_categories, questions, nominations, app_settings (11 tables).

**FK B-tree** (200-indexes.sql): idx*projects_account_id, idx_candidates_organization_id, idx_questions_category_id, idx_constituencies_parent_id, idx_nominations*{candidate_id, organization_id, faction_id, alliance_id, election_id, constituency_id, parent_nomination_id}.

**External ID composite unique partial** (500-external-id.sql): idx\_{table}\_external_id ON (project_id, external_id) WHERE external_id IS NOT NULL on all 11 content tables.

**grants** (300-auth-tables.sql): idx_grants_scope_target -- the reverse lookup "who holds a grant on this target", which the UNIQUE cannot serve because it leads with user_id. There is deliberately no index on user_id alone: the UNIQUE already leads with it. idx_grants_one_candidate_editor -- UNIQUE partial on (target_id) WHERE scope = 'entity' AND target_type = 'candidate' AND role = 'editor': at most one editor per candidate.

**terms_of_use_acceptances** (304-terms-of-use-acceptances.sql): idx_terms_of_use_acceptances_project_id -- the lookup "who has accepted in this project", which the primary key cannot serve because it leads with user_id. There is no index on user_id alone: the primary key leads with it.

**invitations** (305-invitations.sql): the two UNIQUE partial indexes above (`invitations_email_target_key`, `invitations_code_hash_key`), and five plain ones: idx_invitations_project_id; idx_invitations_scope_target ON (scope, target_type, target_id) -- the lookup by target that `cleanup_invitations_on_delete` uses; idx_invitations_created_by and idx_invitations_claimed_by -- the two user foreign keys; idx_invitations_pending_email ON (project_id, pending_email) WHERE pending_email IS NOT NULL -- the code rows an address is bound to, which the claim reads.

## Utility Functions

| Function                                                                     | File | Security         | Purpose                                                                                                            |
| ---------------------------------------------------------------------------- | ---- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| update_updated_at()                                                          | 010  | -                | Trigger: sets updated_at to NOW()                                                                                  |
| get_localized(jsonb, text, text)                                             | 010  | IMMUTABLE        | 3-tier locale fallback (email helpers only)                                                                        |
| validate_answer_value(jsonb, question_type, jsonb)                           | 011  | -                | Validates answer value against question type                                                                       |
| validate_nomination()                                                        | 011  | SECURITY DEFINER | Trigger: the election-type rule (`Nomination shape refused: `, 23514), the hierarchy rules and election/constituency/round consistency with the parent. Binds every writer |
| nomination_shape_rule(nomination_shape, entity_type) -> text                 | 011  | IMMUTABLE        | The election type x entity type matrix, encoded ONCE in SQL: `admitted`, `parent_required` or `refused`; NULL for a pair it does not name, which every caller treats as a refusal. Reads no table; EXECUTE is PUBLIC |
| validate_nomination_parent_required()                                        | 011  | SECURITY DEFINER | Function of the constraint trigger `nominations_parent_required`: at the end of the transaction, a candidate's nomination where the matrix answers `parent_required` must have a parent nomination or `requestedParentOrganization` in `custom_data` (`Nomination parent required: `, 23514). Re-reads the row by id |
| enforce_nomination_confirmation()                                            | 011  | SECURITY INVOKER | Trigger: a row carrying `requestedParentOrganization` cannot be confirmed; an edit by an `authenticated` caller without `nomination.confirm` turns `confirmed` off; on INSERT repeats the cap of 10 with a message that begins `A caller may originate at most ` (P0001) |
| private.nomination_id_in_contest(entity_type, uuid, uuid, uuid, integer) -> uuid | 301 | SECURITY DEFINER | The id of an entity's nomination at an election, constituency and round: no parent first, then the oldest, then the lowest id; NULL for none. Asked by `private.parent_nomination_resolved`, for both nomination writers, for a parent's nomination the caller cannot read |
| private.nomination_list_checked(jsonb, text, text) -> void | 503 | SECURITY INVOKER, IMMUTABLE | `(p_list, p_prefix, p_label)`. A nominations argument is a JSON array of at most 1000 members, asked before any member is read: 22023 `<prefix>: <label> must be a JSON array` (SQL NULL included) or `<prefix>: <label> holds more than 1000 nominations`. The bound is stated here and nowhere else in SQL. Asked by `set_entity_nominations` and `create_invitations`. EXECUTE: `authenticated`, `service_role`; revoked from `PUBLIC` and `anon` |
| private.nomination_object_checked(jsonb, entity_type, text, text) -> jsonb | 503 | SECURITY INVOKER, STABLE | `(p_object, p_parent_type, p_prefix, p_label)`. The shape of one nomination object, in `set_entity_nominations`' order, 22023 `<prefix>: <label> <tail>` at the first fault: an object; `election_id` and `constituency_id` uuids; `id` absent or a uuid; `election_symbol` a string or null of at most 50 characters after the trim; `parent` of kind `none`, `entity` (of `p_parent_type`, a uuid id), `other` (a non-blank name of at most 100 characters) or `keep`. Holds the white-space class, the trim and the two caps. Answers `{"id","election_id","constituency_id","symbol","kind","parent_entity_id","name"}`. Row checks are the writer's. EXECUTE: `authenticated`, `service_role`; revoked from `PUBLIC` and `anon` |
| private.parent_nomination_resolved(uuid, entity_type, uuid, uuid, uuid, integer, text, text, OUT nomination_id uuid, OUT created boolean) | 503 | SECURITY INVOKER, VOLATILE | `(p_project_id, p_parent_type, p_parent_entity_id, p_election_id, p_constituency_id, p_election_round, p_prefix, p_label)`. First refuses, 22023 `<prefix>: <label> names a parent that is no entity of the nomination's project`, a parent whose `private.entity_project_id` is not the project (an id that names no entity included); then asks `private.nomination_id_in_contest` and, where it answers NULL, inserts the organization's or alliance's bare row (project, parent, election, constituency, round; so unconfirmed) as the caller and asks again. `nomination_id` NULL when still not found, and for any other parent type; the writer raises its own 42501. Two concurrent creations are decided by `nominations_entity_parent_contest_key`. EXECUTE: `authenticated`, `service_role`; revoked from `PUBLIC` and `anon` |
| private.caller_nominated_in_contest(uuid, uuid, integer, grant_permission, entity_type[]) -> boolean | 301 | SECURITY DEFINER | Guard 5 of `entity_insert_parent_nominations`: the caller holds the permission on an entity of one of the given types that is nominated at the contest |
| enforce_entity_immutability()                                                | 011  | SECURITY INVOKER | Trigger: the confirmation gate, and the freeze of a confirmed entity's protected columns (given in TG_ARGV)        |
| validate_entity_type_list()                                                  | 011  | SECURITY INVOKER | Trigger: `entity_type` of a question or category is null or a JSON array of entity types; `search_path = ''`       |
| validate_entity_color()                                                      | 011  | SECURITY INVOKER | Trigger: an entity's `color` is null or an object of hex colours under `normal` and `dark`; `search_path = ''`    |
| private.project_nominations_locked(uuid)                                     | 301  | SECURITY DEFINER | Whether the app setting `access.nominationsLocked` of the project is the JSON boolean `true`; a missing project is locked |
| validate_answers_jsonb()                                                     | 105  | -                | Trigger: smart validation of JSONB answers                                                                         |
| cascade_question_delete_to_jsonb_answers()                                   | 105  | -                | Trigger: removes orphaned answer keys on question delete                                                           |
| validate_question_type_change()                                              | 105  | -                | Trigger: prevents type changes invalidating answers                                                                |
| custom_access_token_hook(jsonb)                                              | 301  | STABLE           | Projects public.grants into the JWT `grants` claim                                                                 |
| send_email_hook(jsonb)                                                       | 301  | IMMUTABLE        | The mail hook: takes every mail the auth service would send and sends none; executable by `supabase_auth_admin` alone |
| private.caller_password_set()                                                | 301  | SECURITY DEFINER, STABLE | Whether the caller's own account holds a password; NULL with no caller; executable by `authenticated` alone; read by `get_user_entities` |
| private.user_password_set(uuid)                                              | 301  | SECURITY DEFINER, STABLE | Whether an account holds a password; executable by no API role; called by `caller_password_set` and `claim_invitations` |
| private.registration_mode_allowed_in(jsonb, text, text)                      | 301  | IMMUTABLE        | The registration-mode rule over stored settings, an entity type and a mode; reads no table; executable by no API role |
| private.registration_mode_allowed(uuid, text, text)                          | 301  | SECURITY DEFINER, STABLE | The rule over one project's settings row; false for a project with no row; executable by no API role                |
| grant_role_permissions(grant_scope_type, grant_role_type, entity_type)       | 301  | IMMUTABLE        | The role x permission matrix, encoded ONCE                                                                         |
| user_can(grant_scope_type, uuid, grant_permission, entity_type DEFAULT NULL) | 301  | SECURITY DEFINER | THE authority question; resolves the claim downward; the entity type is required at entity scope                   |
| user_has_account_grant(uuid)                                                 | 301  | SECURITY DEFINER | Grant EXISTENCE on an account or a project it owns                                                                 |
| private.is_child_nominee(entity_type, uuid, entity_type, uuid)               | 301  | SECURITY DEFINER | The one-hop parent -> child nomination reach, typed on both sides                                                  |
| project_open_for_voters(uuid)                                                | 301  | SECURITY DEFINER | The project-level anon visibility sub-rule                                                                         |
| contestant_app_public_config(uuid)                                           | 106  | SECURITY DEFINER | Five stored settings of a project for a reader with no row access (`access.contestantApp`, `access.answersLocked`, the entity types, the registration matrix, `analytics.trackEvents`); no policy calls it |
| private.entity_has_confirmed_nomination(entity_type, uuid, uuid)             | 301  | SECURITY DEFINER | The nomination-level anon visibility sub-rule                                                                      |
| private.caller_entity_ids(uuid, entity_type)                                 | 301  | SECURITY DEFINER | The ids of the caller's own `(entity, <type>, <id>, editor)` grants whose entity lies in the given project          |
| storage_path_can(grant_scope_type, text, text, text, storage_verb)           | 400  | SECURITY DEFINER | The storage authority question, asked of a PATH                                                                    |
| storage_path_is_public(text, text, text)                                     | 400  | SECURITY DEFINER | The storage visibility question, asked of a PATH                                                                   |
| delete_storage_object(text, text)                                            | 400  | SECURITY DEFINER | Deletes storage file via pg_net HTTP                                                                               |
| cleanup_entity_storage_files()                                               | 400  | SECURITY DEFINER | Trigger: deletes storage files on entity DELETE                                                                    |
| cleanup_old_image_file()                                                     | 400  | SECURITY DEFINER | Trigger: deletes old image file on UPDATE                                                                          |
| enforce_external_id_immutability()                                           | 500  | -                | Trigger: prevents external_id changes once set                                                                     |
| resolve_external_ref(jsonb, text, uuid)                                      | 501  | -                | Resolves external_id reference to UUID                                                                             |
| bulk_import(jsonb)                                                           | 501  | SECURITY INVOKER | Bulk upsert via external_id; skips `id`, `created_at`, `updated_at` and, on `nominations`, `entity_type`           |
| bulk_delete(jsonb)                                                           | 501  | SECURITY INVOKER | Bulk delete by prefix/ids/external_ids                                                                             |
| resolve_email_variables(uuid, uuid[], text, text)                            | 502  | SECURITY DEFINER | Resolves per-recipient email template variables in the given project                                               |
| get_nominations(uuid, uuid, uuid, boolean, integer)                          | 503  | SECURITY INVOKER | Nominations with entity data; `p_project_id` required                                                              |
| get_entity_basic_data(entity_type, uuid)                                     | 503  | SECURITY DEFINER | Basic data of an entity the caller holds nomination.read on; probes only the named table                           |
| get_user_entities(uuid)                                                      | 503  | SECURITY INVOKER | One `jsonb` object whose `entities` array lists every candidate and organization the caller holds an editor grant on in the given project, beside `password_set` from `private.caller_password_set()`; one row with an empty array for a caller with none |
| get_entity_user_data(uuid, entity_type, uuid)                                | 503  | SECURITY INVOKER | The editable row of one entity the caller holds an editor grant on in the given project; no row, never a raise, for any other entity |
| get_entity_nominations(uuid, entity_type, uuid) -> jsonb                     | 503  | SECURITY DEFINER | `(p_project_id, p_entity_type, p_entity_id)`. The nominations, confirmed or not, of one candidate or organization the caller holds an editor grant on in the given project, as a `jsonb` array ordered by `sort_order` (nulls last), then `id`. Keys of an element: `id`, `election_id`, `election_name`, `constituency_id`, `constituency_name`, `election_round`, `election_symbol`, `confirmed`, `custom_data`, `parent` (JSON null, or `entity_type`, `entity_id`, `name`, `short_name` of the entity the parent nomination nominates). An empty array for an entity with no nomination; `NULL`, never a raise, for a NULL parameter, a faction or an alliance, and any entity the caller holds no editor grant on in that project. Gate: `private.caller_entity_ids`, before any read; `user_can` is not asked. EXECUTE: `authenticated` only |
| get_nomination_parent_options(uuid, entity_type, uuid, jsonb) -> jsonb       | 503  | SECURITY DEFINER | `(p_project_id, p_entity_type, p_entity_id, p_contests)`. The entities one candidate or organization the caller edits may stand under: for a candidate every confirmed organization of the project, for an organization every alliance, confirmed or not, as a `jsonb` array ordered by `sort_order` (nulls last), then `id`. Keys of an element: `id`, `entity_type`, `name`, `short_name`, `color`, `image`, `nominated` (those of the asked contests at which the option holds a nomination at the election's current round). `p_contests` is a JSON array of `{election_id, constituency_id}`; its length is not bounded. `NULL`, never a raise, for a NULL parameter, a type that is not served, a caller with no editor grant on the named entity in that project, and a malformed `p_contests`. Gate: `private.caller_entity_ids`; `user_can` is not asked, so a project admin is refused. EXECUTE: `authenticated` only |
| set_entity_nominations(entity_type, uuid, jsonb) -> jsonb                    | 503  | SECURITY INVOKER | `(p_entity_type, p_entity_id, p_nominations)`. Writes the whole set of nominations of one candidate or organization in one call: inserts, updates, deletes what the set leaves out, and creates the nomination of a named parent that has none at the contest. Keys of one object: `id` (optional), `election_id`, `constituency_id`, `election_symbol`, `parent` = `{"kind":"none"}` / `{"kind":"entity","entity_type","entity_id"}` / `{"kind":"other","name"}` / `{"kind":"keep"}`. Reach: the entity's nominations the caller can read, at their election's current round, in an election whose type admits the entity's type. Answer: `{"inserted","updated","deleted","unchanged","parents_created"}`. Refusals of its own: 22023 for a malformed argument or object, 42501 for a caller that `user_can` does not answer for the member 'nomination.edit' on the entity, and for a row that could not be written; the policies', triggers' and foreign key's refusals pass through (23503, 23514, P0001). Forces `nominations_parent_required` as its last statement and sets it back to deferred. `search_path = ''`. EXECUTE: granted to `authenticated` by name; the catalogue also lists `service_role` (Supabase's default privileges), never `anon`. Asks `private.nomination_list_checked` (at most 1000 objects, refused before any object is read), `private.nomination_object_checked` for each object's shape, and `private.parent_nomination_resolved` for an `entity` parent, which refuses with 22023 a parent that is no entity of the entity's project. A named parent is not held to the options of `get_nomination_parent_options` |
| upsert_answers(entity_type, uuid, jsonb, boolean)                            | 503  | SECURITY INVOKER | Atomic answer write; the type selects the one table written (`candidate` or `organization`), any other type raises |

### Invitation functions

Derived from `pg_proc` on the applied database on 2026-10-07; the rows of `recovery_link_request`, `invitation_mode_allowed` and `email_holds_grant_in_project` are read from `506-invitation-rpcs.sql` on 2026-10-16, the row of `create_invitations` from the file and the catalogue on 2026-10-18, and `private.user_password_set` is now in `301-auth-functions.sql` (the table above) (signature, `prosecdef`, and
`has_function_privilege` for `anon`, `authenticated` and `service_role`). Every definer function pins
`search_path = ''`. File 305 is `305-invitations.sql`, 506 is `506-invitation-rpcs.sql`.

| Function | File | Security | EXECUTE | Purpose |
| --- | --- | --- | --- | --- |
| create_invitations(p_project_id uuid, p_invitations jsonb, p_confirm_entity boolean) -> jsonb | 506 | SECURITY INVOKER | authenticated, service_role | Seeds a batch in one transaction. Inserts as its caller, so the INSERT policy decides. `p_confirm_entity` is required, has no DEFAULT and refuses NULL: `true` confirms each named entity target as the caller, `false` none, and no call unconfirms. An entity-scope candidate or organization item may carry `nominations`, a JSON array of at most 1000 objects (`set_entity_nominations`' keys plus `confirmed`, required, an optional `id` of the entity's nomination to update, an optional `election_round` and the writable columns), checked by the same three private functions and created or updated as the caller, never deleted; a parent's nomination it creates is unconfirmed. Returns one object per item with the generated `code` (NULL on an email item), `entity_confirmed` (NULL on a project-scope item) and, when the item stated the key, `nominations` = `{inserted, updated, unchanged, parents_created}`. Sends nothing, creates no entity and no user |
| claim_invitations(p_project_id uuid) -> jsonb | 506 | SECURITY DEFINER | authenticated only | Writes one `grants` row per open invitation addressed to the caller's own CONFIRMED address (and per code row bound to it). Returns `{claimed, skipped, password_set}`; skip reasons `candidate_has_editor` and `target_not_in_project`. Takes no address, user id or invitation id |
| invitation_code_status(p_project_id uuid, p_code text) -> text | 506 | SECURITY DEFINER, STABLE | service_role only | `valid`, `used` or `unknown`; counts nothing |
| invitation_link_request(p_project_id uuid, p_email text DEFAULT NULL, p_code text DEFAULT NULL) -> text | 506 | SECURITY DEFINER | service_role only | The address a sign-in mail may go to, or NULL. A non-NULL answer has taken the address's 60-second slot and, for an open code, bound the address |
| invitation_link_release(p_project_id uuid, p_email text, p_code text DEFAULT NULL) -> void | 506 | SECURITY DEFINER | service_role only | Gives a slot back when no mail was handed to SMTP, and clears the binding time of an open code row bound to that address |
| recovery_link_request(p_project_id uuid, p_email text) -> jsonb | 506 | SECURITY DEFINER | service_role only | `{email, mail}` with `mail` `recovery` (a grant holder's confirmed address) or `sign-in` (an address with an open, allowed invitation and no such user), or NULL. A non-NULL answer has taken the address's 60-second slot, the one `invitation_link_request` takes |
| invitation_code_claimant_email(p_project_id uuid, p_code text) -> text | 506 | SECURITY DEFINER | service_role only | The claimant's address for a used code, or NULL; NULL from the eleventh answer inside fifteen minutes |
| invitation_link_witness_open() -> uuid | 506 | SECURITY DEFINER | service_role only | Opens a witness record; deletes records opened more than a day ago |
| invitation_link_witness(p_id uuid, p_outcome text DEFAULT NULL) -> text | 506 | SECURITY DEFINER | service_role only | Reads a record's outcome (`sent`, `not-sent`, NULL while open); with `p_outcome` first completes an open record by UPDATE |
| private.invitation_mode_allowed(p_invitation public.invitations) -> boolean | 506 | invoker, STABLE | no API role | The registration-mode condition: true for a row that is not judged (project scope, faction, alliance), else `private.registration_mode_allowed` for the row's project, target type and mode. Asked by `invitation_code_status`, `invitation_link_request`, `recovery_link_request` and `claim_invitations` of open rows |
| private.email_holds_grant_in_project(p_project_id uuid, p_email text) -> boolean | 506 | invoker, STABLE | no API role | Whether a user with that confirmed address holds a grant in the project; shared by the two link functions |
| private.invitation_throttle_take(p_key text, p_max integer, p_window interval) -> boolean | 506 | SECURITY DEFINER | no API role | Counts one take against a throttle key; only the definer functions above call it |
| private.project_account_id(p_project_id uuid) -> uuid | 305 | SECURITY DEFINER, STABLE | authenticated | The account of a project, for the project-admin arm of the invitation policies |
| private.normalise_invitation_code(p_code text) -> text | 305 | invoker, IMMUTABLE | authenticated, service_role | Upper-cases, drops everything but digits and letters, reads `O` as `0` and `I`, `L` as `1` |
| private.invitation_code_hash(p_code text) -> text | 305 | invoker, IMMUTABLE | authenticated, service_role | Hex sha256 of the normalised code; normalises its own argument |
| private.generate_invitation_code() -> text | 305 | invoker, VOLATILE | authenticated, service_role | Twelve symbols of Crockford's base-32 alphabet (60 bits), formatted `XXXX-XXXX-XXXX` |
| private.localized_has_text(p_val jsonb) -> boolean | 506 | invoker, IMMUTABLE | authenticated, service_role | Whether a localized value holds any non-blank text; decides whether a seeded entity "has a name" |
| prepare_invitation() | 305 | trigger, SECURITY INVOKER | not callable by anon or authenticated | See the `invitations` table |
| cleanup_invitations_on_delete() | 305 | trigger, SECURITY DEFINER | not callable by anon or authenticated | See the `invitations` table |
| cleanup_invitation_throttle_on_delete() | 506 | trigger, SECURITY DEFINER | not callable by anon or authenticated | See the `invitations` table |

The three code functions and `localized_has_text` are executable by `authenticated` because the insert
trigger and `create_invitations` are SECURITY INVOKER and call them as the inserting role; they are in
`private`, which PostgREST does not expose, and read no table. The generated types state `Returns: string`
for `invitation_link_request`, `invitation_code_claimant_email` and `invitation_link_witness` although
each can answer NULL: a caller tests for NULL whatever the type says.

## COLUMN_MAP / PROPERTY_MAP Bridge

The type bridge in `packages/supabase-types/src/` connects DB column names to TypeScript property names:

- **database.ts** -- generated from Supabase introspection (`npx supabase gen types typescript --local`). Provides Row, Insert, Update types per table.
- **column-map.ts** -- maps only columns where snake_case differs from TypeScript camelCase.
- **PROPERTY_MAP** -- auto-generated reverse of COLUMN_MAP.
- **index.ts** -- exports Database, COLUMN_MAP, PROPERTY_MAP, ColumnName, PropertyName.

Key mappings from COLUMN_MAP:

- sort_order -> order, short_name -> shortName, custom_data -> customData
- first_name -> firstName, last_name -> lastName, organization_id -> organizationId
- category_id -> categoryId, election_ids -> electionIds, election_rounds -> electionRounds
- constituency_ids -> constituencyIds, entity_type -> entityType, allow_open -> allowOpen
- category_type -> categoryType, candidate_id -> candidateId, faction_id -> factionId
- alliance_id -> allianceId, election_id -> electionId, constituency_id -> constituencyId
- election_round -> electionRound, election_symbol -> electionSymbol
- parent_nomination_id -> parentNominationId, parent_id -> parentId
- election_date -> electionDate, election_start_date -> electionStartDate
- election_type -> electionType (the COLUMN MAP entry only; the frontend adapter reads the column itself and maps it to `ElectionData.nominationShape`, while `ElectionData.subtype` is fed by `elections.subtype` alone), multiple_rounds -> multipleRounds, current_round -> currentRound
- project_id -> projectId, account_id -> accountId, default_locale -> defaultLocale
- created_at -> createdAt, updated_at -> updatedAt

To regenerate: `cd apps/supabase && npx supabase gen types typescript --local > ../../packages/supabase-types/src/database.ts`
