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
-- - nomination_shape - which of the four nomination flows an election runs; the type of elections.election_type
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

-- The four nomination flows an election can run. It is the type of elections.election_type, and like grant_scope_type it is named for what it means rather than for the column that holds it.
--
-- organization_list_and_independents is a list election in which a candidate may also stand without a party.
--
-- The members are exactly the four flows, so any other value in elections.election_type is a PostgreSQL error rather than a stored string.
CREATE TYPE public.nomination_shape AS ENUM(
  'organization_only',
  'candidate_only',
  'organization_list',
  'organization_list_and_independents'
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
-- - nomination_shape_rule(nomination_shape, entity_type) - which entity types an election type admits, and where a candidate needs a parent
-- - validate_nomination() - enforce nomination tenancy, the election-type rule, hierarchy and parent consistency
-- - validate_nomination_parent_required() - refuse, when the transaction ends, a candidate nomination that needs a parent and has none
-- - enforce_nomination_confirmation() - refuse or clear a nomination's confirmation the caller may not set
-- - enforce_nomination_entity_columns() - bound the nomination columns a non-admin may write
-- - enforce_entity_immutability() - gate the entity confirmation flag and freeze a confirmed entity's name and short name
-- - validate_entity_type_list() - refuse an entity type filter that is not null or a JSON array of entity types
-- - validate_entity_color() - refuse an entity colour that is not null or an object of hex colours under normal and dark
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
CREATE OR REPLACE FUNCTION public.is_valid_choice_id (p_value JSONB, p_valid_choices JSONB) RETURNS BOOLEAN LANGUAGE plpgsql STABLE AS $$
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
-- nomination_shape_rule: the election type x entity type matrix, encoded once
--
-- Answers, for one election type and one entity type, one of three words:
--   'admitted'        - the entity type may be nominated, with or without a parent nomination.
--   'parent_required' - it may be nominated, and when the transaction ends its nomination must have a parent nomination or carry `requestedParentOrganization` in its custom data.
--   'refused'         - it may not be nominated in an election of that type.
--
-- The CASE below is the table: one line per cell, one block per election type, the entity types in the same order in each. A faction stands wherever a candidate may have a parent, and an alliance wherever an organization may stand.
--
-- A NULL argument answers NULL, and so would a pair the CASE does not name. Every caller treats NULL as a refusal, so a type added to either enum admits nothing until it is given a cell here.
--
-- This is the only statement of the matrix in SQL. `validate_nomination` and `validate_nomination_parent_required` ask it, and a function that writes nominations and needs the answer asks it too, never a copy.
--
-- Reads no table, so it is IMMUTABLE and not SECURITY DEFINER. search_path is pinned anyway, because the enum types it names are resolved at call time. It lives in `public` because this file is applied before the `private` schema exists.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.nomination_shape_rule (
  p_shape public.nomination_shape,
  p_entity_type public.entity_type
) RETURNS text LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT CASE
    WHEN (p_shape, p_entity_type) = ('organization_list', 'candidate') THEN 'parent_required'
    WHEN (p_shape, p_entity_type) = ('organization_list', 'organization') THEN 'admitted'
    WHEN (p_shape, p_entity_type) = ('organization_list', 'faction') THEN 'admitted'
    WHEN (p_shape, p_entity_type) = ('organization_list', 'alliance') THEN 'admitted'

    WHEN (p_shape, p_entity_type) = ('organization_list_and_independents', 'candidate') THEN 'admitted'
    WHEN (p_shape, p_entity_type) = ('organization_list_and_independents', 'organization') THEN 'admitted'
    WHEN (p_shape, p_entity_type) = ('organization_list_and_independents', 'faction') THEN 'admitted'
    WHEN (p_shape, p_entity_type) = ('organization_list_and_independents', 'alliance') THEN 'admitted'

    WHEN (p_shape, p_entity_type) = ('candidate_only', 'candidate') THEN 'admitted'
    WHEN (p_shape, p_entity_type) = ('candidate_only', 'organization') THEN 'refused'
    WHEN (p_shape, p_entity_type) = ('candidate_only', 'faction') THEN 'refused'
    WHEN (p_shape, p_entity_type) = ('candidate_only', 'alliance') THEN 'refused'

    WHEN (p_shape, p_entity_type) = ('organization_only', 'candidate') THEN 'refused'
    WHEN (p_shape, p_entity_type) = ('organization_only', 'organization') THEN 'admitted'
    WHEN (p_shape, p_entity_type) = ('organization_only', 'faction') THEN 'refused'
    WHEN (p_shape, p_entity_type) = ('organization_only', 'alliance') THEN 'admitted'
  END;
$$;

--------------------------------------------------------------------------------
-- validate_nomination: enforce the election-type rule, hierarchy and election/constituency consistency
--
-- Election-type rule:
--   The row's entity type must be one its election's type admits, as `nomination_shape_rule` answers. A refusal is `Nomination shape refused: ...` with SQLSTATE 23514.
--   It binds every writer, on INSERT and on UPDATE: an entity's own editor, an admin, the service role and the owner of the tables alike. The function reads no role.
--   It is asked when a nomination is written. Nothing re-checks the nominations an election holds when its type is changed, so a later write of a row the new type refuses is refused.
--   Whether a candidate that needs a parent has one is not asked here: `validate_nomination_parent_required` asks it when the transaction ends.
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
  p_election_type public.nomination_shape;
  p_shape_rule text;
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

  -- The election-type rule: the matrix is asked with the entity type derived above, because the generated `entity_type` column is NULL in a BEFORE trigger. Only 'admitted' and 'parent_required' let the row through, so an answer of NULL is a refusal. Checked for every writer, as the tenancy rule above is, and before the return below, which would otherwise let every row without a parent pass unasked.
  SELECT e.election_type INTO p_election_type
  FROM public.elections e
  WHERE e.id = NEW.election_id;

  p_shape_rule := public.nomination_shape_rule(p_election_type, p_child_type);

  IF p_shape_rule IS NULL OR p_shape_rule NOT IN ('admitted', 'parent_required') THEN
    RAISE EXCEPTION 'Nomination shape refused: % cannot be nominated in an election of type % (election %)',
      CASE
        WHEN p_child_type IS NULL THEN 'a row that names no entity'
        WHEN p_child_type IN ('organization', 'alliance') THEN 'an ' || p_child_type::text
        ELSE 'a ' || p_child_type::text
      END,
      p_election_type,
      NEW.election_id
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
-- validate_nomination_parent_required: a candidate that needs a parent has one when the transaction ends
--
-- The function of the constraint trigger `nominations_parent_required` (104-nominations.sql). Where `nomination_shape_rule` answers 'parent_required' for a candidate, the candidate's nomination must have a parent nomination or carry `requestedParentOrganization` in its custom data. A refusal is `Nomination parent required: ...` with SQLSTATE 23514.
--
-- It runs at the end of the transaction and not at the statement, so a writer may insert the candidate's row, then its party's row, then point the first at the second: only a row that is still without a parent when the transaction ends is refused.
--
-- It reads the row again by its id and never judges the row the queued event carries. The event carries the row as that statement wrote it, so judging it would refuse the three-statement order above. A row that is gone by then is not judged at all.
--
-- A function that must report the refusal inside its own call forces the constraint and puts it back before it returns: `SET CONSTRAINTS public.nominations_parent_required IMMEDIATE;` and then `SET CONSTRAINTS public.nominations_parent_required DEFERRED;`. While the constraint is immediate, a candidate's row without a parent is refused at its own statement, so the second statement is not optional.
--
-- SECURITY DEFINER with an empty search_path, as `validate_nomination` is: the re-read must find the row whatever row-level security the writer carries. The rule binds every writer, and the function reads no role.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_nomination_parent_required () RETURNS TRIGGER SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_candidate_id uuid;
  v_parent_nomination_id uuid;
  v_custom_data jsonb;
  v_election_id uuid;
  v_election_type public.nomination_shape;
BEGIN
  -- Scalar variables, not a row of the table's type: this file is applied before the table exists, and a declaration is resolved when the function is created.
  SELECT n.candidate_id, n.parent_nomination_id, n.custom_data, n.election_id
  INTO v_candidate_id, v_parent_nomination_id, v_custom_data, v_election_id
  FROM public.nominations n
  WHERE n.id = NEW.id;

  IF NOT FOUND
     OR v_candidate_id IS NULL
     OR v_parent_nomination_id IS NOT NULL
     OR (v_custom_data IS NOT NULL AND v_custom_data ? 'requestedParentOrganization') THEN
    RETURN NULL;
  END IF;

  SELECT e.election_type INTO v_election_type
  FROM public.elections e
  WHERE e.id = v_election_id;

  IF public.nomination_shape_rule(v_election_type, 'candidate') = 'parent_required' THEN
    RAISE EXCEPTION 'Nomination parent required: candidate nomination % in election % has neither a parent nomination nor a requested parent organization',
      NEW.id, v_election_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- enforce_nomination_confirmation: the confirmation transition
--
-- Editing a nomination turns its confirmation off. The system sets the flag, so this is a trigger rather than a policy: a policy can refuse a row but cannot rewrite one. Three rules, in order:
--
--   1. On either verb, a row being confirmed while its custom_data carries `requestedParentOrganization` is refused. A nomination with a NULL parent either stands on its own or waits for a parent that is not in the system yet, a party for a candidate and an alliance for an organization, and that key is the only difference. Confirming such a row would publish as standing on its own a nominee that asked for a parent.
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
  -- Scoped to the population the cap is about: an `authenticated` caller without `project.edit_nominations` inserting an unconfirmed nomination of an organization or of an alliance, the two kinds of row the count holds. Admins may create placeholder parents, and the service-role and owner paths run as other roles.
  IF TG_OP = 'INSERT'
     AND current_user = 'authenticated'
     AND NOT NEW.confirmed
     AND (NEW.organization_id IS NOT NULL OR NEW.alliance_id IS NOT NULL)
     AND NOT public.user_can('project', NEW.project_id, 'project.edit_nominations')
     AND private.caller_unconfirmed_originated_count() >= 10 THEN
    RAISE EXCEPTION 'A caller may originate at most 10 unconfirmed parent nominations; this caller already holds %. An administrator must confirm or reject some before more can be created.',
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
--   INSERT - the eight presentation and bookkeeping columns an administrator alone writes (name, short_name, info, color, image, sort_order, subtype, external_id) must be left unset.
--   UPDATE - those eight and the four entity foreign keys must be unchanged.
--   Both   - `election_symbol` may be set or changed on the caller's own row and on no other.
-- The owner and service-role paths are untouched (current_user is not `authenticated` there), and an admin passes through.
--
-- A row is the caller's own when the caller holds `nomination.edit` on the entity it nominates. That is the question `entity_insert_nominations` and `entity_update_nominations` ask, put to `user_can` at entity scope with the entity type derived from the four foreign keys, because the generated `entity_type` column is NULL in a BEFORE trigger. It is asked only when the symbol is set or changed, and an answer of NULL refuses.
--
-- A placeholder parent row, which `entity_insert_parent_nominations` lets a child nominee insert for an organization, is not the caller's own: the caller holds `nomination.edit` on its own entity and not on the organization that row nominates. So a candidate cannot set a party's symbol through the row it may create for that party.
--
-- A symbol changed by an entity's editor is an edit like any other: rule 2 of `enforce_nomination_confirmation` turns the row's confirmation off, so an administrator reviews the symbol before voters see it.
--
-- Raises insufficient_privilege (42501), the code a column-grant refusal raises, so the caller sees the same error class either way. Both messages begin `Only a holder of project.edit_nominations may `.
--
-- SECURITY INVOKER: a SECURITY DEFINER body reports the owner as current_user, and the role test would never match.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_nomination_entity_columns () RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_symbol_written boolean;
  v_symbol_refused boolean := false;
BEGIN
  IF current_user <> 'authenticated'
     OR public.user_can('project', NEW.project_id, 'project.edit_nominations') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_symbol_written := NEW.election_symbol IS NOT NULL;
  ELSE
    v_symbol_written := NEW.election_symbol IS DISTINCT FROM OLD.election_symbol;
  END IF;

  IF v_symbol_written THEN
    v_symbol_refused := NOT COALESCE(
      public.user_can(
        'entity',
        COALESCE(NEW.candidate_id, NEW.organization_id, NEW.faction_id, NEW.alliance_id),
        'nomination.edit',
        CASE
          WHEN NEW.candidate_id IS NOT NULL THEN 'candidate'::public.entity_type
          WHEN NEW.organization_id IS NOT NULL THEN 'organization'::public.entity_type
          WHEN NEW.faction_id IS NOT NULL THEN 'faction'::public.entity_type
          WHEN NEW.alliance_id IS NOT NULL THEN 'alliance'::public.entity_type
        END
      ),
      false
    );
  END IF;

  IF TG_OP = 'INSERT' AND (
       num_nonnulls(
         NEW.name, NEW.short_name, NEW.info, NEW.color, NEW.image,
         NEW.sort_order, NEW.subtype, NEW.external_id
       ) > 0
       OR v_symbol_refused
     ) THEN
    RAISE EXCEPTION 'Only a holder of project.edit_nominations may set a nomination''s name, short_name, info, color, image, sort_order, subtype or external_id, or the election_symbol of a nomination that is not the caller''s own'
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
       OR NEW.external_id IS DISTINCT FROM OLD.external_id
       OR NEW.candidate_id IS DISTINCT FROM OLD.candidate_id
       OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
       OR NEW.faction_id IS DISTINCT FROM OLD.faction_id
       OR NEW.alliance_id IS DISTINCT FROM OLD.alliance_id
       OR v_symbol_refused
     ) THEN
    RAISE EXCEPTION 'Only a holder of project.edit_nominations may change a nomination''s presentation columns, external_id or entity, or the election_symbol of a nomination that is not the caller''s own'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

--------------------------------------------------------------------------------
-- enforce_entity_immutability: the confirmation gate and the conditional identity freeze
--
-- A confirmed entity's name and short name are frozen for the entity user and stay correctable by a holder of `entity.edit_immutable`. That is a rule about the transition between two row states, which neither a column grant (one global pair per role, blind to the row) nor a policy (`USING` sees only OLD, `WITH CHECK` only NEW) can express. A BEFORE UPDATE row trigger sees both rows in one scope. It follows the shape of `enforce_external_id_immutability` in 500-external-id.sql: an OLD-row condition, an `IS DISTINCT FROM` comparison, a named exception carrying both values, and one body registered on several tables.
--
-- Two rules, in a fixed order:
--
--   1. The confirmation gate. A change to the confirmation flag, in either direction, by an `authenticated` caller who does not hold `entity.confirm` on the row is refused by name. Turning the flag off is refused too, because an entity user who could unconfirm could then rename.
--   2. The conditional freeze, read from the OLD row's flag. When the row was already confirmed before the statement, a change to any column named in TG_ARGV by an `authenticated` caller who does not hold `entity.edit_immutable` on the row is refused by name. Reading the OLD flag means a caller cannot unconfirm and rename in one statement, and because rule 1 runs first, such a statement is refused with the confirmation message.
--
-- The freeze is not absolute: on an unconfirmed row the entity user may still set their own name and short name, which the sign-up flow needs. 19-entity-immutability.test.sql asserts that outcome per protected column per table and pins the OLD-row guard on the function source.
--
-- Both rules bind only the effective `authenticated` role, as rule 2 of `enforce_nomination_confirmation` does. `user_can` reads the grant set from the JWT and a service-role token carries none, so an unscoped rule would refuse every re-seed, bulk import and pgTAP fixture write that changes a name or a confirmation flag. The cost is that the service role can rename a confirmed entity, the same latitude it has against row-level security and the column grants.
--
-- SECURITY INVOKER is required: a SECURITY DEFINER body reports the owner as `current_user`, so the role guard would never match and neither rule would bind.
--
-- The body names no entity type and no protected column. The protected columns arrive per registration in TG_ARGV and are compared through a JSONB projection of both rows, and the entity type is derived from TG_TABLE_NAME, so one body serves all four entity tables. The confirmation column is not a parameter: it has the same name on every entity table and is the subject of rule 1.
--
-- Each refusal starts with a stable prefix, so `throws_like` can match it and a seed log can tell the two apart. Both name the table, the row and both values; the immutability refusal also names the column, and its prefix says "name" for every protected column, the short name included.
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

