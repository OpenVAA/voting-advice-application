-- Enum type definitions
--
-- All enum types used across the schema:
-- - question_type - question answer value types
-- - entity_type - nomination entity discriminator
-- - category_type - question category classification
-- - grant_scope_type - grant scope vocabulary
-- - grant_role_type - grant role levels
-- - grant_permission - the permission verbs user_can is written in
-- - storage_verb - the read/write split storage_path_can maps to two different permissions
-- - nomination_shape - which of the three nomination flows an election runs; the type of elections.election_type
CREATE TYPE public.question_type AS ENUM(
  'text',
  'number',
  'boolean',
  'image',
  'date',
  'multipleText',
  'singleChoiceOrdinal',
  'singleChoiceCategorical',
  'multipleChoiceCategorical'
);

CREATE TYPE public.entity_type AS ENUM(
  'candidate',
  'organization',
  'faction',
  'alliance'
);

CREATE TYPE public.category_type AS ENUM('info', 'opinion', 'default');

-- The grant scopes, ordered from widest to narrowest. public.grants.scope takes this type, and the two CHECK constraints on that table tie target_type and target_id to it.
CREATE TYPE public.grant_scope_type AS ENUM('global', 'account', 'project', 'entity');

-- Exactly two role levels: every supported user type is an admin or an editor of some scope. Managing editors is the permission project.manage_editors, with entity.invite_children as its entity-scope equivalent, so a third level would be a security enum member that nothing grants.
CREATE TYPE public.grant_role_type AS ENUM('admin', 'editor');

-- The permission verbs of user_can, in capability-matrix order. Enum ordinals are persisted, so the order is part of the type: scripts/assert-grant-permission-enum.mjs holds the same list in the same order and fails lint:check if this declaration or the generated types drift from it.
CREATE TYPE public.grant_permission AS ENUM(
  'feedback.read',
  'feedback.manage',
  'account.edit_settings',
  'account.manage_projects',
  'account.manage_admins',
  'project.manage_editors',
  'project.edit_project_settings',
  'project.edit_app_settings',
  'project.edit_structure',
  'project.edit_questions',
  'project.read_structure',
  'project.edit_entities',
  'project.edit_nominations',
  'project.read_entities',
  'entity.edit_answers',
  'entity.read_answers',
  'entity.edit_immutable',
  'entity.invite_children',
  'entity.confirm',
  'nomination.edit',
  'nomination.read',
  'nomination.confirm',
  'nomination.create_parent'
);

-- The verb a storage policy asks about. public.storage_path_can branches on it, so the same call with a different verb resolves to a different permission, and read and write are separable at the storage layer rather than merely differently named. A body that ignored the verb would fail the two read-but-not-write identities in 20-storage-authority.test.sql.
--
-- An enum rather than text: a typo in a text literal inside a policy predicate denies silently, where a typo in an enum literal fails to apply.
CREATE TYPE public.storage_verb AS ENUM('read', 'write');

-- The three nomination flows an election can run. It is the type of elections.election_type, and like grant_scope_type it is named for what it means rather than for the column that holds it.
--
-- The members are exactly the three flows, so any other value in elections.election_type is a PostgreSQL error rather than a stored string.
CREATE TYPE public.nomination_shape AS ENUM(
  'organization_only',
  'candidate_only',
  'organization_list'
);
-- API role settings
--
-- Provides: the statement_timeout the anon role runs under.
--
-- WHY: Supabase ships `anon` with statement_timeout = 3s and `authenticated` with 8s. At municipal scale (tens of thousands of candidates and nominations) the anonymous whole-project nominations read takes longer than 3 s and fails with HTTP 500 (SQLSTATE 57014). Anon is raised to the 8 s authenticated already has.
--
-- ⚠ HOSTED DEPLOYMENTS: the value lives on the role, not in config.toml, so a project whose migrations are not applied keeps Supabase's 3 s.
--------------------------------------------------------------------------------
ALTER ROLE anon
SET
  statement_timeout = '8s';

-- PostgREST caches role settings; make it re-read them.
NOTIFY pgrst,
'reload config';
-- Utility functions
--
-- Functions:
-- - update_updated_at() - trigger for automatic updated_at timestamps
-- - get_localized() - extract a locale string from JSONB (email helpers only)
--------------------------------------------------------------------------------
-- update_updated_at
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at () RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- get_localized: extract locale string from JSONB with fallback chain
--
-- NOTE: Only used by email helpers (502-email-helpers.sql) for server-side variable resolution. Voter/candidate API responses return all locales as JSONB; locale selection happens client-side.
--
-- Fallback order:
--   1. p_val->>p_locale          (requested locale)
--   2. p_val->>p_default_locale  (project default)
--   3. first available key       (any content is better than NULL)
--   4. NULL                      (p_val is NULL or empty)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_localized (
  p_val JSONB,
  p_locale TEXT,
  p_default_locale TEXT DEFAULT 'en'
) RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF p_val IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_val ? p_locale THEN
    RETURN p_val ->> p_locale;
  END IF;

  IF p_val ? p_default_locale THEN
    RETURN p_val ->> p_default_locale;
  END IF;

  RETURN (SELECT p_val ->> k FROM jsonb_object_keys(p_val) AS k LIMIT 1);
END;
$$;
-- Validation functions
--
-- Functions:
-- - is_localized_string(jsonb) - whether a JSONB value is a localized string object
-- - is_valid_choice_id(jsonb, jsonb) - whether a value is the id of one of the given choices
-- - is_image(jsonb) - whether a JSONB value is a well-formed StoredImage object
-- - validate_image(jsonb) - raise a rule-specific error if a JSONB value is not a well-formed StoredImage object
-- - validate_answer_value(jsonb, question_type, jsonb) - validate an answer value against its question type
-- - validate_nomination() - enforce nomination tenancy, hierarchy and parent consistency
-- - enforce_nomination_confirmation() - refuse or clear a nomination's confirmation the caller may not set
-- - enforce_nomination_entity_columns() - bound the nomination columns a non-admin may write
-- - enforce_entity_immutability() - gate the entity confirmation flag and freeze a confirmed entity's name
--------------------------------------------------------------------------------
-- is_localized_string: check if a JSONB value is a localized string object
--
-- A localized string is a non-empty JSONB object whose values are all strings.
--
-- Examples: {"en": "Hello", "fi": "Hei"} and {"en": "text"}.
--
-- Returns false for null, "plain string", 42, [], {} and {"key": 42}.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_localized_string (p_val JSONB) RETURNS BOOLEAN LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  p_value JSONB;
BEGIN
  IF p_val IS NULL OR jsonb_typeof(p_val) != 'object' THEN
    RETURN FALSE;
  END IF;

  -- Empty object is not a valid localized string
  IF p_val = '{}'::jsonb THEN
    RETURN FALSE;
  END IF;

  -- Every value must be a string
  FOR p_value IN SELECT value FROM jsonb_each(p_val)
  LOOP
    IF jsonb_typeof(p_value) != 'string' THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$;

--------------------------------------------------------------------------------
-- is_valid_choice_id: check if a value is present in a choices array
--
-- Choices format: [{"id": "1", ...}, {"id": "2", ...}].
--
-- Returns true if p_value matches any choice id, and also when p_valid_choices is NULL or carries no ids (nothing to validate against).
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_valid_choice_id (p_value JSONB, p_valid_choices JSONB) RETURNS BOOLEAN LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  p_choice_ids JSONB;
BEGIN
  IF p_valid_choices IS NULL THEN
    RETURN TRUE;
  END IF;

  SELECT jsonb_agg(c -> 'id') INTO p_choice_ids
  FROM jsonb_array_elements(p_valid_choices) AS c;

  IF p_choice_ids IS NULL THEN
    RETURN TRUE;
  END IF;

  RETURN p_choice_ids @> jsonb_build_array(p_value);
END;
$$;

--------------------------------------------------------------------------------
-- is_image: check if a JSONB value is a well-formed StoredImage object
--
-- Reports the verdict only. A caller that needs to know which rule failed calls validate_image, which raises a distinct message for each rule.
--
-- The predicate form of the image-shape rule, callable without an answer write (for example from a CHECK constraint or a bulk_import pre-flight); no schema object calls it, and 08-triggers.test.sql covers it. EXECUTE defaults to PUBLIC, and the function reads no table, so it exposes no data.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_image (p_val JSONB) RETURNS BOOLEAN LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  PERFORM public.validate_image(p_val);
  RETURN TRUE;
EXCEPTION
  -- Only a shape violation is a FALSE verdict. validate_image signals every rule with a bare RAISE EXCEPTION (SQLSTATE P0001, raise_exception), so that is the only error converted. Anything else, such as undefined_function, insufficient_privilege or out of memory, propagates: catching it would report a broken validator as "not an image" for every value.
  WHEN raise_exception THEN
    RETURN FALSE;
END;
$$;

--------------------------------------------------------------------------------
-- validate_image: raise if a JSONB value is not a well-formed StoredImage object
--
-- StoredImage shape: {path, pathDark?, alt?, width?, height?, focalPoint?}.
--
-- Every rule raises its own message, so a caller is told which part of the value to fix.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_image (p_val JSONB) RETURNS VOID LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF p_val IS NULL OR jsonb_typeof(p_val) != 'object' THEN
    RAISE EXCEPTION 'Answer for image question must be an object';
  END IF;
  -- Validate StoredImage structure: {path, pathDark?, alt?, width?, height?, focalPoint?}
  IF NOT (p_val ? 'path') THEN
    RAISE EXCEPTION 'StoredImage must have a "path" property';
  END IF;
  IF jsonb_typeof(p_val -> 'path') != 'string' THEN
    RAISE EXCEPTION 'StoredImage "path" must be a string';
  END IF;
  IF p_val ? 'pathDark' AND jsonb_typeof(p_val -> 'pathDark') != 'string' THEN
    RAISE EXCEPTION 'StoredImage "pathDark" must be a string';
  END IF;
  IF p_val ? 'alt' AND jsonb_typeof(p_val -> 'alt') != 'string' THEN
    RAISE EXCEPTION 'StoredImage "alt" must be a string';
  END IF;
  IF p_val ? 'width' AND jsonb_typeof(p_val -> 'width') != 'number' THEN
    RAISE EXCEPTION 'StoredImage "width" must be a number';
  END IF;
  IF p_val ? 'height' AND jsonb_typeof(p_val -> 'height') != 'number' THEN
    RAISE EXCEPTION 'StoredImage "height" must be a number';
  END IF;
  IF p_val ? 'focalPoint' THEN
    IF jsonb_typeof(p_val -> 'focalPoint') != 'object' THEN
      RAISE EXCEPTION 'StoredImage "focalPoint" must be an object';
    END IF;
    IF NOT (p_val -> 'focalPoint' ? 'x') OR NOT (p_val -> 'focalPoint' ? 'y') THEN
      RAISE EXCEPTION 'StoredImage "focalPoint" must have "x" and "y" properties';
    END IF;
    IF jsonb_typeof(p_val -> 'focalPoint' -> 'x') != 'number' THEN
      RAISE EXCEPTION 'StoredImage "focalPoint.x" must be a number';
    END IF;
    IF jsonb_typeof(p_val -> 'focalPoint' -> 'y') != 'number' THEN
      RAISE EXCEPTION 'StoredImage "focalPoint.y" must be a number';
    END IF;
  END IF;
END;
$$;

--------------------------------------------------------------------------------
-- validate_answer_value: validate an answer against its question type
--
-- Answer format: {"value": ..., "info": ...}. The "info" field is optional and can be a plain string or localized string. A NULL or JSON null value passes without further checks.
--
-- Text answers: value can be a plain string or a localized string object.
-- MultipleText answers: value must be an array of strings or localized strings.
-- Choice answers: value must be a valid choice ID from the choices array.
-- MultipleChoice answers: all array items must be valid choice IDs.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_answer_value (
  p_answer_val JSONB,
  p_q_type public.question_type,
  p_valid_choices JSONB DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  p_answer_value JSONB;
  p_answer_info JSONB;
  p_item JSONB;
BEGIN
  p_answer_value := p_answer_val -> 'value';

  IF p_answer_value IS NULL OR p_answer_value = 'null'::jsonb THEN
    RETURN;
  END IF;

  -- Validate optional info field: must be string or localized string
  p_answer_info := p_answer_val -> 'info';
  IF p_answer_info IS NOT NULL AND p_answer_info != 'null'::jsonb THEN
    IF jsonb_typeof(p_answer_info) != 'string' AND NOT public.is_localized_string(p_answer_info) THEN
      RAISE EXCEPTION 'Answer info must be a string or localized string object';
    END IF;
  END IF;

  CASE p_q_type
    WHEN 'text' THEN
      -- Text answers accept plain strings or localized string objects
      IF jsonb_typeof(p_answer_value) != 'string' AND NOT public.is_localized_string(p_answer_value) THEN
        RAISE EXCEPTION 'Answer for text question must be a string or localized string object';
      END IF;
    WHEN 'number' THEN
      IF jsonb_typeof(p_answer_value) != 'number' THEN
        RAISE EXCEPTION 'Answer for number question must be a number';
      END IF;
    WHEN 'boolean' THEN
      IF jsonb_typeof(p_answer_value) != 'boolean' THEN
        RAISE EXCEPTION 'Answer for boolean question must be a boolean';
      END IF;
    WHEN 'date' THEN
      IF jsonb_typeof(p_answer_value) != 'string' THEN
        RAISE EXCEPTION 'Answer for date question must be a date string';
      END IF;
    WHEN 'singleChoiceOrdinal', 'singleChoiceCategorical' THEN
      IF jsonb_typeof(p_answer_value) != 'string' AND jsonb_typeof(p_answer_value) != 'number' THEN
        RAISE EXCEPTION 'Answer for choice question must be a choice ID (string or number)';
      END IF;
      IF NOT public.is_valid_choice_id(p_answer_value, p_valid_choices) THEN
        RAISE EXCEPTION 'Answer choice ID not in valid choices';
      END IF;
    WHEN 'multipleChoiceCategorical' THEN
      IF jsonb_typeof(p_answer_value) != 'array' THEN
        RAISE EXCEPTION 'Answer for multiple choice question must be an array';
      END IF;
      -- Validate each item is a valid choice ID
      IF p_valid_choices IS NOT NULL THEN
        FOR p_item IN SELECT * FROM jsonb_array_elements(p_answer_value)
        LOOP
          IF NOT public.is_valid_choice_id(p_item, p_valid_choices) THEN
            RAISE EXCEPTION 'Answer choice ID % not in valid choices', p_item;
          END IF;
        END LOOP;
      END IF;
    WHEN 'multipleText' THEN
      IF jsonb_typeof(p_answer_value) != 'array' THEN
        RAISE EXCEPTION 'Answer for multipleText question must be an array';
      END IF;
      -- Each array item must be a string or localized string
      FOR p_item IN SELECT * FROM jsonb_array_elements(p_answer_value)
      LOOP
        IF jsonb_typeof(p_item) != 'string' AND NOT public.is_localized_string(p_item) THEN
          RAISE EXCEPTION 'Each item in multipleText answer must be a string or localized string object';
        END IF;
      END LOOP;
    WHEN 'image' THEN
      PERFORM public.validate_image(p_answer_value);
  END CASE;
END;
$$;

--------------------------------------------------------------------------------
-- validate_nomination: enforce hierarchy and election/constituency consistency
--
-- Hierarchy rules:
--   alliance    -> no parent allowed
--   organization -> parent must be alliance (or none for standalone)
--   faction     -> parent MUST be organization
--   candidate   -> parent must be organization or faction (or none for standalone)
--
-- Consistency rules:
--   The nomination's election and constituency must belong to the nomination's own project.
--   If parent_nomination_id is set, election_id, constituency_id, and election_round must match the parent nomination.
--   A faction's parent must be the nomination of that faction's own organization, not merely of some organization. The exception names both organization ids.
--
-- SECURITY DEFINER with an empty search_path, because an entity user may insert nominations and cannot read every parent it may point at. Under invoker rights the parent lookup would run under that user's row-level security, and the `NOT FOUND` branch would report an unreadable parent as a missing one. 23-nominations-write.test.sql has an entity user insert a child under a parent that user cannot read.
--
-- The messages disclose whether a supplied identifier names a nomination, and of what type. That is accepted: the identifiers are unguessable UUIDs, so the disclosure needs knowledge that already implies access, and specific messages keep seed and import failures diagnosable.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_nomination () RETURNS TRIGGER SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  p_parent_type public.entity_type;
  p_parent_election_id uuid;
  p_parent_constituency_id uuid;
  p_parent_election_round integer;
  p_parent_organization_id uuid;
  p_child_type public.entity_type;
  p_faction_organization_id uuid;
BEGIN
  -- Derive entity_type from the FK columns
  p_child_type := CASE
    WHEN NEW.candidate_id IS NOT NULL THEN 'candidate'::public.entity_type
    WHEN NEW.organization_id IS NOT NULL THEN 'organization'::public.entity_type
    WHEN NEW.faction_id IS NOT NULL THEN 'faction'::public.entity_type
    WHEN NEW.alliance_id IS NOT NULL THEN 'alliance'::public.entity_type
  END;

  -- Tenancy: the nomination's election and constituency must belong to the nomination's own project. The foreign keys name the rows, not their project, so without this an entity grantee of project A could write or move a nomination into project B's contest. Checked for every writer, admins and service_role included, because a cross-project nomination is corrupt data whoever wrote it. The entity's own project is checked by the entity write policies in 302-rls.sql, not here, because 07-rpc-security.test.sql builds a cross-project entity row as a negative control.
  IF NOT EXISTS (
    SELECT 1 FROM public.elections e WHERE e.id = NEW.election_id AND e.project_id = NEW.project_id
  ) THEN
    RAISE EXCEPTION 'Nomination election % does not belong to the nomination''s project %', NEW.election_id, NEW.project_id
      USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.constituencies c WHERE c.id = NEW.constituency_id AND c.project_id = NEW.project_id
  ) THEN
    RAISE EXCEPTION 'Nomination constituency % does not belong to the nomination''s project %', NEW.constituency_id, NEW.project_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.parent_nomination_id IS NULL THEN
    -- Top-level: faction must have a parent
    IF p_child_type = 'faction' THEN
      RAISE EXCEPTION 'Faction nominations must have a parent organization nomination';
    END IF;
    RETURN NEW;
  END IF;

  -- Look up parent nomination
  SELECT
    CASE
      WHEN p.candidate_id IS NOT NULL THEN 'candidate'::public.entity_type
      WHEN p.organization_id IS NOT NULL THEN 'organization'::public.entity_type
      WHEN p.faction_id IS NOT NULL THEN 'faction'::public.entity_type
      WHEN p.alliance_id IS NOT NULL THEN 'alliance'::public.entity_type
    END,
    p.election_id,
    p.constituency_id,
    p.election_round,
    p.organization_id
  INTO p_parent_type, p_parent_election_id, p_parent_constituency_id, p_parent_election_round, p_parent_organization_id
  FROM public.nominations p
  WHERE p.id = NEW.parent_nomination_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent nomination % not found', NEW.parent_nomination_id;
  END IF;

  -- Validate parent-child entity type combination
  CASE p_child_type
    WHEN 'alliance' THEN
      RAISE EXCEPTION 'Alliance nominations cannot have a parent';
    WHEN 'organization' THEN
      IF p_parent_type != 'alliance' THEN
        RAISE EXCEPTION 'Organization nomination parent must be an alliance nomination, got %', p_parent_type;
      END IF;
    WHEN 'faction' THEN
      IF p_parent_type != 'organization' THEN
        RAISE EXCEPTION 'Faction nomination parent must be an organization nomination, got %', p_parent_type;
      END IF;
      -- The parent must be the nomination of the faction's own organization, not of any organization. The parent's organization comes from the SELECT ... INTO above; this reads the faction's.
      --
      -- The message names both organizations, so a seed log tells this failure apart from the parent-type error above; the two need different fixes.
      SELECT f.organization_id INTO p_faction_organization_id
      FROM public.factions f
      WHERE f.id = NEW.faction_id;

      IF p_faction_organization_id IS DISTINCT FROM p_parent_organization_id THEN
        RAISE EXCEPTION 'Faction nomination parent must be the nomination of the faction''s OWN organization (faction belongs to organization %, parent nomination carries organization %)',
          COALESCE(p_faction_organization_id::text, '(none)'),
          COALESCE(p_parent_organization_id::text, '(none)');
      END IF;
    WHEN 'candidate' THEN
      IF p_parent_type NOT IN ('organization', 'faction') THEN
        RAISE EXCEPTION 'Candidate nomination parent must be an organization or faction nomination, got %', p_parent_type;
      END IF;
  END CASE;

  -- Validate election/constituency/round consistency with parent
  IF NEW.election_id != p_parent_election_id THEN
    RAISE EXCEPTION 'Nomination election_id must match parent (expected %, got %)',
      p_parent_election_id, NEW.election_id;
  END IF;

  IF NEW.constituency_id != p_parent_constituency_id THEN
    RAISE EXCEPTION 'Nomination constituency_id must match parent (expected %, got %)',
      p_parent_constituency_id, NEW.constituency_id;
  END IF;

  IF NEW.election_round IS DISTINCT FROM p_parent_election_round THEN
    RAISE EXCEPTION 'Nomination election_round must match parent (expected %, got %)',
      p_parent_election_round, NEW.election_round;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- enforce_nomination_confirmation: the confirmation transition
--
-- Editing a nomination turns its confirmation off. The system sets the flag, so this is a trigger rather than a policy: a policy can refuse a row but cannot rewrite one. Three rules, in order:
--
--   1. On either verb, a row being confirmed while its custom_data carries `requestedParentOrganization` is refused. A candidate nomination with a NULL parent is either independent or waiting for a party that is not in the system yet, and that key is the only difference. Confirming such a row would publish as an independent a candidate who asked for a party.
--   2. On UPDATE, when the caller's effective database role is `authenticated` and the caller does not hold `nomination.confirm` on the row's project, an attempt to turn the flag on is refused by name, and any other edit has the flag forced off. The refusal is explicit so a client never believes an ignored request succeeded.
--   3. Otherwise the supplied value stands. That makes an admin's edit-and-confirm a single statement, and keeps a service-role re-seed from unconfirming every row it touches.
--
-- Rule 2 is scoped to the effective database role, not to "the caller has a token": PostgREST sets claims for the service role too, so a token test would make a second `yarn db:seed` unconfirm every row it upserted. 23-nominations-write.test.sql pins that behaviour (two seed runs, zero unconfirmed rows).
--
-- A project editor holds `nomination.edit` but not `nomination.confirm`, so its edits also turn confirmation off and only an admin can restore the flag. That is the review gate.
--
-- On INSERT it also repeats the policy cap on originated unconfirmed parent nominations, so the caller is told the limit.
--
-- SECURITY INVOKER, unlike validate_nomination: the role test must see the caller's effective role, which owner rights would replace. It reads no table directly; its authority questions go through `user_can` and the private cap-count helper.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_nomination_confirmation () RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  -- Rule 1: the free-text branch can never be confirmed, on either verb.
  IF NEW.confirmed
     AND NEW.custom_data IS NOT NULL
     AND NEW.custom_data ? 'requestedParentOrganization' THEN
    RAISE EXCEPTION 'Nomination % cannot be confirmed while custom_data carries "requestedParentOrganization" (%): an admin must resolve the requested party first, or confirming would publish as an independent a candidate who asked for a party',
      COALESCE(NEW.id::text, '(new)'),
      NEW.custom_data ->> 'requestedParentOrganization';
  END IF;

  -- Rule 2: an entity user may edit, and editing unconfirms. Only a holder of nomination.confirm may turn the flag on, and an attempt to do so without it is refused rather than quietly dropped.
  IF TG_OP = 'UPDATE'
     AND current_user = 'authenticated'
     AND NOT public.user_can('project', NEW.project_id, 'nomination.confirm') THEN
    IF NEW.confirmed AND NOT OLD.confirmed THEN
      RAISE EXCEPTION 'Setting nomination % confirmed requires the nomination.confirm permission on project %; editing a nomination always turns its confirmation off',
        NEW.id, NEW.project_id;
    END IF;
    NEW.confirmed := false;
  END IF;

  -- The cap on originated unconfirmed parent nominations, at 10.
  --
  -- The `entity_insert_parent_nominations` policy enforces the cap, but a row-level security refusal names the policy and never the limit. A BEFORE INSERT trigger runs ahead of the policy's check, so this message, which names the limit, is the one the caller sees.
  --
  -- Scoped to the population the cap is about: an `authenticated` caller without `project.edit_nominations` inserting an unconfirmed organization nomination. Admins may create placeholder parents, and the service-role and owner paths run as other roles.
  IF TG_OP = 'INSERT'
     AND current_user = 'authenticated'
     AND NOT NEW.confirmed
     AND NEW.organization_id IS NOT NULL
     AND NOT public.user_can('project', NEW.project_id, 'project.edit_nominations')
     AND private.caller_unconfirmed_originated_count() >= 10 THEN
    RAISE EXCEPTION 'A caller may originate at most 10 unconfirmed parent organization nominations; this caller already holds %. An administrator must confirm or reject some before more can be created.',
      private.caller_unconfirmed_originated_count();
  END IF;

  -- Rule 3: the supplied value stands.
  RETURN NEW;
END;
$$;

--------------------------------------------------------------------------------
-- enforce_nomination_entity_columns: the column bound for callers who are not project nomination editors
--
-- A column grant against `authenticated` cannot tell an entity user from a project admin, so the nominations grant in 303-column-grants.sql admits what an admin needs (including bulk_import through an authenticated admin session), and the entity-user bound lives here, where the caller can be told apart. `enforce_nomination_confirmation` and `enforce_entity_immutability` use the same arrangement.
--
-- Binds exactly one population: an `authenticated` caller who does not hold `project.edit_nominations` on the row's project. For that caller:
--   INSERT - the nine presentation and bookkeeping columns (name, short_name, info, color, image, sort_order, subtype, election_symbol, external_id) must be left unset.
--   UPDATE - those nine and the four entity foreign keys must be unchanged.
-- The owner and service-role paths are untouched (current_user is not `authenticated` there), and an admin passes through.
--
-- Raises insufficient_privilege (42501), the code a column-grant refusal raises, so the caller sees the same error class either way.
--
-- SECURITY INVOKER: a SECURITY DEFINER body reports the owner as current_user, and the role test would never match.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_nomination_entity_columns () RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  IF current_user <> 'authenticated'
     OR public.user_can('project', NEW.project_id, 'project.edit_nominations') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND num_nonnulls(
       NEW.name, NEW.short_name, NEW.info, NEW.color, NEW.image,
       NEW.sort_order, NEW.subtype, NEW.election_symbol, NEW.external_id
     ) > 0 THEN
    RAISE EXCEPTION 'Only a holder of project.edit_nominations may set a nomination''s name, short_name, info, color, image, sort_order, subtype, election_symbol or external_id'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF TG_OP = 'UPDATE' AND (
       NEW.name IS DISTINCT FROM OLD.name
       OR NEW.short_name IS DISTINCT FROM OLD.short_name
       OR NEW.info IS DISTINCT FROM OLD.info
       OR NEW.color IS DISTINCT FROM OLD.color
       OR NEW.image IS DISTINCT FROM OLD.image
       OR NEW.sort_order IS DISTINCT FROM OLD.sort_order
       OR NEW.subtype IS DISTINCT FROM OLD.subtype
       OR NEW.election_symbol IS DISTINCT FROM OLD.election_symbol
       OR NEW.external_id IS DISTINCT FROM OLD.external_id
       OR NEW.candidate_id IS DISTINCT FROM OLD.candidate_id
       OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
       OR NEW.faction_id IS DISTINCT FROM OLD.faction_id
       OR NEW.alliance_id IS DISTINCT FROM OLD.alliance_id
     ) THEN
    RAISE EXCEPTION 'Only a holder of project.edit_nominations may change a nomination''s presentation columns, external_id or entity'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

