-- Enum type definitions
--
-- All enum types used across the schema: question_type   - question answer value types entity_type     - nomination entity discriminator category_type   - question category classification grant_scope_type - grant scope vocabulary grant_role_type - grant role levels grant_permission - the permission verbs user_can is written in storage_verb - the read/write split storage_path_can maps to two different permissions nomination_shape - which of section 6.2's three nomination flows an election runs, and the type elections.election_type takes
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

-- The four grant scopes of 162-IMPLEMENTATION-BRIEF.md section 3.1, ordered from widest to narrowest; public.grants.scope takes this type and the two CHECK constraints on that table tie target_type and target_id to it.
CREATE TYPE public.grant_scope_type AS ENUM('global', 'account', 'project', 'entity');

-- Exactly two role levels and deliberately not three (D-02, 162-IMPLEMENTATION-BRIEF.md section 8.1(a)): the eight user types of 162-USER-RIGHTS.md span only admin and editor, editor management is the permission project.manage_editors with entity.invite_children as its entity-scope equivalent, so a third level would be an untested member of a security enum rather than a capability anything grants.
CREATE TYPE public.grant_role_type AS ENUM('admin', 'editor');

-- The 23 permission verbs of user_can, canonical in 162-IMPLEMENTATION-BRIEF.md section 3.2 and restated in 162-SPEC.md section 4, declared here in that table's order because it is also the order of the section 3.3 capability matrix and enum ordinals are persisted; scripts/assert-grant-permission-enum.mjs holds the same list as a committed canon and reddens lint:check if this declaration or the generated types drift from it.
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

-- The verb a storage policy is asking about, and the argument that makes read and write SEPARABLE at the storage layer rather than merely differently named.
--
-- v2.15-OPERATOR-DECISIONS-2026-08-29.md section K2's amendment requires the verb argument of user_can to be HONOURED by the storage policies and not discarded. Two helper functions named for read and for write would satisfy that sentence's letter while discarding the argument, and would make the split a property of which function a policy happened to call rather than one the function guarantees. A declared argument that public.storage_path_can branches on makes separability structural: the same call with a different verb resolves to a DIFFERENT permission, and a body that ignored it would redden the two read-but-not-write identities in 20-storage-authority.test.sql.
--
-- An enum rather than text, for the reason K3 gives about settings columns: a typo in a text literal inside a policy predicate denies silently, where a typo in an enum literal fails to apply.
CREATE TYPE public.storage_verb AS ENUM('read', 'write');

-- The three nomination flows of 162-IMPLEMENTATION-BRIEF.md section 6.2, as 162-USER-RIGHTS.md names them. Named for the CONCEPT rather than for the column that holds it, following grant_scope_type, which is the type of grants.scope and is likewise named for what it means.
--
-- This is the type elections.election_type takes under D-16: that column keeps its name and takes a new meaning, and the values it used to hold are DELETED rather than deprecated. They are deliberately not members here, which makes them unrepresentable rather than merely unused -- a row carrying one is a PostgreSQL error, not a stored string. A member kept "for compatibility" would be exactly the second mechanism this phase exists to end, and no database has been published that could still be carrying one.
CREATE TYPE public.nomination_shape AS ENUM(
  'organization_only',
  'candidate_only',
  'organization_list'
);
-- API role settings
--
-- Provides: the statement_timeout the anon role runs under.
--
-- WHY: Supabase ships `anon` with statement_timeout = 3s and `authenticated` with 8s. At municipal scale (~36k candidates, ~39k nominations) the anonymous whole-project nominations read costs ~3.2 s of database work and fails with HTTP 500 57014 at 3 s (spike 026, finding F2). Anon is raised to the same 8 s authenticated already has.
--
-- ⚠ HOSTED DEPLOYMENTS: this lands through the migration like any other statement, but the value lives on the role, not in config.toml, and a project whose migrations are not applied keeps Supabase's 3 s. See .planning/todos/pending/2026-09-18-document-supabase-api-limits-for-deployments.md.
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
--   update_updated_at()  - trigger for automatic updated_at timestamps get_localized()      - extract locale string from JSONB (email helpers only)
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
-- Multi-tenant foundation: accounts and projects
--
-- All content tables reference projects via project_id FK with ON DELETE CASCADE.
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  name text NOT NULL,
  default_locale text NOT NULL DEFAULT 'en',
  -- Read by 162-08, which makes it the PROJECT-LEVEL term of section 3.4's public-read rule: an anonymous reader sees a row only when this is true, its nomination is confirmed and every entity that nomination links is confirmed. Defaults to the closed direction because a project created this minute is not world-readable; the creation paths (seed.sql, SupabaseAdminClient.ensureProject) set it true, which is today's behaviour rather than a new one.
  open_for_voters boolean NOT NULL DEFAULT false,
  -- Read by 162-12 and by NOTHING TODAY. It ships inert: no policy consults it, no seed sets it, and no assertion in the estate claims anything for it beyond existence, type, NOT NULL and default. Its default false IS today's behaviour rather than a new permissive setting -- section 3.3 grants admins `nomination.edit` unconditionally, and the `own, unless locked` cells this flag gates belong to the entity-user nomination write policies 162-12 creates. Do not read this column as an enforced setting until that plan wires it.
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
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  is_generated boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  election_date date,
  election_start_date date,
  -- REPURPOSED, not added. The column keeps its name and takes a NEW MEANING per the operator's section 8.2 note and D-16: it now carries which of section 6.2's three nomination flows this election runs -- whether a candidate picks a party, whether a party nominates a list, and whether the free-text branch is reachable at all. The values it used to hold are deleted, and they are not members of the type, so a row carrying one is rejected by PostgreSQL rather than stored.
  -- `subtype` above is a DIFFERENT AXIS and is not this. The two have always been separate columns on this table; before 162-07 the frontend adapter conflated them into one property, and that term is removed in the same commit as this retype so the property means one thing from one column.
  -- The default is the operator's own reading of which shape most projects will run, not a planner's; NOT NULL with a default is also what lets every creation path stay ignorant of this column.
  election_type public.nomination_shape NOT NULL DEFAULT 'organization_list',
  multiple_rounds boolean DEFAULT false,
  current_round integer DEFAULT 1,
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.elections FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

CREATE TABLE public.constituency_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  is_generated boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.constituency_groups FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

CREATE TABLE public.constituencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  is_generated boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  keywords jsonb,
  parent_id uuid REFERENCES public.constituencies (id) ON DELETE SET NULL,
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
  auth_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  is_generated boolean DEFAULT false,
  -- Read by 162-08 as the ENTITY-LEVEL term of section 11.2's rule: an entity is public only through a confirmed nomination AND only when it is itself confirmed. Defaults unconfirmed, because nobody has vouched for this identity yet; the seeding paths set it true, which is today's behaviour. ⚠ AS OF 162-13 THIS COLUMN IS INSIDE THE AUTHENTICATED UPDATE GRANT IN 303-column-grants.sql AND THE PROTECTION IS A TRIGGER: `enforce_entity_immutability()`'s rule 1 refuses any change to it, in either direction, by an authenticated caller who does not hold `entity.confirm` on the row. The grant had to give way because a single global pair against one role also refused the project administrator who holds that permission -- measured as a live 42501. Do not read the allow-list as the protection here.
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  answers jsonb DEFAULT '{}'::jsonb,
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

-- 162-13's conditional identity freeze and confirmation gate, registered here beside the audit stamp and declared once in 011-validation-functions.sql, in the one-body-many-tables form `enforce_external_id_immutability` already uses eleven times in 500-external-id.sql. The `UPDATE OF` list is the early exit: a column-restricted trigger fires only when one of its columns appears in the statement's SET list, decided once per statement from the parse tree rather than once per row. The ARGUMENTS are this table's protected name columns and nothing else; the confirmation column is in the `UPDATE OF` list and in no argument list, because it carries the same name on all four entity tables and is the subject of the other rule.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF name,
confirmed ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('name');

CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  is_generated boolean DEFAULT false,
  -- Read by 162-08 as the ENTITY-LEVEL term of section 11.2's rule: an entity is public only through a confirmed nomination AND only when it is itself confirmed. Defaults unconfirmed, because nobody has vouched for this identity yet. The one runtime path that sets it is `functions/identity-callback/candidateRecord.ts` (D-10, D-22), where a strong identity check has already happened. ⚠ AS OF 162-13 THIS COLUMN IS INSIDE THE AUTHENTICATED UPDATE GRANT IN 303-column-grants.sql AND THE PROTECTION IS A TRIGGER: `enforce_entity_immutability()`'s rule 1 refuses any change to it, in either direction, by an authenticated caller who does not hold `entity.confirm` on the row. The grant had to give way because a single global pair against one role also refused the project administrator who holds that permission -- measured as a live 42501. Do not read the allow-list as the protection here.
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  auth_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  -- Terms-of-use acceptance tracking: nullable timestamptz NULL = not yet accepted. Set by candidate when accepting ToU.
  terms_of_use_accepted timestamptz,
  answers jsonb DEFAULT '{}'::jsonb,
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

-- 162-13's conditional identity freeze and confirmation gate, registered here beside the audit stamp and declared once in 011-validation-functions.sql. THE `UPDATE OF` LIST IS THE EARLY EXIT AND IT IS WHAT KEEPS THE CANDIDATE APPLICATION'S HOTTEST WRITE FREE: a column-restricted trigger fires only when one of its columns appears in the statement's SET list, decided once per statement from the parse tree rather than once per row, so `upsert_answers` -- which sets only the answers column -- never enters the function at all. The ARGUMENTS are this table's protected name columns and nothing else; the confirmation column is in the `UPDATE OF` list and in no argument list, because it carries the same name on all four entity tables and is the subject of the other rule. This is the only entity table whose protected set has two members.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF first_name,
last_name,
confirmed ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('first_name', 'last_name');

CREATE TABLE public.factions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- Section 11.8's required faction-to-organization edge, declared here in the CREATE TABLE body rather than appended as an ALTER, and copying the form of the `project_id` line above it. The delete action is a ruling rather than a default: NOT NULL forecloses SET NULL outright, RESTRICT would block deleting an organization that has factions, and CASCADE is how `project_id` already behaves on this same table. Accepted consequence, recorded because the table had no data-loss path before: deleting an organization now deletes its factions and, through the nominations foreign keys, their nominations. 162-12 reads this column when it tightens `validate_nomination()` from *an* organization nomination to *the* faction's own organization's nomination.
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  is_generated boolean DEFAULT false,
  -- Read by 162-08 as the ENTITY-LEVEL term of section 11.2's rule: an entity is public only through a confirmed nomination AND only when it is itself confirmed. Defaults unconfirmed. 162-10 gave this table its first column-grant block and 162-13 completed it. ⚠ AS OF 162-13 THIS COLUMN IS INSIDE THE AUTHENTICATED UPDATE GRANT IN 303-column-grants.sql AND THE PROTECTION IS A TRIGGER: `enforce_entity_immutability()`'s rule 1 refuses any change to it, in either direction, by an authenticated caller who does not hold `entity.confirm` on the row. The grant had to give way because a single global pair against one role also refused the project administrator who holds that permission -- measured as a live 42501. Do not read the allow-list as the protection here.
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

-- 162-13's conditional identity freeze and confirmation gate, registered here beside the audit stamp and declared once in 011-validation-functions.sql, in the one-body-many-tables form `enforce_external_id_immutability` already uses eleven times in 500-external-id.sql. The `UPDATE OF` list is the early exit: a column-restricted trigger fires only when one of its columns appears in the statement's SET list, decided once per statement from the parse tree rather than once per row. The ARGUMENTS are this table's protected name columns and nothing else; the confirmation column is in the `UPDATE OF` list and in no argument list, because it carries the same name on all four entity tables and is the subject of the other rule.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF name,
confirmed ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('name');

CREATE TABLE public.alliances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  is_generated boolean DEFAULT false,
  -- Read by 162-08 as the ENTITY-LEVEL term of section 11.2's rule: an entity is public only through a confirmed nomination AND only when it is itself confirmed. Defaults unconfirmed. 162-10 gave this table its first column-grant block and 162-13 completed it. ⚠ AS OF 162-13 THIS COLUMN IS INSIDE THE AUTHENTICATED UPDATE GRANT IN 303-column-grants.sql AND THE PROTECTION IS A TRIGGER: `enforce_entity_immutability()`'s rule 1 refuses any change to it, in either direction, by an authenticated caller who does not hold `entity.confirm` on the row. The grant had to give way because a single global pair against one role also refused the project administrator who holds that permission -- measured as a live 42501. Do not read the allow-list as the protection here.
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