--------------------------------------------------------------------------------
-- validate_entity_type_list: the shape of the entity type filter of a question and of a question category
--
-- `entity_type` on `questions` and `question_categories` is a filter list: null or an empty array addresses every entity type, and any other value addresses the types it names. The data model compares a member with an entity type by equality, so a member that names no entity type matches nothing, and the row disappears for every contestant and from every voter list that asks by type. A constraint could refuse such a value as widely; a trigger can also say which member was wrong.
--
-- Accepted: SQL null, an empty JSON array, and a JSON array whose every member is a string naming a value of the `entity_type` enum. Refused: every other JSON type, a JSON null included, a member that is not a string, and a string that names no enum value. The members are compared with the enum itself, so the accepted set follows 000-enums.sql.
--
-- The rule binds every writer: it reads no role and no grant, so an API write, a service-role write and bulk_import meet the same refusal. 40-entity-type-list.test.sql asserts each refused value beside an accepted one, per table and per verb.
--
-- Each refusal starts with a stable prefix and names the table, the row and what was found. A member is quoted as JSON and cut at 64 characters, because a member may be an object of any size.
--
-- SECURITY INVOKER with an empty search_path: the body reads only NEW and the enum, which it names with its schema.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_entity_type_list () RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  v_member jsonb;
BEGIN
  IF NEW.entity_type IS NULL THEN
    RETURN NEW;
  END IF;

  IF jsonb_typeof(NEW.entity_type) <> 'array' THEN
    RAISE EXCEPTION 'Invalid entity type list: column %.%.entity_type on row % must be null or a JSON array of entity types, got a JSON %',
      TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.id, jsonb_typeof(NEW.entity_type);
  END IF;

  FOR v_member IN SELECT value FROM jsonb_array_elements(NEW.entity_type)
  LOOP
    IF jsonb_typeof(v_member) <> 'string'
       OR NOT ((v_member #>> '{}') = ANY (enum_range(NULL::public.entity_type)::text[])) THEN
      RAISE EXCEPTION 'Invalid entity type list: column %.%.entity_type on row % holds the member %, which is not one of the entity types %',
        TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.id, left(v_member::text, 64), enum_range(NULL::public.entity_type);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

--------------------------------------------------------------------------------
-- validate_entity_color: the shape of the stored colour of an organization, a candidate, a faction and an alliance
--
-- `color` is in the UPDATE grant of all four entity tables, so an entity's own editor writes it through the API, and the frontend interpolates the stored `normal` and `dark` into an inline `style` attribute on pages a voter opens. A value that is not a colour is therefore CSS of the editor's choosing in another user's browser. This function holds the stored value to one shape where every writer is bound: an API write, a service-role write and bulk_import alike.
--
-- Accepted: SQL null, and a JSON object whose only members are `normal` and `dark`, each absent, a JSON null, or a string that is `#` followed by exactly three or exactly six hexadecimal digits and nothing else. Refused: every other JSON type in place of the object, a JSON null included; a member under any other key; and a member that is not such a string, which covers colour names, functional notation, numbers, the empty string and a hex colour followed by anything at all.
--
-- The pattern is anchored at both ends, and in a PostgreSQL regular expression `$` matches only at the very end of the string, so a line break after the digits is refused as any other trailing character is. It is narrower than the frontend's parser, which also reads a colour without `#` and `rgb(r, g, b)`: every colour a shipped seed stores is of the accepted form, and a string of that form holds a colour and no other CSS.
--
-- The rule reads no role and no grant. 41-entity-color.test.sql asserts each refused value beside an accepted one.
--
-- Each refusal starts with a stable prefix and names the table, the row, the member and what was found. What was found is quoted as JSON and cut at 32 characters, and a key at 32, because the value is the writer's and may be of any length.
--
-- SECURITY INVOKER with an empty search_path: the body reads only NEW.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_entity_color () RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  v_key text;
  v_member jsonb;
BEGIN
  IF NEW.color IS NULL THEN
    RETURN NEW;
  END IF;

  IF jsonb_typeof(NEW.color) <> 'object' THEN
    RAISE EXCEPTION 'Invalid entity color: column %.%.color on row % must be null or a JSON object holding normal and dark, got a JSON %',
      TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.id, jsonb_typeof(NEW.color);
  END IF;

  FOR v_key, v_member IN SELECT key, value FROM jsonb_each(NEW.color)
  LOOP
    IF v_key NOT IN ('normal', 'dark') THEN
      RAISE EXCEPTION 'Invalid entity color: column %.%.color on row % holds the member %, and a color holds only normal and dark',
        TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.id, left(v_key, 32);
    END IF;

    IF jsonb_typeof(v_member) = 'null' THEN
      CONTINUE;
    END IF;

    IF jsonb_typeof(v_member) <> 'string'
       OR (v_member #>> '{}') !~ '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$' THEN
      RAISE EXCEPTION 'Invalid entity color: column %.%.color on row % holds % as its member %, which must be null or # followed by three or six hexadecimal digits',
        TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.id, left(v_member::text, 32), v_key;
    END IF;
  END LOOP;

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
  -- Whether voters can read the project: an anonymous reader sees a row only when this is true, its nomination is confirmed and every entity that nomination links is confirmed. Defaults to false so a new project is not public. seed.sql sets it to true on the local stack's project, and SupabaseAdminClient.ensureProject on the project it ensures. A deployment's project row, this column included, is written by the bootstrap script `infra/scripts/bootstrap.sql`.
  open_for_voters boolean NOT NULL DEFAULT false,
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
  -- Which of the four nomination flows the election runs: whether a candidate picks a party, whether a party nominates a list, and whether the free-text branch is reachable. An election that states none takes the list flow in which a candidate may also stand without a party. A separate axis from `subtype`.
  election_type public.nomination_shape NOT NULL DEFAULT 'organization_list_and_independents',
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
  -- Localized string `{ "<locale>": string }`.
  name jsonb,
  -- Localized string `{ "<locale>": string }`: the abbreviated name.
  short_name jsonb,
  -- Localized string `{ "<locale>": string }`: a longer description.
  info jsonb,
  -- `Colors` from @openvaa/data, as `{ normal?, dark? }`: a hex colour, `#rgb` or `#rrggbb`, for the default theme and for the dark theme (validate_entity_color).
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

-- Refuses a colour that is not null or an object of hex colours under `normal` and `dark`, for every writer; the function is declared in 011-validation-functions.sql.
CREATE TRIGGER validate_entity_color
BEFORE INSERT OR UPDATE OF color ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.validate_entity_color ();

-- Gates the confirmation flag and freezes the name and the short name of a confirmed entity; the function is declared in 011-validation-functions.sql. The `UPDATE OF` list makes the trigger fire only when a statement sets one of these columns, and the arguments name the two protected columns. A protected column is in both lists: one that is an argument only is never checked, because the trigger does not fire for it.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF name,
short_name,
confirmed ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('name', 'short_name');

CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  -- Localized string `{ "<locale>": string }`: the abbreviated name.
  short_name jsonb,
  -- Localized string `{ "<locale>": string }`: a longer description.
  info jsonb,
  -- `Colors` from @openvaa/data, as `{ normal?, dark? }`: a hex colour, `#rgb` or `#rrggbb`, for the default theme and for the dark theme (validate_entity_color).
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

-- Refuses a colour that is not null or an object of hex colours under `normal` and `dark`, for every writer; the function is declared in 011-validation-functions.sql.
CREATE TRIGGER validate_entity_color
BEFORE INSERT OR UPDATE OF color ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.validate_entity_color ();

-- Gates the confirmation flag and freezes the names and the short name of a confirmed candidate; the function is declared in 011-validation-functions.sql. The `UPDATE OF` list makes the trigger fire only when a statement sets one of these columns, so `upsert_answers`, which sets only the answers column, never enters it. The arguments name the three protected columns. A protected column is in both lists: one that is an argument only is never checked, because the trigger does not fire for it.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF first_name,
last_name,
short_name,
confirmed ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('first_name', 'last_name', 'short_name');

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
  -- `Colors` from @openvaa/data, as `{ normal?, dark? }`: a hex colour, `#rgb` or `#rrggbb`, for the default theme and for the dark theme (validate_entity_color).
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

-- Refuses a colour that is not null or an object of hex colours under `normal` and `dark`, for every writer; the function is declared in 011-validation-functions.sql.
CREATE TRIGGER validate_entity_color
BEFORE INSERT OR UPDATE OF color ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.validate_entity_color ();

-- Gates the confirmation flag and freezes the name and the short name of a confirmed entity; the function is declared in 011-validation-functions.sql. The `UPDATE OF` list makes the trigger fire only when a statement sets one of these columns, and the arguments name the two protected columns. A protected column is in both lists: one that is an argument only is never checked, because the trigger does not fire for it.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF name,
short_name,
confirmed ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('name', 'short_name');

CREATE TABLE public.alliances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- Localized string `{ "<locale>": string }`.
  name jsonb,
  -- Localized string `{ "<locale>": string }`: the abbreviated name.
  short_name jsonb,
  -- Localized string `{ "<locale>": string }`: a longer description.
  info jsonb,
  -- `Colors` from @openvaa/data, as `{ normal?, dark? }`: a hex colour, `#rgb` or `#rrggbb`, for the default theme and for the dark theme (validate_entity_color).
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

-- Refuses a colour that is not null or an object of hex colours under `normal` and `dark`, for every writer; the function is declared in 011-validation-functions.sql.
CREATE TRIGGER validate_entity_color
BEFORE INSERT OR UPDATE OF color ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.validate_entity_color ();

-- Gates the confirmation flag and freezes the name and the short name of a confirmed entity; the function is declared in 011-validation-functions.sql. The `UPDATE OF` list makes the trigger fire only when a statement sets one of these columns, and the arguments name the two protected columns. A protected column is in both lists: one that is an argument only is never checked, because the trigger does not fire for it.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF name,
short_name,
confirmed ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('name', 'short_name');
-- Question categories and questions
--
-- Includes two validation triggers: choice-type questions must have a valid choices array, and the entity type filter of a question and of a category must be null or an array of entity types.
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

-- Refuses an entity type filter that is not null or a JSON array of entity types, for every writer; the function is declared in 011-validation-functions.sql.
CREATE TRIGGER validate_entity_type_list
BEFORE INSERT OR UPDATE OF entity_type ON public.question_categories FOR EACH ROW
EXECUTE FUNCTION public.validate_entity_type_list ();

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

-- Refuses an entity type filter that is not null or a JSON array of entity types, for every writer; the function is declared in 011-validation-functions.sql.
CREATE TRIGGER validate_entity_type_list
BEFORE INSERT OR UPDATE OF entity_type ON public.questions FOR EACH ROW
EXECUTE FUNCTION public.validate_entity_type_list ();

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
  -- A free-form JSON object, read by the frontend as `customData`; `requestedParentOrganization` holds the name of a parent that is not in the system, a party a candidate asked for or an alliance an organization asked for, and blocks confirmation.
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
  -- `NULLS NOT DISTINCT` is what makes the constraint catch anything: every row has three null entity foreign keys and every top-level nomination a null parent, so a plain UNIQUE would never find two rows equal. It needs PostgreSQL 15 or later (`supabase/config.toml` declares 17), and the applied database is checked through `pg_index.indnullsnotdistinct`.
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

-- Holds a candidate's nomination to having a parent nomination or naming a requested party, where the election's type requires one. Deferred to the end of the transaction, so that a writer may insert the candidate's row first and attach its party's row in a later statement.
CREATE CONSTRAINT TRIGGER nominations_parent_required
AFTER INSERT OR UPDATE ON public.nominations
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW WHEN (
  NEW.candidate_id IS NOT NULL
  AND NEW.parent_nomination_id IS NULL
)
EXECUTE FUNCTION public.validate_nomination_parent_required ();
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
  -- `StoredCustomization` from @openvaa/app-shared: localized publisher copy, image paths, translation overrides and the contestant-app FAQ.
  customization jsonb DEFAULT '{}'::jsonb,
  -- The import key bulk_import matches rows by; unique per project and unchangeable once set (500-external-id.sql).
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.app_settings FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

--------------------------------------------------------------------------------
-- contestant_app_public_config: what may any visitor know about a project's Contestant app?
--
-- The entry screens of the Contestant app need five stored values before anyone has signed in: whether the app is accessible, whether answers are locked, which entity types it serves, which registration modes each type allows, and whether usage events are tracked, so that the sign-in screen follows the stored tracking setting rather than the shipped default. A project is normally closed for voters while its contestants register, and a caller who can read no settings row of a closed project (anon, or a signed-in caller holding no grant there) gets those five values from this function. SECURITY DEFINER is what lets it read past the row-level security of public.app_settings.
--
-- Returns one object with exactly five values, placed at their storage paths: `access.contestantApp`, `access.answersLocked`, `contestantApp.entityTypes`, `contestantApp.registrationModes` and `analytics.trackEvents`. Each is returned as stored, unvalidated, and null where unset; the caller validates them. It never returns the row, and no other member of `settings` is reachable through it.
--
-- It is no existence oracle: a project with no settings row, a project that declares none of the five values and an id that names no project all answer the same all-null object.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.contestant_app_public_config (p_project_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT jsonb_build_object(
    'access', jsonb_build_object(
      'contestantApp', v.settings #> '{access,contestantApp}',
      'answersLocked', v.settings #> '{access,answersLocked}'
    ),
    'analytics', jsonb_build_object('trackEvents', v.settings #> '{analytics,trackEvents}'),
    'contestantApp', jsonb_build_object(
      'entityTypes', v.settings #> '{contestantApp,entityTypes}',
      'registrationModes', v.settings #> '{contestantApp,registrationModes}'
    )
  )
  FROM (SELECT (SELECT s.settings FROM public.app_settings s WHERE s.project_id = p_project_id) AS settings) v;
$$;

-- The frontend adapter calls this function over PostgREST, as anon and as authenticated, when the caller can read no settings row of a closed project, so the grant is declared here rather than inherited from default privileges. 38-contestant-app-public-config.test.sql asserts both rights.
GRANT
EXECUTE ON FUNCTION public.contestant_app_public_config (uuid) TO anon,
authenticated;
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
  -- The key `private.feedback_client_ip` derives from the request headers, or `unknown`.
  ip_address text PRIMARY KEY,
  -- Requests from the address in the current window.
  count integer NOT NULL DEFAULT 1,
  -- When the current window began; check_feedback_rate_limit starts a new one after five minutes.
  window_start timestamptz NOT NULL DEFAULT now()
);

--------------------------------------------------------------------------------
-- Per-deployment settings that migrations cannot know
--
-- A single row: the `singleton` key admits only `true`. `behind_cloudflare` states that every request reaches the API through Cloudflare, which sets `cf-connecting-ip` itself to the connecting client. Its only reader is `check_feedback_rate_limit`, which trusts `cf-connecting-ip` only when it is true.
--
-- The migration ships it false. Hosted Supabase is behind Cloudflare, so a hosted deployment needs it true. A self-hosted gateway qualifies only when its origin accepts connections from Cloudflare alone; otherwise a client can send its own `cf-connecting-ip`. A deployment's value is written by the bootstrap script `infra/scripts/bootstrap.sql`, and the local stack's by seed.sql.
--
-- Only the owner reads or writes it: the SECURITY DEFINER trigger reads it, seed.sql writes the local stack's row, and the bootstrap script writes a deployment's. RLS is enabled with no policy and every API role's privileges are revoked.
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS private.deployment_settings (
  -- The primary key, which only `true` passes, so the table holds at most one row.
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  -- True when every request reaches the API through Cloudflare.
  behind_cloudflare boolean NOT NULL DEFAULT false
);

INSERT INTO
  private.deployment_settings
DEFAULT VALUES
ON CONFLICT DO NOTHING;

ALTER TABLE private.deployment_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE private.deployment_settings
FROM
  PUBLIC,
  anon,
  authenticated,
  service_role;

--------------------------------------------------------------------------------
-- The client address the feedback rate limit is keyed on
--
-- With `p_trust_cf_connecting_ip` true, the key is `cf-connecting-ip` when it parses as an address, otherwise the last `x-forwarded-for` entry when that parses, otherwise `unknown`. With it false, `cf-connecting-ip` is not read and the key is the last `x-forwarded-for` entry or `unknown`. The value is normalised with `host()`. The flag has no default, so every caller decides.
--
-- `check_feedback_rate_limit` passes `private.deployment_settings.behind_cloudflare`. Behind Cloudflare, `cf-connecting-ip` is the connecting client and a client cannot choose it. Without Cloudflare in front, as on the local CLI stack or most self-hosted gateways, Kong forwards a client-sent `cf-connecting-ip` unchanged, so an untrusted deployment keys on the gateway-appended hop instead.
--
-- The gateway appends the last `x-forwarded-for` entry from the connection's peer; the earlier entries are written by the client and are never read, not even when the last entry is malformed. On hosted Supabase the last entry can be a platform-internal address shared by many voters, so a hosted deployment that leaves `behind_cloudflare` false collapses those voters into one bucket. That is why hosted deployments must set it.
--
-- Only the SECURITY DEFINER trigger `check_feedback_rate_limit` calls this function, so EXECUTE is revoked from PUBLIC here, and from the API roles after the blanket `private` grant in 301-auth-functions.sql.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.feedback_client_ip (p_headers json, p_trust_cf_connecting_ip boolean) RETURNS text LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  p_candidate text;
BEGIN
  IF p_headers IS NULL THEN
    RETURN 'unknown';
  END IF;

  IF p_trust_cf_connecting_ip THEN
    p_candidate := NULLIF(btrim(p_headers ->> 'cf-connecting-ip'), '');
    IF p_candidate IS NOT NULL THEN
      BEGIN
        RETURN host(p_candidate::inet);
      EXCEPTION
        WHEN invalid_text_representation THEN
          NULL;
      END;
    END IF;
  END IF;

  p_candidate := NULLIF(btrim(split_part(p_headers ->> 'x-forwarded-for', ',', -1)), '');
  IF p_candidate IS NOT NULL THEN
    BEGIN
      RETURN host(p_candidate::inet);
    EXCEPTION
      WHEN invalid_text_representation THEN
        NULL;
    END;
  END IF;

  RETURN 'unknown';
END;
$$;

REVOKE
EXECUTE ON FUNCTION private.feedback_client_ip (json, boolean)
FROM
  PUBLIC;

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
  p_client_ip         text;
  p_behind_cloudflare boolean;
  p_current_count     integer;
  p_window_secs       interval := interval '5 minutes';
  p_max_requests      integer  := 5;
BEGIN
  -- A missing settings row reads as false, so cf-connecting-ip is then not trusted.
  p_behind_cloudflare := COALESCE((SELECT behind_cloudflare FROM private.deployment_settings), false);
  p_client_ip := private.feedback_client_ip(current_setting('request.headers', true)::json, p_behind_cloudflare);

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

-- feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_project_id ON public.feedback (project_id);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback (created_at);

-- admin_jobs indexes
CREATE INDEX IF NOT EXISTS idx_admin_jobs_project_id ON public.admin_jobs (project_id);

CREATE INDEX IF NOT EXISTS idx_admin_jobs_election_id ON public.admin_jobs (election_id);

CREATE INDEX IF NOT EXISTS idx_admin_jobs_job_type ON public.admin_jobs (job_type);
-- The grant model: `public.grants`, its constraints, its indexes, its RLS and the access-token hook's schema access.
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
  -- NULLS NOT DISTINCT because target_type is null on every non-entity grant: a plain UNIQUE would admit two identical grants, and revoking one would leave the privilege standing. It needs PostgreSQL 15 or later, as in 104-nominations.sql.
  CONSTRAINT grants_user_scope_target_role_key UNIQUE NULLS NOT DISTINCT (user_id, scope, target_type, target_id, role),
  -- The entity kind is present exactly when the scope is entity. Both sides are non-null booleans, so a NULL cannot pass the check. Named so a pgTAP `throws_ok` can match it.
  CONSTRAINT grants_entity_scope_target_type_check CHECK ((target_type IS NOT NULL) = (scope = 'entity')),
  -- A global grant has no target, and an account, project or entity grant must have one. Named for the same reason.
  CONSTRAINT grants_target_id_scope_check CHECK ((target_id IS NULL) = (scope = 'global'))
);

-- The reverse lookup, who holds a grant on this target, which editor administration needs and the UNIQUE cannot serve because it leads with user_id. No index on user_id alone: the UNIQUE leads with it, which covers the foreign key for lint-schema.mjs's unindexed-foreign-key advisor, and a second index would cost every write.
CREATE INDEX idx_grants_scope_target ON public.grants (scope, target_type, target_id);

-- A candidate has at most one editor, because a candidate-scope user is the candidate. Organizations admit several editors, and an `admin`-role entity grant is outside the index. Nothing at write time stops one user editing two candidates in one project, and get_user_entities returns every one of them. A second user's editor grant on a candidate is refused naming this index, while an exact duplicate grant is refused naming grants_user_scope_target_role_key, which is checked first.
CREATE UNIQUE INDEX idx_grants_one_candidate_editor ON public.grants (target_id)
WHERE
  scope = 'entity'
  AND target_type = 'candidate'
  AND role = 'editor';

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
-- Depends on: 300-auth-tables.sql (grants table), 106-app-settings.sql (app_settings table), auth.users (Supabase Auth)
--
-- Functions:
-- - custom_access_token_hook(jsonb) - projects public.grants into the JWT `grants` claim
-- - send_email_hook(jsonb) - takes every mail the auth service would send and sends none
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
-- - private.nomination_id_in_contest(entity_type, uuid, uuid, uuid, integer) - the id of an entity's nomination at a contest
-- - private.caller_nominated_in_contest(uuid, uuid, integer, grant_permission, entity_type[]) - whether the caller holds a permission on an entity of one of the named types nominated at a contest
-- - private.caller_unconfirmed_originated_count() - how many unconfirmed organization and alliance nominations the caller has originated
-- - private.caller_entity_ids(uuid, entity_type) - the entities of one type, in one project, the caller holds an editor grant on; called by get_user_entities and get_entity_user_data
-- - private.user_password_set(uuid) - whether an account holds a password; executable by no API role
-- - private.caller_password_set() - whether the caller's own account holds a password; called by get_user_entities
-- - private.registration_mode_allowed_in(jsonb, text, text) - the registration-mode rule over stored settings; reads no table
-- - private.registration_mode_allowed(uuid, text, text) - the rule over one project's settings row; executable by no API role
--
-- The two public-visibility terms are each defined once here and called directly by the eight entity SELECT policies.
--------------------------------------------------------------------------------
-- The `private` schema: SECURITY DEFINER helpers for policies and INVOKER functions
--
-- Every SECURITY DEFINER function in `public` is published by PostgREST as `/rest/v1/rpc/<name>`, and Supabase's default privileges make it executable by `anon` and `authenticated`. The hierarchy and visibility hops below answer questions row-level security would refuse the caller directly, such as which project an arbitrary entity id belongs to, so published as RPCs they would be cross-tenant oracles.
--
-- Revoking EXECUTE is not the fix, because a policy expression runs with the querying role's privileges and would fail with `permission denied`. The helpers therefore live in `private`, which is not in PostgREST's exposed schemas (config.toml `[api] schemas`), while the API roles keep USAGE and EXECUTE so policies and SECURITY INVOKER functions, which both run as the caller, can call them. Every call site qualifies the name, so no search_path decides which function runs.
--
-- What stays in `public`: `user_can` (the Edge Functions call it over RPC) and `user_has_account_grant`, which answer only about the caller's own claim; `grant_role_permissions` (the matrix, no row data); `project_open_for_voters` (the frontend calls it); `contestant_app_public_config` in 106-app-settings.sql (the frontend calls it, and it returns four fixed settings values and never a row); and the two storage path helpers (caller-scoped or public by definition). 07-rpc-security.test.sql holds a census of every anon- and authenticated-executable SECURITY DEFINER function in `public`, so a new one has to be added there on purpose.
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
-- Send Email Hook: called by Supabase Auth in place of sending a mail, for every mail the service would send (a one-time code, a recovery, a change of address, an invitation). It sends none and returns an empty object, which the service reads as success.
--
-- It reads nothing of the event, which holds an address and a token, writes nothing and logs nothing. Every mail of the application is sent by the account-access Edge Function, behind its own checks, throttle and texts. The hook stops the service's mail and nothing else: what the service answers to a request is unchanged.
--
-- config.toml `[auth.hook.send_email]` names it; `yarn assert:auth-signup-closed` requires that table. 07-rpc-security.test.sql asserts it executable by supabase_auth_admin and by no API role.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.send_email_hook (event jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT '{}'::jsonb;
$$;

GRANT
EXECUTE ON FUNCTION public.send_email_hook TO supabase_auth_admin;

REVOKE
EXECUTE ON FUNCTION public.send_email_hook
FROM
  PUBLIC,
  anon,
  authenticated,
  service_role;

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

    -- OrganizationEditor: the entity set, plus entity.invite_children, which only this role holds. nomination.create_parent is in it because an organization creates the nomination of the alliance it stands under.
    WHEN (p_scope, p_role, p_target_type) = ('entity', 'editor', 'organization') THEN ARRAY[
      'project.read_structure',
      'entity.edit_answers',
      'entity.read_answers',
      'entity.invite_children',
      'nomination.edit',
      'nomination.read',
      'nomination.create_parent'
    ]::public.grant_permission[]

    -- Candidate, FactionEditor and AllianceEditor share one row, nomination.create_parent included. Their nomination rights hold only while the project is unlocked, but the lock is row state, so the nomination policies check it and the matrix does not. Which row a holder of nomination.create_parent may create is likewise the parent policy's question: it pairs the row's type with the caller's, and no row's type admits an alliance's editor.
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
-- Anon-readable means the entity policy's own predicate, so both policies give one answer. Each arm restates its table's anon SELECT policy, and the biconditional assertion in 16-anon-visibility.test.sql (no nomination visible to anon whose linked entity is not) fails when the two disagree.
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
-- It answers "may this role do this verb to this object", not "is the object in a state that admits the verb". The nominations lock, open_for_voters and the confirmation flags are conjuncts of the policies that call it, not members of the matrix.
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
-- The lock is the app setting `access.nominationsLocked`, stored in the project's row of public.app_settings. It is a stored setting rather than a member of the permission matrix, so it is a conjunct of the nomination policies and this function is the hop they call.
--
-- It answers at two levels. The outer one returns true (locked) when the project row is not found, so a missing project never unlocks anything; project_open_for_voters denies with false because its sense is the other way round. The inner one returns false (unlocked) when the project has no settings row or the row does not hold the key, which is the shipped default of the setting.
--
-- Only the JSON boolean true locks. The value is compared as jsonb, so the string "true", a number, a JSON null and an `access` member that is not an object are all unlocked; a comparison of the extracted text would read the string as locked.
--
-- SECURITY DEFINER because public.projects and public.app_settings both have row-level security enabled, and an inline read would also ask whether the caller can see the project and its settings row.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.project_nominations_locked (p_project_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (
      SELECT COALESCE(
        (SELECT s.settings #> '{access,nominationsLocked}' = 'true'::jsonb
           FROM public.app_settings s
          WHERE s.project_id = p.id),
        false
      )
      FROM public.projects p
      WHERE p.id = p_project_id
    ),
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
-- nomination_id_in_contest: which nomination does this entity hold at this contest?
--
-- Answers the id of the entity's nomination at this election, constituency and round, by the match of `nomination_exists_in_contest`: the entity type against the generated entity_type column and the entity id against the four foreign keys. A writer that points a child's nomination at its parent's asks it for the parent's id.
--
-- SECURITY DEFINER because the caller may be unable to read the row. A parent's nomination the caller has just created through `entity_insert_parent_nominations` nominates an entity the caller holds no `nomination.read` on, so neither `INSERT ... RETURNING` nor a `SELECT` of the caller's own gives its id.
--
-- Returns NULL when the entity holds no nomination at the contest.
--
-- An entity can hold several nominations at one contest, because the uniqueness key includes the parent: an organization may stand there on its own and under an alliance, or under two alliances. The answer is then the nomination with no parent first, then the oldest by created_at, then the lowest id. 23-nominations-write.test.sql pins each step of that order.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.nomination_id_in_contest (
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_election_id uuid,
  p_constituency_id uuid,
  p_election_round integer
) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT n.id
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
  ORDER BY (n.parent_nomination_id IS NOT NULL), n.created_at, n.id
  LIMIT 1;
$$;

--------------------------------------------------------------------------------
-- caller_nominated_in_contest: does the caller hold a named permission on an entity of one of the named types that is nominated at this contest?
--
-- Asks whether there is a nomination at this contest whose entity is of one of p_caller_types and on which the caller holds p_permission. The permission's answer comes from `user_can`, so no cell of the matrix is written down a second time. The entity is named by the nomination's generated entity_type and its one set foreign key.
--
-- p_caller_types is what pairs a row with the caller that may create it. `entity_insert_parent_nominations` passes the types of entity that stand under the row being inserted, so holding the permission on an entity of another type nominated at the contest does not answer yes. A NULL or empty array answers false.
--
-- A row-level WITH CHECK sees only the row being inserted, so "the caller is inserting their own nomination in the same transaction" cannot be expressed here. The order of the three statements a child writes makes that moot: its own nomination with no parent, then the parent's nomination, then its own nomination pointed at the parent's. Where the election's type requires the child's nomination to have a parent, `validate_nomination_parent_required` judges the first row when the transaction ends, after the third statement has given it one.
--
-- Denies (returns false) when no row is found.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.caller_nominated_in_contest (
  p_election_id uuid,
  p_constituency_id uuid,
  p_election_round integer,
  p_permission public.grant_permission,
  p_caller_types public.entity_type[]
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nominations n
    WHERE n.election_id = p_election_id
      AND n.constituency_id = p_constituency_id
      AND n.election_round IS NOT DISTINCT FROM p_election_round
      AND n.entity_type = ANY (p_caller_types)
      AND public.user_can(
            'entity',
            COALESCE(n.candidate_id, n.organization_id, n.faction_id, n.alliance_id),
            p_permission,
            n.entity_type
          )
  );
$$;

--------------------------------------------------------------------------------
-- caller_unconfirmed_originated_count: how many unconfirmed organization and alliance nominations has this caller originated?
--
-- The subject of the cap: rows with `created_by = auth.uid()` that nominate an organization or an alliance and are still unconfirmed. Those are the two kinds of row `entity_insert_parent_nominations` admits. Whose entity a row nominates is not asked, so an unconfirmed nomination the caller inserted for an organization or an alliance it edits counts as a placeholder for another's does. A confirmed row leaves the count, so the cap bounds the queue rather than a lifetime total.
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
    AND (n.organization_id IS NOT NULL OR n.alliance_id IS NOT NULL)
    AND NOT n.confirmed;
$$;

--------------------------------------------------------------------------------
-- caller_entity_ids: which entities of this type, in this project, does the caller edit?
--
-- Returns the target ids of the caller's own `(entity, <type>, <id>, editor)` rows in public.grants whose entity lies in p_project_id. get_user_entities calls it to list the caller's entities and get_entity_user_data to decide whether one entity is the caller's. It reads the table rather than the caller's token, so a grant written after the token was issued already counts.
--
-- Only the `editor` role is read and `user_can` is not called: user_can answers yes for project, account and global admins, and an entity-scope `admin` grant confers nothing, so neither names an entity the caller is.
--
-- SECURITY DEFINER because public.grants is revoked from every API role. The entity's project is probed inline, one EXISTS per entity table, rather than through entity_project_id, because a SECURITY DEFINER function is never inlined and nesting one inside another pays that per-row cost twice.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.caller_entity_ids (
  p_project_id uuid,
  p_entity_type public.entity_type
) RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT g.target_id
  FROM public.grants g
  WHERE g.user_id = (SELECT auth.uid())
    AND g.scope = 'entity'
    AND g.role = 'editor'
    AND g.target_type = p_entity_type
    AND CASE p_entity_type
      WHEN 'candidate' THEN EXISTS (SELECT 1 FROM public.candidates e WHERE e.id = g.target_id AND e.project_id = p_project_id)
      WHEN 'organization' THEN EXISTS (SELECT 1 FROM public.organizations e WHERE e.id = g.target_id AND e.project_id = p_project_id)
      WHEN 'faction' THEN EXISTS (SELECT 1 FROM public.factions e WHERE e.id = g.target_id AND e.project_id = p_project_id)
      WHEN 'alliance' THEN EXISTS (SELECT 1 FROM public.alliances e WHERE e.id = g.target_id AND e.project_id = p_project_id)
    END;
$$;

-- Policies and SECURITY INVOKER functions evaluate as the querying role, so the API roles need EXECUTE on the private helpers; PostgREST cannot reach them because `private` is not an exposed schema. Stated explicitly rather than inherited from PostgreSQL's default PUBLIC grant, so the dependency is visible here. The statement reaches only the functions defined before it.
GRANT
EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO anon,
authenticated,
service_role;

-- The grant above also reaches `private.feedback_client_ip` (107-feedback.sql). No policy calls it; only the SECURITY DEFINER trigger `check_feedback_rate_limit` does, so the API roles get no EXECUTE on it.
REVOKE
EXECUTE ON FUNCTION private.feedback_client_ip (json, boolean)
FROM
  anon,
  authenticated,
  service_role;

--------------------------------------------------------------------------------
-- user_password_set: does this account hold a password?
--
-- True when the user's `encrypted_password` in auth.users is neither null nor the empty string, false otherwise and for an id that names no user.
--
-- It reads true for accounts whose owner never chose a password: the auth service stores the hash of a generated password for an account created by a service-side `createUser`, for a new account created by a `magiclink` link, and when an `invite` token is verified. True therefore means that the account holds some password, not that its owner chose one; a caller that needs the second has to record it itself.
--
-- It takes the id of any account, so no API role may execute it: published to one, it would say whether somebody else's account has a password. Only definer functions call it, as their owner and for `auth.uid()`: private.caller_password_set below and claim_invitations in 506-invitation-rpcs.sql. It is defined after the grant on the `private` schema above, which therefore does not reach it, and the REVOKE takes away the EXECUTE PostgreSQL gives PUBLIC on every new function.
--
-- SECURITY DEFINER because no API role can read auth.users.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.user_password_set (p_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (SELECT NULLIF(u.encrypted_password, '') IS NOT NULL FROM auth.users u WHERE u.id = p_user_id),
    false
  );
$$;

REVOKE
EXECUTE ON FUNCTION private.user_password_set (uuid)
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- caller_password_set: does the caller's own account hold a password?
--
-- Answers private.user_password_set for `auth.uid()`. It takes no argument, so it answers for nobody else: there is nothing a caller could pass to point it at another account. get_user_entities in 503-entity-rpcs.sql calls it for its `password_set` key.
--
-- It returns null for a caller that is not signed in: with no account to read there is no fact, and null is neither "set" nor "not set".
--
-- `authenticated` alone holds EXECUTE, stated here because the grant on the `private` schema above does not reach a function defined after it. get_user_entities runs with its caller's rights, so the role that may call it must be able to call this one.
--
-- SECURITY DEFINER because it reads auth.users, which no API role can.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.caller_password_set () RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT CASE
    WHEN (SELECT auth.uid()) IS NOT NULL THEN private.user_password_set((SELECT auth.uid()))
  END;
$$;

REVOKE
EXECUTE ON FUNCTION private.caller_password_set ()
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION private.caller_password_set () TO authenticated;

--------------------------------------------------------------------------------
-- registration_mode_allowed_in: may entities of this type register with this mode, under these stored settings?
--
-- The registration-mode rule, as a function of the stored settings alone. It reads `contestantApp.entityTypes` and `contestantApp.registrationModes` of p_settings and no table:
-- - the entity type must be `candidate` or `organization` and the mode one of `identity_provider`, `email` and `code`;
-- - the type must be served: listed in the stored list of entity types when that list is an array naming at least one of the two types, and otherwise `candidate` alone is served;
-- - the stored matrix must be an object, the type's row in it an array, and the array must hold the mode.
-- Everything else is false: settings that are null or store nothing, a matrix or a row of another JSON type, a row for a type that is not served, and a null argument.
--
-- `isRegistrationModeAllowed` in @openvaa/app-shared is the same rule for the screens. 45-registration-mode-matrix.test.sql holds one table of rows that this function is asserted against, and a unit test asserts the TypeScript accessor against the same rows.
--
-- Only private.registration_mode_allowed below calls it, as its owner, so no API role holds EXECUTE: the REVOKE takes away the EXECUTE PostgreSQL gives PUBLIC on every new function, and the grant on the `private` schema above does not reach a function defined after it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.registration_mode_allowed_in (p_settings jsonb, p_entity_type text, p_mode text) RETURNS boolean LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT COALESCE(
    p_entity_type IN ('candidate', 'organization')
    AND p_mode IN ('identity_provider', 'email', 'code')
    AND CASE
      WHEN jsonb_typeof(c.entity_types) = 'array' AND (c.entity_types ? 'candidate' OR c.entity_types ? 'organization')
        THEN c.entity_types ? p_entity_type
      ELSE p_entity_type = 'candidate'
    END
    AND jsonb_typeof(c.modes) = 'object'
    AND jsonb_typeof(c.modes -> p_entity_type) = 'array'
    AND (c.modes -> p_entity_type) ? p_mode,
    false
  )
  FROM (
    SELECT
      p_settings #> '{contestantApp,entityTypes}' AS entity_types,
      p_settings #> '{contestantApp,registrationModes}' AS modes
  ) c;
$$;

REVOKE
EXECUTE ON FUNCTION private.registration_mode_allowed_in (jsonb, text, text)
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- registration_mode_allowed: does this project allow this registration mode for this entity type?
--
-- Answers private.registration_mode_allowed_in for the settings of p_project_id's row in public.app_settings, and false when the project has no row. private.invitation_mode_allowed in 506-invitation-rpcs.sql calls it for an invitation's project, target type and mode.
--
-- No API role holds EXECUTE: it answers for any project, a closed one included, and only definer functions call it, as their owner.
--
-- SECURITY DEFINER because it reads app_settings of a project the caller may not read.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.registration_mode_allowed (
  p_project_id uuid,
  p_entity_type text,
  p_mode text
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (
      SELECT private.registration_mode_allowed_in(s.settings, p_entity_type, p_mode)
      FROM public.app_settings s
      WHERE s.project_id = p_project_id
    ),
    false
  );
$$;

REVOKE
EXECUTE ON FUNCTION private.registration_mode_allowed (uuid, text, text)
FROM
  PUBLIC,
  anon,
  authenticated;
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
-- The twenty policies below are four copies of one shape, differing only in the table name and the entity-type literal. 18-entity-policies.test.sql asserts this structurally: each policy family's four expressions are one string once those two are normalised away.
--
-- Permissions used on the entity tables:
-- - project.read_entities: the SELECT policies' project disjunct, held by the root, account and project admins and by project editors.
-- - project.edit_entities: the INSERT, admin UPDATE and DELETE policies, held by the same four.
-- - entity.read_answers: the SELECT policies' own-row disjunct, held on its own row by an entity grant.
-- - entity.edit_answers: the self-update policies, held on its own row by an entity grant.
--
-- An entity grantee holds neither project permission, so it cannot reach another entity of its project through a project-scope call. For an entity grant, user_can's reach is equality with the granted entity, type and id both, so "is this row mine" needs no column comparison. Each entity policy passes its own table's entity type.
--
-- A parent entity's reach to its child nominee is not a row disjunct and must not become one: a SELECT policy returns every column, `answers` included. That reach is served by public.get_entity_basic_data (503-entity-rpcs.sql), which is gated on `nomination.read` and returns an allow-listed projection; 18-entity-policies.test.sql asserts the parent cannot SELECT the child's row.
--
-- Row state (`confirmed`, open for voters) appears only in the public disjunct, never beside a grant, because user_can answers whether a role may apply a permission, not whether the row's state admits it. An entity grantee therefore reads and edits its own unconfirmed row, which the sign-up flow needs; name immutability on a confirmed entity is enforced by a trigger.
--
-- The public disjunct is assembled inline in all eight entity SELECT policies rather than composed into one function: a SECURITY DEFINER function cannot be inlined by the planner, so a composing function adds a per-row call and is several times slower. The two sub-rules keep a single definition each; 25-matrix-conformance.test.sql holds the eight assemblies identical, and 16-anon-visibility.test.sql holds the behavioural guards for the open-for-voters conjunct.
--
-- The `admin_*` policies also admit project editors, who hold project.edit_entities; the prefix is kept because every table's policies share it.
-- =====================================================================
-- organizations (project_id, confirmed)
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
-- candidates (project_id)
-- =====================================================================
-- Answers are stored in the JSONB `answers` column, so these row policies govern them too.
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "candidates_deny_all" ON public.candidates;

-- Anon: three conjuncts, the same three as every other entity table, each load-bearing and each flipped alone against an otherwise-visible row in 16-anon-visibility.test.sql. The project is open for voters; the candidate is confirmed; a confirmed nomination links it in this project, so confirming a nomination alone cannot publish a placeholder identity.
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

-- Entity self-update: whoever holds `entity.edit_answers` on this row may update it. For an entity grant user_can's reach is equality with the granted entity, type and id both.
--
-- The `'entity'` scope literal is the whole safety argument: written `'project'`, it would let any entity editor in the project rewrite every candidate in it. 18-entity-policies.test.sql asserts that same-type, same-project denial.
--
-- Structural columns (project_id, external_id, ...) are protected by this table's column grants in 303-column-grants.sql, because row-level security cannot admit a row while withholding a column.
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

-- Authenticated read: the same two-term disjunction as question_categories. `get_questions` (505-question-rpcs.sql) is SECURITY INVOKER, so this policy and the category one gate the whole question surface of the voter and contestant apps, and a predicate one term too narrow renders no questions rather than raising an error.
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

-- Anon: the project is open for voters, the nomination is confirmed, and every entity it links is anon-readable, so this policy and the entity policies give one answer.
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

-- Entity insert of a parent's nomination: a child nominee whose parent has no nomination at their contest may create one, unconfirmed, for an admin to resolve. A candidate's editor and a faction's editor create an organization's nomination, and an organization's editor creates an alliance's. `nomination.create_parent` is a separate permission from `nomination.edit`, so the capability can be revoked and tested on its own instead of widening `nomination.edit` beyond the caller's own row.
--
-- This deliberately admits rows that are not the caller's own, so each guard is load-bearing: without any one of them an authenticated entity editor could write rows into the public nomination table, and an over-permissive policy fails no read test. 23-nominations-write.test.sql asserts each guard.
-- - Guard 1: the row nominates an organization or an alliance. A candidate's row and a faction's row are never admitted here.
-- - Guard 2: it is created unconfirmed; the column grant is the second line of defence.
-- - Guard 3: no nomination exists for the row's own entity at that election, constituency and round. It is asked with the row's generated `entity_type` and its organization or alliance id, so an alliance's row is checked as an organization's is. The unique key includes the parent, so it does not see an organization already nominated under an alliance; the key only settles concurrent inserts.
-- - Guard 4: the project's nominations are not locked.
-- - Guard 5, the pairing: the caller already holds a nomination at that contest whose entity grants `nomination.create_parent` and is of a type that stands under the row's entity: a candidate or a faction for an organization's row, an organization for an alliance's. Without the types, a candidate's editor could create an alliance's row and an organization's editor another organization's. A faction's nomination always stands under its own organization's, so the organization's row a faction's editor can create is another organization's. The types are chosen by whether the row is an alliance's and by nothing else, so this guard does not silently do guard 1's job and mask guard 1's removal.
-- - Cap: the caller may have originated at most 10 unconfirmed organization and alliance nominations, so an editor cannot create placeholders for unrelated parties and alliances at will. `enforce_nomination_confirmation` raises the error that names the limit, because a policy refusal names only the policy.
-- - Project agreement: the row's entity belongs to the row's project. Its argument is the coalesced entity rather than `organization_id`, so it does not silently do guard 1's job and mask guard 1's removal. It is scoped to this policy rather than the table because 07-rpc-security.test.sql inserts such a row deliberately as a negative control.
--
-- Every lookup is a SECURITY DEFINER helper: three guards read `public.nominations` from a policy on `public.nominations`, and the inline form raises `infinite recursion detected in policy for relation "nominations"`.
CREATE POLICY "entity_insert_parent_nominations" ON public.nominations FOR INSERT TO authenticated
WITH
  CHECK (
    (
      organization_id IS NOT NULL
      OR alliance_id IS NOT NULL
    )
    AND NOT confirmed
    AND NOT (
      SELECT
        private.nomination_exists_in_contest (
          entity_type,
          COALESCE(organization_id, alliance_id),
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
          'nomination.create_parent',
          CASE
            WHEN alliance_id IS NOT NULL THEN ARRAY['organization']::public.entity_type[]
            ELSE ARRAY['candidate', 'faction']::public.entity_type[]
          END
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

-- Entity delete of its own nomination, confirmed or not: the `USING` clause of `entity_update_nominations`.
-- - `nomination.edit` on the row's entity, with the four entity foreign keys coalesced and the row's generated `entity_type` naming the type. A row the caller created for another entity is not the caller's own: the placeholder parent that `entity_insert_parent_nominations` admits nominates an organization the caller holds no permission on, and who created a row is not asked.
-- - The project's nominations are not locked, read through `private.project_nominations_locked` as the entity insert and update policies read it.
--
-- The foreign key on `parent_nomination_id` is ON DELETE NO ACTION, so it refuses the delete while a nomination is listed under the row, whoever asks.
--
-- 23-nominations-write.test.sql asserts each conjunct in both directions.
CREATE POLICY "entity_delete_nominations" ON public.nominations FOR DELETE TO authenticated USING (
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

-- Update: `project.edit_app_settings`. The settings permissions split by table: `project.edit_project_settings` governs `projects` and is admin-only, while this permission governs `app_settings` and project editors hold it too. One key of `app_settings.settings` is read by a policy: `access.nominationsLocked` is the nominations lock, a conjunct of the entity-user policies on `nominations`. Whoever holds this permission, project editors among them, may therefore lock and unlock nominations.
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

-- Authenticated: insert only (contestant app also submits feedback; rate-limit trigger + CHECK constraint gate the insert regardless of role)
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
-- - id - primary key, immutable
-- - sort_order - presentation order, admin-controlled
-- - created_at - audit field, maintained by the database
-- - updated_at - audit field, maintained by the set_updated_at trigger
-- - external_id - the import identity, owned by bulk_import
--
-- `confirmed` is in the allowed list because a column grant cannot tell a candidate from a project administrator holding `entity.confirm`. Rule 1 of `enforce_entity_immutability()` refuses a change to it, in either direction, by a caller without that permission; 19-entity-immutability.test.sql asserts the refusal.
--
-- `first_name`, `last_name` and `short_name` are allowed too: an unconfirmed entity must be able to set its name and its short name during sign-up, and the freeze of all three once confirmed is the trigger's rule 2.
--
-- Allowed columns for candidates (self-edit):
--   short_name, info, color, image, subtype, custom_data, first_name, last_name, answers, confirmed
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
-- `confirmed`, `name` and `short_name` are allowed and guarded by `enforce_entity_immutability()`, as on `candidates`.
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
-- `confirmed`, `name` and `short_name` are allowed and guarded by `enforce_entity_immutability()`, as on `candidates`.
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
-- `confirmed`, `name` and `short_name` are allowed and guarded by `enforce_entity_immutability()`, as on `candidates`.
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
-- Allowed on INSERT: the ten columns a nominating caller authors (project_id, candidate_id, organization_id, faction_id, alliance_id, election_id, constituency_id, election_round, parent_nomination_id, custom_data) and nine presentation and bookkeeping columns: the eight a project admin alone writes (name, short_name, info, color, image, sort_order, subtype, external_id) and `election_symbol`, which the editor of the nomination's own entity writes too. The grant cannot tell the callers apart, so it admits the union, and `enforce_nomination_entity_columns()` (011-validation-functions.sql) refuses the eight to a caller without `project.edit_nominations`, and the symbol to such a caller on a row that is not its own.
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

-- Allowed on UPDATE: the six columns an editing caller changes (election_id, constituency_id, election_round, parent_nomination_id, custom_data, confirmed), the nine presentation columns and the four entity foreign keys. For a caller without `project.edit_nominations`, `enforce_nomination_entity_columns()` holds the four foreign keys and eight of the nine unchanged, and `election_symbol` unchanged on a row that is not that caller's own.
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
-- Allowed on UPDATE: name, default_locale, open_for_voters.
-- Protected: id, account_id, created_at, updated_at (the set_updated_at trigger writes updated_at without needing a column privilege).
-- INSERT is not restricted here: `admin_insert_projects` asks `account.manage_projects` of the new row's `account_id`.
REVOKE
UPDATE ON public.projects
FROM
  authenticated;

GRANT
UPDATE (name, default_locale, open_for_voters) ON public.projects TO authenticated;
-- Terms-of-use acceptances: `public.terms_of_use_acceptances`, its index, its RLS, its two policies and its privileges.
--
-- A row says that one user has accepted the terms of use of one project. The row's presence is the acceptance: the table holds no boolean and no version. Acceptance belongs to a user and a project and to no entity, so an acceptance for one project is not an acceptance for another.
--
-- Depends on:
-- - 100-tenancy.sql (projects)
-- - auth.users and auth.uid() (Supabase Auth)
--------------------------------------------------------------------------------
-- terms_of_use_acceptances table
--------------------------------------------------------------------------------
-- The database supplies who and when. `user_id` defaults to the caller and `accepted_at` to the server clock, and an API caller holds INSERT on `project_id` alone (see the grants below), so it can state neither. Deleting the user or the project deletes the row.
CREATE TABLE public.terms_of_use_acceptances (
  user_id uuid NOT NULL DEFAULT auth.uid () REFERENCES auth.users (id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, project_id)
);

-- The lookup by project, who has accepted here, which the primary key cannot serve because it leads with user_id. No index on user_id alone: the primary key leads with it, which covers that foreign key for lint-schema.mjs's unindexed-foreign-key advisor.
CREATE INDEX idx_terms_of_use_acceptances_project_id ON public.terms_of_use_acceptances (project_id);

--------------------------------------------------------------------------------
-- RLS on terms_of_use_acceptances
--
-- Two policies, both for `authenticated`, and no UPDATE or DELETE policy: a user records their own acceptance and reads it back, and has no path to change or withdraw it. `anon` reaches nothing. A service-role caller bypasses row-level security and keeps its table privileges, so it can read and remove rows.
--
-- Both policies ask who the caller is and nothing else. Acceptance is a statement a user makes about themself, so no grant decides it. The INSERT policy checks who and not which project: a user can record an acceptance for any existing project, including one they hold no grant in. That unlocks nothing: no policy and no function reads this table, and every protected read and write is decided by the grant model alone.
--------------------------------------------------------------------------------
ALTER TABLE public.terms_of_use_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_terms_of_use_acceptances" ON public.terms_of_use_acceptances FOR
SELECT
  TO authenticated USING (
    user_id = (
      SELECT
        auth.uid ()
    )
  );

CREATE POLICY "authenticated_insert_terms_of_use_acceptances" ON public.terms_of_use_acceptances FOR INSERT TO authenticated
WITH
  CHECK (
    user_id = (
      SELECT
        auth.uid ()
    )
  );

--------------------------------------------------------------------------------
-- Privileges on terms_of_use_acceptances
--
-- Approach: REVOKE every table-level privilege, then GRANT SELECT on the table and INSERT on `project_id` only.
-- (A new table in the public schema is granted ALL to anon and authenticated by default, and a column-level grant restricts nothing while the table-level privilege exists.)
--
-- An insert that states `user_id` or `accepted_at` is refused for lack of privilege on that column, before any policy is consulted. `authenticated` holds no UPDATE and no DELETE, and `anon` holds nothing. An upsert must be the DO NOTHING form: the DO UPDATE form needs the UPDATE privilege.
--------------------------------------------------------------------------------
REVOKE ALL ON TABLE public.terms_of_use_acceptances
FROM
  anon,
  authenticated,
  public;

GRANT
SELECT
  ON TABLE public.terms_of_use_acceptances TO authenticated;

GRANT INSERT (project_id) ON TABLE public.terms_of_use_acceptances TO authenticated;
-- Invitations: `public.invitations`, the code functions, the insert trigger, the table's privileges, its three policies and the cleanup triggers.
--
-- A row promises one grant to whoever proves control of its email address or presents its code. The promise is stated in the four columns of `public.grants`, so fulfilling it is one insert of those four values and nothing is derived. A row belongs to one project and is bound to exactly one of a normalised email address and the hash of a server-generated code.
--
-- Depends on:
-- - 000-enums.sql (grant_scope_type, grant_role_type, entity_type)
-- - 100-tenancy.sql (projects)
-- - 102-entities.sql (the four entity tables the cleanup triggers sit on)
-- - 301-auth-functions.sql (grant_role_permissions, user_can, private.entity_project_id)
-- - auth.users and auth.uid() (Supabase Auth)
--------------------------------------------------------------------------------
-- The invitation code: normalise, hash, generate
--
-- A code is twelve symbols of Crockford's base-32 alphabet, shown as `XXXX-XXXX-XXXX`: 60 bits. The alphabet has no `I`, `L`, `O` or `U`, and reading folds the look-alikes onto the digits it keeps, so a code copied from paper matches however it was typed.
--
-- Only the hash is stored. The three functions use the core `sha256` and `gen_random_uuid` and need no extension.
--------------------------------------------------------------------------------
-- Upper-cases, drops every character that is not a digit or a letter, then reads `O` as `0` and `I` and `L` as `1`. The hash, and so every comparison of a code, goes through this one function.
CREATE OR REPLACE FUNCTION private.normalise_invitation_code (p_code text) RETURNS text LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT translate(regexp_replace(upper(coalesce(p_code, '')), '[^0-9A-Z]', '', 'g'), 'OIL', '011');
$$;

-- The lower-case hex `sha256` of the normalised code's UTF-8 bytes: 64 characters, the only form of a code the table holds.
CREATE OR REPLACE FUNCTION private.invitation_code_hash (p_code text) RETURNS text LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT encode(sha256(convert_to(private.normalise_invitation_code(p_code), 'UTF8')), 'hex');
$$;

-- Each symbol is chosen by the low five bits of one byte of a random uuid. 256 is a multiple of 32, so the mask is unbiased. The bytes at offsets 6 and 8 carry the uuid's version and variant bits and are not used; the twelve offsets below are fully random.
CREATE OR REPLACE FUNCTION private.generate_invitation_code () RETURNS text LANGUAGE plpgsql VOLATILE
SET
  search_path = '' AS $$
DECLARE
  v_alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_offsets constant integer[] := ARRAY[0, 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14];
  v_bytes bytea := uuid_send(gen_random_uuid());
  v_offset integer;
  v_code text := '';
BEGIN
  FOREACH v_offset IN ARRAY v_offsets LOOP
    v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, v_offset) & 31) + 1, 1);
  END LOOP;
  RETURN substr(v_code, 1, 4) || '-' || substr(v_code, 5, 4) || '-' || substr(v_code, 9, 4);
END;
$$;

-- The insert trigger below is SECURITY INVOKER and calls these functions as the inserting role, so `authenticated` and `service_role` need EXECUTE. PostgREST cannot reach them, because `private` is not an exposed schema.
REVOKE
EXECUTE ON FUNCTION private.normalise_invitation_code (text),
private.invitation_code_hash (text),
private.generate_invitation_code ()
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION private.normalise_invitation_code (text),
private.invitation_code_hash (text),
private.generate_invitation_code () TO authenticated,
service_role;

--------------------------------------------------------------------------------
-- project_account_id: resolve a project to its account
--
-- Returns the account_id of the project, or NULL when no such project exists. NULL is a denial at its call sites, never a match.
--
-- SECURITY DEFINER because public.projects has row-level security enabled, and an inline read in a policy would also ask whether the caller can see the project. search_path is pinned as on every definer function here. `authenticated` keeps EXECUTE because the invitation policies, which evaluate as that role, call it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.project_account_id (p_project_id uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT p.account_id FROM public.projects p WHERE p.id = p_project_id;
$$;

REVOKE
EXECUTE ON FUNCTION private.project_account_id (uuid)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION private.project_account_id (uuid) TO authenticated;

--------------------------------------------------------------------------------
-- invitations table
--------------------------------------------------------------------------------
-- An invitation is claimed when `claimed_at` is set, never when `claimed_by` is: both user columns go to null with their user, so deleting the claimant cannot reopen a claimed row.
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- The promised grant, in the four columns of public.grants and with their types.
  scope public.grant_scope_type NOT NULL,
  target_type public.entity_type,
  -- No foreign key, as on public.grants: the target is a project or a row of one of the four entity tables. cleanup_invitations_on_delete removes an invitation when its entity is deleted, and a project-scope row goes with its project through project_id.
  target_id uuid,
  role public.grant_role_type NOT NULL,
  -- The invited address, trimmed and lower-cased by the insert trigger. Null on a code row.
  email text,
  -- The hash of the row's code, set by the insert trigger. Null on an email row. No API role can select or insert it.
  code_hash text,
  -- On a code row, the address whose control must be proven before the code's promise is fulfilled, and when it was bound.
  pending_email text,
  pending_email_at timestamptz,
  -- Null means the invitation does not expire.
  expires_at timestamptz,
  created_by uuid DEFAULT auth.uid () REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  claimed_at timestamptz,
  -- The two shape rules of public.grants, under this table's names.
  CONSTRAINT invitations_entity_scope_target_type_check CHECK ((target_type IS NOT NULL) = (scope = 'entity')),
  CONSTRAINT invitations_target_id_scope_check CHECK ((target_id IS NULL) = (scope = 'global')),
  -- An invitation belongs to a project, and no project owns an account or the instance. A CHECK and not a policy, so it binds the service role too.
  CONSTRAINT invitations_scope_check CHECK (scope IN ('project', 'entity')),
  -- A project-scope promise names its own project.
  CONSTRAINT invitations_project_target_check CHECK (
    scope <> 'project'
    OR target_id = project_id
  ),
  -- A promise of a grant that confers nothing, such as an entity-scope admin, is refused for every role. Evaluated when the row is written.
  CONSTRAINT invitations_role_confers_check CHECK (
    cardinality(
      public.grant_role_permissions (scope, role, target_type)
    ) > 0
  ),
  -- Exactly one of an address and a code.
  CONSTRAINT invitations_binding_check CHECK (num_nonnulls (email, code_hash) = 1),
  CONSTRAINT invitations_email_normalised_check CHECK (
    email = lower(btrim(email))
    AND email <> ''
  ),
  CONSTRAINT invitations_code_hash_format_check CHECK (code_hash ~ '^[0-9a-f]{64}$'),
  -- A pending address exists only on a code row, in the same normal form as `email`.
  CONSTRAINT invitations_pending_email_check CHECK (
    pending_email IS NULL
    OR (
      code_hash IS NOT NULL
      AND pending_email = lower(btrim(pending_email))
      AND pending_email <> ''
    )
  ),
  CONSTRAINT invitations_claimed_by_needs_claimed_at_check CHECK (
    claimed_by IS NULL
    OR claimed_at IS NOT NULL
  )
);

-- One address is promised one target once, whatever the role and whether or not the first promise has been claimed. NULLS NOT DISTINCT because target_type is null on a project-scope row, where a plain unique index would admit the duplicate.
CREATE UNIQUE INDEX invitations_email_target_key ON public.invitations (project_id, email, scope, target_type, target_id) NULLS NOT DISTINCT
WHERE
  email IS NOT NULL;

-- A code is looked up without a target, so within a project it names one row.
CREATE UNIQUE INDEX invitations_code_hash_key ON public.invitations (project_id, code_hash)
WHERE
  code_hash IS NOT NULL;

CREATE INDEX idx_invitations_project_id ON public.invitations (project_id);

-- The lookup by target, which cleanup_invitations_on_delete uses.
CREATE INDEX idx_invitations_scope_target ON public.invitations (scope, target_type, target_id);

CREATE INDEX idx_invitations_created_by ON public.invitations (created_by);

CREATE INDEX idx_invitations_claimed_by ON public.invitations (claimed_by);

CREATE INDEX idx_invitations_pending_email ON public.invitations (project_id, pending_email)
WHERE
  pending_email IS NOT NULL;

--------------------------------------------------------------------------------
-- prepare_invitation: the server-side columns of a new row
--
-- Stores the address trimmed and lower-cased, an empty one as null. A row that arrives with neither an address nor a code hash gets a generated code: its hash goes into `code_hash`, and the code itself into the transaction-local setting `openvaa.generated_invitation_code`, which create_invitations reads back. Every other insert sets that setting to the empty string, so it never holds the code of an earlier row.
--
-- The function never reads a code from the caller. An API caller holds no INSERT privilege on `code_hash` (see the privileges below), and a trigger may set a column its caller cannot, so the only code hash such a caller can cause is one generated here. A direct insert through the API ends its transaction with the request, so it has no later statement in which to read the setting: its code is known to nobody.
--
-- SECURITY INVOKER: it reads no table, and it needs nothing its caller lacks.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prepare_invitation () RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  v_code text;
BEGIN
  NEW.email := NULLIF(lower(btrim(NEW.email)), '');
  IF NEW.email IS NULL AND NEW.code_hash IS NULL THEN
    v_code := private.generate_invitation_code();
    NEW.code_hash := private.invitation_code_hash(v_code);
    PERFORM set_config('openvaa.generated_invitation_code', v_code, true);
  ELSE
    PERFORM set_config('openvaa.generated_invitation_code', '', true);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prepare_invitation
BEFORE INSERT ON public.invitations FOR EACH ROW
EXECUTE FUNCTION public.prepare_invitation ();

--------------------------------------------------------------------------------
-- Privileges on invitations
--
-- Approach: REVOKE every table-level privilege, then GRANT column by column.
-- (A new table in the public schema is granted ALL to anon and authenticated by default, and a column-level grant restricts nothing while the table-level privilege exists.)
--
-- `authenticated` may select every column except `code_hash`, `pending_email` and `pending_email_at`, so `SELECT *` is refused and a query names its columns. It may insert the promise, the address and the expiry and nothing else: an insert that names `code_hash`, `pending_email`, `created_by`, `claimed_by` or `claimed_at` is refused for lack of privilege before any policy is consulted. It may delete. It holds no UPDATE: a row's promise, address and code cannot be changed after the insert, and an invitation is changed by deleting an unclaimed one and creating another. `anon` holds nothing.
--------------------------------------------------------------------------------
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.invitations
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT
SELECT
  (
    id,
    project_id,
    scope,
    target_type,
    target_id,
    role,
    email,
    expires_at,
    created_by,
    created_at,
    claimed_by,
    claimed_at
  ) ON TABLE public.invitations TO authenticated;

GRANT INSERT (
  project_id,
  scope,
  target_type,
  target_id,
  role,
  email,
  expires_at
) ON TABLE public.invitations TO authenticated;

GRANT DELETE ON TABLE public.invitations TO authenticated;

--------------------------------------------------------------------------------
-- RLS on invitations: who may promise which grant
--
-- The expression of these three policies is the authority map. A promise of an entity editor's grant needs `project.edit_entities` on the row's project and an entity of that project; a promise of a project editor's grant needs `project.manage_editors` on the project; a promise of a project admin's grant needs `account.manage_admins` on the project's account. Any other shape matches no arm and is refused. A caller therefore cannot promise the level they hold themselves: a project editor cannot promise a project editor's or a project admin's grant, and a project admin cannot promise a project admin's.
--
-- The map is written inline, in one policy per command, because the schema linter (lint-schema.mjs, check 9001) and the enforcement census (25-matrix-conformance.test.sql) read the permission literals out of the policy text. A helper that held the map would hide them from both.
--
-- The map is the INSERT policy's WITH CHECK, so a direct insert into the table meets the same refusals as create_invitations. Reading asks the same map with `project.read_entities` in the entity arm: a caller reads the promises they could make, entity editors and `anon` read none, and the table holds invitees' addresses. Deleting asks the insert map of an unclaimed row; a claimed row is kept. There is no UPDATE policy.
--
-- The service role bypasses these policies. The three CHECK constraints on scope, project target and conferred permissions are what bind it.
--------------------------------------------------------------------------------
CREATE POLICY "admin_select_invitations" ON public.invitations FOR
SELECT
  TO authenticated USING (
    (
      scope = 'entity'
      AND role = 'editor'
      AND (
        SELECT
          private.entity_project_id (target_type, target_id)
      ) = project_id
      AND (
        SELECT
          user_can ('project', project_id, 'project.read_entities')
      )
    )
    OR (
      scope = 'project'
      AND role = 'editor'
      AND target_id = project_id
      AND (
        SELECT
          user_can ('project', project_id, 'project.manage_editors')
      )
    )
    OR (
      scope = 'project'
      AND role = 'admin'
      AND target_id = project_id
      AND (
        SELECT
          user_can (
            'account',
            private.project_account_id (project_id),
            'account.manage_admins'
          )
      )
    )
  );

CREATE POLICY "admin_insert_invitations" ON public.invitations FOR INSERT TO authenticated
WITH
  CHECK (
    (
      scope = 'entity'
      AND role = 'editor'
      AND (
        SELECT
          private.entity_project_id (target_type, target_id)
      ) = project_id
      AND (
        SELECT
          user_can ('project', project_id, 'project.edit_entities')
      )
    )
    OR (
      scope = 'project'
      AND role = 'editor'
      AND target_id = project_id
      AND (
        SELECT
          user_can ('project', project_id, 'project.manage_editors')
      )
    )
    OR (
      scope = 'project'
      AND role = 'admin'
      AND target_id = project_id
      AND (
        SELECT
          user_can (
            'account',
            private.project_account_id (project_id),
            'account.manage_admins'
          )
      )
    )
  );

CREATE POLICY "admin_delete_invitations" ON public.invitations FOR DELETE TO authenticated USING (
  claimed_at IS NULL
  AND (
    (
      scope = 'entity'
      AND role = 'editor'
      AND (
        SELECT
          private.entity_project_id (target_type, target_id)
      ) = project_id
      AND (
        SELECT
          user_can ('project', project_id, 'project.edit_entities')
      )
    )
    OR (
      scope = 'project'
      AND role = 'editor'
      AND target_id = project_id
      AND (
        SELECT
          user_can ('project', project_id, 'project.manage_editors')
      )
    )
    OR (
      scope = 'project'
      AND role = 'admin'
      AND target_id = project_id
      AND (
        SELECT
          user_can (
            'account',
            private.project_account_id (project_id),
            'account.manage_admins'
          )
      )
    )
  )
);

--------------------------------------------------------------------------------
-- cleanup_invitations_on_delete: an invitation does not outlive its entity
--
-- `target_id` has no foreign key. Without these triggers an invitation would survive its entity and attach to a row that reused the id, for instance through an import. These AFTER DELETE triggers delete the invitations naming the deleted row, claimed ones included, on the four entity tables. The trigger argument carries the entity type, so one function serves all four tables and names none of them.
--
-- SECURITY DEFINER because the deleting caller may not hold the authority the invitation's DELETE policy asks, and that policy keeps claimed rows. search_path is pinned as on every definer function here. A project delete removes the project's invitations through the foreign key on `project_id`.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_invitations_on_delete () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
BEGIN
  DELETE FROM public.invitations i
  WHERE i.scope = 'entity'
    AND i.target_type = TG_ARGV[0]::public.entity_type
    AND i.target_id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER cleanup_invitations_on_delete
AFTER DELETE ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.cleanup_invitations_on_delete ('candidate');

CREATE TRIGGER cleanup_invitations_on_delete
AFTER DELETE ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.cleanup_invitations_on_delete ('organization');

CREATE TRIGGER cleanup_invitations_on_delete
AFTER DELETE ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.cleanup_invitations_on_delete ('faction');

CREATE TRIGGER cleanup_invitations_on_delete
AFTER DELETE ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.cleanup_invitations_on_delete ('alliance');

-- Neither trigger function is an RPC. A trigger fires whatever EXECUTE its function carries, so nothing is lost by revoking it from the API roles.
REVOKE
EXECUTE ON FUNCTION public.prepare_invitation (),
public.cleanup_invitations_on_delete ()
FROM
  PUBLIC,
  anon,
  authenticated;
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
-- - the storage.buckets row public-assets - the public bucket
-- - the storage.buckets row private-assets - the private bucket
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
-- One row per setting: `key` names it, `supabase_url` or `service_role_key`, and `value` holds it. The pg_net cleanup triggers read both to call the Storage API. seed.sql writes the local stack's two rows. A deployment's are written by the bootstrap script `infra/scripts/bootstrap.sql`, with the project's own Supabase URL and service-role key.
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
-- Storage buckets: public-assets and private-assets
--
-- The two buckets the policies and cleanup triggers below name. A hosted project gets its buckets from this statement alone. The local CLI also writes both, from the `[storage.buckets.*]` blocks of config.toml, whenever it starts the storage service, so the values here must equal the ones declared there: `public` is true for public-assets only, and the limit on one object is 524288000 bytes (500 MiB) in both.
--
-- A row that already exists is left as it is.
--------------------------------------------------------------------------------
INSERT INTO
  storage.buckets (id, name, public, file_size_limit)
VALUES
  ('public-assets', 'public-assets', true, 524288000),
  (
    'private-assets',
    'private-assets',
    false,
    524288000
  )
ON CONFLICT (id) DO NOTHING;

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

  -- The four entity tables: the entity's own confirmation flag and a confirming nomination in this project.
  IF p_type IN ('candidates', 'organizations', 'factions', 'alliances') THEN
    EXECUTE format('SELECT e.confirmed FROM public.%I e WHERE e.id = $1 AND e.project_id = $2', p_type)
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

-- Note: the cleanup triggers need supabase_url and service_role_key in storage_config. seed.sql writes the local stack's values, and the bootstrap script `infra/scripts/bootstrap.sql` writes a deployment's.
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
    -- Skip project_id (already added) and managed columns. `entity_type` is a generated column on `nominations`, where it is skipped, and a filter list on `question_categories` and `questions`, where it is carried and validate_entity_type_list() checks it. `DENIED_BY_TABLE` in packages/dev-seed/src/template/permittedKeys.ts mirrors this condition, and a parity test in that package reads `skip_columns` from this file, so the two change together.
    IF item_key = ANY(skip_columns)
       AND NOT (item_key = 'entity_type' AND p_table_name IN ('question_categories', 'questions')) THEN
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

-- service_role only. The function is SECURITY DEFINER, reads auth.users and checks nothing about its caller, so any role that can EXECUTE it can read the email address of any user id it names, and user ids are readable from a public column (nominations.created_by). Its one caller, the send-email Edge Function, calls it through a service-role client after its own authority check. Supabase's default privileges grant EXECUTE on every new public function to anon and authenticated, so the REVOKE names them as well as PUBLIC.
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
-- - get_user_entities() - every candidate and organization the caller holds an editor grant on in one project, as one object that also says whether the caller's account has a password
-- - get_entity_user_data() - the editable row of one entity the caller holds an editor grant on, or no row
-- - get_entity_nominations() - the nominations of one entity the caller holds an editor grant on, each with its parent resolved, or NULL
-- - get_nomination_parent_options() - the entities one entity the caller holds an editor grant on may name as its parent, or NULL
-- - upsert_answers() - atomic answer write for a single entity
-- - private.nomination_list_checked() - whether an argument is a nominations array a writer may take: an array of at most 1000 members
-- - private.nomination_object_checked() - the shape of one nomination object, refused or answered with its normalised values
-- - private.parent_nomination_resolved() - a named parent's nomination at a contest, found or created bare, as the caller
-- - set_entity_nominations() - write the whole set of nominations of one entity the caller holds nomination.edit on, in one transaction
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
-- The projection is an ALLOW-LIST, not `to_jsonb(row) - <deny-list>`: a column added to an entity table later is withheld until someone decides it is basic data. Withheld today: answers, custom_data, external_id and the two timestamps.
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
-- get_user_entities: every entity the caller edits in ONE project, as ONE object
--
-- Returns one jsonb object whose `entities` array holds one entry per candidate and per organization of p_project_id the caller holds an `(entity, <type>, <id>, editor)` grant on, read from public.grants through private.caller_entity_ids. Each entry carries what a card shows: `entity_type`, `id`, the names of its type (`first_name` and `last_name` for a candidate, `name` for an organization), `short_name`, `image`, `color` and `confirmed`. Candidates come first, then organizations, each by id.
--
-- The answer is one object, not a set of rows, so a caller with no entity still gets one row, whose `entities` is an empty array. The top level holds facts about the caller; every fact about an entity sits inside `entities`.
--
-- `password_set` is a fact about the caller: whether the caller's own account holds a password, as private.caller_password_set answers it for `auth.uid()`. It is there whether or not the caller edits anything, and it never says anything about another account, because nothing passed to this function reaches it.
--
-- Only candidates and organizations are listed: factions and alliances have no arm. Project, account and global admins and holders of an entity-scope `admin` grant are listed with nothing, because only the editor grant makes an entity the caller's.
--
-- p_project_id is REQUIRED and carries no DEFAULT, because one identity may hold editor grants in several projects and only the project names which of them are asked for.
--
-- SECURITY INVOKER: the grant lookup and the password fact are the two definer calls on the path, each answering for `auth.uid()` alone, and which rows come back is still decided by the caller's own row-level security. An entity is therefore listed exactly when get_entity_user_data returns it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_entities (p_project_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER
SET
  search_path = '' AS $$
  SELECT jsonb_build_object(
    'entities',
    COALESCE(
      (
        SELECT jsonb_agg(e.entity ORDER BY e.type_order, e.id)
        FROM (
          SELECT 1 AS type_order, c.id,
                 jsonb_build_object(
                   'entity_type', 'candidate', 'id', c.id,
                   'first_name', c.first_name, 'last_name', c.last_name,
                   'short_name', c.short_name, 'image', c.image, 'color', c.color,
                   'confirmed', c.confirmed) AS entity
          FROM public.candidates c
          WHERE c.project_id = p_project_id
            AND c.id IN (SELECT private.caller_entity_ids (p_project_id, 'candidate'))
          UNION ALL
          SELECT 2 AS type_order, o.id,
                 jsonb_build_object(
                   'entity_type', 'organization', 'id', o.id,
                   'name', o.name,
                   'short_name', o.short_name, 'image', o.image, 'color', o.color,
                   'confirmed', o.confirmed) AS entity
          FROM public.organizations o
          WHERE o.project_id = p_project_id
            AND o.id IN (SELECT private.caller_entity_ids (p_project_id, 'organization'))
        ) e
      ),
      '[]'::jsonb
    ),
    'password_set', private.caller_password_set()
  );
$$;

REVOKE
EXECUTE ON FUNCTION public.get_user_entities (uuid)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.get_user_entities (uuid) TO authenticated;

--------------------------------------------------------------------------------
-- get_entity_user_data: the editable row of ONE entity the caller edits, or no row
--
-- Returns the row of the candidate or organization named by p_entity_type and p_entity_id when it lies in p_project_id and the caller holds an `(entity, <type>, <id>, editor)` grant on it, read from public.grants through private.caller_entity_ids. The entity is named by its type and id together, because the entity tables have independent primary keys and one uuid can name a candidate and an organization at once.
--
-- Returns no row -- never raises -- for an entity that is not the caller's, a type that does not match the id, an entity of another project and an id that does not exist, so the answer does not distinguish "does not exist" from "not yours". A faction or an alliance has no arm and returns no row.
--
-- One column list serves both types: `name` is NULL for a candidate, and `first_name` and `last_name` are NULL for an organization.
--
-- No parameter carries a DEFAULT: the project, the type and the id are each stated by the caller.
--
-- SECURITY INVOKER: the grant lookup is the one definer call on the path, and the row comes back only when the caller's own row-level security admits it too. The condition is `id IN (the caller's entity ids)` on the entity table itself, so a row that row-level security hides is not returned.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_entity_user_data (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid
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
  first_name text,
  last_name text
) LANGUAGE sql STABLE SECURITY INVOKER
SET
  search_path = '' AS $$
  SELECT c.id, c.project_id, NULL::jsonb, c.short_name, c.info,
         c.color, c.image, c.sort_order, c.subtype,
         c.custom_data, c.answers,
         c.first_name, c.last_name
  FROM public.candidates c
  WHERE p_entity_type = 'candidate'
    AND c.id = p_entity_id
    AND c.project_id = p_project_id
    AND c.id IN (SELECT private.caller_entity_ids (p_project_id, 'candidate'))
  UNION ALL
  SELECT o.id, o.project_id, o.name, o.short_name, o.info,
         o.color, o.image, o.sort_order, o.subtype,
         o.custom_data, o.answers,
         NULL::text, NULL::text
  FROM public.organizations o
  WHERE p_entity_type = 'organization'
    AND o.id = p_entity_id
    AND o.project_id = p_project_id
    AND o.id IN (SELECT private.caller_entity_ids (p_project_id, 'organization'));
$$;

REVOKE
EXECUTE ON FUNCTION public.get_entity_user_data (uuid, public.entity_type, uuid)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.get_entity_user_data (uuid, public.entity_type, uuid) TO authenticated;

--------------------------------------------------------------------------------
-- get_entity_nominations: the nominations of ONE entity the caller edits, each with the parent it stands under
--
-- Returns a jsonb array holding one object per nomination of the candidate or organization named by p_entity_type and p_entity_id in p_project_id, confirmed or not, ordered by sort_order with nulls last and then by id. An entity with no nomination gets an empty array.
--
-- The gate is the caller's own `(entity, <type>, <id>, editor)` grant, read from public.grants through private.caller_entity_ids. That is the lookup get_entity_user_data uses, so the two agree on whose entity it is. `user_can` is not asked: it answers yes for project, account and global admins, and through the child-nominee hop for the editor of a parent organization, who would then learn which other parties its candidate stands for. Only candidates and organizations are served: a faction or an alliance is refused even to its own editor.
--
-- The entity is named by its type and id together, because the entity tables have independent primary keys and one uuid can name a candidate and an organization at once. The type selects the one foreign key matched, so the nominations of the other entity carrying that id are not returned. No parameter carries a DEFAULT: the project, the type and the id are each stated by the caller.
--
-- The projection is an ALLOW-LIST built key by key, not `to_jsonb(row) - <deny-list>`: `id`, `election_id`, `election_name`, `constituency_id`, `constituency_name`, `election_round`, `election_symbol`, `confirmed`, `custom_data` and `parent`. The two names are the localized `name` columns as stored. `parent` is a JSON null when the nomination has none, and otherwise an object of exactly `entity_type`, `entity_id`, `name` and `short_name` of the entity the parent nomination nominates. Withheld: `created_by`, every other column of the parent entity and every column of the parent's nomination.
--
-- Returns NULL -- never raises -- when a parameter is NULL, when the type is not served, and when the caller holds no editor grant on the named entity in the named project, which covers another user's entity, an entity of another project and an id that does not exist. The answer therefore does not distinguish "does not exist" from "not yours", and NULL is a different answer from the empty array. The condition refuses on anything other than a positive match, so a NULL comparison refuses too.
--
-- SECURITY DEFINER because a parent is returned where the caller's own SELECT policies refuse both its nomination and its entity row: an unconfirmed parent, and any parent in a project that is not open for voters. search_path is pinned as on every definer function in this schema. EXECUTE is authenticated only.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_entity_nominations (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
BEGIN
  IF p_project_id IS NULL OR p_entity_type IS NULL OR p_entity_id IS NULL
     OR (
       p_entity_type IN ('candidate', 'organization')
       AND p_entity_id IN (SELECT private.caller_entity_ids(p_project_id, p_entity_type))
     ) IS NOT TRUE THEN
    RETURN NULL;
  END IF;

  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', n.id,
          'election_id', n.election_id, 'election_name', e.name,
          'constituency_id', n.constituency_id, 'constituency_name', c.name,
          'election_round', n.election_round, 'election_symbol', n.election_symbol,
          'confirmed', n.confirmed, 'custom_data', n.custom_data,
          'parent', CASE WHEN p.id IS NULL THEN NULL ELSE jsonb_build_object(
            'entity_type', p.entity_type,
            'entity_id', COALESCE(p.organization_id, p.faction_id, p.alliance_id),
            'name', COALESCE(po.name, pf.name, pa.name),
            'short_name', COALESCE(po.short_name, pf.short_name, pa.short_name)) END)
        ORDER BY n.sort_order NULLS LAST, n.id)
      FROM public.nominations n
      JOIN public.elections e ON e.id = n.election_id
      JOIN public.constituencies c ON c.id = n.constituency_id
      LEFT JOIN public.nominations p ON p.id = n.parent_nomination_id
      LEFT JOIN public.organizations po ON po.id = p.organization_id
      LEFT JOIN public.factions pf ON pf.id = p.faction_id
      LEFT JOIN public.alliances pa ON pa.id = p.alliance_id
      WHERE n.project_id = p_project_id
        AND (
          (p_entity_type = 'candidate' AND n.candidate_id = p_entity_id)
          OR (p_entity_type = 'organization' AND n.organization_id = p_entity_id)
        )
    ),
    '[]'::jsonb
  );
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.get_entity_nominations (uuid, public.entity_type, uuid)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.get_entity_nominations (uuid, public.entity_type, uuid) TO authenticated;

--------------------------------------------------------------------------------
-- get_nomination_parent_options: the entities ONE entity the caller edits may name as its parent
--
-- Returns a jsonb array holding one object per entity the candidate or organization named by p_entity_type and p_entity_id may stand under in p_project_id: for a candidate every confirmed organization of the project, for an organization every alliance of the project, confirmed or not. The array is ordered by sort_order with nulls last and then by id. A project that holds no such entity gets an empty array.
--
-- The gate is the one get_entity_nominations asks: the caller's own `(entity, <type>, <id>, editor)` grant, read from public.grants through private.caller_entity_ids, which keeps only entities that lie in p_project_id. The project whose entities are listed is therefore always one in which the caller edits the named entity: p_project_id selects among the caller's own grants and cannot point the read at another project. `user_can` is not asked, so a project admin and the editor of a parent organization are refused; they read the entity tables through their own policies. Only candidates and organizations are served: a faction stands under the organization it belongs to and an alliance under nothing.
--
-- No parameter carries a DEFAULT: the project, the type, the id and the contests are each stated by the caller. p_contests is a JSON array of objects, each naming an `election_id` and a `constituency_id`; any other key of such an object is not read. An empty array is admitted.
--
-- The projection is an ALLOW-LIST built key by key, not `to_jsonb(row) - <deny-list>`: `id`, `entity_type`, `name`, `short_name`, `color`, `image` and `nominated`. `name`, `short_name`, `color` and `image` are the columns as stored, a JSON null where the column is NULL. `nominated` is a JSON array of `{election_id, constituency_id}` objects: those of the asked contests at which the option holds a nomination at the election's current_round, each once, in the order asked. A contest whose election is not one of p_project_id is never among them. Withheld: answers, custom_data, info, external_id, confirmed, subtype, sort_order, project_id, the two timestamps and every column of the option's nominations.
--
-- Returns NULL -- never raises -- when one of the first three parameters is NULL, when the type is not served, when the caller holds no editor grant on the named entity in the named project, and when p_contests is NULL, is not a JSON array, or holds a member that is not an object whose `election_id` and `constituency_id` are strings that read as uuids. NULL is a refusal and a different answer from the empty array, which says that the project lists nothing the entity may name. Each condition refuses on anything other than a positive match, so a NULL comparison refuses too.
--
-- SECURITY DEFINER because an entity's editor cannot read the project's organizations and alliances through its own SELECT policies -- none of them in a project that is not open for voters, and nowhere one that has no confirmed nomination -- and a policy that admitted those rows would return every column of them. search_path is pinned as on every definer function in this schema. EXECUTE is authenticated only.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_nomination_parent_options (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_contests jsonb
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
BEGIN
  IF p_project_id IS NULL OR p_entity_type IS NULL OR p_entity_id IS NULL
     OR (
       p_entity_type IN ('candidate', 'organization')
       AND p_entity_id IN (SELECT private.caller_entity_ids(p_project_id, p_entity_type))
     ) IS NOT TRUE THEN
    RETURN NULL;
  END IF;

  IF jsonb_typeof(p_contests) IS DISTINCT FROM 'array' THEN
    RETURN NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_contests) AS m (contest)
    WHERE (
      jsonb_typeof(m.contest) = 'object'
      AND jsonb_typeof(m.contest -> 'election_id') = 'string'
      AND jsonb_typeof(m.contest -> 'constituency_id') = 'string'
      AND pg_input_is_valid(m.contest ->> 'election_id', 'uuid')
      AND pg_input_is_valid(m.contest ->> 'constituency_id', 'uuid')
    ) IS NOT TRUE
  ) THEN
    RETURN NULL;
  END IF;

  RETURN COALESCE(
    (
      WITH asked AS (
        SELECT k.election_id, k.constituency_id, e.current_round, min(k.ord) AS ord
        FROM (
          SELECT (m.contest ->> 'election_id')::uuid AS election_id,
                 (m.contest ->> 'constituency_id')::uuid AS constituency_id,
                 m.ord
          FROM jsonb_array_elements(p_contests) WITH ORDINALITY AS m (contest, ord)
        ) k
        JOIN public.elections e ON e.id = k.election_id AND e.project_id = p_project_id
        GROUP BY k.election_id, k.constituency_id, e.current_round
      ),
      listed AS (
        SELECT 'organization'::public.entity_type AS entity_type,
               o.id, o.name, o.short_name, o.color, o.image, o.sort_order
        FROM public.organizations o
        WHERE p_entity_type = 'candidate' AND o.project_id = p_project_id AND o.confirmed
        UNION ALL
        SELECT 'alliance'::public.entity_type AS entity_type,
               a.id, a.name, a.short_name, a.color, a.image, a.sort_order
        FROM public.alliances a
        WHERE p_entity_type = 'organization' AND a.project_id = p_project_id
      )
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', l.id, 'entity_type', l.entity_type,
          'name', l.name, 'short_name', l.short_name, 'color', l.color, 'image', l.image,
          'nominated', COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object('election_id', k.election_id, 'constituency_id', k.constituency_id)
                ORDER BY k.ord)
              FROM asked k
              WHERE private.nomination_exists_in_contest(
                l.entity_type, l.id, k.election_id, k.constituency_id, k.current_round)
            ),
            '[]'::jsonb))
        ORDER BY l.sort_order NULLS LAST, l.id)
      FROM listed l
    ),
    '[]'::jsonb
  );
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.get_nomination_parent_options (uuid, public.entity_type, uuid, jsonb)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.get_nomination_parent_options (uuid, public.entity_type, uuid, jsonb) TO authenticated;

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

--------------------------------------------------------------------------------
-- nomination_list_checked: is this a nominations array a writer may take
--
-- Raises SQLSTATE 22023 with `<p_prefix>: <p_label> must be a JSON array` for anything that is not a JSON array, an SQL NULL included, and with `<p_prefix>: <p_label> holds more than 1000 nominations` for an array of more than 1000 members. It reads no member, so a writer asks it before it checks any object: the bound limits the work one call can ask of the checks and the writes that follow. Every writer of a nominations array asks it, so the bound is stated here and nowhere else.
--
-- The writers are SECURITY INVOKER and call it as their caller, so `authenticated` and `service_role` hold EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.nomination_list_checked (p_list jsonb, p_prefix text, p_label text) RETURNS void LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  c_max_nominations constant integer := 1000;
BEGIN
  IF jsonb_typeof(p_list) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION '%: % must be a JSON array', p_prefix, p_label
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_array_length(p_list) > c_max_nominations THEN
    RAISE EXCEPTION '%: % holds more than % nominations', p_prefix, p_label, c_max_nominations
      USING ERRCODE = '22023';
  END IF;
END;
$$;

REVOKE
EXECUTE ON FUNCTION private.nomination_list_checked (jsonb, text, text)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION private.nomination_list_checked (jsonb, text, text) TO authenticated,
service_role;

--------------------------------------------------------------------------------
-- nomination_object_checked: the shape of ONE nomination object
--
-- Checks the keys of one object of a nominations array, in this order, and raises SQLSTATE 22023 with a message that begins `<p_prefix>: <p_label> ` at the first fault: the object itself, `election_id` and `constituency_id` (each a string that reads as a uuid), `id` (absent, or a string that reads as a uuid; a JSON null is refused), `election_symbol` (a string or null, at most 50 characters after the trim), and `parent`, an object whose `kind` is `none`, `entity`, `other` or `keep`. For `entity` the parent's `entity_type` must be p_parent_type and its `entity_id` a uuid; for `other` the `name` must be a string that is not blank and holds at most 100 characters after the trim. Any other key is not read. p_parent_type is named in the message that refuses another type.
--
-- Trimming removes leading and trailing white space of any kind, the Unicode white-space characters and the byte order mark, and lengths are counted in characters. The white-space class, the trim and the two caps are stated here and nowhere else.
--
-- It checks the shape alone. Whatever depends on the rows -- whether an `id` names a nomination the writer may write, whether the election can be read, whether `keep` is allowed -- is the writer's to check after it.
--
-- Answers `{"id", "election_id", "constituency_id", "symbol", "kind", "parent_entity_id", "name"}`: `id` null when the object names none, `symbol` trimmed with a blank one as null, `parent_entity_id` only for `entity` and `name`, trimmed, only for `other`; every other value is null.
--
-- STABLE because `pg_input_is_valid` is. The writers are SECURITY INVOKER and call it as their caller, so `authenticated` and `service_role` hold EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.nomination_object_checked (
  p_object jsonb,
  p_parent_type public.entity_type,
  p_prefix text,
  p_label text
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  -- White space of any kind: the Unicode white-space characters and the byte order mark.
  c_blank constant text := '[\u0009-\u000d\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]';
  c_trim constant text := '^' || c_blank || '+|' || c_blank || '+$';
  v_symbol text;
  v_parent jsonb;
  v_kind text;
  v_parent_entity_id uuid;
  v_name text;
BEGIN
  IF jsonb_typeof(p_object) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION '%: % must be a JSON object', p_prefix, p_label
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_object -> 'election_id') IS DISTINCT FROM 'string'
     OR NOT pg_input_is_valid(p_object ->> 'election_id', 'uuid') THEN
    RAISE EXCEPTION '%: % needs an election_id that is a uuid', p_prefix, p_label
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_object -> 'constituency_id') IS DISTINCT FROM 'string'
     OR NOT pg_input_is_valid(p_object ->> 'constituency_id', 'uuid') THEN
    RAISE EXCEPTION '%: % needs a constituency_id that is a uuid', p_prefix, p_label
      USING ERRCODE = '22023';
  END IF;

  IF p_object ? 'id' THEN
    IF jsonb_typeof(p_object -> 'id') <> 'string'
       OR NOT pg_input_is_valid(p_object ->> 'id', 'uuid') THEN
      RAISE EXCEPTION '%: % has an id that is not a uuid', p_prefix, p_label
        USING ERRCODE = '22023';
    END IF;
  END IF;

  IF jsonb_typeof(p_object -> 'election_symbol') NOT IN ('string', 'null') THEN
    RAISE EXCEPTION '%: % has an election_symbol that is neither a string nor null', p_prefix, p_label
      USING ERRCODE = '22023';
  END IF;
  v_symbol := NULLIF(regexp_replace(p_object ->> 'election_symbol', c_trim, '', 'g'), '');
  IF char_length(v_symbol) > 50 THEN
    RAISE EXCEPTION '%: % has an election_symbol longer than 50 characters', p_prefix, p_label
      USING ERRCODE = '22023';
  END IF;

  v_parent := p_object -> 'parent';
  IF jsonb_typeof(v_parent) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION '%: % needs a parent that is a JSON object', p_prefix, p_label
      USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(v_parent -> 'kind') IS DISTINCT FROM 'string'
     OR (v_parent ->> 'kind') NOT IN ('none', 'entity', 'other', 'keep') THEN
    RAISE EXCEPTION '%: % has a parent whose kind is not none, entity, other or keep', p_prefix, p_label
      USING ERRCODE = '22023';
  END IF;
  v_kind := v_parent ->> 'kind';

  IF v_kind = 'entity' THEN
    IF jsonb_typeof(v_parent -> 'entity_type') IS DISTINCT FROM 'string'
       OR (v_parent ->> 'entity_type') IS DISTINCT FROM p_parent_type::text THEN
      RAISE EXCEPTION '%: % names a parent whose entity_type is not %', p_prefix, p_label, p_parent_type
        USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(v_parent -> 'entity_id') IS DISTINCT FROM 'string'
       OR NOT pg_input_is_valid(v_parent ->> 'entity_id', 'uuid') THEN
      RAISE EXCEPTION '%: % names a parent whose entity_id is not a uuid', p_prefix, p_label
        USING ERRCODE = '22023';
    END IF;
    v_parent_entity_id := (v_parent ->> 'entity_id')::uuid;
  ELSIF v_kind = 'other' THEN
    IF jsonb_typeof(v_parent -> 'name') IS DISTINCT FROM 'string' THEN
      RAISE EXCEPTION '%: % names a parent whose name is not a string', p_prefix, p_label
        USING ERRCODE = '22023';
    END IF;
    v_name := regexp_replace(v_parent ->> 'name', c_trim, '', 'g');
    IF v_name = '' THEN
      RAISE EXCEPTION '%: % names a parent whose name is blank', p_prefix, p_label
        USING ERRCODE = '22023';
    END IF;
    IF char_length(v_name) > 100 THEN
      RAISE EXCEPTION '%: % names a parent whose name is longer than 100 characters', p_prefix, p_label
        USING ERRCODE = '22023';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'id', (p_object ->> 'id')::uuid,
    'election_id', (p_object ->> 'election_id')::uuid,
    'constituency_id', (p_object ->> 'constituency_id')::uuid,
    'symbol', v_symbol,
    'kind', v_kind,
    'parent_entity_id', v_parent_entity_id,
    'name', v_name);
END;
$$;

REVOKE
EXECUTE ON FUNCTION private.nomination_object_checked (jsonb, public.entity_type, text, text)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION private.nomination_object_checked (jsonb, public.entity_type, text, text) TO authenticated,
service_role;

--------------------------------------------------------------------------------
-- parent_nomination_resolved: a named parent's nomination at ONE contest, found or created
--
-- Answers `nomination_id`, the nomination the organization or alliance named by p_parent_type and p_parent_entity_id holds at the election, constituency and round given, as `private.nomination_id_in_contest` finds it, and `created`, whether this call inserted it. Where the parent holds none, the call inserts the parent's row -- the project, the parent, the election, the constituency and the round, and nothing else, so it is unconfirmed and carries no symbol, parent or custom data -- and asks for it again; the caller may be unable to read the new row, so its id is asked for and not returned by the insert. `nomination_id` is null when that second lookup still finds nothing, and for a parent type other than organization and alliance, which has no such row; the writer then raises its own refusal.
--
-- A parent that is no entity of p_project_id, an id that names no entity included, is refused first with SQLSTATE 22023 and `<p_prefix>: <p_label> names a parent that is no entity of the nomination's project`, before anything is read or written.
--
-- SECURITY INVOKER: the insert runs as the caller, so the insert policies of public.nominations decide who may create a party's or an alliance's row, and an entity's editor meets the cap on the unconfirmed parent nominations it originates.
--
-- Two calls that create the same parent's nomination at the same moment are decided by the uniqueness key `nominations_entity_parent_contest_key`: the second call's insert is refused, its writer's whole call with it, and the call succeeds when it is made again.
--
-- The writers are SECURITY INVOKER and call it as their caller, so `authenticated` and `service_role` hold EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.parent_nomination_resolved (
  p_project_id uuid,
  p_parent_type public.entity_type,
  p_parent_entity_id uuid,
  p_election_id uuid,
  p_constituency_id uuid,
  p_election_round integer,
  p_prefix text,
  p_label text,
  OUT nomination_id uuid,
  OUT created boolean
) LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET
  search_path = '' AS $$
BEGIN
  IF private.entity_project_id(p_parent_type, p_parent_entity_id) IS DISTINCT FROM p_project_id THEN
    RAISE EXCEPTION '%: % names a parent that is no entity of the nomination''s project', p_prefix, p_label
      USING ERRCODE = '22023';
  END IF;

  created := false;
  nomination_id := private.nomination_id_in_contest(
    p_parent_type, p_parent_entity_id, p_election_id, p_constituency_id, p_election_round);

  IF nomination_id IS NULL THEN
    IF p_parent_type = 'organization' THEN
      INSERT INTO public.nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES (p_project_id, p_parent_entity_id, p_election_id, p_constituency_id, p_election_round);
      created := true;
    ELSIF p_parent_type = 'alliance' THEN
      INSERT INTO public.nominations (project_id, alliance_id, election_id, constituency_id, election_round)
      VALUES (p_project_id, p_parent_entity_id, p_election_id, p_constituency_id, p_election_round);
      created := true;
    END IF;

    IF created THEN
      nomination_id := private.nomination_id_in_contest(
        p_parent_type, p_parent_entity_id, p_election_id, p_constituency_id, p_election_round);
    END IF;
  END IF;
END;
$$;

REVOKE
EXECUTE ON FUNCTION private.parent_nomination_resolved (
  uuid,
  public.entity_type,
  uuid,
  uuid,
  uuid,
  integer,
  text,
  text
)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION private.parent_nomination_resolved (
  uuid,
  public.entity_type,
  uuid,
  uuid,
  uuid,
  integer,
  text,
  text
) TO authenticated,
service_role;

--------------------------------------------------------------------------------
-- set_entity_nominations: write the whole set of nominations of ONE entity the caller edits, in one transaction
--
-- p_nominations states every nomination the candidate or organization named by p_entity_type and p_entity_id is to hold among the rows this function may write. The call inserts the nominations the set adds, updates the ones whose values differ, creates the nomination of a named party or alliance that has none at the contest, and deletes the ones the set leaves out. It is one statement of the caller's transaction, so either all of it is stored or none of it is.
--
-- SECURITY INVOKER: every statement runs as the caller, so the policies of public.nominations, its column grants and its triggers stay the only gate, and a direct write of the same rows meets the same refusals. The body holds one authority question, asked through `user_can` before anything is read: a caller that does not hold `nomination.edit` on the entity is refused with SQLSTATE 42501. search_path is pinned and every name in the body is schema-qualified.
--
-- p_nominations is a JSON array of objects, and an empty array is a valid set. The keys of one object:
--   id              - a uuid: the object describes that nomination of the entity. Absent: it describes a new one.
--   election_id     - a uuid, required. With `id` it must be the stored row's.
--   constituency_id - a uuid, required. With `id`, a value other than the stored one moves the nomination.
--   election_symbol - a string or null. It is trimmed; a blank one is stored as NULL, and one longer than 50 characters is refused.
--   parent          - an object with a `kind`: `none` (no parent and no requested name), `entity` with `entity_type` and `entity_id` (stand under that organization's or alliance's nomination at the contest), `other` with `name` (store the name of a parent that is not in the system and link nothing) or `keep` (leave the row's parent and requested name as they are; only with an `id`, and not on a move).
-- Any other key is not read. A candidate names an organization and an organization an alliance. The name of `other` is trimmed, must not be blank and may hold at most 100 characters. Trimming removes leading and trailing white space of any kind, lengths are counted in characters, and a submitted value is compared with a stored one by exact equality after the trim.
--
-- A malformed argument or object is refused with SQLSTATE 22023 and a message that begins `set_entity_nominations: ` and, for an object, names it as `p_nominations[<index>]`, counted from zero. The whole argument is validated before anything is written. The array is checked by `private.nomination_list_checked` and the shape of each object by `private.nomination_object_checked`, which state those rules for every writer of nominations; the checks that read rows follow each object's shape check.
--
-- An array of more than 1000 nominations is refused before any object is read. A parent that is no entity of the entity's project, or an id that names no entity, is refused with SQLSTATE 22023 when the parent is resolved, so nothing the call wrote before it is stored.
--
-- The reach: the function writes only the nominations of the entity that the caller can read, whose election_round is their election's current_round, in an election for whose type `nomination_shape_rule` admits the entity's type. A nomination in reach that the set does not name is deleted. Every other nomination of the entity is neither updated nor deleted, and an `id` that names one is refused. A new nomination is written at its election's current_round, read here: the argument carries no round.
--
-- Several nominations of one election are accepted only where each names a stored row by `id`: an object without an `id` must be the only object of its election.
--
-- The order of the statements:
--   1. Delete the nominations in reach that the set does not name, and the stored row of every move. A changed constituency is a delete and an insert, never an update of the row's contest, so the foreign key on `parent_nomination_id` refuses to move, as it refuses to delete, a nomination that has nominations listed under it (SQLSTATE 23503). The new row of a move carries the symbol and the parent the object states and nothing else of the old row.
--   2. Update each kept nomination whose symbol, parent or requested name differs from what is stored, naming only the columns that differ, and the confirmation wherever the custom data is written. A nomination whose values did not change is not written, so it keeps its confirmation and its updated_at; `enforce_nomination_confirmation` turns the confirmation of every row an entity's editor does write off.
--   3. Insert each new nomination with no parent, and then link it.
-- For `entity`, the parent's nomination at the contest is asked of `private.parent_nomination_resolved`, which runs as the caller and reads the row through `private.nomination_id_in_contest`, because the caller's own policies do not let it read that row. Where there is none, the parent's nomination is inserted, unconfirmed and carrying nothing but its contest, and asked for again. The caller's own row comes first because `entity_insert_parent_nominations` admits a parent's row only to a caller that already holds a nomination at that contest. Two callers that create the same parent's nomination at once are not reconciled: the second call is refused whole on the uniqueness key and succeeds when it is made again.
--
-- The requested name lives in `custom_data.requestedParentOrganization`. The custom data is written by merging: `other` sets the key, `entity` and `none` remove it, and every other key is kept.
--
-- A nomination that carries a requested name cannot be confirmed, and `enforce_nomination_confirmation` judges that rule on the row as the statement writes it, before it turns an edited row's confirmation off. So every UPDATE that writes the custom data states the confirmation too: off where the custom data it writes carries a requested name, and as stored otherwise. A confirmed nomination can then be given a requested name, and is confirmed no longer.
--
-- Row-level security refuses an UPDATE and a DELETE without an error, by hiding the row: under the nominations lock such a statement affects no row. So the function reads how many rows each UPDATE and DELETE affected and raises SQLSTATE 42501 on a shortfall, and a caller is never answered that a locked or vanished row was saved. The rows in reach are read with no locking clause, because under the lock the update policy hides them from a locking read.
--
-- Where an election's type requires a candidate's nomination to have a parent or a requested name, `nominations_parent_required` judges it when the transaction ends. The function forces that constraint as its last statement and sets it back to deferred, so the refusal (SQLSTATE 23514) is raised inside the call, and no later statement of the transaction meets the constraint immediate.
--
-- Returns `{"inserted", "updated", "deleted", "unchanged", "parents_created"}`, each a count of nominations. A move counts once under `deleted` and once under `inserted`; a nomination that is inserted and then linked counts once, under `inserted`; `parents_created` counts the nominations created for a party or an alliance.
--
-- A move leaves behind the nomination that an earlier call created for the parent at the old contest: it is not the caller's row, and the caller may not delete it.
--
-- 43-set-entity-nominations.test.sql asserts each rule above.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_entity_nominations (
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_nominations jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  c_requested constant text := 'requestedParentOrganization';
  c_unwritten constant text := 'set_entity_nominations: a nomination could not be written; nominations are locked or the rows are no longer the caller''s';
  v_project_id uuid;
  v_parent_type public.entity_type;
  v_reach jsonb;
  v_plan jsonb := '[]'::jsonb;
  v_item jsonb;
  v_ordinality bigint;
  v_index bigint;
  v_checked jsonb;
  v_stored jsonb;
  v_id uuid;
  v_election_id uuid;
  v_constituency_id uuid;
  v_round integer;
  v_symbol text;
  v_kind text;
  v_parent_entity_id uuid;
  v_name text;
  v_is_new boolean;
  v_named_ids uuid[] := ARRAY[]::uuid[];
  v_kept_ids uuid[] := ARRAY[]::uuid[];
  v_delete_ids uuid[];
  v_rows bigint;
  v_row_id uuid;
  v_stored_symbol text;
  v_stored_parent uuid;
  v_stored_custom jsonb;
  v_target_parent uuid;
  v_target_custom jsonb;
  v_symbol_differs boolean;
  v_parent_differs boolean;
  v_custom_differs boolean;
  v_parent_created boolean;
  v_inserted integer := 0;
  v_updated integer := 0;
  v_deleted integer := 0;
  v_unchanged integer := 0;
  v_parents_created integer := 0;
BEGIN
  IF p_entity_type IS NULL OR p_entity_id IS NULL OR p_nominations IS NULL THEN
    RAISE EXCEPTION 'set_entity_nominations: p_entity_type, p_entity_id and p_nominations must each be stated'
      USING ERRCODE = '22023';
  END IF;

  IF p_entity_type NOT IN ('candidate', 'organization') THEN
    RAISE EXCEPTION 'set_entity_nominations: p_entity_type must be candidate or organization'
      USING ERRCODE = '22023';
  END IF;

  v_project_id := private.entity_project_id(p_entity_type, p_entity_id);

  IF v_project_id IS NULL
     OR NOT COALESCE(public.user_can('entity', p_entity_id, 'nomination.edit', p_entity_type), false) THEN
    RAISE EXCEPTION 'set_entity_nominations: the caller does not hold nomination.edit on the named entity'
      USING ERRCODE = '42501';
  END IF;

  PERFORM private.nomination_list_checked(p_nominations, 'set_entity_nominations', 'p_nominations');

  -- A candidate stands under an organization and an organization under an alliance.
  v_parent_type := CASE p_entity_type
    WHEN 'candidate' THEN 'organization'::public.entity_type
    ELSE 'alliance'::public.entity_type
  END;

  -- The reach, keyed by nomination id, read as the caller and with no locking clause.
  SELECT COALESCE(
    jsonb_object_agg(
      n.id::text,
      jsonb_build_object(
        'election_id', n.election_id,
        'constituency_id', n.constituency_id,
        'election_symbol', n.election_symbol,
        'parent_nomination_id', n.parent_nomination_id,
        'custom_data', n.custom_data)),
    '{}'::jsonb)
  INTO v_reach
  FROM public.nominations n
  JOIN public.elections e ON e.id = n.election_id
  WHERE (
      (p_entity_type = 'candidate' AND n.candidate_id = p_entity_id)
      OR (p_entity_type = 'organization' AND n.organization_id = p_entity_id)
    )
    AND n.election_round IS NOT DISTINCT FROM e.current_round
    AND public.nomination_shape_rule(e.election_type, p_entity_type) IN ('admitted', 'parent_required');

  -- Validate every object before anything is written, and note what each one asks for.
  FOR v_item, v_ordinality IN
    SELECT t.item, t.ordinality
    FROM jsonb_array_elements(p_nominations) WITH ORDINALITY AS t (item, ordinality)
  LOOP
    v_index := v_ordinality - 1;

    -- The shape of the object, then the checks that read rows.
    v_checked := private.nomination_object_checked(
      v_item, v_parent_type, 'set_entity_nominations', format('p_nominations[%s]', v_index));
    v_id := (v_checked ->> 'id')::uuid;
    v_election_id := (v_checked ->> 'election_id')::uuid;
    v_constituency_id := (v_checked ->> 'constituency_id')::uuid;
    v_symbol := v_checked ->> 'symbol';
    v_kind := v_checked ->> 'kind';
    v_parent_entity_id := (v_checked ->> 'parent_entity_id')::uuid;
    v_name := v_checked ->> 'name';

    v_stored := NULL;
    v_is_new := true;
    IF v_id IS NOT NULL THEN
      IF v_id = ANY (v_named_ids) THEN
        RAISE EXCEPTION 'set_entity_nominations: p_nominations[%] names an id that another object of the set names', v_index
          USING ERRCODE = '22023';
      END IF;
      v_named_ids := v_named_ids || v_id;

      v_stored := v_reach -> v_id::text;
      IF v_stored IS NULL THEN
        RAISE EXCEPTION 'set_entity_nominations: p_nominations[%] names an id that is no nomination of the entity this function may write', v_index
          USING ERRCODE = '22023';
      END IF;

      IF (v_stored ->> 'election_id')::uuid <> v_election_id THEN
        RAISE EXCEPTION 'set_entity_nominations: p_nominations[%] names an election_id other than its nomination''s', v_index
          USING ERRCODE = '22023';
      END IF;

      -- A changed constituency is a move: the stored row is deleted and a new one inserted.
      v_is_new := (v_stored ->> 'constituency_id')::uuid <> v_constituency_id;
      IF NOT v_is_new THEN
        v_kept_ids := v_kept_ids || v_id;
      END IF;
    END IF;

    SELECT e.current_round INTO v_round
    FROM public.elections e
    WHERE e.id = v_election_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'set_entity_nominations: p_nominations[%] names an election_id that is no election the caller can read', v_index
        USING ERRCODE = '22023';
    END IF;

    IF v_kind = 'keep' AND v_is_new THEN
      RAISE EXCEPTION 'set_entity_nominations: p_nominations[%] keeps a parent, which only an object that names an id and does not change its constituency may', v_index
        USING ERRCODE = '22023';
    END IF;

    v_plan := v_plan || jsonb_build_object(
      'index', v_index,
      'id', v_id,
      'new', v_is_new,
      'election_id', v_election_id,
      'constituency_id', v_constituency_id,
      'round', v_round,
      'symbol', v_symbol,
      'kind', v_kind,
      'parent_entity_id', v_parent_entity_id,
      'name', v_name);
  END LOOP;

  -- An object without an id must be the only object of its election.
  SELECT min((a.item ->> 'index')::bigint) INTO v_index
  FROM jsonb_array_elements(v_plan) AS a (item)
  WHERE a.item ->> 'id' IS NULL
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(v_plan) AS b (item)
      WHERE b.item ->> 'election_id' = a.item ->> 'election_id'
        AND (
          (b.item ->> 'index')::bigint < (a.item ->> 'index')::bigint
          OR ((b.item ->> 'index')::bigint > (a.item ->> 'index')::bigint AND b.item ->> 'id' IS NOT NULL)
        )
    );
  IF v_index IS NOT NULL THEN
    RAISE EXCEPTION 'set_entity_nominations: p_nominations[%] is a new nomination in an election for which the set holds another object', v_index
      USING ERRCODE = '22023';
  END IF;

  -- 1. The rows in reach that the set does not keep: the ones it leaves out and the stored row of every move.
  SELECT COALESCE(array_agg(k.id), ARRAY[]::uuid[]) INTO v_delete_ids
  FROM (SELECT r.key::uuid AS id FROM jsonb_object_keys(v_reach) AS r (key)) k
  WHERE k.id <> ALL (v_kept_ids);

  IF cardinality(v_delete_ids) > 0 THEN
    DELETE FROM public.nominations n
    WHERE n.id = ANY (v_delete_ids);
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> cardinality(v_delete_ids) THEN
      RAISE EXCEPTION USING MESSAGE = c_unwritten, ERRCODE = '42501';
    END IF;
    v_deleted := cardinality(v_delete_ids);
  END IF;

  -- 2 and 3. The kept rows first, then the new ones, each in the order of the set.
  FOR v_item IN
    SELECT t.item
    FROM jsonb_array_elements(v_plan) AS t (item)
    ORDER BY (t.item ->> 'new')::boolean, (t.item ->> 'index')::bigint
  LOOP
    v_is_new := (v_item ->> 'new')::boolean;
    v_election_id := (v_item ->> 'election_id')::uuid;
    v_constituency_id := (v_item ->> 'constituency_id')::uuid;
    v_round := (v_item ->> 'round')::integer;
    v_symbol := v_item ->> 'symbol';
    v_kind := v_item ->> 'kind';
    v_parent_entity_id := (v_item ->> 'parent_entity_id')::uuid;
    v_name := v_item ->> 'name';

    IF v_is_new THEN
      -- The caller's own row, with no parent. Its id is the caller's to read.
      v_stored_symbol := v_symbol;
      v_stored_parent := NULL;
      v_stored_custom := CASE WHEN v_kind = 'other' THEN jsonb_build_object(c_requested, v_name) END;

      INSERT INTO public.nominations (
        project_id, candidate_id, organization_id,
        election_id, constituency_id, election_round, election_symbol, custom_data
      )
      VALUES (
        v_project_id,
        CASE WHEN p_entity_type = 'candidate' THEN p_entity_id END,
        CASE WHEN p_entity_type = 'organization' THEN p_entity_id END,
        v_election_id, v_constituency_id, v_round, v_stored_symbol, v_stored_custom
      )
      RETURNING id INTO v_row_id;
      v_inserted := v_inserted + 1;
    ELSE
      v_row_id := (v_item ->> 'id')::uuid;
      v_stored := v_reach -> v_row_id::text;
      v_stored_symbol := v_stored ->> 'election_symbol';
      v_stored_parent := (v_stored ->> 'parent_nomination_id')::uuid;
      v_stored_custom := NULLIF(v_stored -> 'custom_data', 'null'::jsonb);
    END IF;

    -- What the row is to hold: `keep` leaves the parent and the custom data, `other` sets the requested name, and `entity` and `none` remove it. Every other key of the custom data is kept.
    IF v_kind = 'keep' THEN
      v_target_parent := v_stored_parent;
      v_target_custom := v_stored_custom;
    ELSIF v_kind = 'other' THEN
      v_target_parent := NULL;
      v_target_custom := CASE WHEN jsonb_typeof(v_stored_custom) = 'object' THEN v_stored_custom ELSE '{}'::jsonb END
        || jsonb_build_object(c_requested, v_name);
    ELSE
      v_target_parent := NULL;
      v_target_custom := CASE WHEN jsonb_typeof(v_stored_custom) = 'object' THEN v_stored_custom - c_requested ELSE v_stored_custom END;

      IF v_kind = 'entity' THEN
        -- The parent's nomination at the contest, created where it holds none.
        SELECT r.nomination_id, r.created
        INTO v_target_parent, v_parent_created
        FROM private.parent_nomination_resolved(
          v_project_id, v_parent_type, v_parent_entity_id, v_election_id, v_constituency_id, v_round,
          'set_entity_nominations', format('p_nominations[%s]', v_item ->> 'index')) AS r;

        IF v_parent_created THEN
          v_parents_created := v_parents_created + 1;
        END IF;
        IF v_target_parent IS NULL THEN
          RAISE EXCEPTION USING MESSAGE = c_unwritten, ERRCODE = '42501';
        END IF;
      END IF;
    END IF;

    v_symbol_differs := v_symbol IS DISTINCT FROM v_stored_symbol;
    v_parent_differs := v_target_parent IS DISTINCT FROM v_stored_parent;
    v_custom_differs := v_target_custom IS DISTINCT FROM v_stored_custom;

    IF NOT (v_symbol_differs OR v_parent_differs OR v_custom_differs) THEN
      IF NOT v_is_new THEN
        v_unchanged := v_unchanged + 1;
      END IF;
      CONTINUE;
    END IF;

    -- One statement, naming only the columns that differ, and the confirmation wherever the custom data is written.
    IF v_symbol_differs AND v_parent_differs AND v_custom_differs THEN
      UPDATE public.nominations
      SET election_symbol = v_symbol, parent_nomination_id = v_target_parent, custom_data = v_target_custom,
          confirmed = confirmed AND NOT COALESCE(v_target_custom ? c_requested, false)
      WHERE id = v_row_id;
    ELSIF v_symbol_differs AND v_parent_differs THEN
      UPDATE public.nominations
      SET election_symbol = v_symbol, parent_nomination_id = v_target_parent
      WHERE id = v_row_id;
    ELSIF v_symbol_differs AND v_custom_differs THEN
      UPDATE public.nominations
      SET election_symbol = v_symbol, custom_data = v_target_custom,
          confirmed = confirmed AND NOT COALESCE(v_target_custom ? c_requested, false)
      WHERE id = v_row_id;
    ELSIF v_parent_differs AND v_custom_differs THEN
      UPDATE public.nominations
      SET parent_nomination_id = v_target_parent, custom_data = v_target_custom,
          confirmed = confirmed AND NOT COALESCE(v_target_custom ? c_requested, false)
      WHERE id = v_row_id;
    ELSIF v_symbol_differs THEN
      UPDATE public.nominations
      SET election_symbol = v_symbol
      WHERE id = v_row_id;
    ELSIF v_parent_differs THEN
      UPDATE public.nominations
      SET parent_nomination_id = v_target_parent
      WHERE id = v_row_id;
    ELSE
      UPDATE public.nominations
      SET custom_data = v_target_custom,
          confirmed = confirmed AND NOT COALESCE(v_target_custom ? c_requested, false)
      WHERE id = v_row_id;
    END IF;

    -- A row that row-level security hides is not an error and not a target: zero rows.
    IF NOT FOUND THEN
      RAISE EXCEPTION USING MESSAGE = c_unwritten, ERRCODE = '42501';
    END IF;

    IF NOT v_is_new THEN
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  -- Raise the end-of-transaction parent rule inside this call, and leave the constraint deferred.
  SET CONSTRAINTS public.nominations_parent_required IMMEDIATE;
  SET CONSTRAINTS public.nominations_parent_required DEFERRED;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'updated', v_updated,
    'deleted', v_deleted,
    'unchanged', v_unchanged,
    'parents_created', v_parents_created);
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.set_entity_nominations (public.entity_type, uuid, jsonb)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.set_entity_nominations (public.entity_type, uuid, jsonb) TO authenticated;
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
-- Invitation RPC functions
--
-- Functions:
-- - create_invitations() - seed a batch of invitations in one project, stating whether each invited entity is confirmed and which nominations it holds, and return each generated code once
-- - private.invitation_mode_allowed() - whether the project allows the registration mode of an open invitation
-- - private.email_holds_grant_in_project() - whether a user with a confirmed address holds a grant in a project
-- - invitation_code_status() - whether a code is valid, used or unknown
-- - invitation_link_request() - the address a sign-in mail may go to, or null
-- - invitation_link_release() - give back what a link request took when no mail went out
-- - recovery_link_request() - which mail a recovery request for an address earns, or null
-- - invitation_code_claimant_email() - the claimant's address of a used code, under an attempt limit
-- - invitation_link_witness_open(), invitation_link_witness() - whether the background work of one link request has ended
-- - claim_invitations() - turn the caller's open invitations into grants
--
-- The six `invitation_*` functions and recovery_link_request are the service role's: an Edge Function calls them with values an anonymous visitor typed, and no API role can execute them. claim_invitations is the signed-in user's and nobody else's.
--
-- Depends on:
-- - 102-entities.sql (the four entity tables)
-- - 104-nominations.sql (public.nominations, its triggers and the constraint trigger nominations_parent_required)
-- - 300-auth-tables.sql (public.grants)
-- - 301-auth-functions.sql (private.entity_project_id, private.user_password_set, private.registration_mode_allowed)
-- - 305-invitations.sql (public.invitations, its insert trigger, its policies and private.invitation_code_hash)
-- - 503-entity-rpcs.sql (private.nomination_list_checked, private.nomination_object_checked, private.parent_nomination_resolved)
-- - auth.users (Supabase Auth)
--------------------------------------------------------------------------------
-- localized_has_text: does a localized string say anything
--
-- True when the value is a JSON object with at least one member whose text is not blank. NULL, a non-object and an object of blank or null members are all false.
--
-- create_invitations is SECURITY INVOKER and calls it as its caller, so `authenticated` and `service_role` hold EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.localized_has_text (p_val jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT CASE
    WHEN jsonb_typeof(p_val) = 'object' THEN
      EXISTS (SELECT 1 FROM jsonb_each_text(p_val) AS t WHERE btrim(t.value) <> '')
    ELSE false
  END;
$$;

REVOKE
EXECUTE ON FUNCTION private.localized_has_text (jsonb)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION private.localized_has_text (jsonb) TO authenticated,
service_role;

--------------------------------------------------------------------------------
-- create_invitations RPC: seed a batch of invitations in one project, stating whether each invited entity is confirmed and which nominations it holds
--
-- p_project_id, p_invitations and p_confirm_entity are REQUIRED and none carries a DEFAULT: every row of the batch belongs to p_project_id, and a NULL p_confirm_entity is refused. p_invitations is a JSON array of items `{ scope?, role?, target_type?, target_id?, external_id?, email?, expires_at?, nominations? }`. `scope` defaults to `entity` and `role` to `editor`. An entity-scope item names its entity by `target_type` and exactly one of `target_id` and `external_id`; a project-scope item promises a role on p_project_id itself. An item with an `email` is bound to that address, and one without gets a generated code.
--
-- The plaintext of a generated code exists only in this function's return value: the table holds its hash, which no API role can read, so a code that is lost is replaced by deleting the unclaimed invitation and seeding another. The code is read from the transaction-local setting the insert trigger writes, and the setting is cleared straight after.
--
-- SECURITY INVOKER: each row is inserted as the caller, so the INSERT policy of public.invitations decides who may promise which grant, exactly as it does for a direct insert, and this body holds no authority rule of its own. An `external_id` is resolved under the caller's row-level security, inside p_project_id only. The nominations are written as the caller too, so the policies, the column grants and the triggers of public.nominations decide every statement. A service-role caller bypasses the policies and is bound by the tables' CHECK constraints and triggers.
--
-- p_confirm_entity says whether the call confirms the entities it invites. `true` confirms each named entity of the batch, in the same transaction and as the caller, so enforce_entity_immutability asks `entity.confirm`. A candidate has a name when its first and last name are both non-blank; the other three types when their localized `name` has text. An entity without a name stays unconfirmed. `false` confirms no one. No call unconfirms an entity, no item key overrides the call's value, a project-scope promise confirms nothing, and deleting the invitation later leaves the entity confirmed.
--
-- NOMINATIONS. An entity-scope item for a candidate or an organization may carry `nominations`, a JSON array of nomination objects of the invited entity. The array is checked by `private.nomination_list_checked`, so it holds at most 1000 objects, and the shape of each object by `private.nomination_object_checked`, as set_entity_nominations checks its own. The keys of one object:
--   id              - a uuid: the object describes that nomination of the invited entity. Absent: it describes a new one.
--   election_id     - a uuid, required: an election of p_project_id the caller can read. With `id` it must be the stored row's.
--   constituency_id - a uuid, required. With `id` it must be the stored row's: an invitation moves no nomination.
--   election_round  - an integer, optional. A new nomination without one is written at its election's current_round. With `id`, a stated round must be the stored row's.
--   election_symbol - a string or null. It is trimmed; a blank one is stored as NULL, and one longer than 50 characters is refused.
--   parent          - `{"kind":"none"}`, `{"kind":"entity","entity_type","entity_id"}`, `{"kind":"other","name"}` or `{"kind":"keep"}`, as set_entity_nominations takes them; `keep` only with an `id`. A candidate names an organization and an organization an alliance.
--   confirmed       - true or false, required on every object.
--   custom_data     - a JSON object, optional, written over the stored custom data key by key. It may not carry `requestedParentOrganization`, which only a parent of kind `other` sets.
--   name, short_name, info, color, image - a JSON object or null; sort_order - an integer or null; subtype, external_id - a string or null. Each optional.
-- On an object with an `id`, a column the object does not state keeps its stored value. Any other key is not read.
--
-- An object creates or updates a nomination; an invitation never deletes one. For a parent of kind `entity`, the parent's nomination at the contest is asked of `private.parent_nomination_resolved`, which refuses a parent of another project and creates the parent's bare, unconfirmed row where it holds none. A new nomination is then inserted with its parent set and without `confirmed`, which the INSERT column grant leaves out, so it starts unconfirmed, and an object that states it confirmed is confirmed by an UPDATE of the new row. An object with an `id` whose values all equal the stored row's is not written; otherwise one UPDATE writes every column at its target, the stated confirmation included. The custom data is the stated object written over the stored one, then `other` sets the requested name, `entity` and `none` remove it, and `keep` leaves it.
--
-- Every UPDATE reads back the confirmation it wrote. Row-level security refuses an UPDATE without an error, and enforce_nomination_confirmation turns off the confirmation of a row that a caller without `nomination.confirm` edits; so an UPDATE that affects no row, a parent's nomination that cannot be found after it was created, and a confirmation read back other than the one stated each raise SQLSTATE 42501 with `<label> could not be written as stated`. A caller without `nomination.confirm` that states a new nomination confirmed meets enforce_nomination_confirmation's own refusal.
--
-- Where an election's type requires a candidate's nomination to have a parent or a requested name, `nominations_parent_required` judges it when the transaction ends. A call that wrote a nomination forces that constraint after its last item and sets it back to deferred, so the refusal (SQLSTATE 23514) is raised inside the call. A call that wrote none leaves the rows an earlier statement of the caller's transaction left pending to the end of the transaction.
--
-- Each item is checked before anything of it is written, its nominations whole, and is then written in this order: the invitation, the entity's confirmation, the nominations. The function creates no entity and no user and sends nothing. The whole batch is the caller's one transaction: a refused item, a duplicate or an unknown `external_id` raises, and no row of the batch is written. A malformed batch, item or object raises SQLSTATE 22023 naming the item's index, and an object's as `p_invitations[<i>].nominations[<j>]`, and never an address. Refused besides the shapes: `nominations` on a project-scope item or on an item for a faction or an alliance; the nominations of one entity on two items of the batch; nominations for an invited entity that is no entity of p_project_id the caller can read; an `id` that another object of the array names or that names no nomination of the invited entity; an election, a constituency or a round other than the named nomination's.
--
-- Returns a JSON array with one object per item, in order: `id`, `scope`, `target_type`, `target_id`, `role`, `email`, `expires_at`, `code` (the generated code as `XXXX-XXXX-XXXX`, or null on an email item) and `entity_confirmed`, the invited entity's confirmation after the item as the caller reads it (null on a project-scope item and for an entity the caller cannot read). An item that states `nominations` also answers `nominations`: `{"inserted", "updated", "unchanged", "parents_created"}`, each a count of nominations, `parents_created` counting the rows created for a party or an alliance.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_invitations (
  p_project_id uuid,
  p_invitations jsonb,
  p_confirm_entity boolean
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  c_requested constant text := 'requestedParentOrganization';
  v_item jsonb;
  v_ordinality bigint;
  v_index bigint;
  v_scope public.grant_scope_type;
  v_role public.grant_role_type;
  v_target_type public.entity_type;
  v_target_id uuid;
  v_external_id text;
  v_email text;
  v_expires_at timestamptz;
  v_id uuid;
  v_code text;
  v_entity_confirmed boolean;
  v_out jsonb := '[]'::jsonb;
  -- The nominations of one item.
  v_has_nominations boolean;
  v_entity_key text;
  v_entity_keys text[] := ARRAY[]::text[];
  v_parent_type public.entity_type;
  v_object jsonb;
  v_object_ordinality bigint;
  v_label text;
  v_checked jsonb;
  v_nomination_id uuid;
  v_named_ids uuid[];
  v_round integer;
  v_stored jsonb;
  v_columns jsonb;
  v_column text;
  v_column_type text;
  v_value jsonb;
  v_item_plan jsonb;
  v_entry jsonb;
  v_is_new boolean;
  v_kind text;
  v_target_parent uuid;
  v_parent_created boolean;
  v_target_custom jsonb;
  v_target jsonb;
  v_row_id uuid;
  v_row_confirmed boolean;
  v_inserted integer;
  v_updated integer;
  v_unchanged integer;
  v_parents_created integer;
  v_wrote_nomination boolean := false;
BEGIN
  IF p_confirm_entity IS NULL THEN
    RAISE EXCEPTION 'create_invitations: p_confirm_entity must be true or false'
      USING ERRCODE = '22023';
  END IF;

  IF p_invitations IS NULL OR jsonb_typeof(p_invitations) <> 'array' THEN
    RAISE EXCEPTION 'create_invitations: p_invitations must be a JSON array'
      USING ERRCODE = '22023';
  END IF;

  FOR v_item, v_ordinality IN
    SELECT t.item, t.ordinality
    FROM jsonb_array_elements(p_invitations) WITH ORDINALITY AS t (item, ordinality)
  LOOP
    v_index := v_ordinality - 1;

    IF jsonb_typeof(v_item) <> 'object' THEN
      RAISE EXCEPTION 'create_invitations: p_invitations[%] must be a JSON object', v_index
        USING ERRCODE = '22023';
    END IF;

    v_scope := COALESCE(v_item ->> 'scope', 'entity')::public.grant_scope_type;
    v_role := COALESCE(v_item ->> 'role', 'editor')::public.grant_role_type;
    v_target_type := (v_item ->> 'target_type')::public.entity_type;
    v_target_id := (v_item ->> 'target_id')::uuid;
    v_external_id := v_item ->> 'external_id';
    v_email := NULLIF(lower(btrim(v_item ->> 'email')), '');
    v_expires_at := (v_item ->> 'expires_at')::timestamptz;

    IF v_scope = 'entity' THEN
      IF v_target_type IS NULL THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] is an entity-scope item and needs a target_type', v_index
          USING ERRCODE = '22023';
      END IF;
      IF num_nonnulls(v_target_id, v_external_id) <> 1 THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] must name its entity by exactly one of target_id and external_id', v_index
          USING ERRCODE = '22023';
      END IF;
      IF v_external_id IS NOT NULL THEN
        -- Read as the caller, inside the named project only: an entity of another project, or one the caller cannot see, is not found.
        CASE v_target_type
          WHEN 'candidate' THEN
            SELECT e.id INTO v_target_id FROM public.candidates e WHERE e.project_id = p_project_id AND e.external_id = v_external_id;
          WHEN 'organization' THEN
            SELECT e.id INTO v_target_id FROM public.organizations e WHERE e.project_id = p_project_id AND e.external_id = v_external_id;
          WHEN 'faction' THEN
            SELECT e.id INTO v_target_id FROM public.factions e WHERE e.project_id = p_project_id AND e.external_id = v_external_id;
          WHEN 'alliance' THEN
            SELECT e.id INTO v_target_id FROM public.alliances e WHERE e.project_id = p_project_id AND e.external_id = v_external_id;
        END CASE;
        IF v_target_id IS NULL THEN
          RAISE EXCEPTION 'create_invitations: p_invitations[%] names no % with that external_id in the project', v_index, v_target_type
            USING ERRCODE = '22023';
        END IF;
      END IF;
    ELSE
      IF v_external_id IS NOT NULL THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] names an external_id, which only an entity-scope item may', v_index
          USING ERRCODE = '22023';
      END IF;
      IF v_scope = 'project' THEN
        v_target_id := COALESCE(v_target_id, p_project_id);
      END IF;
    END IF;

    -- The item's nominations, checked whole before anything of the item is written. Each object's checked values are kept in the item plan.
    v_has_nominations := v_item ? 'nominations';
    v_item_plan := '[]'::jsonb;
    IF v_has_nominations THEN
      IF v_scope <> 'entity' THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] states nominations, which only an entity-scope item may', v_index
          USING ERRCODE = '22023';
      END IF;
      IF v_target_type NOT IN ('candidate', 'organization') THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] states nominations for % %, which only a candidate or an organization may hold',
          v_index, (CASE v_target_type WHEN 'alliance' THEN 'an' ELSE 'a' END), v_target_type
          USING ERRCODE = '22023';
      END IF;

      PERFORM private.nomination_list_checked(
        v_item -> 'nominations', 'create_invitations', format('p_invitations[%s].nominations', v_index));

      v_entity_key := v_target_type::text || ':' || v_target_id::text;
      IF v_entity_key = ANY (v_entity_keys) THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] states nominations for an entity an earlier item of the batch states them for', v_index
          USING ERRCODE = '22023';
      END IF;
      v_entity_keys := v_entity_keys || v_entity_key;

      -- Read as the caller, before the invitation's policy has judged the caller: an entity the caller cannot read is no entity of the project, so the refusal says nothing about rows the caller cannot see.
      CASE v_target_type
        WHEN 'candidate' THEN
          PERFORM 1 FROM public.candidates e WHERE e.id = v_target_id AND e.project_id = p_project_id;
        ELSE
          PERFORM 1 FROM public.organizations e WHERE e.id = v_target_id AND e.project_id = p_project_id;
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] states nominations for an entity that is no entity of the project', v_index
          USING ERRCODE = '22023';
      END IF;

      -- A candidate stands under an organization and an organization under an alliance.
      v_parent_type := CASE v_target_type
        WHEN 'candidate' THEN 'organization'::public.entity_type
        ELSE 'alliance'::public.entity_type
      END;
      v_named_ids := ARRAY[]::uuid[];

      FOR v_object, v_object_ordinality IN
        SELECT t.item, t.ordinality
        FROM jsonb_array_elements(v_item -> 'nominations') WITH ORDINALITY AS t (item, ordinality)
      LOOP
        v_label := format('p_invitations[%s].nominations[%s]', v_index, v_object_ordinality - 1);

        -- The shape of the object, then the keys only an invitation reads, then the checks that read rows.
        v_checked := private.nomination_object_checked(v_object, v_parent_type, 'create_invitations', v_label);
        v_nomination_id := (v_checked ->> 'id')::uuid;

        IF jsonb_typeof(v_object -> 'confirmed') IS DISTINCT FROM 'boolean' THEN
          RAISE EXCEPTION 'create_invitations: % needs confirmed, which is true or false', v_label
            USING ERRCODE = '22023';
        END IF;

        IF v_object ? 'election_round'
           AND (jsonb_typeof(v_object -> 'election_round') <> 'number'
             OR NOT pg_input_is_valid(v_object ->> 'election_round', 'integer')) THEN
          RAISE EXCEPTION 'create_invitations: % has an election_round that is not an integer', v_label
            USING ERRCODE = '22023';
        END IF;

        SELECT e.current_round INTO v_round
        FROM public.elections e
        WHERE e.id = (v_checked ->> 'election_id')::uuid
          AND e.project_id = p_project_id;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'create_invitations: % names an election_id that is no election of the project the caller can read', v_label
            USING ERRCODE = '22023';
        END IF;
        IF v_object ? 'election_round' THEN
          v_round := (v_object ->> 'election_round')::integer;
        END IF;

        -- The stated columns, each by its JSON type; the symbol as the shape check trimmed it.
        v_columns := CASE
          WHEN v_object ? 'election_symbol' THEN jsonb_build_object('election_symbol', v_checked ->> 'symbol')
          ELSE '{}'::jsonb
        END;
        FOR v_column, v_column_type IN
          SELECT c.column_name, c.json_type
          FROM (
            VALUES
              (1, 'name', 'a JSON object'),
              (2, 'short_name', 'a JSON object'),
              (3, 'info', 'a JSON object'),
              (4, 'color', 'a JSON object'),
              (5, 'image', 'a JSON object'),
              (6, 'sort_order', 'an integer'),
              (7, 'subtype', 'a string'),
              (8, 'external_id', 'a string')
          ) AS c (ordinal, column_name, json_type)
          ORDER BY c.ordinal
        LOOP
          IF v_object ? v_column THEN
            v_value := v_object -> v_column;
            IF jsonb_typeof(v_value) <> 'null' AND NOT (CASE v_column_type
                WHEN 'a JSON object' THEN jsonb_typeof(v_value) = 'object'
                WHEN 'an integer' THEN jsonb_typeof(v_value) = 'number' AND pg_input_is_valid(v_value #>> '{}', 'integer')
                ELSE jsonb_typeof(v_value) = 'string'
              END) THEN
              RAISE EXCEPTION 'create_invitations: % has a % that is neither % nor null', v_label, v_column, v_column_type
                USING ERRCODE = '22023';
            END IF;
            v_columns := v_columns || jsonb_build_object(v_column, v_value);
          END IF;
        END LOOP;

        IF v_object ? 'custom_data' THEN
          IF jsonb_typeof(v_object -> 'custom_data') <> 'object' THEN
            RAISE EXCEPTION 'create_invitations: % has a custom_data that is not a JSON object', v_label
              USING ERRCODE = '22023';
          END IF;
          IF (v_object -> 'custom_data') ? c_requested THEN
            RAISE EXCEPTION 'create_invitations: % states requestedParentOrganization in custom_data, which only a parent of kind other sets', v_label
              USING ERRCODE = '22023';
          END IF;
        END IF;

        v_stored := NULL;
        IF v_nomination_id IS NOT NULL THEN
          IF v_nomination_id = ANY (v_named_ids) THEN
            RAISE EXCEPTION 'create_invitations: % names an id that another object of the array names', v_label
              USING ERRCODE = '22023';
          END IF;
          v_named_ids := v_named_ids || v_nomination_id;

          -- The stored row, read as the caller: a nomination of the invited entity in p_project_id.
          SELECT jsonb_build_object(
              'election_id', n.election_id,
              'constituency_id', n.constituency_id,
              'election_round', n.election_round,
              'election_symbol', n.election_symbol,
              'parent_nomination_id', n.parent_nomination_id,
              'custom_data', n.custom_data,
              'confirmed', n.confirmed,
              'name', n.name,
              'short_name', n.short_name,
              'info', n.info,
              'color', n.color,
              'image', n.image,
              'sort_order', n.sort_order,
              'subtype', n.subtype,
              'external_id', n.external_id)
          INTO v_stored
          FROM public.nominations n
          WHERE n.id = v_nomination_id
            AND n.project_id = p_project_id
            AND CASE v_target_type
              WHEN 'candidate' THEN n.candidate_id = v_target_id
              ELSE n.organization_id = v_target_id
            END;
          IF v_stored IS NULL THEN
            RAISE EXCEPTION 'create_invitations: % names an id that is no nomination of the invited entity', v_label
              USING ERRCODE = '22023';
          END IF;

          IF (v_stored ->> 'election_id')::uuid <> (v_checked ->> 'election_id')::uuid THEN
            RAISE EXCEPTION 'create_invitations: % names an election_id other than its nomination''s', v_label
              USING ERRCODE = '22023';
          END IF;
          IF (v_stored ->> 'constituency_id')::uuid <> (v_checked ->> 'constituency_id')::uuid THEN
            RAISE EXCEPTION 'create_invitations: % names a constituency_id other than its nomination''s; an invitation moves no nomination', v_label
              USING ERRCODE = '22023';
          END IF;
          IF v_object ? 'election_round'
             AND (v_stored ->> 'election_round')::integer IS DISTINCT FROM v_round THEN
            RAISE EXCEPTION 'create_invitations: % names an election_round other than its nomination''s', v_label
              USING ERRCODE = '22023';
          END IF;
          v_round := (v_stored ->> 'election_round')::integer;
        ELSIF v_checked ->> 'kind' = 'keep' THEN
          RAISE EXCEPTION 'create_invitations: % keeps a parent, which only an object that names an id may', v_label
            USING ERRCODE = '22023';
        END IF;

        v_item_plan := v_item_plan || jsonb_build_array(jsonb_build_object(
          'label', v_label,
          'id', v_nomination_id,
          'election_id', v_checked -> 'election_id',
          'constituency_id', v_checked -> 'constituency_id',
          'round', v_round,
          'kind', v_checked -> 'kind',
          'parent_entity_id', v_checked -> 'parent_entity_id',
          'name', v_checked -> 'name',
          'confirmed', v_object -> 'confirmed',
          'custom_data', v_object -> 'custom_data',
          'columns', v_columns,
          'stored', v_stored));
      END LOOP;
    END IF;

    INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email, expires_at)
    VALUES (p_project_id, v_scope, v_target_type, v_target_id, v_role, v_email, v_expires_at)
    RETURNING id INTO v_id;

    v_code := NULLIF(current_setting('openvaa.generated_invitation_code', true), '');
    PERFORM set_config('openvaa.generated_invitation_code', '', true);

    IF p_confirm_entity AND v_scope = 'entity' THEN
      CASE v_target_type
        WHEN 'candidate' THEN
          UPDATE public.candidates e SET confirmed = true
          WHERE e.id = v_target_id AND e.project_id = p_project_id AND NOT e.confirmed
            AND btrim(e.first_name) <> '' AND btrim(e.last_name) <> '';
        WHEN 'organization' THEN
          UPDATE public.organizations e SET confirmed = true
          WHERE e.id = v_target_id AND e.project_id = p_project_id AND NOT e.confirmed
            AND private.localized_has_text(e.name);
        WHEN 'faction' THEN
          UPDATE public.factions e SET confirmed = true
          WHERE e.id = v_target_id AND e.project_id = p_project_id AND NOT e.confirmed
            AND private.localized_has_text(e.name);
        WHEN 'alliance' THEN
          UPDATE public.alliances e SET confirmed = true
          WHERE e.id = v_target_id AND e.project_id = p_project_id AND NOT e.confirmed
            AND private.localized_has_text(e.name);
      END CASE;
    END IF;

    -- The item's nominations, in the order of its array.
    v_inserted := 0;
    v_updated := 0;
    v_unchanged := 0;
    v_parents_created := 0;
    FOR v_entry IN
      SELECT t.entry
      FROM jsonb_array_elements(v_item_plan) WITH ORDINALITY AS t (entry, ordinality)
      ORDER BY t.ordinality
    LOOP
      v_label := v_entry ->> 'label';
      v_stored := v_entry -> 'stored';
      v_is_new := jsonb_typeof(v_stored) IS DISTINCT FROM 'object';
      v_kind := v_entry ->> 'kind';
      v_round := (v_entry ->> 'round')::integer;

      -- The parent: `keep` leaves the stored one, `entity` asks for the parent's nomination at the contest, created where it holds none, and `none` and `other` link nothing.
      v_target_parent := NULL;
      IF v_kind = 'keep' THEN
        v_target_parent := (v_stored ->> 'parent_nomination_id')::uuid;
      ELSIF v_kind = 'entity' THEN
        SELECT r.nomination_id, r.created
        INTO v_target_parent, v_parent_created
        FROM private.parent_nomination_resolved(
          p_project_id, v_parent_type, (v_entry ->> 'parent_entity_id')::uuid,
          (v_entry ->> 'election_id')::uuid, (v_entry ->> 'constituency_id')::uuid, v_round,
          'create_invitations', v_label) AS r;

        IF v_parent_created THEN
          v_parents_created := v_parents_created + 1;
          v_wrote_nomination := true;
        END IF;
        IF v_target_parent IS NULL THEN
          RAISE EXCEPTION 'create_invitations: % could not be written as stated', v_label
            USING ERRCODE = '42501';
        END IF;
      END IF;

      -- The custom data: the stated keys over the stored ones, then the parent's kind.
      v_target_custom := NULLIF(v_stored -> 'custom_data', 'null'::jsonb);
      IF jsonb_typeof(v_entry -> 'custom_data') = 'object' THEN
        v_target_custom := CASE WHEN jsonb_typeof(v_target_custom) = 'object' THEN v_target_custom ELSE '{}'::jsonb END
          || (v_entry -> 'custom_data');
      END IF;
      IF v_kind = 'other' THEN
        v_target_custom := CASE WHEN jsonb_typeof(v_target_custom) = 'object' THEN v_target_custom ELSE '{}'::jsonb END
          || jsonb_build_object(c_requested, v_entry ->> 'name');
      ELSIF v_kind IN ('entity', 'none') AND jsonb_typeof(v_target_custom) = 'object' THEN
        v_target_custom := v_target_custom - c_requested;
      END IF;

      -- What the row is to hold: each column stated, or as stored when not stated.
      v_target := CASE WHEN v_is_new THEN '{}'::jsonb ELSE v_stored END
        || jsonb_build_object(
          'parent_nomination_id', v_target_parent,
          'custom_data', v_target_custom,
          'confirmed', v_entry -> 'confirmed')
        || (v_entry -> 'columns');

      IF v_is_new THEN
        INSERT INTO public.nominations (
          project_id, candidate_id, organization_id,
          election_id, constituency_id, election_round, parent_nomination_id, election_symbol, custom_data,
          name, short_name, info, color, image, sort_order, subtype, external_id
        )
        VALUES (
          p_project_id,
          CASE WHEN v_target_type = 'candidate' THEN v_target_id END,
          CASE WHEN v_target_type = 'organization' THEN v_target_id END,
          (v_entry ->> 'election_id')::uuid, (v_entry ->> 'constituency_id')::uuid, v_round,
          v_target_parent, v_target ->> 'election_symbol', v_target_custom,
          NULLIF(v_target -> 'name', 'null'::jsonb), NULLIF(v_target -> 'short_name', 'null'::jsonb),
          NULLIF(v_target -> 'info', 'null'::jsonb), NULLIF(v_target -> 'color', 'null'::jsonb),
          NULLIF(v_target -> 'image', 'null'::jsonb), (v_target ->> 'sort_order')::integer,
          v_target ->> 'subtype', v_target ->> 'external_id'
        )
        RETURNING id INTO v_row_id;
        v_inserted := v_inserted + 1;
        v_wrote_nomination := true;

        -- A new row starts unconfirmed; a stated confirmation is a write of its own.
        IF (v_target ->> 'confirmed')::boolean THEN
          UPDATE public.nominations n
          SET confirmed = true
          WHERE n.id = v_row_id
          RETURNING n.confirmed INTO v_row_confirmed;
          IF NOT FOUND OR v_row_confirmed IS DISTINCT FROM true THEN
            RAISE EXCEPTION 'create_invitations: % could not be written as stated', v_label
              USING ERRCODE = '42501';
          END IF;
        END IF;
      ELSIF v_target IS NOT DISTINCT FROM v_stored THEN
        v_unchanged := v_unchanged + 1;
      ELSE
        v_row_id := (v_entry ->> 'id')::uuid;
        UPDATE public.nominations n
        SET election_symbol = v_target ->> 'election_symbol',
            parent_nomination_id = v_target_parent,
            custom_data = v_target_custom,
            confirmed = (v_target ->> 'confirmed')::boolean,
            name = NULLIF(v_target -> 'name', 'null'::jsonb),
            short_name = NULLIF(v_target -> 'short_name', 'null'::jsonb),
            info = NULLIF(v_target -> 'info', 'null'::jsonb),
            color = NULLIF(v_target -> 'color', 'null'::jsonb),
            image = NULLIF(v_target -> 'image', 'null'::jsonb),
            sort_order = (v_target ->> 'sort_order')::integer,
            subtype = v_target ->> 'subtype',
            external_id = v_target ->> 'external_id'
        WHERE n.id = v_row_id
        RETURNING n.confirmed INTO v_row_confirmed;
        -- Row-level security hides a row without an error, and a caller without nomination.confirm has its edit unconfirmed: either is a statement not written as stated.
        IF NOT FOUND OR v_row_confirmed IS DISTINCT FROM (v_target ->> 'confirmed')::boolean THEN
          RAISE EXCEPTION 'create_invitations: % could not be written as stated', v_label
            USING ERRCODE = '42501';
        END IF;
        v_updated := v_updated + 1;
        v_wrote_nomination := true;
      END IF;
    END LOOP;

    -- The invited entity's confirmation after the item, as the caller reads it.
    v_entity_confirmed := NULL;
    IF v_scope = 'entity' THEN
      CASE v_target_type
        WHEN 'candidate' THEN
          SELECT e.confirmed INTO v_entity_confirmed FROM public.candidates e WHERE e.id = v_target_id AND e.project_id = p_project_id;
        WHEN 'organization' THEN
          SELECT e.confirmed INTO v_entity_confirmed FROM public.organizations e WHERE e.id = v_target_id AND e.project_id = p_project_id;
        WHEN 'faction' THEN
          SELECT e.confirmed INTO v_entity_confirmed FROM public.factions e WHERE e.id = v_target_id AND e.project_id = p_project_id;
        WHEN 'alliance' THEN
          SELECT e.confirmed INTO v_entity_confirmed FROM public.alliances e WHERE e.id = v_target_id AND e.project_id = p_project_id;
      END CASE;
    END IF;

    v_out := v_out || jsonb_build_array(
      jsonb_build_object(
        'id', v_id,
        'scope', v_scope,
        'target_type', v_target_type,
        'target_id', v_target_id,
        'role', v_role,
        'email', v_email,
        'expires_at', v_expires_at,
        'code', v_code,
        'entity_confirmed', v_entity_confirmed
      ) || CASE
        WHEN v_has_nominations THEN jsonb_build_object(
          'nominations', jsonb_build_object(
            'inserted', v_inserted,
            'updated', v_updated,
            'unchanged', v_unchanged,
            'parents_created', v_parents_created))
        ELSE '{}'::jsonb
      END
    );
  END LOOP;

  -- Raise the end-of-transaction parent rule inside this call when it wrote a nomination, and leave the constraint deferred.
  IF v_wrote_nomination THEN
    SET CONSTRAINTS public.nominations_parent_required IMMEDIATE;
    SET CONSTRAINTS public.nominations_parent_required DEFERRED;
  END IF;

  RETURN v_out;
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.create_invitations (uuid, jsonb, boolean)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.create_invitations (uuid, jsonb, boolean) TO authenticated,
service_role;