--------------------------------------------------------------------------------
-- enforce_entity_immutability: the confirmation gate and the conditional identity freeze
--
-- A confirmed entity's name is frozen for the entity user and stays correctable by a holder of `entity.edit_immutable`. That is a rule about the transition between two row states, which neither a column grant (one global pair per role, blind to the row) nor a policy (`USING` sees only OLD, `WITH CHECK` only NEW) can express. A BEFORE UPDATE row trigger sees both rows in one scope. It follows the shape of `enforce_external_id_immutability` in 500-external-id.sql: an OLD-row condition, an `IS DISTINCT FROM` comparison, a named exception carrying both values, and one body registered on several tables.
--
-- Two rules, in a fixed order:
--
--   1. The confirmation gate. A change to the confirmation flag, in either direction, by an `authenticated` caller who does not hold `entity.confirm` on the row is refused by name. Turning the flag off is refused too, because an entity user who could unconfirm could then rename.
--   2. The conditional freeze, read from the OLD row's flag. When the row was already confirmed before the statement, a change to any column named in TG_ARGV by an `authenticated` caller who does not hold `entity.edit_immutable` on the row is refused by name. Reading the OLD flag means a caller cannot unconfirm and rename in one statement, and because rule 1 runs first, such a statement is refused with the confirmation message.
--
-- The freeze is not absolute: on an unconfirmed row the entity user may still set their own name, which the sign-up flow needs. 19-entity-immutability.test.sql asserts that outcome per protected column per table and pins the OLD-row guard on the function source.
--
-- Both rules bind only the effective `authenticated` role, as rule 2 of `enforce_nomination_confirmation` does. `user_can` reads the grant set from the JWT and a service-role token carries none, so an unscoped rule would refuse every re-seed, bulk import and pgTAP fixture write that changes a name or a confirmation flag. The cost is that the service role can rename a confirmed entity, the same latitude it has against row-level security and the column grants.
--
-- SECURITY INVOKER is required: a SECURITY DEFINER body reports the owner as `current_user`, so the role guard would never match and neither rule would bind.
--
-- The body names no entity type and no protected column. The protected columns arrive per registration in TG_ARGV and are compared through a JSONB projection of both rows, and the entity type is derived from TG_TABLE_NAME, so one body serves all four entity tables. The confirmation column is not a parameter: it has the same name on every entity table and is the subject of rule 1.
--
-- Each refusal starts with a stable prefix, so `throws_like` can match it and a seed log can tell the two apart. Both name the table, the row and both values; the immutability refusal also names the column.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_entity_immutability () RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_col text;
  v_old_row jsonb;
  v_new_row jsonb;
  v_entity_type public.entity_type;
BEGIN
  -- The role guard. Everything below binds the effective `authenticated` role and nothing else.
  IF current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  -- The row's entity type, which every entity-scope authority question names together with the id. It is the table's name without its plural s, the naming the four entity tables share; a table outside that naming fails the cast, so the update raises rather than being decided without a type.
  v_entity_type := left(TG_TABLE_NAME, -1)::public.entity_type;

  -- Rule 1: the confirmation gate, in both directions.
  IF NEW.confirmed IS DISTINCT FROM OLD.confirmed
     AND NOT public.user_can('entity', NEW.id, 'entity.confirm', v_entity_type) THEN
    RAISE EXCEPTION 'Entity confirmation requires the entity.confirm permission: %.% row % cannot change its confirmation flag (current: %, attempted: %)',
      TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.id, OLD.confirmed, NEW.confirmed;
  END IF;

  -- Rule 2: the conditional freeze, guarded on the OLD row's flag.
  IF OLD.confirmed THEN
    v_old_row := to_jsonb(OLD);
    v_new_row := to_jsonb(NEW);
    FOR i IN 0 .. TG_NARGS - 1 LOOP
      v_col := TG_ARGV[i];
      IF (v_old_row ->> v_col) IS DISTINCT FROM (v_new_row ->> v_col)
         AND NOT public.user_can('entity', NEW.id, 'entity.edit_immutable', v_entity_type) THEN
        RAISE EXCEPTION 'Entity name is immutable once confirmed: column %.%.% on row % cannot be changed (current: %, attempted: %); changing it requires the entity.edit_immutable permission',
          TG_TABLE_SCHEMA, TG_TABLE_NAME, v_col, NEW.id,
          COALESCE(v_old_row ->> v_col, '(none)'), COALESCE(v_new_row ->> v_col, '(none)');
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;
-- Multi-tenant foundation: accounts and projects
--
-- All content tables reference projects via project_id FK with ON DELETE CASCADE.
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Plain text, not a localized string.
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.accounts FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts (id) ON DELETE CASCADE,
  -- Plain text, not a localized string.
  name text NOT NULL,
  -- The locale code a localized string falls back to when it has no entry for the requested locale.
  default_locale text NOT NULL DEFAULT 'en',
  -- Whether voters can read the project: an anonymous reader sees a row only when this is true, its nomination is confirmed and every entity that nomination links is confirmed. Defaults to false so a new project is not public; seed.sql and SupabaseAdminClient.ensureProject set it to true.
  open_for_voters boolean NOT NULL DEFAULT false,
  -- When true, entity users cannot insert or update their own nominations; the admin nomination policies ignore it.
  lock_nominations boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.projects FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();
-- Elections, constituency groups, constituencies, and their join tables
CREATE TABLE public.elections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- Localized string `{ "<locale>": string }`.
  name jsonb,
  -- Localized string `{ "<locale>": string }`: the abbreviated name.
  short_name jsonb,
  -- Localized string `{ "<locale>": string }`: a longer description.
  info jsonb,
  -- `Colors` from @openvaa/data: `{ normal, dark? }`, colour strings for the default and dark themes.
  color jsonb,
  -- `StoredImage` from @openvaa/app-shared: storage paths in the public-assets bucket, not URLs.
  image jsonb,
  -- Ascending display order, nulls last.
  sort_order integer,
  -- A free-text label that tells apart objects of the same kind.
  subtype text,
  -- A free-form JSON object, read by the frontend as `customData`.
  custom_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- The last day of voting, after which the election counts as past.
  election_date date,
  -- The first day of voting.
  election_start_date date,
  -- Which of the three nomination flows the election runs: whether a candidate picks a party, whether a party nominates a list, and whether the free-text branch is reachable. A separate axis from `subtype`.
  election_type public.nomination_shape NOT NULL DEFAULT 'organization_list',
  -- Whether the election can have more than one round.
  multiple_rounds boolean DEFAULT false,
  -- The round in progress, counted from 1.
  current_round integer DEFAULT 1,
  -- The import key bulk_import matches rows by; unique per project and unchangeable once set (500-external-id.sql).
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.elections FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

CREATE TABLE public.constituency_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- Localized string `{ "<locale>": string }`.
  name jsonb,
  -- Localized string `{ "<locale>": string }`: the abbreviated name.
  short_name jsonb,
  -- Localized string `{ "<locale>": string }`: a longer description.
  info jsonb,
  -- `Colors` from @openvaa/data: `{ normal, dark? }`, colour strings for the default and dark themes.
  color jsonb,
  -- `StoredImage` from @openvaa/app-shared: storage paths in the public-assets bucket, not URLs.
  image jsonb,
  -- Ascending display order, nulls last.
  sort_order integer,
  -- A free-text label that tells apart objects of the same kind.
  subtype text,
  -- A free-form JSON object, read by the frontend as `customData`.
  custom_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- The import key bulk_import matches rows by; unique per project and unchangeable once set (500-external-id.sql).
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.constituency_groups FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

CREATE TABLE public.constituencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- Localized string `{ "<locale>": string }`.
  name jsonb,
  -- Localized string `{ "<locale>": string }`: the abbreviated name.
  short_name jsonb,
  -- Localized string `{ "<locale>": string }`: a longer description.
  info jsonb,
  -- `Colors` from @openvaa/data: `{ normal, dark? }`, colour strings for the default and dark themes.
  color jsonb,
  -- `StoredImage` from @openvaa/app-shared: storage paths in the public-assets bucket, not URLs.
  image jsonb,
  -- Ascending display order, nulls last.
  sort_order integer,
  -- A free-text label that tells apart objects of the same kind.
  subtype text,
  -- A free-form JSON object, read by the frontend as `customData`.
  custom_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Localized string `{ "<locale>": string }` of comma-separated keywords, such as the municipalities in a regional constituency; the Supabase data provider splits it into a list.
  keywords jsonb,
  -- The constituency this one is nested in, when elections run on different regional levels; set to null when the parent is deleted.
  parent_id uuid REFERENCES public.constituencies (id) ON DELETE SET NULL,
  -- The import key bulk_import matches rows by; unique per project and unchangeable once set (500-external-id.sql).
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.constituencies FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

CREATE TABLE public.constituency_group_constituencies (
  constituency_group_id uuid NOT NULL REFERENCES public.constituency_groups (id) ON DELETE CASCADE,
  constituency_id uuid NOT NULL REFERENCES public.constituencies (id) ON DELETE CASCADE,
  PRIMARY KEY (constituency_group_id, constituency_id)
);

CREATE TABLE public.election_constituency_groups (
  election_id uuid NOT NULL REFERENCES public.elections (id) ON DELETE CASCADE,
  constituency_group_id uuid NOT NULL REFERENCES public.constituency_groups (id) ON DELETE CASCADE,
  PRIMARY KEY (election_id, constituency_group_id)
);
-- Entity tables: organizations, candidates, factions, alliances
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- The Supabase Auth user who signs in as this organization; edit rights come from `public.grants`, not from this link.
  auth_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  -- Localized string `{ "<locale>": string }`.
  name jsonb,
  -- Localized string `{ "<locale>": string }`: the abbreviated name.
  short_name jsonb,
  -- Localized string `{ "<locale>": string }`: a longer description.
  info jsonb,
  -- `Colors` from @openvaa/data: `{ normal, dark? }`, colour strings for the default and dark themes.
  color jsonb,
  -- `StoredImage` from @openvaa/app-shared: storage paths in the public-assets bucket, not URLs.
  image jsonb,
  -- Ascending display order, nulls last.
  sort_order integer,
  -- A free-text label that tells apart objects of the same kind, such as a constituency association among parties.
  subtype text,
  -- A free-form JSON object, read by the frontend as `customData`.
  custom_data jsonb,
  -- Whether the identity has been vouched for: an entity is public only when this is true and it has a confirmed nomination. Only a holder of `entity.confirm` on the row may change it, in either direction; the enforce_entity_immutability trigger enforces this, because the column is inside the authenticated UPDATE grant in 303-column-grants.sql.
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- `StoredAnswers` from @openvaa/app-shared: `{ "<question id>": { value, info? } }`, validated per changed key by validate_answers_jsonb (105-answers.sql).
  answers jsonb DEFAULT '{}'::jsonb,
  -- The import key bulk_import matches rows by; unique per project and unchangeable once set (500-external-id.sql).
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

-- Gates the confirmation flag and freezes the name of a confirmed entity; the function is declared in 011-validation-functions.sql. The `UPDATE OF` list makes the trigger fire only when a statement sets one of these columns, and the argument names the protected name column.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF name,
confirmed ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('name');

CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- The Supabase Auth user who signs in as this candidate; the candidate app loads its own row by it, and edit rights come from `public.grants`.
  auth_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  -- Localized string `{ "<locale>": string }`: the abbreviated name.
  short_name jsonb,
  -- Localized string `{ "<locale>": string }`: a longer description.
  info jsonb,
  -- `Colors` from @openvaa/data: `{ normal, dark? }`, colour strings for the default and dark themes.
  color jsonb,
  -- `StoredImage` from @openvaa/app-shared: storage paths in the public-assets bucket, not URLs.
  image jsonb,
  -- Ascending display order, nulls last.
  sort_order integer,
  -- A free-text label that tells apart objects of the same kind.
  subtype text,
  -- A free-form JSON object, read by the frontend as `customData`.
  custom_data jsonb,
  -- Whether the identity has been vouched for: an entity is public only when this is true and it has a confirmed nomination. The identity-callback Edge Function (`candidateRecord.ts`) sets it after a strong identity check. Only a holder of `entity.confirm` on the row may change it, in either direction; the enforce_entity_immutability trigger enforces this, because the column is inside the authenticated UPDATE grant in 303-column-grants.sql.
  confirmed boolean NOT NULL DEFAULT false,
  -- When the candidate accepted the terms of use; null until then. An anonymous reader sees the candidate only once this is set and not in the future.
  terms_of_use_accepted timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- `StoredAnswers` from @openvaa/app-shared: `{ "<question id>": { value, info? } }`, validated per changed key by validate_answers_jsonb (105-answers.sql).
  answers jsonb DEFAULT '{}'::jsonb,
  -- The import key bulk_import matches rows by; unique per project and unchangeable once set (500-external-id.sql).
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

-- Gates the confirmation flag and freezes the names of a confirmed candidate; the function is declared in 011-validation-functions.sql. The `UPDATE OF` list makes the trigger fire only when a statement sets one of these columns, so `upsert_answers`, which sets only the answers column, never enters it. The arguments name the two protected name columns.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF first_name,
last_name,
confirmed ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('first_name', 'last_name');

CREATE TABLE public.factions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- The organization the faction belongs to. Deleting the organization deletes its factions and, through the nominations foreign keys, their nominations; validate_nomination requires a faction nomination's parent to be this organization's nomination.
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  -- Localized string `{ "<locale>": string }`.
  name jsonb,
  -- Localized string `{ "<locale>": string }`: the abbreviated name.
  short_name jsonb,
  -- Localized string `{ "<locale>": string }`: a longer description.
  info jsonb,
  -- `Colors` from @openvaa/data: `{ normal, dark? }`, colour strings for the default and dark themes.
  color jsonb,
  -- `StoredImage` from @openvaa/app-shared: storage paths in the public-assets bucket, not URLs.
  image jsonb,
  -- Ascending display order, nulls last.
  sort_order integer,
  -- A free-text label that tells apart objects of the same kind.
  subtype text,
  -- A free-form JSON object, read by the frontend as `customData`.
  custom_data jsonb,
  -- Whether the identity has been vouched for: an entity is public only when this is true and it has a confirmed nomination. Only a holder of `entity.confirm` on the row may change it, in either direction; the enforce_entity_immutability trigger enforces this, because the column is inside the authenticated UPDATE grant in 303-column-grants.sql.
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- The import key bulk_import matches rows by; unique per project and unchangeable once set (500-external-id.sql).
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

-- Gates the confirmation flag and freezes the name of a confirmed entity; the function is declared in 011-validation-functions.sql. The `UPDATE OF` list makes the trigger fire only when a statement sets one of these columns, and the argument names the protected name column.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF name,
confirmed ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('name');

CREATE TABLE public.alliances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- Localized string `{ "<locale>": string }`.
  name jsonb,
  -- Localized string `{ "<locale>": string }`: the abbreviated name.
  short_name jsonb,
  -- Localized string `{ "<locale>": string }`: a longer description.
  info jsonb,
  -- `Colors` from @openvaa/data: `{ normal, dark? }`, colour strings for the default and dark themes.
  color jsonb,
  -- `StoredImage` from @openvaa/app-shared: storage paths in the public-assets bucket, not URLs.
  image jsonb,
  -- Ascending display order, nulls last.
  sort_order integer,
  -- A free-text label that tells apart objects of the same kind.
  subtype text,
  -- A free-form JSON object, read by the frontend as `customData`.
  custom_data jsonb,
  -- Whether the identity has been vouched for: an entity is public only when this is true and it has a confirmed nomination. Only a holder of `entity.confirm` on the row may change it, in either direction; the enforce_entity_immutability trigger enforces this, because the column is inside the authenticated UPDATE grant in 303-column-grants.sql.
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- The import key bulk_import matches rows by; unique per project and unchangeable once set (500-external-id.sql).
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

-- Gates the confirmation flag and freezes the name of a confirmed entity; the function is declared in 011-validation-functions.sql. The `UPDATE OF` list makes the trigger fire only when a statement sets one of these columns, and the argument names the protected name column.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF name,
confirmed ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('name');
-- Question categories and questions
--
-- Includes validation trigger: choice-type questions must have valid choices array.
CREATE TABLE public.question_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- Localized string `{ "<locale>": string }`.
  name jsonb,
  -- Localized string `{ "<locale>": string }`: the abbreviated name.
  short_name jsonb,
  -- Localized string `{ "<locale>": string }`: a longer description.
  info jsonb,
  -- `Colors` from @openvaa/data: `{ normal, dark? }`, colour strings for the default and dark themes.
  color jsonb,
  -- `StoredImage` from @openvaa/app-shared: storage paths in the public-assets bucket, not URLs.
  image jsonb,
  -- Ascending display order, nulls last.
  sort_order integer,
  -- A free-text label that tells apart objects of the same kind.
  subtype text,
  -- A free-form JSON object, read by the frontend as `customData`.
  custom_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- `opinion` for questions used in matching, `info` for background questions, `default` when unspecified.
  category_type public.category_type DEFAULT 'opinion',
  -- JSON array of the election ids (strings) the category applies to; null or empty means all.
  election_ids jsonb,
  -- JSON array of the election round numbers the category applies to; null or empty means all.
  election_rounds jsonb,
  -- JSON array of the constituency ids (strings) the category applies to; null or empty means all.
  constituency_ids jsonb,
  -- JSON array of the `entity_type` values whose entities answer the category's questions; null or empty means all.
  entity_type jsonb,
  -- The import key bulk_import matches rows by; unique per project and unchangeable once set (500-external-id.sql).
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.question_categories FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- Localized string `{ "<locale>": string }`.
  name jsonb,
  -- Localized string `{ "<locale>": string }`: the abbreviated name.
  short_name jsonb,
  -- Localized string `{ "<locale>": string }`: a longer description.
  info jsonb,
  -- `Colors` from @openvaa/data: `{ normal, dark? }`, colour strings for the default and dark themes.
  color jsonb,
  -- `StoredImage` from @openvaa/app-shared: storage paths in the public-assets bucket, not URLs.
  image jsonb,
  -- Ascending display order, nulls last.
  sort_order integer,
  -- A free-text label that tells apart objects of the same kind.
  subtype text,
  -- A free-form JSON object, read by the frontend as `customData`; number questions keep `min` and `max` here, and `allowOpen` here overrides the allow_open column.
  custom_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- The answer type, which decides the shape of an answer value and whether `choices` is required.
  type public.question_type NOT NULL,
  category_id uuid NOT NULL REFERENCES public.question_categories (id),
  -- JSON array of `LocalizedChoice` objects from @openvaa/app-shared, `{ id, label, normalizableValue? }` with a localized label; at least two for the choice types (validate_question_choices).
  choices jsonb,
  -- A free-form JSON object of settings for the question type; no stored schema validates it.
  settings jsonb,
  -- JSON array of the election ids (strings) the question applies to, within its category's list; null or empty means all.
  election_ids jsonb,
  -- JSON array of the election round numbers the question applies to, within its category's list; null or empty means all.
  election_rounds jsonb,
  -- JSON array of the constituency ids (strings) the question applies to, within its category's list; null or empty means all.
  constituency_ids jsonb,
  -- JSON array of the `entity_type` values whose entities answer the question, within its category's list; null or empty means all.
  entity_type jsonb,
  -- Whether an answer may carry an open-text explanation in `info`.
  allow_open boolean DEFAULT true,
  -- Whether an answer is required; the database does not enforce it.
  required boolean DEFAULT true,
  -- The import key bulk_import matches rows by; unique per project and unchangeable once set (500-external-id.sql).
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.questions FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

--------------------------------------------------------------------------------
-- validate_question_choices: enforce valid choices for choice-type questions
--
-- For singleChoiceOrdinal, singleChoiceCategorical, multipleChoiceCategorical:
--   - choices must be a non-null JSON array
--   - choices must contain at least 2 elements
--   - each choice must be an object with an "id" key
--
-- Uses is_valid_choice_id helper from 011-validation-functions.sql.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_question_choices () RETURNS TRIGGER AS $$
DECLARE
  p_choice JSONB;
  p_choice_count INTEGER;
BEGIN
  -- Only validate choice-type questions
  IF NEW.type NOT IN ('singleChoiceOrdinal', 'singleChoiceCategorical', 'multipleChoiceCategorical') THEN
    RETURN NEW;
  END IF;

  -- Choices must be present and non-null
  IF NEW.choices IS NULL OR NEW.choices = 'null'::jsonb THEN
    RAISE EXCEPTION 'Choice-type question must have a choices array (type: %)', NEW.type;
  END IF;

  -- Choices must be an array
  IF jsonb_typeof(NEW.choices) != 'array' THEN
    RAISE EXCEPTION 'Question choices must be a JSON array, got %', jsonb_typeof(NEW.choices);
  END IF;

  -- Must have at least 2 choices
  p_choice_count := jsonb_array_length(NEW.choices);
  IF p_choice_count < 2 THEN
    RAISE EXCEPTION 'Choice-type question must have at least 2 choices, got %', p_choice_count;
  END IF;

  -- Each choice must be an object with an "id" key
  FOR p_choice IN SELECT * FROM jsonb_array_elements(NEW.choices)
  LOOP
    IF jsonb_typeof(p_choice) != 'object' THEN
      RAISE EXCEPTION 'Each choice must be a JSON object';
    END IF;
    IF NOT (p_choice ? 'id') THEN
      RAISE EXCEPTION 'Each choice must have an "id" property';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_question_choices_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.questions FOR EACH ROW
