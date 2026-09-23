-- Validation functions
--
-- Functions:
--   is_localized_string()    - check if JSONB is a localized string object is_valid_choice_id()     - check if a value is a valid choice ID is_image()               - check if JSONB is a well-formed StoredImage object validate_image()         - raise a specific error if JSONB is not a well-formed StoredImage object validate_answer_value()  - validate an answer value against question type validate_nomination()    - enforce nomination hierarchy rules enforce_entity_immutability() - gate the entity confirmation flag and freeze a confirmed entity's name enforce_nomination_entity_columns() - bound the nomination columns a non-admin may write
--------------------------------------------------------------------------------
-- is_localized_string: check if a JSONB value is a localized string object
--
-- A localized string is a JSONB object where all values are strings.
-- Examples: {"en": "Hello", "fi": "Hei"}, {"en": "text"} Returns false for: null, "plain string", 42, [], {"key": 42}
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
-- Choices format: [{"id": "1", ...}, {"id": "2", ...}] Returns true if p_value matches any choice id.
-- Returns true if p_valid_choices is NULL (no choices to validate against).
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
-- Reports the verdict only. A caller that needs to know WHICH rule failed calls validate_image, which raises a distinct message for each rule.
--
-- No caller today: this is the predicate half of the image-shape rule, extracted alongside validate_image so the rule is callable on its own rather than only reachable through an answer write. Its intended consumers are a CHECK constraint on an image column and an admin-side pre-flight on bulk_import payloads; until one of those lands it is exercised only by 08-triggers.test.sql. EXECUTE defaults to PUBLIC, and the function reads nothing, so this exposes no data.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_image (p_val JSONB) RETURNS BOOLEAN LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  PERFORM public.validate_image(p_val);
  RETURN TRUE;
EXCEPTION
  -- Only a shape violation raised by validate_image is a FALSE verdict. validate_image signals every rule with a bare RAISE EXCEPTION, which is SQLSTATE P0001 / raise_exception, so that is the whole set of verdicts this function is entitled to convert. Anything else - undefined_function if validate_image is dropped or renamed, insufficient_privilege if EXECUTE on it is ever narrowed, stack depth, out of memory, a future bug inside it - must propagate. Under WHEN others a broken validator silently reported every value in the database as "not an image", which is precisely the distinction this function exists to make.
  WHEN raise_exception THEN
    RETURN FALSE;
END;
$$;