-- 162-13's conditional identity freeze and confirmation gate, registered here beside the audit stamp and declared once in 011-validation-functions.sql, in the one-body-many-tables form `enforce_external_id_immutability` already uses eleven times in 500-external-id.sql. The `UPDATE OF` list is the early exit: a column-restricted trigger fires only when one of its columns appears in the statement's SET list, decided once per statement from the parse tree rather than once per row. The ARGUMENTS are this table's protected name columns and nothing else; the confirmation column is in the `UPDATE OF` list and in no argument list, because it carries the same name on all four entity tables and is the subject of the other rule.
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
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  is_generated boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  category_type public.category_type DEFAULT 'opinion',
  election_ids jsonb,
  election_rounds jsonb,
  constituency_ids jsonb,
  entity_type jsonb,
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.question_categories FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  is_generated boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  type public.question_type NOT NULL,
  category_id uuid NOT NULL REFERENCES public.question_categories (id),
  choices jsonb,
  settings jsonb,
  election_ids jsonb,
  election_rounds jsonb,
  constituency_ids jsonb,
  entity_type jsonb,
  allow_open boolean DEFAULT true,
  required boolean DEFAULT true,
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
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  is_generated boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- WHO ORIGINATED THIS ROW. Added by 162-12 (task 2 Q1 = A) because section 8.9 asks for two things the schema could not do: a CAP on how many unconfirmed parent nominations one candidate may originate, and an ADMIN QUEUE showing who created each. A cap needs a subject and the queue has nothing to show, so the cap was never a number waiting to be chosen -- it is a column plus a number, and this column is what section 8.9's second half asks for in its own words.
  --
  -- ⚠ TWO PROPERTIES MAKE THE CAP A CAP RATHER THAN A SUGGESTION, and only one of them is visible here.
  -- It DEFAULTS to the calling user, so an honest insert records the caller without naming the column; and it is ABSENT from the INSERT column grant in 303-column-grants.sql, so a caller who names it is refused at privilege level before any policy is consulted. Without that absence the cap would count a value the capped party chooses.
  --
  -- NULLABLE, and the nullability is honest rather than lax: the service-role and owner paths have NO calling user, so `auth.uid()` is NULL for every seeded and every pgTAP-inserted row. A NOT NULL column here would either block those paths or force them to invent an author. `ON DELETE SET NULL` so that deleting an account does not take nomination rows with it -- the row outlives its originator, which is what an audit column is for.
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL DEFAULT auth.uid (),
  -- Entity FK columns: exactly one must be set
  candidate_id uuid REFERENCES public.candidates (id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations (id) ON DELETE CASCADE,
  faction_id uuid REFERENCES public.factions (id) ON DELETE CASCADE,
  alliance_id uuid REFERENCES public.alliances (id) ON DELETE CASCADE,
  -- Generated entity_type from FK columns
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
  election_round integer DEFAULT 1,
  election_symbol text,
  -- Nesting ⚠ `ON DELETE NO ACTION`, RULED AT 162-12 TASK 2 Q2 = A, AND THE CHOICE IS THE POINT. It was `ON DELETE CASCADE`, which 162-IMPLEMENTATION-BRIEF.md section 11.5 fact 35 names the QUIET DATA-LOSS PATH and forbids leaving in place: an admin rejecting one candidate-created placeholder silently deleted every nomination beneath it, including candidates who joined that placeholder later and had nothing to do with creating it. Before this phase no non-admin could create a parent, so the hazard was theoretical; from 162-12 it is live.
  --
  -- `NO ACTION` refuses at the END OF THE STATEMENT; `RESTRICT` refuses at the offending row. The catalogue barely distinguishes them and the behaviour distinguishes them in exactly one case, which is the case that matters here. MEASURED: `bulk_delete` (501-bulk-operations.sql) removes a collection with ONE `DELETE ... WHERE project_id = $1 AND external_id LIKE $2` per table and puts `nominations` FIRST in its delete_order, so parent and children go together in a single statement. Under `NO ACTION` that succeeds, because by the time the check runs there are no referencing rows left; under `RESTRICT` it would fail and break EVERY teardown the seeder performs. Measured end to end: `yarn db:seed:teardown` exits 0 and removes 751 rows with no foreign-key error, while a targeted delete of a parent that still has children is refused by name.
  parent_nomination_id uuid REFERENCES public.nominations (id) ON DELETE NO ACTION,
  -- Confirmation state. RENAMED AND INVERTED from `unconfirmed` by 162-12 (D-11c) so that the two booleans this phase leaves behind read the same way: after this plan `true` means confirmed on the nomination and on all four entity tables, and the schema carries ONE polarity rather than two adjacent ones pointing in opposite directions.
  --
  -- ⚠ THE DEFAULT IS LOAD-BEARING, NOT COSMETIC, and it is the half a reader is most likely to skim. 162-IMPLEMENTATION-BRIEF.md section 11.5's second guard says the candidate-created parent is created UNCONFIRMED and that the candidate cannot override that; fact 34 says the mechanism is the INSERT column grant in 303-column-grants.sql; and a column ABSENT from a `GRANT INSERT` column list takes its declared default rather than erroring. So `DEFAULT false` is what makes guard 2 true in the only case that matters -- the one where the caller cannot name the column at all. A default of `true` would make that grant list express nothing.
  --
  -- `NOT NULL` buys the other half. Every reader of the old nullable column wrapped it in a null-coalescing call (`NOT COALESCE(unconfirmed, false)`), because the spelling `unconfirmed = false` would silently drop every NULL row. Non-nullable makes the wrapper REMOVABLE rather than merely renameable, so 162-12 asserts its ABSENCE -- a stronger statement than its correctness. There is no row to migrate: D-14 records that no database has been published, so a reset builds from nothing and `NOT NULL` is what stops a future path writing a null a bare boolean read would drop.
  confirmed boolean NOT NULL DEFAULT false,
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
  -- An entity may be nominated only ONCE in a given election / constituency / round -- UNLESS it is nominated by a different parent, which is what admits the case the operator gave as the reason for the shape: the same presidential candidate nominated in one contest by three different parties, each a genuinely distinct nomination rather than a duplicate (162-IMPLEMENTATION-BRIEF.md section 11.7).
  --
  -- ⚠ `NULLS NOT DISTINCT` IS THE WHOLE CONSTRAINT, NOT A REFINEMENT OF IT. PostgreSQL's default `UNIQUE` treats NULLs as distinct, so two rows never conflict if any keyed column is NULL in either of them -- and on THIS table the CHECK above guarantees that every row has three NULL entity foreign keys, always, while `parent_nomination_id` is NULL for every top-level nomination. A plain `UNIQUE` over these eight columns would therefore reject NOTHING, while reading as a guarantee in the schema, in review and in the diff. MEASURED, same database and same estate: written plain, the pgTAP estate passes 923 assertions and the constraint catches nothing; written with this clause, it catches three real duplicate pairs. The two forms are not interchangeable here.
  --
  -- ⚠ THIS IS THE FIRST THING IN THIS SCHEMA THAT PINS THE POSTGRESQL FLOOR. `NULLS NOT DISTINCT` is a PostgreSQL 15 feature and `supabase/config.toml` declares `major_version = 15` -- available, with no margin. A downgrade would SILENTLY turn this constraint into the no-op above rather than fail to apply, which is why the floor is stated here and asserted from `pg_index.indnullsnotdistinct` on the applied database rather than read off this file.
  --
  -- Named explicitly, for the same reason `nominations_election_round_check` below is: a pgTAP `throws_ok` needs a stable handle and 162-17 asserts this one by name.
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
  -- Election rounds are numbered from one. Named explicitly rather than left to PostgreSQL's generated name: the name is cited by 156-DISPOSITIONS.md Record B and is the handle any throws_ok on this constraint has to match, so it belongs under source control. The literal is identical to what PostgreSQL generates, so this declares the existing name rather than changing it.
  CONSTRAINT nominations_election_round_check CHECK (election_round >= 1)
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

CREATE TRIGGER validate_nomination_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.validate_nomination ();

-- The confirmation transition (162-12). 162-USER-RIGHTS.md says "when editing, turn confirmed false" -- the SYSTEM sets it, so this is a trigger and not a policy: a policy can refuse a row, it cannot rewrite one.
--
-- It runs AFTER validate_nomination in the alphabetical order PostgreSQL uses for same-timing triggers on one table (`enforce_` < `set_` < `validate_`, so in fact it runs FIRST) -- the order does not matter, because the two functions read disjoint columns and neither depends on the other's rewrite.
-- The column bound for callers who are not project nomination editors (162-REVIEW WR-05): 303-column-grants.sql cannot tell them from an admin, this trigger can.
CREATE TRIGGER enforce_nomination_columns_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.enforce_nomination_entity_columns ();

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
-- On INSERT: validates all keys On UPDATE: validates only new or modified keys (skips unchanged) Short-circuits if answers column is unchanged or empty
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
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- App customization: per-project customization settings stored as JSONB
  customization jsonb DEFAULT '{}'::jsonb,
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
-- `project_id` IS NULLABLE AND ITS FOREIGN KEY IS `ON DELETE SET NULL`, per the operator's NOTE under 162-CHECKPOINT-DECISIONS.md section 5 item P-4 (2026-09-16): feedback outlives the project it was submitted about. The nullability is not cosmetic and cannot be separated from the action -- `ON DELETE SET NULL` writing into a `NOT NULL` column makes the PROJECT delete raise rather than orphaning the row, so the two travel together.
--
-- THE CONSEQUENCE THE POLICIES OWN. Both surviving policies on this table (`admin_select_feedback`, `admin_delete_feedback` in 302-rls.sql) gate on `project_id`, and a NULL project id makes those predicates NULL, which is not `true`. An orphaned row would therefore be readable and deletable by NOBODY -- invisible, undeletable ballast -- which is not what retaining it is for. Each of those two predicates carries a second disjunct admitting the GLOBAL-SCOPE admin when `project_id IS NULL`, so an orphan stays reachable by exactly one identity. That disposition is 162-11's stated ASSUMPTION, recorded as such in 162-11-SUMMARY.md, not a ruling: the note asks for retention and does not settle who may then read it.
--------------------------------------------------------------------------------
-- Private schema for rate limiting (not exposed via PostgREST)
--------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.feedback_rate_limits (
  ip_address text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

--------------------------------------------------------------------------------
-- Feedback table
--------------------------------------------------------------------------------
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  rating integer,
  description text,
  date timestamptz NOT NULL DEFAULT now(),
  url text,
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
-- Admin jobs: job result persistence for admin features
--
-- Stores results of admin operations (e.g., QuestionInfoGeneration, ArgumentGeneration).
-- Records are immutable -- no UPDATE policy. Admins can INSERT new results and SELECT/DELETE existing ones for their project.
CREATE TABLE public.admin_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  job_id text NOT NULL,
  job_type text NOT NULL,
  election_id uuid REFERENCES public.elections (id) ON DELETE SET NULL,
  author text NOT NULL,
  end_status text NOT NULL CHECK (end_status IN ('completed', 'failed', 'aborted')),
  start_time timestamptz,
  end_time timestamptz,
  input jsonb,
  output jsonb,
  messages jsonb,
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
-- ⚠ THE FILENAME IS OLDER THAN THE SUBJECT. This file was "auth tables" in the plural sense: it once declared `user_roles` and, by ALTER, the per-row publication column on ten voter-facing content tables. 162-15 deleted the role table and both its enums; 162-16 deleted the publication columns and their five partial indexes, because section 3.4's rule -- project open for voters, nomination confirmed, every entity that nomination links confirmed -- is now the ONLY way to ask whether a row is public, and a second mechanism answering the same question is what ROADMAP criterion 2 exists to end. What is left is ONE concern, and it is the central one of phase 162: `public.grants` is declared here and nowhere else in `apps/supabase/supabase/schema/`. The file was deliberately KEPT rather than deleted for exactly that reason (D-38); it is not an empty shell, and renaming it is a separate change with its own diff.
--
-- Depends on: 100-tenancy.sql (accounts, projects)
--             000-enums.sql (grant_scope_type, grant_role_type, entity_type)
--------------------------------------------------------------------------------
-- grants table
--------------------------------------------------------------------------------
-- The grant map of 162-IMPLEMENTATION-BRIEF.md section 3.1: one row per privilege held, keyed by user, scope, target and role. Every column, constraint and index is declared inside this CREATE TABLE body per D-14a rather than accreted by ALTER, and the table ships empty because 162-06 carries the data migration.
CREATE TABLE public.grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  scope grant_scope_type NOT NULL,
  -- D-05's discriminator reuses the existing entity_type vocabulary rather than declaring a fifth parallel one; it is NULL on every non-entity row, and the CHECK below is what makes it honest rather than advisory.
  target_type entity_type,
  -- Deliberately no FOREIGN KEY: target_id is polymorphic across accounts, projects and the four entity tables by section 3.1's design, so a FK to any one of them would make the other three unrepresentable.
  target_id uuid,
  role grant_role_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- NULLS NOT DISTINCT is load-bearing rather than a style choice: measured on this tree's PostgreSQL 15.8, a plain UNIQUE admits two byte-identical project-scope grants because target_type is NULL on every non-entity row, so deleting one row to revoke a privilege would leave the privilege standing; it is a PostgreSQL 15 feature and config.toml pins major_version = 15, so this constraint pins the version floor with no margin.
  CONSTRAINT grants_user_scope_target_role_key UNIQUE NULLS NOT DISTINCT (user_id, scope, target_type, target_id, role),
  -- D-05: the discriminator is present exactly when the scope is entity. Both sides are non-null booleans, so the constraint is a total function with no NULL-passes hole. Named explicitly rather than left to PostgreSQL's generated name because 162-17 cites it by name in throws_ok, as 104-nominations.sql does for nominations_election_round_check.
  CONSTRAINT grants_entity_scope_target_type_check CHECK ((target_type IS NOT NULL) = (scope = 'entity')),
  -- Section 3.1's target_id column stated as a constraint: a global grant has no target and an account, project or entity grant must have one, so every row of the eight-row user-type mapping is representable and nothing outside it is. Named for the same throws_ok reason as the constraint above.
  CONSTRAINT grants_target_id_scope_check CHECK ((target_id IS NULL) = (scope = 'global'))
);

-- The reverse lookup "who holds a grant on this target", which project.manage_editors administration and 162-06's data migration both need and which the UNIQUE cannot serve because it leads with user_id. There is deliberately no index on user_id alone: the UNIQUE already leads with it and lint-schema.mjs's 0001 advisor matches foreign keys against an index's leading columns, so the FK is covered and a second index would cost every write and buy no read.
CREATE INDEX idx_grants_scope_target ON public.grants (scope, target_type, target_id);

--------------------------------------------------------------------------------
-- RLS on grants — critical to prevent circular RLS with the auth hook
--------------------------------------------------------------------------------
ALTER TABLE public.grants ENABLE ROW LEVEL SECURITY;

-- THE ONLY STATEMENT IN THE SCHEMA THAT GIVES THE ACCESS-TOKEN HOOK ITS SCHEMA ACCESS. 162-03 issued it here as a deliberate repetition of one that lived beside a table 162-15 has now deleted; recorded there as threat T-162-03-05, on the reasoning that re-granting an existing privilege is a no-op then and the surviving statement now. It is now the surviving statement. Removing it issues every token with no authority at all -- a silent total outage that presents as a permission problem, and that no test would catch through a policy. 24-legacy-removal.test.sql asserts it from has_schema_privilege on the applied database.
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

-- SELECT and nothing more (162-REVIEW IN-01): the hook only READS the grant map to build the claim, and its only policy here is a SELECT policy, so INSERT, UPDATE and DELETE were privilege the auth server never needed.
GRANT SELECT ON TABLE public.grants TO supabase_auth_admin;

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
-- cleanup_grants_on_delete: a grant does not outlive its target (162-REVIEW IN-02)
--
-- `target_id` carries no foreign key -- it points into one of six tables depending on `scope` and `target_type` -- so nothing removed a grant when its target row was deleted. The stale row kept being projected into every token the holder was issued, was invisible to "who holds a grant on this target" administration because the target was gone, and would silently RE-ATTACH to a recreated row that reused the id through an import. These AFTER DELETE triggers delete the grants naming the deleted row, on the six tables a grant can target.
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
--   custom_access_token_hook(jsonb)  - Projects public.grants into the JWT claims user_can(grant_scope_type, uuid, grant_permission) - MAY THIS CALLER DO THIS VERB TO THIS OBJECT: the one predicate the RLS policies delegate their authority decision project_open_for_voters(uuid), entity_has_confirmed_nomination(entity_type, uuid, uuid) - the two sub-rules of public visibility, each defined ONCE here and called DIRECTLY from the eight entity SELECT policies (D-36; the entity_is_anon_visible composition V-6(A) briefly interposed is gone, because the nesting cost 271.9 ms against 39.4)
--------------------------------------------------------------------------------
-- The `private` schema: policy-only SECURITY DEFINER helpers (162-REVIEW WR-01)
--
-- Every SECURITY DEFINER function in `public` is published by PostgREST as `/rest/v1/rpc/<name>`, and Supabase's default privileges make it executable by `anon` and `authenticated`. The hierarchy and visibility hops below exist to be called from POLICY expressions, where they answer questions row-level security would refuse the caller directly -- which project an arbitrary entity id belongs to, whether a candidate is nominated under a party before publication, whether an unconfirmed nomination exists in a closed project's contest. Published as RPCs, each became a cross-tenant oracle.
--
-- A plain REVOKE is not the fix: a policy expression runs with the QUERYING role's privileges, so revoking EXECUTE from anon and authenticated would turn every policy that calls a helper into `permission denied`. The helpers therefore live in `private`, which is NOT in PostgREST's exposed schemas (config.toml `[api] schemas`), and the API roles keep USAGE on the schema and EXECUTE on its functions -- enough for a policy to call them, never enough for a request to name them. Every call site qualifies the name, so no search_path decides which function runs.
--
-- What stays in `public`, deliberately: `user_can` (the Edge Functions ask it over RPC, and it answers only about the caller's own claim), `user_has_account_grant` (likewise caller-only), `grant_role_permissions` (the matrix itself, no row data), `project_open_for_voters` (the frontend calls it), and the two storage path helpers (caller-scoped or public-by-definition). 07-rpc-security.test.sql holds a census of every anon- and authenticated-executable SECURITY DEFINER function left in `public`, so a new one has to be added there on purpose.
--------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

GRANT USAGE ON SCHEMA private TO anon,
authenticated,
service_role;

--------------------------------------------------------------------------------
-- Custom Access Token Hook Called by Supabase Auth on every token refresh/issue.
-- Reads public.grants and projects each row into the JWT's `grants` claim.
--
-- ONE VOCABULARY, NOT TWO. The retired claim key is not emitted alongside this one. A claim outliving its table is the second authority mechanism this phase exists to end (K1), and a reader with a fallback to the retired key would be a third.
--
-- THE PER-ENTRY KEYS ARE THE COLUMN NAMES OF public.grants, minus id, user_id and created_at. user_can reads exactly these four, and a key-name or key-set disagreement across this boundary is not an error anywhere: it is an empty permission set, which reads as a total denial for every caller. 14-grants-migration.test.sql asserts the emitted array SET-EQUAL, in both directions and with equal cardinality, to test_grants_claim -- the projection helper 162-04 installed for exactly this comparison.
--
-- COALESCE keeps a user with no grant rows at an EMPTY ARRAY rather than a NULL or a missing key. user_can treats a missing key and an empty array identically today, but they are different states and only one of them is what a grant-less identity should carry.
--
-- The ORDER BY makes two calls for one user answer identically, so a diff of two captured tokens is readable. It is not what makes the projection correct: jsonb_agg defines no element order and the equality above is therefore asserted as a SET, so a reordering that means nothing cannot redden it.
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

-- And to nobody else (162-REVIEW IN-01, Supabase's own guidance for auth hooks). Only the auth server calls this function; as a public RPC it is harmless today only because it is SECURITY INVOKER and `grants` is revoked from the API roles, which is two unrelated facts holding a door shut.
REVOKE
EXECUTE ON FUNCTION public.custom_access_token_hook
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- grant_role_permissions: the role x permission matrix, encoded once
--
-- 162-IMPLEMENTATION-BRIEF.md section 3.3 exists in exactly one function body in this codebase, and this is it. Splitting it out from user_can is what makes "encoded once" checkable: 162-17's structural non-collapse guard can look for the matrix's permission literals and find them in one place, and the matrix can be diffed against the brief by machine without executing a permission check. user_can is then purely REACH and carries no cell of the matrix.
--
-- Reads no table, so it is IMMUTABLE and deliberately NOT SECURITY DEFINER — it needs no owner rights. search_path is pinned anyway, because the enum types it names are resolved at call time.
--
-- The fall-through arm is not decoration. A grant of scope `entity` with role `admin`, and grants of scope `global` or `account` with role `editor`, are shapes 300-auth-tables.sql's CHECK constraints admit and section 3.1 does not map; without the fall-through they would inherit whichever arm a CASE happened to land in. They carry the empty set, so user_can answers false for all 23.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_role_permissions (
  p_scope public.grant_scope_type,
  p_role public.grant_role_type,
  p_target_type public.entity_type
) RETURNS public.grant_permission[] LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT CASE
    -- Root: every verb. 162-IMPLEMENTATION-BRIEF.md section 3.3, column "Root".
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

    -- Account: every verb, within the account. Column "Account".
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

    -- ProjAdmin: all but the three account.* verbs. Column "ProjAdmin", 20.
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

    -- ProjEditor: ProjAdmin minus project.manage_editors, minus project.edit_project_settings (section 11.1's split) and minus nomination.confirm, which USER-RIGHTS restricts to admins. This row is what satisfies K4's "level-1 permissions short of full". Column "ProjEditor", 17. The editor keeps the app's face (app_settings), the admin keeps the project's shape (projects).
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

    -- OrganizationEditor: the entity set, minus nomination.create_parent (an organization has no parent to create) and plus entity.invite_children, which section 3.3 grants only here, as "own (org -> cand)". Column "OrgEditor", 6.
    WHEN (p_scope, p_role, p_target_type) = ('entity', 'editor', 'organization') THEN ARRAY[
      'project.read_structure',
      'entity.edit_answers',
      'entity.read_answers',
      'entity.invite_children',
      'nomination.edit',
      'nomination.read'
    ]::public.grant_permission[]

    -- Candidate, FactionEditor and AllianceEditor share one row: section 3.3 prints the Candidate and Faction/Alliance columns identically, including nomination.create_parent (section 11.5). Their `own, unless locked` cells read as `own` here; the AND NOT locked conjunct is 162-12's policy's, because projects.lock_nominations does not exist until 162-07 and row state is not a member of this matrix (162-04 task 2 Q3). Columns "Candidate" and "Faction/Alliance", 6 each.
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
-- entity_project_id: resolve an entity uuid to its project
--
-- All four entity tables carry project_id uuid NOT NULL, so the hop is one primary-key probe against whichever of the four holds the id and needs no entity-type argument. Returns NULL when the id is in none of them — which is a DENY at every call site, never a match.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.entity_project_id (p_entity_id uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT project_id FROM public.candidates WHERE id = p_entity_id
  UNION ALL
  SELECT project_id FROM public.organizations WHERE id = p_entity_id
  UNION ALL
  SELECT project_id FROM public.factions WHERE id = p_entity_id
  UNION ALL
  SELECT project_id FROM public.alliances WHERE id = p_entity_id
  LIMIT 1;
$$;

--------------------------------------------------------------------------------
-- election_project_id: resolve an election uuid to its project
--
-- The hop the two `election_constituency_groups` WRITE policies need. That table carries no project_id of its own, only election_id, and its READ policy delegates to the parent group's policy — but a WRITE must not, because a sub-select the caller's own row-level security filters makes the answer depend on the caller's READ access to the parent as well as on their authority over it, which is two questions where this phase wants one. SECURITY DEFINER moves the lookup out of the caller's view and leaves `user_can` the only thing deciding.
--
-- Returns NULL when the election does not exist, and NULL IS THE DENIAL: user_can answers false for a NULL target at project scope (301's `p_target_id IS NULL AND p_scope <> 'global'` guard), so a join row naming an election that is in no row is refused by the permission predicate rather than by three-valued logic. 17-project-structure-authority.test.sql asserts that path directly.
--
-- Same shape, same hardening and same deny-on-no-row posture as entity_project_id above; two named functions rather than one generic one, because elections and constituency_groups are two tables with two primary keys and no enum relating them — the generic alternative is dynamic SQL inside a security predicate. Not a D-21 violation: D-21 forbids naming a single ENTITY TYPE where the policy could take one as an argument, and the nine structure write predicates this plan writes name no table at all.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.election_project_id (p_election_id uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT project_id FROM public.elections WHERE id = p_election_id;
$$;

--------------------------------------------------------------------------------
-- constituency_group_project_id: resolve a constituency-group uuid to its project
--
-- The same hop for `constituency_group_constituencies`, whose two WRITE policies need it for the same reason election_project_id exists: that table carries no project_id, its READ policy delegates to the parent group's own policy, and a write must not, because a sub-select the caller's own row-level security filters asks about the caller's READ access to the parent as well as about their authority over it.
--
-- Returns NULL when the group does not exist, and NULL IS THE DENIAL by way of user_can's NULL-target guard at project scope.
--
-- TWO NAMED FUNCTIONS RATHER THAN ONE GENERIC ONE. `elections` and `constituency_groups` are two tables with two primary keys and no enum relating them, so there is no argument a generic version could take short of dynamic SQL inside a security predicate. D-21 asks that no policy name a single ENTITY TYPE where it could take one as an argument — entity types are a four-member enum with a shared shape — and that generalisation IS applied where it applies: the nine structure write predicates name no table at all.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.constituency_group_project_id (p_constituency_group_id uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT project_id FROM public.constituency_groups WHERE id = p_constituency_group_id;
$$;

--------------------------------------------------------------------------------
-- is_child_nominee: is p_child_id nominated under a nomination of the parent?
--
-- ONE HOP AND NO MORE (D4(a)). No recursive CTE, no second join: a grandchild — a candidate nominated under a faction nomination whose own parent is the organization's nomination — is FALSE when asked against the organization, and 12-user-can.test.sql asserts exactly that. A transitive version is 162-CONTEXT.md's deferred item and that assertion is what keeps it deferred.
--
-- The parent side needs a type argument and the child side does not: nominations carries four nullable entity FKs with a CHECK requiring exactly one, so a child id is matched against all four at once while the parent's type selects which column to compare (104-nominations.sql).
--
-- A published interface, not an internal detail: 162-08's anon entity policy reuses this nominations lookup rather than adding a second one, and 162-12's nomination policies call it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.is_child_nominee (
  p_parent_type public.entity_type,
  p_parent_id uuid,
  p_child_id uuid
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nominations child
    JOIN public.nominations parent ON parent.id = child.parent_nomination_id
    WHERE (
        child.candidate_id = p_child_id
        OR child.organization_id = p_child_id
        OR child.faction_id = p_child_id
        OR child.alliance_id = p_child_id
      )
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
-- The PROJECT-LEVEL term of 162-IMPLEMENTATION-BRIEF.md section 3.4, and the conjunct every one of the thirteen `TO anon` SELECT policies in 302-rls.sql carries. It reads public.projects, which has RLS enabled and NO anon policy at all: an inline `EXISTS (SELECT 1 FROM public.projects ...)` written into an anon policy therefore returns ZERO ROWS FOR EVERY CALLER and denies everything. Measured in a rolled-back transaction before this function was written -- inline 0 rows, this form the whole table -- which is why SECURITY DEFINER here is a requirement rather than an optimisation.
--
-- Denies when the project does not exist: COALESCE over a primary-key probe, never a NULL that a policy would read as a deny it did not intend to express.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.project_open_for_voters (p_project_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (SELECT p.open_for_voters FROM public.projects p WHERE p.id = p_project_id),
    false
  );
$$;

-- The frontend adapter calls this function over PostgREST, as anon and as authenticated, to tell a closed project from an open project with no settings row (162.1 D-06), so the dependency is declared here rather than inherited from default privileges; 30-closed-project.test.sql asserts both rights.
GRANT
EXECUTE ON FUNCTION public.project_open_for_voters (uuid) TO anon,
authenticated;

--------------------------------------------------------------------------------
-- entity_has_confirmed_nomination: is this entity publicly nominated in this project?
--
-- The ENTITY-LEVEL nomination hop of section 3.4, called by the four entity tables' anon SELECT policies. It answers a different question from is_child_nominee -- that one asks whether an entity is nominated UNDER a named parent, this one whether it is nominated at all, publicly -- so the two cannot share a body, and 162-04 task 2 ratified is_child_nominee's three-argument signature as a published interface that cannot be widened. The reuse section 5 asks for is therefore STRUCTURAL: the same file, the same four-FK matching expression, the same hardening, and NO policy anywhere holding a nominations sub-select of its own.
--
-- SECURITY DEFINER for a second measured reason. An entity policy holding an inline `EXISTS ... FROM public.nominations` alongside a nominations policy holding an inline `EXISTS ... FROM public.candidates` raises `infinite recursion detected in policy for relation "candidates"` on the first anon SELECT -- reproduced deliberately before this function was written. The helper's owner-rights read of both tables is what breaks the cycle, and it rests on relforcerowsecurity being false on all six tables, which 16-anon-visibility.test.sql asserts by name.
--
-- THE THIRD ARGUMENT IS LOAD-BEARING. public.nominations carries a project_id of its own and no composite constraint forces it to agree with its entity's; 07-rpc-security.test.sql section 9 creates exactly that row on purpose. Without the argument an entity in an open project would be published by a nomination living in a closed one.
--
-- p_entity_type is an ARGUMENT rather than a fact baked into four near-identical predicates (D-21), and it is matched against the generated entity_type column as well as against the four FK columns.
--
-- THE CONFIRMATION COLUMN IS READ BARE, and its bareness is the assertion. 162-12 (D-11c) renamed `nominations.unconfirmed` to `confirmed` and made it `NOT NULL DEFAULT false`, so the null-coalescing wrapper this expression used to carry -- `NOT COALESCE(n.unconfirmed, false)`, needed because the spelling `n.unconfirmed = false` would silently drop every NULL row -- is not merely unnecessary, it is REMOVABLE. 162-12 asserts that no such wrapper survives anywhere in schema/, which is a stronger statement than asserting that the remaining ones are correct. MEASURED: this file carried ONE such call site, not the three 162-08 predicted.
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
-- The TRANSITIVE conjunct of section 11.2, called by anon_select_nominations and by nothing else. The CHECK on public.nominations requires exactly one entity FK per row, so "every entity that nomination links" is ONE entity and the hop is one level deep (task 2 Q2 = A). Transitivity still holds per row rather than per chain: a parent nomination naming an unconfirmed organization fails its own policy and is invisible, because every nomination is judged by the same three conjuncts.
--
-- "READABLE" MEANS FULLY ANON-READABLE, TERMS OF USE INCLUDED (task 2 Q3 = A). The expression below is the entity policy's own predicate, so the nomination policy and the entity policy give one answer rather than two that differ on one table. The accepted cost is that the terms-of-use rule is written in two places; the mitigation is the biconditional assertion in 16-anon-visibility.test.sql -- zero nominations visible to anon whose linked entity is not -- which fails when the two expressions DISAGREE rather than merely when they differ.
--
-- ⚠ THIS IS THE PRE-162-10 BODY, RESTORED BY D-36 (2026-09-17), WHICH SUPERSEDES BOTH V-6(A) AND D-35. 162-10 replaced these four arms with four calls to a `public.entity_is_anon_visible` composition; that composition is gone and this function is the shape it had before. The reason is DEPTH, measured rather than argued: a SECURITY DEFINER function can never be inlined by the planner, so composing two SECURITY DEFINER helpers inside a third makes every per-row call a depth-2 call, and this function -- itself SECURITY DEFINER, called once per nomination row -- made it depth 3. On 5000 anon-visible nominations the composed form cost 654.5 ms against 291.0 ms for this one, same fixture, same instrument. The two helpers below remain the SINGLE definition of each sub-rule; what repeats is the assembly, here and in the eight entity SELECT policies, and 162-17 owes the guard that holds those eight identical.
--
-- It deliberately does NOT require the linked entity to belong to the nomination's own project. No composite constraint declares that, and 07-rpc-security.test.sql section 9 creates a project-A nomination naming project B's candidate as the control that makes its entity-join assertions non-vacuous; tightening here would void an existing negative control. The gap is 162-12's, which owns this table's constraints.
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
-- The predicate the RLS policies of waves 3, 4 and 5 delegate their whole authority decision to. It answers one grant at a time, and a grant says yes only when BOTH halves say yes:
--
--   1. VERB  — is p_permission a member of grant_role_permissions(...)?
--   2. REACH — does the grant's target contain, or equal, the asked object?
--
-- Grants UNION: the first grant satisfying both halves answers true, no grant can subtract, and the answer therefore does not depend on the order of entries in the claim.
--
-- It answers "may this role do this verb to this object", NOT "is this object currently in a state that admits the verb". lock_nominations, open_for_voters and the confirmation flags are conjuncts of the POLICIES that call this (162-08, 162-12), not members of the matrix — ratified as 162-04 task 2 Q3, and forced in wave 1 anyway because none of those columns exists until 162-07.
--
-- The `own` qualifier of 162-IMPLEMENTATION-BRIEF.md section 3.3 is not a third mechanism: for an entity grant, reach is exactly equality with the granted entity, so `own` falls out of the reach rule.
--
-- It reads the caller's own JWT `grants` claim and nothing else, in any branch or fallback. The claim key and the authority table this phase retired are both gone; a fallback to either would have made this answer two different questions depending on which claim the session happened to carry.
--
-- Claim fields are compared AS TEXT against the enum literals rather than cast to the enum type: a cast throws on an unexpected value, and an exception raised inside a policy predicate is a query-time error in 97 places, whereas an unrecognised entry that is simply skipped denies by default and is assertable. A claim of garbage alongside one valid grant answers exactly as the valid grant alone.
--
-- Hardened exactly as user_can is, and for the same reason: a mutable search_path on a SECURITY DEFINER function that reads tables the caller may not read is a privilege-escalation primitive, not a style issue.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_can (
  p_scope public.grant_scope_type,
  p_target_id uuid,
  p_permission public.grant_permission
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

  grants_claim := (SELECT auth.jwt() -> 'grants');
  -- NULL covers both the anon session and every real JWT until 162-06 emits the claim; a non-array covers a malformed one. Neither is an error here.
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

    -- Half 1: the verb. The matrix lives in exactly one function body and this is the only place user_can consults it.
    g_permissions := public.grant_role_permissions(
      g_scope::public.grant_scope_type,
      g_role::public.grant_role_type,
      g_target_type::public.entity_type
    );
    CONTINUE WHEN g_permissions IS NULL OR NOT (p_permission = ANY (g_permissions));

    -- Half 2: reach. Downward-or-equal from the grant's own target, plus the two NAMED exceptions below. Every hop denies when it finds no row; no branch treats a NULL comparison result as a match.
    IF g_scope = 'global' THEN
      -- Reaches everything that exists. The existence check is deliberate: an entity id that resolves to no project is not an object any grant reaches, and a global grant must not be the one branch that says otherwise because its lookup was skipped.
      CONTINUE WHEN p_scope = 'entity' AND private.entity_project_id(p_target_id) IS NULL;
      RETURN true;
    END IF;

    IF g_scope = 'account' THEN
      IF p_scope = 'account' AND p_target_id = g_target_id THEN RETURN true; END IF;
      IF p_scope = 'project' THEN
        SELECT account_id INTO v_account_id FROM public.projects WHERE id = p_target_id;
        IF v_account_id IS NOT NULL AND v_account_id = g_target_id THEN RETURN true; END IF;
      END IF;
      IF p_scope = 'entity' THEN
        v_project_id := private.entity_project_id(p_target_id);
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
        v_project_id := private.entity_project_id(p_target_id);
        IF v_project_id IS NOT NULL AND v_project_id = g_target_id THEN RETURN true; END IF;
      END IF;
      CONTINUE;
    END IF;

    -- g_scope = 'entity'. Reach is equality with the granted entity — which is what section 3.3's `own` means — plus the named branches below.
    IF p_scope = 'entity' AND p_target_id = g_target_id THEN RETURN true; END IF;

    -- NAMED BRANCH 1, the project-read branch. 162-IMPLEMENTATION-BRIEF.md section 3.4 row 2: "any auth user can always read their project". The permission is written in as a literal deliberately. A general "reach upward through the hierarchy" rule would also let an entity grantee ask entity.edit_answers at ACCOUNT scope and be told yes, because that verb is in the entity column — a fail-open with no caller today and a guaranteed one later.
    IF p_scope = 'project' AND p_permission = 'project.read_structure' THEN
      v_project_id := private.entity_project_id(g_target_id);
      IF v_project_id IS NOT NULL AND v_project_id = p_target_id THEN RETURN true; END IF;
    END IF;

    -- NAMED BRANCH 2, the child-nominee branch. 162-CHECKPOINT-DECISIONS.md section 3 item A-2, answered by the operator 2026-09-16: option (D) — is_child_nominee gates nomination.read, for ANY entity grant, and NOT entity.read_answers. 162-IMPLEMENTATION-BRIEF.md section 3.4's third row and 162-USER-RIGHTS.md's Nomination group both say the child hop grants the parent the child's nomination and BASIC data, never the child's answers — so section 3.3's entity.read_answers cells stay literally `own`, and reading the legend's "where noted" as pointing here rather than at an Entity-group cell is what the operator ratified. 162-08, 162-12 and 162-17 inherit this. Like branch 1, the permission is written in as a literal so the hop can never widen to another verb.
    IF p_scope = 'entity' AND p_permission = 'nomination.read'
       AND private.is_child_nominee(g_target_type::public.entity_type, g_target_id, p_target_id) THEN
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
-- THE ONE PREDICATE IN THIS PHASE THAT IS NOT A user_can CALL, and it is not one because it cannot be: user_can takes a PERMISSION and answers "may this role do this verb", and this rule asks about GRANT EXISTENCE. 162-IMPLEMENTATION-BRIEF.md section 3.2 enumerates no account-read member distinct from `account.edit_settings`, so 162-09 was written expecting the `accounts` SELECT and UPDATE to name the same literal -- reproducing on that one table the read/write collapse ROADMAP criterion 2 exists to end. The operator overruled that in 162-CHECKPOINT-DECISIONS.md section 1, the NOTE under S-3, 2026-09-16, ruling verbatim:
--
--     account read = any role on account or its projects
--
-- The enum is NOT widened -- S-3(A) stands, there is no 24th member -- because grant existence is answerable over the claim without one. And `accounts` is therefore NOT exempt from the criterion-2 rule: its read names a grant and its write names `account.edit_settings`, which are different things. 162-17's C-11 collapse allow-list loses `accounts` as a known-legitimate member.
--
-- THIRD POPULATION CHANGE, sanctioned by the operator on 2026-09-17 after the executor halted on it. The second disjunct -- "or its projects" -- means a PROJECT ADMIN now reads the row of the account its project belongs to, which the account-admin role predicate this phase retired refused. It reddened `04-admin-crud.test.sql`'s `project_admin cannot SELECT accounts` assertion, which is how it was found; that assertion is now the positive, strictly stronger statement that such a caller sees EXACTLY its own account. The disclosure is bounded and is recorded here rather than left to be rediscovered: an `accounts` row is `id, name, created_at, updated_at`, so what widens is the account's NAME, to someone who already administers one of its projects.
--
-- SECURITY DEFINER because the project disjunct reads public.projects, which has row-level security enabled; an inline read would be filtered by the caller's own access to that table and would then answer a second question -- can you SEE the project -- on top of the one asked. search_path is pinned for the reason it is pinned on every other definer function here.
--
-- Claim fields are compared AS TEXT against the literals rather than cast, exactly as user_can does and for the same reason: a cast throws on an unexpected value, and an exception raised inside a policy predicate is a query-time error rather than a denial. `p.id::text = (g ->> 'target_id')` never casts the claim.
--
-- The global-scope admin is a disjunct here rather than a separate policy term, so the `accounts` SELECT stays a single call and the routing assertion can name its three exceptions rather than discover them.
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
-- project_nominations_locked: is this project's nomination editing locked? (162-12)
--
-- The `unless locked` half of section 3.3's `own, unless locked` cells. 162-04 task 2 Q3 ratified that ROW STATE is not a member of the permission matrix -- user_can answers "may this role do this verb to this object", never "is this object currently in a state that admits the verb" -- so the lock is a CONJUNCT of the policies that call this, and this function is where the hop lives.
--
-- ⚠ IT DENIES BY RETURNING **LOCKED** WHEN THE PROJECT ROW IS NOT FOUND. The inversion is deliberate and is the reason this reads awkwardly: a helper that returned `false` for a missing project would UNLOCK every project that does not exist, which is the one direction a missing row must never take a permission surface. `project_open_for_voters` above denies by returning false because its sense is the other way up; both deny, and neither lets an absent row fabricate a permission.
--
-- SECURITY DEFINER for the reason every hop in this file is: it reads public.projects, which has row-level security enabled, and an inline read would be filtered by the caller's own access to that table and would then answer a SECOND question -- can you see the project -- on top of the one asked. 162-08 measured the inline form returning zero rows for every anon caller.
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
-- nomination_exists_in_contest: is this entity ALREADY nominated at this contest? (162-12, section 11.5 guard 3)
--
-- ⚠ IT IS NOT THE UNIQUENESS CONSTRAINT, AND THE DIFFERENCE IS NOT A DETAIL. `nominations_entity_parent_contest_key` includes `parent_nomination_id`, so an organization already nominated UNDER AN ALLIANCE does NOT collide with a candidate-created parent carrying a null parent of its own. This asks the broader question -- is there ANY nomination of this entity at this election, constituency and round -- which is what guard 3 actually says. 23-nominations-write.test.sql's G3-race pair is what shows the two are different predicates; without it this guard would look redundant and a later reader would remove it.
--
-- The constraint is still the thing that decides a RACE (section 11.7): two candidates of one party submitting at the same moment both see no parent here and both proceed, and the database rejects the second. This helper is the fast path and the better error, not the guarantee.
--
-- Takes the entity type as an ARGUMENT rather than naming one (D-21), and matches the entity id against the four foreign keys in the same idiom `is_child_nominee` uses. Denies -- returns false -- when no row is found, so the ABSENCE of a row can never fabricate an occupant; the policy that consumes it inverts the answer, which is exactly why the deny direction has to be false here.
--
-- `election_round` is compared with IS NOT DISTINCT FROM: the column is nullable (`DEFAULT 1` with no NOT NULL), and `=` against a NULL round would silently answer "no occupant" for every such row.
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
-- caller_nominated_in_contest: does the caller hold a named permission on an entity nominated here? (162-12, section 11.5 guard 5)
--
-- Guard 5 AND the permission check in ONE expression, which is the shape worth stating plainly: it asks
-- *is there a nomination at this contest whose entity I hold this permission on*. The permission is an ARGUMENT and the answer comes from `user_can`, so no cell of the section 3.3 matrix is written down a second time -- the matrix still lives in exactly one function body.
--
-- ⚠ THIS IS GUARD 5'S SECOND CLAUSE ONLY, RATIFIED AT 162-12 TASK 2 Q3, AND THE OMISSION IS A RULING RATHER THAN A GAP. Section 11.5 states the guard as "is inserting their own child nomination in the same transaction, OR already has one at that contest". A row-level WITH CHECK sees only the row being inserted, so the same-transaction clause is not expressible in a policy AT ALL -- and insertion order makes it moot in the direction that matters, because the candidate needs the parent's id before they can point at it. The flow that follows is legal today, since `validate_nomination` already admits a candidate nomination with no parent: own nomination with no parent -> the parent -> repoint. SECTION 6.2's INTERFACE INHERITS THIS.
--
-- Denies -- returns false -- when no row is found.
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
            p_permission
          )
  );
$$;

--------------------------------------------------------------------------------
-- caller_unconfirmed_originated_count: how many unconfirmed parent nominations has this caller originated? (162-12, section 8.9)
--
-- The subject of the cap. It counts rows this caller ORIGINATED -- `created_by = auth.uid()` -- that are organization nominations and still unconfirmed, which is exactly the population section 8.9 asks to bound: placeholder parents a candidate created and an admin has not yet resolved. A confirmed row leaves the count, so the cap bounds the QUEUE rather than a lifetime total, which is the queue-noise surface section 8.9 is actually worried about.
--
-- Returns 0 rather than NULL when there is nothing to count -- `count(*)` already does, and it matters: a NULL would make the policy's `< cap` comparison NULL, which a policy reads as a deny it did not intend to express and which would silently bar every caller rather than only the ones at the cap.
--
-- An anon caller, or any caller with no token, has `auth.uid() IS NULL` and counts the rows whose originator is NULL -- every seeded and every owner-inserted row. That is harmless because the ONLY consumer is a policy `TO authenticated`, and it is stated rather than left as a trap for a future caller.
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
-- Row Level Security: role-based access control policies
--
-- Replaces deny-all placeholders with real per-operation policies.
-- Uses helper functions from 301-auth-functions.sql:
--   user_can(scope, target_id, permission) - MAY THIS CALLER DO THIS VERB TO THIS OBJECT. The predicate a converted policy delegates its whole authority decision to; it answers reach x verb over the section 3.3 matrix and nothing else. project_open_for_voters(project_id) AND confirmed AND entity_has_confirmed_nomination(entity_type, id, project_id) - is this entity row publicly visible; ASSEMBLED in each of the eight entity SELECT policies from two helpers that are each defined ONCE (D-36, superseding V-6(A) and D-35)
--
-- Policy rules:
--   SELECT  = USING only INSERT  = WITH CHECK only UPDATE  = USING + WITH CHECK DELETE  = USING only Always specify TO anon or TO authenticated Always use (SELECT auth.uid()) and (SELECT auth.jwt()) for optimizer caching
-- =====================================================================
-- accounts (no project_id, no project scope at all)
-- =====================================================================
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "accounts_deny_all" ON public.accounts;

-- Authenticated read: GRANT EXISTENCE, not a permission literal. 162-CHECKPOINT-DECISIONS.md section 1's NOTE under S-3 rules "account read = any role on account or its projects", which user_can cannot express because user_can takes a permission and this asks whether a grant exists. It is therefore the one predicate on these seven tables that is not a user_can call, and it is a NAMED exception in the routing assertion rather than a discovered one -- the other two are the join-table delegations. See public.user_has_account_grant for the ruling, the reason the enum is not widened, and the THIRD POPULATION CHANGE this carries: a project admin now reads the row of the account its project belongs to.
--
-- This is why `accounts` is NOT exempt from ROADMAP criterion 2 after all. The plan expected this SELECT and the UPDATE below to name the same literal and to be excluded from the read/write rule by name; under the ruling they name different things, the exclusion is WITHDRAWN, and 162-17's collapse allow-list loses `accounts`.
CREATE POLICY "authenticated_select_accounts" ON public.accounts FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_has_account_grant (id)
    )
  );

-- Insert: asked at GLOBAL scope with a NULL target, and the scope is the point. A WITH CHECK on an account insert evaluates against the NEW row, so an account-scope ask would be answered by whatever grant the caller happens to hold on the uuid they chose -- and grants.target_id carries no foreign key to accounts, so a grant on an id no account uses yet is a legal row. An account admin pre-granted on an unused uuid could then create that account and own it. The global form has no such path and is 162-05's own translation of the root-admin check. Do not "simplify" this to account scope.
CREATE POLICY "admin_insert_accounts" ON public.accounts FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('global', NULL::uuid, 'account.edit_settings')
    )
  );

-- Update: `account.edit_settings` at account scope. WIDENS -- P-1 ratified (A) on 2026-09-16 -- from the root admin alone to the root admin plus that account's OWN admin, which is what section 3.3's cell grants. The row is named by its own id, so the tenancy is in the target and not in a role name.
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

-- Delete: global scope with a NULL target, for the same reason the insert above uses it, and unchanged in population.
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

-- Authenticated: 162-IMPLEMENTATION-BRIEF.md section 3.4 row 2, "any auth user can always read their project". The whole authority decision is delegated to user_can and the predicate re-derives nothing: a disjunction keeping a second project-access predicate alongside it would have hidden exactly the regression 162-04 exists to expose. Its UPDATE twin below was converted separately, by 162-09 — the pair is ROADMAP criterion 2's read/write collapse, and separating them was what made the collapse visible and assertable.
CREATE POLICY "authenticated_select_projects" ON public.projects FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', id, 'project.read_structure')
    )
  );

-- Insert: `account.manage_projects`, asked at account scope against the new row's account. Section 3.3 puts project creation in the Account group. Population unchanged: the legacy pair admitted exactly the account admin of that account and the root admin, which is exactly who holds this verb at this scope.
CREATE POLICY "admin_insert_projects" ON public.projects FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('account', account_id, 'account.manage_projects')
    )
  );