EXECUTE FUNCTION public.validate_question_choices ();
-- Nominations
--
-- Uses separate FK columns for each entity type instead of polymorphic entity_id.
-- entity_type is a generated column derived from which FK is set.
--
-- Hierarchy (enforced by validate_nomination trigger):
--   alliance    -> no parent
--   organization -> parent: alliance (or standalone)
--   faction     -> parent: organization (required)
--   candidate   -> parent: organization or faction (or standalone)
--
-- Parent-child nominations must share election_id, constituency_id, and election_round (also enforced by trigger).
CREATE TABLE public.nominations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- Localized string `{ "<locale>": string }`.
  name jsonb,
  -- Localized string `{ "<locale>": string }`: the abbreviated name.
  short_name jsonb,
  -- Localized string `{ "<locale>": string }`: a longer description.
  info jsonb,
  -- `Colors` from @openvaa/data: `{ normal, dark? }`, colour strings for the default and dark themes.
  color jsonb,
  -- `StoredImage` from @openvaa/app-shared: storage paths in the public-assets bucket, not URLs.
  image jsonb,
  -- Ascending display order, nulls last.
  sort_order integer,
  -- A free-text label that tells apart objects of the same kind.
  subtype text,
  -- A free-form JSON object, read by the frontend as `customData`; `requestedParentOrganization` marks a candidate waiting for a party that is not in the system, and blocks confirmation.
  custom_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- The user who created the row, which the cap on unconfirmed parent nominations counts. It defaults to the caller and is outside the authenticated column grants, so an authenticated caller can neither set nor rewrite it. Null on service-role and owner inserts, which have no calling user, and set to null when the user is deleted so the row survives.
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL DEFAULT auth.uid (),
  -- Entity FK columns: exactly one must be set
  candidate_id uuid REFERENCES public.candidates (id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations (id) ON DELETE CASCADE,
  faction_id uuid REFERENCES public.factions (id) ON DELETE CASCADE,
  alliance_id uuid REFERENCES public.alliances (id) ON DELETE CASCADE,
  -- Which entity kind the row nominates, generated from the one entity foreign key that is set.
  entity_type public.entity_type NOT NULL GENERATED ALWAYS AS (
    CASE
      WHEN candidate_id IS NOT NULL THEN 'candidate'::public.entity_type
      WHEN organization_id IS NOT NULL THEN 'organization'::public.entity_type
      WHEN faction_id IS NOT NULL THEN 'faction'::public.entity_type
      WHEN alliance_id IS NOT NULL THEN 'alliance'::public.entity_type
    END
  ) STORED,
  -- Election context
  election_id uuid NOT NULL REFERENCES public.elections (id) ON DELETE CASCADE,
  constituency_id uuid NOT NULL REFERENCES public.constituencies (id) ON DELETE CASCADE,
  -- The round the nomination is for, counted from 1.
  election_round integer DEFAULT 1,
  -- The symbol, usually a number, marked on the ballot instead of the nominee's name.
  election_symbol text,
  -- The nomination this one sits under, per the hierarchy above. NO ACTION, not CASCADE, so deleting a parent never silently deletes the nominations under it: the delete is refused while children remain. NO ACTION rather than RESTRICT because the check runs at the end of the statement, which lets bulk_delete remove a parent and its children in one statement.
  parent_nomination_id uuid REFERENCES public.nominations (id) ON DELETE NO ACTION,
  -- Whether an admin has confirmed the nomination; it is public only when this is true. The default is load-bearing: the column is absent from the INSERT column grant in 303-column-grants.sql, so every row an authenticated caller inserts starts unconfirmed.
  confirmed boolean NOT NULL DEFAULT false,
  -- The import key bulk_import matches rows by; unique per project and unchangeable once set (500-external-id.sql).
  external_id text,
  -- Exactly one entity FK must be set
  CHECK (
    num_nonnulls (
      candidate_id,
      organization_id,
      faction_id,
      alliance_id
    ) = 1
  ),
  -- An entity is nominated at most once per election, constituency and round under the same parent. A different parent makes a distinct nomination, such as one presidential candidate nominated by three parties.
  --
  -- `NULLS NOT DISTINCT` is what makes the constraint catch anything: every row has three null entity foreign keys and every top-level nomination a null parent, so a plain UNIQUE would never find two rows equal. It needs PostgreSQL 15, which `supabase/config.toml` declares, and the applied database is checked through `pg_index.indnullsnotdistinct`.
  --
  -- Named so a pgTAP `throws_ok` can match it.
  CONSTRAINT nominations_entity_parent_contest_key UNIQUE NULLS NOT DISTINCT (
    candidate_id,
    faction_id,
    organization_id,
    alliance_id,
    parent_nomination_id,
    election_id,
    constituency_id,
    election_round
  ),
  -- Election rounds are numbered from one. Named so a pgTAP `throws_ok` can match it; the name is the one PostgreSQL would generate.
  CONSTRAINT nominations_election_round_check CHECK (election_round >= 1)
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

CREATE TRIGGER validate_nomination_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.validate_nomination ();

-- Holds the presentation and bookkeeping columns and the entity foreign keys unset or unchanged for a caller without `project.edit_nominations`. 303-column-grants.sql cannot tell that caller from an admin; this trigger can.
CREATE TRIGGER enforce_nomination_columns_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.enforce_nomination_entity_columns ();

-- Editing a nomination turns its confirmation off. The system rewrites the row, so this is a trigger rather than a policy, which can refuse a row but not rewrite it.
CREATE TRIGGER enforce_nomination_confirmation_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.enforce_nomination_confirmation ();
-- JSONB answer validation, cascade and type-change protection
--
-- Answers are stored as a JSONB column shaped Record<QuestionId, {value: ..., info?: ...}> on public.candidates and public.organizations.
-- Both columns are declared in those tables' CREATE TABLE bodies in 102-entities.sql; this file owns the behaviour that keeps their contents valid.
--
-- Features:
--   1. Smart validation trigger: validates only changed answer keys on UPDATE
--   2. Question delete cascade: removes orphaned answer keys when a question is deleted
--   3. Question type change protection: prevents type changes that would invalidate existing answers
--
-- Depends on: 102-entities.sql, 103-questions.sql
--------------------------------------------------------------------------------
-- JSONB answer validation trigger function (smart: validates only changed keys)
--
-- - On INSERT: validates every key.
-- - On UPDATE: validates only new or modified keys.
-- - Returns early when the answers column is unchanged or empty.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_answers_jsonb () RETURNS trigger AS $$
DECLARE
  p_question_id text;
  p_answer_value jsonb;
  p_question_record record;
  p_old_answers jsonb;
BEGIN
  -- Short-circuit: no change to answers column
  IF TG_OP = 'UPDATE' AND NEW.answers IS NOT DISTINCT FROM OLD.answers THEN
    RETURN NEW;
  END IF;

  -- Short-circuit: empty/null answers
  IF NEW.answers IS NULL OR NEW.answers = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  -- Get old answers for diffing (NULL on INSERT)
  p_old_answers := CASE WHEN TG_OP = 'UPDATE' THEN OLD.answers ELSE NULL END;

  FOR p_question_id, p_answer_value IN SELECT * FROM jsonb_each(NEW.answers)
  LOOP
    -- Skip unchanged answer keys (only validate new or modified)
    IF p_old_answers IS NOT NULL
       AND p_old_answers ? p_question_id
       AND p_old_answers -> p_question_id IS NOT DISTINCT FROM p_answer_value THEN
      CONTINUE;
    END IF;

    SELECT q.type, q.choices
    INTO p_question_record
    FROM public.questions q
    WHERE q.id = p_question_id::uuid
      AND q.project_id = NEW.project_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Question % not found in project', p_question_id;
    END IF;

    PERFORM public.validate_answer_value(
      p_answer_value,
      p_question_record.type,
      p_question_record.choices
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_answers_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.validate_answers_jsonb ();

CREATE TRIGGER validate_answers_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.validate_answers_jsonb ();

--------------------------------------------------------------------------------
-- Question delete cascade: remove orphaned answer keys from JSONB
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cascade_question_delete_to_jsonb_answers () RETURNS trigger AS $$
BEGIN
  UPDATE public.candidates
  SET answers = answers - OLD.id::text
  WHERE project_id = OLD.project_id
    AND answers ? OLD.id::text;

  UPDATE public.organizations
  SET answers = answers - OLD.id::text
  WHERE project_id = OLD.project_id
    AND answers ? OLD.id::text;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_question_delete_to_answers
AFTER DELETE ON public.questions FOR EACH ROW
EXECUTE FUNCTION public.cascade_question_delete_to_jsonb_answers ();

--------------------------------------------------------------------------------
-- Question type/choices change protection
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_question_type_change () RETURNS trigger AS $$
DECLARE
  p_entity_record record;
  p_valid_choices jsonb;
BEGIN
  -- Only act on type or choices changes
  IF OLD.type IS NOT DISTINCT FROM NEW.type
     AND OLD.choices IS NOT DISTINCT FROM NEW.choices THEN
    RETURN NEW;
  END IF;

  -- Get effective choices for validation
  p_valid_choices := NEW.choices;

  -- Validate all existing candidate answers against the new type
  FOR p_entity_record IN
    SELECT c.id, c.answers -> OLD.id::text AS answer_value
    FROM public.candidates c
    WHERE c.project_id = NEW.project_id
      AND c.answers ? OLD.id::text
  LOOP
    BEGIN
      PERFORM public.validate_answer_value(p_entity_record.answer_value, NEW.type, p_valid_choices);
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Cannot change question % type/choices: existing answer for candidate % would be invalid: %',
        NEW.id, p_entity_record.id, SQLERRM;
    END;
  END LOOP;

  -- Validate all existing organization answers against the new type
  FOR p_entity_record IN
    SELECT o.id, o.answers -> OLD.id::text AS answer_value
    FROM public.organizations o
    WHERE o.project_id = NEW.project_id
      AND o.answers ? OLD.id::text
  LOOP
    BEGIN
      PERFORM public.validate_answer_value(p_entity_record.answer_value, NEW.type, p_valid_choices);
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Cannot change question % type/choices: existing answer for organization % would be invalid: %',
        NEW.id, p_entity_record.id, SQLERRM;
    END;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_question_type_change_trigger
BEFORE UPDATE ON public.questions FOR EACH ROW
EXECUTE FUNCTION public.validate_question_type_change ();
-- App settings: per-project application settings stored as JSONB
--
-- One row per project, enforced by UNIQUE constraint on project_id.
-- The app layer is responsible for parsing/validating the settings structure.
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects (id) ON DELETE CASCADE,
  -- `StoredSettings` from @openvaa/app-shared, the stored form of `DynamicSettings`; the Supabase data provider merges it over the shipped defaults.
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- `StoredCustomization` from @openvaa/app-shared: localized publisher copy, image paths, translation overrides and the candidate-app FAQ.
  customization jsonb DEFAULT '{}'::jsonb,
  -- The import key bulk_import matches rows by; unique per project and unchangeable once set (500-external-id.sql).
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.app_settings FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();
-- Feedback table: anonymous voter feedback submissions
--
-- At least one of rating or description must be present (CHECK constraint).
-- No UPDATE policy -- feedback is immutable after insert.
-- RLS policies are in 302-rls.sql.
-- Rate limiting trigger prevents spam (5 requests per 5 minutes per IP).
--
-- `project_id` is nullable and its foreign key is ON DELETE SET NULL, so feedback outlives the project it is about. The two go together: SET NULL into a NOT NULL column would make the project delete fail.
--
-- The `enforce_feedback_project` trigger requires `project_id` at insert time. The API roles have no feedback UPDATE policy, so for them a NULL project arises only through ON DELETE SET NULL; the service role and the owner can still write one by UPDATE.
--
-- A null project_id makes the project-scoped predicates of `admin_select_feedback` and `admin_delete_feedback` (302-rls.sql) null, so each carries a second disjunct that admits a global-scope grant holder when `project_id IS NULL`. Only such a holder can read or delete an orphaned row.
--------------------------------------------------------------------------------
-- Private schema for rate limiting (not exposed via PostgREST)
--------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.feedback_rate_limits (
  -- The first address in the request's x-forwarded-for header, or `unknown`.
  ip_address text PRIMARY KEY,
  -- Requests from the address in the current window.
  count integer NOT NULL DEFAULT 1,
  -- When the current window began; check_feedback_rate_limit starts a new one after five minutes.
  window_start timestamptz NOT NULL DEFAULT now()
);

--------------------------------------------------------------------------------
-- Feedback table
--------------------------------------------------------------------------------
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  -- 1 to 5 in the feedback components; the database does not check the range.
  rating integer,
  description text,
  -- When the voter sent the feedback, as the client reports it; `created_at` is when the row was stored.
  date timestamptz NOT NULL DEFAULT now(),
  -- The page the feedback was sent from.
  url text,
  -- The client's user-agent string.
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feedback_rating_or_description CHECK (
    rating IS NOT NULL
    OR description IS NOT NULL
  )
);

--------------------------------------------------------------------------------
-- Rate limiting: 5 requests per 5-minute window per client IP
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_feedback_rate_limit () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  p_client_ip     text;
  p_current_count integer;
  p_window_secs   interval := interval '5 minutes';
  p_max_requests  integer  := 5;
BEGIN
  -- Extract first IP from x-forwarded-for header (handles proxy chains)
  p_client_ip := SPLIT_PART(
    COALESCE(
      (current_setting('request.headers', true)::json ->> 'x-forwarded-for'),
      'unknown'
    ) || ',',
    ',', 1
  );
  p_client_ip := TRIM(p_client_ip);

  -- Advisory lock to serialize concurrent inserts from the same IP
  PERFORM pg_advisory_xact_lock(hashtext('feedback_rate:' || p_client_ip));

  -- Upsert rate limit counter (reset window if expired)
  INSERT INTO private.feedback_rate_limits (ip_address, count, window_start)
  VALUES (p_client_ip, 1, now())
  ON CONFLICT (ip_address) DO UPDATE
    SET count = CASE
          WHEN private.feedback_rate_limits.window_start + p_window_secs <= now()
          THEN 1
          ELSE private.feedback_rate_limits.count + 1
        END,
        window_start = CASE
          WHEN private.feedback_rate_limits.window_start + p_window_secs <= now()
          THEN now()
          ELSE private.feedback_rate_limits.window_start
        END;

  SELECT count INTO p_current_count
  FROM private.feedback_rate_limits
  WHERE ip_address = p_client_ip;

  IF p_current_count > p_max_requests THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_feedback_rate_limit
BEFORE INSERT ON public.feedback FOR EACH ROW
EXECUTE FUNCTION public.check_feedback_rate_limit ();

--------------------------------------------------------------------------------
-- A feedback row must name its project when inserted
--
-- The INSERT policies are `WITH CHECK (true)`, so this trigger is what refuses a NULL `project_id`, for every caller. It is INSERT-only because the foreign key's ON DELETE SET NULL is itself an UPDATE, which an UPDATE guard would refuse. A NULL project therefore still arises through ON DELETE SET NULL, and through an UPDATE by the service role or the owner; the API roles have no feedback UPDATE policy.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_feedback_project () RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  IF NEW.project_id IS NULL THEN
    RAISE EXCEPTION 'feedback.project_id must name a project'
      USING ERRCODE = 'not_null_violation',
            SCHEMA = 'public',
            TABLE = 'feedback',
            COLUMN = 'project_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_feedback_project
BEFORE INSERT ON public.feedback FOR EACH ROW
EXECUTE FUNCTION public.enforce_feedback_project ();
-- Admin jobs: job result persistence for admin features
--
-- Stores the results of admin feature runs (QuestionInfoGeneration, ArgumentCondensation).
-- Records are immutable -- no UPDATE policy. Admins can INSERT new results and SELECT/DELETE existing ones for their project.
CREATE TABLE public.admin_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- The id of the job in the frontend's admin job store; SupabaseAdminWriter.insertJobResult writes the whole row when the job ends.
  job_id text NOT NULL,
  -- The admin feature that ran, an `AdminFeature` value: `ArgumentCondensation` or `QuestionInfoGeneration`.
  job_type text NOT NULL,
  -- The election the run was scoped to; set to null when the election is deleted.
  election_id uuid REFERENCES public.elections (id) ON DELETE SET NULL,
  -- The email address of the admin who ran the job.
  author text NOT NULL,
  -- How the job ended; `aborted` means the admin stopped it.
  end_status text NOT NULL CHECK (end_status IN ('completed', 'failed', 'aborted')),
  start_time timestamptz,
  end_time timestamptz,
  -- The run's input parameters, recorded verbatim.
  input jsonb,
  -- The results the job accumulated, up to the point it ended.
  output jsonb,
  -- JSON array of the job's `JobMessage` entries, its info, warning and error messages.
  messages jsonb,
  -- The feature's own summary of the run, such as `{ questionsProcessed: n }`.
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.admin_jobs FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();
-- B-tree indexes on RLS-referenced and commonly filtered columns
--------------------------------------------------------------------------------
-- project_id indexes (every content table)
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_elections_project_id ON public.elections (project_id);

CREATE INDEX IF NOT EXISTS idx_constituency_groups_project_id ON public.constituency_groups (project_id);

CREATE INDEX IF NOT EXISTS idx_constituencies_project_id ON public.constituencies (project_id);

CREATE INDEX IF NOT EXISTS idx_organizations_project_id ON public.organizations (project_id);

CREATE INDEX IF NOT EXISTS idx_candidates_project_id ON public.candidates (project_id);

CREATE INDEX IF NOT EXISTS idx_factions_project_id ON public.factions (project_id);

CREATE INDEX IF NOT EXISTS idx_alliances_project_id ON public.alliances (project_id);

CREATE INDEX IF NOT EXISTS idx_question_categories_project_id ON public.question_categories (project_id);

CREATE INDEX IF NOT EXISTS idx_questions_project_id ON public.questions (project_id);

CREATE INDEX IF NOT EXISTS idx_nominations_project_id ON public.nominations (project_id);

CREATE INDEX IF NOT EXISTS idx_app_settings_project_id ON public.app_settings (project_id);

--------------------------------------------------------------------------------
-- FK reference column indexes
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_projects_account_id ON public.projects (account_id);

CREATE INDEX IF NOT EXISTS idx_factions_organization_id ON public.factions (organization_id);

CREATE INDEX IF NOT EXISTS idx_questions_category_id ON public.questions (category_id);

CREATE INDEX IF NOT EXISTS idx_constituencies_parent_id ON public.constituencies (parent_id);

-- Nomination FK indexes
CREATE INDEX IF NOT EXISTS idx_nominations_candidate_id ON public.nominations (candidate_id);

CREATE INDEX IF NOT EXISTS idx_nominations_organization_id ON public.nominations (organization_id);

CREATE INDEX IF NOT EXISTS idx_nominations_faction_id ON public.nominations (faction_id);

CREATE INDEX IF NOT EXISTS idx_nominations_alliance_id ON public.nominations (alliance_id);

CREATE INDEX IF NOT EXISTS idx_nominations_election_id ON public.nominations (election_id);

CREATE INDEX IF NOT EXISTS idx_nominations_constituency_id ON public.nominations (constituency_id);

CREATE INDEX IF NOT EXISTS idx_nominations_parent_nomination_id ON public.nominations (parent_nomination_id);

--------------------------------------------------------------------------------
-- auth_user_id indexes (columns defined in 102-entities.sql)
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_candidates_auth_user_id ON public.candidates (auth_user_id);

CREATE INDEX IF NOT EXISTS idx_organizations_auth_user_id ON public.organizations (auth_user_id);

-- feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_project_id ON public.feedback (project_id);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback (created_at);

-- admin_jobs indexes
CREATE INDEX IF NOT EXISTS idx_admin_jobs_project_id ON public.admin_jobs (project_id);

CREATE INDEX IF NOT EXISTS idx_admin_jobs_election_id ON public.admin_jobs (election_id);

CREATE INDEX IF NOT EXISTS idx_admin_jobs_job_type ON public.admin_jobs (job_type);
-- The grant model: `public.grants`, its constraints, its index, its RLS and the access-token hook's schema access.
--
-- Depends on:
-- - 100-tenancy.sql (accounts, projects)
-- - 000-enums.sql (grant_scope_type, grant_role_type, entity_type)
--------------------------------------------------------------------------------
-- grants table
--------------------------------------------------------------------------------
-- The grant map: one row per privilege held, keyed by user, scope, target and role.
CREATE TABLE public.grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  -- How wide the grant is: global, or one account, project or entity.
  scope grant_scope_type NOT NULL,
  -- The entity kind of an entity-scope grant, reusing the entity_type vocabulary; null on every other scope, as the CHECK below requires.
  target_type entity_type,
  -- No foreign key, because the target may be an account, a project or any of the four entity tables; cleanup_grants_on_delete removes a grant when its target is deleted.
  target_id uuid,
  -- `admin` or `editor` on the target; user_can maps the role and scope to permissions.
  role grant_role_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- NULLS NOT DISTINCT because target_type is null on every non-entity grant: a plain UNIQUE would admit two identical grants, and revoking one would leave the privilege standing. It needs PostgreSQL 15, as in 104-nominations.sql.
  CONSTRAINT grants_user_scope_target_role_key UNIQUE NULLS NOT DISTINCT (user_id, scope, target_type, target_id, role),
  -- The entity kind is present exactly when the scope is entity. Both sides are non-null booleans, so a NULL cannot pass the check. Named so a pgTAP `throws_ok` can match it.
  CONSTRAINT grants_entity_scope_target_type_check CHECK ((target_type IS NOT NULL) = (scope = 'entity')),
  -- A global grant has no target, and an account, project or entity grant must have one. Named for the same reason.
  CONSTRAINT grants_target_id_scope_check CHECK ((target_id IS NULL) = (scope = 'global'))
);

-- The reverse lookup, who holds a grant on this target, which editor administration needs and the UNIQUE cannot serve because it leads with user_id. No index on user_id alone: the UNIQUE leads with it, which covers the foreign key for lint-schema.mjs's unindexed-foreign-key advisor, and a second index would cost every write.
CREATE INDEX idx_grants_scope_target ON public.grants (scope, target_type, target_id);

--------------------------------------------------------------------------------
-- RLS on grants — critical to prevent circular RLS with the auth hook
--------------------------------------------------------------------------------
ALTER TABLE public.grants ENABLE ROW LEVEL SECURITY;

-- The only statement in the schema that gives the access-token hook its schema access. Without it every token is issued with no authority, an outage that looks like a permission problem; 24-legacy-removal.test.sql asserts it with has_schema_privilege.
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

-- SELECT only: the hook only reads the grant map to build the claim, and its one policy here is a SELECT policy.
GRANT
SELECT
  ON TABLE public.grants TO supabase_auth_admin;

CREATE POLICY "auth_admin_read_grants" ON public.grants FOR
SELECT
  TO supabase_auth_admin USING (true);

-- Service role (Edge Functions) can manage grants
CREATE POLICY "service_role_manage_grants" ON public.grants FOR ALL TO service_role USING (true)
WITH
  CHECK (true);

-- Prevent regular users from accessing grants directly: a new table in the public schema is exposed through PostgREST by default, and these rows say who may do what to whom across every account and project in the instance.
REVOKE ALL ON TABLE public.grants
FROM
  authenticated,
  anon,
  public;

--------------------------------------------------------------------------------
-- cleanup_grants_on_delete: a grant does not outlive its target
--
-- `target_id` has no foreign key: it points into one of six tables depending on `scope` and `target_type`. Without these triggers a deleted target's grants would stay: they would still be projected into the holder's tokens, would be invisible to administration by target, and would attach to a recreated row that reused the id through an import. These AFTER DELETE triggers delete the grants naming the deleted row, on the six tables a grant can target.
--
-- The trigger arguments carry the scope and, for the entity scope, the target type, so one function serves all six tables and names none of them.
--
-- SECURITY DEFINER because the deleting caller -- a project admin removing a candidate through row-level security -- holds no privilege on public.grants at all (it is REVOKEd from every API role). search_path is pinned as on every definer function here. A project delete cascades to its entities first, so their grants go with them; the project's own grants go with the project row.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_grants_on_delete () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
BEGIN
  IF TG_ARGV[0] = 'entity' THEN
    DELETE FROM public.grants g
    WHERE g.scope = 'entity'
      AND g.target_type = TG_ARGV[1]::public.entity_type
      AND g.target_id = OLD.id;
  ELSE
    DELETE FROM public.grants g
    WHERE g.scope = TG_ARGV[0]::public.grant_scope_type
      AND g.target_id = OLD.id;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER cleanup_grants_on_delete
AFTER DELETE ON public.accounts FOR EACH ROW
EXECUTE FUNCTION public.cleanup_grants_on_delete ('account');

CREATE TRIGGER cleanup_grants_on_delete
AFTER DELETE ON public.projects FOR EACH ROW
EXECUTE FUNCTION public.cleanup_grants_on_delete ('project');

CREATE TRIGGER cleanup_grants_on_delete
AFTER DELETE ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.cleanup_grants_on_delete ('entity', 'candidate');

CREATE TRIGGER cleanup_grants_on_delete
AFTER DELETE ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.cleanup_grants_on_delete ('entity', 'organization');

CREATE TRIGGER cleanup_grants_on_delete
AFTER DELETE ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.cleanup_grants_on_delete ('entity', 'faction');

CREATE TRIGGER cleanup_grants_on_delete
AFTER DELETE ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.cleanup_grants_on_delete ('entity', 'alliance');
-- Auth hooks: Custom Access Token Hook and RLS helper functions
--
-- Depends on: 300-auth-tables.sql (grants table)
--
-- Functions:
-- - custom_access_token_hook(jsonb) - projects public.grants into the JWT `grants` claim
-- - grant_role_permissions(grant_scope_type, grant_role_type, entity_type) - the role x permission matrix
-- - private.entity_project_id(entity_type, uuid) - resolves an entity to its project
-- - private.election_project_id(uuid) - resolves an election id to its project
-- - private.constituency_group_project_id(uuid) - resolves a constituency-group id to its project
-- - private.is_child_nominee(entity_type, uuid, entity_type, uuid) - whether an entity is nominated under a nomination of the parent
-- - project_open_for_voters(uuid) - the project-level term of public visibility
-- - private.entity_has_confirmed_nomination(entity_type, uuid, uuid) - the entity-level term of public visibility
-- - private.nomination_entities_confirmed(uuid) - whether the entity a nomination links is anon-readable
-- - user_can(grant_scope_type, uuid, grant_permission, entity_type) - may the caller do this verb to this object; the one predicate the RLS policies delegate their authority decision to
-- - user_has_account_grant(uuid) - whether the caller holds any role on an account or on one of its projects
-- - private.project_nominations_locked(uuid) - whether a project's nomination editing is locked
-- - private.nomination_exists_in_contest(entity_type, uuid, uuid, uuid, integer) - whether an entity is already nominated at a contest
-- - private.caller_nominated_in_contest(uuid, uuid, integer, grant_permission) - whether the caller holds a permission on an entity nominated at a contest
-- - private.caller_unconfirmed_originated_count() - how many unconfirmed parent nominations the caller has originated
--
-- The two public-visibility terms are each defined once here and called directly by the eight entity SELECT policies.
--------------------------------------------------------------------------------
-- The `private` schema: policy-only SECURITY DEFINER helpers
--
-- Every SECURITY DEFINER function in `public` is published by PostgREST as `/rest/v1/rpc/<name>`, and Supabase's default privileges make it executable by `anon` and `authenticated`. The hierarchy and visibility hops below answer questions row-level security would refuse the caller directly, such as which project an arbitrary entity id belongs to, so published as RPCs they would be cross-tenant oracles.
--
-- Revoking EXECUTE is not the fix, because a policy expression runs with the querying role's privileges and would fail with `permission denied`. The helpers therefore live in `private`, which is not in PostgREST's exposed schemas (config.toml `[api] schemas`), while the API roles keep USAGE and EXECUTE so policies can call them. Every call site qualifies the name, so no search_path decides which function runs.
--
-- What stays in `public`: `user_can` (the Edge Functions call it over RPC) and `user_has_account_grant`, which answer only about the caller's own claim; `grant_role_permissions` (the matrix, no row data); `project_open_for_voters` (the frontend calls it); and the two storage path helpers (caller-scoped or public by definition). 07-rpc-security.test.sql holds a census of every anon- and authenticated-executable SECURITY DEFINER function in `public`, so a new one has to be added there on purpose.
--------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

GRANT USAGE ON SCHEMA private TO anon,
authenticated,
service_role;

--------------------------------------------------------------------------------
-- Custom Access Token Hook: called by Supabase Auth on every token refresh/issue, it projects each public.grants row into the JWT's `grants` claim, the only authority claim it emits.
--
-- The per-entry keys are the column names of public.grants minus id, user_id and created_at. user_can reads exactly these four, and a key-name or key-set mismatch is not an error anywhere: it is an empty permission set, which denies every caller. 14-grants-migration.test.sql asserts the emitted array set-equal to test_grants_claim, in both directions and with equal cardinality.
--
-- COALESCE gives a user with no grant rows an empty array rather than NULL or a missing key. user_can treats both alike, but the empty array is the state a grant-less identity should carry.
--
-- The ORDER BY makes two tokens for one user identical, so they can be diffed. Correctness does not depend on it: jsonb_agg defines no element order, so the test compares the array as a set.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.custom_access_token_hook (p_event jsonb) RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  claims jsonb;
  grants_claim jsonb;
BEGIN
  claims := p_event->'claims';

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'scope', g.scope::text,
      'target_type', g.target_type::text,
      'target_id', g.target_id,
      'role', g.role::text
    )
    ORDER BY g.scope, g.target_type, g.target_id, g.role
  ), '[]'::jsonb)
  INTO grants_claim
  FROM public.grants g
  WHERE g.user_id = (p_event->>'user_id')::uuid;

  claims := jsonb_set(claims, '{grants}', grants_claim);
  RETURN jsonb_set(p_event, '{claims}', claims);
END;
$$;

-- Grant execute to auth admin (required for the hook to work)
GRANT
EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- And to nobody else, per Supabase's guidance for auth hooks: only the auth server calls this function. Without the REVOKE it would stay harmless only because it is SECURITY INVOKER and `grants` is revoked from the API roles.
REVOKE
EXECUTE ON FUNCTION public.custom_access_token_hook
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- grant_role_permissions: the role x permission matrix, encoded once
--
-- This is the only function body that holds the matrix, so its permission literals can be found in one place and compared against the rights table without executing a permission check. user_can asks it for the verb and computes only reach.
--
-- Reads no table, so it is IMMUTABLE and not SECURITY DEFINER. search_path is pinned anyway, because the enum types it names are resolved at call time.
--
-- The fall-through arm returns the empty set for the shapes 300-auth-tables.sql's CHECK constraints admit but the matrix does not map (entity+admin, global+editor, account+editor), so user_can answers false for every permission on them.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_role_permissions (
  p_scope public.grant_scope_type,
  p_role public.grant_role_type,
  p_target_type public.entity_type
) RETURNS public.grant_permission[] LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT CASE
    -- Root: every verb.
    WHEN (p_scope, p_role) = ('global', 'admin') THEN ARRAY[
      'feedback.read',
      'feedback.manage',
      'account.edit_settings',
      'account.manage_projects',
      'account.manage_admins',
      'project.manage_editors',
      'project.edit_project_settings',
      'project.edit_app_settings',
      'project.edit_structure',
      'project.edit_questions',
      'project.read_structure',
      'project.edit_entities',
      'project.edit_nominations',
      'project.read_entities',
      'entity.edit_answers',
      'entity.read_answers',
      'entity.edit_immutable',
      'entity.invite_children',
      'entity.confirm',
      'nomination.edit',
      'nomination.read',
      'nomination.confirm',
      'nomination.create_parent'
    ]::public.grant_permission[]

    -- Account: every verb, within the account.
    WHEN (p_scope, p_role) = ('account', 'admin') THEN ARRAY[
      'feedback.read',
      'feedback.manage',
      'account.edit_settings',
      'account.manage_projects',
      'account.manage_admins',
      'project.manage_editors',
      'project.edit_project_settings',
      'project.edit_app_settings',
      'project.edit_structure',
      'project.edit_questions',
      'project.read_structure',
      'project.edit_entities',
      'project.edit_nominations',
      'project.read_entities',
      'entity.edit_answers',
      'entity.read_answers',
      'entity.edit_immutable',
      'entity.invite_children',
      'entity.confirm',
      'nomination.edit',
      'nomination.read',
      'nomination.confirm',
      'nomination.create_parent'
    ]::public.grant_permission[]

    -- ProjAdmin: every verb but the three account.* verbs.
    WHEN (p_scope, p_role) = ('project', 'admin') THEN ARRAY[
      'feedback.read',
      'feedback.manage',
      'project.manage_editors',
      'project.edit_project_settings',
      'project.edit_app_settings',
      'project.edit_structure',
      'project.edit_questions',
      'project.read_structure',
      'project.edit_entities',
      'project.edit_nominations',
      'project.read_entities',
      'entity.edit_answers',
      'entity.read_answers',
      'entity.edit_immutable',
      'entity.invite_children',
      'entity.confirm',
      'nomination.edit',
      'nomination.read',
      'nomination.confirm',
      'nomination.create_parent'
    ]::public.grant_permission[]

    -- ProjEditor: ProjAdmin minus project.manage_editors, project.edit_project_settings and nomination.confirm, which stay with admins. The editor keeps the app's face (app_settings); the admin keeps the project's shape (projects).
    WHEN (p_scope, p_role) = ('project', 'editor') THEN ARRAY[
      'feedback.read',
      'feedback.manage',
      'project.edit_app_settings',
      'project.edit_structure',
      'project.edit_questions',
      'project.read_structure',
      'project.edit_entities',
      'project.edit_nominations',
      'project.read_entities',
      'entity.edit_answers',
      'entity.read_answers',
      'entity.edit_immutable',
      'entity.invite_children',
      'entity.confirm',
      'nomination.edit',
      'nomination.read',
      'nomination.create_parent'
    ]::public.grant_permission[]

    -- OrganizationEditor: the entity set minus nomination.create_parent (an organization has no parent to create), plus entity.invite_children, which only this role holds.
    WHEN (p_scope, p_role, p_target_type) = ('entity', 'editor', 'organization') THEN ARRAY[
      'project.read_structure',
      'entity.edit_answers',
      'entity.read_answers',
      'entity.invite_children',
      'nomination.edit',
      'nomination.read'
    ]::public.grant_permission[]

    -- Candidate, FactionEditor and AllianceEditor share one row, nomination.create_parent included. Their nomination rights hold only while the project is unlocked, but the lock is row state, so the nomination policies check it and the matrix does not.
    WHEN p_scope = 'entity' AND p_role = 'editor'
      AND p_target_type IN ('candidate', 'faction', 'alliance') THEN ARRAY[
      'project.read_structure',
      'entity.edit_answers',
      'entity.read_answers',
      'nomination.edit',
      'nomination.read',
      'nomination.create_parent'
    ]::public.grant_permission[]

    -- Everything else, including global+editor, account+editor and entity+admin: the empty set.
    ELSE ARRAY[]::public.grant_permission[]
  END;
