-- Enum type definitions
--
-- All enum types used across the schema:
--   question_type   - question answer value types
--   entity_type     - nomination entity discriminator
--   category_type   - question category classification
--   user_role_type  - auth role assignments

CREATE TYPE public.question_type AS ENUM (
    'text', 'number', 'boolean', 'image', 'date', 'multipleText',
    'singleChoiceOrdinal',
    'singleChoiceCategorical',
    'multipleChoiceCategorical'
);

CREATE TYPE public.entity_type AS ENUM (
    'candidate', 'organization', 'faction', 'alliance'
);

CREATE TYPE public.category_type AS ENUM (
    'info', 'opinion', 'default'
);

CREATE TYPE public.user_role_type AS ENUM (
    'candidate', 'party', 'project_admin', 'account_admin', 'super_admin'
);
-- Utility functions
--
-- Functions:
--   update_updated_at()  - trigger for automatic updated_at timestamps
--   get_localized()      - extract locale string from JSONB (email helpers only)

--------------------------------------------------------------------------------
-- update_updated_at
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- get_localized: extract locale string from JSONB with fallback chain
--
-- NOTE: Only used by email helpers (502-email-helpers.sql) for server-side
-- variable resolution. Voter/candidate API responses return all locales as
-- JSONB; locale selection happens client-side (see 11-DECISION.md).
--
-- Fallback order:
--   1. p_val->>p_locale          (requested locale)
--   2. p_val->>p_default_locale  (project default)
--   3. first available key       (any content is better than NULL)
--   4. NULL                      (p_val is NULL or empty)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_localized(
    p_val JSONB,
    p_locale TEXT,
    p_default_locale TEXT DEFAULT 'en'
)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
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
--   is_localized_string()    - check if JSONB is a localized string object
--   is_valid_choice_id()     - check if a value is a valid choice ID
--   validate_answer_value()  - validate an answer value against question type
--   validate_nomination()    - enforce nomination hierarchy rules