-- Update: `project.edit_project_settings` — brief section 11.1's settings split, and ROADMAP criterion 2's remaining half (D-09). 162-04 converted the SELECT twin above and deliberately left this one on the legacy predicate so the read/write collapse stayed visible in the diff; this is where it is separated. The two predicates now name DIFFERENT permissions, and 17-project-structure-authority.test.sql asserts each names its own literal and NOT the other's — a test that only checked the two strings differ stays green when both are converted onto one verb, which is the failure the criterion is specified to catch. NARROWER than the legacy predicate in one direction that matters: a project EDITOR holds project.edit_structure and not this, so an editor may reshape the project's elections and may not rename the project.
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

-- Delete: `account.manage_projects` at ACCOUNT scope, which is where section 3.3 puts project deletion. NARROWS -- P-1 ratified (A) on 2026-09-16 -- from every holder of project access to the account tier: A PROJECT ADMIN CAN NO LONGER DELETE ITS OWN PROJECT. The diff shows a permission literal and not a role set, so the change is stated here in words as well; 17-project-structure-authority.test.sql asserts it in both directions, and asserts alongside it that the same project admin may still UPDATE that project, so the pair differs in the permission and not in the caller's general authority.
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

-- Authenticated read: a TWO-TERM disjunction of two DIFFERENT questions, deliberately not one call. `user_can` answers "may this caller" — the matrix — and `project_open_for_voters` answers "is this row public" — row state, which 162-04 task 2 Q3 ratified belongs to the policy and never to the matrix. The public term is the SAME helper 162-08 gave the anon twin above, so the anon and the authenticated answer cannot drift apart; it replaces the per-row publication flag 162-16 deleted from the schema. Q3 = (A), ratified 2026-09-16: dropping the public term would make a logged-in caller holding no grant see strictly LESS than a logged-out one — including a freshly-identified user between the identity callback and their grant row — and would break sign-up, which reads structure before any grant exists. `project.read_structure` and NOT `project.edit_structure`: the write twins below name the other verb, and that separation is asserted as a rule across all three structure tables.
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