$$;

--------------------------------------------------------------------------------
-- entity_project_id: resolve an entity to its project
--
-- Returns the project_id of the row with this id in the one table the entity type names, or NULL when that table holds no such row or the type is NULL. NULL is a denial at every call site, never a match.
--
-- The type is required because the four entity tables have independent primary keys: one uuid can name a candidate in one project and an organization in another, so only the pair of type and id names one entity.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.entity_project_id (
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT CASE p_entity_type
    WHEN 'candidate' THEN (SELECT project_id FROM public.candidates WHERE id = p_entity_id)
    WHEN 'organization' THEN (SELECT project_id FROM public.organizations WHERE id = p_entity_id)
    WHEN 'faction' THEN (SELECT project_id FROM public.factions WHERE id = p_entity_id)
    WHEN 'alliance' THEN (SELECT project_id FROM public.alliances WHERE id = p_entity_id)
  END;
$$;

--------------------------------------------------------------------------------
-- election_project_id: resolve an election uuid to its project
--
-- Used by the two `election_constituency_groups` write policies. That table has no project_id of its own and its read policy delegates to the parent group's policy, but a write must not: a sub-select filtered by the caller's own row-level security would make the answer depend on the caller's read access as well as on their authority. SECURITY DEFINER moves the lookup out of the caller's view and leaves `user_can` the only thing deciding.
--
-- Returns NULL when the election does not exist, and user_can denies a NULL target at every scope but global. 17-project-structure-authority.test.sql asserts that path.
--
-- This and constituency_group_project_id are two named functions rather than one generic one, because elections and constituency_groups are two tables with no enum relating them, and a generic version would need dynamic SQL inside a security predicate.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.election_project_id (p_election_id uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT project_id FROM public.elections WHERE id = p_election_id;
$$;

--------------------------------------------------------------------------------
-- constituency_group_project_id: resolve a constituency-group uuid to its project
--
-- The same hop for the two `constituency_group_constituencies` write policies, for the reason given on election_project_id above. Returns NULL when the group does not exist, which user_can denies.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.constituency_group_project_id (p_constituency_group_id uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT project_id FROM public.constituency_groups WHERE id = p_constituency_group_id;
$$;

--------------------------------------------------------------------------------
-- is_child_nominee: is the child entity nominated under a nomination of the parent entity?
--
-- One hop only: a grandchild (a candidate nominated under a faction nomination whose own parent is the organization's nomination) is false when asked against the organization, and 12-user-can.test.sql asserts that.
--
-- Both sides take a type: nominations carries four nullable entity FKs with a CHECK requiring exactly one, and its generated entity_type column names the one that is set (104-nominations.sql). Each side's type selects the column its id is compared with, so a nomination of another entity type that shares the uuid never matches. 33-entity-type-collision.test.sql asserts that.
--
-- Called by user_can's child-nominee branch.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.is_child_nominee (
  p_parent_type public.entity_type,
  p_parent_id uuid,
  p_child_type public.entity_type,
  p_child_id uuid
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nominations child
    JOIN public.nominations parent ON parent.id = child.parent_nomination_id
    WHERE child.entity_type = p_child_type
      AND CASE p_child_type
            WHEN 'candidate' THEN child.candidate_id
            WHEN 'organization' THEN child.organization_id
            WHEN 'faction' THEN child.faction_id
            WHEN 'alliance' THEN child.alliance_id
          END = p_child_id
      AND parent.entity_type = p_parent_type
      AND CASE p_parent_type
            WHEN 'candidate' THEN parent.candidate_id
            WHEN 'organization' THEN parent.organization_id
            WHEN 'faction' THEN parent.faction_id
            WHEN 'alliance' THEN parent.alliance_id
          END = p_parent_id
  );
$$;

--------------------------------------------------------------------------------
-- project_open_for_voters: is this project open to the anonymous reader?
--
-- The project-level term of public visibility, carried by every `TO anon` SELECT policy in 302-rls.sql. public.projects has RLS enabled and no anon policy, so an inline `EXISTS (SELECT 1 FROM public.projects ...)` in an anon policy returns no rows for any caller; SECURITY DEFINER is what lets the policy read the flag.
--
-- Denies when the project does not exist: COALESCE over a primary-key probe returns false, never NULL.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.project_open_for_voters (p_project_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (SELECT p.open_for_voters FROM public.projects p WHERE p.id = p_project_id),
    false
  );
$$;

-- The frontend adapter calls this function over PostgREST, as anon and as authenticated, to tell a closed project from an open project with no settings row, so the grant is declared here rather than inherited from default privileges. 30-closed-project.test.sql asserts both rights.
GRANT
EXECUTE ON FUNCTION public.project_open_for_voters (uuid) TO anon,
authenticated;

--------------------------------------------------------------------------------
-- entity_has_confirmed_nomination: is this entity publicly nominated in this project?
--
-- The entity-level term of public visibility, called by the entity tables' anon SELECT policies. It asks whether an entity has a confirmed nomination at all, where is_child_nominee asks whether it is nominated under a named parent, so the two do not share a body. No policy holds a nominations sub-select of its own.
--
-- SECURITY DEFINER also breaks a policy cycle: an entity policy with an inline nominations sub-select, beside a nominations policy with an inline entity sub-select, raises `infinite recursion detected in policy`. The owner-rights read relies on relforcerowsecurity being false on the projects, nominations and four entity tables, which 16-anon-visibility.test.sql asserts.
--
-- The project argument is required because public.nominations carries its own project_id and no constraint forces it to agree with the entity's; 07-rpc-security.test.sql section 9 creates such a row. Without it, an entity in an open project would be published by a nomination in a closed one.
--
-- p_entity_type is an argument rather than four near-identical predicates, and it is matched against the generated entity_type column as well as the four FK columns. `confirmed` is NOT NULL, so it is read bare.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.entity_has_confirmed_nomination (
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_project_id uuid
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nominations n
    WHERE n.project_id = p_project_id
      AND n.entity_type = p_entity_type
      AND (
        n.candidate_id = p_entity_id
        OR n.organization_id = p_entity_id
        OR n.faction_id = p_entity_id
        OR n.alliance_id = p_entity_id
      )
      AND n.confirmed
  );
$$;

--------------------------------------------------------------------------------
-- nomination_entities_confirmed: is every entity this nomination links anon-readable?
--
-- The transitive conjunct of anon_select_nominations, called by nothing else. A nomination links exactly one entity (the CHECK on public.nominations), so the hop is one level deep; a parent nomination naming an unconfirmed organization fails its own policy, because every nomination is judged by the same conjuncts.
--
-- Anon-readable means the entity policy's own predicate, terms of use included, so both policies give one answer. The terms-of-use rule is therefore written in two places, and the biconditional assertion in 16-anon-visibility.test.sql (no nomination visible to anon whose linked entity is not) fails when the two disagree.
--
-- Each arm calls project_open_for_voters and entity_has_confirmed_nomination directly rather than through a composing helper, because a SECURITY DEFINER function is never inlined and every added layer is another per-row call. The same assembly repeats in the eight entity SELECT policies, and 25-matrix-conformance.test.sql holds those eight identical.
--
-- It does not require the linked entity to belong to the nomination's own project. No constraint declares that, and 07-rpc-security.test.sql section 9 uses a project-A nomination naming project B's candidate as a negative control.
--
-- Denies when the nomination does not exist, and when no FK is set at all.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.nomination_entities_confirmed (p_nomination_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (
      SELECT CASE
        WHEN n.candidate_id IS NOT NULL THEN EXISTS (
          SELECT 1
          FROM public.candidates e
          WHERE e.id = n.candidate_id
            AND e.confirmed
            AND e.terms_of_use_accepted IS NOT NULL
            AND e.terms_of_use_accepted < now()
            AND public.project_open_for_voters (e.project_id)
            AND private.entity_has_confirmed_nomination ('candidate'::public.entity_type, e.id, e.project_id)
        )
        WHEN n.organization_id IS NOT NULL THEN EXISTS (
          SELECT 1
          FROM public.organizations e
          WHERE e.id = n.organization_id
            AND e.confirmed
            AND public.project_open_for_voters (e.project_id)
            AND private.entity_has_confirmed_nomination ('organization'::public.entity_type, e.id, e.project_id)
        )
        WHEN n.faction_id IS NOT NULL THEN EXISTS (
          SELECT 1
          FROM public.factions e
          WHERE e.id = n.faction_id
            AND e.confirmed
            AND public.project_open_for_voters (e.project_id)
            AND private.entity_has_confirmed_nomination ('faction'::public.entity_type, e.id, e.project_id)
        )
        WHEN n.alliance_id IS NOT NULL THEN EXISTS (
          SELECT 1
          FROM public.alliances e
          WHERE e.id = n.alliance_id
            AND e.confirmed
            AND public.project_open_for_voters (e.project_id)
            AND private.entity_has_confirmed_nomination ('alliance'::public.entity_type, e.id, e.project_id)
        )
        ELSE false
      END
      FROM public.nominations n
      WHERE n.id = p_nomination_id
    ),
    false
  );
$$;

--------------------------------------------------------------------------------
-- user_can: may the caller do this verb to this object?
--
-- The predicate the RLS policies delegate their authority decision to. It checks one grant at a time, and a grant says yes only when both halves say yes:
--
-- 1. VERB: p_permission is a member of grant_role_permissions(...) for the grant's scope, role and target type.
-- 2. REACH: the grant's target contains, or equals, the asked object. For an entity grant that is equality of both type and id, which is what an `own` cell of the matrix means.
--
-- At entity scope the object is the pair p_target_type, p_target_id, and a NULL type denies. The four entity tables have independent primary keys, so one uuid can name a candidate in one project and an organization in another; every entity-scope hop below therefore resolves the id together with its type. At every other scope p_target_type is ignored, and its NULL default lets project- and account-scope callers pass three arguments. 33-entity-type-collision.test.sql asserts a shared id across two tables and two projects.
--
-- Grants union: the first grant satisfying both halves answers true, no grant can subtract, and the order of entries in the claim does not matter.
--
-- It answers "may this role do this verb to this object", not "is the object in a state that admits the verb". lock_nominations, open_for_voters and the confirmation flags are conjuncts of the policies that call it, not members of the matrix.
--
-- It reads only the caller's JWT `grants` claim, in every branch. Claim fields are compared as text against the enum literals rather than cast: a cast throws on an unexpected value, and an exception inside a policy predicate is a query-time error, whereas an unrecognised entry that is skipped denies by default. A claim of garbage alongside one valid grant answers exactly as the valid grant alone.
--
-- SECURITY DEFINER because the reach hops read public.projects and the entity tables, which the caller's own row-level security would filter. search_path is empty because a mutable search_path on a SECURITY DEFINER function is a privilege-escalation primitive.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_can (
  p_scope public.grant_scope_type,
  p_target_id uuid,
  p_permission public.grant_permission,
  p_target_type public.entity_type DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  grants_claim jsonb;
  grant_entry jsonb;
  g_scope text;
  g_role text;
  g_target_type text;
  g_target_id uuid;
  g_permissions public.grant_permission[];
  v_project_id uuid;
  v_account_id uuid;
BEGIN
  IF p_scope IS NULL OR p_permission IS NULL THEN RETURN false; END IF;

  -- A NULL target is meaningful only at global scope, where there is no object to name. At every other scope it is a degenerate input and denies.
  IF p_target_id IS NULL AND p_scope <> 'global' THEN RETURN false; END IF;

  -- An entity is named by its type and id together, so an entity-scope question without a type denies.
  IF p_scope = 'entity' AND p_target_type IS NULL THEN RETURN false; END IF;

  grants_claim := (SELECT auth.jwt() -> 'grants');
  -- NULL covers the anon session and a token without the claim; a non-array covers a malformed claim. Both deny rather than raise.
  IF grants_claim IS NULL OR jsonb_typeof(grants_claim) <> 'array' THEN RETURN false; END IF;

  FOR grant_entry IN SELECT * FROM jsonb_array_elements(grants_claim)
  LOOP
    g_scope := grant_entry ->> 'scope';
    g_role := grant_entry ->> 'role';
    g_target_type := grant_entry ->> 'target_type';

    -- Skip anything outside the declared vocabularies rather than casting it.
    CONTINUE WHEN g_scope IS NULL OR g_scope NOT IN ('global', 'account', 'project', 'entity');
    CONTINUE WHEN g_role IS NULL OR g_role NOT IN ('admin', 'editor');
    CONTINUE WHEN g_target_type IS NOT NULL
      AND g_target_type NOT IN ('candidate', 'organization', 'faction', 'alliance');

    g_target_id := NULL;
    IF grant_entry ->> 'target_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      g_target_id := (grant_entry ->> 'target_id')::uuid;
    END IF;

    -- 300-auth-tables.sql's two CHECK constraints, restated over the claim: a global grant has no target, every other scope has one, and the entity discriminator is present exactly when the scope is entity.
    CONTINUE WHEN g_target_id IS NULL AND g_scope <> 'global';
    CONTINUE WHEN g_target_id IS NOT NULL AND g_scope = 'global';
    CONTINUE WHEN (g_target_type IS NOT NULL) <> (g_scope = 'entity');

    -- Half 1: the verb. This is the only place user_can consults the matrix.
    g_permissions := public.grant_role_permissions(
      g_scope::public.grant_scope_type,
      g_role::public.grant_role_type,
      g_target_type::public.entity_type
    );
    CONTINUE WHEN g_permissions IS NULL OR NOT (p_permission = ANY (g_permissions));

    -- Half 2: reach. Downward-or-equal from the grant's own target, plus the two named branches below. Every hop denies when it finds no row; no branch treats a NULL comparison result as a match.
    IF g_scope = 'global' THEN
      -- Reaches everything that exists. The existence check is deliberate: an entity that resolves to no project is not an object any grant reaches, and a global grant must not be the one branch that says otherwise because its lookup was skipped.
      CONTINUE WHEN p_scope = 'entity' AND private.entity_project_id(p_target_type, p_target_id) IS NULL;
      RETURN true;
    END IF;

    IF g_scope = 'account' THEN
      IF p_scope = 'account' AND p_target_id = g_target_id THEN RETURN true; END IF;
      IF p_scope = 'project' THEN
        SELECT account_id INTO v_account_id FROM public.projects WHERE id = p_target_id;
        IF v_account_id IS NOT NULL AND v_account_id = g_target_id THEN RETURN true; END IF;
      END IF;
      IF p_scope = 'entity' THEN
        v_project_id := private.entity_project_id(p_target_type, p_target_id);
        IF v_project_id IS NOT NULL THEN
          SELECT account_id INTO v_account_id FROM public.projects WHERE id = v_project_id;
          IF v_account_id IS NOT NULL AND v_account_id = g_target_id THEN RETURN true; END IF;
        END IF;
      END IF;
      CONTINUE;
    END IF;

    IF g_scope = 'project' THEN
      IF p_scope = 'project' AND p_target_id = g_target_id THEN RETURN true; END IF;
      IF p_scope = 'entity' THEN
        v_project_id := private.entity_project_id(p_target_type, p_target_id);
        IF v_project_id IS NOT NULL AND v_project_id = g_target_id THEN RETURN true; END IF;
      END IF;
      CONTINUE;
    END IF;

    -- g_scope = 'entity'. Reach is equality with the granted entity, type and id both, which is what an `own` matrix cell means, plus the named branches below.
    IF p_scope = 'entity' AND g_target_type = p_target_type::text AND p_target_id = g_target_id THEN RETURN true; END IF;

    -- NAMED BRANCH 1, the project-read branch: an entity grantee may read the structure of its entity's project. The permission is a literal so the hop cannot widen to another verb; a general upward-reach rule would also answer yes to entity.edit_answers at account scope.
    IF p_scope = 'project' AND p_permission = 'project.read_structure' THEN
      v_project_id := private.entity_project_id(g_target_type::public.entity_type, g_target_id);
      IF v_project_id IS NOT NULL AND v_project_id = p_target_id THEN RETURN true; END IF;
    END IF;

    -- NAMED BRANCH 2, the child-nominee branch: an entity grantee may read the nominations of an entity nominated under one of its own entity's nominations, but not that entity's answers. Like branch 1, the permission is a literal so the hop cannot widen to another verb.
    IF p_scope = 'entity' AND p_permission = 'nomination.read'
       AND private.is_child_nominee(g_target_type::public.entity_type, g_target_id, p_target_type, p_target_id) THEN
      RETURN true;
    END IF;

    CONTINUE;
  END LOOP;

  RETURN false;
END;
$$;

--------------------------------------------------------------------------------
-- user_has_account_grant: does the caller hold ANY role on this account or on one of its projects?
--
-- Not a user_can call, because it asks whether a grant exists rather than whether a role holds a permission. It is the `accounts` read rule, so an account's read and its write (`account.edit_settings`) name different things.
--
-- The project disjunct lets a project admin read the row of the account its project belongs to. The disclosure is bounded: an `accounts` row is `id, name, created_at, updated_at`, so what widens is the account's name, to someone who already administers one of its projects. 04-admin-crud.test.sql asserts that such a caller sees exactly its own account.
--
-- SECURITY DEFINER because the project disjunct reads public.projects, which has row-level security enabled; an inline read would also ask whether the caller can see the project. search_path is pinned as on every definer function here.
--
-- Claim fields are compared as text rather than cast, as in user_can: `p.id::text = (g ->> 'target_id')` never casts the claim, so an unexpected value denies instead of raising.
--
-- The global admin is a disjunct here rather than a separate policy term, so the `accounts` SELECT stays a single call.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_account_grant (p_account_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof((SELECT auth.jwt() -> 'grants')) = 'array'
           THEN (SELECT auth.jwt() -> 'grants')
           ELSE '[]'::jsonb END
    ) AS g
    WHERE ((g ->> 'scope') = 'global' AND (g ->> 'role') = 'admin')
       OR ((g ->> 'scope') = 'account' AND (g ->> 'target_id') = p_account_id::text)
       OR ((g ->> 'scope') = 'project' AND EXISTS (
             SELECT 1
             FROM public.projects p
             WHERE p.id::text = (g ->> 'target_id')
               AND p.account_id = p_account_id))
  );
$$;

--------------------------------------------------------------------------------
-- project_nominations_locked: is this project's nomination editing locked?
--
-- The lock is row state rather than a member of the permission matrix, so it is a conjunct of the nomination policies and this function is the hop they call.
--
-- It returns true (locked) when the project row is not found, so a missing project never unlocks anything. project_open_for_voters denies with false because its sense is the other way round.
--
-- SECURITY DEFINER because public.projects has row-level security enabled, and an inline read would also ask whether the caller can see the project.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.project_nominations_locked (p_project_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (SELECT p.lock_nominations FROM public.projects p WHERE p.id = p_project_id),
    true
  );
$$;

--------------------------------------------------------------------------------
-- nomination_exists_in_contest: is this entity already nominated at this contest?
--
-- This is not the uniqueness constraint. `nominations_entity_parent_contest_key` includes `parent_nomination_id`, so an organization already nominated under an alliance does not collide with a candidate-created parent that has no parent of its own; this asks whether there is any nomination of the entity at this election, constituency and round. 23-nominations-write.test.sql's G3-race pair shows the two predicates differ.
--
-- The constraint still decides a race: two candidates of one party submitting at once both see no parent here, and the database rejects the second insert. This helper gives the fast path and the better error.
--
-- Takes the entity type as an argument and matches it against the generated entity_type column, and the entity id against the four foreign keys, so a nomination of another type that shares the uuid does not match. Returns false when no row is found, so a missing row never fabricates an occupant; the consuming policy inverts the answer.
--
-- `election_round` is compared with IS NOT DISTINCT FROM because the column is nullable, and `=` against a NULL round would answer "no occupant" for every such row.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.nomination_exists_in_contest (
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_election_id uuid,
  p_constituency_id uuid,
  p_election_round integer
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nominations n
    WHERE n.entity_type = p_entity_type
      AND (
        n.candidate_id = p_entity_id
        OR n.organization_id = p_entity_id
        OR n.faction_id = p_entity_id
        OR n.alliance_id = p_entity_id
      )
      AND n.election_id = p_election_id
      AND n.constituency_id = p_constituency_id
      AND n.election_round IS NOT DISTINCT FROM p_election_round
  );
$$;

--------------------------------------------------------------------------------
-- caller_nominated_in_contest: does the caller hold a named permission on an entity nominated at this contest?
--
-- Asks whether there is a nomination at this contest whose entity the caller holds p_permission on. The answer comes from `user_can`, so no cell of the matrix is written down a second time. The entity is named by the nomination's generated entity_type and its one set foreign key.
--
-- A row-level WITH CHECK sees only the row being inserted, so "the caller is inserting their own nomination in the same transaction" cannot be expressed here. Insertion order makes that moot: a candidate first creates their own nomination with no parent (which `validate_nomination` admits), then the parent, then repoints their nomination at it.
--
-- Denies (returns false) when no row is found.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.caller_nominated_in_contest (
  p_election_id uuid,
  p_constituency_id uuid,
  p_election_round integer,
  p_permission public.grant_permission
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nominations n
    WHERE n.election_id = p_election_id
      AND n.constituency_id = p_constituency_id
      AND n.election_round IS NOT DISTINCT FROM p_election_round
      AND public.user_can(
            'entity',
            COALESCE(n.candidate_id, n.organization_id, n.faction_id, n.alliance_id),
            p_permission,
            n.entity_type
          )
  );
$$;

--------------------------------------------------------------------------------
-- caller_unconfirmed_originated_count: how many unconfirmed parent nominations has this caller originated?
--
-- The subject of the cap: rows with `created_by = auth.uid()` that are organization nominations and still unconfirmed, i.e. placeholder parents awaiting an admin. A confirmed row leaves the count, so the cap bounds the queue rather than a lifetime total.
--
-- `count(*)` returns 0, never NULL, when nothing matches; a NULL would make the policy's `< cap` comparison NULL and bar every caller.
--
-- A caller with no token has `auth.uid() IS NULL` and counts the rows whose originator is NULL, which is every seeded and owner-inserted row. That is harmless because both consumers run only for `authenticated` callers: the nomination insert policy is `TO authenticated`, and the cap check in `enforce_nomination_confirmation()` tests `current_user`.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.caller_unconfirmed_originated_count () RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT count(*)::integer
  FROM public.nominations n
  WHERE n.created_by IS NOT DISTINCT FROM (SELECT auth.uid())
    AND n.organization_id IS NOT NULL
    AND NOT n.confirmed;
$$;

-- Policies evaluate as the querying role, so the API roles need EXECUTE on the private helpers; PostgREST cannot reach them because `private` is not an exposed schema. Stated explicitly rather than inherited from PostgreSQL's default PUBLIC grant, so the dependency is visible here.
GRANT
EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO anon,
authenticated,
service_role;
-- Row Level Security: per-operation access policies for every public table.
--
-- Helper functions, defined in 301-auth-functions.sql:
-- - user_can(scope, target_id, permission, target_type): whether the caller may apply this permission to this object. At entity scope the object is named by its entity type and id together, so every entity-scope call passes the type; at every other scope the type is omitted. Every authority decision in this file delegates to it.
-- - project_open_for_voters(project_id): whether the project is open to voters.
-- - private.entity_has_confirmed_nomination(entity_type, id, project_id): whether the entity has a confirmed nomination in the project.
--
-- An entity row is publicly visible when project_open_for_voters, the row's `confirmed` flag and entity_has_confirmed_nomination all hold. Each entity SELECT policy assembles that conjunction inline from the helpers.
--
-- Policy rules:
-- - SELECT = USING only.
-- - INSERT = WITH CHECK only.
-- - UPDATE = USING + WITH CHECK.
-- - DELETE = USING only.
-- - Always specify TO anon or TO authenticated.
-- - Always use (SELECT auth.uid()) and (SELECT auth.jwt()) for optimizer caching.
-- =====================================================================
-- accounts (no project_id, no project scope at all)
-- =====================================================================
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "accounts_deny_all" ON public.accounts;

-- Authenticated read: any grant on the account or on one of its projects, so a project admin can read the account its project belongs to. This asks whether a grant exists rather than whether a permission is held, which user_can cannot express, so it is the one structure-table predicate that is not a user_can call. See public.user_has_account_grant.
CREATE POLICY "authenticated_select_accounts" ON public.accounts FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_has_account_grant (id)
    )
  );

-- Insert: asked at global scope with a NULL target, deliberately. The WITH CHECK sees the new row, whose id the caller chooses, and grants.target_id has no foreign key to accounts, so an account-scope check would let an admin pre-granted on an unused uuid create that account and own it. Do not narrow this to account scope.
CREATE POLICY "admin_insert_accounts" ON public.accounts FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('global', NULL::uuid, 'account.edit_settings')
    )
  );

-- Update: `account.edit_settings` at account scope, which admits the root admin and the account's own admin. The row is named by its own id, so tenancy is carried by the target.
CREATE POLICY "admin_update_accounts" ON public.accounts
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('account', id, 'account.edit_settings')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('account', id, 'account.edit_settings')
    )
  );

-- Delete: global scope with a NULL target, so only the root admin may delete an account.
CREATE POLICY "admin_delete_accounts" ON public.accounts FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('global', NULL::uuid, 'account.edit_settings')
  )
);

-- =====================================================================
-- projects (has account_id; openness to voters lives on the row itself)
-- =====================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_deny_all" ON public.projects;

-- Authenticated read: any caller holding a grant in the project may read it. The decision is delegated wholly to user_can; a second project-access disjunct beside it would mask a regression in user_can.
CREATE POLICY "authenticated_select_projects" ON public.projects FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', id, 'project.read_structure')
    )
  );

-- Insert: `account.manage_projects` at account scope, against the new row's account, which admits the account admin and the root admin.
CREATE POLICY "admin_insert_projects" ON public.projects FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('account', account_id, 'account.manage_projects')
    )
  );