--------------------------------------------------------------------------------
-- invitation_throttle: the windowed counters of the invitation helpers
--
-- One row per key, in one of two forms:
-- - `link:<project id>:<sha256 hex of the address>` counts the sign-in and recovery mails to one address in one project.
-- - `code:<project id>:<code hash>` counts claimant look-ups of one used code.
--
-- No key holds an address in clear. A `link:` key is taken only for an address a mail would go to and a `code:` key only for a code that names a claimed row, so a caller cannot fill the table with keys of its own making, and no key is derived from a request header.
--
-- Only the SECURITY DEFINER functions of this file read or write it: row-level security is enabled with no policy and every API role's privileges are revoked.
--------------------------------------------------------------------------------
CREATE TABLE private.invitation_throttle (
  key text PRIMARY KEY,
  -- Takes in the current window.
  count integer NOT NULL DEFAULT 1,
  -- When the current window began; invitation_throttle_take starts a new one once it has ended.
  window_start timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE private.invitation_throttle ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE private.invitation_throttle
FROM
  PUBLIC,
  anon,
  authenticated,
  service_role;

--------------------------------------------------------------------------------
-- invitation_throttle_take: count one take against a key
--
-- Returns true when the key, counting this take, is within p_max takes in its current window of p_window. A first take creates the key; a take after the window has ended starts a new window at 1. A refused take is counted and does not move the window. The advisory lock serialises concurrent takes of one key until the transaction ends.
--
-- Only the SECURITY DEFINER functions of this file call it, as their owner, so no API role holds EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.invitation_throttle_take (p_key text, p_max integer, p_window interval) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_count integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('invitation_throttle:' || p_key));

  INSERT INTO private.invitation_throttle AS t (key, count, window_start)
  VALUES (p_key, 1, now())
  ON CONFLICT (key) DO UPDATE
    SET count = CASE WHEN t.window_start + p_window <= now() THEN 1 ELSE t.count + 1 END,
        window_start = CASE WHEN t.window_start + p_window <= now() THEN now() ELSE t.window_start END
  RETURNING t.count INTO v_count;

  RETURN v_count <= p_max;