-- Insert: `project.edit_structure`, the same verb as the update above and NOT the read verb the SELECT names.
CREATE POLICY "admin_insert_elections" ON public.elections FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  );

-- Update: `project.edit_structure`, the WRITE verb of the pair whose READ verb is above. ROADMAP criterion 2's behavioural sentence lands here: candidate_a holds project.read_structure through its entity grant and does NOT hold project.edit_structure, so it reads this project's elections and cannot edit them. WIDENS by the project editor, who holds edit_structure and whom the legacy predicate refused.
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

-- Authenticated read: the same two-term disjunction the elections SELECT carries, reproduced rather than re-derived so the three structure tables cannot drift apart. `user_can` answers the matrix question, 162-08's `project_open_for_voters` answers the row-state one, and the public term is what stops a logged-in caller holding no grant seeing strictly LESS than a logged-out one (Q3 = A). It replaces the per-row publication flag 162-16 deleted from the schema.
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

-- Insert: `project.edit_structure`, not the read verb the SELECT above names.
CREATE POLICY "admin_insert_constituency_groups" ON public.constituency_groups FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  );

-- Update: `project.edit_structure`. WIDENS by the project editor, who holds this verb and whom the legacy predicate refused.
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

-- Authenticated read: the same two-term disjunction the elections SELECT carries, reproduced rather than re-derived so the three structure tables cannot drift apart. `user_can` answers the matrix question, 162-08's `project_open_for_voters` answers the row-state one, and the public term is what stops a logged-in caller holding no grant seeing strictly LESS than a logged-out one (Q3 = A). It replaces the per-row publication flag 162-16 deleted from the schema.
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

-- Insert: `project.edit_structure`, not the read verb the SELECT above names.
CREATE POLICY "admin_insert_constituencies" ON public.constituencies FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  );

-- Update: `project.edit_structure`. WIDENS by the project editor, who holds this verb and whom the legacy predicate refused.
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

-- Anon: the join row is visible exactly when its constituency group is. This table carries no project_id of its own, so rather than re-deriving the gate it DELEGATES to `anon_select_constituency_groups`: the sub-select below is evaluated under the anon caller's own row-level security, so it resolves to "the group is anon-visible" -- that policy answering, not a second copy of the rule. This is the one place an inline sub-select is correct, and it is correct precisely because it delegates instead of re-deriving. There is no cycle, because the group's own policy does not reference this table; measured in a rolled-back transaction before it was written.
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

-- Authenticated: the IDENTICAL delegation the anon twin above carries, character for character, so the two roles cannot answer differently. It leaves the ungated `USING (true)` form, which made every join row of every tenant readable by every authenticated caller. THE NARROWING IS SILENT IF IT IS WRONG: supabaseDataProvider.ts reaches this table only as a PostgREST EMBEDDED RESOURCE (`constituency_groups` selected with `constituency_group_constituencies(constituency_id)`), and a denial on an embed returns an EMPTY ARRAY rather than an error — a constituency group renders with no constituencies and nothing anywhere reports it.
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

-- Admin insert: one `user_can` call whose target is the SECURITY DEFINER hop, not a sub-select the caller's own row-level security filters. The hop returns NULL for a group that does not exist and user_can denies a NULL target at project scope, so an absent parent is refused BY THE PERMISSION PREDICATE.
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

-- Admin delete: the same hop, the same verb.
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

-- Anon: the join row is visible exactly when its constituency group is. This table carries no project_id of its own, so rather than re-deriving the gate it DELEGATES to `anon_select_constituency_groups`: the sub-select below is evaluated under the anon caller's own row-level security, so it resolves to "the group is anon-visible" -- that policy answering, not a second copy of the rule. This is the one place an inline sub-select is correct, and it is correct precisely because it delegates instead of re-deriving. There is no cycle, because the group's own policy does not reference this table; measured in a rolled-back transaction before it was written.
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

-- Authenticated: the IDENTICAL delegation the anon twin above carries, character for character, so the two roles cannot answer differently and a later change to the group's visibility reaches this table without anyone remembering to make it. It leaves the ungated `USING (true)` form, which made every join row of every tenant readable by every authenticated caller. THE NARROWING IS SILENT IF IT IS WRONG: supabaseDataProvider.ts reaches this table only as a PostgREST EMBEDDED RESOURCE (`elections` selected with `election_constituency_groups(constituency_group_id)`), and a denial on an embed returns an EMPTY ARRAY rather than an error — an election renders with no constituency groups and nothing anywhere reports it. That is why the full E2E suite is an instrument on this policy and not a formality.
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

-- Admin insert: one `user_can` call whose target is the SECURITY DEFINER hop, not a sub-select. The read policy above delegates to the parent's policy on purpose; a WRITE must not, because a sub-select the caller's own row-level security filters makes the answer depend on the caller's READ access to the parent as well as on their authority over it. election_project_id returns NULL for an election that does not exist, and user_can denies a NULL target at project scope — so a join row naming an absent parent is refused BY THE PERMISSION PREDICATE rather than by three-valued logic, and that path is asserted directly.
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

-- Admin delete: the same hop as the insert above, the same verb.
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
-- Read this once; the twenty policies below are four copies of it, and the ONLY differences between the four copies are the table name and the entity-type literal. 18-entity-policies.test.sql asserts that as a STRUCTURAL property: each verb family's four expressions, normalised for those two things, are the same string. D-21 is an instruction with a checkable consequence, and four identical tables are where it is checkable.
--
-- THE VERB MAP (162-IMPLEMENTATION-BRIEF.md section 3.3, the four rows that bear on entity tables):
--   project.read_entities  - the SELECT policies' project disjunct. Root/Account/ProjAdmin/ProjEditor only.
--   project.edit_entities  - the INSERT, admin UPDATE and DELETE policies. Same four columns.
--   entity.read_answers    - the SELECT policies' own-row disjunct. `own` for an entity grant.
--   entity.edit_answers    - the self-update policies. `own` for an entity grant.
-- An entity grantee holds NEITHER project verb, so it reaches no other entity in its project through a project-scope call. That is the same-type same-project denial, and it is a property of the matrix rather than of these predicates -- which is why the predicates can be this short.
--
-- `own` IS NOT A THIRD MECHANISM. For an entity grant, user_can's reach rule is equality with the granted entity, so "is this row mine" needs no column comparison. The six inline `auth_user_id = auth.uid()` clauses this block used to carry, and the never-called helper predicate that duplicated them, are gone: 162-10 derived the count as exactly six before the first edit and exactly zero after it.
--
-- THE PARENT'S REACH TO A CHILD NOMINEE IS NOT A ROW DISJUNCT HERE, AND IT MUST NOT BECOME ONE (162-REVIEW CR-02).
-- SPEC section 7 row 3 and the A-2(D) ruling give a parent entity its child nominee's nomination and BASIC data, never the child's answers. Row-level security cannot say "basic data": once a SELECT policy admits a row, every column of it is returned -- `answers`, `auth_user_id`, `terms_of_use_accepted` and `custom_data` included. The `user_can ('entity', id, 'nomination.read')` disjunct these four policies carried until CR-02 therefore disclosed an unconfirmed child's private answers to its parent's editor while `user_can (..., 'entity.read_answers')` answered false for the same caller.
-- The reach now lives in `public.get_entity_basic_data` (503-entity-rpcs.sql): a SECURITY DEFINER function gated on the same `user_can ('entity', <id>, 'nomination.read')` call -- whose named branch 2 is is_child_nominee, unchanged -- that returns an ALLOW-LISTED column projection. The nominations table keeps its own `nomination.read` disjunct, because a nomination row carries no answers. 18-entity-policies.test.sql asserts the parent cannot SELECT the child's row and that the function returns basic data without `answers`.
--
-- WHAT IS NOT A CONJUNCT OF THE GRANT DISJUNCTS, DELIBERATELY. user_can answers "may this role do this verb to this object", not "is this object in a state that admits the verb" (162-04 task 2 Q3). So `confirmed`, `open_for_voters` and the terms-of-use timestamps live in the PUBLIC disjunct
-- -- and nowhere else. An entity grantee reads and edits their own UNCONFIRMED row, which is exactly what makes the sign-up flow possible. Name immutability on a confirmed entity is a trigger, and it is 162-13's.
--
-- THE PUBLICATION TERM IS GONE RATHER THAN PENDING REMOVAL (D-11b), on the same reasoning 162-08 applied to the anon half: 162-16 deleted the ten columns, and there was nothing left in these predicates for it to strip. The visible consequence is real and is asserted rather than absorbed -- an authenticated caller with no grant in the project now sees exactly the id set an anon caller sees, so an unnominated entity is no longer visible to it. 18-entity-policies.test.sql states that superset relation per table, as an equality of counts AND of id sets.
--
-- ⚠ THE PUBLIC DISJUNCT IS ASSEMBLED IN EIGHT PLACES, BY RULING, AND 162-17 OWES THE GUARD THAT HOLDS THEM IDENTICAL (D-36, 2026-09-17, superseding V-6(A) and D-35). 162-10 composed "is this entity publicly visible" into one `public.entity_is_anon_visible (entity_type, id)` called by all eight entity SELECT policies. That composition is GONE. The reason is DEPTH and it was measured, not argued: a SECURITY DEFINER function can never be inlined by the planner, so a SECURITY DEFINER composition that internally calls two SECURITY DEFINER helpers pays a depth-2 per-row call. On 5000 anon-visible candidates, identical fixture and md5-fingerprinted bodies -- composed 271.9 ms anon / 351.9 ms auth; these eight direct assemblies 39.4 / 30.0; and the two flattenings that were built and rejected 111.5 (four-arm CASE) and 79.6 (UNION ALL dispatch), neither reaching the 2.0 budget.
--
-- WHAT IS DUPLICATED IS THE ASSEMBLY, NOT THE SUB-RULES, and that is why this shape was chosen over flattening. `project_open_for_voters` and `entity_has_confirmed_nomination` remain the SINGLE definition of each sub-rule and are called directly from every one of the eight quals; flattening would have copied their BODIES, which is the more drift-prone kind. What repeats is the conjunction pattern. Until 162-17's clause lands, nothing in the estate reports a drift between the eight -- and the D-35 investigation measured that the four behavioural guards for the `open_for_voters` conjunct all live in 16-anon-visibility.test.sql, so `03-anon-read.test.sql` and `18-entity-policies.test.sql` must not be assumed to cover it.
--
-- V-6 THEREFORE SITS AT ITS OWN OPTION (C), NOT (A), and the recorded cost of that is D-21's normalised-identity assertion no longer covering the SELECT family: `candidates` alone carries the two terms-of-use conjuncts, so the four authenticated SELECT predicates are TWO expressions modulo the table name rather than one. 18-entity-policies.test.sql states that as what remains true instead of re-deriving the withdrawn claim.
--
-- `admin_*` IS NOW A MISNOMER AND IS DELIBERATELY NOT RENAMED. Under D-07 a ProjectEditor also holds `project.edit_entities`, so the actor segment reads as "the project-scope actor" rather than "an administrator". Renaming it would cut across the identical names 162-09, 162-11 and 162-12 carry on their own tables, which makes it a phase-wide convention change and not this plan's. Flagged, not absorbed.
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