-- Update: `project.edit_project_settings`, a different permission from the read policy's `project.read_structure`; 17-project-structure-authority.test.sql asserts each policy names its own literal. A project editor holds `project.edit_structure` but not this permission, so an editor may reshape the project's elections but may not rename the project.
CREATE POLICY "admin_update_projects" ON public.projects
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', id, 'project.edit_project_settings')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', id, 'project.edit_project_settings')
    )
  );

-- Delete: `account.manage_projects` at account scope, so deleting a project takes account authority: a project admin may update its own project but may not delete it. 17-project-structure-authority.test.sql asserts both directions.
CREATE POLICY "admin_delete_projects" ON public.projects FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('account', account_id, 'account.manage_projects')
  )
);

-- =====================================================================
-- elections (project_id)
-- =====================================================================
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "elections_deny_all" ON public.elections;

CREATE POLICY "anon_select_elections" ON public.elections FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Authenticated read: two different questions, kept as two disjuncts. `user_can` asks whether the caller holds `project.read_structure`, and `project_open_for_voters` asks whether the row is public, using the same helper as the anon policy so the two roles cannot drift apart. Without the public term a signed-in caller with no grant would see less than an anon caller, which would break sign-up because it reads structure before any grant exists.
CREATE POLICY "authenticated_select_elections" ON public.elections FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_structure')
    )
    OR (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Insert: `project.edit_structure`, not the read permission the SELECT names.
CREATE POLICY "admin_insert_elections" ON public.elections FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  );

-- Update: `project.edit_structure`, held by project admins and editors. An entity grantee holds `project.read_structure` but not this permission, so it can read the project's elections but not edit them.
CREATE POLICY "admin_update_elections" ON public.elections
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  );

-- Delete: `project.edit_structure`.
CREATE POLICY "admin_delete_elections" ON public.elections FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_structure')
  )
);

-- =====================================================================
-- constituency_groups (project_id)
-- =====================================================================
ALTER TABLE public.constituency_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "constituency_groups_deny_all" ON public.constituency_groups;

CREATE POLICY "anon_select_constituency_groups" ON public.constituency_groups FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Authenticated read: the same two-term disjunction as the elections SELECT, repeated so the structure tables cannot drift apart.
CREATE POLICY "authenticated_select_constituency_groups" ON public.constituency_groups FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_structure')
    )
    OR (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Insert: `project.edit_structure`, not the read permission the SELECT names.
CREATE POLICY "admin_insert_constituency_groups" ON public.constituency_groups FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  );

-- Update: `project.edit_structure`, held by project admins and editors.
CREATE POLICY "admin_update_constituency_groups" ON public.constituency_groups
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  );

-- Delete: `project.edit_structure`.
CREATE POLICY "admin_delete_constituency_groups" ON public.constituency_groups FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_structure')
  )
);

-- =====================================================================
-- constituencies (project_id)
-- =====================================================================
ALTER TABLE public.constituencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "constituencies_deny_all" ON public.constituencies;

CREATE POLICY "anon_select_constituencies" ON public.constituencies FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Authenticated read: the same two-term disjunction as the elections SELECT, repeated so the structure tables cannot drift apart.
CREATE POLICY "authenticated_select_constituencies" ON public.constituencies FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_structure')
    )
    OR (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Insert: `project.edit_structure`, not the read permission the SELECT names.
CREATE POLICY "admin_insert_constituencies" ON public.constituencies FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  );

-- Update: `project.edit_structure`, held by project admins and editors.
CREATE POLICY "admin_update_constituencies" ON public.constituencies
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  );

-- Delete: `project.edit_structure`.
CREATE POLICY "admin_delete_constituencies" ON public.constituencies FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_structure')
  )
);

-- =====================================================================
-- constituency_group_constituencies (join table, no project_id)
-- =====================================================================
ALTER TABLE public.constituency_group_constituencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "constituency_group_constituencies_deny_all" ON public.constituency_group_constituencies;

-- Anon: a join row is visible exactly when its constituency group is. The table has no project_id, so the sub-select delegates to the group's own policy, which applies because the sub-select runs under the caller's row-level security. There is no policy cycle, because the group's policy does not reference this table.
CREATE POLICY "anon_select_constituency_group_constituencies" ON public.constituency_group_constituencies FOR
SELECT
  TO anon USING (
    EXISTS (
      SELECT
        1
      FROM
        public.constituency_groups cg
      WHERE
        cg.id = constituency_group_id
    )
  );

-- Authenticated: the same delegation as the anon policy, character for character, so the two roles cannot answer differently. A wrong denial here is silent: supabaseDataProvider.ts reads this table only as a PostgREST embedded resource of `constituency_groups`, and a denied embed returns an empty array rather than an error.
CREATE POLICY "authenticated_select_constituency_group_constituencies" ON public.constituency_group_constituencies FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        public.constituency_groups cg
      WHERE
        cg.id = constituency_group_id
    )
  );

-- Admin insert: `project.edit_structure` on the group's project, resolved by a SECURITY DEFINER helper rather than a sub-select, so a write does not depend on the caller's read access to the parent. The helper returns NULL for a missing group and user_can denies a NULL target at project scope, so an absent parent is refused.
CREATE POLICY "admin_insert_constituency_group_constituencies" ON public.constituency_group_constituencies FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can (
          'project',
          private.constituency_group_project_id (constituency_group_id),
          'project.edit_structure'
        )
    )
  );

-- Admin delete: `project.edit_structure` on the group's project, resolved by the same helper.
CREATE POLICY "admin_delete_constituency_group_constituencies" ON public.constituency_group_constituencies FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can (
        'project',
        private.constituency_group_project_id (constituency_group_id),
        'project.edit_structure'
      )
  )
);

-- =====================================================================
-- election_constituency_groups (join table, no project_id)
-- =====================================================================
ALTER TABLE public.election_constituency_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "election_constituency_groups_deny_all" ON public.election_constituency_groups;

-- Anon: a join row is visible exactly when its constituency group is. The table has no project_id, so the sub-select delegates to the group's own policy, which applies because the sub-select runs under the caller's row-level security. There is no policy cycle, because the group's policy does not reference this table.
CREATE POLICY "anon_select_election_constituency_groups" ON public.election_constituency_groups FOR
SELECT
  TO anon USING (
    EXISTS (
      SELECT
        1
      FROM
        public.constituency_groups cg
      WHERE
        cg.id = constituency_group_id
    )
  );

-- Authenticated: the same delegation as the anon policy, character for character, so the two roles cannot answer differently and a change to the group's visibility reaches this table too. A wrong denial here is silent: supabaseDataProvider.ts reads this table only as a PostgREST embedded resource of `elections`, and a denied embed returns an empty array rather than an error.
CREATE POLICY "authenticated_select_election_constituency_groups" ON public.election_constituency_groups FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        public.constituency_groups cg
      WHERE
        cg.id = constituency_group_id
    )
  );

-- Admin insert: `project.edit_structure` on the election's project, resolved by a SECURITY DEFINER helper rather than a sub-select, so a write does not depend on the caller's read access to the parent. election_project_id returns NULL for a missing election and user_can denies a NULL target at project scope, so an absent parent is refused by the permission check itself.
CREATE POLICY "admin_insert_election_constituency_groups" ON public.election_constituency_groups FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can (
          'project',
          private.election_project_id (election_id),
          'project.edit_structure'
        )
    )
  );

-- Admin delete: `project.edit_structure` on the election's project, resolved by the same helper.
CREATE POLICY "admin_delete_election_constituency_groups" ON public.election_constituency_groups FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can (
        'project',
        private.election_project_id (election_id),
        'project.edit_structure'
      )
  )
);

-- =====================================================================
-- THE FOUR ENTITY TABLES -- organizations, candidates, factions, alliances -- ONE SHAPE, FIVE POLICIES EACH
-- =====================================================================
-- The twenty policies below are four copies of one shape, differing only in the table name and the entity-type literal. 18-entity-policies.test.sql asserts this structurally: each policy family's four expressions are one string once those two are normalised away, and for SELECT also the two terms-of-use conjuncts that only candidates carry.
--
-- Permissions used on the entity tables:
-- - project.read_entities: the SELECT policies' project disjunct, held by the root, account and project admins and by project editors.
-- - project.edit_entities: the INSERT, admin UPDATE and DELETE policies, held by the same four.
-- - entity.read_answers: the SELECT policies' own-row disjunct, held on its own row by an entity grant.
-- - entity.edit_answers: the self-update policies, held on its own row by an entity grant.
--
-- An entity grantee holds neither project permission, so it cannot reach another entity of its project through a project-scope call. For an entity grant, user_can's reach is equality with the granted entity, type and id both, so "is this row mine" needs no column comparison. Each entity policy passes its own table's entity type.
--
-- A parent entity's reach to its child nominee is not a row disjunct and must not become one: a SELECT policy returns every column, `answers` and `auth_user_id` included. That reach is served by public.get_entity_basic_data (503-entity-rpcs.sql), which is gated on `nomination.read` and returns an allow-listed projection; 18-entity-policies.test.sql asserts the parent cannot SELECT the child's row.
--
-- Row state (`confirmed`, open for voters, the terms-of-use timestamps) appears only in the public disjunct, never beside a grant, because user_can answers whether a role may apply a permission, not whether the row's state admits it. An entity grantee therefore reads and edits its own unconfirmed row, which the sign-up flow needs; name immutability on a confirmed entity is enforced by a trigger.
--
-- The public disjunct is assembled inline in all eight entity SELECT policies rather than composed into one function: a SECURITY DEFINER function cannot be inlined by the planner, so a composing function adds a per-row call and is several times slower. The two sub-rules keep a single definition each; 25-matrix-conformance.test.sql holds the eight assemblies identical, and 16-anon-visibility.test.sql holds the behavioural guards for the open-for-voters conjunct.
--
-- The `admin_*` policies also admit project editors, who hold project.edit_entities; the prefix is kept because every table's policies share it.
-- =====================================================================
-- organizations (project_id, confirmed, auth_user_id)
-- =====================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizations_deny_all" ON public.organizations;

CREATE POLICY "anon_select_organizations" ON public.organizations FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
    AND confirmed
    AND (
      SELECT
        private.entity_has_confirmed_nomination (
          'organization'::public.entity_type,
          id,
          project_id
        )
    )
  );

-- Disjunct order is deliberate and changes cost, never the answer: project authority first so an admin exits on the first call, then the public assembly, token for token the `anon_select_organizations` qual, so a publicly visible row never pays the entity user_can call, then entity authority. 29-authenticated-disjunct-order.test.sql fails on any other order.
CREATE POLICY "authenticated_select_organizations" ON public.organizations FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_entities')
    )
    OR (
      (
        SELECT
          project_open_for_voters (project_id)
      )
      AND confirmed
      AND (
        SELECT
          private.entity_has_confirmed_nomination (
            'organization'::public.entity_type,
            id,
            project_id
          )
      )
    )
    OR (
      SELECT
        user_can (
          'entity',
          id,
          'entity.read_answers',
          'organization'::public.entity_type
        )
    )
  );

CREATE POLICY "admin_insert_organizations" ON public.organizations FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  );

CREATE POLICY "entity_update_own_organizations" ON public.organizations
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'organization'::public.entity_type
        )
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'organization'::public.entity_type
        )
    )
  );

CREATE POLICY "admin_update_organizations" ON public.organizations
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  );

CREATE POLICY "admin_delete_organizations" ON public.organizations FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_entities')
  )
);

-- =====================================================================
-- candidates (project_id, auth_user_id)
-- =====================================================================
-- Answers are stored in the JSONB `answers` column, so these row policies govern them too.
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "candidates_deny_all" ON public.candidates;

-- Anon: five conjuncts, each load-bearing and each flipped alone against an otherwise-visible row in 16-anon-visibility.test.sql. The project is open for voters; the candidate is confirmed; a confirmed nomination links it in this project, so confirming a nomination alone cannot publish a placeholder identity; terms of use were accepted (`IS NOT NULL`) and not future-dated (`< now()`, which also guards against clock skew).
--
-- Both helpers are SECURITY DEFINER because the inline lookups fail: anon cannot see `projects` rows under that table's own row-level security, and an inline entity/nomination lookup raises `infinite recursion detected in policy for relation "candidates"`.
CREATE POLICY "anon_select_candidates" ON public.candidates FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
    AND confirmed
    AND (
      SELECT
        private.entity_has_confirmed_nomination ('candidate'::public.entity_type, id, project_id)
    )
    AND terms_of_use_accepted IS NOT NULL
    AND terms_of_use_accepted < now()
  );

-- Disjunct order is deliberate and changes cost, never the answer: project authority first so an admin exits on the first call, then the public assembly, token for token the `anon_select_candidates` qual, so a publicly visible row never pays the entity user_can call, then entity authority. 29-authenticated-disjunct-order.test.sql fails on any other order.
CREATE POLICY "authenticated_select_candidates" ON public.candidates FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_entities')
    )
    OR (
      (
        SELECT
          project_open_for_voters (project_id)
      )
      AND confirmed
      AND (
        SELECT
          private.entity_has_confirmed_nomination ('candidate'::public.entity_type, id, project_id)
      )
      AND terms_of_use_accepted IS NOT NULL
      AND terms_of_use_accepted < now()
    )
    OR (
      SELECT
        user_can (
          'entity',
          id,
          'entity.read_answers',
          'candidate'::public.entity_type
        )
    )
  );

CREATE POLICY "admin_insert_candidates" ON public.candidates FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  );

-- Entity self-update: whoever holds `entity.edit_answers` on this row may update it. For an entity grant user_can's reach is equality with the granted entity, type and id both, so no `auth_user_id` comparison is needed.
--
-- The `'entity'` scope literal is the whole safety argument: written `'project'`, it would let any entity editor in the project rewrite every candidate in it. 18-entity-policies.test.sql asserts that same-type, same-project denial.
--
-- Structural columns (project_id, auth_user_id, external_id, ...) are protected by this table's column grants in 303-column-grants.sql, because row-level security cannot admit a row while withholding a column.
CREATE POLICY "entity_update_own_candidates" ON public.candidates
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'candidate'::public.entity_type
        )
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'candidate'::public.entity_type
        )
    )
  );

CREATE POLICY "admin_update_candidates" ON public.candidates
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  );

CREATE POLICY "admin_delete_candidates" ON public.candidates FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_entities')
  )
);

-- =====================================================================
-- factions (project_id, confirmed)
-- =====================================================================
ALTER TABLE public.factions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "factions_deny_all" ON public.factions;

CREATE POLICY "anon_select_factions" ON public.factions FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
    AND confirmed
    AND (
      SELECT
        private.entity_has_confirmed_nomination ('faction'::public.entity_type, id, project_id)
    )
  );

-- Disjunct order is deliberate and changes cost, never the answer: project authority first so an admin exits on the first call, then the public assembly, token for token the `anon_select_factions` qual, so a publicly visible row never pays the entity user_can call, then entity authority. 29-authenticated-disjunct-order.test.sql fails on any other order.
CREATE POLICY "authenticated_select_factions" ON public.factions FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_entities')
    )
    OR (
      (
        SELECT
          project_open_for_voters (project_id)
      )
      AND confirmed
      AND (
        SELECT
          private.entity_has_confirmed_nomination ('faction'::public.entity_type, id, project_id)
      )
    )
    OR (
      SELECT
        user_can (
          'entity',
          id,
          'entity.read_answers',
          'faction'::public.entity_type
        )
    )
  );

CREATE POLICY "admin_insert_factions" ON public.factions FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  );

-- Entity self-update: a faction grantee holding `entity.edit_answers` may update its own row, which keeps the four entity tables one shape. The columns it may write are bounded in 303-column-grants.sql.
CREATE POLICY "entity_update_own_factions" ON public.factions
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'faction'::public.entity_type
        )
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'faction'::public.entity_type
        )
    )
  );

CREATE POLICY "admin_update_factions" ON public.factions
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  );

CREATE POLICY "admin_delete_factions" ON public.factions FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_entities')
  )
);

-- =====================================================================
-- alliances (project_id, confirmed)
-- =====================================================================
ALTER TABLE public.alliances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alliances_deny_all" ON public.alliances;

CREATE POLICY "anon_select_alliances" ON public.alliances FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
    AND confirmed
    AND (
      SELECT
        private.entity_has_confirmed_nomination ('alliance'::public.entity_type, id, project_id)
    )
  );

-- Disjunct order is deliberate and changes cost, never the answer: project authority first so an admin exits on the first call, then the public assembly, token for token the `anon_select_alliances` qual, so a publicly visible row never pays the entity user_can call, then entity authority. 29-authenticated-disjunct-order.test.sql fails on any other order.
CREATE POLICY "authenticated_select_alliances" ON public.alliances FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_entities')
    )
    OR (
      (
        SELECT
          project_open_for_voters (project_id)
      )
      AND confirmed
      AND (
        SELECT
          private.entity_has_confirmed_nomination ('alliance'::public.entity_type, id, project_id)
      )
    )
    OR (
      SELECT
        user_can (
          'entity',
          id,
          'entity.read_answers',
          'alliance'::public.entity_type
        )
    )
  );

CREATE POLICY "admin_insert_alliances" ON public.alliances FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  );

-- Entity self-update: an alliance grantee holding `entity.edit_answers` may update its own row. The columns it may write are bounded in 303-column-grants.sql.
CREATE POLICY "entity_update_own_alliances" ON public.alliances
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'alliance'::public.entity_type
        )
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'alliance'::public.entity_type
        )
    )
  );

CREATE POLICY "admin_update_alliances" ON public.alliances
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  );

CREATE POLICY "admin_delete_alliances" ON public.alliances FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_entities')
  )
);

-- =====================================================================
-- question_categories (project_id)
-- =====================================================================
ALTER TABLE public.question_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "question_categories_deny_all" ON public.question_categories;

CREATE POLICY "anon_select_question_categories" ON public.question_categories FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Authenticated read: the same two-term disjunction as the structure tables, repeated so the content tables cannot drift from them. Every grant in the project holds `project.read_structure`, entity grants included, so the user_can term means "the caller holds some grant in this project"; `project_open_for_voters` is a SECURITY DEFINER helper because an inline lookup of `public.projects` is filtered by that table's own row-level security.
--
-- Both disjuncts are load-bearing: without the public term a caller with no grant sees less than an anon caller in an open project, and without the user_can term a closed project goes dark to its own grantees. 22-content-policies.test.sql asserts each case (cells 3 and 4).
CREATE POLICY "authenticated_select_question_categories" ON public.question_categories FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_structure')
    )
    OR (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Insert: `project.edit_questions`, not the read permission the SELECT names. It is held by the root, account and project admins and by project editors, and by no entity grant.
CREATE POLICY "admin_insert_question_categories" ON public.question_categories FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Update: `project.edit_questions`. 22-content-policies.test.sql pairs it against `candidate_a`, an entity grantee of the same project that holds project.read_structure but not this permission.
CREATE POLICY "admin_update_question_categories" ON public.question_categories
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Delete: `project.edit_questions`.
CREATE POLICY "admin_delete_question_categories" ON public.question_categories FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_questions')
  )
);

-- =====================================================================
-- questions (project_id)
-- =====================================================================
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "questions_deny_all" ON public.questions;

CREATE POLICY "anon_select_questions" ON public.questions FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Authenticated read: the same two-term disjunction as question_categories. `get_questions` (505-question-rpcs.sql) is SECURITY INVOKER, so this policy and the category one gate the whole question surface of the voter and candidate apps, and a predicate one term too narrow renders no questions rather than raising an error.
CREATE POLICY "authenticated_select_questions" ON public.questions FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_structure')
    )
    OR (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Insert: `project.edit_questions`, not the read permission the SELECT names.
CREATE POLICY "admin_insert_questions" ON public.questions FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Update: `project.edit_questions`. `merge_question_custom_data` (504-admin-rpcs.sql) is SECURITY INVOKER, and both admin job features call it with the initiating admin's own bearer token ($lib/supabase/job.ts), so an admin without this permission loses those features silently.
CREATE POLICY "admin_update_questions" ON public.questions
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Delete: `project.edit_questions`.
CREATE POLICY "admin_delete_questions" ON public.questions FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_questions')
  )
);

-- =====================================================================
-- nominations (project_id, confirmed)
-- =====================================================================
ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nominations_deny_all" ON public.nominations;

-- Anon: the project is open for voters, the nomination is confirmed, and every entity it links is anon-readable in full, terms of use included, so this policy and the entity policies give one answer.
CREATE POLICY "anon_select_nominations" ON public.nominations FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
    AND confirmed
    AND (
      SELECT
        private.nomination_entities_confirmed (id)
    )
  );

-- Authenticated read: three disjuncts.
-- - `project.read_entities` on the row's project.
-- - The public-visibility assembly, the same three conjuncts as `anon_select_nominations`, assembled inline for the planner-inlining reason given in the entity-table header. It is not an optimisation: without it a signed-in caller with no grant in the project would see no nominations in the voter app, a case no anon test covers.
-- - `nomination.read` on the row's own entity, with the four entity foreign keys coalesced and the row's generated `entity_type` naming the type, so one predicate serves every entity type. This is also the parent hop: an organization reading its child candidate's nomination is admitted by user_can's child-nominee branch (is_child_nominee), not by a lookup here.
--
-- Disjunct order is deliberate and changes cost, never the answer: project authority first so an admin exits on the first call, then the public assembly, token for token the `anon_select_nominations` qual, so a publicly visible row never pays the entity user_can call, then entity authority. 29-authenticated-disjunct-order.test.sql fails on any other order.
CREATE POLICY "authenticated_select_nominations" ON public.nominations FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_entities')
    )
    OR (
      (
        SELECT
          project_open_for_voters (project_id)
      )
      AND confirmed
      AND (
        SELECT
          private.nomination_entities_confirmed (id)
      )
    )
    OR (
      SELECT
        user_can (
          'entity',
          COALESCE(
            candidate_id,
            organization_id,
            faction_id,
            alliance_id
          ),
          'nomination.read',
          entity_type
        )
    )
  );

-- Admin insert: `project.edit_nominations` at project scope.
CREATE POLICY "admin_insert_nominations" ON public.nominations FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_nominations')
    )
  );

-- Entity insert of its own nomination: `nomination.edit` on the row's entity, nominations unlocked, created unconfirmed for an admin to confirm, and the row's entity and election both in the row's project, so a grantee cannot insert into another project's contest. `validate_nomination` checks the constituency's project.
--
-- `NOT confirmed` is backed by the INSERT column grant in 303-column-grants.sql, which omits the column so the default `false` applies. The two fail differently, the grant at privilege level and this policy on the row, and 23-nominations-write.test.sql asserts them separately.
CREATE POLICY "entity_insert_nominations" ON public.nominations FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can (
          'entity',
          COALESCE(
            candidate_id,
            organization_id,
            faction_id,
            alliance_id
          ),
          'nomination.edit',
          entity_type
        )
    )
    AND NOT (
      SELECT
        private.project_nominations_locked (project_id)
    )
    AND NOT confirmed
    AND (
      SELECT
        private.entity_project_id (
          entity_type,
          COALESCE(
            candidate_id,
            organization_id,
            faction_id,
            alliance_id
          )
        )
    ) = project_id
    AND (
      SELECT
        private.election_project_id (election_id)
    ) = project_id
  );

-- Entity insert of a parent organization nomination: a child nominee whose party has no nomination at their contest may create one, unconfirmed, for an admin to resolve. `nomination.create_parent` is a separate permission from `nomination.edit`, so the capability can be revoked and tested on its own instead of widening `nomination.edit` beyond the caller's own row.
--
-- This deliberately admits rows that are not the caller's own, so each guard is load-bearing: without any one of them an authenticated candidate could write rows into the public nomination table, and an over-permissive policy fails no read test. 23-nominations-write.test.sql asserts each guard.
-- - Guard 1: the row is an organization nomination; one non-null test suffices because the table's CHECK requires exactly one entity foreign key.
-- - Guard 2: it is created unconfirmed; the column grant is the second line of defence.
-- - Guard 3: no nomination exists for that organization at that election, constituency and round. The unique key includes the parent, so it does not see an organization already nominated under an alliance; the key only settles concurrent inserts.
-- - Guard 4: the project's nominations are not locked.
-- - Guard 5: the caller already holds a nomination at that contest whose entity grants `nomination.create_parent`.
-- - Cap: the caller may have originated at most 10 unconfirmed parent nominations, so a candidate cannot create placeholders for unrelated parties at will. `enforce_nomination_confirmation` raises the error that names the limit, because a policy refusal names only the policy.
-- - Project agreement: the row's entity belongs to the row's project. Its argument is the coalesced entity rather than `organization_id`, so it does not silently do guard 1's job and mask guard 1's removal. It is scoped to this policy rather than the table because 07-rpc-security.test.sql inserts such a row deliberately as a negative control.
--
-- Every lookup is a SECURITY DEFINER helper: three guards read `public.nominations` from a policy on `public.nominations`, and the inline form raises `infinite recursion detected in policy for relation "nominations"`.
CREATE POLICY "entity_insert_parent_nominations" ON public.nominations FOR INSERT TO authenticated
WITH
  CHECK (
    organization_id IS NOT NULL
    AND NOT confirmed
    AND NOT (
      SELECT
        private.nomination_exists_in_contest (
          'organization'::public.entity_type,
          organization_id,
          election_id,
          constituency_id,
          election_round
        )
    )
    AND NOT (
      SELECT
        private.project_nominations_locked (project_id)
    )
    AND (
      SELECT
        private.caller_nominated_in_contest (
          election_id,
          constituency_id,
          election_round,
          'nomination.create_parent'
        )
    )
    AND (
      SELECT
        private.caller_unconfirmed_originated_count ()
    ) < 10
    AND (
      SELECT
        private.entity_project_id (
          entity_type,
          COALESCE(
            organization_id,
            candidate_id,
            faction_id,
            alliance_id
          )
        )
    ) = project_id
  );

-- Admin update: `project.edit_nominations` at project scope.
CREATE POLICY "admin_update_nominations" ON public.nominations
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_nominations')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_nominations')
    )
  );

-- Entity update of its own nomination: `nomination.edit` on the row's entity, with the four entity foreign keys coalesced (the table's CHECK makes exactly one non-null) and the row's generated `entity_type` naming the type, and the project's nominations unlocked. 23-nominations-write.test.sql asserts each conjunct in both directions.
--
-- The lock is a conjunct rather than a permission because user_can answers whether a role may apply a permission, not whether the object's state admits it. It is read through a SECURITY DEFINER helper because an inline sub-select over public.projects raises `infinite recursion detected in policy for relation`.
--
-- WITH CHECK also requires the entity and the election to be in the row's project: `election_id` is in the UPDATE column grant, so a nomination could otherwise be moved into another project's election.
--
-- Confirmation is not checked here. An entity may edit a confirmed nomination, and the `enforce_nomination_confirmation` trigger stops it staying confirmed, because a policy can refuse a row but cannot rewrite it.
CREATE POLICY "entity_update_nominations" ON public.nominations
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can (
          'entity',
          COALESCE(
            candidate_id,
            organization_id,
            faction_id,
            alliance_id
          ),
          'nomination.edit',
          entity_type
        )
    )
    AND NOT (
      SELECT
        private.project_nominations_locked (project_id)
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can (
          'entity',
          COALESCE(
            candidate_id,
            organization_id,
            faction_id,
            alliance_id
          ),
          'nomination.edit',
          entity_type
        )
    )
    AND NOT (
      SELECT
        private.project_nominations_locked (project_id)
    )
    AND (
      SELECT
        private.entity_project_id (
          entity_type,
          COALESCE(
            candidate_id,
            organization_id,
            faction_id,
            alliance_id
          )
        )
    ) = project_id
    AND (
      SELECT
        private.election_project_id (election_id)
    ) = project_id
  );