--------------------------------------------------------------------------------
-- is_localized_string: check if a JSONB value is a localized string object
--
-- A localized string is a JSONB object where all values are strings.
-- Examples: {"en": "Hello", "fi": "Hei"}, {"en": "text"}
-- Returns false for: null, "plain string", 42, [], {"key": 42}
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_localized_string(p_val JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  p_key TEXT;
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
  FOR p_key, p_value IN SELECT * FROM jsonb_each(p_val)
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
-- Choices format: [{"id": "1", ...}, {"id": "2", ...}]
-- Returns true if p_value matches any choice id.
-- Returns true if p_valid_choices is NULL (no choices to validate against).
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_valid_choice_id(
    p_value JSONB,
    p_valid_choices JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql IMMUTABLE
AS $$
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
-- validate_answer_value: validate an answer against its question type
--
-- Answer format: {"value": ..., "info": ...}
-- The "info" field is optional and can be a plain string or localized string.
--
-- Text answers: value can be a plain string or a localized string object.
-- MultipleText answers: value must be an array of strings or localized strings.
-- Choice answers: value must be a valid choice ID from the choices array.
-- MultipleChoice answers: all array items must be valid choice IDs.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_answer_value(
    p_answer_val JSONB,
    p_q_type public.question_type,
    p_valid_choices JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
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
      IF jsonb_typeof(p_answer_value) != 'object' THEN
        RAISE EXCEPTION 'Answer for image question must be an object';
      END IF;
      -- Validate StoredImage structure: {path, pathDark?, alt?, width?, height?, focalPoint?}
      IF NOT (p_answer_value ? 'path') THEN
        RAISE EXCEPTION 'StoredImage must have a "path" property';
      END IF;
      IF jsonb_typeof(p_answer_value -> 'path') != 'string' THEN
        RAISE EXCEPTION 'StoredImage "path" must be a string';
      END IF;
      IF p_answer_value ? 'pathDark' AND jsonb_typeof(p_answer_value -> 'pathDark') != 'string' THEN
        RAISE EXCEPTION 'StoredImage "pathDark" must be a string';
      END IF;
      IF p_answer_value ? 'alt' AND jsonb_typeof(p_answer_value -> 'alt') != 'string' THEN
        RAISE EXCEPTION 'StoredImage "alt" must be a string';
      END IF;
      IF p_answer_value ? 'width' AND jsonb_typeof(p_answer_value -> 'width') != 'number' THEN
        RAISE EXCEPTION 'StoredImage "width" must be a number';
      END IF;
      IF p_answer_value ? 'height' AND jsonb_typeof(p_answer_value -> 'height') != 'number' THEN
        RAISE EXCEPTION 'StoredImage "height" must be a number';
      END IF;
      IF p_answer_value ? 'focalPoint' THEN
        IF jsonb_typeof(p_answer_value -> 'focalPoint') != 'object' THEN
          RAISE EXCEPTION 'StoredImage "focalPoint" must be an object';
        END IF;
        IF NOT (p_answer_value -> 'focalPoint' ? 'x') OR NOT (p_answer_value -> 'focalPoint' ? 'y') THEN
          RAISE EXCEPTION 'StoredImage "focalPoint" must have "x" and "y" properties';
        END IF;
        IF jsonb_typeof(p_answer_value -> 'focalPoint' -> 'x') != 'number' THEN
          RAISE EXCEPTION 'StoredImage "focalPoint.x" must be a number';
        END IF;
        IF jsonb_typeof(p_answer_value -> 'focalPoint' -> 'y') != 'number' THEN
          RAISE EXCEPTION 'StoredImage "focalPoint.y" must be a number';
        END IF;
      END IF;
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
--   If parent_nomination_id is set, election_id, constituency_id, and
--   election_round must match the parent nomination.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_nomination()
RETURNS TRIGGER AS $$
DECLARE
  p_parent_type public.entity_type;
  p_parent_election_id uuid;
  p_parent_constituency_id uuid;
  p_parent_election_round integer;
  p_child_type public.entity_type;
BEGIN
  -- Derive entity_type from the FK columns
  p_child_type := CASE
    WHEN NEW.candidate_id IS NOT NULL THEN 'candidate'::public.entity_type
    WHEN NEW.organization_id IS NOT NULL THEN 'organization'::public.entity_type
    WHEN NEW.faction_id IS NOT NULL THEN 'faction'::public.entity_type
    WHEN NEW.alliance_id IS NOT NULL THEN 'alliance'::public.entity_type
  END;

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
    p.election_round
  INTO p_parent_type, p_parent_election_id, p_parent_constituency_id, p_parent_election_round
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
-- Multi-tenant foundation: accounts and projects
--
-- All content tables reference projects via project_id FK with ON DELETE CASCADE.

CREATE TABLE public.accounts (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.projects (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id     uuid        NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name           text        NOT NULL,
  default_locale text        NOT NULL DEFAULT 'en',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
-- Elections, constituency groups, constituencies, and their join tables

CREATE TABLE public.elections (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name            jsonb,
  short_name      jsonb,
  info            jsonb,
  color           jsonb,
  image           jsonb,
  sort_order      integer,
  subtype         text,
  custom_data     jsonb,
  is_generated    boolean     DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  election_date       date,
  election_start_date date,
  election_type       text,
  multiple_rounds     boolean DEFAULT false,
  current_round       integer DEFAULT 1
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.elections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.constituency_groups (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name         jsonb,
  short_name   jsonb,
  info         jsonb,
  color        jsonb,
  image        jsonb,
  sort_order   integer,
  subtype      text,
  custom_data  jsonb,
  is_generated boolean     DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.constituency_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.constituencies (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name         jsonb,
  short_name   jsonb,
  info         jsonb,
  color        jsonb,
  image        jsonb,
  sort_order   integer,
  subtype      text,
  custom_data  jsonb,
  is_generated boolean     DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  keywords     jsonb,
  parent_id    uuid        REFERENCES public.constituencies(id) ON DELETE SET NULL
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.constituencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.constituency_group_constituencies (
  constituency_group_id uuid NOT NULL REFERENCES public.constituency_groups(id) ON DELETE CASCADE,
  constituency_id       uuid NOT NULL REFERENCES public.constituencies(id) ON DELETE CASCADE,
  PRIMARY KEY (constituency_group_id, constituency_id)
);

CREATE TABLE public.election_constituency_groups (
  election_id           uuid NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  constituency_group_id uuid NOT NULL REFERENCES public.constituency_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (election_id, constituency_group_id)
);
-- Entity tables: organizations, candidates, factions, alliances

CREATE TABLE public.organizations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  auth_user_id uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  name         jsonb,
  short_name   jsonb,
  info         jsonb,
  color        jsonb,
  image        jsonb,
  sort_order   integer,
  subtype      text,
  custom_data  jsonb,
  is_generated boolean     DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.candidates (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name            jsonb,
  short_name      jsonb,
  info            jsonb,
  color           jsonb,
  image           jsonb,
  sort_order      integer,
  subtype         text,
  custom_data     jsonb,
  is_generated    boolean     DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  first_name      text        NOT NULL,
  last_name       text        NOT NULL,
  organization_id uuid        REFERENCES public.organizations(id) ON DELETE SET NULL,
  auth_user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Terms-of-use acceptance tracking: nullable timestamptz
-- NULL = not yet accepted. Set by candidate when accepting ToU.
ALTER TABLE public.candidates ADD COLUMN terms_of_use_accepted timestamptz;

CREATE TABLE public.factions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name         jsonb,
  short_name   jsonb,
  info         jsonb,
  color        jsonb,
  image        jsonb,
  sort_order   integer,
  subtype      text,
  custom_data  jsonb,
  is_generated boolean     DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.factions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.alliances (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name         jsonb,
  short_name   jsonb,
  info         jsonb,
  color        jsonb,
  image        jsonb,
  sort_order   integer,
  subtype      text,
  custom_data  jsonb,
  is_generated boolean     DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.alliances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
-- Question categories and questions
--
-- Includes validation trigger: choice-type questions must have valid choices array.

CREATE TABLE public.question_categories (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name            jsonb,
  short_name      jsonb,
  info            jsonb,
  color           jsonb,
  image           jsonb,
  sort_order      integer,
  subtype         text,
  custom_data     jsonb,
  is_generated    boolean       DEFAULT false,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),
  category_type   public.category_type DEFAULT 'opinion',
  election_ids    jsonb,
  election_rounds jsonb,
  constituency_ids jsonb,
  entity_type     jsonb
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.question_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.questions (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name            jsonb,
  short_name      jsonb,
  info            jsonb,
  color           jsonb,
  image           jsonb,
  sort_order      integer,
  subtype         text,
  custom_data     jsonb,
  is_generated    boolean       DEFAULT false,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),
  type            public.question_type NOT NULL,
  category_id     uuid          NOT NULL REFERENCES public.question_categories(id),
  choices         jsonb,
  settings        jsonb,
  election_ids    jsonb,
  election_rounds jsonb,
  constituency_ids jsonb,
  entity_type     jsonb,
  allow_open      boolean       DEFAULT true,
  required        boolean       DEFAULT true
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

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
CREATE OR REPLACE FUNCTION public.validate_question_choices()
RETURNS TRIGGER AS $$
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
  BEFORE INSERT OR UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.validate_question_choices();
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
-- Parent-child nominations must share election_id, constituency_id, and
-- election_round (also enforced by trigger).

CREATE TABLE public.nominations (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name                 jsonb,
  short_name           jsonb,
  info                 jsonb,
  color                jsonb,
  image                jsonb,
  sort_order           integer,
  subtype              text,
  custom_data          jsonb,
  is_generated         boolean     DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  -- Entity FK columns: exactly one must be set
  candidate_id         uuid        REFERENCES public.candidates(id) ON DELETE CASCADE,
  organization_id      uuid        REFERENCES public.organizations(id) ON DELETE CASCADE,
  faction_id           uuid        REFERENCES public.factions(id) ON DELETE CASCADE,
  alliance_id          uuid        REFERENCES public.alliances(id) ON DELETE CASCADE,
  -- Generated entity_type from FK columns
  entity_type          public.entity_type NOT NULL GENERATED ALWAYS AS (
    CASE
      WHEN candidate_id IS NOT NULL THEN 'candidate'::public.entity_type
      WHEN organization_id IS NOT NULL THEN 'organization'::public.entity_type
      WHEN faction_id IS NOT NULL THEN 'faction'::public.entity_type
      WHEN alliance_id IS NOT NULL THEN 'alliance'::public.entity_type
    END
  ) STORED,
  -- Election context
  election_id          uuid        NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  constituency_id      uuid        NOT NULL REFERENCES public.constituencies(id) ON DELETE CASCADE,
  election_round       integer     DEFAULT 1,
  election_symbol      text,
  -- Nesting
  parent_nomination_id uuid        REFERENCES public.nominations(id) ON DELETE CASCADE,
  unconfirmed          boolean     DEFAULT false,
  -- Exactly one entity FK must be set
  CHECK (num_nonnulls(candidate_id, organization_id, faction_id, alliance_id) = 1)
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.nominations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER validate_nomination_before_insert_or_update
  BEFORE INSERT OR UPDATE ON public.nominations
  FOR EACH ROW EXECUTE FUNCTION public.validate_nomination();
-- JSONB answer storage
--
-- Stores answers as a JSONB column on candidates and organizations:
-- Record<QuestionId, {value: ..., info?: ...}>
--
-- Features:
--   1. Smart validation trigger: validates only changed answer keys on UPDATE
--   2. Question delete cascade: removes orphaned answer keys when a question is deleted
--   3. Question type change protection: prevents type changes that would invalidate existing answers

ALTER TABLE public.candidates ADD COLUMN answers jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.organizations ADD COLUMN answers jsonb DEFAULT '{}'::jsonb;

--------------------------------------------------------------------------------
-- JSONB answer validation trigger function (smart: validates only changed keys)
--
-- On INSERT: validates all keys
-- On UPDATE: validates only new or modified keys (skips unchanged)
-- Short-circuits if answers column is unchanged or empty
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_answers_jsonb()
RETURNS trigger AS $$
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
BEFORE INSERT OR UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.validate_answers_jsonb();

CREATE TRIGGER validate_answers_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.validate_answers_jsonb();

--------------------------------------------------------------------------------
-- Question delete cascade: remove orphaned answer keys from JSONB
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cascade_question_delete_to_jsonb_answers()
RETURNS trigger AS $$
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
AFTER DELETE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.cascade_question_delete_to_jsonb_answers();

--------------------------------------------------------------------------------
-- Question type/choices change protection
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_question_type_change()
RETURNS trigger AS $$
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
BEFORE UPDATE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.validate_question_type_change();
-- App settings: per-project application settings stored as JSONB
--
-- One row per project, enforced by UNIQUE constraint on project_id.
-- The app layer is responsible for parsing/validating the settings structure.

CREATE TABLE public.app_settings (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid        NOT NULL UNIQUE REFERENCES public.projects(id),
  settings   jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- App customization: per-project customization settings stored as JSONB
ALTER TABLE public.app_settings ADD COLUMN customization jsonb DEFAULT '{}'::jsonb;
-- Feedback table: anonymous voter feedback submissions
--
-- At least one of rating or description must be present (CHECK constraint).
-- No UPDATE policy -- feedback is immutable after insert.
-- RLS policies are in 302-rls.sql.
-- Rate limiting trigger prevents spam (5 requests per 5 minutes per IP).

--------------------------------------------------------------------------------
-- Private schema for rate limiting (not exposed via PostgREST)
--------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.feedback_rate_limits (
  ip_address   text        PRIMARY KEY,
  count        integer     NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

--------------------------------------------------------------------------------
-- Feedback table
--------------------------------------------------------------------------------
CREATE TABLE public.feedback (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  rating      integer,
  description text,
  date        timestamptz NOT NULL DEFAULT now(),
  url         text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feedback_rating_or_description CHECK (
    rating IS NOT NULL OR description IS NOT NULL
  )
);

--------------------------------------------------------------------------------
-- Rate limiting: 5 requests per 5-minute window per client IP
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_feedback_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
  BEFORE INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.check_feedback_rate_limit();
-- Admin jobs: job result persistence for admin features
--
-- Stores results of admin operations (e.g., QuestionInfoGeneration, ArgumentGeneration).
-- Records are immutable -- no UPDATE policy. Admins can INSERT new results and
-- SELECT/DELETE existing ones for their project.

CREATE TABLE public.admin_jobs (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  job_id          text          NOT NULL,
  job_type        text          NOT NULL,
  election_id     uuid          REFERENCES public.elections(id) ON DELETE SET NULL,
  author          text          NOT NULL,
  end_status      text          NOT NULL CHECK (end_status IN ('completed', 'failed', 'aborted')),
  start_time      timestamptz,
  end_time        timestamptz,
  input           jsonb,
  output          jsonb,
  messages        jsonb,
  metadata        jsonb,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.admin_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
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
CREATE INDEX IF NOT EXISTS idx_candidates_organization_id ON public.candidates (organization_id);
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
-- auth_user_id indexes (columns defined in 003-entities.sql)
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
-- Auth tables: user_roles, auth_user_id columns, published flags
--
-- Depends on: 001-tenancy.sql (accounts, projects)
--             003-entities.sql (candidates, organizations)
--             All voter-facing content tables

--------------------------------------------------------------------------------
-- user_roles table
--------------------------------------------------------------------------------
CREATE TABLE public.user_roles (
  id         uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       user_role_type NOT NULL,
  scope_type text           NOT NULL,  -- 'candidate', 'party', 'project', 'account', 'global'
  scope_id   uuid,                     -- NULL for super_admin (global scope)
  created_at timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, scope_type, scope_id)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles (user_id);

--------------------------------------------------------------------------------
-- RLS on user_roles — critical to prevent circular RLS with the auth hook
--------------------------------------------------------------------------------
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Auth admin must read roles (used by Custom Access Token Hook)
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.user_roles TO supabase_auth_admin;
CREATE POLICY "auth_admin_read_user_roles"
  ON public.user_roles FOR SELECT
  TO supabase_auth_admin
  USING (true);

-- Service role (Edge Functions) can manage roles
CREATE POLICY "service_role_manage_user_roles"
  ON public.user_roles FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Prevent regular users from accessing user_roles directly
REVOKE ALL ON TABLE public.user_roles FROM authenticated, anon, public;

--------------------------------------------------------------------------------
-- Published columns on voter-facing tables
-- (Using ALTER TABLE since the base tables are defined in earlier schema files)
--------------------------------------------------------------------------------
ALTER TABLE public.elections ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE public.candidates ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE public.organizations ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE public.questions ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE public.question_categories ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE public.nominations ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE public.constituencies ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE public.constituency_groups ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE public.factions ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE public.alliances ADD COLUMN published boolean NOT NULL DEFAULT false;

--------------------------------------------------------------------------------
-- Partial indexes on published for efficient anon RLS
-- (Must be in this file, after the columns are added above)
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_elections_published ON public.elections (published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_candidates_published ON public.candidates (published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_organizations_published ON public.organizations (published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_questions_published ON public.questions (published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_nominations_published ON public.nominations (published) WHERE published = true;
-- Auth hooks: Custom Access Token Hook and RLS helper functions
--
-- Depends on: 011-auth-tables.sql (user_roles table)
--             001-tenancy.sql (projects table for can_access_project)
--
-- Functions:
--   custom_access_token_hook(jsonb)  - Injects user_roles into JWT claims
--   has_role(text, text, uuid)       - Check if current user has a specific role
--   can_access_project(uuid)         - Check if current user can access a project
--   is_candidate_self(uuid)          - Check if current user owns a candidate row

--------------------------------------------------------------------------------
-- Custom Access Token Hook
-- Called by Supabase Auth on every token refresh/issue.
-- Reads user_roles and injects them into the JWT claims.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(p_event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_roles_claim jsonb;
BEGIN
  claims := p_event->'claims';

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'role', ur.role::text,
      'scope_type', ur.scope_type,
      'scope_id', ur.scope_id
    )
  ), '[]'::jsonb)
  INTO user_roles_claim
  FROM public.user_roles ur
  WHERE ur.user_id = (p_event->>'user_id')::uuid;

  claims := jsonb_set(claims, '{user_roles}', user_roles_claim);
  RETURN jsonb_set(p_event, '{claims}', claims);
END;
$$;

-- Grant execute to auth admin (required for the hook to work)
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

--------------------------------------------------------------------------------
-- has_role: check if the current JWT contains a specific role assignment
--
-- Usage in RLS policies:
--   has_role('super_admin')                             -- any super_admin role
--   has_role('project_admin', 'project', project_id)    -- project_admin for specific project
--   has_role('candidate', 'candidate', candidate_id)    -- candidate for specific record
--
-- SECURITY DEFINER with empty search_path to prevent search_path attacks.
-- Uses (SELECT auth.jwt()) to ensure a single evaluation per query.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(
  p_check_role text,
  p_check_scope_type text DEFAULT NULL,
  p_check_scope_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_roles jsonb;
  role_entry jsonb;
BEGIN
  user_roles := (SELECT auth.jwt() -> 'user_roles');
  IF user_roles IS NULL THEN RETURN false; END IF;

  FOR role_entry IN SELECT * FROM jsonb_array_elements(user_roles)
  LOOP
    IF role_entry->>'role' = p_check_role THEN
      -- super_admin has global access, no scope check needed
      IF p_check_role = 'super_admin' THEN RETURN true; END IF;
      -- If no scope filter requested, any matching role suffices
      IF p_check_scope_type IS NULL THEN RETURN true; END IF;
      -- Check exact scope match
      IF role_entry->>'scope_type' = p_check_scope_type
         AND role_entry->>'scope_id' = p_check_scope_id::text THEN
        RETURN true;
      END IF;
    END IF;
  END LOOP;

  RETURN false;
END;
$$;

--------------------------------------------------------------------------------
-- can_access_project: check if current user can access a project
--
-- Returns true if user has:
--   - super_admin role (any scope)
--   - project_admin role scoped to this project
--   - account_admin role scoped to the project's account
--
-- SECURITY DEFINER with empty search_path.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_access_project(p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_roles jsonb;
  role_entry jsonb;
  p_account_id uuid;
BEGIN
  user_roles := (SELECT auth.jwt() -> 'user_roles');
  IF user_roles IS NULL THEN RETURN false; END IF;

  FOR role_entry IN SELECT * FROM jsonb_array_elements(user_roles)
  LOOP
    IF role_entry->>'role' = 'super_admin' THEN RETURN true; END IF;

    IF role_entry->>'role' = 'project_admin'
       AND role_entry->>'scope_type' = 'project'
       AND role_entry->>'scope_id' = p_project_id::text THEN
      RETURN true;
    END IF;

    IF role_entry->>'role' = 'account_admin' THEN
      SELECT account_id INTO p_account_id FROM public.projects WHERE id = p_project_id;
      IF role_entry->>'scope_type' = 'account'
         AND role_entry->>'scope_id' = p_account_id::text THEN
        RETURN true;
      END IF;
    END IF;
  END LOOP;

  RETURN false;
END;
$$;

--------------------------------------------------------------------------------
-- is_candidate_self: check if the current user owns a candidate row
--
-- Usage: is_candidate_self(candidates.auth_user_id) in RLS policies
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_candidate_self(p_row_auth_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p_row_auth_user_id = (SELECT auth.uid());
$$;
-- Row Level Security: role-based access control policies
--
-- Replaces deny-all placeholders with real per-operation policies.
-- Uses helper functions from 012-auth-hooks.sql:
--   can_access_project(project_id)  - project_admin, account_admin, super_admin
--   has_role(role, scope_type, scope_id) - check specific role assignment
--   is_candidate_self(auth_user_id) - candidate owns the row
--
-- Policy rules:
--   SELECT  = USING only
--   INSERT  = WITH CHECK only
--   UPDATE  = USING + WITH CHECK
--   DELETE  = USING only
--   Always specify TO anon or TO authenticated
--   Always use (SELECT auth.uid()) and (SELECT auth.jwt()) for optimizer caching

-- =====================================================================
-- accounts (no project_id, no published flag)
-- =====================================================================
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "accounts_deny_all" ON public.accounts;

-- Authenticated: account_admin for their account or super_admin
CREATE POLICY "authenticated_select_accounts" ON public.accounts FOR SELECT TO authenticated
  USING (
    (SELECT has_role('account_admin', 'account', id))
    OR (SELECT has_role('super_admin'))
  );

-- Super admin only: insert
CREATE POLICY "admin_insert_accounts" ON public.accounts FOR INSERT TO authenticated
  WITH CHECK ((SELECT has_role('super_admin')));

-- Super admin only: update
CREATE POLICY "admin_update_accounts" ON public.accounts FOR UPDATE TO authenticated
  USING ((SELECT has_role('super_admin')))
  WITH CHECK ((SELECT has_role('super_admin')));

-- Super admin only: delete
CREATE POLICY "admin_delete_accounts" ON public.accounts FOR DELETE TO authenticated
  USING ((SELECT has_role('super_admin')));

-- =====================================================================
-- projects (has account_id, no published flag)
-- =====================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_deny_all" ON public.projects;

-- Authenticated: project access or account_admin or super_admin
CREATE POLICY "authenticated_select_projects" ON public.projects FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(id))
    OR (SELECT has_role('account_admin', 'account', account_id))
    OR (SELECT has_role('super_admin'))
  );

-- Insert: account_admin for the account or super_admin
CREATE POLICY "admin_insert_projects" ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT has_role('account_admin', 'account', account_id))
    OR (SELECT has_role('super_admin'))
  );

-- Update: project access (project_admin, account_admin, super_admin)
CREATE POLICY "admin_update_projects" ON public.projects FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(id)))
  WITH CHECK ((SELECT can_access_project(id)));

-- Delete: project access (project_admin, account_admin, super_admin)
CREATE POLICY "admin_delete_projects" ON public.projects FOR DELETE TO authenticated
  USING ((SELECT can_access_project(id)));

-- =====================================================================
-- elections (project_id, published)
-- =====================================================================
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "elections_deny_all" ON public.elections;

CREATE POLICY "anon_select_elections" ON public.elections FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_elections" ON public.elections FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_elections" ON public.elections FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_elections" ON public.elections FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_elections" ON public.elections FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- constituency_groups (project_id, published)
-- =====================================================================
ALTER TABLE public.constituency_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "constituency_groups_deny_all" ON public.constituency_groups;

CREATE POLICY "anon_select_constituency_groups" ON public.constituency_groups FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_constituency_groups" ON public.constituency_groups FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_constituency_groups" ON public.constituency_groups FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_constituency_groups" ON public.constituency_groups FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_constituency_groups" ON public.constituency_groups FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- constituencies (project_id, published)
-- =====================================================================
ALTER TABLE public.constituencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "constituencies_deny_all" ON public.constituencies;

CREATE POLICY "anon_select_constituencies" ON public.constituencies FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_constituencies" ON public.constituencies FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_constituencies" ON public.constituencies FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_constituencies" ON public.constituencies FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_constituencies" ON public.constituencies FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- constituency_group_constituencies (join table, no project_id)
-- =====================================================================
ALTER TABLE public.constituency_group_constituencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "constituency_group_constituencies_deny_all" ON public.constituency_group_constituencies;

-- Anon: structural data, always readable
CREATE POLICY "anon_select_constituency_group_constituencies" ON public.constituency_group_constituencies FOR SELECT TO anon
  USING (true);

-- Authenticated: always readable
CREATE POLICY "authenticated_select_constituency_group_constituencies" ON public.constituency_group_constituencies FOR SELECT TO authenticated
  USING (true);

-- Admin insert: check access via parent constituency_group
CREATE POLICY "admin_insert_constituency_group_constituencies" ON public.constituency_group_constituencies FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.constituency_groups cg
      WHERE cg.id = constituency_group_id
        AND (SELECT can_access_project(cg.project_id))
    )
  );

-- Admin delete: check access via parent constituency_group
CREATE POLICY "admin_delete_constituency_group_constituencies" ON public.constituency_group_constituencies FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.constituency_groups cg
      WHERE cg.id = constituency_group_id
        AND (SELECT can_access_project(cg.project_id))
    )
  );

-- =====================================================================
-- election_constituency_groups (join table, no project_id)
-- =====================================================================
ALTER TABLE public.election_constituency_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "election_constituency_groups_deny_all" ON public.election_constituency_groups;

-- Anon: structural data, always readable
CREATE POLICY "anon_select_election_constituency_groups" ON public.election_constituency_groups FOR SELECT TO anon
  USING (true);

-- Authenticated: always readable
CREATE POLICY "authenticated_select_election_constituency_groups" ON public.election_constituency_groups FOR SELECT TO authenticated
  USING (true);

-- Admin insert: check access via parent election
CREATE POLICY "admin_insert_election_constituency_groups" ON public.election_constituency_groups FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.elections e
      WHERE e.id = election_id
        AND (SELECT can_access_project(e.project_id))
    )
  );

-- Admin delete: check access via parent election
CREATE POLICY "admin_delete_election_constituency_groups" ON public.election_constituency_groups FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.elections e
      WHERE e.id = election_id
        AND (SELECT can_access_project(e.project_id))
    )
  );

-- =====================================================================
-- organizations (project_id, published, auth_user_id)
-- =====================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "organizations_deny_all" ON public.organizations;

CREATE POLICY "anon_select_organizations" ON public.organizations FOR SELECT TO anon
  USING (published = true);

-- Authenticated: project access, own record, or published
CREATE POLICY "authenticated_select_organizations" ON public.organizations FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR auth_user_id = (SELECT auth.uid())
    OR (SELECT has_role('party', 'party', id))
    OR published = true
  );

-- Admin insert
CREATE POLICY "admin_insert_organizations" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

-- Party admin self-update: party role holder can update their party
CREATE POLICY "party_update_own_organizations" ON public.organizations FOR UPDATE TO authenticated
  USING (
    auth_user_id = (SELECT auth.uid())
    OR (SELECT has_role('party', 'party', id))
  )
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())
    OR (SELECT has_role('party', 'party', id))
  );

-- Admin update
CREATE POLICY "admin_update_organizations" ON public.organizations FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

-- Admin delete
CREATE POLICY "admin_delete_organizations" ON public.organizations FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- candidates (project_id, published, auth_user_id)
-- Answers stored as JSONB column -- covered by these policies.
-- =====================================================================
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "candidates_deny_all" ON public.candidates;

CREATE POLICY "anon_select_candidates" ON public.candidates FOR SELECT TO anon
  USING (published = true);

-- Authenticated: project access, own record, party admin for their party's candidates, or published
CREATE POLICY "authenticated_select_candidates" ON public.candidates FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR auth_user_id = (SELECT auth.uid())
    OR (SELECT has_role('party', 'party', organization_id))
    OR published = true
  );

-- Admin insert
CREATE POLICY "admin_insert_candidates" ON public.candidates FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

-- Candidate self-update: can update own record
-- Structural field protection (project_id, auth_user_id, organization_id) enforced
-- via column-level REVOKE in 013-auth-rls.sql
CREATE POLICY "candidate_update_own" ON public.candidates FOR UPDATE TO authenticated
  USING (auth_user_id = (SELECT auth.uid()))
  WITH CHECK (auth_user_id = (SELECT auth.uid()));

-- Admin update
CREATE POLICY "admin_update_candidates" ON public.candidates FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

-- Admin delete
CREATE POLICY "admin_delete_candidates" ON public.candidates FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- factions (project_id, published)
-- =====================================================================
ALTER TABLE public.factions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "factions_deny_all" ON public.factions;

CREATE POLICY "anon_select_factions" ON public.factions FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_factions" ON public.factions FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_factions" ON public.factions FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_factions" ON public.factions FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_factions" ON public.factions FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- alliances (project_id, published)
-- =====================================================================
ALTER TABLE public.alliances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "alliances_deny_all" ON public.alliances;

CREATE POLICY "anon_select_alliances" ON public.alliances FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_alliances" ON public.alliances FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_alliances" ON public.alliances FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_alliances" ON public.alliances FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_alliances" ON public.alliances FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- question_categories (project_id, published)
-- =====================================================================
ALTER TABLE public.question_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "question_categories_deny_all" ON public.question_categories;

CREATE POLICY "anon_select_question_categories" ON public.question_categories FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_question_categories" ON public.question_categories FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_question_categories" ON public.question_categories FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_question_categories" ON public.question_categories FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_question_categories" ON public.question_categories FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- questions (project_id, published)
-- =====================================================================
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "questions_deny_all" ON public.questions;

CREATE POLICY "anon_select_questions" ON public.questions FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_questions" ON public.questions FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_questions" ON public.questions FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_questions" ON public.questions FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_questions" ON public.questions FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- nominations (project_id, published)
-- =====================================================================
ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nominations_deny_all" ON public.nominations;

CREATE POLICY "anon_select_nominations" ON public.nominations FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_nominations" ON public.nominations FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_nominations" ON public.nominations FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_nominations" ON public.nominations FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_nominations" ON public.nominations FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- app_settings (project_id, no published flag -- anon needs read for voter app)
-- =====================================================================
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_settings_deny_all" ON public.app_settings;

-- Anon: always readable (voter app needs settings)
CREATE POLICY "anon_select_app_settings" ON public.app_settings FOR SELECT TO anon
  USING (true);

-- Authenticated: always readable
CREATE POLICY "authenticated_select_app_settings" ON public.app_settings FOR SELECT TO authenticated
  USING (true);

-- Admin CRUD
CREATE POLICY "admin_insert_app_settings" ON public.app_settings FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_app_settings" ON public.app_settings FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_app_settings" ON public.app_settings FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- feedback (anon insert-only; admin select/delete)
-- =====================================================================
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anonymous: insert only (rate limiting trigger handles spam prevention)
CREATE POLICY "anon_insert_feedback" ON public.feedback
  FOR INSERT TO anon
  WITH CHECK (true);

-- Admin: read feedback for their project
CREATE POLICY "admin_select_feedback" ON public.feedback
  FOR SELECT TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- Admin: delete feedback for their project
CREATE POLICY "admin_delete_feedback" ON public.feedback
  FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- No UPDATE policy (feedback is immutable after insert -- locked decision)
-- No anon SELECT policy (voters cannot read their own or others' feedback)

-- =====================================================================
-- admin_jobs (project_id, no published flag -- admin-only)
-- =====================================================================
ALTER TABLE public.admin_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_admin_jobs" ON public.admin_jobs
  FOR SELECT TO authenticated
  USING ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_insert_admin_jobs" ON public.admin_jobs
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_admin_jobs" ON public.admin_jobs
  FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));