-- ⚠ DISJUNCT ORDER IS A MEASURED CHOICE (162.1 D-01, variant B). Project authority comes first so an admin exits on it; the public assembly comes second, token for token the sibling `anon_select_organizations` qual, so a publicly visible row never pays the SECURITY DEFINER entity `user_can` calls; entity authority comes last. PostgreSQL evaluates an OR left to right and stops at the first TRUE, so the order changes cost and never the answer: spike 028 proved it row-identical to the previous order (visible sets EXCEPT ALL in both directions and a 2,120-probe truth grid, 0 differences) and measured a signed-in candidate's whole-municipal read going from 7.15 s to 4.65 s against the 8 s timeout, admins unchanged at 1.30 s. 29-authenticated-disjunct-order.test.sql fails on any other order.
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
        user_can ('entity', id, 'entity.read_answers')
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
        user_can ('entity', id, 'entity.edit_answers')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('entity', id, 'entity.edit_answers')
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
-- candidates (project_id, auth_user_id) Answers stored as JSONB column -- covered by these policies.
-- =====================================================================
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "candidates_deny_all" ON public.candidates;

-- The five conjuncts of the anon rule are stated HERE, each independently load-bearing and each flipped alone against an otherwise-visible row in 16-anon-visibility.test.sql. The project must be open for voters (162-IMPLEMENTATION-BRIEF.md section 3.4); the candidate must itself be confirmed (D-10); a nomination that is not unconfirmed must link this candidate IN THIS PROJECT, which is the transitive half of section 11.2 and the reason an admin cannot publish a placeholder identity by confirming its nomination alone; and the two terms-of-use guards are unchanged and in their existing order -- `IS NOT NULL` hides a candidate who has never accepted, `< now()` hides future-dated acceptances (a test-seeding edge case, and defensive against client/server clock skew).
--
-- The two helper calls are wrapped `(SELECT fn (...))` per this file's optimizer convention, and each is SECURITY DEFINER because the inline form of either lookup was measured not to work: the projects probe is blind to every anon caller, and the entity/nomination pair written inline raises `infinite recursion detected in policy for relation "candidates"`.
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

-- The parent-to-child-nominee reach is deliberately ABSENT from this policy: a row policy returns the whole row, answers included, so the SPEC section 7 basic-data reach is served by `public.get_entity_basic_data` instead (162-REVIEW CR-02; see the header of this block).
--
-- ⚠ DISJUNCT ORDER IS A MEASURED CHOICE (162.1 D-01, variant B). Project authority comes first so an admin exits on it; the public assembly comes second, token for token the sibling `anon_select_candidates` qual, so a publicly visible row never pays the SECURITY DEFINER entity `user_can` calls; entity authority comes last. PostgreSQL evaluates an OR left to right and stops at the first TRUE, so the order changes cost and never the answer: spike 028 proved it row-identical to the previous order (visible sets EXCEPT ALL in both directions and a 2,120-probe truth grid, 0 differences) and measured a signed-in candidate's whole-municipal read going from 7.15 s to 4.65 s against the 8 s timeout, admins unchanged at 1.30 s. 29-authenticated-disjunct-order.test.sql fails on any other order.
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
        user_can ('entity', id, 'entity.read_answers')
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

-- Entity self-update: whoever holds `entity.edit_answers` ON THIS ROW may update it.
--
-- THE QUESTION "IS THIS ROW MINE" IS NO LONGER A COLUMN COMPARISON. Section 3.3 gives `entity.edit_answers` as `own` to the Candidate grant, and for an entity grant user_can's reach rule is equality with the granted entity -- so `own` falls out of reach and needs neither `auth_user_id` nor a second predicate. The two `auth_user_id = auth.uid()` clauses this replaces, and the retired helper predicate that duplicated them, were the same question asked in three spellings.
--
-- THE SCOPE LITERAL IS THE WHOLE SAFETY ARGUMENT. Written `'entity'` this asks about THIS ROW; written `'project'` it would ask about the row's project and would let any entity editor in the project rewrite every candidate in it -- with every pre-existing assertion in the estate still green, because none of them pairs a same-type same-project allow with its denial. 18-entity-policies.test.sql asserts that pair, and its deny half was observed RED against exactly that mis-written predicate before this one was accepted.
--
-- RENAMED under D-21's naming clause (162-CHECKPOINT-DECISIONS.md section 8 item C-6, 2026-09-16): the actor segment must not be an entity type where the predicate takes one as an argument. `candidate_update_own` became `entity_update_own_candidates`, and this expression is now table-independent.
--
-- Structural field protection (project_id, auth_user_id, external_id, ...) is a COLUMN grant, not a row predicate: see the REVOKE UPDATE / GRANT UPDATE (...) pair for this table in 303-column-grants.sql. RLS is row-level and cannot admit a row while withholding a column.
CREATE POLICY "entity_update_own_candidates" ON public.candidates
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('entity', id, 'entity.edit_answers')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('entity', id, 'entity.edit_answers')
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

-- ⚠ DISJUNCT ORDER IS A MEASURED CHOICE (162.1 D-01, variant B). Project authority comes first so an admin exits on it; the public assembly comes second, token for token the sibling `anon_select_factions` qual, so a publicly visible row never pays the SECURITY DEFINER entity `user_can` calls; entity authority comes last. PostgreSQL evaluates an OR left to right and stops at the first TRUE, so the order changes cost and never the answer: spike 028 proved it row-identical to the previous order (visible sets EXCEPT ALL in both directions and a 2,120-probe truth grid, 0 differences) and measured a signed-in candidate's whole-municipal read going from 7.15 s to 4.65 s against the 8 s timeout, admins unchanged at 1.30 s. 29-authenticated-disjunct-order.test.sql fails on any other order.
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
        user_can ('entity', id, 'entity.read_answers')
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

-- NEW. Section 3.3 grants `entity.edit_answers` as `own` to the Faction grant and D-07 maps FactionEditor to a real grant row, but no UPDATE policy on this table admitted a non-admin -- D-11a's "a permission nobody can exercise". Ratified as 162-CHECKPOINT-DECISIONS.md section 5 item P-3, option (a), 2026-09-16, which also makes the four entity tables one shape and so makes D-21's structural claim checkable across all five verb families rather than four. `user_can` can express for a faction what no column on this table could.
--
-- RECORDED HONESTLY: this is a change in the PERMISSIVE direction on a table that has never had a non-admin write path, and its beneficiary population today is ZERO -- nothing in seed.sql, in dev-seed or in the E2E fixtures grants a faction editor. It is therefore unobservable by any pre-existing test, which is why its COLUMN BOUND lands in the same commit (303-column-grants.sql) rather than deferring to 162-13, and why the bound is asserted as a number in both directions instead of being exercised.
CREATE POLICY "entity_update_own_factions" ON public.factions
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('entity', id, 'entity.edit_answers')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('entity', id, 'entity.edit_answers')
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

-- ⚠ DISJUNCT ORDER IS A MEASURED CHOICE (162.1 D-01, variant B). Project authority comes first so an admin exits on it; the public assembly comes second, token for token the sibling `anon_select_alliances` qual, so a publicly visible row never pays the SECURITY DEFINER entity `user_can` calls; entity authority comes last. PostgreSQL evaluates an OR left to right and stops at the first TRUE, so the order changes cost and never the answer: spike 028 proved it row-identical to the previous order (visible sets EXCEPT ALL in both directions and a 2,120-probe truth grid, 0 differences) and measured a signed-in candidate's whole-municipal read going from 7.15 s to 4.65 s against the 8 s timeout, admins unchanged at 1.30 s. 29-authenticated-disjunct-order.test.sql fails on any other order.
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
        user_can ('entity', id, 'entity.read_answers')
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

-- NEW, on the same ratification and with the same recorded cost as `entity_update_own_factions` above (P-3(a)): a matrix cell section 3.3 grants and no policy consulted, a permissive-direction change with no beneficiary today, and a column bound written in this same commit rather than deferred.
CREATE POLICY "entity_update_own_alliances" ON public.alliances
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('entity', id, 'entity.edit_answers')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('entity', id, 'entity.edit_answers')
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

-- Authenticated read: the same TWO-TERM disjunction of two DIFFERENT questions the structure tables carry, reproduced rather than re-derived so the content tables cannot drift from them. `user_can` answers the matrix question -- and `project.read_structure` is ✓ in all seven columns of section 3.3, so with 162-04's project-read branch the call means exactly "the caller holds SOME grant in this project", an entity grantee included. 162-08's `project_open_for_voters` answers the row-state one, and it is a SECURITY DEFINER helper over the typed column rather than an inline lookup: `public.projects` carries row-level security of its own, so an inline `EXISTS … FROM public.projects` inside a policy returns zero rows for every caller (162-08 measured it). D-15 put the flag on `projects` precisely because RLS reads it.
--
-- BOTH ARMS ARE LOAD-BEARING AND WERE MEASURED SO. With the disjunct removed, an authenticated caller holding no grant in an OPEN project sees nothing -- strictly less than a logged-out one -- and 22-content-policies.test.sql's cell 3 reddened on all three content tables. With the authority call removed, a CLOSED project went dark to its own grantees and cell 4 reddened on all three. The two variants redden DISJOINT cells.
--
-- The publication term is GONE rather than pending removal (D-11b): these predicates were written once in their end state, so 162-16 found nothing left to strip here.
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

-- Insert: `project.edit_questions`, and NOT the read verb the SELECT above names. Section 3.3 grants this verb to Root, Account, ProjAdmin and ProjEditor and to none of the four entity columns, so it WIDENS by exactly the project editor and the read/write collapse on this table ends here.
CREATE POLICY "admin_insert_question_categories" ON public.question_categories FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Update: `project.edit_questions`. Paired in 22-content-policies.test.sql against `candidate_a`, an ENTITY grantee of the SAME project, which holds project.read_structure and not this verb -- so the pair differs in the permission and in nothing else.
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

-- Authenticated read: the IDENTICAL two-term disjunction its category twin above carries, and the reason for repeating it rather than abstracting it is the same. THIS IS THE VOTER AND CANDIDATE APPS' ENTIRE QUESTION SURFACE: `get_questions` (505-question-rpcs.sql) is SECURITY INVOKER and its own header says the reads run with the caller's permissions, so this policy and the category one are the whole gate, and a predicate one term too narrow renders no product rather than failing a test. The full E2E suite is the second instrument on it.
--
-- The publication term is GONE rather than pending removal (D-11b).
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

-- Insert: `project.edit_questions`, the same verb as its category twin and NOT the read verb the SELECT above names.
CREATE POLICY "admin_insert_questions" ON public.questions FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Update: `project.edit_questions`. ⚠ THIS POLICY HAS A LIVE RUNTIME CALLER AND IT IS NOT A TEST. `merge_question_custom_data` (504-admin-rpcs.sql) is SECURITY INVOKER, and both admin job features reach it through a client carrying the INITIATING ADMIN'S OWN bearer token ($lib/supabase/job.ts -- the token rides on global.headers, so RLS evaluates the job as that admin for its whole run). An admin who loses `project.edit_questions` loses both features silently. Every role holding the legacy predicate today holds this verb, and one role more.
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
-- nominations (project_id, confirmed) -- the retired publication term left this table's policies in 162-12 and its COLUMN left the schema in 162-16
-- =====================================================================
ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nominations_deny_all" ON public.nominations;

-- Anon visibility is an ALL-OF rule with three conjuncts. The project must be open for voters; the nomination must itself be confirmed; and every entity the nomination links must be anon-readable in full, terms of use included, so that this policy and the entity policies give one answer rather than two that differ on one table (task 2 Q3 = A).
--
-- The confirmation conjunct is read BARE as of 162-12 (D-11c). It used to be `NOT COALESCE(unconfirmed, false)`, null-safe because the column was nullable; the column is now `confirmed boolean NOT NULL`, so there is no null to compensate for and the wrapper is gone rather than renamed.
--
-- The publication term is GONE rather than pending removal (D-11b), and the transitive conjunct is what replaces the work it used to do.
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

-- Authenticated read: three disjuncts, converted by 162-12 and put in their present evaluation order by 162.1 D-01.
--
--   1. The PROJECT read permission. Section 3.4's second row -- any auth user can read the project they hold a grant in.
--   2. The PUBLIC-VISIBILITY disjunct, which REPLACES the per-row publication term rather than deleting it.
--   3. The NOMINATION read permission on the row's OWN entity, resolved by coalescing the four entity foreign keys (D-21), so no entity type is named and one predicate serves all four. ⚠ THIS IS ALSO THE PARENT HOP, AND IT IS REACHED THROUGH `user_can` RATHER THAN AROUND IT: an organization reading its child candidate's nomination is `user_can`'s child-nominee branch, which 162-04 task 2 ratified as gating `nomination.read` -- OPTION (D), and NOT `entity.read_answers`. The policy calls `user_can`, `user_can` calls `is_child_nominee`, and ROADMAP criterion 3's *used wherever policy allows that control* is satisfied by that chain. There is no second `nominations` hop here and no re-derivation of that function's shape.
--
-- ⚠ THE PUBLIC-VISIBILITY DISJUNCT IS NOT AN OPTIMISATION AND MUST NOT BE DROPPED. The term it replaces was the retired `OR published = true`, and that is what let a SIGNED-IN reader see a project they hold no grant in. Removing it without a replacement would make a logged-in candidate browsing the voter application see NOTHING AT ALL -- and nothing in the anonymous policies would cover them, because those apply to a different role. The failure would present as an empty voter app for logged-in users only, which no anon-read test covers. It is therefore asserted directly: a grantee of one project sees another project's public nominations and not its unconfirmed ones.
--
-- It is the SAME three conjuncts `anon_select_nominations` carries, through the same two helpers, ASSEMBLED here rather than composed into a third function -- D-36, which superseded D-35 and V-6(A) on measurement: a SECURITY DEFINER function can never be inlined by the planner, so composing definer helpers inside a third makes every per-row call deeper, and on 5000 anon-visible nominations the composed form cost 654.5 ms against 291.0 ms. The rule still exists ONCE per helper; what repeats is the assembly, and 162-17 owes the guard that holds the assemblies identical.
--
-- The publication term is GONE from this table's policies entirely as of 162-12, so 162-16 removed ten columns and FIVE partial indexes -- five, not the ten the brief states; only elections, candidates, organizations, questions and nominations ever carried one -- and found NOTHING left to strip in any policy. That is a discharged obligation rather than a note.
--
-- ⚠ DISJUNCT ORDER IS A MEASURED CHOICE (162.1 D-01, variant B). Project authority comes first so an admin exits on it; the public assembly comes second, token for token the sibling `anon_select_nominations` qual, so a publicly visible row never pays the SECURITY DEFINER entity `user_can` calls; entity authority comes last. PostgreSQL evaluates an OR left to right and stops at the first TRUE, so the order changes cost and never the answer: spike 028 proved it row-identical to the previous order (visible sets EXCEPT ALL in both directions and a 2,120-probe truth grid, 0 differences) and measured a signed-in candidate's whole-municipal read going from 7.15 s to 4.65 s against the 8 s timeout, admins unchanged at 1.30 s. 29-authenticated-disjunct-order.test.sql fails on any other order.
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
          'nomination.read'
        )
    )
  );

-- Admin insert: `project.edit_nominations` at project scope, in place of the legacy project predicate. Converted by 162-12.
CREATE POLICY "admin_insert_nominations" ON public.nominations FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_nominations')
    )
  );

-- Entity insert of its OWN nomination -- NEW IN 162-12. The same two conjuncts as the entity UPDATE policy below, plus the confirmation conjunct: an entity user creates their own nomination UNCONFIRMED and an admin confirms it.
--
-- ⚠ PROJECT AGREEMENT (162-REVIEW CR-03). The row's entity AND its election must belong to the row's `project_id`, the same conjunct `entity_insert_parent_nominations` carries below. Without it a candidate grantee of project A inserted a nomination into project B's contest -- `nomination.edit` is asked of the ENTITY, which is in A, and nothing compared that with the row. The constituency's project is checked by `validate_nomination`, which also re-checks the election for every writer.
--
-- The confirmation conjunct here is the BRACES; the belt is the INSERT column grant in 303-column-grants.sql, which does not name the column at all, so a caller cannot set it and the declared default supplies `false`. The two fail DIFFERENTLY -- the grant refuses at privilege level before any policy is consulted, this refuses the row -- and 23-nominations-write.test.sql asserts them SEPARATELY, because neither is allowed to stand for the other.
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
          'nomination.edit'
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

