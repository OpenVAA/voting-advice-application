# Schema Reference

Complete column listing for all 17 tables in the OpenVAA Supabase schema. Source: `apps/supabase/supabase/schema/` (18 SQL files).

## Table Reference

### Multi-tenancy

**accounts** (001-tenancy.sql)
- id: uuid PK DEFAULT gen_random_uuid()
- name: text NOT NULL
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()

**projects** (001-tenancy.sql)
- id: uuid PK DEFAULT gen_random_uuid()
- account_id: uuid NOT NULL FK accounts(id) ON DELETE CASCADE
- name: text NOT NULL
- default_locale: text NOT NULL DEFAULT 'en'
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()

### Elections

**elections** (002-elections.sql)
- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- is_generated: boolean DEFAULT false
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- election_date: date, election_start_date: date, election_type: text
- multiple_rounds: boolean DEFAULT false, current_round: integer DEFAULT 1
- published: boolean NOT NULL DEFAULT false (011)
- external_id: text (015)

**constituency_groups** (002-elections.sql)
- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- is_generated: boolean DEFAULT false
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- published: boolean NOT NULL DEFAULT false (011)
- external_id: text (015)

**constituencies** (002-elections.sql)
- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- is_generated: boolean DEFAULT false
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- keywords: jsonb
- parent_id: uuid FK constituencies(id) ON DELETE SET NULL
- published: boolean NOT NULL DEFAULT false (011)
- external_id: text (015)

**constituency_group_constituencies** (002-elections.sql) -- join table
- constituency_group_id: uuid NOT NULL FK constituency_groups(id) ON DELETE CASCADE
- constituency_id: uuid NOT NULL FK constituencies(id) ON DELETE CASCADE
- PRIMARY KEY (constituency_group_id, constituency_id)

**election_constituency_groups** (002-elections.sql) -- join table
- election_id: uuid NOT NULL FK elections(id) ON DELETE CASCADE
- constituency_group_id: uuid NOT NULL FK constituency_groups(id) ON DELETE CASCADE
- PRIMARY KEY (election_id, constituency_group_id)

### Entities

**candidates** (003-entities.sql)
- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- is_generated: boolean DEFAULT false
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- first_name: text NOT NULL, last_name: text NOT NULL
- organization_id: uuid FK organizations(id) ON DELETE SET NULL
- auth_user_id: uuid FK auth.users(id) ON DELETE SET NULL
- answers: jsonb DEFAULT '{}'::jsonb (006)
- published: boolean NOT NULL DEFAULT false (011)
- external_id: text (015)

**organizations** (003-entities.sql)
- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- auth_user_id: uuid FK auth.users(id) ON DELETE SET NULL
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- is_generated: boolean DEFAULT false
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- answers: jsonb DEFAULT '{}'::jsonb (006)
- published: boolean NOT NULL DEFAULT false (011)
- external_id: text (015)

**factions** (003-entities.sql)
- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- is_generated: boolean DEFAULT false
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- published: boolean NOT NULL DEFAULT false (011)
- external_id: text (015)

**alliances** (003-entities.sql)
- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- is_generated: boolean DEFAULT false
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- published: boolean NOT NULL DEFAULT false (011)
- external_id: text (015)

### Questions

**question_categories** (004-questions.sql)
- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- is_generated: boolean DEFAULT false
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- category_type: category_type DEFAULT 'opinion'
- election_ids: jsonb, election_rounds: jsonb, constituency_ids: jsonb, entity_type: jsonb
- published: boolean NOT NULL DEFAULT false (011)
- external_id: text (015)

**questions** (004-questions.sql)
- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- is_generated: boolean DEFAULT false
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- type: question_type NOT NULL
- category_id: uuid NOT NULL FK question_categories(id)
- choices: jsonb, settings: jsonb
- election_ids: jsonb, election_rounds: jsonb, constituency_ids: jsonb, entity_type: jsonb
- allow_open: boolean DEFAULT true, required: boolean DEFAULT true
- published: boolean NOT NULL DEFAULT false (011)
- external_id: text (015)

### Nominations