--------------------------------------------------------------------------------
-- validate_image: raise if a JSONB value is not a well-formed StoredImage object
--
-- StoredImage shape: {path, pathDark?, alt?, width?, height?, focalPoint?} Every rule raises its own message, so a caller is told which part of the value to fix.
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
-- Answer format: {"value": ..., "info": ...} The "info" field is optional and can be a plain string or localized string.
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
--   If parent_nomination_id is set, election_id, constituency_id, and election_round must match the parent nomination.
--   A faction's parent must be the nomination of that faction's OWN organization (section 11.8, 162-12), not merely of some organization. The exception names BOTH organization ids (D-23).
--
-- ⚠ HARDENED TO `SECURITY DEFINER SET search_path = ''` BY 162-12, AND IT IS A CONSEQUENCE OF THE CAPABILITY THAT PLAN ADDS RATHER THAN A PRE-EXISTING DEFECT. This function reads `public.nominations` and now `public.factions`. While the only callers who could insert were ADMINS, who can read the whole project, invoker rights were harmless. From the moment an ENTITY USER may insert -- new in 162-12 -- both lookups would run under that user's own row-level security, and a parent that EXISTS but is unreadable would be reported by the `NOT FOUND` branch below as a parent that DOES NOT EXIST. MEASURED in a rolled-back transaction before this was written: an entity-user session selecting the parent nomination it is about to point at returns ZERO ROWS. 23-nominations-write.test.sql asserts the fix by having an entity user successfully insert a child under a parent that user cannot read.
--
-- The information the hardening exposes -- that a supplied identifier names a nomination, and of what type -- is disposed of as an ACCEPTED finding in 162-12's threat register (T-162-12-14) rather than inherited silently: the identifiers are unguessable, so the oracle requires knowledge that already implies access, and a generic message would retire D-23's error discipline across every seed log in the project.
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

  -- Tenancy (162-REVIEW CR-03): the nomination's election and constituency must belong to the nomination's own project. Nothing else ties them together -- the foreign keys name the rows, not their project -- so without this an entity grantee of project A could write, or move, a nomination into project B's contest. Checked for every writer, admins and service_role included, because a cross-project nomination is corrupt data whoever wrote it. The entity's own project is checked by the entity write policies in 302-rls.sql rather than here, because 07-rpc-security.test.sql deliberately builds a cross-project entity row as a negative control.
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
      -- Section 11.8 tightens *an* organization to *THE* organization: a faction's parent must be the nomination of that faction's OWN organization. 162-07b shipped `factions.organization_id NOT NULL` and explicitly left this rule here, after the column exists. The lookup is one more column on the SELECT ... INTO above plus one read of the faction's own organization, not a new round trip.
      --
      -- The message names BOTH organizations, per D-23. In a seed log a message naming one is indistinguishable from the parent-type error directly above it, and the two failures need different fixes.
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
-- enforce_nomination_confirmation: the confirmation transition (162-12)
--
-- 162-USER-RIGHTS.md: "when editing, turn confirmed false". The SYSTEM sets the flag, so this is a trigger and not a policy -- a policy can refuse a row, it cannot rewrite one. Three rules, in order:
--
--   1. ON EITHER VERB, a row being confirmed while its custom data carries the requested-parent key is REFUSED (D-12a). 162-IMPLEMENTATION-BRIEF.md section 11.5's third and fourth branches are BYTE-IDENTICAL in every column -- both are a candidate nomination with a NULL parent -- and the only thing distinguishing "I am independent" from "my party is not in the system yet" is the presence of `requestedParentOrganization` in custom_data. Confirming such a row publishes as an INDEPENDENT a candidate who asked for a party, which section 11.5 names as the one place this feature touches the public read path.
--   2. ON UPDATE, when the caller's effective database role is `authenticated` and the caller does not hold the confirm permission on the row's project: an attempt to turn the flag ON is REFUSED with a named exception, and anything else has the flag FORCED OFF. The refusal and the forcing are different failures and are asserted separately -- silently ignoring an explicit request is how a client comes to believe it succeeded.
--   3. OTHERWISE the supplied value stands. That is what makes an admin's edit-and-confirm a single statement, and what keeps a service-role re-seed from unconfirming everything it touches.
--
-- ⚠ RULE 2'S SCOPE IS THE EFFECTIVE DATABASE ROLE, and it is the choice in this file most likely to be got wrong. Scoping it to "the caller has a token" would catch the SERVICE-ROLE caller too, because PostgREST sets claims for that role as well, and a second `yarn db:seed` would then unconfirm every row it upserted. MEASURED across three caller classes before this expression was fixed: `authenticated`, `service_role` and `anon` present three distinct strings. The role test does not read claim contents at all, and 23-nominations-write.test.sql pins the BEHAVIOUR (two seed runs, zero unconfirmed rows) rather than the expression, so a future change of expression that breaks the property reddens.
--
-- ⚠ A PROJECT EDITOR'S EDIT ALSO TURNS CONFIRMATION OFF. Section 3.3 gives that role `nomination.edit` and withholds `nomination.confirm`, so rule 2 applies to it and only an admin can restore the flag. That is the review gate working rather than a defect, but nobody wrote it down before, so it is written here.
--
-- SECURITY INVOKER, deliberately and unlike this file's hierarchy validator: it MUST see its caller's effective role, which owner rights would replace. It reads NO table directly; the only authority question it asks is one `user_can` call, which is itself hardened.
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

  -- The CAP on originated unconfirmed parent nominations (section 8.9, task 2 Q1 = A, value 10).
  --
  -- ⚠ IT IS HERE AS WELL AS IN THE POLICY, AND THE REASON IS THE MESSAGE. `entity_insert_parent_nominations` carries the cap as a conjunct, which is where the enforcement belongs; but a row-level-security refusal reads "new row violates row-level security policy ... for table nominations", naming the POLICY and never the number. Section 8.9 wants a caller to be told what they hit. A BEFORE INSERT trigger runs ahead of the row-level check clause, so this message is the one that surfaces.
  --
  -- Scoped exactly to the population the cap is about: an `authenticated` caller inserting an UNCONFIRMED ORGANIZATION nomination who does NOT hold `project.edit_nominations`. An admin creating placeholder parents is not what section 8.9 is worried about, and the service-role and owner paths present a different role entirely.
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
-- enforce_nomination_entity_columns: the column bound for callers who are NOT project nomination editors (162-REVIEW WR-05)
--
-- 303-column-grants.sql used to bound an entity user's nomination writes with a global REVOKE/GRANT pair against `authenticated` -- and a grant against one role cannot tell an entity user from a project admin, so it refused the admin too: a project admin holding `project.edit_nominations` could not insert a nomination carrying `election_symbol` or a name, and `bulk_import` could not import nominations through an authenticated admin session. The grant is now wide enough for the admin, and the entity-user bound lives here, where the caller can be told apart -- the same arrangement `enforce_nomination_confirmation` and `enforce_entity_immutability` already use.
--
-- Binds exactly one population: an `authenticated` caller who does NOT hold `project.edit_nominations` on the row's project. For that caller:
--   INSERT - the nine presentation and bookkeeping columns (name, short_name, info, color, image, sort_order, subtype, election_symbol, external_id) must be left unset.
--   UPDATE - those nine and the four entity foreign keys must be unchanged.
-- The owner and service-role paths are untouched (current_user is not `authenticated` there), and an admin passes through.
--
-- Raises insufficient_privilege (42501), the code the column grant raised for the same attempt, so a caller -- and every assertion written against the old grant -- sees the same refusal.
--
-- SECURITY INVOKER for the reason its two siblings give: a SECURITY DEFINER body reports the owner as current_user, and the role test would never match.
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
-- enforce_entity_immutability: the confirmation gate and the conditional identity freeze (162-13)
--
-- 162-IMPLEMENTATION-BRIEF.md section 11.2 freezes an entity's name once the row is confirmed; section 8.7(a) makes that freeze conditional on WHO is asking -- frozen for the entity user, still correctable by a holder of `entity.edit_immutable`. That is a rule about the TRANSITION from one row state to another, and fact 27 measured that neither mechanism already in this tree can express it. A column grant is a single global REVOKE/GRANT pair against one role: it cannot tell two callers of that role apart and it knows nothing about the row. A policy's `USING` is evaluated against the OLD row and its `WITH CHECK` against the NEW one, with no expression in either able to reference the other, so `OLD.confirmed` is not addressable from any policy on these tables. A BEFORE UPDATE row trigger sees both in one scope, which is why this is one.
--
-- THE IN-TREE ANALOG IS `enforce_external_id_immutability()` IN 500-external-id.sql, and 162-PATTERNS.md section "No Analog Found" is wrong to say there is none. That function gates on an OLD-row condition, compares old to new with `IS DISTINCT FROM`, raises a named exception interpolating BOTH values, and is registered on eleven tables from one body. This function copies its shape, its error discipline and its one-body-many-tables registration form rather than inventing a second idiom for the same job.
--
-- TWO RULES, IN A FIXED ORDER, AND THE ORDER IS OBSERVABLE:
--
--   1. THE CONFIRMATION GATE. A change to the confirmation flag -- in EITHER direction -- by an `authenticated` caller who does not hold `entity.confirm` on the row is refused by name. The direction that looks harmless is the load-bearing one: an entity user who can turn the flag OFF can unfreeze their own name and rule 2 becomes decorative, so false-to-true and true-to-false are both refused.
--   2. THE CONDITIONAL FREEZE, read from `OLD.confirmed` rather than `NEW.confirmed`. While the row was already confirmed when the statement began, a change to any column named in TG_ARGV by an `authenticated` caller who does not hold `entity.edit_immutable` on the row is refused by name. Reading the OLD flag is what makes a caller unable to unfreeze and rename in one statement; rule 1 runs first, so such a caller is stopped at the gate and the refusal carries the confirmation prefix rather than the immutability one.
--
-- WHY RULE 2 IS NOT AN ABSOLUTE FREEZE, and the failure that reading would cause: on an UNCONFIRMED row the entity user may still set their own name, because that is the sign-up flow. A rule written without the OLD-flag guard would make a newly created entity unnameable and section 11.2's own precondition unreachable. That middle outcome is asserted per protected column per table in 19-entity-immutability.test.sql, and a variant of this body with the guard removed is run against that file as a negative control.
--
-- THE ROLE SCOPE IS THE EFFECTIVE DATABASE ROLE, exactly as `enforce_nomination_confirmation()` above scopes its own rule 2, and for the same measured reason. `user_can` reads the caller's grant set from the JWT; a service-role token carries none, so an UNSCOPED rule answers false for the seeder and refuses every re-seed, bulk import and pgTAP fixture write that moves a name or a confirmation flag. That failure was REPRODUCED against an unscoped variant before this expression was written. Accepted and recorded cost: a service-role path can rename a confirmed entity -- the same latitude that role already has against row-level security and against the column grants, neither of which names it.
--
-- SECURITY INVOKER is not optional. MEASURED: a `SECURITY DEFINER` body reports `postgres` as `current_user` for an authenticated caller, so the role guard below would never match and both rules would never bind.
--
-- D-21: THE BODY NAMES NO ENTITY TYPE AND NO PROTECTED COLUMN. The protected set arrives per registration in TG_ARGV and is compared through a generic JSONB projection of the two records, so one body serves all four entity tables: three pass one column name, one passes two. The confirmation column is NOT a parameter -- it carries the same name on all four tables and is the subject of the other rule.
--
-- D-23: BOTH REFUSALS CARRY A STABLE LEADING PREFIX so `throws_like` has a handle and a seed log can tell them apart, and both interpolate the table, the row and BOTH values; the immutability refusal additionally names the column.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_entity_immutability () RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_col text;
  v_old_row jsonb;
  v_new_row jsonb;
BEGIN
  -- The role guard. Everything below binds the effective `authenticated` role and nothing else.
  IF current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  -- Rule 1: the confirmation gate, in both directions.
  IF NEW.confirmed IS DISTINCT FROM OLD.confirmed
     AND NOT public.user_can('entity', NEW.id, 'entity.confirm') THEN
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
         AND NOT public.user_can('entity', NEW.id, 'entity.edit_immutable') THEN
        RAISE EXCEPTION 'Entity name is immutable once confirmed: column %.%.% on row % cannot be changed (current: %, attempted: %); changing it requires the entity.edit_immutable permission',
          TG_TABLE_SCHEMA, TG_TABLE_NAME, v_col, NEW.id,
          COALESCE(v_old_row ->> v_col, '(none)'), COALESCE(v_new_row ->> v_col, '(none)');
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;