-- Entity insert of a PARENT organization nomination -- section 11.5, and the sharpest surface in this file.
--
-- A child nominee whose party has no nomination at their contest may create one, unconfirmed, for an admin to resolve. The insert is NOT on their own row: it is on an ORGANIZATION's, which under section 3.3 is by definition not theirs. That is why `nomination.create_parent` is its own verb rather than a widening of `nomination.edit` -- folding it in would mean widening `own` to "own, plus any organization nomination I claim to belong to", which is the re-derivation-inside-a-policy this phase exists to end. It also makes the capability independently revocable and independently testable, and 23-nominations-write.test.sql's PERM assertion is what shows that.
--
-- ⚠ THIS IS A DELIBERATE HOLE IN `own`, AND HOLES LEAK. Any one of the five guards missing turns a convenience into a way for any authenticated candidate to write rows into the public nomination table, and a policy that admits a row it should have refused REDDENS NOTHING. Each guard is therefore REMOVED IN TURN and watched to turn an assertion green; the five counts are the evidence, and the green run that follows is not.
--
--   guard 1  the inserted row is an ORGANIZATION nomination. One non-null test suffices because the table's CHECK requires exactly one entity FK per row.
--   guard 2  it is created UNCONFIRMED (the braces again; the belt is the column grant).
--   guard 3  NO nomination exists for that organization at that election, constituency and round. NOT the uniqueness constraint -- that key includes the parent, so an organization already nominated under an ALLIANCE does not collide with a null-parent insert. The constraint decides the RACE; this decides the case.
--   guard 4  the project's nomination lock is OFF. A locked project must not be writable through a side door.
--   guard 5  the caller ALREADY HOLDS a nomination at that contest whose entity gives them this verb. Section 11.5's first clause -- "in the same transaction" -- is not expressible in a row-level check and is moot in the direction the flow runs; ratified at task 2 Q3.
--
-- Plus two conjuncts that are not guards:
--   the CAP (task 2 Q1 = A, value 10). Section 8.9 asks for it because the operator ticked "any organization in the project", which leaves a candidate able to create placeholders for parties they have nothing to do with. A literal with its reason beside it rather than a setting: D-15's homes are for values row-level security reads PER PROJECT, and nothing has asked for a per-project knob. The refusal that NAMES the value is `enforce_nomination_confirmation`'s, because a policy refusal names the policy and not the number.
--   the PROJECT AGREEMENT between the row's entity and the row. D-12b grants a candidate any organization IN THE PROJECT, and no constraint on this table forces a nomination's entity to share its project.
--
--     ⚠ ITS ARGUMENT IS THE COALESCED ENTITY AND NOT `organization_id`, AND THAT IS A MEASURED CORRECTION RATHER THAN A STYLE CHOICE. Written against `organization_id` alone it also does guard 1's job by accident: `entity_project_id(NULL)` is NULL, `NULL = project_id` is NULL, and a policy reads NULL as a refusal -- so every non-organization row was refused HERE and guard 1 never fired. MEASURED: removing guard 1 from this policy reddened ZERO assertions, which is precisely the "a guard whose removal reddens nothing is a guard that is not there" failure this plan's removal sweep exists to catch. Against the coalesced entity the agreement binds whatever entity the row names -- which is what it should always have said -- and guard 1 becomes load-bearing again. ⚠ IT IS SCOPED HERE AND NOT TO THE TABLE ON PURPOSE: 07-rpc-security.test.sql section 9 creates exactly that row deliberately, as the control that makes its entity-join assertions non-vacuous, and a table-wide constraint would void an existing negative control. The admin and service paths keep today's latitude and the general case is recorded as STILL OPEN.
--
-- Every hop is a hardened function and not a sub-select. Three of these guards read `public.nominations` from inside a policy ON `public.nominations` -- a SELF-reference, which is 162-08's recursion finding at its sharpest. Reproduced on this table before these were written: `infinite recursion detected in policy for relation "nominations"`. The inline form is UNAVAILABLE here, not merely unattractive.
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
          COALESCE(
            organization_id,
            candidate_id,
            faction_id,
            alliance_id
          )
        )
    ) = project_id
  );

-- Admin update: `project.edit_nominations` at project scope, in place of the legacy project predicate. Converted by 162-12.
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