-- Admin delete: `project.edit_nominations` at project scope.
CREATE POLICY "admin_delete_nominations" ON public.nominations FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_nominations')
  )
);

-- =====================================================================
-- app_settings (project_id, no per-row public flag -- anon needs read for voter app)
-- =====================================================================
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_deny_all" ON public.app_settings;

-- Anon: the project must be open for voters. A closed project returns no settings row at all, and the voter app renders its maintenance page for that state.
CREATE POLICY "anon_select_app_settings" ON public.app_settings FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Authenticated read: the same two-term disjunction as the content tables. 22-content-policies.test.sql (cell 5 of its read grid) asserts that a grantee of another project cannot read a closed project's row.
--
-- Too strict is an outage here, not an empty render: zero rows reach `_getAppSettings`'s null branch, which shows the voter maintenance page when the project is closed. The user_can term is what shows grant holders the preview instead (30-closed-project.test.sql), and the public term keeps a signed-in non-grantee of an open project reading it.
CREATE POLICY "authenticated_select_app_settings" ON public.app_settings FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_structure')
    )
    OR (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Insert: `project.edit_app_settings`. Project editors hold it too, so the `admin_` prefix of these three policy names is inaccurate; it is kept because every table's policies share it.
CREATE POLICY "admin_insert_app_settings" ON public.app_settings FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can (
          'project',
          project_id,
          'project.edit_app_settings'
        )
    )
  );

-- Update: `project.edit_app_settings`. Settings permissions split along whether a policy reads the value: `project.edit_project_settings` governs `projects` and is admin-only, while this permission governs `app_settings` and project editors hold it too.
--
-- The two permissions have the same holders except the project editor, so only an editor tells them apart; 22-content-policies.test.sql creates one for that reason.
CREATE POLICY "admin_update_app_settings" ON public.app_settings
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can (
          'project',
          project_id,
          'project.edit_app_settings'
        )
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can (
          'project',
          project_id,
          'project.edit_app_settings'
        )
    )
  );

-- Delete: `project.edit_app_settings`.
CREATE POLICY "admin_delete_app_settings" ON public.app_settings FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can (
        'project',
        project_id,
        'project.edit_app_settings'
      )
  )
);

-- =====================================================================
-- feedback (anon and authenticated insert; admin select and delete)
-- =====================================================================
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anonymous: insert only (rate limiting trigger handles spam prevention)
CREATE POLICY "anon_insert_feedback" ON public.feedback FOR INSERT TO anon
WITH
  CHECK (true);

-- Authenticated: insert only (candidate app also submits feedback; rate-limit trigger + CHECK constraint gate the insert regardless of role)
CREATE POLICY "authenticated_insert_feedback" ON public.feedback FOR INSERT TO authenticated
WITH
  CHECK (true);

-- Read: `feedback.read`, while the DELETE takes `feedback.manage`. Both have the same holders, so no behavioural test tells them apart and only the policy-to-permission map in 22-content-policies.test.sql sees the difference; do not collapse them onto one permission.
--
-- The second disjunct covers orphaned rows: `feedback.project_id` is ON DELETE SET NULL (107-feedback.sql), and a NULL project makes the first disjunct NULL, so without it a retained row would be readable by nobody. Orphaned rows are left to the global-scope (root) admin.
CREATE POLICY "admin_select_feedback" ON public.feedback FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'feedback.read')
    )
    OR (
      project_id IS NULL
      AND (
        SELECT
          user_can ('global', NULL::uuid, 'feedback.read')
      )
    )
  );

-- Delete: `feedback.manage`, kept apart from the read policy's `feedback.read`, with the same orphan clause.
CREATE POLICY "admin_delete_feedback" ON public.feedback FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'feedback.manage')
  )
  OR (
    project_id IS NULL
    AND (
      SELECT
        user_can ('global', NULL::uuid, 'feedback.manage')
    )
  )
);

-- No UPDATE policy: feedback is immutable after insert.
-- No anon SELECT policy: voters cannot read their own or others' feedback.
-- =====================================================================
-- admin_jobs (project_id, no per-row public flag -- admin-only)
-- =====================================================================
ALTER TABLE public.admin_jobs ENABLE ROW LEVEL SECURITY;

-- All three policies take `project.edit_questions`. No permission covers job records, and the jobs exist to edit questions through the question custom-data RPC, so whoever may write a question's custom data may record and read the job that wrote it.
--
-- Read and write are deliberately not split: the only read-shaped permission, `project.read_structure`, is held by entity grantees, and using it would expose the initiating admin's address in `author` and the LLM job's prompt and output in `input`, `output` and `messages` to every candidate in the project.
CREATE POLICY "admin_select_admin_jobs" ON public.admin_jobs FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Insert: `SupabaseAdminWriter.insertJobResult` reaches this policy with the initiating admin's own bearer token.
CREATE POLICY "admin_insert_admin_jobs" ON public.admin_jobs FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Delete: this table has no UPDATE policy, so deletion is the only way to alter a job record, and giving it the same holders as insert keeps the audit trail no easier to erase than to write.
CREATE POLICY "admin_delete_admin_jobs" ON public.admin_jobs FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_questions')
  )
);
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
-- - auth_user_id - links candidate to auth user, set during invite/registration
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
-- - auth_user_id - links organization to auth user
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
-- Storage RLS policies, cleanup triggers, and helper functions
--
-- Depends on:
-- - 000-enums.sql (grant_scope_type, grant_permission, storage_verb)
-- - 101-elections.sql (elections, constituency_groups, constituencies)
-- - 102-entities.sql (candidates, organizations, factions, alliances)
-- - 103-questions.sql (question_categories, questions)
-- - 104-nominations.sql (nominations)
-- - 301-auth-functions.sql (user_can, and the visibility helpers project_open_for_voters, entity_has_confirmed_nomination and nomination_entities_confirmed)
--
-- Provides:
-- - the pg_net extension, for async HTTP from triggers
-- - storage_config - the Storage API URL and service-role key the cleanup triggers use
-- - storage_path_can() - may this caller do this verb to this path; the storage layer's authority decision, delegated to user_can
-- - storage_path_is_public() - whether the object at a path is anon-readable; the tables' visibility rule, asked of a path
-- - delete_storage_object() - delete one whitelisted object via the Storage API (pg_net)
-- - referenced_storage_paths() - the object paths a row still references
-- - cleanup_entity_storage_files() - AFTER DELETE trigger for entity tables
-- - cleanup_old_image_file() - BEFORE UPDATE trigger for image columns
-- - cleanup_old_answer_files() - BEFORE UPDATE trigger for photos stored in answers
-- - RLS policies on storage.objects for the public-assets and private-assets buckets
--------------------------------------------------------------------------------
-- pg_net extension (async HTTP from triggers)
--------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_net
WITH
  SCHEMA extensions;

--------------------------------------------------------------------------------
-- storage_config: configuration table for storage cleanup triggers
--
-- One row per setting: `key` names it, `supabase_url` or `service_role_key`, and `value` holds it. The pg_net cleanup triggers read both to call the Storage API. seed.sql sets local dev defaults; in production, set the project's actual Supabase URL and service role key.
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.storage_config (key text PRIMARY KEY, value text NOT NULL);

-- Only service_role and postgres can access storage_config (not exposed via API)
ALTER TABLE public.storage_config ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.storage_config
FROM
  anon,
  authenticated,
  public;

GRANT
SELECT
  ON TABLE public.storage_config TO service_role;

--------------------------------------------------------------------------------
-- storage_path_can: may this caller do this verb to this path, at this scope?
--
-- The storage layer's whole authority decision, delegated to `user_can` (301-auth-functions.sql) with the path's scope and id, and at entity scope with the entity type the type segment names. Fourteen of the fifteen policies on storage.objects call it and carry no predicate of their own; the anon read routes through storage_path_is_public instead, for the reason stated there.
--
-- The mapping describes the storage layout. For each of the eleven values the type segment can take (the ten tables carrying `cleanup_entity_storage_files`, whose path prefix is TG_TABLE_NAME, plus `project` for the project-level path), it names the permission that table's own policies ask, and `user_can` answers it. The role x permission matrix lives only in `grant_role_permissions`. An unrecognised segment denies.
--
-- The verb is an argument the body branches on, so read and write are separate questions. 20-storage-authority.test.sql asserts two read-but-not-write cases: an entity grantee reads another entity's publicly visible asset but may not write it, and a holder of `project.read_structure` without `project.edit_structure` reads an election's asset but may not write it.
--
-- Every segment is caller-controlled text, because the caller chooses `storage.objects.name`. So the id arguments are `text` and are cast only inside this function, whose exception arm denies. A policy casting segment [3] to uuid would raise on the project-level path, whose segment [3] is not a uuid, and abort the caller's whole statement instead of hiding one row.
--
-- The row must exist in the table the type segment names, and its own project must be the project the path claims. Without the lookup, a path could claim one entity type while carrying another type's id, and a project-scope caller could write into a path that names their project but carries another project's entity id.
--
-- SECURITY DEFINER with an empty search_path, so the type/id lookup reads the table itself rather than the rows the caller's row-level security admits; the authority answer still comes from `user_can` and the caller's own claim. `%I` quotes a table name the CASE has already restricted to ten literals, so the dynamic name is not caller-controlled.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.storage_path_can (
  p_scope public.grant_scope_type,
  p_project text,
  p_type text,
  p_id text,
  p_verb public.storage_verb
) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_permission public.grant_permission;
  v_project_id uuid;
  v_entity_id uuid;
  v_row_project uuid;
  v_entity_type public.entity_type;
BEGIN
  IF p_scope IS NULL OR p_type IS NULL OR p_verb IS NULL THEN
    RETURN false;
  END IF;

  -- The mapping. Each arm's two permissions are the ones that segment's own table policies ask: the four entity tables ask entity.read_answers / entity.edit_answers at entity scope and project.read_entities / project.edit_entities at project scope; elections, constituencies and constituency_groups ask project.read_structure / project.edit_structure; questions and question_categories ask project.read_structure / project.edit_questions; nominations ask project.read_entities / project.edit_nominations; and the project-level path is app_settings' own pair, project.read_structure / project.edit_app_settings.
  IF p_scope = 'entity' THEN
    -- Only the four entity tables have an entity-scope answer. The other seven segments are reachable at project scope only, so here they fall through and deny.
    v_permission := CASE
      WHEN p_type IN ('candidates', 'organizations', 'factions', 'alliances') THEN
        (CASE p_verb WHEN 'read' THEN 'entity.read_answers' ELSE 'entity.edit_answers' END)
      ELSE NULL
    END::public.grant_permission;
    v_entity_type := CASE p_type
      WHEN 'candidates' THEN 'candidate'
      WHEN 'organizations' THEN 'organization'
      WHEN 'factions' THEN 'faction'
      WHEN 'alliances' THEN 'alliance'
    END::public.entity_type;
  ELSIF p_scope = 'project' THEN
    v_permission := CASE
      WHEN p_type IN ('candidates', 'organizations', 'factions', 'alliances') THEN
        (CASE p_verb WHEN 'read' THEN 'project.read_entities' ELSE 'project.edit_entities' END)
      WHEN p_type IN ('elections', 'constituencies', 'constituency_groups') THEN
        (CASE p_verb WHEN 'read' THEN 'project.read_structure' ELSE 'project.edit_structure' END)
      WHEN p_type IN ('questions', 'question_categories') THEN
        (CASE p_verb WHEN 'read' THEN 'project.read_structure' ELSE 'project.edit_questions' END)
      WHEN p_type = 'nominations' THEN
        (CASE p_verb WHEN 'read' THEN 'project.read_entities' ELSE 'project.edit_nominations' END)
      WHEN p_type = 'project' THEN
        (CASE p_verb WHEN 'read' THEN 'project.read_structure' ELSE 'project.edit_app_settings' END)
      ELSE NULL
    END::public.grant_permission;
  ELSE
    -- account and global are not scopes a path names. A grant held at either still counts, because user_can asked at project or entity scope reaches down from the scopes above.
    RETURN false;
  END IF;

  -- The fall-through: an unrecognised type segment denies.
  IF v_permission IS NULL THEN
    RETURN false;
  END IF;

  v_project_id := p_project::uuid;

  -- The project-level path names no row, so there is nothing to pair it against.
  IF p_scope = 'project' AND p_type = 'project' THEN
    RETURN public.user_can('project', v_project_id, v_permission);
  END IF;

  v_entity_id := p_id::uuid;

  EXECUTE format('SELECT project_id FROM public.%I WHERE id = $1', p_type)
  INTO v_row_project
  USING v_entity_id;

  -- No row in the table the segment names: the type/id pairing refusal.
  IF v_row_project IS NULL THEN
    RETURN false;
  END IF;

  -- The row exists but lives in another project: the path-forgery refusal.
  IF v_row_project <> v_project_id THEN
    RETURN false;
  END IF;

  IF p_scope = 'entity' THEN
    RETURN public.user_can('entity', v_entity_id, v_permission, v_entity_type);
  END IF;

  RETURN public.user_can('project', v_project_id, v_permission);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

--------------------------------------------------------------------------------
-- storage_path_is_public: is the object at this path readable by the anonymous caller?
--
-- The public visibility rule, asked of a path instead of a row. Each branch restates, over path segments, the anon SELECT policy of the table its segment names, composed from 301-auth-functions.sql's helpers `project_open_for_voters`, `entity_has_confirmed_nomination` and `nomination_entities_confirmed`. It adds no rule of its own, so storage gives the same answer as the tables.
--
-- Not `user_can`: it denies a caller whose JWT carries no `grants` key, which is every anon caller, so an anon policy built on it would deny everything and the public application would render blank. The anon policy therefore asks about visibility, and the other fourteen ask about authority.
--
-- The project-level path is anon-readable only while the project is open for voters, like every other path. 20-storage-authority.test.sql asserts both directions.
--
-- The candidate branch carries the terms-of-use guards because `anon_select_candidates` does, and only `candidates` has the column. Without them a candidate's photo would be anon-fetchable while the candidate row stayed hidden.
--
-- An anon list request pays for this function on every object it reads. That cost is accepted because `public-assets` is a public bucket: Storage serves its downloads (`/object/public/...`, which the voter app uses, and `/object/authenticated/...`) without evaluating `storage.objects` RLS, only an anon `list` consults it, and no application code lists `public-assets` as anon. If the bucket is made private, every download becomes a policy evaluation, and the cost must be measured before that change ships.
--
-- The same hardening, and the same deny on a missing row or a raised error, as storage_path_can.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.storage_path_is_public (p_project text, p_type text, p_id text) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_project_id uuid;
  v_entity_id uuid;
  v_row_visible boolean;
BEGIN
  IF p_type IS NULL THEN
    RETURN false;
  END IF;

  v_project_id := p_project::uuid;

  -- The conjunct every branch carries, and the only one the project-level path has.
  IF NOT public.project_open_for_voters(v_project_id) THEN
    RETURN false;
  END IF;

  IF p_type = 'project' THEN
    RETURN true;
  END IF;

  v_entity_id := p_id::uuid;

  -- The five project-structure tables: their anon policies carry the project conjunct and nothing else, so the row need only exist in this project.
  IF p_type IN ('elections', 'constituencies', 'constituency_groups', 'questions', 'question_categories') THEN
    EXECUTE format('SELECT true FROM public.%I WHERE id = $1 AND project_id = $2', p_type)
    INTO v_row_visible
    USING v_entity_id, v_project_id;
    RETURN COALESCE(v_row_visible, false);
  END IF;

  -- nominations: anon_select_nominations' own three conjuncts.
  IF p_type = 'nominations' THEN
    SELECT n.confirmed AND private.nomination_entities_confirmed(n.id)
    INTO v_row_visible
    FROM public.nominations n
    WHERE n.id = v_entity_id AND n.project_id = v_project_id;
    RETURN COALESCE(v_row_visible, false);
  END IF;

  -- The four entity tables: the entity's own confirmation flag, the terms-of-use guards where the table has them, and a confirming nomination in this project.
  IF p_type IN ('candidates', 'organizations', 'factions', 'alliances') THEN
    EXECUTE format(
      'SELECT e.confirmed %s FROM public.%I e WHERE e.id = $1 AND e.project_id = $2',
      CASE WHEN p_type = 'candidates'
        THEN 'AND e.terms_of_use_accepted IS NOT NULL AND e.terms_of_use_accepted < now()'
        ELSE '' END,
      p_type
    )
    INTO v_row_visible
    USING v_entity_id, v_project_id;

    IF NOT COALESCE(v_row_visible, false) THEN
      RETURN false;
    END IF;

    RETURN private.entity_has_confirmed_nomination(
      (CASE p_type
        WHEN 'candidates' THEN 'candidate'
        WHEN 'organizations' THEN 'organization'
        WHEN 'factions' THEN 'faction'
        ELSE 'alliance'
      END)::public.entity_type,
      v_entity_id,
      v_project_id
    );
  END IF;

  RETURN false;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- =====================================================================
-- Storage RLS policies on storage.objects
--
-- Path format: {project_id}/{entity_type}/{entity_id}/filename.ext
-- - (storage.foldername(storage.objects.name))[1] = project_id
-- - (storage.foldername(storage.objects.name))[2] = entity_type
-- - (storage.foldername(storage.objects.name))[3] = entity_id
--
-- IMPORTANT: Always use storage.objects.name (not bare 'name') to avoid ambiguity with entity tables that have a jsonb 'name' column.
--
-- Every policy below is a bucket comparison plus helper calls and nothing else: none re-derives a rule `user_can` answers, names an entity type, compares an identity column or reads a publication flag.
--
-- Two questions, two functions. `storage_path_can` answers authority (may this caller do this verb to this path) and delegates to `user_can`; `storage_path_is_public` answers visibility (is this path's object public at all). The fourteen authenticated policies ask the first and the anon policy asks the second, because `user_can` denies every anon caller. The authenticated read of the public bucket also asks the second, since either answer admits that read.
--
-- Each write verb has an entity-scope and a project-scope policy per bucket, and PostgreSQL ORs them. The scope literal is the only difference within a pair: with the bucket literal replaced, a verb's expressions reduce to one string per scope, which 20-storage-authority.test.sql asserts from `pg_policies`.
--
-- The `(SELECT fn (...))` wrapping is this codebase's convention for helper calls in policies, as on the content-table policies.
-- =====================================================================
-- =====================================================================
-- public-assets bucket: SELECT policies
-- =====================================================================
-- Anon: the public visibility rule, asked of a path.
--
-- Not `user_can`: an anon session carries no `grants` claim, so an authority-based allow decision here would deny everything (see storage_path_is_public).
CREATE POLICY "anon_select_public_assets" ON storage.objects FOR
SELECT
  TO anon USING (
    bucket_id = 'public-assets'
    AND (
      SELECT
        storage_path_is_public (
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3]
        )
    )
  );

-- Authenticated: anything the anon reader can see, plus anything this caller has the authority to read at either scope. Three disjuncts, three helper calls, no predicate of its own.
CREATE POLICY "authenticated_select_public_assets" ON storage.objects FOR
SELECT
  TO authenticated USING (
    bucket_id = 'public-assets'
    AND (
      (
        SELECT
          storage_path_is_public (
            (storage.foldername (storage.objects.name)) [1],
            (storage.foldername (storage.objects.name)) [2],
            (storage.foldername (storage.objects.name)) [3]
          )
      )
      OR (
        SELECT
          storage_path_can (
            'entity',
            (storage.foldername (storage.objects.name)) [1],
            (storage.foldername (storage.objects.name)) [2],
            (storage.foldername (storage.objects.name)) [3],
            'read'
          )
      )
      OR (
        SELECT
          storage_path_can (
            'project',
            (storage.foldername (storage.objects.name)) [1],
            (storage.foldername (storage.objects.name)) [2],
            (storage.foldername (storage.objects.name)) [3],
            'read'
          )
      )
    )
  );

-- =====================================================================
-- private-assets bucket: SELECT policies
-- =====================================================================
-- Authenticated: authority only. Nothing in the private bucket is public, so there is no visibility disjunct: a path whose object would be anon-visible in the public bucket confers nothing here. There is no anon policy on this bucket.
CREATE POLICY "authenticated_select_private_assets" ON storage.objects FOR
SELECT
  TO authenticated USING (
    bucket_id = 'private-assets'
    AND (
      (
        SELECT
          storage_path_can (
            'entity',
            (storage.foldername (storage.objects.name)) [1],
            (storage.foldername (storage.objects.name)) [2],
            (storage.foldername (storage.objects.name)) [3],
            'read'
          )
      )
      OR (
        SELECT
          storage_path_can (
            'project',
            (storage.foldername (storage.objects.name)) [1],
            (storage.foldername (storage.objects.name)) [2],
            (storage.foldername (storage.objects.name)) [3],
            'read'
          )
      )
    )
  );