END;
$$;

REVOKE
EXECUTE ON FUNCTION private.invitation_throttle_take (text, integer, interval)
FROM
  PUBLIC,
  anon,
  authenticated,
  service_role;

--------------------------------------------------------------------------------
-- cleanup_invitation_throttle_on_delete: a deleted invitation leaves no throttle key
--
-- Deletes the `link:` keys of the row's address and of its pending address and the `code:` key of its code. An invitation that is deleted and seeded again is therefore not answered with the wait its predecessor left behind.
--
-- SECURITY DEFINER because the deleting caller holds nothing on the throttle table. search_path is pinned as on every definer function here.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_invitation_throttle_on_delete () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
BEGIN
  -- A null address or code hash makes its key null, which matches no row.
  DELETE FROM private.invitation_throttle t
  WHERE t.key IN (
    'link:' || OLD.project_id::text || ':' || encode(sha256(convert_to(OLD.email, 'UTF8')), 'hex'),
    'link:' || OLD.project_id::text || ':' || encode(sha256(convert_to(OLD.pending_email, 'UTF8')), 'hex'),
    'code:' || OLD.project_id::text || ':' || OLD.code_hash
  );
  RETURN OLD;
END;
$$;

CREATE TRIGGER cleanup_invitation_throttle
AFTER DELETE ON public.invitations FOR EACH ROW
EXECUTE FUNCTION public.cleanup_invitation_throttle_on_delete ();

