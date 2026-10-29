-- Validation functions
--
-- Functions:
-- - is_localized_string(jsonb) - whether a JSONB value is a localized string object
-- - is_valid_choice_id(jsonb, jsonb) - whether a value is the id of one of the given choices
-- - is_image(jsonb) - whether a JSONB value is a well-formed StoredImage object
-- - validate_image(jsonb) - raise a rule-specific error if a JSONB value is not a well-formed StoredImage object
-- - validate_answer_value(jsonb, question_type, jsonb) - validate an answer value against its question type
-- - nomination_shape_rule(nomination_shape, entity_type) - which entity types an election type admits, and where a candidate needs a parent
-- - validate_nomination() - enforce nomination tenancy, the election-type rule, the constituency rule, hierarchy and parent consistency
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
--   The nomination's constituency must be a constituency of its election: one a constituency group linked to the election holds. A refusal is `Nomination constituency <id> is no constituency of its election <id>` with SQLSTATE 23514. It binds every writer, as the election-type rule does, and is asked on INSERT and on an UPDATE that changes the row's election or constituency. A stored nomination whose constituency is unlinked from its election later is not judged again until it is moved, so it can still be edited where it is.
--   If parent_nomination_id is set, election_id, constituency_id, and election_round must match the parent nomination. A round that is not stored is round 1 on either side.
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
  p_contest_judged boolean;
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

  -- The constituency rule: the row's constituency must be held by a constituency group its election is linked to. Checked for every writer, an entity's editor, an admin, the service role and `bulk_import` alike, and before the return below, which would otherwise let every row without a parent pass unasked. An INSERT is judged, and an UPDATE only when it changes the row's election or constituency: a stored nomination that stays where it is is not judged again, so its editor can still edit it after its constituency is unlinked from its election.
  IF TG_OP = 'INSERT' THEN
    p_contest_judged := true;
  ELSE
    p_contest_judged := NEW.election_id IS DISTINCT FROM OLD.election_id
      OR NEW.constituency_id IS DISTINCT FROM OLD.constituency_id;
  END IF;

  IF p_contest_judged AND NOT EXISTS (
    SELECT 1
    FROM public.election_constituency_groups ecg
    JOIN public.constituency_group_constituencies cgc ON cgc.constituency_group_id = ecg.constituency_group_id
    WHERE ecg.election_id = NEW.election_id
      AND cgc.constituency_id = NEW.constituency_id
  ) THEN
    RAISE EXCEPTION 'Nomination constituency % is no constituency of its election %', NEW.constituency_id, NEW.election_id
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

  IF COALESCE(NEW.election_round, 1) <> COALESCE(p_parent_election_round, 1) THEN
    RAISE EXCEPTION 'Nomination election_round must match parent (expected %, got %)',
      p_parent_election_round, NEW.election_round;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- validate_nomination_parent_required: a candidate that needs a parent has one when the transaction ends
--
-- The function of the constraint trigger `nominations_parent_required` (104-nominations.sql). Where `nomination_shape_rule` answers 'parent_required' for a candidate, the candidate's nomination must have a parent nomination or carry `requestedParentOrganization` in its custom data as a string that is not blank. A refusal is `Nomination parent required: ...` with SQLSTATE 23514.
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
     OR (
       jsonb_typeof(v_custom_data -> 'requestedParentOrganization') = 'string'
       AND (v_custom_data ->> 'requestedParentOrganization') ~ '[^[:space:]]'
     ) THEN
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
--   1. On either verb, a row being confirmed while its custom_data carries `requestedParentOrganization` as a string that is not blank is refused. A nomination with a NULL parent either stands on its own or waits for a parent that is not in the system yet, a party for a candidate and an alliance for an organization, and that key is the only difference. Confirming such a row would publish as standing on its own a nominee that asked for a parent.
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
     AND jsonb_typeof(NEW.custom_data -> 'requestedParentOrganization') = 'string'
     AND (NEW.custom_data ->> 'requestedParentOrganization') ~ '[^[:space:]]' THEN
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