-- =====================================================================
-- The twelve write policies: three verbs x two scopes x two buckets
--
-- Each name leads with the scope its helper call asks at (`entity_` or `project_`), not with an entity type or an actor: the entity type is an argument of the helper, and the project-scope write permissions are held by project editors as well as admins.
-- =====================================================================
CREATE POLICY "entity_insert_public_assets" ON storage.objects FOR INSERT TO authenticated
WITH
  CHECK (
    bucket_id = 'public-assets'
    AND (
      SELECT
        storage_path_can (
          'entity',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  );

CREATE POLICY "project_insert_public_assets" ON storage.objects FOR INSERT TO authenticated
WITH
  CHECK (
    bucket_id = 'public-assets'
    AND (
      SELECT
        storage_path_can (
          'project',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  );

CREATE POLICY "entity_insert_private_assets" ON storage.objects FOR INSERT TO authenticated
WITH
  CHECK (
    bucket_id = 'private-assets'
    AND (
      SELECT
        storage_path_can (
          'entity',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  );

CREATE POLICY "project_insert_private_assets" ON storage.objects FOR INSERT TO authenticated
WITH
  CHECK (
    bucket_id = 'private-assets'
    AND (
      SELECT
        storage_path_can (
          'project',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  );

CREATE POLICY "entity_update_public_assets" ON storage.objects
FOR UPDATE
  TO authenticated USING (
    bucket_id = 'public-assets'
    AND (
      SELECT
        storage_path_can (
          'entity',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  )
WITH
  CHECK (
    bucket_id = 'public-assets'
    AND (
      SELECT
        storage_path_can (
          'entity',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  );

CREATE POLICY "project_update_public_assets" ON storage.objects
FOR UPDATE
  TO authenticated USING (
    bucket_id = 'public-assets'
    AND (
      SELECT
        storage_path_can (
          'project',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  )
WITH
  CHECK (
    bucket_id = 'public-assets'
    AND (
      SELECT
        storage_path_can (
          'project',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  );

CREATE POLICY "entity_update_private_assets" ON storage.objects
FOR UPDATE
  TO authenticated USING (
    bucket_id = 'private-assets'
    AND (
      SELECT
        storage_path_can (
          'entity',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  )
WITH
  CHECK (
    bucket_id = 'private-assets'
    AND (
      SELECT
        storage_path_can (
          'entity',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  );

CREATE POLICY "project_update_private_assets" ON storage.objects
FOR UPDATE
  TO authenticated USING (
    bucket_id = 'private-assets'
    AND (
      SELECT
        storage_path_can (
          'project',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  )
WITH
  CHECK (
    bucket_id = 'private-assets'
    AND (
      SELECT
        storage_path_can (
          'project',
          (storage.foldername (storage.objects.name)) [1],
          (storage.foldername (storage.objects.name)) [2],
          (storage.foldername (storage.objects.name)) [3],
          'write'
        )
    )
  );

CREATE POLICY "entity_delete_public_assets" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'public-assets'
  AND (
    SELECT
      storage_path_can (
        'entity',
        (storage.foldername (storage.objects.name)) [1],
        (storage.foldername (storage.objects.name)) [2],
        (storage.foldername (storage.objects.name)) [3],
        'write'
      )
  )
);

CREATE POLICY "project_delete_public_assets" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'public-assets'
  AND (
    SELECT
      storage_path_can (
        'project',
        (storage.foldername (storage.objects.name)) [1],
        (storage.foldername (storage.objects.name)) [2],
        (storage.foldername (storage.objects.name)) [3],
        'write'
      )
  )
);

CREATE POLICY "entity_delete_private_assets" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'private-assets'
  AND (
    SELECT
      storage_path_can (
        'entity',
        (storage.foldername (storage.objects.name)) [1],
        (storage.foldername (storage.objects.name)) [2],
        (storage.foldername (storage.objects.name)) [3],
        'write'
      )
  )
);

CREATE POLICY "project_delete_private_assets" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'private-assets'
  AND (
    SELECT
      storage_path_can (
        'project',
        (storage.foldername (storage.objects.name)) [1],
        (storage.foldername (storage.objects.name)) [2],
        (storage.foldername (storage.objects.name)) [3],
        'write'
      )
  )
);

-- =====================================================================
-- Storage file deletion helper (via pg_net async HTTP)
-- =====================================================================
--------------------------------------------------------------------------------
-- delete_storage_object: delete one object via the Storage API
--
-- One object per call, through the single-object route: `DELETE <storage_config.supabase_url>/storage/v1/object/<bucket>/<path>`, sent by pg_net with only `Authorization: Bearer <service_role_key>`. The bulk route accepts only a DELETE with a JSON body, which pg_net's `http_delete` cannot send. Storage never expands a folder prefix, so a caller that means a folder enumerates its objects and calls this once per object.
--
-- The path is untrusted and goes into a URL sent with the service-role key: a stored image path is written by the entity's own editor, and pg_net (libcurl) resolves `..` segments before sending and keeps a query string, so an unchecked path could reach any Storage route, or with enough `..` any Kong route, as a service-role request. So before any URL is built, the bucket must be `public-assets` or `private-assets` and the path must match the upload convention exactly: `<uuid>/<table>/<uuid>/<uuid>.<ext>`, every uuid canonical lowercase, `<table>` one of the ten tables that carry the cleanup triggers, and `<ext>` one of `jpg jpeg png webp gif avif` (the `ALLOWED_IMAGE_EXTENSIONS` set in `supabaseDataWriter.ts`). Anything else, including a folder prefix, a dev-seed name that is not a uuid, an uppercase uuid or a trailing slash, raises a WARNING and sends nothing. A legitimate object under another name is therefore never deleted: that leak is recoverable, where a forged delete is not.
--
-- Not callable by any API role. EXECUTE is revoked from PUBLIC, anon and authenticated below; otherwise the default privileges would publish it as `/rest/v1/rpc/delete_storage_object` and let any caller delete any object with the service-role key. Only the SECURITY DEFINER cleanup triggers call it, and they run as the owner.
--
-- Object names are random UUIDs (`supabaseDataWriter.#uploadCandidateFile`), and cleanup deletes the object a row stops referencing. A file that was public stays reachable by its URL after its entity is unpublished, because unpublishing cannot recall copies already taken; that is accepted.
--
-- The triggers act on row changes as they happen. No sweep removes objects orphaned without a triggering change.
--
-- Degrades to a WARNING and no request when `storage_config` lacks `supabase_url` or `service_role_key`, and when pg_net raises.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_storage_object (p_bucket text, p_file_path text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  base_url text;
  service_key text;
BEGIN
  -- The whitelist runs before anything reads the config or builds a URL.
  IF p_bucket IS NULL
    OR p_bucket NOT IN ('public-assets', 'private-assets')
    OR p_file_path IS NULL
    OR p_file_path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(alliances|candidates|constituencies|constituency_groups|elections|factions|nominations|organizations|question_categories|questions)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|gif|avif)$'
  THEN
    RAISE WARNING 'Storage cleanup refused a path outside the upload convention: bucket %, path %', p_bucket, p_file_path;
    RETURN;
  END IF;

  SELECT value INTO base_url FROM public.storage_config WHERE key = 'supabase_url';
  SELECT value INTO service_key FROM public.storage_config WHERE key = 'service_role_key';

  IF base_url IS NULL OR service_key IS NULL THEN
    RAISE WARNING 'Storage cleanup skipped: missing supabase_url or service_role_key in storage_config';
    RETURN;
  END IF;

  PERFORM net.http_delete(
    url := base_url || '/storage/v1/object/' || p_bucket || '/' || p_file_path,
    headers := jsonb_build_object('Authorization', 'Bearer ' || service_key)
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Storage cleanup failed for %/%: %', p_bucket, p_file_path, SQLERRM;
END;
$$;

--------------------------------------------------------------------------------
-- referenced_storage_paths: every object path a row still references
--
-- The distinct non-empty strings among the row's `image.path` and `image.pathDark` and, for every entry of its `answers` object whose `value` is an object, that value's `path` and `pathDark`; an empty array when there are none. The cleanup triggers never delete a path this returns for the NEW row, which is what keeps a swap of `path` and `pathDark`, an `alt`-only edit or a photo moved into an answer from destroying a file still in use.
--
-- It reads the row as jsonb so one helper serves every table: the image trigger is attached to ten tables and only `candidates` and `organizations` carry an `answers` column, and a missing key reads as no reference.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.referenced_storage_paths (p_row jsonb) RETURNS text[] LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT coalesce(array_agg(DISTINCT refs.p) FILTER (WHERE refs.p IS NOT NULL AND refs.p <> ''), ARRAY[]::text[])
  FROM (
    SELECT p_row -> 'image' ->> 'path' AS p
    UNION ALL
    SELECT p_row -> 'image' ->> 'pathDark'
    UNION ALL
    SELECT a.value -> 'value' ->> k.key
    FROM jsonb_each(CASE WHEN jsonb_typeof(p_row -> 'answers') = 'object' THEN p_row -> 'answers' ELSE '{}'::jsonb END) AS a
    CROSS JOIN (VALUES ('path'), ('pathDark')) AS k (key)
    WHERE jsonb_typeof(a.value -> 'value') = 'object'
  ) AS refs (p);
$$;

-- Only the SECURITY DEFINER cleanup triggers call these two; the owner keeps EXECUTE.
REVOKE
EXECUTE ON FUNCTION public.delete_storage_object (text, text)
FROM
  PUBLIC,
  anon,
  authenticated;

REVOKE
EXECUTE ON FUNCTION public.referenced_storage_paths (jsonb)
FROM
  PUBLIC,
  anon,
  authenticated;

-- =====================================================================
-- Entity deletion cleanup trigger
-- =====================================================================
--------------------------------------------------------------------------------
-- cleanup_entity_storage_files: AFTER DELETE trigger
--
-- When an entity row is deleted, deletes every object in its own folder `<OLD.project_id>/<TG_TABLE_NAME>/<OLD.id>/` in both `public-assets` and `private-assets`, one single-object DELETE per object via `delete_storage_object` (pg_net, sent only after the deleting transaction commits).
--
-- The folder is enumerated because Storage deletes exact object names only and never expands a prefix: the trigger reads the folder's object names from `storage.objects` and calls `delete_storage_object` once per name.
--
-- `starts_with`, not LIKE. `_` is a LIKE wildcard and two of the ten tables carry it (`constituency_groups`, `question_categories`), so `name LIKE prefix || '%'` would also match a lookalike folder such as `<project>/constituencyXgroups/<id>/`. `starts_with` compares the prefix literally.
--
-- Every name still passes the whitelist. Each enumerated name goes through `delete_storage_object`'s bucket and upload-convention check, so a stray name in the folder (a `notes.txt`, a dev-seed name that is not a uuid) is left in place with a WARNING: a leak, never a destroy. The enumeration never leaves the deleted row's own folder, and no second URL-building path exists.
--
-- One `storage.objects` scan per deleted row, so a bulk delete of many entities scans once per row.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_entity_storage_files () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  path_prefix text;
  bucket text;
  object_name text;
BEGIN
  -- The row's own folder: {project_id}/{TG_TABLE_NAME}/{id}/, the table name being the entity-type path segment.
  path_prefix := OLD.project_id::text || '/' || TG_TABLE_NAME || '/' || OLD.id::text || '/';

  FOREACH bucket IN ARRAY ARRAY['public-assets', 'private-assets']
  LOOP
    FOR object_name IN
      SELECT o.name
      FROM storage.objects AS o
      WHERE o.bucket_id = bucket
        AND starts_with(o.name, path_prefix)
    LOOP
      PERFORM public.delete_storage_object(bucket, object_name);
    END LOOP;
  END LOOP;

  RETURN OLD;
END;
$$;

-- Attach entity deletion cleanup trigger to all entity tables with project_id
CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.elections FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.constituencies FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.constituency_groups FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.question_categories FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

CREATE TRIGGER cleanup_storage_on_delete
AFTER DELETE ON public.questions FOR EACH ROW
EXECUTE FUNCTION public.cleanup_entity_storage_files ();

-- =====================================================================
-- Image column update cleanup trigger
-- =====================================================================
--------------------------------------------------------------------------------
-- cleanup_old_image_file: BEFORE UPDATE trigger
--
-- When an entity's `image` changes, deletes the old `path` and `pathDark` objects the NEW row does not use. It acts only when the image column changed.
--
-- Own folder only. An old path is deleted only when it starts with the row's own folder `<OLD.project_id>/<TG_TABLE_NAME>/<OLD.id>/`. A stored path is written by the entity's editor, so without this a candidate could point its image at another candidate's, another table's or another project's public photo and then replace it, and the trigger would delete the victim's file with the service-role key. `delete_storage_object` then checks the exact upload convention on top.
--
-- Never a path the NEW row still references. The NEW row's references come from `referenced_storage_paths (to_jsonb (NEW))`: its `image.path`, `image.pathDark` and every answer value's `path` and `pathDark`. So swapping `path` and `pathDark`, changing only `alt`, or moving the photo into an answer deletes nothing. It reads `to_jsonb (NEW)` rather than `NEW.answers` because this trigger is attached to ten tables and only two of them carry `answers`.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_old_image_file () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  own_folder text;
  still_referenced text[];
  old_path text;
BEGIN
  -- Only act if the image column actually changed
  IF OLD.image IS NOT DISTINCT FROM NEW.image THEN
    RETURN NEW;
  END IF;

  IF OLD.image IS NULL OR jsonb_typeof(OLD.image) <> 'object' THEN
    RETURN NEW;
  END IF;

  own_folder := OLD.project_id::text || '/' || TG_TABLE_NAME || '/' || OLD.id::text || '/';
  still_referenced := public.referenced_storage_paths(to_jsonb(NEW));

  FOR old_path IN
    SELECT DISTINCT candidate_path
    FROM unnest(ARRAY[OLD.image ->> 'path', OLD.image ->> 'pathDark']) AS old_paths (candidate_path)
    WHERE candidate_path IS NOT NULL AND candidate_path <> ''
  LOOP
    IF starts_with(old_path, own_folder) AND NOT (old_path = ANY (still_referenced)) THEN
      PERFORM public.delete_storage_object('public-assets', old_path);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Attach image cleanup trigger to all entity tables with an image column
CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.elections FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.constituencies FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.constituency_groups FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.question_categories FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

CREATE TRIGGER cleanup_image_on_update
BEFORE UPDATE ON public.questions FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_image_file ();

-- =====================================================================
-- Answer photo cleanup trigger
-- =====================================================================
--------------------------------------------------------------------------------
-- cleanup_old_answer_files: BEFORE UPDATE trigger on candidates and organizations
--
-- When a row's `answers` change, deletes every old answer photo the NEW row does not reference: each `value.path` and `value.pathDark` of an OLD answer whose `value` is an object. That covers a replaced photo, a removed answer key and the key `cascade_question_delete_to_jsonb_answers` strips when a question is deleted.
--
-- Detected by value shape, never by a `questions` join. An answer holds a photo when its `value` is a JSON object (the StoredImage shape `validate_image` accepts); no other answer type stores an object there. Asking `questions.type = 'image'` instead would miss the cascade case: the strip is an UPDATE run by an AFTER DELETE trigger on `questions`, so the question row is already gone when this trigger sees the change.
--
-- The same two limits as `cleanup_old_image_file`. An old path is deleted only when it starts with the row's own folder `<OLD.project_id>/<TG_TABLE_NAME>/<OLD.id>/`, so an answer pointed at another entity's or project's photo can never get it deleted, and only when `referenced_storage_paths (to_jsonb (NEW))` does not return it, so a photo moved into `image` or into another answer stays. `delete_storage_object` then checks the bucket and the exact upload convention on top.
--
-- BEFORE UPDATE is safe because no BEFORE UPDATE trigger on either table assigns `NEW.answers` or `NEW.image` (`enforce_entity_immutability`, `enforce_external_id_immutability`, `update_updated_at`, `validate_answers_jsonb` and `cleanup_old_image_file` only read or raise), so the NEW row seen here is the row that is written; if the statement later fails, its enqueued request is rolled back with it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_old_answer_files () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  own_folder text;
  still_referenced text[];
  old_path text;
BEGIN
  -- Only act if the answers column actually changed
  IF OLD.answers IS NOT DISTINCT FROM NEW.answers THEN
    RETURN NEW;
  END IF;

  own_folder := OLD.project_id::text || '/' || TG_TABLE_NAME || '/' || OLD.id::text || '/';
  still_referenced := public.referenced_storage_paths(to_jsonb(NEW));

  FOR old_path IN
    SELECT unnest(public.referenced_storage_paths(jsonb_build_object('answers', OLD.answers)))
  LOOP
    IF starts_with(old_path, own_folder) AND NOT (old_path = ANY (still_referenced)) THEN
      PERFORM public.delete_storage_object('public-assets', old_path);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Attach answer photo cleanup trigger to the two tables that carry answers
CREATE TRIGGER cleanup_answer_files_on_update
BEFORE UPDATE ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_answer_files ();

CREATE TRIGGER cleanup_answer_files_on_update
BEFORE UPDATE ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_answer_files ();

-- Note: the cleanup triggers need supabase_url and service_role_key in storage_config. seed.sql sets the local dev values; in production, set the actual values.
-- External ID uniqueness and immutability
--
-- The nullable external_id column is declared in the CREATE TABLE body of each content table that carries one. This file enforces it: a unique index on (project_id, external_id) per table, so uniqueness is scoped per project, and a trigger that refuses to change external_id once it is set.
--
-- bulk_import matches existing rows by external_id when it upserts.
--
-- Depends on:
-- - 101-elections.sql (elections, constituency_groups, constituencies)
-- - 102-entities.sql (candidates, organizations, factions, alliances)
-- - 103-questions.sql (questions, question_categories)
-- - 104-nominations.sql (nominations)
-- - 106-app-settings.sql (app_settings)
--------------------------------------------------------------------------------
-- Composite unique indexes on (project_id, external_id)
--------------------------------------------------------------------------------
CREATE UNIQUE INDEX idx_elections_external_id ON public.elections (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_constituency_groups_external_id ON public.constituency_groups (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_constituencies_external_id ON public.constituencies (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_candidates_external_id ON public.candidates (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_organizations_external_id ON public.organizations (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_factions_external_id ON public.factions (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_alliances_external_id ON public.alliances (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_nominations_external_id ON public.nominations (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_questions_external_id ON public.questions (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_question_categories_external_id ON public.question_categories (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_app_settings_external_id ON public.app_settings (project_id, external_id)
WHERE
  external_id IS NOT NULL;

--------------------------------------------------------------------------------
-- Immutability trigger: prevent changing external_id once set
--
-- - NULL -> value: allowed (first assignment)
-- - value -> same value: allowed (no-op)
-- - value -> different value: blocked (raises an exception)
-- - value -> NULL: blocked (raises an exception)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_external_id_immutability () RETURNS TRIGGER AS $$
BEGIN
  IF OLD.external_id IS NOT NULL AND OLD.external_id IS DISTINCT FROM NEW.external_id THEN
    RAISE EXCEPTION 'external_id cannot be changed once set (current: %, attempted: %)',
      OLD.external_id, NEW.external_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.elections FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.constituency_groups FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.constituencies FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.questions FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.question_categories FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.app_settings FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();
-- Bulk import and delete RPC functions
--
-- Provides transactional bulk data management operations:
-- - bulk_import(data jsonb) - upsert records by external_id with relationship resolution
-- - bulk_delete(data jsonb) - delete records by prefix, UUID list, or external_id list
--
-- Both functions are SECURITY INVOKER, so the admin RLS policies apply.
-- PostgREST runs each RPC call in a transaction, so a call writes every record or none.
--
-- Depends on:
-- - 500-external-id.sql (the (project_id, external_id) unique indexes)
-- - 302-rls.sql (admin RLS policies via user_can)
--------------------------------------------------------------------------------
-- resolve_external_ref: resolve an external_id reference to a UUID
--
-- Input formats:
--   {"external_id": "some-id"} -> looks up UUID in target table
--   "uuid-string"              -> casts and returns directly
--   null                       -> returns null
--
-- Raises exception if external_id not found in target table.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_external_ref (
  p_ref jsonb,
  p_target_table text,
  p_project_id uuid
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  resolved_id uuid;
  ext_id text;
BEGIN
  IF p_ref IS NULL OR p_ref = 'null'::jsonb THEN
    RETURN NULL;
  END IF;

  -- If ref is a JSON object with external_id key, resolve it
  IF jsonb_typeof(p_ref) = 'object' AND p_ref ? 'external_id' THEN
    ext_id := p_ref ->> 'external_id';
    IF ext_id IS NULL THEN
      RETURN NULL;
    END IF;

    EXECUTE format(
      'SELECT id FROM public.%I WHERE project_id = $1 AND external_id = $2',
      p_target_table
    ) INTO resolved_id USING p_project_id, ext_id;

    IF resolved_id IS NULL THEN
      RAISE EXCEPTION 'External reference not found: external_id "%" in table "%"',
        ext_id, p_target_table;
    END IF;

    RETURN resolved_id;
  END IF;

  -- If ref is a string, treat as direct UUID
  IF jsonb_typeof(p_ref) = 'string' THEN
    RETURN (p_ref #>> '{}')::uuid;
  END IF;

  RAISE EXCEPTION 'Invalid reference format: expected object with external_id or UUID string, got %',
    jsonb_typeof(p_ref);
END;
$$;

--------------------------------------------------------------------------------
-- _bulk_upsert_record: internal helper for upserting a single record
--
-- Builds dynamic SQL to INSERT ON CONFLICT (project_id, external_id) DO UPDATE.
-- Handles relationship field resolution using resolve_external_ref().
-- Returns true if the row was inserted (created), false if updated.
--
-- Relationship mapping defines which JSON keys map to FK columns and which target tables they reference.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._bulk_upsert_record (
  p_table_name text,
  p_item jsonb,
  p_project_id uuid
) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE
  -- Relationship mappings: json_key -> (fk_column, target_table)
  rel_fk_col text;
  rel_target text;
  relationships jsonb;

  -- Column building
  col_names text[] := ARRAY['project_id'];
  col_values text[] := ARRAY[quote_literal(p_project_id)];
  update_parts text[] := ARRAY[]::text[];
  item_key text;
  item_value jsonb;
  resolved_uuid uuid;
  ext_id text;

  -- Result tracking
  sql_text text;
  was_inserted boolean;

  -- Columns to skip (managed by DB, not by import)
  skip_columns text[] := ARRAY[
    'id', 'created_at', 'updated_at', 'project_id', 'entity_type'
  ];
BEGIN
  -- Define relationship mappings per table
  relationships := '{}'::jsonb;
  CASE p_table_name
    -- `candidates` has no arm: a candidate's organization is stated by its nomination, not by a column. An empty arm would behave the same as the missing one (the ELSE supplies '{}'). `RELATIONSHIP_REFS` in packages/dev-seed/src/template/permittedKeys.ts transcribes this block, and a parity test in that package reads this SQL from disk, so the two must change together.
    WHEN 'factions' THEN
      relationships := '{"organization": {"fk": "organization_id", "table": "organizations"}}'::jsonb;
    WHEN 'nominations' THEN
      relationships := '{
        "candidate": {"fk": "candidate_id", "table": "candidates"},
        "organization": {"fk": "organization_id", "table": "organizations"},
        "faction": {"fk": "faction_id", "table": "factions"},
        "alliance": {"fk": "alliance_id", "table": "alliances"},
        "election": {"fk": "election_id", "table": "elections"},
        "constituency": {"fk": "constituency_id", "table": "constituencies"},
        "parent_nomination": {"fk": "parent_nomination_id", "table": "nominations"}
      }'::jsonb;
    WHEN 'questions' THEN
      relationships := '{
        "category": {"fk": "category_id", "table": "question_categories"}
      }'::jsonb;
    WHEN 'constituencies' THEN
      relationships := '{"parent": {"fk": "parent_id", "table": "constituencies"}}'::jsonb;
    ELSE
      relationships := '{}'::jsonb;
  END CASE;

  -- Extract external_id (required for import)
  ext_id := p_item ->> 'external_id';
  IF ext_id IS NULL THEN
    RAISE EXCEPTION 'external_id is required for bulk import (table: %)', p_table_name;
  END IF;

  -- Build column-value pairs from the item JSON
  FOR item_key, item_value IN SELECT * FROM jsonb_each(p_item)
  LOOP
    -- Skip project_id (already added) and managed columns
    IF item_key = ANY(skip_columns) THEN
      CONTINUE;
    END IF;

    -- Check if this key is a relationship reference
    IF relationships ? item_key THEN
      rel_fk_col := relationships -> item_key ->> 'fk';
      rel_target := relationships -> item_key ->> 'table';

      -- Resolve the external reference to a UUID
      resolved_uuid := public.resolve_external_ref(item_value, rel_target, p_project_id);

      col_names := array_append(col_names, rel_fk_col);
      IF resolved_uuid IS NULL THEN
        col_values := array_append(col_values, 'NULL');
      ELSE
        col_values := array_append(col_values, quote_literal(resolved_uuid));
      END IF;
      update_parts := array_append(update_parts,
        rel_fk_col || ' = ' || COALESCE(quote_literal(resolved_uuid), 'NULL'));
    ELSE
      -- Regular column: pass as JSONB value
      col_names := array_append(col_names, item_key);

      -- Convert JSONB value to appropriate SQL literal
      IF item_value IS NULL OR item_value = 'null'::jsonb THEN
        col_values := array_append(col_values, 'NULL');
        update_parts := array_append(update_parts, item_key || ' = NULL');
      ELSIF jsonb_typeof(item_value) = 'string' THEN
        col_values := array_append(col_values, quote_literal(item_value #>> '{}'));
        update_parts := array_append(update_parts,
          item_key || ' = ' || quote_literal(item_value #>> '{}'));
      ELSIF jsonb_typeof(item_value) IN ('object', 'array') THEN
        col_values := array_append(col_values, quote_literal(item_value::text) || '::jsonb');
        update_parts := array_append(update_parts,
          item_key || ' = ' || quote_literal(item_value::text) || '::jsonb');
      ELSE
        -- number, boolean
        col_values := array_append(col_values, item_value::text);
        update_parts := array_append(update_parts,
          item_key || ' = ' || item_value::text);
      END IF;
    END IF;
  END LOOP;

  -- Build and execute the upsert.
  -- ON CONFLICT targets the partial unique index on (project_id, external_id) WHERE external_id IS NOT NULL.
  sql_text := format(
    'INSERT INTO public.%I (%s) VALUES (%s) ON CONFLICT (project_id, external_id) WHERE external_id IS NOT NULL DO UPDATE SET %s RETURNING (xmax = 0) AS inserted',
    p_table_name,
    array_to_string(col_names, ', '),
    array_to_string(col_values, ', '),
    array_to_string(update_parts, ', ')
  );

  EXECUTE sql_text INTO was_inserted;

  RETURN was_inserted;
END;
$$;

--------------------------------------------------------------------------------
-- bulk_import: import collection-keyed JSON data with transactional guarantee
--
-- Input format: an object keyed by collection name, each value an array of items. For example:
-- - "elections": [{"external_id": "election-2024", "name": {...}, ...}]
-- - "factions": [{"external_id": "fac-001", "organization": {"external_id": "org-sdp"}, ...}]
-- - "nominations": [{"external_id": "nom-001", "candidate": {"external_id": "cand-001"}, ...}]
--
-- Each item MUST include:
--   - "external_id": unique identifier within the project
--   - "project_id": UUID of the target project (for RLS enforcement)
--
-- Relationship fields (e.g., "organization", "election") are expressed as {"external_id": "..."} objects and resolved to UUIDs internally.
--
-- Returns: {"elections": {"created": N, "updated": M}, ...}
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bulk_import (p_data jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  collection_name text;
  collection_data jsonb;
  item jsonb;
  result jsonb := '{}'::jsonb;
  created_count integer;
  updated_count integer;
  item_project_id uuid;
  was_inserted boolean;

  -- Supported collections in dependency order
  processing_order text[] := ARRAY[
    'elections', 'constituency_groups', 'constituencies',
    'organizations', 'alliances', 'factions', 'candidates',
    'question_categories', 'questions',
    'nominations', 'app_settings'
  ];
  col_name text;
BEGIN
  -- Validate no unknown collections were passed
  FOR collection_name IN SELECT * FROM jsonb_object_keys(p_data)
  LOOP
    IF NOT collection_name = ANY(processing_order) THEN
      RAISE EXCEPTION 'Unknown collection: %', collection_name;
    END IF;
  END LOOP;

  -- Process collections in dependency order
  FOREACH col_name IN ARRAY processing_order
  LOOP
    IF NOT p_data ? col_name THEN CONTINUE; END IF;
    collection_data := p_data -> col_name;

    IF jsonb_typeof(collection_data) != 'array' THEN
      RAISE EXCEPTION 'Collection "%" must be a JSON array', col_name;
    END IF;

    created_count := 0;
    updated_count := 0;

    FOR item IN SELECT * FROM jsonb_array_elements(collection_data)
    LOOP
      -- Extract project_id from each item (required for RLS)
      IF NOT item ? 'project_id' THEN
        RAISE EXCEPTION 'project_id is required in each item (collection: %, external_id: %)',
          col_name, item ->> 'external_id';
      END IF;
      item_project_id := (item ->> 'project_id')::uuid;

      -- Upsert the record
      was_inserted := public._bulk_upsert_record(col_name, item, item_project_id);

      IF was_inserted THEN
        created_count := created_count + 1;
      ELSE
        updated_count := updated_count + 1;
      END IF;
    END LOOP;

    result := result || jsonb_build_object(
      col_name, jsonb_build_object('created', created_count, 'updated', updated_count)
    );
  END LOOP;

  RETURN result;
END;
$$;

--------------------------------------------------------------------------------
-- bulk_delete: delete records by prefix, UUID list, or external_id list
--
-- Input format: {"project_id": "uuid", "collections": {...}}, where "collections" maps each collection name to one deletion spec. For example:
-- - "elections": {"prefix": "import-2024-"}
-- - "candidates": {"ids": ["uuid-1", "uuid-2"]}
-- - "nominations": {"external_ids": ["nom-1", "nom-2"]}
--
-- Deletion modes per collection:
--   - prefix: DELETE WHERE external_id LIKE prefix || '%'
--   - ids: DELETE WHERE id = ANY(ids::uuid[])
--   - external_ids: DELETE WHERE external_id = ANY(external_ids::text[])
--
-- Processes in reverse dependency order to avoid FK violations.
-- Returns: {"elections": {"deleted": N}, ...}
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bulk_delete (p_data jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  p_project_id uuid;
  collections jsonb;
  collection_name text;
  collection_spec jsonb;
  result jsonb := '{}'::jsonb;
  deleted_count integer;
  sql_text text;
  prefix_val text;

  -- Supported collections in reverse dependency order (delete children first)
  delete_order text[] := ARRAY[
    'nominations', 'questions', 'question_categories',
    'candidates', 'factions', 'alliances', 'organizations',
    'constituencies', 'constituency_groups', 'elections', 'app_settings'
  ];
  col_name text;

  -- Allowed collection names for validation
  allowed_collections text[] := ARRAY[
    'elections', 'constituency_groups', 'constituencies',
    'organizations', 'alliances', 'factions', 'candidates',
    'question_categories', 'questions',
    'nominations', 'app_settings'
  ];
BEGIN
  -- Extract project_id (required, top-level)
  IF NOT p_data ? 'project_id' THEN
    RAISE EXCEPTION 'project_id is required at the top level of bulk_delete data';
  END IF;
  p_project_id := (p_data ->> 'project_id')::uuid;

  -- Extract collections
  IF NOT p_data ? 'collections' THEN
    RAISE EXCEPTION '"collections" object is required in bulk_delete data';
  END IF;
  collections := p_data -> 'collections';

  -- Validate collection names
  FOR collection_name IN SELECT * FROM jsonb_object_keys(collections)
  LOOP
    IF NOT collection_name = ANY(allowed_collections) THEN
      RAISE EXCEPTION 'Unknown collection for deletion: %', collection_name;
    END IF;
  END LOOP;

  -- Process deletions in reverse dependency order
  FOREACH col_name IN ARRAY delete_order
  LOOP
    IF NOT collections ? col_name THEN CONTINUE; END IF;
    collection_spec := collections -> col_name;

    IF collection_spec ? 'prefix' THEN
      -- Prefix-based deletion: external_id LIKE prefix%
      prefix_val := collection_spec ->> 'prefix';
      sql_text := format(
        'DELETE FROM public.%I WHERE project_id = $1 AND external_id LIKE $2',
        col_name
      );
      EXECUTE sql_text USING p_project_id, prefix_val || '%';
      GET DIAGNOSTICS deleted_count = ROW_COUNT;

    ELSIF collection_spec ? 'ids' THEN
      -- UUID list deletion
      sql_text := format(
        'DELETE FROM public.%I WHERE project_id = $1 AND id = ANY(
          SELECT value::uuid FROM jsonb_array_elements_text($2)
        )',
        col_name
      );
      EXECUTE sql_text USING p_project_id, collection_spec -> 'ids';
      GET DIAGNOSTICS deleted_count = ROW_COUNT;

    ELSIF collection_spec ? 'external_ids' THEN
      -- External ID list deletion
      sql_text := format(
        'DELETE FROM public.%I WHERE project_id = $1 AND external_id = ANY(
          SELECT value FROM jsonb_array_elements_text($2)
        )',
        col_name
      );
      EXECUTE sql_text USING p_project_id, collection_spec -> 'external_ids';
      GET DIAGNOSTICS deleted_count = ROW_COUNT;

    ELSE
      RAISE EXCEPTION 'Collection "%" must specify "prefix", "ids", or "external_ids"', col_name;
    END IF;

    result := result || jsonb_build_object(
      col_name, jsonb_build_object('deleted', deleted_count)
    );
  END LOOP;

  RETURN result;
END;
$$;

--------------------------------------------------------------------------------
-- Grant execute to authenticated role
--
-- The functions are SECURITY INVOKER, so EXECUTE alone permits no write: every insert, update and delete still passes the table's RLS policies, which admit only callers user_can grants the table's write permission on the target project.
--------------------------------------------------------------------------------
GRANT
EXECUTE ON FUNCTION public.bulk_import (jsonb) TO authenticated;

GRANT
EXECUTE ON FUNCTION public.bulk_delete (jsonb) TO authenticated;

GRANT
EXECUTE ON FUNCTION public.resolve_external_ref (jsonb, text, uuid) TO authenticated;
-- Email helper functions for transactional email template variable resolution
--
-- Depends on:
-- - 010-utility-functions.sql (get_localized)
-- - 100-tenancy.sql (projects)
-- - 101-elections.sql (elections, constituencies)
-- - 102-entities.sql (candidates, organizations)
-- - 104-nominations.sql (nominations)
-- - 300-auth-tables.sql (grants)
-- - 301-auth-functions.sql (private.entity_project_id)
--------------------------------------------------------------------------------
-- resolve_email_variables: resolve template variables for a set of users
--
-- For each user_id, looks up their entity context in the grant map and resolves template variable paths like "candidate.first_name", "organization.name", "nomination.constituency.name", "nomination.election.name".
--
-- Returns a row per user with their email, preferred_locale, and a flat JSONB object of resolved variables.
--
-- p_project_id is required and carries no DEFAULT: every entity lookup below is qualified by it, so a caller that omits it gets an undefined_function error rather than another project's names rendered into an email.
--
-- SECURITY DEFINER: it reads auth.users, which regular authenticated users cannot read.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_email_variables (
  p_project_id uuid,
  p_user_ids uuid[],
  p_template_body text DEFAULT '',
  p_template_subject text DEFAULT ''
) RETURNS TABLE (
  user_id uuid,
  email text,
  preferred_locale text,
  variables jsonb
) LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  uid uuid;
  u_email text;
  u_locale text;
  u_entity_kind public.entity_type;
  u_scope_id uuid;
  vars jsonb;
  -- Candidate fields
  c_first_name text;
  c_last_name text;
  -- Organization fields
  org_name text;
  -- Nomination fields
  nom_constituency_name text;
  nom_election_name text;
BEGIN
  -- p_template_body and p_template_subject are part of the published four-argument signature: PostgREST resolves overloads by named argument, the send-email Edge Function passes all four by name, and the grants below name the four-argument form. They do not narrow the resolved variables: the only caller passes empty strings, so filtering by template text would return no variables for any recipient. This PERFORM reads them so plpgsql_check does not report them unused.
  PERFORM p_template_body, p_template_subject;

  FOREACH uid IN ARRAY p_user_ids
  LOOP
    -- The user's email and preferred locale. auth.users has no project column; the grant test below bounds recipients to the project.
    SELECT
      au.email,
      COALESCE(au.raw_user_meta_data->>'preferred_locale', 'en')
    INTO u_email, u_locale
    FROM auth.users au
    WHERE au.id = uid;

    IF u_email IS NULL THEN
      -- User not found, skip
      CONTINUE;
    END IF;

    -- Recipients are bounded to the project: a user id is returned only when that user holds a grant whose target resolves to p_project_id (the project itself, the account that owns it, or an entity in it). Without this, a send-email caller, who supplies the id list, could mail or, with `dry_run`, read back the address of any user in the instance. A global grant targets no project and does not qualify. An id that fails the test is skipped like an unknown id, so the result does not distinguish the two.
    IF NOT EXISTS (
      SELECT 1
      FROM public.grants g
      WHERE g.user_id = uid
        AND (
          (g.scope = 'project' AND g.target_id = p_project_id)
          OR (g.scope = 'account' AND g.target_id = (SELECT pr.account_id FROM public.projects pr WHERE pr.id = p_project_id))
          OR (g.scope = 'entity' AND private.entity_project_id (g.target_type, g.target_id) = p_project_id)
        )
    ) THEN
      CONTINUE;
    END IF;

    -- Initialize empty variables
    vars := '{}'::jsonb;

    -- The user's first candidate or organization entity grant. public.grants has no project_id column, so the project predicate is applied to the entity rows target_id points at.
    --
    -- Only candidate and organization grants are resolved. The grant map also admits faction and alliance grants; this function ignores them, so their holders get no entity variables.
    --
    -- A user holding both kinds gets the candidate's variables. The grant map permits both rows for one user, but neither the seed nor the pgTAP fixture creates such a user, so no test pins this order.
    SELECT g.target_type, g.target_id
    INTO u_entity_kind, u_scope_id
    FROM public.grants g
    WHERE g.user_id = uid
      AND g.scope = 'entity'
      AND g.target_type IN ('candidate', 'organization')
    ORDER BY
      CASE g.target_type
        WHEN 'candidate' THEN 1
        WHEN 'organization' THEN 2
      END
    LIMIT 1;

    IF u_entity_kind = 'candidate' AND u_scope_id IS NOT NULL THEN
      -- Candidate fields. The project predicate is an unconditional equality rather than an `IS NULL OR` shape: there is no every-project case.
      SELECT c.first_name, c.last_name
      INTO c_first_name, c_last_name
      FROM public.candidates c
      WHERE c.id = u_scope_id
        AND c.project_id = p_project_id;

      IF c_first_name IS NOT NULL THEN
        vars := vars || jsonb_build_object(
          'candidate.first_name', c_first_name,
          'candidate.last_name', c_last_name
        );
      END IF;

      -- The nomination context (constituency, election and nominating organization), from the first nomination found for this candidate. The project predicate is on the nomination: the constituency and election are reached through it, and validate_nomination keeps them in the nomination's project. Which nomination supplies the names is whichever one LIMIT 1 returns; the pick is not deterministic.
      --
      -- The organization is the one on the parent nomination. Both parent joins are LEFT joins: a candidate nomination with no parent is legal, and an inner join would drop the constituency and election names along with the organization. A candidate with no nomination emits no organization key.
      SELECT
        public.get_localized(con.name, u_locale),
        public.get_localized(el.name, u_locale),
        public.get_localized(parent_org.name, u_locale)
      INTO nom_constituency_name, nom_election_name, org_name
      FROM public.nominations n
      JOIN public.constituencies con ON con.id = n.constituency_id
      JOIN public.elections el ON el.id = n.election_id
      LEFT JOIN public.nominations parent_nom ON parent_nom.id = n.parent_nomination_id
      LEFT JOIN public.organizations parent_org ON parent_org.id = parent_nom.organization_id
        AND parent_org.project_id = p_project_id
      WHERE n.candidate_id = u_scope_id
        AND n.project_id = p_project_id
      LIMIT 1;

      IF nom_constituency_name IS NOT NULL THEN
        vars := vars || jsonb_build_object('nomination.constituency.name', nom_constituency_name);
      END IF;

      IF nom_election_name IS NOT NULL THEN
        vars := vars || jsonb_build_object('nomination.election.name', nom_election_name);
      END IF;

      IF org_name IS NOT NULL THEN
        vars := vars || jsonb_build_object('organization.name', org_name);
      END IF;

    ELSIF u_entity_kind = 'organization' AND u_scope_id IS NOT NULL THEN
      -- Resolve organization fields for the organization-scoped grantee
      SELECT public.get_localized(o.name, u_locale)
      INTO org_name
      FROM public.organizations o
      WHERE o.id = u_scope_id
        AND o.project_id = p_project_id;

      IF org_name IS NOT NULL THEN
        vars := vars || jsonb_build_object('organization.name', org_name);
      END IF;
    END IF;

    -- Return row for this user
    user_id := uid;
    email := u_email;
    preferred_locale := u_locale;
    variables := vars;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- service_role only. The function is SECURITY DEFINER, reads auth.users and checks nothing about its caller, so any role that can EXECUTE it can read the email address of any user id it names, and user ids are readable from public columns (candidates.auth_user_id). Its one caller, the send-email Edge Function, calls it through a service-role client after its own authority check. Supabase's default privileges grant EXECUTE on every new public function to anon and authenticated, so the REVOKE names them as well as PUBLIC.
REVOKE
EXECUTE ON FUNCTION public.resolve_email_variables (uuid, uuid[], text, text)
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT
EXECUTE ON FUNCTION public.resolve_email_variables (uuid, uuid[], text, text) TO service_role;
-- Entity RPC functions
--
-- Functions:
-- - get_nominations() - return nominations with entity data
-- - get_entity_basic_data() - basic-data projection of an entity the caller holds nomination.read on
-- - get_candidate_user_data() - return the entity row for the authenticated user
-- - upsert_answers() - atomic answer write for a single entity
--------------------------------------------------------------------------------
-- get_nominations RPC: returns nominations with entity data in a single round trip
--
-- p_project_id is REQUIRED and carries no DEFAULT. Every other filter defaults to NULL, meaning no filter, so a defaulted project would let a caller that omits the argument read every project's nominations. It comes first because PostgreSQL forbids a parameter without a default from following one that has a default.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_nominations (
  p_project_id uuid,
  p_election_id uuid DEFAULT NULL,
  p_constituency_id uuid DEFAULT NULL,
  p_include_unconfirmed boolean DEFAULT false,
  p_election_round integer DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  entity_type public.entity_type,
  candidate_id uuid,
  organization_id uuid,
  faction_id uuid,
  alliance_id uuid,
  election_id uuid,
  constituency_id uuid,
  election_round integer,
  election_symbol text,
  parent_nomination_id uuid,
  entity_id uuid,
  entity_name jsonb,
  entity_short_name jsonb,
  entity_info jsonb,
  entity_color jsonb,
  entity_image jsonb,
  entity_sort_order integer,
  entity_subtype text,
  entity_custom_data jsonb,
  entity_answers jsonb,
  entity_first_name text,
  entity_last_name text
) LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT
    n.id, n.name, n.short_name, n.info, n.color, n.image,
    n.sort_order, n.subtype, n.custom_data,
    n.entity_type,
    n.candidate_id, n.organization_id, n.faction_id, n.alliance_id,
    n.election_id, n.constituency_id, n.election_round, n.election_symbol,
    n.parent_nomination_id,
    COALESCE(n.candidate_id, n.organization_id, n.faction_id, n.alliance_id) AS entity_id,
    COALESCE(o.name, f.name, a.name) AS entity_name,
    COALESCE(c.short_name, o.short_name, f.short_name, a.short_name) AS entity_short_name,
    COALESCE(c.info, o.info, f.info, a.info) AS entity_info,
    COALESCE(c.color, o.color, f.color, a.color) AS entity_color,
    COALESCE(c.image, o.image, f.image, a.image) AS entity_image,
    COALESCE(c.sort_order, o.sort_order, f.sort_order, a.sort_order) AS entity_sort_order,
    COALESCE(c.subtype, o.subtype, f.subtype, a.subtype) AS entity_subtype,
    COALESCE(c.custom_data, o.custom_data, f.custom_data, a.custom_data) AS entity_custom_data,
    COALESCE(c.answers, o.answers) AS entity_answers,
    c.first_name AS entity_first_name,
    c.last_name AS entity_last_name
  FROM public.nominations n
  -- The project term belongs in the JOIN condition, not the WHERE clause. These are LEFT joins and three of the four aliases are NULL on any row, so a WHERE predicate on a right-hand table would discard every nomination whose entity is of another type. In the ON clause a non-matching entity resolves to NULL, which the trailing COALESCE filter handles.
  LEFT JOIN public.candidates c ON n.candidate_id = c.id AND c.project_id = p_project_id
  LEFT JOIN public.organizations o ON n.organization_id = o.id AND o.project_id = p_project_id
  LEFT JOIN public.factions f ON n.faction_id = f.id AND f.project_id = p_project_id
  LEFT JOIN public.alliances a ON n.alliance_id = a.id AND a.project_id = p_project_id
  -- The project predicate is an unconditional equality rather than the `IS NULL OR` shape the other filters use: there is no every-project case.
  WHERE n.project_id = p_project_id
    AND (p_election_id IS NULL OR n.election_id = p_election_id)
    AND (p_constituency_id IS NULL OR n.constituency_id = p_constituency_id)
    AND (p_include_unconfirmed OR n.confirmed)
    -- nominations.election_round is a scalar integer, so this is an equality rather than the array containment that get_questions uses against the JSONB election_rounds on questions and question categories.
    AND (p_election_round IS NULL OR n.election_round = p_election_round)
    -- SECURITY INVOKER means the LEFT JOINs run with the caller's permissions, so RLS-hidden entity rows return NULL on the entity-side columns. Drop rows where every entity-side join resolved to NULL. With the join predicates above, this filter also drops a nomination whose entity belongs to another project.
    --
    -- This filter is defence in depth. `anon_select_nominations` already requires every entity a nomination links to be confirmed, but the terms-of-use clause of `anon_select_candidates` is a candidates-policy term that no nominations predicate restates, so a nomination whose candidate that clause hides is dropped only here.
    AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL
  ORDER BY n.sort_order NULLS LAST, n.id;
$$;

GRANT
EXECUTE ON FUNCTION public.get_nominations (uuid, uuid, uuid, boolean, integer) TO anon,
authenticated;

--------------------------------------------------------------------------------
-- get_entity_basic_data: an entity's BASIC data for a caller holding nomination.read on it
--
-- An entity grantee reads a related entity's basic data through is_child_nominee, but not its answers unless they are public. Row-level security cannot express that, because a SELECT policy that admits a row returns every column of it, so the entity SELECT policies carry no `nomination.read` disjunct (302-rls.sql) and the parent's reach is granted here instead.
--
-- The gate is ONE `user_can ('entity', p_entity_id, 'nomination.read', p_entity_type)` call, so the matrix is asked rather than re-derived: the child-nominee hop is user_can's named branch 2, and every project-scope role holding nomination.read passes through the ordinary reach rules.
--
-- The entity is named by its type and id together, because the four entity tables have independent primary keys and one uuid can name two entities in two projects. The type selects the one table probed, and the gate asks about that same entity.
--
-- The projection is an ALLOW-LIST, not `to_jsonb(row) - <deny-list>`: a column added to an entity table later is withheld until someone decides it is basic data. Withheld today: answers, auth_user_id, terms_of_use_accepted, custom_data, external_id and the two timestamps.
--
-- Returns NULL -- never raises -- when the caller lacks the permission, when the type is NULL, or when the named table holds no row with that id, so the answer does not distinguish "does not exist" from "not yours".
--
-- SECURITY DEFINER because the whole point is to return a row the caller's own SELECT policy refuses; search_path is pinned as on every definer function in this schema. EXECUTE is authenticated only: anon carries no grants claim, so user_can would deny it on every call anyway.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_entity_basic_data (
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_entity_id IS NULL OR NOT public.user_can('entity', p_entity_id, 'nomination.read', p_entity_type) THEN
    RETURN NULL;
  END IF;

  CASE p_entity_type
    WHEN 'candidate' THEN
      SELECT jsonb_build_object(
          'entity_type', 'candidate', 'id', c.id, 'project_id', c.project_id,
          'first_name', c.first_name, 'last_name', c.last_name,
          'short_name', c.short_name, 'info', c.info, 'color', c.color, 'image', c.image,
          'sort_order', c.sort_order, 'subtype', c.subtype, 'confirmed', c.confirmed)
        INTO result
        FROM public.candidates c WHERE c.id = p_entity_id;
    WHEN 'organization' THEN
      SELECT jsonb_build_object(
          'entity_type', 'organization', 'id', o.id, 'project_id', o.project_id,
          'name', o.name, 'short_name', o.short_name, 'info', o.info, 'color', o.color, 'image', o.image,
          'sort_order', o.sort_order, 'subtype', o.subtype, 'confirmed', o.confirmed)
        INTO result
        FROM public.organizations o WHERE o.id = p_entity_id;
    WHEN 'faction' THEN
      SELECT jsonb_build_object(
          'entity_type', 'faction', 'id', f.id, 'project_id', f.project_id,
          'organization_id', f.organization_id,
          'name', f.name, 'short_name', f.short_name, 'info', f.info, 'color', f.color, 'image', f.image,
          'sort_order', f.sort_order, 'subtype', f.subtype, 'confirmed', f.confirmed)
        INTO result
        FROM public.factions f WHERE f.id = p_entity_id;
    WHEN 'alliance' THEN
      SELECT jsonb_build_object(
          'entity_type', 'alliance', 'id', a.id, 'project_id', a.project_id,
          'name', a.name, 'short_name', a.short_name, 'info', a.info, 'color', a.color, 'image', a.image,
          'sort_order', a.sort_order, 'subtype', a.subtype, 'confirmed', a.confirmed)
        INTO result
        FROM public.alliances a WHERE a.id = p_entity_id;
  END CASE;
  RETURN result;
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.get_entity_basic_data (public.entity_type, uuid)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.get_entity_basic_data (public.entity_type, uuid) TO authenticated;

--------------------------------------------------------------------------------
-- get_candidate_user_data: returns the entity row for the authenticated user, in ONE project
--
-- p_project_id is REQUIRED and carries no DEFAULT. One identity may hold entity rows in several projects (identity-callback's lookup allows for it), and without a project term `LIMIT 1` with no ORDER BY would return an arbitrary one of them. It comes first because PostgreSQL forbids a parameter without a default from following one that has a default.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_candidate_user_data (
  p_project_id uuid,
  p_entity_type public.entity_type DEFAULT 'candidate'
) RETURNS TABLE (
  id uuid,
  project_id uuid,
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  answers jsonb,
  terms_of_use_accepted timestamptz,
  first_name text,
  last_name text
) LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT c.id, c.project_id, NULL::jsonb, c.short_name, c.info,
         c.color, c.image, c.sort_order, c.subtype,
         c.custom_data, c.answers, c.terms_of_use_accepted,
         c.first_name, c.last_name
  FROM public.candidates c
  WHERE c.auth_user_id = (SELECT auth.uid())
    AND c.project_id = p_project_id
    AND p_entity_type = 'candidate'
  UNION ALL
  SELECT o.id, o.project_id, o.name, o.short_name, o.info,
         o.color, o.image, o.sort_order, o.subtype,
         o.custom_data, o.answers, NULL::timestamptz,
         NULL::text, NULL::text
  FROM public.organizations o
  WHERE o.auth_user_id = (SELECT auth.uid())
    AND o.project_id = p_project_id
    AND p_entity_type = 'organization'
  LIMIT 1;
$$;

GRANT
EXECUTE ON FUNCTION public.get_candidate_user_data (uuid, public.entity_type) TO authenticated;

--------------------------------------------------------------------------------
-- upsert_answers: atomic answer write for a single entity
--
-- The entity is named by its type and id together, because the entity tables have independent primary keys and one UUID can name a candidate and an organization at once. The type selects the one table written: 'candidate' writes public.candidates and 'organization' writes public.organizations, the only two tables carrying an answers column. Any other type, and a NULL type, raises before any table is written.
--
-- p_overwrite = true replaces the stored answers with p_answers; otherwise p_answers is merged over them. Either way, keys whose value is JSON null are dropped.
--
-- SECURITY INVOKER: the UPDATE is gated by the named table's RLS policies, so a caller can update only the answers of an entity those policies let them edit. An id that matches no row the caller may update raises the not-found exception.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_answers (
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_answers jsonb,
  p_overwrite boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  p_updated_answers jsonb;
BEGIN
  CASE p_entity_type
    WHEN 'candidate' THEN
      UPDATE public.candidates
      SET answers = (
        SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
        FROM jsonb_each(
          CASE WHEN p_overwrite THEN '{}'::jsonb ELSE COALESCE(public.candidates.answers, '{}'::jsonb) END
          || COALESCE(p_answers, '{}'::jsonb)
        ) AS t(k, v)
        WHERE v IS NOT NULL AND v != 'null'::jsonb
      )
      WHERE id = p_entity_id
      RETURNING public.candidates.answers INTO p_updated_answers;
    WHEN 'organization' THEN
      UPDATE public.organizations
      SET answers = (
        SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
        FROM jsonb_each(
          CASE WHEN p_overwrite THEN '{}'::jsonb ELSE COALESCE(public.organizations.answers, '{}'::jsonb) END
          || COALESCE(p_answers, '{}'::jsonb)
        ) AS t(k, v)
        WHERE v IS NOT NULL AND v != 'null'::jsonb
      )
      WHERE id = p_entity_id
      RETURNING public.organizations.answers INTO p_updated_answers;
    ELSE
      RAISE EXCEPTION 'Entity type % has no answers', p_entity_type;
  END CASE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entity not found or access denied: %', p_entity_id;
  END IF;

  RETURN p_updated_answers;
END;
$$;

GRANT
EXECUTE ON FUNCTION public.upsert_answers (public.entity_type, uuid, jsonb, boolean) TO authenticated;
-- Admin RPC functions
--
-- Functions:
-- - merge_question_custom_data() - shallow JSONB merge on questions.custom_data
--------------------------------------------------------------------------------
-- merge_question_custom_data: shallow JSONB merge on questions.custom_data
--
-- SECURITY INVOKER: the admin_update_questions RLS policy limits the UPDATE to callers for whom user_can answers true for project.edit_questions on the row's project. A row the policy hides matches nothing, so the function raises the same error as for an unknown id.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.merge_question_custom_data (p_question_id uuid, p_patch jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  p_updated_data jsonb;
BEGIN
  UPDATE public.questions
  SET custom_data = COALESCE(custom_data, '{}'::jsonb) || p_patch
  WHERE id = p_question_id
  RETURNING public.questions.custom_data INTO p_updated_data;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question not found or access denied: %', p_question_id;
  END IF;

  RETURN p_updated_data;
END;
$$;

GRANT
EXECUTE ON FUNCTION public.merge_question_custom_data (uuid, jsonb) TO authenticated;
-- Question RPC functions
--
-- Functions:
-- - get_questions() - return question categories and their questions in one round trip
--------------------------------------------------------------------------------
-- get_questions RPC: returns question categories and questions in a single round trip
--
-- The return is a single jsonb value of the shape { "categories": [...], "questions": [...] }. It is jsonb rather than a table because the two result sets have different shapes, and because a jsonb return adds no column nullability for the generated types to misstate; the adapter validates the payload with zod.
--
-- p_project_id is REQUIRED and carries no DEFAULT, so a caller that omits it gets an undefined_function error rather than every project's questions.
--
-- Filter semantics, on the three OPTIONAL axes and for both tables: NULL or empty means "applies to all", never "applies to none". A row is included when the parameter is NULL, when the row's column is NULL, when the column is an empty array, or when the column contains the parameter. Categories and questions are filtered independently, so a question narrower than its category is excluded on its own terms.
--
-- Note that question_categories.election_rounds and questions.election_rounds are JSONB arrays, unlike the scalar nominations.election_round that get_nominations filters; the two predicates are not interchangeable.
--
-- SECURITY INVOKER: the reads run with the caller's permissions, so the question_categories and questions RLS policies gate the caller rather than the function owner.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_questions (
  p_project_id uuid,
  p_election_id uuid DEFAULT NULL,
  p_constituency_id uuid DEFAULT NULL,
  p_election_round integer DEFAULT NULL
) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT jsonb_build_object(
    'categories',
    COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(qc) ORDER BY qc.sort_order NULLS LAST, qc.id)
        FROM public.question_categories qc
        -- The project predicate is an unconditional equality rather than the `IS NULL OR` shape the other three filters use: there is no every-project case. It comes first so the project bound is found without reading past the three optional filters.
        WHERE qc.project_id = p_project_id
          AND (p_election_id IS NULL
               OR qc.election_ids IS NULL
               OR jsonb_array_length(qc.election_ids) = 0
               OR qc.election_ids @> to_jsonb(p_election_id::text))
          AND (p_constituency_id IS NULL
               OR qc.constituency_ids IS NULL
               OR jsonb_array_length(qc.constituency_ids) = 0
               OR qc.constituency_ids @> to_jsonb(p_constituency_id::text))
          AND (p_election_round IS NULL
               OR qc.election_rounds IS NULL
               OR jsonb_array_length(qc.election_rounds) = 0
               OR qc.election_rounds @> to_jsonb(p_election_round))
      ),
      '[]'::jsonb
    ),
    'questions',
    COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(q) ORDER BY q.sort_order NULLS LAST, q.id)
        FROM public.questions q
        WHERE q.project_id = p_project_id
          AND (p_election_id IS NULL
               OR q.election_ids IS NULL
               OR jsonb_array_length(q.election_ids) = 0
               OR q.election_ids @> to_jsonb(p_election_id::text))
          AND (p_constituency_id IS NULL
               OR q.constituency_ids IS NULL
               OR jsonb_array_length(q.constituency_ids) = 0
               OR q.constituency_ids @> to_jsonb(p_constituency_id::text))
          AND (p_election_round IS NULL
               OR q.election_rounds IS NULL
               OR jsonb_array_length(q.election_rounds) = 0
               OR q.election_rounds @> to_jsonb(p_election_round))
      ),
      '[]'::jsonb
    )
  );
$$;

GRANT
EXECUTE ON FUNCTION public.get_questions (uuid, uuid, uuid, integer) TO anon,
authenticated;
-- Test helpers: generic JSONB deep-merge RPC for test infrastructure
--
-- jsonb_recursive_merge: recursively merges two JSONB objects. When both sides are objects, keys are merged recursively. Otherwise, the patch value wins.
--
-- merge_jsonb_column: generic RPC for deep-merging a partial JSONB payload into any JSONB column of any table. Used by SupabaseAdminClient to update app_settings.settings without replacing sibling keys.
--
-- SECURITY INVOKER: runs with caller's permissions so that RLS policies on the target table are enforced.
--------------------------------------------------------------------------------
-- jsonb_recursive_merge: recursive deep merge of two JSONB values
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.jsonb_recursive_merge (p_base jsonb, p_patch jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN jsonb_typeof(p_base) = 'object' AND jsonb_typeof(p_patch) = 'object' THEN
      (SELECT jsonb_object_agg(
        COALESCE(k, pk),
        CASE
          WHEN k IS NOT NULL AND pk IS NOT NULL THEN public.jsonb_recursive_merge(p_base -> k, p_patch -> pk)
          WHEN pk IS NOT NULL THEN p_patch -> pk
          ELSE p_base -> k
        END
      )
      FROM (
        SELECT DISTINCT COALESCE(k, pk) AS key, k, pk
        FROM jsonb_object_keys(p_base) k
        FULL OUTER JOIN jsonb_object_keys(p_patch) pk ON k = pk
      ) keys)
    ELSE p_patch
  END;
$$;

--------------------------------------------------------------------------------
-- merge_jsonb_column: generic deep-merge into any table's JSONB column
--
-- Parameters:
-- - p_table_name - name of the target table
-- - p_column_name - name of the JSONB column to merge into
-- - p_row_id - UUID primary key of the row to update
-- - p_partial_data - JSONB object to deep-merge into the existing value
--
-- SECURITY INVOKER: the caller's RLS policies apply to the UPDATE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.merge_jsonb_column (
  p_table_name text,
  p_column_name text,
  p_row_id uuid,
  p_partial_data jsonb
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  EXECUTE format(
    'UPDATE public.%I SET %I = public.jsonb_recursive_merge(%I, $1) WHERE id = $2',
    p_table_name, p_column_name, p_column_name
  ) USING p_partial_data, p_row_id;
END;
$$;

--------------------------------------------------------------------------------
-- Grants: service_role and authenticated can call these functions
--------------------------------------------------------------------------------
GRANT
EXECUTE ON FUNCTION public.jsonb_recursive_merge (jsonb, jsonb) TO service_role;

GRANT
EXECUTE ON FUNCTION public.merge_jsonb_column (text, text, uuid, jsonb) TO service_role;

GRANT
EXECUTE ON FUNCTION public.merge_jsonb_column (text, text, uuid, jsonb) TO authenticated;