-- Column-level protections for structural fields
--
-- Prevents authenticated users (candidates, party admins) from modifying
-- structural columns via PostgREST. Admin operations that need to update
-- these columns use service_role (Edge Functions), which bypasses column-level
-- grants entirely.
--
-- Approach: REVOKE table-level UPDATE, then GRANT UPDATE only on allowed columns.
-- (Column-level REVOKE is ineffective when table-level UPDATE exists.)
--
-- Depends on: 003-entities.sql (candidates, organizations tables)
--             006-answers-jsonb.sql (answers column)
--             011-auth-tables.sql (published column)
--             010-rls.sql (RLS policies already applied)

-- =====================================================================
-- candidates: restrict updatable columns
-- =====================================================================
-- Protected (admin-only) columns:
--   project_id      - determines project tenancy
--   auth_user_id    - links candidate to auth user, set during invite/registration
--   organization_id - party assignment
--   published       - publication status, admin-controlled
--   id              - primary key, immutable
--   is_generated    - system flag for mock/generated data
--
-- Allowed columns for candidates (self-edit):
--   name, short_name, info, color, image, sort_order, subtype,
--   custom_data, first_name, last_name, answers, created_at, updated_at

REVOKE UPDATE ON public.candidates FROM authenticated;
GRANT UPDATE (
  name, short_name, info, color, image, sort_order, subtype,
  custom_data, first_name, last_name, answers, created_at, updated_at,
  terms_of_use_accepted
) ON public.candidates TO authenticated;