-- Not an RPC. A trigger fires whatever EXECUTE its function carries, so nothing is lost by revoking it from the API roles.
REVOKE
EXECUTE ON FUNCTION public.cleanup_invitation_throttle_on_delete ()
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- invitation_mode_allowed: does the project allow the registration mode of this invitation?
--
-- The registration-mode condition, stated once for the three functions that read an open invitation: invitation_code_status, invitation_link_request and claim_invitations. Each treats a row this function refuses as absent.
--
-- WHICH ROWS ARE JUDGED. An entity-scope row whose target is a candidate or an organization: the registration-mode matrix has a row for those two types and for no other. Such a row is allowed when private.registration_mode_allowed says so for the row's project, its target type and its mode.
--
-- WHICH ARE NOT. A project-scope promise has no entity type, and the matrix has no row for a faction or an alliance: each is always allowed.
--
-- A ROW'S MODE is read from which of its two bindings is set: `code` for a row that holds a code hash, `email` for a row bound to an address.
--
-- The callers ask it of open rows only, so a claimed row is never judged: a registration that is finished stays as it is whatever the matrix says later. create_invitations does not ask it, so an invitation can be seeded while its mode is off and is honoured once the mode is on.
--
-- It runs as its caller. The three callers are definer functions, so no API role holds EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.invitation_mode_allowed (p_invitation public.invitations) RETURNS boolean LANGUAGE sql STABLE
SET
  search_path = '' AS $$
  SELECT CASE
    WHEN (p_invitation).scope <> 'entity' THEN true
    WHEN (p_invitation).target_type NOT IN ('candidate', 'organization') THEN true
    ELSE private.registration_mode_allowed(
      (p_invitation).project_id,
      (p_invitation).target_type::text,
      CASE WHEN (p_invitation).code_hash IS NOT NULL THEN 'code' ELSE 'email' END
    )
  END;