**nominations** (005-nominations.sql)
- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL FK projects(id) ON DELETE CASCADE
- name: jsonb, short_name: jsonb, info: jsonb, color: jsonb, image: jsonb
- sort_order: integer, subtype: text, custom_data: jsonb
- is_generated: boolean DEFAULT false
- created_at: timestamptz NOT NULL DEFAULT now(), updated_at: timestamptz NOT NULL DEFAULT now()
- candidate_id: uuid FK candidates(id) ON DELETE CASCADE
- organization_id: uuid FK organizations(id) ON DELETE CASCADE
- faction_id: uuid FK factions(id) ON DELETE CASCADE
- alliance_id: uuid FK alliances(id) ON DELETE CASCADE
- entity_type: entity_type NOT NULL GENERATED ALWAYS AS (CASE WHEN candidate_id...) STORED
- election_id: uuid NOT NULL FK elections(id) ON DELETE CASCADE
- constituency_id: uuid NOT NULL FK constituencies(id) ON DELETE CASCADE
- election_round: integer DEFAULT 1, election_symbol: text
- parent_nomination_id: uuid FK nominations(id) ON DELETE CASCADE
- unconfirmed: boolean DEFAULT false
- CHECK (num_nonnulls(candidate_id, organization_id, faction_id, alliance_id) = 1)
- published: boolean NOT NULL DEFAULT false (011)
- external_id: text (015)

### Auth

**user_roles** (011-auth-tables.sql)
- id: uuid PK DEFAULT gen_random_uuid()
- user_id: uuid NOT NULL FK auth.users(id) ON DELETE CASCADE
- role: user_role_type NOT NULL
- scope_type: text NOT NULL (values: 'candidate', 'party', 'project', 'account', 'global')
- scope_id: uuid (NULL for super_admin global scope)
- created_at: timestamptz NOT NULL DEFAULT now()
- UNIQUE (user_id, role, scope_type, scope_id)

### Settings

**app_settings** (007-app-settings.sql)
- id: uuid PK DEFAULT gen_random_uuid()
- project_id: uuid NOT NULL UNIQUE FK projects(id)
- settings: jsonb NOT NULL DEFAULT '{}'::jsonb
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()
- external_id: text (015)

### Infrastructure

**storage_config** (014-storage.sql)
- key: text PK
- value: text NOT NULL
- RLS enabled; REVOKE ALL from anon, authenticated, public; GRANT SELECT to service_role

## Triggers

| Trigger Name | Table(s) | Event | Function | Source |
|---|---|---|---|---|
| set_updated_at | all content tables + accounts, projects | BEFORE UPDATE | update_updated_at() | 001+ |
| validate_nomination_before_insert_or_update | nominations | BEFORE INSERT/UPDATE | validate_nomination() | 005 |
| validate_answers_before_insert_or_update | candidates, organizations | BEFORE INSERT/UPDATE | validate_answers_jsonb() | 006 |
| cascade_question_delete_to_answers | questions | AFTER DELETE | cascade_question_delete_to_jsonb_answers() | 006 |
| validate_question_type_change_trigger | questions | BEFORE UPDATE | validate_question_type_change() | 006 |
| enforce_external_id_immutability | all 11 content tables | BEFORE UPDATE | enforce_external_id_immutability() | 015 |
| cleanup_storage_on_delete | 10 entity tables | AFTER DELETE | cleanup_entity_storage_files() | 014 |
| cleanup_image_on_update | 10 entity tables | BEFORE UPDATE | cleanup_old_image_file() | 014 |

Storage cleanup tables: candidates, organizations, factions, alliances, elections, constituencies, constituency_groups, nominations, question_categories, questions.

## Indexes

**project_id B-tree** (009-indexes.sql): idx_{table}_project_id on elections, constituency_groups, constituencies, organizations, candidates, factions, alliances, question_categories, questions, nominations, app_settings (11 tables).

**FK B-tree** (009-indexes.sql): idx_projects_account_id, idx_candidates_organization_id, idx_questions_category_id, idx_constituencies_parent_id, idx_nominations_{candidate_id, organization_id, faction_id, alliance_id, election_id, constituency_id, parent_nomination_id}, idx_candidates_auth_user_id, idx_organizations_auth_user_id.

**Published partial** (011-auth-tables.sql): idx_{table}_published WHERE published = true on elections, candidates, organizations, questions, nominations (5 tables).