-- =====================================================================
-- organizations: restrict updatable columns
-- =====================================================================
-- Protected (admin-only) columns:
--   project_id   - determines project tenancy
--   auth_user_id - links organization to auth user
--   published    - publication status, admin-controlled
--   id           - primary key, immutable
--   is_generated - system flag for mock/generated data
--
-- Allowed columns for party admins (self-edit):
--   name, short_name, info, color, image, sort_order, subtype,
--   custom_data, answers, created_at, updated_at

REVOKE UPDATE ON public.organizations FROM authenticated;
GRANT UPDATE (
  name, short_name, info, color, image, sort_order, subtype,
  custom_data, answers, created_at, updated_at
) ON public.organizations TO authenticated;
-- Storage RLS policies, cleanup triggers, and helper functions
--
-- Depends on:
--   012-auth-hooks.sql  (can_access_project, has_role)
--   011-auth-tables.sql (published columns on entity tables)
--   003-entities.sql    (candidates, organizations with auth_user_id)
--   002-elections.sql   (elections, constituency_groups, constituencies)
--   004-questions.sql   (question_categories, questions)
--   005-nominations.sql (nominations)
--
-- Provides:
--   pg_net extension for async HTTP triggers
--   is_storage_entity_published()  - check published status by storage path
--   delete_storage_object()        - delete a file via Storage API (pg_net)
--   cleanup_entity_storage_files() - AFTER DELETE trigger for entity tables
--   cleanup_old_image_file()       - BEFORE UPDATE trigger for image columns
--   RLS policies on storage.objects for public-assets and private-assets buckets