$$;

REVOKE
EXECUTE ON FUNCTION private.invitation_mode_allowed (public.invitations)
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- email_holds_grant_in_project: does a user with this confirmed address hold a grant in the project?
--
-- The grant-holder test, stated once for the two functions that decide whether a mail may go to an address: invitation_link_request and recovery_link_request.
--
-- True when a user whose address equals p_email and is confirmed holds a project-scope grant on p_project_id or an entity-scope grant on one of its entities. Holding a global or an account grant alone is not holding a grant in the project.
--
-- The stored address is trimmed and lower-cased before it is compared. p_email is compared as given, so the callers pass it trimmed and lower-cased.
--
-- It runs as its caller. The two callers are definer functions, so no API role holds EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.email_holds_grant_in_project (p_project_id uuid, p_email text) RETURNS boolean LANGUAGE sql STABLE
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE lower(btrim(u.email)) = p_email
      AND u.email_confirmed_at IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.grants g
        WHERE g.user_id = u.id
          AND (
            (g.scope = 'project' AND g.target_id = p_project_id)
            OR (g.scope = 'entity' AND private.entity_project_id(g.target_type, g.target_id) = p_project_id)
          )
      )
  );
$$;

REVOKE
EXECUTE ON FUNCTION private.email_holds_grant_in_project (uuid, text)
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- invitation_code_status: is this code valid, used or unknown
--
-- Answers one of three words about the row of p_project_id whose code hash equals the hash of the code as typed:
-- - `used` when the row is claimed, which is `claimed_at IS NOT NULL` and so stays true after the claimant is deleted;
-- - `unknown` when the row is unclaimed and expired, when it is open but its registration mode is switched off (private.invitation_mode_allowed), and when the project holds no such row, which includes the code of another project;
-- - `valid` otherwise.
--
-- A switched-off mode has no answer of its own: the status and the body are those of a code that names nothing. The mode is asked only of a row that is open and unexpired, so such a row costs one read of its project's settings row that a code naming nothing does not.
--
-- It returns nothing else about the row, and it counts nothing: an unknown code is defended by its 60 bits.
--
-- SECURITY DEFINER because no API role can read `code_hash`.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invitation_code_status (p_project_id uuid, p_code text) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (
      SELECT CASE
        WHEN i.claimed_at IS NOT NULL THEN 'used'
        WHEN i.expires_at IS NOT NULL AND i.expires_at <= now() THEN 'unknown'
        WHEN NOT private.invitation_mode_allowed(i) THEN 'unknown'
        ELSE 'valid'
      END
      FROM public.invitations i
      WHERE i.project_id = p_project_id
        AND i.code_hash = private.invitation_code_hash(p_code)
    ),
    'unknown'
  );