**External ID composite unique partial** (015-external-id.sql): idx_{table}_external_id ON (project_id, external_id) WHERE external_id IS NOT NULL on all 11 content tables.

**user_roles** (011-auth-tables.sql): idx_user_roles_user_id.

## Utility Functions

| Function | File | Security | Purpose |
|---|---|---|---|
| update_updated_at() | 000 | - | Trigger: sets updated_at to NOW() |
| get_localized(jsonb, text, text) | 000 | IMMUTABLE | 3-tier locale fallback (email helpers only) |
| validate_answer_value(jsonb, question_type, jsonb) | 000 | - | Validates answer value against question type |
| validate_nomination() | 000 | - | Trigger: enforces nomination hierarchy rules |
| validate_answers_jsonb() | 006 | - | Trigger: smart validation of JSONB answers |
| cascade_question_delete_to_jsonb_answers() | 006 | - | Trigger: removes orphaned answer keys on question delete |
| validate_question_type_change() | 006 | - | Trigger: prevents type changes invalidating answers |
| custom_access_token_hook(jsonb) | 012 | STABLE | Injects user_roles into JWT claims |
| has_role(text, text?, uuid?) | 012 | SECURITY DEFINER | Checks JWT claims for role assignment |
| can_access_project(uuid) | 012 | SECURITY DEFINER | Checks admin access to project |
| is_candidate_self(uuid) | 012 | SECURITY DEFINER | Checks auth_user_id = auth.uid() |
| is_storage_entity_published(text, text) | 014 | SECURITY DEFINER | Checks if entity at storage path is published |
| delete_storage_object(text, text) | 014 | SECURITY DEFINER | Deletes storage file via pg_net HTTP |
| cleanup_entity_storage_files() | 014 | SECURITY DEFINER | Trigger: deletes storage files on entity DELETE |
| cleanup_old_image_file() | 014 | SECURITY DEFINER | Trigger: deletes old image file on UPDATE |
| enforce_external_id_immutability() | 015 | - | Trigger: prevents external_id changes once set |
| resolve_external_ref(jsonb, text, uuid) | 016 | - | Resolves external_id reference to UUID |
| bulk_import(jsonb) | 016 | SECURITY INVOKER | Bulk upsert via external_id |
| bulk_delete(jsonb) | 016 | SECURITY INVOKER | Bulk delete by prefix/ids/external_ids |
| resolve_email_variables(uuid[], text, text) | 017 | SECURITY DEFINER | Resolves per-recipient email template variables |

## COLUMN_MAP / PROPERTY_MAP Bridge

The type bridge in `packages/supabase-types/src/` connects DB column names to TypeScript property names:

- **database.ts** -- generated from Supabase introspection (`npx supabase gen types typescript --local`). Provides Row, Insert, Update types per table.
- **column-map.ts** -- maps only columns where snake_case differs from TypeScript camelCase.
- **PROPERTY_MAP** -- auto-generated reverse of COLUMN_MAP.
- **index.ts** -- exports Database, COLUMN_MAP, PROPERTY_MAP, ColumnName, PropertyName.

Key mappings from COLUMN_MAP:
- sort_order -> order, short_name -> shortName, custom_data -> customData, is_generated -> isGenerated
- first_name -> firstName, last_name -> lastName, organization_id -> organizationId
- category_id -> categoryId, election_ids -> electionIds, election_rounds -> electionRounds
- constituency_ids -> constituencyIds, entity_type -> entityType, allow_open -> allowOpen
- category_type -> categoryType, candidate_id -> candidateId, faction_id -> factionId
- alliance_id -> allianceId, election_id -> electionId, constituency_id -> constituencyId
- election_round -> electionRound, election_symbol -> electionSymbol
- parent_nomination_id -> parentNominationId, parent_id -> parentId
- election_date -> electionDate, election_start_date -> electionStartDate
- election_type -> electionType, multiple_rounds -> multipleRounds, current_round -> currentRound
- project_id -> projectId, account_id -> accountId, default_locale -> defaultLocale
- created_at -> createdAt, updated_at -> updatedAt, auth_user_id -> authUserId

To regenerate: `cd apps/supabase && npx supabase gen types typescript --local > ../../packages/supabase-types/src/database.ts`