--------------------------------------------------------------------------------
-- pg_net extension (async HTTP from triggers)
--------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

--------------------------------------------------------------------------------
-- storage_config: configuration table for storage cleanup triggers
--
-- Stores supabase_url and service_role_key needed by pg_net triggers to call
-- the Storage API. Seeded in seed.sql with local dev defaults.
-- In production, update values for the actual Supabase URL and service role key.
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.storage_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);

-- Only service_role and postgres can access storage_config (not exposed via API)
ALTER TABLE public.storage_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.storage_config FROM anon, authenticated, public;
GRANT SELECT ON TABLE public.storage_config TO service_role;

--------------------------------------------------------------------------------
-- is_storage_entity_published: check if the entity owning a storage path is published
--
-- Path format: {project_id}/{entity_type}/{entity_id}/filename.ext
-- entity_type_segment maps directly to the table name.
-- Special cases:
--   'project' -> project-level files, always accessible
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_storage_entity_published(p_entity_type_segment text, p_entity_id_segment text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_published boolean;
BEGIN
  -- Project-level files are always accessible
  IF p_entity_type_segment = 'project' THEN
    RETURN true;
  END IF;

  -- For all other entity types, check published = true on the owning entity
  EXECUTE format(
    'SELECT published FROM public.%I WHERE id = $1',
    p_entity_type_segment
  ) INTO is_published USING p_entity_id_segment::uuid;

  -- If entity not found, deny access
  RETURN COALESCE(is_published, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- =====================================================================
-- Storage RLS policies on storage.objects
--
-- Path format: {project_id}/{entity_type}/{entity_id}/filename.ext
--   (storage.foldername(storage.objects.name))[1] = project_id
--   (storage.foldername(storage.objects.name))[2] = entity_type
--   (storage.foldername(storage.objects.name))[3] = entity_id
--
-- IMPORTANT: Always use storage.objects.name (not bare 'name') to avoid
-- ambiguity with entity tables that have a jsonb 'name' column.
--
-- Uses (SELECT auth.uid()) and (SELECT auth.jwt()) for optimizer caching,
-- consistent with the existing 79 content table RLS policies.
-- =====================================================================

-- =====================================================================
-- public-assets bucket: SELECT policies
-- =====================================================================

-- Anon: can read files for published entities only
CREATE POLICY "anon_select_public_assets" ON storage.objects FOR SELECT TO anon
  USING (
    bucket_id = 'public-assets'
    AND is_storage_entity_published(
      (storage.foldername(storage.objects.name))[2],
      (storage.foldername(storage.objects.name))[3]
    )
  );

-- Authenticated: can read published entity files, own entity files, or admin project files
CREATE POLICY "authenticated_select_public_assets" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'public-assets'
    AND (
      -- Published entities are readable by all authenticated users
      is_storage_entity_published(
        (storage.foldername(storage.objects.name))[2],
        (storage.foldername(storage.objects.name))[3]
      )
      -- Admins can always see project files
      OR (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
      -- Entity owners can see their own files (candidates and organizations have auth_user_id)
      OR (
        (storage.foldername(storage.objects.name))[2] IN ('candidates', 'organizations')
        AND EXISTS (
          SELECT 1 FROM public.candidates c
          WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
            AND c.auth_user_id = (SELECT auth.uid())
          UNION ALL
          SELECT 1 FROM public.organizations o
          WHERE o.id = (storage.foldername(storage.objects.name))[3]::uuid
            AND o.auth_user_id = (SELECT auth.uid())
        )
      )
    )
  );

-- =====================================================================
-- private-assets bucket: SELECT policies
-- =====================================================================

-- Authenticated: can read own entity files or admin project files
CREATE POLICY "authenticated_select_private_assets" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'private-assets'
    AND (
      -- Admins can see all project files
      (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
      -- Entity owners can see their own files
      OR (
        (storage.foldername(storage.objects.name))[2] IN ('candidates', 'organizations')
        AND EXISTS (
          SELECT 1 FROM public.candidates c
          WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
            AND c.auth_user_id = (SELECT auth.uid())
          UNION ALL
          SELECT 1 FROM public.organizations o
          WHERE o.id = (storage.foldername(storage.objects.name))[3]::uuid
            AND o.auth_user_id = (SELECT auth.uid())
        )
      )
    )
  );

-- =====================================================================
-- public-assets bucket: INSERT policies
-- =====================================================================

-- Candidates can upload to their own entity folder
CREATE POLICY "candidate_insert_public_assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'public-assets'
    AND (storage.foldername(storage.objects.name))[2] = 'candidates'
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
        AND c.auth_user_id = (SELECT auth.uid())
    )
  );