-- Entity update of OWN nomination -- NEW IN 162-12, AND THE FIRST NON-ADMIN WRITE PATH THIS TABLE HAS EVER HAD. Fact 19 records that `nominations` was admin-only to write, so there was no policy here to rename; this is a permission surface written from nothing, which is where the permissive failure lives.
--
-- Two conjuncts, and each is asserted in BOTH directions in 23-nominations-write.test.sql because a policy that admits a row it should have refused reddens nothing:
--
--   1. `nomination.edit` on the row's OWN entity, resolved by COALESCING the four entity foreign keys. The scope argument comes from the ROW, never from the policy's name (D-21), so this one predicate serves candidates, organizations, factions and alliances and no entity type is written down. The table's CHECK requires exactly one of the four to be non-null, which is what makes the coalesce total.
--   2. The project's nomination lock OFF -- section 3.3's `own, unless locked`. 162-07 shipped `projects.lock_nominations` INERT and said so in its own comment; this is its FIRST AND ONLY READER, which means an error in its declaration surfaces here rather than there. The hop is a hardened helper rather than an inline sub-select over public.projects, for the reason 162-08 measured: a policy reading a table its own policy guards raises `infinite recursion detected in policy for relation`, reproduced on THIS table before these were written.
--
-- The lock is a CONJUNCT rather than a matrix member because 162-04 task 2 Q3 ratified that row state is not a permission: `user_can` answers "may this role do this verb to this object", not "is this object in a state that admits the verb".
--
-- The WITH CHECK also carries the PROJECT-AGREEMENT conjunct of the insert policy above (162-REVIEW CR-03): `election_id` is in the UPDATE column grant, so without it an existing nomination could be MOVED into another project's election.
--
-- What is NOT here: any clause about the confirmation flag. An entity user may edit a CONFIRMED nomination -- what they may not do is keep it confirmed, and that is `enforce_nomination_confirmation`'s rule 2, a trigger, because a policy can refuse a row but cannot rewrite one.
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
          'nomination.edit'
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
          'nomination.edit'
        )
    )
    AND NOT (
      SELECT
        private.project_nominations_locked (project_id)
    )
    AND (
      SELECT
        private.entity_project_id (
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

-- Admin delete: `project.edit_nominations` at project scope, in place of the legacy project predicate. Converted by 162-12.
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

-- Anon: the project must be open for voters. Settings are the FIRST item in 162-IMPLEMENTATION-BRIEF.md section 3.4's list of what an anon reader may see WHEN the project is open, so this policy stops being ungated -- an ungated anon policy alongside twelve gated ones is the second visibility mechanism this phase exists to end.
--
-- ⚠ CONSEQUENCE THE VOTER APPLICATION OWNS, ratified by the operator at 162-08 task 2 Q4: a CLOSED project now returns the anon caller NO SETTINGS ROW AT ALL, and the frontend has to be able to render that state. Nothing in this tree will catch it -- every project in every seed is open (162-07) -- so it is recorded here and handed on in 162-08-SUMMARY.md rather than discovered later.
CREATE POLICY "anon_select_app_settings" ON public.app_settings FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Authenticated read: the same two-term disjunction the two content tables above carry. It STOPS BEING UNGATED -- `USING (true)` made every project's configuration readable by every authenticated caller in the database, which is the second visibility mechanism this phase exists to end, and the narrowing is measured by cell 5 of 22-content-policies.test.sql's read grid.
--
-- ⚠ THE TOO-STRICT DIRECTION HERE IS AN OUTAGE, NOT AN EMPTY RENDER. `_getAppSettings` and `_getAppCustomization` read this table through `scopedFrom(...).select(...).maybeSingle()`, so zero rows reaches the adapter's null branch: `_getAppSettings` then asks `project_open_for_voters` and, when the project is closed, returns `voterApp: false`, which renders the voter maintenance page (162.1 D-06, D-16). For a grant holder the too-strict direction is still an outage, because a grant holder whose row disappeared would be shown that maintenance page instead of the preview (162.1 D-17), which is why the `user_can` disjunct must stay, and 30-closed-project.test.sql asserts it for a project admin and an entity editor. The project-open disjunct is the authenticated mirror of the rule 162-08 wrote for anon and is what keeps a logged-in non-grantee of an OPEN project reading it; removing it reddened cell 3 on this table, and the existing `'app_settings is always readable (by design)'` assertion in 01-tenant-isolation.test.sql with it. That assertion now passes because project A is open, not because this policy is ungated.
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

-- Insert: `project.edit_app_settings` — section 11.1, the same verb as the UPDATE below. The block comment that used to read "Admin CRUD" is gone with it: a PROJECT EDITOR holds this verb, so `admin_` in these three policy names is now inaccurate. The names are deliberately left alone -- a naming convention over 80 policies is a phase-level decision and three sibling plans are converting the other policies against the names they have -- and the inaccuracy is recorded for 162-17 rather than fixed unilaterally here.
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

-- Update: `project.edit_app_settings` — 162-IMPLEMENTATION-BRIEF.md section 11.1's settings split, the half 162-09 could not write. D-09 splits one settings permission in two along the line "does a policy read this value": `project.edit_project_settings` governs `projects` and is ADMIN-ONLY, this one governs `app_settings` and a project EDITOR holds it too. The editor keeps the app's face; the admin keeps the project's shape. WIDENS by exactly one role -- the project editor, whom the legacy predicate refused.
--
-- THE TWO PERMISSIONS ARE COEXTENSIVE IN SIX OF SECTION 3.3'S SEVEN COLUMNS, so a test run as an admin passes whichever literal is written here and a test run as a candidate fails whichever is written. `create_test_data ()` carries no project editor, so nothing in the tree could tell the two apart; 22-content-policies.test.sql mints one, and its editor allow-case was observed RED against this policy gated on `project.edit_project_settings` -- two reddened assertions where an always-true predicate reddens four, which is what distinguishes a split from a rename.
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

-- Delete: `project.edit_app_settings` — section 11.1.
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
-- feedback (anon insert-only; admin select/delete)
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

-- Read: `feedback.read`. ⚠ TWO DIFFERENT MEMBERS OF SECTION 3.2 GOVERN THIS TABLE -- this policy takes `feedback.read` and the DELETE below takes `feedback.manage` -- and section 3.3 grants both to exactly the same four roles (Root, Account, ProjAdmin, ProjEditor) and to none of the four entity columns. NO BEHAVIOURAL TEST IN THIS ESTATE CAN TELL THEM APART, and exchanging the two literals was measured to redden ZERO behavioural assertions. DO NOT HELPFULLY COLLAPSE THEM ONTO ONE VERB: the structural policy-to-permission map in 22-content-policies.test.sql is the only instrument that sees the difference, and a later role holding one and not the other is what the distinction is for.
--
-- The second disjunct is the ORPHAN CLAUSE. `feedback.project_id` is ON DELETE SET NULL (107-feedback.sql, the operator's P-4 note), and a NULL project id makes the first disjunct NULL, which is not `true` -- so without this term a retained row would be readable by NOBODY. The global-scope admin is 162-11's stated ASSUMPTION for who that one identity should be, recorded as such in 162-11-SUMMARY.md and overrulable in one edit.
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

-- Delete: `feedback.manage`, which is NOT the literal the SELECT above names. See that policy's note for why the two are kept apart and what measures the difference. The orphan clause is the same one, on the same permission as this policy's own.
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

-- No UPDATE policy (feedback is immutable after insert -- locked decision) No anon SELECT policy (voters cannot read their own or others' feedback)
-- =====================================================================
-- admin_jobs (project_id, no per-row public flag -- admin-only)
-- =====================================================================
ALTER TABLE public.admin_jobs ENABLE ROW LEVEL SECURITY;

-- ALL THREE POLICIES ON THIS TABLE TAKE `project.edit_questions`, ratified by the operator on 2026-09-16 (162-CHECKPOINT-DECISIONS.md section 1 item S-4, option (a), the one box ticked). `admin_jobs` is governed by NO member of section 3.2 -- the enum was transcribed from a rights list naming Feedback, Account, Project, Entity and Nomination and nothing about job records -- and section 3.2 is canonical and cannot be extended by a plan, so the table is mapped onto an existing member by ratification rather than by a planner's choice. The jobs exist to edit questions and both features terminate in the question custom-data RPC, so whoever may write a question's custom data may record and read the job that wrote it. Holder set Root / Account / ProjAdmin / ProjEditor: one project editor wider than today, and ✗ in all four entity columns.
--
-- READ AND WRITE ARE DELIBERATELY NOT SPLIT HERE, against the pattern this phase installs on every other table, and the reason is written down rather than left to look like an oversight: the enum's only read-shaped member is `project.read_structure`, which is ✓ in all four entity columns of section 3.3. Using it on this SELECT would hand every candidate and organization editor in the project the initiating operator's address in `author` and the LLM job's prompt, response and progress in `input`, `output` and `messages` -- and would redden the estate's existing `candidate_a cannot SELECT admin_jobs (admin-only table)` assertion, which is how you would find out. 162-17's matrix conformance work inherits this mapping; 162-SPEC.md records it.
CREATE POLICY "admin_select_admin_jobs" ON public.admin_jobs FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Insert: the same ratified verb. `SupabaseAdminWriter.insertJobResult` reaches this policy through the initiating admin's own bearer token, so it is evaluated for a real runtime principal.
CREATE POLICY "admin_insert_admin_jobs" ON public.admin_jobs FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Delete: the same ratified verb. This table has no UPDATE policy, so deletion is the ONLY way to alter the record of who ran an LLM job over a project's questions; keeping delete in the same holder set as the capability being recorded is what stops the audit trail being wider to erase than to write.
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
-- Storage RLS policies, cleanup triggers, and helper functions
--
-- Depends on: 301-auth-functions.sql  (user_can, and the three visibility helpers project_open_for_voters, entity_has_confirmed_nomination, nomination_entities_confirmed) 000-enums.sql       (grant_scope_type, grant_permission, storage_verb) 102-entities.sql    (candidates, organizations, factions, alliances) 101-elections.sql   (elections, constituency_groups, constituencies) 103-questions.sql   (question_categories, questions) 104-nominations.sql (nominations)
--
-- Provides: pg_net extension for async HTTP triggers storage_path_can()             - MAY THIS CALLER DO THIS VERB TO THIS PATH: the storage layer's whole authority decision, delegated to user_can storage_path_is_public()       - is this path's object anon-readable: section 3.4's rule, asked of a path delete_storage_object()        - delete ONE whitelisted object via the Storage API (pg_net) referenced_storage_paths()     - the object paths a row still references cleanup_entity_storage_files() - AFTER DELETE trigger for entity tables cleanup_old_image_file()       - BEFORE UPDATE trigger for image columns cleanup_old_answer_files()     - BEFORE UPDATE trigger for photos stored in answers RLS policies on storage.objects for public-assets and private-assets buckets
--------------------------------------------------------------------------------
-- pg_net extension (async HTTP from triggers)
--------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_net
WITH
  SCHEMA extensions;

--------------------------------------------------------------------------------
-- storage_config: configuration table for storage cleanup triggers
--
-- Stores supabase_url and service_role_key needed by pg_net triggers to call the Storage API. Seeded in seed.sql with local dev defaults.
-- In production, update values for the actual Supabase URL and service role key.
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
-- storage_path_can: MAY THIS CALLER DO THIS VERB TO THIS PATH, at this scope?
--
-- The storage layer's whole authority decision, delegated to `user_can` (301-auth-functions.sql) and to nothing else. Fourteen of the fifteen policies on storage.objects call this and carry no predicate of their own; the fifteenth is the anon read, which routes through storage_path_is_public below for the reason stated there.
--
-- THE MAPPING IS A STATEMENT ABOUT THE STORAGE LAYOUT, NOT A ROW OF SECTION 3.3. It names WHICH question to ask -- for each of the eleven values the type path segment can take, the permission that segment's OWN table policy asks -- and `user_can` answers it. The role x permission matrix lives in `grant_role_permissions` and in no other function body, this one included; every arm below was read off the applied `pg_policies` catalogue for the table it names, cell by cell, rather than inferred.
-- Ratified 2026-09-16, 162-CHECKPOINT-DECISIONS.md section 7 item T-2, option (A): all eleven segments, one CASE, fall-through denies. The vocabulary is ELEVEN values and not the four the operator's A4 note names -- the ten tables carrying `cleanup_entity_storage_files`, which builds the path prefix from TG_TABLE_NAME, plus `project` for the project-level path.
--
-- THE VERB IS A DECLARED ARGUMENT THE BODY BRANCHES ON, which is what makes read and write separable (K2's operator amendment). The two read-but-not-write identities in 20-storage-authority.test.sql are what that separability is worth: an entity grantee READS another entity's publicly visible asset and may not write it, and a caller holding `project.read_structure` and not `project.edit_structure` READS an election's asset and may not write it. The second exists only because the type segment maps to a permission rather than to a boolean.
--
-- EVERY SEGMENT ARRIVES AS ATTACKER-CONTROLLED TEXT. `storage.objects.name` is chosen by the caller, which is what distinguishes this file from the eighty-nine table policies where the object identity is a typed column. So both id arguments are `text` and NOTHING is cast outside the exception arm: measured on this database before this function was written, a policy casting segment [3] straight to uuid raises `invalid input syntax for type uuid: "settings"` on the project-level path, which aborts the caller's WHOLE statement and hides every legitimate row with it rather than hiding one.
--
-- THE ROW MUST EXIST IN THE TABLE THE TYPE SEGMENT NAMES, and its own project must be the project the path claims. Asking `user_can` on the bare uuid would provide neither, and would admit a path claiming one entity type while carrying another type's id -- a forgery the caller's own grant would then authorise. The second is the consistency conjunct ratified at 162-CHECKPOINT-DECISIONS.md section 7 item T-3, option (A), and it closes a gap that exists TODAY: the project-scope policies check segment [1] and never check that the entity the path names is in that project, so an admin of one project can write into a path naming their project and carrying another project's entity id. One comparison, on a lookup that already runs. Measured risk bound before it was added: of 327 seeded objects, zero carry a segment [1] that disagrees with the named row's project_id.
--
-- `%I` over a value the CASE above has already restricted to ten literal table names, so the dynamic name is not caller-controlled by the time it reaches `format`.
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
BEGIN
  IF p_scope IS NULL OR p_type IS NULL OR p_verb IS NULL THEN
    RETURN false;
  END IF;

  -- The mapping. Each arm's two permissions are the ones that segment's own table policy asks, read from pg_policies: the four entity tables ask entity.read_answers / entity.edit_answers at entity scope and project.read_entities / project.edit_entities at project scope; elections, constituencies and constituency_groups ask project.read_structure / project.edit_structure; questions and question_categories ask project.read_structure / project.edit_questions; nominations ask project.read_entities / project.edit_nominations; and the project-level path is app_settings' own pair, project.read_structure / project.edit_app_settings.
  IF p_scope = 'entity' THEN
    -- Only the four entity tables have an entity-scope answer at all. The other seven segments are reachable at project scope only, which is what they have today; here they fall through and deny.
    v_permission := CASE
      WHEN p_type IN ('candidates', 'organizations', 'factions', 'alliances') THEN
        (CASE p_verb WHEN 'read' THEN 'entity.read_answers' ELSE 'entity.edit_answers' END)
      ELSE NULL
    END::public.grant_permission;
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
    -- account and global are not scopes a path names. user_can reaches downward from them anyway.
    RETURN false;
  END IF;

  -- The fall-through. An unrecognised type segment is a DENIAL and never a project-scope free-for-all.
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

  -- No row in the table the segment NAMES: the type/id pairing refusal.
  IF v_row_project IS NULL THEN
    RETURN false;
  END IF;

  -- The row exists but lives in another project: the path-forgery refusal (T-3).
  IF v_row_project <> v_project_id THEN
    RETURN false;
  END IF;

  IF p_scope = 'entity' THEN
    RETURN public.user_can('entity', v_entity_id, v_permission);
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
-- 162-IMPLEMENTATION-BRIEF.md section 3.4, asked of a path instead of a row, and composed from the two visibility helpers 162-08 defined -- `project_open_for_voters` and `entity_has_confirmed_nomination` -- plus `nomination_entities_confirmed` for the nominations segment. It adds no RULE of its own: each branch below is the anon SELECT policy of the table that segment names, read from pg_policies and restated here over path segments. The storage layer therefore gives the same answer as the table layer, which is the whole of criterion 6.
--
-- WHY THIS IS NOT `user_can`. 162-04 resolved the `empty` edge by denying a caller whose JWT carries no `grants` key, and that is EVERY anon caller. An anon policy whose allow decision is a `user_can` call therefore denies everything and the public application renders blank. So the anon policy routes through visibility and the other fourteen route through authority, and "one mechanism, not a parallel implementation" holds because this function is the ONLY statement of the visibility rule this file makes -- it composes 301-auth-functions.sql's helpers and states nothing of its own. D-27, and 162-14's flagged assumptions.
--
-- THE PROJECT-LEVEL PATH IS A TIGHTENING, STATED AS ONE. The `project` segment was answered `true` unconditionally before this wave, which made a CLOSED project's assets world-readable.
-- Section 3.4 says project structure is anon-readable only when the project is open for voters, so the project conjunct now applies to it as it does to everything else. Both directions are asserted in 20-storage-authority.test.sql so the tightening cannot become a blanket denial unnoticed.
--
-- THE CANDIDATE BRANCH CARRIES THE TERMS-OF-USE GUARDS because `anon_select_candidates` does, and only `candidates` has the column. Composing the three helpers WITHOUT them would make a candidate's photo anon-fetchable while the candidate row itself stayed hidden -- storage disagreeing with tables, in the one direction a passing read test cannot report.
--
-- RESIDUAL (b) IS ACCEPTED, AND THE ACCEPTANCE IS COUPLED (162.1 D-04). This function makes an anon storage list read about 6.4x slower than the pre-grant-model policy (4.890 ms to about 31.2 ms, measured in 162-14), and it is kept as it is because nothing the application does pays that cost. `public-assets` is a public bucket, so Storage serves its downloads -- `/object/public/...`, which the voter app uses, and `/object/authenticated/...` alike -- without evaluating `storage.objects` RLS at all (spike 027, observed with this policy forced to `USING (false)`); only an anon `list` request consults it, and no application code lists `public-assets` as anon.
--
-- ⚠ IF THE BUCKET IS EVER MADE PRIVATE, THIS ACCEPTANCE LAPSES. Every download then becomes a policy evaluation, residual (b) becomes a cost on the voter's image path, and it must be re-measured before that change ships.
--
-- Same hardening and the same deny-on-no-row, deny-on-raise posture as storage_path_can above.
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

  -- The six project-structure families: their anon policies carry the project conjunct and nothing else, so the row need only exist IN THIS PROJECT.
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

  -- The four entity tables: the entity's own confirmation flag, the terms-of-use guards where the table has them, and a confirming nomination IN THIS PROJECT.
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
-- Path format: {project_id}/{entity_type}/{entity_id}/filename.ext (storage.foldername(storage.objects.name))[1] = project_id (storage.foldername(storage.objects.name))[2] = entity_type (storage.foldername(storage.objects.name))[3] = entity_id
--
-- IMPORTANT: Always use storage.objects.name (not bare 'name') to avoid ambiguity with entity tables that have a jsonb 'name' column.
--
-- EVERY ONE OF THE FIFTEEN POLICIES BELOW IS A BUCKET COMPARISON AND A HELPER CALL, AND NOTHING ELSE.
-- Not one of them re-derives a rule `user_can` already answers, names an entity type, compares an identity column, or reads a publication flag. Before this wave, eight routed through the legacy project predicate and seven did not; twelve inline self-ownership comparisons sat in eight of them, four of those inside policies that ALSO called the predicate. All three figures are now zero, read from `pg_policies` on the applied database rather than from this file (162-14, D-03, A3(a)).
--
-- TWO QUESTIONS, TWO FUNCTIONS, AND THE SPLIT IS NOT A HEDGE. `storage_path_can` answers AUTHORITY -- may this caller do this verb to this path -- and delegates it to `user_can`. `storage_path_is_public` answers VISIBILITY -- is this path's object public at all -- and composes 162-08's helpers. The fourteen authenticated policies ask the first; the anon policy asks the second, because `user_can` denies a caller whose JWT carries no `grants` key and that is every anon caller (D-27). A public-bucket read by an authenticated caller is legitimately either question, so that one policy asks both -- which is two different questions of two different functions, not a re-derivation.
--
-- THE SCOPE LITERAL IS THE ONLY DIFFERENCE BETWEEN A PAIR. Each write verb has an entity-scope policy and a project-scope policy per bucket; PostgreSQL ORs them. Normalised by replacing the bucket literal, the expressions of a verb collapse to exactly ONE string per scope -- D-21 made structural, by the same technique 162-10 used on the table dimension, asserted from `pg_policies` in 20-storage-authority.test.sql rather than argued here.
--
-- The `(SELECT fn (...))` wrapping is this codebase's optimizer convention, as on the eighty-nine content table policies.
-- =====================================================================
-- =====================================================================
-- public-assets bucket: SELECT policies
-- =====================================================================
-- Anon: the public visibility rule of 162-IMPLEMENTATION-BRIEF.md section 3.4, asked of a path.
--
-- Deliberately NOT `user_can`. See storage_path_is_public's own header: an anon session carries no `grants` claim, so an authority-based allow decision here denies everything and the public application renders blank.
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
-- Authenticated: AUTHORITY ONLY, and the absence of a visibility disjunct here is the point. Nothing in the private bucket is public, so a path whose object would be anon-visible in the public bucket confers nothing here. There is no anon policy on this bucket at all.
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
-- RENAMED under D-21's naming clause (162-CHECKPOINT-DECISIONS.md section 7 item T-4, names approved).
-- The six `candidate_*` names carried an entity type the predicate now takes as an argument; the six `admin_*` names carried an actor the conversion makes untrue, because a project EDITOR holds the project-scope write permissions under section 3.3. The actor segment is now the SCOPE the predicate asks at, which is what each expression actually says.
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
-- delete_storage_object: delete ONE object via the Storage API
--
-- ONE OBJECT PER CALL, THROUGH THE SINGLE-OBJECT ROUTE. The request is `DELETE <storage_config.supabase_url>/storage/v1/object/<bucket>/<path>`, sent by pg_net with nothing but `Authorization: Bearer <service_role_key>`; a live probe of that route answered `200 {"message":"Successfully deleted"}` and the object row was gone within about three seconds. The bulk route this function used to call accepts only DELETE with a JSON body, which pg_net 0.14's `http_delete` cannot send, so every call from `11f877913` (2026-08-17) until 162.1 was a POST that Storage answered 404 and nothing deleted (spike 029 F4). Storage never expands a folder prefix on either route, so a caller that means a folder must enumerate its objects and call this once per object.
--
-- ⚠ THE PATH IS UNTRUSTED AND GOES INTO A SERVICE-ROLE URL (162.1 D-20). A stored image path is written by the entity's own editor, and this function puts it into a URL sent with the service-role key. pg_net (libcurl) resolves `..` segments before sending and keeps a query string: a probe of `.../object/public/public-assets/x/../../../../rest/v1/elections?select=id&limit=1` arrived as `Route GET:/rest/v1/elections?select=id&limit=1`, so an unchecked path reaches any Storage route and, with enough `..`, any Kong route, as a service-role DELETE. So BEFORE any URL is built, the bucket must be `public-assets` or `private-assets` and the path must be EXACTLY the upload convention: `<uuid>/<table>/<uuid>/<uuid>.<ext>`, every uuid canonical lowercase, `<table>` one of the ten tables that carry the cleanup triggers, `<ext>` one of `jpg jpeg png webp gif avif` (the set `ALLOWED_IMAGE_EXTENSIONS` in `supabaseDataWriter.ts` uploads under). Anything else, including a folder prefix, a dev-seed name that is not a uuid, an uppercase uuid or a trailing slash, raises a WARNING and sends nothing. A legitimate object under another name is therefore never deleted by this function: that is a leak, which is recoverable, where a forged delete is not.
--
-- NOT CALLABLE BY ANY API ROLE. EXECUTE is revoked from PUBLIC, anon and authenticated directly below; without that, the default privileges would publish it as `/rest/v1/rpc/delete_storage_object` and let any caller delete any object with the service-role key. Only the SECURITY DEFINER cleanup triggers call it, and they run as the owner.
--
-- POLICY C1+ (162.1 D-10). Object names are random UUIDs (the status quo in `supabaseDataWriter.#uploadCandidateFile`), and cleanup deletes the object a row stops referencing. The ACCEPTED residual is S2: a file that was public stays reachable by its URL after its entity is unpublished, because unpublishing cannot recall copies already taken (spike 029).
--
-- KNOWN RESIDUE (162.1 D-18). Objects orphaned between `11f877913` (2026-08-17) and this fix are still stored and public. These triggers act on future changes only, and no sweep is run.
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
-- THE FOLDER IS ENUMERATED, BECAUSE STORAGE NEVER EXPANDS A PREFIX (162.1 D-12). Storage deletes exact object names only, so this trigger reads the folder's object names from `storage.objects` and calls `delete_storage_object` once per name. Until 162.1 it passed the folder prefix itself, which Storage never expanded and which the D-20 whitelist now refuses, so an entity delete deleted nothing and every deleted candidate's photos stayed stored and public (spike 029 S5).
--
-- `starts_with`, NOT LIKE. `_` is a LIKE wildcard and two of the ten tables carry it (`constituency_groups`, `question_categories`), so `name LIKE prefix || '%'` would also match a lookalike folder such as `<project>/constituencyXgroups/<id>/`. `starts_with` compares the prefix literally.
--
-- EVERY NAME STILL PASSES THE WHITELIST. Each enumerated name goes through `delete_storage_object`'s bucket and upload-convention check, so a stray name in the folder (a `notes.txt`, a dev-seed name that is not a uuid) is left in place with a WARNING: a leak, never a destroy. The enumeration never leaves the deleted row's own folder, and no second URL-building path exists.
--
-- ONE `storage.objects` SCAN PER DELETED ROW. A bulk delete of many entities scans once per row; that is accepted at current scale (162.1 RESEARCH A6).
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
-- When an entity's `image` changes, deletes the old `path` and `pathDark` objects that the row no longer uses. Only fires if the image column actually changed.
--
-- OWN FOLDER ONLY (162.1 D-20). An old path is deleted only when it starts with the row's own folder `<OLD.project_id>/<TG_TABLE_NAME>/<OLD.id>/`. A stored path is written by the entity's editor, so without this a candidate could point its image at another candidate's, another table's or another project's public photo and then replace it, and the trigger would delete the victim's file with the service-role key. `delete_storage_object` then checks the exact upload convention on top.
--
-- NEVER A PATH THE NEW ROW STILL REFERENCES (162.1 D-20). The NEW row's references come from `referenced_storage_paths (to_jsonb (NEW))`: its `image.path`, `image.pathDark` and every answer value's `path` and `pathDark`. So swapping `path` and `pathDark`, changing only `alt`, or moving the photo into an answer deletes nothing. `to_jsonb (NEW)` rather than `NEW.answers`, because this trigger is attached to ten tables and only two of them carry `answers`.
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
-- When a row's `answers` change, deletes every old answer photo the row no longer references: each `value.path` and `value.pathDark` of an OLD answer whose `value` is an object. That covers a replaced photo, a removed answer key and the key `cascade_question_delete_to_jsonb_answers` strips when a question is deleted. Before 162.1 only `image` was cleaned, so every photo a candidate ever stored as an answer stayed stored and public forever (spike 029 S4, 162.1 D-13).
--
-- DETECTED BY VALUE SHAPE, NEVER BY A `questions` JOIN. An answer holds a photo when its `value` is a JSON object (the StoredImage shape `validate_image` accepts); no other answer type stores an object there. Asking `questions.type = 'image'` instead would miss exactly the cascade case: the strip is an UPDATE run by an AFTER DELETE trigger on `questions`, so the question row is already gone when this trigger sees the change.
--
-- THE SAME TWO LIMITS AS `cleanup_old_image_file` (162.1 D-20). An old path is deleted only when it starts with the row's own folder `<OLD.project_id>/<TG_TABLE_NAME>/<OLD.id>/`, so an answer pointed at another entity's or project's photo can never get it deleted, and only when `referenced_storage_paths (to_jsonb (NEW))` no longer returns it, so a photo moved into `image` or into another answer stays. `delete_storage_object` then checks the bucket and the exact upload convention on top.
--
-- BEFORE UPDATE is safe because no BEFORE UPDATE trigger on either table assigns `NEW.answers` or `NEW.image` (checked in 162.1-03: `enforce_entity_immutability`, `enforce_external_id_immutability`, `update_updated_at`, `validate_answers_jsonb` and `cleanup_old_image_file` only read or raise), so the NEW row seen here is the row that is written; if the statement later fails, its enqueued request is rolled back with it.
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

-- Note: supabase_url and service_role_key values must be seeded in the storage_config table. See seed.sql for the default local dev values.
-- In production, update the storage_config table with actual values.
-- External ID uniqueness and immutability
--
-- The nullable external_id column itself is declared in the CREATE TABLE body of each content table that carries one: elections, constituency_groups and constituencies in 101-elections.sql; candidates, organizations, factions and alliances in 102-entities.sql; questions and question_categories in 103-questions.sql; nominations in 104-nominations.sql; app_settings in 106-app-settings.sql.
-- This file owns what enforces it: a composite unique index on (project_id, external_id) per table, giving uniqueness scoped per project, and an immutability trigger that prevents changing external_id once set (NULL -> value is allowed; value -> different value is blocked).
--
-- Used by bulk_import() for externalId-based upsert matching.
-- Depends on: 101-elections.sql, 102-entities.sql, 103-questions.sql,
--             104-nominations.sql, 106-app-settings.sql
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
-- NULL -> value: allowed (first assignment) value -> same value: allowed (no-op) value -> different value: blocked (raises exception) value -> NULL: blocked (raises exception)
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
--   bulk_import(data jsonb)  - upsert records by external_id with relationship resolution bulk_delete(data jsonb)  - delete records by prefix, UUID list, or external_id list
--
-- Both functions are SECURITY INVOKER so admin RLS policies are enforced.
-- PostgREST automatically wraps RPC calls in transactions, providing all-or-nothing guarantees without explicit transaction management.
--
-- Depends on: 500-external-id.sql (external_id columns + unique indexes)
--             302-rls.sql (admin RLS policies via user_can)
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
    -- 162-07b moved this arm off `candidates`, whose organization column is gone, and onto `factions`, whose organization column is now NOT NULL. The `candidates` arm is REMOVED rather than left declaring an empty object: an empty arm and a missing arm behave identically here (the ELSE supplies '{}'), and the one that says nothing is the one that cannot be misread as a relationship still being resolved. `RELATIONSHIP_REFS` in packages/dev-seed/src/template/permittedKeys.ts is the TypeScript transcription of this block, and the two-directional parity test in that package reads this SQL from disk -- so this CASE and that const must move in the same change or the test reddens naming whichever side lags.
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

  -- Build and execute upsert SQL ON CONFLICT uses the partial unique index on (project_id, external_id) WHERE external_id IS NOT NULL
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
-- Input format: {
--   "elections": [{"external_id": "election-2024", "name": {...}, ...}], "candidates": [{"external_id": "cand-001", "organization": {"external_id": "org-sdp"}, ...}], "nominations": [{"external_id": "nom-001", "candidate": {"external_id": "cand-001"}, ...}] }
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
-- Input format: {
--   "project_id": "uuid", "collections": { "elections": {"prefix": "import-2024-"}, "candidates": {"ids": ["uuid-1", "uuid-2"]}, "nominations": {"external_ids": ["nom-1", "nom-2"]}
--   }
-- }
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
-- Functions are SECURITY INVOKER, so RLS policies are enforced even though the authenticated role can call them. Only callers whom user_can answers true for on the target project's rows (admins) will be able to successfully import/delete data.
--------------------------------------------------------------------------------
GRANT
EXECUTE ON FUNCTION public.bulk_import (jsonb) TO authenticated;

GRANT
EXECUTE ON FUNCTION public.bulk_delete (jsonb) TO authenticated;

GRANT
EXECUTE ON FUNCTION public.resolve_external_ref (jsonb, text, uuid) TO authenticated;
-- Email helper functions for transactional email template variable resolution
--
-- Depends on: 102-entities.sql (candidates, organizations)
--             104-nominations.sql (nominations) 101-elections.sql (elections, constituencies) 300-auth-tables.sql (grants) 010-utility-functions.sql (get_localized)
--------------------------------------------------------------------------------
-- resolve_email_variables: resolve template variables for a set of users
--
-- For each user_id, looks up their entity context in the grant map and resolves template variable paths like "candidate.first_name", "organization.name", "nomination.constituency.name", "nomination.election.name".
--
-- Returns a row per user with their email, preferred_locale, and a flat JSONB object of resolved variables.
--
-- p_project_id is required and carries no DEFAULT: every entity lookup below is qualified by it, so a caller that forgot it gets an undefined_function error rather than another project's candidate, organization, constituency and election names rendered into an email.
--
-- SECURITY DEFINER: needs to read auth.users which is not accessible to regular authenticated users.
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
  -- p_template_body and p_template_subject are read here and nowhere else, deliberately. They belong to this RPC's published four-argument signature: PostgREST resolves overloads by named argument, apps/supabase/supabase/functions/send-email/index.ts passes all four by name, and the two GRANT statements that follow name the four-argument form - so the parameters cannot be dropped without a coordinated change across the Edge Function, the generated types in packages/supabase-types and the pgTAP suite. They are deliberately NOT used to narrow the resolved variable set: the only caller passes an empty string for both, so filtering the output by template text would return an empty variables object for every recipient and silently break personalisation. Consuming them here keeps them read rather than dead for plpgsql_check without changing a single value this function returns.
  PERFORM p_template_body, p_template_subject;

  FOREACH uid IN ARRAY p_user_ids
  LOOP
    -- Get user email and preferred locale from auth.users. auth.users carries no project column; the recipient set is bounded to the project by the grant test below rather than here.
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

    -- RECIPIENTS ARE BOUNDED TO THE PROJECT (162-REVIEW WR-02). A user id is returned only when that user holds a grant whose target resolves to p_project_id: the project itself, the account that owns it, or an entity in it. Without this the send-email Edge Function -- whose caller supplies the id list -- could mail, or with `dry_run` simply read back, the address of ANY user in the instance, other tenants' admins included. A global grant targets no project and does not qualify. An id that fails the test is skipped exactly like an unknown id, so the answer does not distinguish the two.
    IF NOT EXISTS (
      SELECT 1
      FROM public.grants g
      WHERE g.user_id = uid
        AND (
          (g.scope = 'project' AND g.target_id = p_project_id)
          OR (g.scope = 'account' AND g.target_id = (SELECT pr.account_id FROM public.projects pr WHERE pr.id = p_project_id))
          OR (g.scope = 'entity' AND private.entity_project_id (g.target_id) = p_project_id)
        )
    ) THEN
      CONTINUE;
    END IF;

    -- Initialize empty variables
    vars := '{}'::jsonb;

    -- Get the first relevant entity-scope grant (candidate or organization) for this user. public.grants has no project_id column, so this lookup carries no project predicate; the scoping happens on the entity rows target_id points at, which is where the project-scoped data actually lives.
    --
    -- DELIBERATELY TWO ENTITY KINDS AND NOT FOUR (162-15 task 2 Q3, ratified `approved`). The grant map's discriminator admits `faction` and `alliance` as well, and this function ignores both -- exactly as its predecessor did, which had no vocabulary member for either and so could never resolve one. Widening the filter here would change what a live email renders inside a commit whose gate is a removal; 162-IMPLEMENTATION-BRIEF.md section 6.1 owns organization, faction and alliance onboarding and owns closing the gap.
    --
    -- The preference order is candidate before organization, preserved verbatim from the lookup this replaced. MEASURED at 162-15: it decides nothing on any identity this repository creates -- zero identities in the seed and zero in the pgTAP fixture hold BOTH a candidate-kind and an organization-kind entity grant, so reversing the two arms is a no-op and reddens nothing. It is kept because the population it arbitrates is reachable (the grant map permits both rows for one user) and because changing it would be a behaviour change smuggled inside a removal, not because a test currently holds it in place.
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
      -- Resolve candidate fields. The project predicate is an unconditional equality rather than an `IS NULL OR` shape, because there is no "every project" case: a caller without a project is a caller that should not be resolving anybody's name.
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

      -- Resolve nomination context (constituency + election + nominating organization) for this candidate Takes the first nomination found for this candidate. The predicate is on the nomination rather than on the constituency and election it joins, because those two are reached THROUGH the nomination and a nomination belonging to this project cannot name another project's election without violating validate_nomination. Which nomination supplies the names is still whichever one LIMIT 1 happens to return, exactly as before: narrowing the candidate set by project does not make that pick deterministic, and making it deterministic is a product question about which nomination is "the" one.
      --
      -- 162-07b ADDED THE ORGANIZATION TO THIS WALK rather than giving it a second round trip. It used to be read off `candidates.organization_id`, a column that stated the candidate-to-organization association a second time; the authoritative statement is the `parent_nomination_id` edge, so the name is now one more column on a query this branch already ran. The two parent joins are LEFT joins on purpose: a candidate nomination with no parent is legal, and an inner join would silently drop the constituency and election names along with the organization. A candidate with no nomination at all emits no organization key, exactly as a candidate with no organization did before.
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

-- service_role ONLY. The function is SECURITY DEFINER, reads auth.users and carries no authority check of its own, so any role that can EXECUTE it can read the email address of any user id it names -- and user ids are harvestable from public columns (candidates.auth_user_id). Its one caller, the send-email Edge Function, reaches it through a service-role client after its own authority gate. Supabase's default privileges grant EXECUTE on every new public function to anon and authenticated, so the REVOKE has to name them as well as PUBLIC (162-REVIEW CR-01).
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
--   get_nominations()         - return nominations with entity data get_entity_basic_data() - basic-data projection of an entity the caller holds nomination.read on get_candidate_user_data() - return entity row for authenticated user upsert_answers()          - atomic answer write for a single entity
--------------------------------------------------------------------------------
-- get_nominations RPC: returns nominations with entity data in a single round trip
--
-- p_project_id is REQUIRED and carries no DEFAULT. Every other filter defaults NULL, and NULL means "no filter", so a defaulted project would let a caller that forgets the argument read every project's nominations without anything saying so. It comes first because PostgreSQL forbids a parameter without a default from following one that has a default.
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
  -- The project term belongs in the JOIN condition and not in the WHERE clause. These are LEFT joins: a WHERE predicate on the right-hand table would discard every nomination whose entity is of a different type (three of the four aliases are NULL on any given row), turning the whole result set empty. In the ON clause a non-matching entity simply resolves to NULL, which is what the trailing COALESCE filter is already written to handle.
  LEFT JOIN public.candidates c ON n.candidate_id = c.id AND c.project_id = p_project_id
  LEFT JOIN public.organizations o ON n.organization_id = o.id AND o.project_id = p_project_id
  LEFT JOIN public.factions f ON n.faction_id = f.id AND f.project_id = p_project_id
  LEFT JOIN public.alliances a ON n.alliance_id = a.id AND a.project_id = p_project_id
  -- The project predicate is an unconditional equality rather than the `IS NULL OR` shape the other filters use, because there is no "every project" case: a caller without a project is a caller that should not be reading nominations at all.
  WHERE n.project_id = p_project_id
    AND (p_election_id IS NULL OR n.election_id = p_election_id)
    AND (p_constituency_id IS NULL OR n.constituency_id = p_constituency_id)
    AND (p_include_unconfirmed OR n.confirmed)
    -- nominations.election_round is a scalar integer, so this is an equality rather than the array containment that get_questions uses against the JSONB election_rounds on questions and question categories.
    AND (p_election_round IS NULL OR n.election_round = p_election_round)
    -- SECURITY INVOKER means the LEFT JOINs run with the caller's permissions, so RLS-hidden entity rows return NULL on the entity-side columns. Drop rows where every entity-side join resolved to NULL. With the join predicates above, this filter also drops a nomination whose entity belongs to another project.
    --
    -- ⚠ NARROWER SINCE 162-08, AND KEPT AS DEFENCE IN DEPTH RATHER THAN REMOVED. This filter was written when the nomination row carried no gate of its own beyond its own policy: an entity hidden by `anon_select_candidates`' terms-of-use clause would still have left its nomination visible, and this line is what stopped the leak. Since 162-08 `anon_select_nominations` carries the transitive conjunct itself -- every entity a nomination links must be confirmed -- so the class of row this filter still catches is smaller than the class it was written for. 162-08 recorded the narrowing as a note for 162-16 rather than as an action, and 162-16 records it again and CHANGES NOTHING: the remaining class is not empty (the terms-of-use clause is a candidates-policy term that no nominations predicate restates), and deleting a defence-in-depth filter inside a comment sweep is the silent change this phase exists to prevent.
    AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL
  ORDER BY n.sort_order NULLS LAST, n.id;
$$;

GRANT
EXECUTE ON FUNCTION public.get_nominations (uuid, uuid, uuid, boolean, integer) TO anon,
authenticated;

--------------------------------------------------------------------------------
-- get_entity_basic_data: an entity's BASIC data for a caller holding nomination.read on it (162-REVIEW CR-02)
--
-- SPEC section 7 row 3: an entity grantee reads, via is_child_nominee, a related entity's basic data only -- not its answers unless public. Row-level security cannot express that, because a SELECT policy that admits a row returns every column of it; the four entity SELECT policies therefore no longer carry a `nomination.read` disjunct (302-rls.sql), and this function is where the parent's reach lives instead.
--
-- The gate is ONE `user_can ('entity', p_entity_id, 'nomination.read')` call, so the matrix is asked rather than re-derived: the child-nominee hop is user_can's named branch 2, and every project-scope role holding nomination.read passes through the ordinary reach rules.
--
-- The projection is an ALLOW-LIST, not `to_jsonb(row) - <deny-list>`: a column added to an entity table later is withheld until someone decides it is basic data. Withheld today: answers, auth_user_id, terms_of_use_accepted, custom_data, is_generated, external_id and the two timestamps.
--
-- Returns NULL -- never raises -- when the caller lacks the permission or the id is in no entity table, so the answer does not distinguish "does not exist" from "not yours".
--
-- SECURITY DEFINER because the whole point is to return a row the caller's own SELECT policy refuses; search_path is pinned as on every definer function in this schema. EXECUTE is authenticated only: anon carries no grants claim, so user_can would deny it on every call anyway.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_entity_basic_data (p_entity_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_entity_id IS NULL OR NOT public.user_can('entity', p_entity_id, 'nomination.read') THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
      'entity_type', 'candidate', 'id', c.id, 'project_id', c.project_id,
      'first_name', c.first_name, 'last_name', c.last_name,
      'short_name', c.short_name, 'info', c.info, 'color', c.color, 'image', c.image,
      'sort_order', c.sort_order, 'subtype', c.subtype, 'confirmed', c.confirmed)
    INTO result
    FROM public.candidates c WHERE c.id = p_entity_id;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT jsonb_build_object(
      'entity_type', 'organization', 'id', o.id, 'project_id', o.project_id,
      'name', o.name, 'short_name', o.short_name, 'info', o.info, 'color', o.color, 'image', o.image,
      'sort_order', o.sort_order, 'subtype', o.subtype, 'confirmed', o.confirmed)
    INTO result
    FROM public.organizations o WHERE o.id = p_entity_id;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT jsonb_build_object(
      'entity_type', 'faction', 'id', f.id, 'project_id', f.project_id,
      'organization_id', f.organization_id,
      'name', f.name, 'short_name', f.short_name, 'info', f.info, 'color', f.color, 'image', f.image,
      'sort_order', f.sort_order, 'subtype', f.subtype, 'confirmed', f.confirmed)
    INTO result
    FROM public.factions f WHERE f.id = p_entity_id;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT jsonb_build_object(
      'entity_type', 'alliance', 'id', a.id, 'project_id', a.project_id,
      'name', a.name, 'short_name', a.short_name, 'info', a.info, 'color', a.color, 'image', a.image,
      'sort_order', a.sort_order, 'subtype', a.subtype, 'confirmed', a.confirmed)
    INTO result
    FROM public.alliances a WHERE a.id = p_entity_id;
  RETURN result;
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.get_entity_basic_data (uuid)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.get_entity_basic_data (uuid) TO authenticated;

--------------------------------------------------------------------------------
-- get_candidate_user_data: returns the entity row for the authenticated user, in ONE project
--
-- p_project_id is REQUIRED and carries no DEFAULT (162-REVIEW WR-08). One identity may legitimately hold entity rows in several projects -- identity-callback's own lookup says so -- and without a project term this function ended `LIMIT 1` over all of them with no ORDER BY, so a multi-project user got an arbitrary row and the adapter's own project check then failed at random. It comes first because PostgreSQL forbids a parameter without a default from following one that has a default.
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
-- Covers every entity table carrying an answers column, which is exactly public.candidates and public.organizations; factions and alliances carry no such column.
--
-- Adjacency: candidates are tried first and the organizations attempt runs only when the candidate update matched no row, so one call never writes both tables. That much is enforced by the control flow.
--
-- What is NOT enforced, stated so it is not read as a guarantee: nothing in the schema makes public.candidates.id and public.organizations.id disjoint. They are independent gen_random_uuid() defaults, so a collision cannot arise by accident - but id is a writable, importable column (it is in the dev-seed allowlist, and bulk_import builds its INSERT column list from the JSON keys it is handed), so a hand-authored template or an external import that reuses one UUID across the two tables would make the CANDIDATE branch match and land an intended organization answer on the candidate row, returning success. Disjointness is a convention this function relies on and does not check. If that ever stops being safe, take the entity table from the caller rather than inferring it from which UPDATE matched.
--
-- SECURITY INVOKER: runs with caller's permissions, so each branch's UPDATE is gated by that table's own RLS policies - a candidate can only update their own row, an organization admin only their own organization.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_answers (
  p_entity_id uuid,
  p_answers jsonb,
  p_overwrite boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  p_updated_answers jsonb;
BEGIN
  IF p_overwrite THEN
    UPDATE public.candidates
    SET answers = (
      SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
      FROM jsonb_each(COALESCE(p_answers, '{}'::jsonb)) AS t(k, v)
      WHERE v IS NOT NULL AND v != 'null'::jsonb
    )
    WHERE id = p_entity_id
    RETURNING public.candidates.answers INTO p_updated_answers;

    IF NOT FOUND THEN
      UPDATE public.organizations
      SET answers = (
        SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
        FROM jsonb_each(COALESCE(p_answers, '{}'::jsonb)) AS t(k, v)
        WHERE v IS NOT NULL AND v != 'null'::jsonb
      )
      WHERE id = p_entity_id
      RETURNING public.organizations.answers INTO p_updated_answers;
    END IF;
  ELSE
    UPDATE public.candidates
    SET answers = (
      SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
      FROM jsonb_each(
        COALESCE(public.candidates.answers, '{}'::jsonb) || COALESCE(p_answers, '{}'::jsonb)
      ) AS t(k, v)
      WHERE v IS NOT NULL AND v != 'null'::jsonb
    )
    WHERE id = p_entity_id
    RETURNING public.candidates.answers INTO p_updated_answers;

    IF NOT FOUND THEN
      UPDATE public.organizations
      SET answers = (
        SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
        FROM jsonb_each(
          COALESCE(public.organizations.answers, '{}'::jsonb) || COALESCE(p_answers, '{}'::jsonb)
        ) AS t(k, v)
        WHERE v IS NOT NULL AND v != 'null'::jsonb
      )
      WHERE id = p_entity_id
      RETURNING public.organizations.answers INTO p_updated_answers;
    END IF;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entity not found or access denied: %', p_entity_id;
  END IF;

  RETURN p_updated_answers;
END;
$$;

GRANT
EXECUTE ON FUNCTION public.upsert_answers (uuid, jsonb, boolean) TO authenticated;
-- Admin RPC functions
--
-- Functions:
--   merge_question_custom_data() - shallow JSONB merge on questions.custom_data
--------------------------------------------------------------------------------
-- merge_question_custom_data: shallow JSONB merge on questions.custom_data
--
-- SECURITY INVOKER: the existing admin_update_questions RLS policy enforces that only callers whom user_can answers true for project.edit_questions on the row's project can update questions.
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
--   get_questions() - return question categories and their questions in one round trip
--------------------------------------------------------------------------------
-- get_questions RPC: returns question categories and questions in a single round trip
--
-- The return is a single jsonb value of the shape { "categories": [...], "questions": [...] }. A jsonb return was chosen over a tabular one because the two result sets are heterogeneous, and because it adds no new tabular column and therefore no new nullability metadata for the generated types to misstate; the adapter validates the payload with zod regardless, so generated column typing buys nothing here.
--
-- p_project_id is REQUIRED and carries no DEFAULT, so a caller that omits it gets an undefined_function error rather than every project's questions. Migration 00006 introduced it by dropping the three-argument form and re-creating the four-argument one; see that file for why a defaulted project parameter would have reproduced the leak under a new name.
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
        -- The project predicate is an unconditional equality rather than the `IS NULL OR` shape the other three filters use, because there is no "every project" case: a caller without a project is a caller that should not be reading questions at all. It is stated FIRST so that a reader checking the leak is closed does not have to read past three defaulted filters to find it.
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
--   p_table_name   - name of the target table p_column_name  - name of the JSONB column to merge into p_row_id       - UUID primary key of the row to update p_partial_data - JSONB object to deep-merge into the existing value
--
-- SECURITY INVOKER: the caller's RLS policies apply to the UPDATE
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