$$;

--------------------------------------------------------------------------------
-- invitation_link_request: may a sign-in mail go out, and to which address
--
-- Returns the address a sign-in mail may be sent to, or null for "do nothing". The caller sends exactly one mail to a non-null answer, or gives the answer back through invitation_link_release.
--
-- With a code (p_code is not null) the code alone decides:
-- - It names an open row and p_email is not blank: the address is the candidate, unless the row's pending address was bound less than 60 seconds ago.
-- - It names a claimed row whose claimant still exists: the candidate is the claimant's own address, whatever p_email holds, read through invitation_code_claimant_email and so counted against that code's look-up budget.
-- - It names nothing, an expired row, an open row whose registration mode is switched off (private.invitation_mode_allowed), or a claimed row whose claimant is gone: null.
--
-- Without a code, p_email is the candidate when the project holds an open invitation for it whose registration mode is allowed, or when a user with that confirmed address holds a grant in the project (private.email_holds_grant_in_project): a project-scope grant on the project or an entity-scope grant on one of its entities. Holding a global or an account grant alone does not make an address eligible.
--
-- A candidate then takes its address slot, one per address per project per 60 seconds, and the answer is null when the slot is taken. recovery_link_request takes the same slot, so a recovery mail and a sign-in mail to one address are limited together. Only after that is the address bound to an open code row as its pending address. A null answer has therefore changed no invitation row, and no slot is taken for an address no mail would go to.
--
-- A switched-off mode is answered as an unknown code or an uninvited address is: null, before a slot is asked for and before anything is written. It changes nothing for a claimed code, whose claimant is still answered, or for a user who holds a grant in the project.
--
-- Eligibility follows the rows as they are: whether an invitation's creator still holds the authority to promise it is not asked.
--
-- SECURITY DEFINER because it reads auth.users and `code_hash` and writes the pending address, none of which an API role can.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invitation_link_request (
  p_project_id uuid,
  p_email text DEFAULT NULL,
  p_code text DEFAULT NULL
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_email text := NULLIF(lower(btrim(p_email)), '');
  v_row public.invitations%ROWTYPE;
  v_bind boolean := false;
  v_candidate text;
BEGIN
  IF p_project_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_code IS NOT NULL THEN
    SELECT i.* INTO v_row
    FROM public.invitations i
    WHERE i.project_id = p_project_id
      AND i.code_hash = private.invitation_code_hash(p_code)
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN NULL;
    ELSIF v_row.claimed_at IS NOT NULL THEN
      v_candidate := public.invitation_code_claimant_email(p_project_id, p_code);
    ELSIF v_row.expires_at IS NOT NULL AND v_row.expires_at <= now() THEN
      RETURN NULL;
    ELSIF NOT private.invitation_mode_allowed(v_row) THEN
      RETURN NULL;
    ELSIF v_email IS NULL THEN
      RETURN NULL;
    ELSIF v_row.pending_email_at IS NOT NULL AND v_row.pending_email_at + interval '60 seconds' > now() THEN
      RETURN NULL;
    ELSE
      v_candidate := v_email;
      v_bind := true;
    END IF;
  ELSIF v_email IS NOT NULL AND (
    EXISTS (
      SELECT 1
      FROM public.invitations i
      WHERE i.project_id = p_project_id
        AND i.email = v_email
        AND i.claimed_at IS NULL
        AND (i.expires_at IS NULL OR i.expires_at > now())
        AND private.invitation_mode_allowed(i)
    )
    OR private.email_holds_grant_in_project(p_project_id, v_email)
  ) THEN
    v_candidate := v_email;
  END IF;

  IF v_candidate IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT private.invitation_throttle_take(
    'link:' || p_project_id::text || ':' || encode(sha256(convert_to(lower(btrim(v_candidate)), 'UTF8')), 'hex'),
    1,
    interval '60 seconds'
  ) THEN
    RETURN NULL;
  END IF;

  IF v_bind THEN
    UPDATE public.invitations i
    SET pending_email = v_candidate, pending_email_at = now()
    WHERE i.id = v_row.id;
  END IF;

  RETURN v_candidate;
END;
$$;

--------------------------------------------------------------------------------
-- invitation_link_release: give back what a link request took
--
-- For a sign-in or a recovery request that was answered with an address to which no mail was then handed over. It deletes the address's slot in the project and, when p_code names an open row whose pending address is that address, clears the row's `pending_email_at`, so the same address, and the same binding of the same code, can be asked again at once.
--
-- It changes no claimed row and no other column, and it does nothing for an address that holds no slot. A look-up counted against a used code is not given back.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invitation_link_release (
  p_project_id uuid,
  p_email text,
  p_code text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_email text := NULLIF(lower(btrim(p_email)), '');
BEGIN
  IF p_project_id IS NULL OR v_email IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM private.invitation_throttle t
  WHERE t.key = 'link:' || p_project_id::text || ':' || encode(sha256(convert_to(v_email, 'UTF8')), 'hex');

  IF p_code IS NOT NULL THEN
    UPDATE public.invitations i
    SET pending_email_at = NULL
    WHERE i.project_id = p_project_id
      AND i.code_hash = private.invitation_code_hash(p_code)
      AND i.claimed_at IS NULL
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND i.pending_email = v_email;
  END IF;
END;
$$;

--------------------------------------------------------------------------------
-- recovery_link_request: which mail, if any, a recovery request for an address earns
--
-- Returns `{"email": <the address, trimmed and lower-cased>, "mail": <one of two words>}`, or null for "do nothing". The caller sends exactly one mail of the named kind to a non-null answer, or gives the answer back through invitation_link_release.
--
-- - `recovery` when a user with that confirmed address holds a grant in p_project_id (private.email_holds_grant_in_project). Whether the user has a password is not asked: opening a recovery link stores none, and the page it leads to sets one.
-- - `sign-in` when no such user exists and the project holds an open, unexpired invitation for the address whose registration mode is allowed (private.invitation_mode_allowed). Such an address has no password to recover, so it is sent the mail a sign-in request would have earned it.
-- - null for everything else: an address the project knows nothing of, the holder of a global or an account grant alone, an unconfirmed address, an expired or a claimed invitation, a null project and a blank address.
--
-- A non-null candidate then takes its address slot, one per address per project per 60 seconds, and the answer is null when the slot is taken. The slot is the one invitation_link_request takes, under the same key: a later link of either kind stops an unopened earlier one of either kind, so the two requests are limited together. No slot is taken for an address no mail would go to.
--
-- It creates no account, changes no invitation row and binds no address: the slot is all it writes. It takes a project and an address and nothing else, and it returns no user id, grant, name or reason. Which of the three outcomes an address got is known only to whoever can execute it, which is the service role alone.
--
-- SECURITY DEFINER because it reads auth.users and the grants of accounts that are not the caller's.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recovery_link_request (p_project_id uuid, p_email text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_email text := NULLIF(lower(btrim(p_email)), '');
  v_mail text;
BEGIN
  IF p_project_id IS NULL OR v_email IS NULL THEN
    RETURN NULL;
  END IF;

  IF private.email_holds_grant_in_project(p_project_id, v_email) THEN
    v_mail := 'recovery';
  ELSIF EXISTS (
    SELECT 1
    FROM public.invitations i
    WHERE i.project_id = p_project_id
      AND i.email = v_email
      AND i.claimed_at IS NULL
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND private.invitation_mode_allowed(i)
  ) THEN
    v_mail := 'sign-in';
  ELSE
    RETURN NULL;
  END IF;

  IF NOT private.invitation_throttle_take(
    'link:' || p_project_id::text || ':' || encode(sha256(convert_to(v_email, 'UTF8')), 'hex'),
    1,
    interval '60 seconds'
  ) THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object('email', v_email, 'mail', v_mail);
END;
$$;

--------------------------------------------------------------------------------
-- invitation_code_claimant_email: the address of the user who claimed a code
--
-- Returns the claimant's address for a claimed code row of p_project_id whose claimant still exists, and null otherwise. The address is what a password sign-in by code is attempted against, so each answer is counted against the code: ten per fifteen minutes, and null beyond that, which is the answer an unknown code gets. A code that names no claimed row, or one whose claimant is gone, is not counted and writes no throttle key.
--
-- The limit is keyed on the code row. A caller that guesses passwords for one code meets it whatever address or header it sends.
--
-- SECURITY DEFINER because it reads auth.users and `code_hash`. It returns a user's address to whoever can execute it, which is the service role alone.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invitation_code_claimant_email (p_project_id uuid, p_code text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_hash text := private.invitation_code_hash(p_code);
  v_email text;
BEGIN
  SELECT u.email INTO v_email
  FROM public.invitations i
  JOIN auth.users u ON u.id = i.claimed_by
  WHERE i.project_id = p_project_id
    AND i.code_hash = v_hash
    AND i.claimed_at IS NOT NULL
    AND NULLIF(btrim(u.email), '') IS NOT NULL;

  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT private.invitation_throttle_take('code:' || p_project_id::text || ':' || v_hash, 10, interval '15 minutes') THEN
    RETURN NULL;
  END IF;

  RETURN v_email;
END;
$$;

--------------------------------------------------------------------------------
-- invitation_link_witness: has the background work of one link request ended
--
-- A link request is answered before its work is done, and the answer is the same whether or not a mail goes out. The witness is how the service role learns, for one request it chose to watch, that the work has ended and whether a mail was handed over: it opens a record, passes the id along with the request, and reads the record afterwards.
--
-- An anonymous caller can neither create nor read a record. Opening is the service role's, and completing is an UPDATE of a record that exists and is still open, never an insert, so an id that was not opened writes nothing.
--
-- Row-level security is enabled with no policy and every API role's privileges are revoked: only the two SECURITY DEFINER functions below read or write the table.
--------------------------------------------------------------------------------
CREATE TABLE private.invitation_link_witness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_at timestamptz NOT NULL DEFAULT now(),
  -- Null while the work the record watches has not ended.
  completed_at timestamptz,
  -- `sent` when a mail was handed over, `not-sent` when the work ended without one.
  outcome text,
  CONSTRAINT invitation_link_witness_outcome_check CHECK (
    outcome IS NULL
    OR outcome IN ('sent', 'not-sent')
  )
);

ALTER TABLE private.invitation_link_witness ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE private.invitation_link_witness
FROM
  PUBLIC,
  anon,
  authenticated,
  service_role;

-- Opens a record and returns its id. Records opened more than a day ago are deleted first, so the table does not grow without bound.
CREATE OR REPLACE FUNCTION public.invitation_link_witness_open () RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_id uuid;
BEGIN
  DELETE FROM private.invitation_link_witness w
  WHERE w.opened_at < now() - interval '1 day';

  INSERT INTO private.invitation_link_witness DEFAULT VALUES
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- With an outcome, which must be `sent` or `not-sent` (anything else raises 22023), completes the record of that id if it exists and is still open; a completed record keeps its first outcome. In every case returns the record's outcome: null when no such record exists or it is still open.
CREATE OR REPLACE FUNCTION public.invitation_link_witness (p_id uuid, p_outcome text DEFAULT NULL) RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
BEGIN
  IF p_outcome IS NOT NULL THEN
    IF p_outcome NOT IN ('sent', 'not-sent') THEN
      RAISE EXCEPTION 'invitation_link_witness: p_outcome must be sent or not-sent'
        USING ERRCODE = '22023';
    END IF;

    UPDATE private.invitation_link_witness w
    SET completed_at = now(), outcome = p_outcome
    WHERE w.id = p_id
      AND w.completed_at IS NULL;
  END IF;

  RETURN (SELECT w.outcome FROM private.invitation_link_witness w WHERE w.id = p_id);
END;
$$;

-- service_role only. Each of the seven is SECURITY DEFINER and checks nothing about its caller: published to an API role, the code check would be a code oracle, the link request and the recovery request account and invitation oracles that also write, and the claimant look-up would hand out a user's address. Supabase's default privileges grant EXECUTE on every new public function to anon and authenticated, so the REVOKE names them as well as PUBLIC.
REVOKE
EXECUTE ON FUNCTION public.invitation_code_status (uuid, text),
public.invitation_link_request (uuid, text, text),
public.invitation_link_release (uuid, text, text),
public.invitation_code_claimant_email (uuid, text),
public.invitation_link_witness_open (),
public.invitation_link_witness (uuid, text),
public.recovery_link_request (uuid, text)
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT
EXECUTE ON FUNCTION public.invitation_code_status (uuid, text),
public.invitation_link_request (uuid, text, text),
public.invitation_link_release (uuid, text, text),
public.invitation_code_claimant_email (uuid, text),
public.invitation_link_witness_open (),
public.invitation_link_witness (uuid, text),
public.recovery_link_request (uuid, text) TO service_role;

--------------------------------------------------------------------------------
-- claim_invitations RPC: turn the caller's open invitations into grants
--
-- WHAT IT TRUSTS. One thing: the caller's own confirmed address, read from the caller's row of auth.users, which is the row `auth.uid()` names. A user whose `email_confirmed_at` is null, or whose address is blank, claims nothing.
--
-- WHAT IT IGNORES. It takes no address, no user id and no invitation id, so it cannot be pointed at another person's invitation, and it never reads the token's `email` claim, which can be older than the row. p_project_id only chooses which of the caller's own invitations are looked at.
--
-- WHAT IT CANNOT KNOW. The database sees that an address is confirmed and not how it came to be. This function therefore depends on the auth service refusing public sign-up and requiring confirmation by mail: where a visitor can create an account for an address without opening a mail sent to it, that visitor can claim the address's invitations. Nothing here guards against that configuration.
--
-- WHAT IT MATCHES. The rows of p_project_id that are unclaimed and unexpired and whose `email` is the caller's address, plus the code rows whose pending address is. A code row with no pending address, or with another one, is claimed by nobody. A row whose registration mode is switched off (private.invitation_mode_allowed) is not matched either: it is neither claimed nor skipped, and it stays open.
--
-- WHAT IT WRITES. One row of public.grants per claimed invitation, copying the invitation's four columns, and on the invitation `claimed_by`, `claimed_at` and a cleared pending address. It confirms no entity and creates nothing else. Whether the invitation's creator still holds the authority to promise the grant is not asked: a row that exists is honoured, and a promise is withdrawn by deleting its row.
--
-- EACH ROW BY ITSELF. Rows are taken in the order they were created, and each is claimed or skipped on its own:
-- - an entity-scope row whose target is no longer an entity of the row's project is skipped with the reason `target_not_in_project` and stays open (no foreign key holds the target, so it is asked again here);
-- - a unique violation on `grants_user_scope_target_role_key` means the caller already holds exactly this grant: the row is marked claimed and no second grant is written;
-- - a unique violation on `idx_grants_one_candidate_editor` means another user edits that candidate: the row is skipped with the reason `candidate_has_editor` and stays open;
-- - any other violation is raised and undoes the call.
--
-- Returns `{"claimed": [...], "skipped": [...], "password_set": <boolean>}`. Each element holds `scope`, `target_type`, `target_id` and `role`, and a skipped one also `reason`. `password_set` is private.user_password_set for the caller and is present whatever was claimed. No address, code or invitation id is returned. A second call claims nothing.
--
-- A grant reaches a token only when one is issued, so a caller refreshes its session after a claim that returned a non-empty `claimed` and before it reads anything the grant opens.
--
-- SECURITY DEFINER because it reads auth.users, writes public.grants and updates public.invitations, none of which the caller can. It answers for `auth.uid()`, which neither `anon` nor the service role has, so `authenticated` alone holds EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_invitations (p_project_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_password_set boolean := false;
  v_email text;
  v_row public.invitations%ROWTYPE;
  v_spec jsonb;
  v_constraint text;
  v_skip_reason text;
  v_claimed jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
BEGIN
  IF v_uid IS NOT NULL THEN
    v_password_set := private.user_password_set(v_uid);

    SELECT lower(btrim(u.email)) INTO v_email
    FROM auth.users u
    WHERE u.id = v_uid
      AND u.email_confirmed_at IS NOT NULL
      AND NULLIF(btrim(u.email), '') IS NOT NULL;
  END IF;

  IF v_email IS NULL OR p_project_id IS NULL THEN
    RETURN jsonb_build_object('claimed', v_claimed, 'skipped', v_skipped, 'password_set', v_password_set);
  END IF;

  FOR v_row IN
    SELECT i.*
    FROM public.invitations i
    WHERE i.project_id = p_project_id
      AND i.claimed_at IS NULL
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND (i.email = v_email OR (i.code_hash IS NOT NULL AND i.pending_email = v_email))
      AND private.invitation_mode_allowed(i)
    ORDER BY i.created_at, i.id
    FOR UPDATE
  LOOP
    v_spec := jsonb_build_object(
      'scope', v_row.scope,
      'target_type', v_row.target_type,
      'target_id', v_row.target_id,
      'role', v_row.role
    );
    v_skip_reason := NULL;

    IF v_row.scope = 'entity'
       AND private.entity_project_id(v_row.target_type, v_row.target_id) IS DISTINCT FROM v_row.project_id THEN
      v_skip_reason := 'target_not_in_project';
    ELSE
      BEGIN
        INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
        VALUES (v_uid, v_row.scope, v_row.target_type, v_row.target_id, v_row.role);
      EXCEPTION
        WHEN unique_violation THEN
          GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
          IF v_constraint = 'grants_user_scope_target_role_key' THEN
            -- The caller already holds exactly this grant: the promise is fulfilled.
            NULL;
          ELSIF v_constraint = 'idx_grants_one_candidate_editor' THEN
            v_skip_reason := 'candidate_has_editor';
          ELSE
            RAISE;
          END IF;
      END;
    END IF;

    IF v_skip_reason IS NOT NULL THEN
      v_skipped := v_skipped || jsonb_build_array(v_spec || jsonb_build_object('reason', v_skip_reason));
    ELSE
      UPDATE public.invitations i
      SET claimed_by = v_uid, claimed_at = now(), pending_email = NULL, pending_email_at = NULL
      WHERE i.id = v_row.id;
      v_claimed := v_claimed || jsonb_build_array(v_spec);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('claimed', v_claimed, 'skipped', v_skipped, 'password_set', v_password_set);
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.claim_invitations (uuid)
FROM
  PUBLIC,
  anon,
  service_role;

GRANT
EXECUTE ON FUNCTION public.claim_invitations (uuid) TO authenticated;
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