-- Admins can upload to any entity folder in their project
CREATE POLICY "admin_insert_public_assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'public-assets'
    AND (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
  );

-- =====================================================================
-- private-assets bucket: INSERT policies
-- =====================================================================

-- Candidates can upload to their own entity folder
CREATE POLICY "candidate_insert_private_assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'private-assets'
    AND (storage.foldername(storage.objects.name))[2] = 'candidates'
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
        AND c.auth_user_id = (SELECT auth.uid())
    )
  );

-- Admins can upload to any entity folder in their project
CREATE POLICY "admin_insert_private_assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'private-assets'
    AND (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
  );

-- =====================================================================
-- public-assets bucket: UPDATE policies
-- =====================================================================

-- Candidates can update their own entity files
CREATE POLICY "candidate_update_public_assets" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'public-assets'
    AND (storage.foldername(storage.objects.name))[2] = 'candidates'
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
        AND c.auth_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    bucket_id = 'public-assets'
    AND (storage.foldername(storage.objects.name))[2] = 'candidates'
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
        AND c.auth_user_id = (SELECT auth.uid())
    )
  );

-- Admins can update any file in their project
CREATE POLICY "admin_update_public_assets" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'public-assets'
    AND (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
  )
  WITH CHECK (
    bucket_id = 'public-assets'
    AND (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
  );

-- =====================================================================
-- private-assets bucket: UPDATE policies
-- =====================================================================

-- Candidates can update their own entity files
CREATE POLICY "candidate_update_private_assets" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'private-assets'
    AND (storage.foldername(storage.objects.name))[2] = 'candidates'
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
        AND c.auth_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    bucket_id = 'private-assets'
    AND (storage.foldername(storage.objects.name))[2] = 'candidates'
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
        AND c.auth_user_id = (SELECT auth.uid())
    )
  );

-- Admins can update any file in their project
CREATE POLICY "admin_update_private_assets" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'private-assets'
    AND (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
  )
  WITH CHECK (
    bucket_id = 'private-assets'
    AND (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
  );

-- =====================================================================
-- public-assets bucket: DELETE policies
-- =====================================================================

-- Candidates can delete their own entity files
CREATE POLICY "candidate_delete_public_assets" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'public-assets'
    AND (storage.foldername(storage.objects.name))[2] = 'candidates'
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
        AND c.auth_user_id = (SELECT auth.uid())
    )
  );

-- Admins can delete any file in their project
CREATE POLICY "admin_delete_public_assets" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'public-assets'
    AND (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
  );

-- =====================================================================
-- private-assets bucket: DELETE policies
-- =====================================================================

-- Candidates can delete their own entity files
CREATE POLICY "candidate_delete_private_assets" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'private-assets'
    AND (storage.foldername(storage.objects.name))[2] = 'candidates'
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = (storage.foldername(storage.objects.name))[3]::uuid
        AND c.auth_user_id = (SELECT auth.uid())
    )
  );

-- Admins can delete any file in their project
CREATE POLICY "admin_delete_private_assets" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'private-assets'
    AND (SELECT can_access_project((storage.foldername(storage.objects.name))[1]::uuid))
  );

-- =====================================================================
-- Storage file deletion helper (via pg_net async HTTP)
-- =====================================================================

--------------------------------------------------------------------------------
-- delete_storage_object: delete files via the Storage API
--
-- Uses pg_net for async HTTP. Requires app.supabase_url and app.service_role_key
-- custom settings (set in seed.sql for local dev, Vault or env vars in production).
-- Gracefully degrades (logs WARNING) if settings are not configured.
-- Accepts either a single file path or a directory prefix (ending with /).
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_storage_object(p_bucket text, p_file_path text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  base_url text;
  service_key text;
BEGIN
  -- Read configuration from storage_config table
  SELECT value INTO base_url FROM public.storage_config WHERE key = 'supabase_url';
  SELECT value INTO service_key FROM public.storage_config WHERE key = 'service_role_key';

  IF base_url IS NULL OR service_key IS NULL THEN
    RAISE WARNING 'Storage cleanup skipped: missing supabase_url or service_role_key in storage_config';
    RETURN;
  END IF;

  -- Use pg_net async HTTP POST to the Storage API batch delete endpoint
  -- The endpoint accepts a JSON body with a "prefixes" array
  PERFORM net.http_post(
    url := base_url || '/storage/v1/object/' || p_bucket,
    body := jsonb_build_object('prefixes', jsonb_build_array(p_file_path)),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_key,
      'Content-Type', 'application/json'
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Storage cleanup failed for %/%: %', p_bucket, p_file_path, SQLERRM;
END;
$$;

-- =====================================================================
-- Entity deletion cleanup trigger
-- =====================================================================

--------------------------------------------------------------------------------
-- cleanup_entity_storage_files: AFTER DELETE trigger
--
-- When an entity row is deleted, removes all storage files under its path prefix
-- in both public-assets and private-assets buckets.
-- Uses pg_net (via delete_storage_object) for async, non-blocking cleanup.
-- pg_net requests only fire after the transaction commits.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_entity_storage_files()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  path_prefix text;
BEGIN
  -- Construct path prefix: {project_id}/{entity_type}/{entity_id}/
  -- TG_TABLE_NAME gives the table name which matches the entity_type path segment
  path_prefix := OLD.project_id || '/' || TG_TABLE_NAME || '/' || OLD.id || '/';

  -- Clean up files in both buckets
  PERFORM public.delete_storage_object('public-assets', path_prefix);
  PERFORM public.delete_storage_object('private-assets', path_prefix);

  RETURN OLD;
END;
$$;

-- Attach entity deletion cleanup trigger to all entity tables with project_id
CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON public.factions
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON public.alliances
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON public.elections
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON public.constituencies
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON public.constituency_groups
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON public.nominations
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON public.question_categories
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_storage_files();

-- =====================================================================
-- Image column update cleanup trigger
-- =====================================================================

--------------------------------------------------------------------------------
-- cleanup_old_image_file: BEFORE UPDATE trigger
--
-- When an entity's image JSONB column is updated, deletes the old file(s)
-- from storage. Checks both 'path' and 'pathDark' keys in the old image.
-- Only fires if the image column actually changed.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_old_image_file()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  old_path text;
  old_path_dark text;
BEGIN
  -- Only act if the image column actually changed
  IF OLD.image IS NOT DISTINCT FROM NEW.image THEN
    RETURN NEW;
  END IF;

  -- Delete old image path if it existed
  IF OLD.image IS NOT NULL AND OLD.image ? 'path' THEN
    old_path := OLD.image ->> 'path';
    IF old_path IS NOT NULL AND old_path != '' THEN
      PERFORM public.delete_storage_object('public-assets', old_path);
    END IF;
  END IF;

  -- Delete old dark mode image path if it existed
  IF OLD.image IS NOT NULL AND OLD.image ? 'pathDark' THEN
    old_path_dark := OLD.image ->> 'pathDark';
    IF old_path_dark IS NOT NULL AND old_path_dark != '' THEN
      PERFORM public.delete_storage_object('public-assets', old_path_dark);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach image cleanup trigger to all entity tables with an image column
CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON public.factions
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON public.alliances
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON public.elections
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON public.constituencies
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON public.constituency_groups
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON public.nominations
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON public.question_categories
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_old_image_file();

-- Note: supabase_url and service_role_key values must be seeded in the
-- storage_config table. See seed.sql for the default local dev values.
-- In production, update the storage_config table with actual values.
-- External ID columns on all content tables
--
-- Adds a nullable external_id column to each content table with a composite
-- unique index on (project_id, external_id) -- scoped uniqueness per project.
-- An immutability trigger prevents changing external_id once set (NULL -> value
-- is allowed; value -> different value is blocked).
--
-- Used by bulk_import() for externalId-based upsert matching.
-- Depends on: 002-elections.sql, 003-entities.sql, 004-questions.sql,
--             005-nominations.sql, 007-app-settings.sql

--------------------------------------------------------------------------------
-- external_id columns + composite unique indexes
--------------------------------------------------------------------------------

ALTER TABLE public.elections ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_elections_external_id
  ON public.elections (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE public.constituency_groups ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_constituency_groups_external_id
  ON public.constituency_groups (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE public.constituencies ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_constituencies_external_id
  ON public.constituencies (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE public.candidates ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_candidates_external_id
  ON public.candidates (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE public.organizations ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_organizations_external_id
  ON public.organizations (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE public.factions ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_factions_external_id
  ON public.factions (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE public.alliances ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_alliances_external_id
  ON public.alliances (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE public.nominations ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_nominations_external_id
  ON public.nominations (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE public.questions ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_questions_external_id
  ON public.questions (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE public.question_categories ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_question_categories_external_id
  ON public.question_categories (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE public.app_settings ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_app_settings_external_id
  ON public.app_settings (project_id, external_id) WHERE external_id IS NOT NULL;

--------------------------------------------------------------------------------
-- Immutability trigger: prevent changing external_id once set
--
-- NULL -> value: allowed (first assignment)
-- value -> same value: allowed (no-op)
-- value -> different value: blocked (raises exception)
-- value -> NULL: blocked (raises exception)
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION enforce_external_id_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.external_id IS NOT NULL AND OLD.external_id IS DISTINCT FROM NEW.external_id THEN
    RAISE EXCEPTION 'external_id cannot be changed once set (current: %, attempted: %)',
      OLD.external_id, NEW.external_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON public.elections
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON public.constituency_groups
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON public.constituencies
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON public.factions
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON public.alliances
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON public.nominations
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON public.question_categories
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();
-- Bulk import and delete RPC functions
--
-- Provides transactional bulk data management operations:
--   bulk_import(data jsonb)  - upsert records by external_id with relationship resolution
--   bulk_delete(data jsonb)  - delete records by prefix, UUID list, or external_id list
--
-- Both functions are SECURITY INVOKER so admin RLS policies are enforced.
-- PostgREST automatically wraps RPC calls in transactions, providing
-- all-or-nothing guarantees without explicit transaction management.
--
-- Depends on: 015-external-id.sql (external_id columns + unique indexes)
--             010-rls.sql (admin RLS policies via can_access_project)

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
CREATE OR REPLACE FUNCTION public.resolve_external_ref(
  p_ref jsonb,
  p_target_table text,
  p_project_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
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
-- Relationship mapping defines which JSON keys map to FK columns and
-- which target tables they reference.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._bulk_upsert_record(
  p_table_name text,
  p_item jsonb,
  p_project_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  -- Relationship mappings: json_key -> (fk_column, target_table)
  rel_key text;
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
    WHEN 'candidates' THEN
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

  -- Build and execute upsert SQL
  -- ON CONFLICT uses the partial unique index on (project_id, external_id) WHERE external_id IS NOT NULL
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
-- Input format:
-- {
--   "elections": [{"external_id": "election-2024", "name": {...}, ...}],
--   "candidates": [{"external_id": "cand-001", "organization": {"external_id": "party-sdp"}, ...}],
--   "nominations": [{"external_id": "nom-001", "candidate": {"external_id": "cand-001"}, ...}]
-- }
--
-- Each item MUST include:
--   - "external_id": unique identifier within the project
--   - "project_id": UUID of the target project (for RLS enforcement)
--
-- Relationship fields (e.g., "organization", "election") are expressed as
-- {"external_id": "..."} objects and resolved to UUIDs internally.
--
-- Returns: {"elections": {"created": N, "updated": M}, ...}
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bulk_import(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
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
-- Input format:
-- {
--   "project_id": "uuid",
--   "collections": {
--     "elections": {"prefix": "import-2024-"},
--     "candidates": {"ids": ["uuid-1", "uuid-2"]},
--     "nominations": {"external_ids": ["nom-1", "nom-2"]}
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
CREATE OR REPLACE FUNCTION public.bulk_delete(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
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
-- Functions are SECURITY INVOKER, so RLS policies are enforced even though
-- the authenticated role can call them. Only users with can_access_project()
-- (admins) will be able to successfully import/delete data.
--------------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.bulk_import(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_delete(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_external_ref(jsonb, text, uuid) TO authenticated;
-- Email helper functions for transactional email template variable resolution
--
-- Depends on: 003-entities.sql (candidates, organizations)
--             005-nominations.sql (nominations)
--             002-elections.sql (elections, constituencies)
--             011-auth-tables.sql (user_roles)
--             000-functions.sql (get_localized)

--------------------------------------------------------------------------------
-- resolve_email_variables: resolve template variables for a set of users
--
-- For each user_id, looks up their entity context via user_roles and resolves
-- template variable paths like "candidate.first_name", "organization.name",
-- "nomination.constituency.name", "nomination.election.name".
--
-- Returns a row per user with their email, preferred_locale, and a flat JSONB
-- object of resolved variables.
--
-- SECURITY DEFINER: needs to read auth.users which is not accessible to
-- regular authenticated users.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_email_variables(
  p_user_ids uuid[],
  p_template_body text DEFAULT '',
  p_template_subject text DEFAULT ''
)
RETURNS TABLE (
  user_id uuid,
  email text,
  preferred_locale text,
  variables jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid;
  u_email text;
  u_locale text;
  u_role public.user_role_type;
  u_scope_id uuid;
  vars jsonb;
  -- Candidate fields
  c_first_name text;
  c_last_name text;
  c_org_id uuid;
  -- Organization fields
  org_name text;
  -- Nomination fields
  nom_constituency_name text;
  nom_election_name text;
BEGIN
  FOREACH uid IN ARRAY p_user_ids
  LOOP
    -- Get user email and preferred locale from auth.users
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

    -- Initialize empty variables
    vars := '{}'::jsonb;

    -- Get the first relevant role (candidate or party) for this user
    SELECT ur.role, ur.scope_id
    INTO u_role, u_scope_id
    FROM public.user_roles ur
    WHERE ur.user_id = uid
      AND ur.role IN ('candidate', 'party')
    ORDER BY
      CASE ur.role
        WHEN 'candidate' THEN 1
        WHEN 'party' THEN 2
      END
    LIMIT 1;

    IF u_role = 'candidate' AND u_scope_id IS NOT NULL THEN
      -- Resolve candidate fields
      SELECT c.first_name, c.last_name, c.organization_id
      INTO c_first_name, c_last_name, c_org_id
      FROM public.candidates c
      WHERE c.id = u_scope_id;

      IF c_first_name IS NOT NULL THEN
        vars := vars || jsonb_build_object(
          'candidate.first_name', c_first_name,
          'candidate.last_name', c_last_name
        );
      END IF;

      -- Resolve organization name for this candidate
      IF c_org_id IS NOT NULL THEN
        SELECT public.get_localized(o.name, u_locale)
        INTO org_name
        FROM public.organizations o
        WHERE o.id = c_org_id;

        IF org_name IS NOT NULL THEN
          vars := vars || jsonb_build_object('organization.name', org_name);
        END IF;
      END IF;

      -- Resolve nomination context (constituency + election) for this candidate
      -- Takes the first nomination found for this candidate
      SELECT
        public.get_localized(con.name, u_locale),
        public.get_localized(el.name, u_locale)
      INTO nom_constituency_name, nom_election_name
      FROM public.nominations n
      JOIN public.constituencies con ON con.id = n.constituency_id
      JOIN public.elections el ON el.id = n.election_id
      WHERE n.candidate_id = u_scope_id
      LIMIT 1;

      IF nom_constituency_name IS NOT NULL THEN
        vars := vars || jsonb_build_object('nomination.constituency.name', nom_constituency_name);
      END IF;

      IF nom_election_name IS NOT NULL THEN
        vars := vars || jsonb_build_object('nomination.election.name', nom_election_name);
      END IF;

    ELSIF u_role = 'party' AND u_scope_id IS NOT NULL THEN
      -- Resolve organization fields for party role
      SELECT public.get_localized(o.name, u_locale)
      INTO org_name
      FROM public.organizations o
      WHERE o.id = u_scope_id;

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

-- Grant execute to authenticated (admin-only in practice since the Edge
-- Function verifies admin role before calling this RPC)
GRANT EXECUTE ON FUNCTION public.resolve_email_variables(uuid[], text, text) TO authenticated;
-- Also grant to service_role (used by Edge Functions with service_role key)
GRANT EXECUTE ON FUNCTION public.resolve_email_variables(uuid[], text, text) TO service_role;
-- Entity RPC functions
--
-- Functions:
--   get_nominations()         - return nominations with entity data
--   get_candidate_user_data() - return entity row for authenticated user
--   upsert_answers()          - atomic answer write for a single entity

--------------------------------------------------------------------------------
-- get_nominations RPC: returns nominations with entity data in a single round trip
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_nominations(
  p_election_id uuid DEFAULT NULL,
  p_constituency_id uuid DEFAULT NULL,
  p_include_unconfirmed boolean DEFAULT false
)
RETURNS TABLE (
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
  entity_last_name text,
  entity_organization_id uuid
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    n.id, n.name, n.short_name, n.info, n.color, n.image,
    n.sort_order, n.subtype, n.custom_data,
    n.entity_type,
    n.candidate_id, n.organization_id, n.faction_id, n.alliance_id,
    n.election_id, n.constituency_id, n.election_round, n.election_symbol,
    n.parent_nomination_id,
    COALESCE(n.candidate_id, n.organization_id, n.faction_id, n.alliance_id) AS entity_id,
    COALESCE(c.name, o.name, f.name, a.name) AS entity_name,
    COALESCE(c.short_name, o.short_name, f.short_name, a.short_name) AS entity_short_name,
    COALESCE(c.info, o.info, f.info, a.info) AS entity_info,
    COALESCE(c.color, o.color, f.color, a.color) AS entity_color,
    COALESCE(c.image, o.image, f.image, a.image) AS entity_image,
    COALESCE(c.sort_order, o.sort_order, f.sort_order, a.sort_order) AS entity_sort_order,
    COALESCE(c.subtype, o.subtype, f.subtype, a.subtype) AS entity_subtype,
    COALESCE(c.custom_data, o.custom_data, f.custom_data, a.custom_data) AS entity_custom_data,
    COALESCE(c.answers, o.answers) AS entity_answers,
    c.first_name AS entity_first_name,
    c.last_name AS entity_last_name,
    c.organization_id AS entity_organization_id
  FROM public.nominations n
  LEFT JOIN public.candidates c ON n.candidate_id = c.id
  LEFT JOIN public.organizations o ON n.organization_id = o.id
  LEFT JOIN public.factions f ON n.faction_id = f.id
  LEFT JOIN public.alliances a ON n.alliance_id = a.id
  WHERE (p_election_id IS NULL OR n.election_id = p_election_id)
    AND (p_constituency_id IS NULL OR n.constituency_id = p_constituency_id)
    AND (p_include_unconfirmed OR NOT COALESCE(n.unconfirmed, false))
  ORDER BY n.sort_order NULLS LAST, n.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_nominations(uuid, uuid, boolean) TO anon, authenticated;

--------------------------------------------------------------------------------
-- get_candidate_user_data: returns the entity row for the authenticated user
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_candidate_user_data(
  p_entity_type public.entity_type DEFAULT 'candidate'
)
RETURNS TABLE (
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
  last_name text,
  organization_id uuid
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT c.id, c.project_id, c.name, c.short_name, c.info,
         c.color, c.image, c.sort_order, c.subtype,
         c.custom_data, c.answers, c.terms_of_use_accepted,
         c.first_name, c.last_name, c.organization_id
  FROM public.candidates c
  WHERE c.auth_user_id = (SELECT auth.uid())
    AND p_entity_type = 'candidate'
  UNION ALL
  SELECT o.id, o.project_id, o.name, o.short_name, o.info,
         o.color, o.image, o.sort_order, o.subtype,
         o.custom_data, o.answers, NULL::timestamptz,
         NULL::text, NULL::text, NULL::uuid
  FROM public.organizations o
  WHERE o.auth_user_id = (SELECT auth.uid())
    AND p_entity_type = 'organization'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_candidate_user_data(public.entity_type) TO authenticated;

--------------------------------------------------------------------------------
-- upsert_answers: atomic answer write for a single entity
--
-- SECURITY INVOKER: runs with caller's permissions, so RLS policies enforce
-- that a candidate can only update their own row.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_answers(
    p_entity_id uuid,
    p_answers jsonb,
    p_overwrite boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
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
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entity not found or access denied: %', p_entity_id;
  END IF;

  RETURN p_updated_answers;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_answers(uuid, jsonb, boolean) TO authenticated;
-- Admin RPC functions
--
-- Functions:
--   merge_custom_data() - shallow JSONB merge on questions.custom_data

--------------------------------------------------------------------------------
-- merge_custom_data: shallow JSONB merge on questions.custom_data
--
-- SECURITY INVOKER: the existing admin_update_questions RLS policy enforces
-- that only admins with can_access_project() can update questions.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.merge_custom_data(
  p_question_id uuid,
  p_patch       jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
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

GRANT EXECUTE ON FUNCTION public.merge_custom_data(uuid, jsonb) TO authenticated;
-- Test helpers: generic JSONB deep-merge RPC for test infrastructure
--
-- jsonb_recursive_merge: recursively merges two JSONB objects. When both
-- sides are objects, keys are merged recursively. Otherwise, the patch
-- value wins.
--
-- merge_jsonb_column: generic RPC for deep-merging a partial JSONB payload
-- into any JSONB column of any table. Used by SupabaseAdminClient to update
-- app_settings.settings without replacing sibling keys.
--
-- SECURITY INVOKER: runs with caller's permissions so that RLS policies on
-- the target table are enforced.

--------------------------------------------------------------------------------
-- jsonb_recursive_merge: recursive deep merge of two JSONB values
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.jsonb_recursive_merge(p_base jsonb, p_patch jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
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
--   p_table_name   - name of the target table
--   p_column_name  - name of the JSONB column to merge into
--   p_row_id       - UUID primary key of the row to update
--   p_partial_data - JSONB object to deep-merge into the existing value
--
-- SECURITY INVOKER: the caller's RLS policies apply to the UPDATE
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.merge_jsonb_column(
  p_table_name text,
  p_column_name text,
  p_row_id uuid,
  p_partial_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
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
GRANT EXECUTE ON FUNCTION public.jsonb_recursive_merge(jsonb, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.merge_jsonb_column(text, text, uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.merge_jsonb_column(text, text, uuid, jsonb) TO authenticated;
