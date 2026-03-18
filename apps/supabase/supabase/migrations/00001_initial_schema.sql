-- Enums, utility functions, and nomination validation
--
-- Enums:
--   question_type, entity_type, category_type
--
-- Functions:
--   update_updated_at()       - trigger for automatic updated_at timestamps
--   get_localized()           - extract locale string from JSONB with fallback
--   validate_answer_value()   - validate an answer value against question type
--   validate_nomination()     - enforce nomination hierarchy rules

--------------------------------------------------------------------------------
-- Enums
--------------------------------------------------------------------------------

CREATE TYPE question_type AS ENUM (
  'text', 'number', 'boolean', 'image', 'date', 'multipleText',
  'singleChoiceOrdinal', 'singleChoiceCategorical', 'multipleChoiceCategorical'
);

CREATE TYPE entity_type AS ENUM (
  'candidate', 'organization', 'faction', 'alliance'
);

CREATE TYPE category_type AS ENUM (
  'info', 'opinion', 'default'
);

--------------------------------------------------------------------------------
-- update_updated_at
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- get_localized: extract locale string from JSONB with fallback chain
--
-- Fallback order:
--   1. val->>locale          (requested locale)
--   2. val->>default_locale  (project default)
--   3. first available key   (any content is better than NULL)
--   4. NULL                  (val is NULL or empty)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_localized(
  val            jsonb,
  locale         text,
  default_locale text DEFAULT 'en'
)
RETURNS text
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  IF val IS NULL THEN
    RETURN NULL;
  END IF;

  IF val ? locale THEN
    RETURN val ->> locale;
  END IF;

  IF val ? default_locale THEN
    RETURN val ->> default_locale;
  END IF;

  RETURN (SELECT val ->> k FROM jsonb_object_keys(val) AS k LIMIT 1);
END;
$$;

--------------------------------------------------------------------------------
-- validate_answer_value: validate an answer against its question type
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_answer_value(
  answer_val jsonb,
  q_type question_type,
  valid_choices jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  answer_value jsonb;
  choice_ids jsonb;
BEGIN
  answer_value := answer_val -> 'value';

  IF answer_value IS NULL OR answer_value = 'null'::jsonb THEN
    RETURN;
  END IF;

  CASE q_type
    WHEN 'text' THEN
      IF jsonb_typeof(answer_value) != 'string' THEN
        RAISE EXCEPTION 'Answer for text question must be a string';
      END IF;
    WHEN 'number' THEN
      IF jsonb_typeof(answer_value) != 'number' THEN
        RAISE EXCEPTION 'Answer for number question must be a number';
      END IF;
    WHEN 'boolean' THEN
      IF jsonb_typeof(answer_value) != 'boolean' THEN
        RAISE EXCEPTION 'Answer for boolean question must be a boolean';
      END IF;
    WHEN 'date' THEN
      IF jsonb_typeof(answer_value) != 'string' THEN
        RAISE EXCEPTION 'Answer for date question must be a date string';
      END IF;
    WHEN 'singleChoiceOrdinal', 'singleChoiceCategorical' THEN
      IF jsonb_typeof(answer_value) != 'string' AND jsonb_typeof(answer_value) != 'number' THEN
        RAISE EXCEPTION 'Answer for choice question must be a choice ID (string or number)';
      END IF;
      IF valid_choices IS NOT NULL THEN
        SELECT jsonb_agg(c -> 'id') INTO choice_ids FROM jsonb_array_elements(valid_choices) AS c;
        IF choice_ids IS NOT NULL AND NOT choice_ids @> jsonb_build_array(answer_value) THEN
          RAISE EXCEPTION 'Answer choice ID not in valid choices';
        END IF;
      END IF;
    WHEN 'multipleChoiceCategorical' THEN
      IF jsonb_typeof(answer_value) != 'array' THEN
        RAISE EXCEPTION 'Answer for multiple choice question must be an array';
      END IF;
    WHEN 'multipleText' THEN
      IF jsonb_typeof(answer_value) != 'array' THEN
        RAISE EXCEPTION 'Answer for multipleText question must be an array';
      END IF;
    WHEN 'image' THEN
      IF jsonb_typeof(answer_value) != 'object' THEN
        RAISE EXCEPTION 'Answer for image question must be an object';
      END IF;
      -- Validate StoredImage structure: {path, pathDark?, alt?, width?, height?, focalPoint?}
      IF NOT (answer_value ? 'path') THEN
        RAISE EXCEPTION 'StoredImage must have a "path" property';
      END IF;
      IF jsonb_typeof(answer_value -> 'path') != 'string' THEN
        RAISE EXCEPTION 'StoredImage "path" must be a string';
      END IF;
      IF answer_value ? 'pathDark' AND jsonb_typeof(answer_value -> 'pathDark') != 'string' THEN
        RAISE EXCEPTION 'StoredImage "pathDark" must be a string';
      END IF;
      IF answer_value ? 'alt' AND jsonb_typeof(answer_value -> 'alt') != 'string' THEN
        RAISE EXCEPTION 'StoredImage "alt" must be a string';
      END IF;
      IF answer_value ? 'width' AND jsonb_typeof(answer_value -> 'width') != 'number' THEN
        RAISE EXCEPTION 'StoredImage "width" must be a number';
      END IF;
      IF answer_value ? 'height' AND jsonb_typeof(answer_value -> 'height') != 'number' THEN
        RAISE EXCEPTION 'StoredImage "height" must be a number';
      END IF;
      IF answer_value ? 'focalPoint' THEN
        IF jsonb_typeof(answer_value -> 'focalPoint') != 'object' THEN
          RAISE EXCEPTION 'StoredImage "focalPoint" must be an object';
        END IF;
        IF NOT (answer_value -> 'focalPoint' ? 'x') OR NOT (answer_value -> 'focalPoint' ? 'y') THEN
          RAISE EXCEPTION 'StoredImage "focalPoint" must have "x" and "y" properties';
        END IF;
        IF jsonb_typeof(answer_value -> 'focalPoint' -> 'x') != 'number' THEN
          RAISE EXCEPTION 'StoredImage "focalPoint.x" must be a number';
        END IF;
        IF jsonb_typeof(answer_value -> 'focalPoint' -> 'y') != 'number' THEN
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
--   alliance    → no parent allowed
--   organization → parent must be alliance (or none for standalone)
--   faction     → parent MUST be organization
--   candidate   → parent must be organization or faction (or none for standalone)
--
-- Consistency rules:
--   If parent_nomination_id is set, election_id, constituency_id, and
--   election_round must match the parent nomination.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_nomination()
RETURNS TRIGGER AS $$
DECLARE
  parent_type entity_type;
  parent_election_id uuid;
  parent_constituency_id uuid;
  parent_election_round integer;
  child_type entity_type;
BEGIN
  -- Derive entity_type from the FK columns
  child_type := CASE
    WHEN NEW.candidate_id IS NOT NULL THEN 'candidate'::entity_type
    WHEN NEW.organization_id IS NOT NULL THEN 'organization'::entity_type
    WHEN NEW.faction_id IS NOT NULL THEN 'faction'::entity_type
    WHEN NEW.alliance_id IS NOT NULL THEN 'alliance'::entity_type
  END;

  IF NEW.parent_nomination_id IS NULL THEN
    -- Top-level: faction must have a parent
    IF child_type = 'faction' THEN
      RAISE EXCEPTION 'Faction nominations must have a parent organization nomination';
    END IF;
    RETURN NEW;
  END IF;

  -- Look up parent nomination
  SELECT
    CASE
      WHEN p.candidate_id IS NOT NULL THEN 'candidate'::entity_type
      WHEN p.organization_id IS NOT NULL THEN 'organization'::entity_type
      WHEN p.faction_id IS NOT NULL THEN 'faction'::entity_type
      WHEN p.alliance_id IS NOT NULL THEN 'alliance'::entity_type
    END,
    p.election_id,
    p.constituency_id,
    p.election_round
  INTO parent_type, parent_election_id, parent_constituency_id, parent_election_round
  FROM nominations p
  WHERE p.id = NEW.parent_nomination_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent nomination % not found', NEW.parent_nomination_id;
  END IF;

  -- Validate parent-child entity type combination
  CASE child_type
    WHEN 'alliance' THEN
      RAISE EXCEPTION 'Alliance nominations cannot have a parent';
    WHEN 'organization' THEN
      IF parent_type != 'alliance' THEN
        RAISE EXCEPTION 'Organization nomination parent must be an alliance nomination, got %', parent_type;
      END IF;
    WHEN 'faction' THEN
      IF parent_type != 'organization' THEN
        RAISE EXCEPTION 'Faction nomination parent must be an organization nomination, got %', parent_type;
      END IF;
    WHEN 'candidate' THEN
      IF parent_type NOT IN ('organization', 'faction') THEN
        RAISE EXCEPTION 'Candidate nomination parent must be an organization or faction nomination, got %', parent_type;
      END IF;
  END CASE;

  -- Validate election/constituency/round consistency with parent
  IF NEW.election_id != parent_election_id THEN
    RAISE EXCEPTION 'Nomination election_id must match parent (expected %, got %)',
      parent_election_id, NEW.election_id;
  END IF;

  IF NEW.constituency_id != parent_constituency_id THEN
    RAISE EXCEPTION 'Nomination constituency_id must match parent (expected %, got %)',
      parent_constituency_id, NEW.constituency_id;
  END IF;

  IF NEW.election_round IS DISTINCT FROM parent_election_round THEN
    RAISE EXCEPTION 'Nomination election_round must match parent (expected %, got %)',
      parent_election_round, NEW.election_round;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Multi-tenant foundation: accounts and projects
--
-- All content tables reference projects via project_id FK with ON DELETE CASCADE.

CREATE TABLE accounts (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE projects (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id     uuid        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name           text        NOT NULL,
  default_locale text        NOT NULL DEFAULT 'en',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- Elections, constituency groups, constituencies, and their join tables

CREATE TABLE elections (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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
  BEFORE UPDATE ON elections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE constituency_groups (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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
  BEFORE UPDATE ON constituency_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE constituencies (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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
  parent_id    uuid        REFERENCES constituencies(id) ON DELETE SET NULL
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON constituencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE constituency_group_constituencies (
  constituency_group_id uuid NOT NULL REFERENCES constituency_groups(id) ON DELETE CASCADE,
  constituency_id       uuid NOT NULL REFERENCES constituencies(id) ON DELETE CASCADE,
  PRIMARY KEY (constituency_group_id, constituency_id)
);

CREATE TABLE election_constituency_groups (
  election_id           uuid NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  constituency_group_id uuid NOT NULL REFERENCES constituency_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (election_id, constituency_group_id)
);
-- Entity tables: organizations, candidates, factions, alliances

CREATE TABLE organizations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE candidates (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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
  organization_id uuid        REFERENCES organizations(id) ON DELETE SET NULL,
  auth_user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE factions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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
  BEFORE UPDATE ON factions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE alliances (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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
  BEFORE UPDATE ON alliances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- Question categories and questions

CREATE TABLE question_categories (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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
  category_type   category_type DEFAULT 'opinion',
  election_ids    jsonb,
  election_rounds jsonb,
  constituency_ids jsonb,
  entity_type     jsonb
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON question_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE questions (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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
  type            question_type NOT NULL,
  category_id     uuid          NOT NULL REFERENCES question_categories(id),
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
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- Nominations
--
-- Uses separate FK columns for each entity type instead of polymorphic entity_id.
-- entity_type is a generated column derived from which FK is set.
--
-- Hierarchy (enforced by validate_nomination trigger):
--   alliance    → no parent
--   organization → parent: alliance (or standalone)
--   faction     → parent: organization (required)
--   candidate   → parent: organization or faction (or standalone)
--
-- Parent-child nominations must share election_id, constituency_id, and
-- election_round (also enforced by trigger).

CREATE TABLE nominations (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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
  candidate_id         uuid        REFERENCES candidates(id) ON DELETE CASCADE,
  organization_id      uuid        REFERENCES organizations(id) ON DELETE CASCADE,
  faction_id           uuid        REFERENCES factions(id) ON DELETE CASCADE,
  alliance_id          uuid        REFERENCES alliances(id) ON DELETE CASCADE,
  -- Generated entity_type from FK columns
  entity_type          entity_type NOT NULL GENERATED ALWAYS AS (
    CASE
      WHEN candidate_id IS NOT NULL THEN 'candidate'::entity_type
      WHEN organization_id IS NOT NULL THEN 'organization'::entity_type
      WHEN faction_id IS NOT NULL THEN 'faction'::entity_type
      WHEN alliance_id IS NOT NULL THEN 'alliance'::entity_type
    END
  ) STORED,
  -- Election context
  election_id          uuid        NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  constituency_id      uuid        NOT NULL REFERENCES constituencies(id) ON DELETE CASCADE,
  election_round       integer     DEFAULT 1,
  election_symbol      text,
  -- Nesting
  parent_nomination_id uuid        REFERENCES nominations(id) ON DELETE CASCADE,
  unconfirmed          boolean     DEFAULT false,
  -- Exactly one entity FK must be set
  CHECK (num_nonnulls(candidate_id, organization_id, faction_id, alliance_id) = 1)
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON nominations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER validate_nomination_before_insert_or_update
  BEFORE INSERT OR UPDATE ON nominations
  FOR EACH ROW EXECUTE FUNCTION validate_nomination();
-- JSONB answer storage (default)
--
-- Stores answers as a JSONB column on candidates and organizations:
-- Record<QuestionId, {value: ..., info?: ...}>
--
-- Features:
--   1. Smart validation trigger: validates only changed answer keys on UPDATE
--   2. Question delete cascade: removes orphaned answer keys when a question is deleted
--   3. Question type change protection: prevents type changes that would invalidate existing answers
--
-- Alternative: see schema/alternatives/answers-relational.sql
--
-- TODO: Add an RPC function for atomic single-answer upsert to prevent
--       client-side read-modify-write race conditions with concurrent jsonb_set().
--       E.g. upsert_candidate_answer(candidate_id uuid, question_id uuid, value jsonb)
--       that uses server-side jsonb_set with implicit row lock.

ALTER TABLE candidates ADD COLUMN answers jsonb DEFAULT '{}'::jsonb;
ALTER TABLE organizations ADD COLUMN answers jsonb DEFAULT '{}'::jsonb;

--------------------------------------------------------------------------------
-- JSONB answer validation trigger function (smart: validates only changed keys)
--
-- On INSERT: validates all keys
-- On UPDATE: validates only new or modified keys (skips unchanged)
-- Short-circuits if answers column is unchanged or empty
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_answers_jsonb()
RETURNS TRIGGER AS $$
DECLARE
  question_id text;
  answer_value jsonb;
  question_record record;
  old_answers jsonb;
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
  old_answers := CASE WHEN TG_OP = 'UPDATE' THEN OLD.answers ELSE NULL END;

  FOR question_id, answer_value IN SELECT * FROM jsonb_each(NEW.answers)
  LOOP
    -- Skip unchanged answer keys (only validate new or modified)
    IF old_answers IS NOT NULL
       AND old_answers ? question_id
       AND old_answers -> question_id IS NOT DISTINCT FROM answer_value THEN
      CONTINUE;
    END IF;

    SELECT q.type, q.choices
    INTO question_record
    FROM questions q
    WHERE q.id = question_id::uuid
      AND q.project_id = NEW.project_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Question % not found in project', question_id;
    END IF;

    PERFORM validate_answer_value(
      answer_value,
      question_record.type,
      question_record.choices
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_answers_before_insert_or_update
  BEFORE INSERT OR UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION validate_answers_jsonb();

CREATE TRIGGER validate_answers_before_insert_or_update
  BEFORE INSERT OR UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION validate_answers_jsonb();

--------------------------------------------------------------------------------
-- Question delete cascade: remove orphaned answer keys from JSONB
--
-- When a question is deleted, removes its answer key from all candidates
-- and organizations in the same project. Uses the JSONB `-` operator
-- which is a no-op if the key doesn't exist.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cascade_question_delete_to_jsonb_answers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE candidates
  SET answers = answers - OLD.id::text
  WHERE project_id = OLD.project_id
    AND answers ? OLD.id::text;

  UPDATE organizations
  SET answers = answers - OLD.id::text
  WHERE project_id = OLD.project_id
    AND answers ? OLD.id::text;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_question_delete_to_answers
  AFTER DELETE ON questions
  FOR EACH ROW EXECUTE FUNCTION cascade_question_delete_to_jsonb_answers();

--------------------------------------------------------------------------------
-- Question type/choices change protection
--
-- Prevents changing a question's type or choices if existing answers would
-- become invalid under the new type. Type changes are allowed if:
--   1. No answers exist for this question, or
--   2. All existing answers pass validation against the new type/choices
--
-- This mirrors the relational model's inherent constraint: you can't change
-- a column type if existing data doesn't conform.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_question_type_change()
RETURNS TRIGGER AS $$
DECLARE
  entity_record record;
  valid_choices jsonb;
BEGIN
  -- Only act on type or choices changes
  IF OLD.type IS NOT DISTINCT FROM NEW.type
     AND OLD.choices IS NOT DISTINCT FROM NEW.choices THEN
    RETURN NEW;
  END IF;

  -- Get effective choices for validation
  valid_choices := NEW.choices;

  -- Validate all existing candidate answers against the new type
  FOR entity_record IN
    SELECT c.id, c.answers -> OLD.id::text AS answer_value
    FROM candidates c
    WHERE c.project_id = NEW.project_id
      AND c.answers ? OLD.id::text
  LOOP
    BEGIN
      PERFORM validate_answer_value(entity_record.answer_value, NEW.type, valid_choices);
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Cannot change question % type/choices: existing answer for candidate % would be invalid: %',
        NEW.id, entity_record.id, SQLERRM;
    END;
  END LOOP;

  -- Validate all existing organization answers against the new type
  FOR entity_record IN
    SELECT o.id, o.answers -> OLD.id::text AS answer_value
    FROM organizations o
    WHERE o.project_id = NEW.project_id
      AND o.answers ? OLD.id::text
  LOOP
    BEGIN
      PERFORM validate_answer_value(entity_record.answer_value, NEW.type, valid_choices);
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Cannot change question % type/choices: existing answer for organization % would be invalid: %',
        NEW.id, entity_record.id, SQLERRM;
    END;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_question_type_change_trigger
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION validate_question_type_change();
-- App settings: per-project application settings stored as JSONB
--
-- One row per project, enforced by UNIQUE constraint on project_id.
-- The app layer is responsible for parsing/validating the settings structure.

CREATE TABLE app_settings (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid        NOT NULL UNIQUE REFERENCES projects(id),
  settings   jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- B-tree indexes on RLS-referenced and commonly filtered columns

--------------------------------------------------------------------------------
-- project_id indexes (every content table)
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_elections_project_id ON elections (project_id);
CREATE INDEX IF NOT EXISTS idx_constituency_groups_project_id ON constituency_groups (project_id);
CREATE INDEX IF NOT EXISTS idx_constituencies_project_id ON constituencies (project_id);
CREATE INDEX IF NOT EXISTS idx_organizations_project_id ON organizations (project_id);
CREATE INDEX IF NOT EXISTS idx_candidates_project_id ON candidates (project_id);
CREATE INDEX IF NOT EXISTS idx_factions_project_id ON factions (project_id);
CREATE INDEX IF NOT EXISTS idx_alliances_project_id ON alliances (project_id);
CREATE INDEX IF NOT EXISTS idx_question_categories_project_id ON question_categories (project_id);
CREATE INDEX IF NOT EXISTS idx_questions_project_id ON questions (project_id);
CREATE INDEX IF NOT EXISTS idx_nominations_project_id ON nominations (project_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_project_id ON app_settings (project_id);

--------------------------------------------------------------------------------
-- FK reference column indexes
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_projects_account_id ON projects (account_id);
CREATE INDEX IF NOT EXISTS idx_candidates_organization_id ON candidates (organization_id);
CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions (category_id);
CREATE INDEX IF NOT EXISTS idx_constituencies_parent_id ON constituencies (parent_id);

-- Nomination FK indexes
CREATE INDEX IF NOT EXISTS idx_nominations_candidate_id ON nominations (candidate_id);
CREATE INDEX IF NOT EXISTS idx_nominations_organization_id ON nominations (organization_id);
CREATE INDEX IF NOT EXISTS idx_nominations_faction_id ON nominations (faction_id);
CREATE INDEX IF NOT EXISTS idx_nominations_alliance_id ON nominations (alliance_id);
CREATE INDEX IF NOT EXISTS idx_nominations_election_id ON nominations (election_id);
CREATE INDEX IF NOT EXISTS idx_nominations_constituency_id ON nominations (constituency_id);
CREATE INDEX IF NOT EXISTS idx_nominations_parent_nomination_id ON nominations (parent_nomination_id);

--------------------------------------------------------------------------------
-- auth_user_id indexes (columns defined in 003-entities.sql)
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_candidates_auth_user_id ON candidates (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_auth_user_id ON organizations (auth_user_id);
-- Auth tables: user_roles, auth_user_id columns, published flags
--
-- Depends on: 001-tenancy.sql (accounts, projects)
--             003-entities.sql (candidates, organizations)
--             All voter-facing content tables

--------------------------------------------------------------------------------
-- user_role_type enum
--------------------------------------------------------------------------------
CREATE TYPE user_role_type AS ENUM (
  'candidate', 'party', 'project_admin', 'account_admin', 'super_admin'
);

--------------------------------------------------------------------------------
-- user_roles table
--------------------------------------------------------------------------------
CREATE TABLE user_roles (
  id         uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       user_role_type NOT NULL,
  scope_type text           NOT NULL,  -- 'candidate', 'party', 'project', 'account', 'global'
  scope_id   uuid,                     -- NULL for super_admin (global scope)
  created_at timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, scope_type, scope_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles (user_id);

--------------------------------------------------------------------------------
-- RLS on user_roles — critical to prevent circular RLS with the auth hook
--------------------------------------------------------------------------------
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Auth admin must read roles (used by Custom Access Token Hook)
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.user_roles TO supabase_auth_admin;
CREATE POLICY "auth_admin_read_user_roles"
  ON user_roles FOR SELECT
  TO supabase_auth_admin
  USING (true);

-- Service role (Edge Functions) can manage roles
CREATE POLICY "service_role_manage_user_roles"
  ON user_roles FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Prevent regular users from accessing user_roles directly
REVOKE ALL ON TABLE public.user_roles FROM authenticated, anon, public;

--------------------------------------------------------------------------------
-- Published columns on voter-facing tables
-- (Using ALTER TABLE since the base tables are defined in earlier schema files)
--------------------------------------------------------------------------------
ALTER TABLE elections ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE candidates ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE organizations ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE questions ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE question_categories ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE nominations ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE constituencies ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE constituency_groups ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE factions ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE alliances ADD COLUMN published boolean NOT NULL DEFAULT false;

--------------------------------------------------------------------------------
-- Partial indexes on published for efficient anon RLS
-- (Must be in this file, after the columns are added above)
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_elections_published ON elections (published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_candidates_published ON candidates (published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_organizations_published ON organizations (published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_questions_published ON questions (published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_nominations_published ON nominations (published) WHERE published = true;
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
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_roles_claim jsonb;
BEGIN
  claims := event->'claims';

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'role', ur.role::text,
      'scope_type', ur.scope_type,
      'scope_id', ur.scope_id
    )
  ), '[]'::jsonb)
  INTO user_roles_claim
  FROM public.user_roles ur
  WHERE ur.user_id = (event->>'user_id')::uuid;

  claims := jsonb_set(claims, '{user_roles}', user_roles_claim);
  RETURN jsonb_set(event, '{claims}', claims);
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
  check_role text,
  check_scope_type text DEFAULT NULL,
  check_scope_id uuid DEFAULT NULL
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
    IF role_entry->>'role' = check_role THEN
      -- super_admin has global access, no scope check needed
      IF check_role = 'super_admin' THEN RETURN true; END IF;
      -- If no scope filter requested, any matching role suffices
      IF check_scope_type IS NULL THEN RETURN true; END IF;
      -- Check exact scope match
      IF role_entry->>'scope_type' = check_scope_type
         AND role_entry->>'scope_id' = check_scope_id::text THEN
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
CREATE OR REPLACE FUNCTION public.is_candidate_self(row_auth_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT row_auth_user_id = (SELECT auth.uid());
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
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "accounts_deny_all" ON accounts;

-- Authenticated: account_admin for their account or super_admin
CREATE POLICY "authenticated_select_accounts" ON accounts FOR SELECT TO authenticated
  USING (
    (SELECT has_role('account_admin', 'account', id))
    OR (SELECT has_role('super_admin'))
  );

-- Super admin only: insert
CREATE POLICY "admin_insert_accounts" ON accounts FOR INSERT TO authenticated
  WITH CHECK ((SELECT has_role('super_admin')));

-- Super admin only: update
CREATE POLICY "admin_update_accounts" ON accounts FOR UPDATE TO authenticated
  USING ((SELECT has_role('super_admin')))
  WITH CHECK ((SELECT has_role('super_admin')));

-- Super admin only: delete
CREATE POLICY "admin_delete_accounts" ON accounts FOR DELETE TO authenticated
  USING ((SELECT has_role('super_admin')));

-- =====================================================================
-- projects (has account_id, no published flag)
-- =====================================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_deny_all" ON projects;

-- Authenticated: project access or account_admin or super_admin
CREATE POLICY "authenticated_select_projects" ON projects FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(id))
    OR (SELECT has_role('account_admin', 'account', account_id))
    OR (SELECT has_role('super_admin'))
  );

-- Insert: account_admin for the account or super_admin
CREATE POLICY "admin_insert_projects" ON projects FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT has_role('account_admin', 'account', account_id))
    OR (SELECT has_role('super_admin'))
  );

-- Update: project access (project_admin, account_admin, super_admin)
CREATE POLICY "admin_update_projects" ON projects FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(id)))
  WITH CHECK ((SELECT can_access_project(id)));

-- Delete: project access (project_admin, account_admin, super_admin)
CREATE POLICY "admin_delete_projects" ON projects FOR DELETE TO authenticated
  USING ((SELECT can_access_project(id)));

-- =====================================================================
-- elections (project_id, published)
-- =====================================================================
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "elections_deny_all" ON elections;

CREATE POLICY "anon_select_elections" ON elections FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_elections" ON elections FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_elections" ON elections FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_elections" ON elections FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_elections" ON elections FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- constituency_groups (project_id, published)
-- =====================================================================
ALTER TABLE constituency_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "constituency_groups_deny_all" ON constituency_groups;

CREATE POLICY "anon_select_constituency_groups" ON constituency_groups FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_constituency_groups" ON constituency_groups FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_constituency_groups" ON constituency_groups FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_constituency_groups" ON constituency_groups FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_constituency_groups" ON constituency_groups FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- constituencies (project_id, published)
-- =====================================================================
ALTER TABLE constituencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "constituencies_deny_all" ON constituencies;

CREATE POLICY "anon_select_constituencies" ON constituencies FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_constituencies" ON constituencies FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_constituencies" ON constituencies FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_constituencies" ON constituencies FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_constituencies" ON constituencies FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- constituency_group_constituencies (join table, no project_id)
-- =====================================================================
ALTER TABLE constituency_group_constituencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "constituency_group_constituencies_deny_all" ON constituency_group_constituencies;

-- Anon: structural data, always readable
CREATE POLICY "anon_select_constituency_group_constituencies" ON constituency_group_constituencies FOR SELECT TO anon
  USING (true);

-- Authenticated: always readable
CREATE POLICY "authenticated_select_constituency_group_constituencies" ON constituency_group_constituencies FOR SELECT TO authenticated
  USING (true);

-- Admin insert: check access via parent constituency_group
CREATE POLICY "admin_insert_constituency_group_constituencies" ON constituency_group_constituencies FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM constituency_groups cg
      WHERE cg.id = constituency_group_id
        AND (SELECT can_access_project(cg.project_id))
    )
  );

-- Admin delete: check access via parent constituency_group
CREATE POLICY "admin_delete_constituency_group_constituencies" ON constituency_group_constituencies FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM constituency_groups cg
      WHERE cg.id = constituency_group_id
        AND (SELECT can_access_project(cg.project_id))
    )
  );

-- =====================================================================
-- election_constituency_groups (join table, no project_id)
-- =====================================================================
ALTER TABLE election_constituency_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "election_constituency_groups_deny_all" ON election_constituency_groups;

-- Anon: structural data, always readable
CREATE POLICY "anon_select_election_constituency_groups" ON election_constituency_groups FOR SELECT TO anon
  USING (true);

-- Authenticated: always readable
CREATE POLICY "authenticated_select_election_constituency_groups" ON election_constituency_groups FOR SELECT TO authenticated
  USING (true);

-- Admin insert: check access via parent election
CREATE POLICY "admin_insert_election_constituency_groups" ON election_constituency_groups FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM elections e
      WHERE e.id = election_id
        AND (SELECT can_access_project(e.project_id))
    )
  );

-- Admin delete: check access via parent election
CREATE POLICY "admin_delete_election_constituency_groups" ON election_constituency_groups FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM elections e
      WHERE e.id = election_id
        AND (SELECT can_access_project(e.project_id))
    )
  );

-- =====================================================================
-- organizations (project_id, published, auth_user_id)
-- =====================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "organizations_deny_all" ON organizations;

CREATE POLICY "anon_select_organizations" ON organizations FOR SELECT TO anon
  USING (published = true);

-- Authenticated: project access, own record, or published
CREATE POLICY "authenticated_select_organizations" ON organizations FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR auth_user_id = (SELECT auth.uid())
    OR (SELECT has_role('party', 'party', id))
    OR published = true
  );

-- Admin insert
CREATE POLICY "admin_insert_organizations" ON organizations FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

-- Party admin self-update: party role holder can update their party
CREATE POLICY "party_update_own_organizations" ON organizations FOR UPDATE TO authenticated
  USING (
    auth_user_id = (SELECT auth.uid())
    OR (SELECT has_role('party', 'party', id))
  )
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())
    OR (SELECT has_role('party', 'party', id))
  );

-- Admin update
CREATE POLICY "admin_update_organizations" ON organizations FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

-- Admin delete
CREATE POLICY "admin_delete_organizations" ON organizations FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- candidates (project_id, published, auth_user_id)
-- Answers stored as JSONB column -- covered by these policies.
-- =====================================================================
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "candidates_deny_all" ON candidates;

CREATE POLICY "anon_select_candidates" ON candidates FOR SELECT TO anon
  USING (published = true);

-- Authenticated: project access, own record, party admin for their party's candidates, or published
CREATE POLICY "authenticated_select_candidates" ON candidates FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR auth_user_id = (SELECT auth.uid())
    OR (SELECT has_role('party', 'party', organization_id))
    OR published = true
  );

-- Admin insert
CREATE POLICY "admin_insert_candidates" ON candidates FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

-- Candidate self-update: can update own record
-- Structural field protection (project_id, auth_user_id, organization_id) enforced
-- via column-level REVOKE in 013-auth-rls.sql
CREATE POLICY "candidate_update_own" ON candidates FOR UPDATE TO authenticated
  USING (auth_user_id = (SELECT auth.uid()))
  WITH CHECK (auth_user_id = (SELECT auth.uid()));

-- Admin update
CREATE POLICY "admin_update_candidates" ON candidates FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

-- Admin delete
CREATE POLICY "admin_delete_candidates" ON candidates FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- factions (project_id, published)
-- =====================================================================
ALTER TABLE factions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "factions_deny_all" ON factions;

CREATE POLICY "anon_select_factions" ON factions FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_factions" ON factions FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_factions" ON factions FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_factions" ON factions FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_factions" ON factions FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- alliances (project_id, published)
-- =====================================================================
ALTER TABLE alliances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "alliances_deny_all" ON alliances;

CREATE POLICY "anon_select_alliances" ON alliances FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_alliances" ON alliances FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_alliances" ON alliances FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_alliances" ON alliances FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_alliances" ON alliances FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- question_categories (project_id, published)
-- =====================================================================
ALTER TABLE question_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "question_categories_deny_all" ON question_categories;

CREATE POLICY "anon_select_question_categories" ON question_categories FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_question_categories" ON question_categories FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_question_categories" ON question_categories FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_question_categories" ON question_categories FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_question_categories" ON question_categories FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- questions (project_id, published)
-- =====================================================================
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "questions_deny_all" ON questions;

CREATE POLICY "anon_select_questions" ON questions FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_questions" ON questions FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_questions" ON questions FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_questions" ON questions FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_questions" ON questions FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- nominations (project_id, published)
-- =====================================================================
ALTER TABLE nominations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nominations_deny_all" ON nominations;

CREATE POLICY "anon_select_nominations" ON nominations FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_nominations" ON nominations FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_nominations" ON nominations FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_nominations" ON nominations FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_nominations" ON nominations FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- app_settings (project_id, no published flag -- anon needs read for voter app)
-- =====================================================================
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_settings_deny_all" ON app_settings;

-- Anon: always readable (voter app needs settings)
CREATE POLICY "anon_select_app_settings" ON app_settings FOR SELECT TO anon
  USING (true);

-- Authenticated: always readable
CREATE POLICY "authenticated_select_app_settings" ON app_settings FOR SELECT TO authenticated
  USING (true);

-- Admin CRUD
CREATE POLICY "admin_insert_app_settings" ON app_settings FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_app_settings" ON app_settings FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_app_settings" ON app_settings FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- RELATIONAL ANSWERS TABLE (uncomment if using alternatives/answers-relational.sql)
-- =====================================================================
-- If using the relational answer storage approach instead of JSONB columns on
-- candidates/organizations, uncomment the following policies. The relational
-- answers table has project_id and entity_id columns.
--
-- ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "answers_deny_all" ON answers;
--
-- -- Anon: read answers for published entities
-- CREATE POLICY "anon_select_answers" ON answers FOR SELECT TO anon
--   USING (
--     EXISTS (
--       SELECT 1 FROM candidates c
--       WHERE c.id = answers.entity_id AND c.published = true AND answers.entity_type = 'candidate'
--     ) OR EXISTS (
--       SELECT 1 FROM organizations o
--       WHERE o.id = answers.entity_id AND o.published = true AND answers.entity_type = 'organization'
--     )
--   );
--
-- -- Authenticated: read own project answers or own answers
-- CREATE POLICY "authenticated_select_answers" ON answers FOR SELECT TO authenticated
--   USING (
--     (SELECT can_access_project(project_id))
--     OR (entity_type = 'candidate' AND EXISTS (
--       SELECT 1 FROM candidates c WHERE c.id = answers.entity_id AND c.auth_user_id = (SELECT auth.uid())
--     ))
--   );
--
-- -- Candidate: insert own answers
-- CREATE POLICY "candidate_insert_own_answers" ON answers FOR INSERT TO authenticated
--   WITH CHECK (
--     entity_type = 'candidate' AND EXISTS (
--       SELECT 1 FROM candidates c WHERE c.id = answers.entity_id AND c.auth_user_id = (SELECT auth.uid())
--     )
--   );
--
-- -- Candidate: update own answers
-- CREATE POLICY "candidate_update_own_answers" ON answers FOR UPDATE TO authenticated
--   USING (
--     entity_type = 'candidate' AND EXISTS (
--       SELECT 1 FROM candidates c WHERE c.id = answers.entity_id AND c.auth_user_id = (SELECT auth.uid())
--     )
--   )
--   WITH CHECK (
--     entity_type = 'candidate' AND EXISTS (
--       SELECT 1 FROM candidates c WHERE c.id = answers.entity_id AND c.auth_user_id = (SELECT auth.uid())
--     )
--   );
--
-- -- Admin: full CRUD
-- CREATE POLICY "admin_insert_answers" ON answers FOR INSERT TO authenticated
--   WITH CHECK ((SELECT can_access_project(project_id)));
--
-- CREATE POLICY "admin_update_answers" ON answers FOR UPDATE TO authenticated
--   USING ((SELECT can_access_project(project_id)))
--   WITH CHECK ((SELECT can_access_project(project_id)));
--
-- CREATE POLICY "admin_delete_answers" ON answers FOR DELETE TO authenticated
--   USING ((SELECT can_access_project(project_id)));
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

REVOKE UPDATE ON candidates FROM authenticated;
GRANT UPDATE (
  name, short_name, info, color, image, sort_order, subtype,
  custom_data, first_name, last_name, answers, created_at, updated_at
) ON candidates TO authenticated;

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

REVOKE UPDATE ON organizations FROM authenticated;
GRANT UPDATE (
  name, short_name, info, color, image, sort_order, subtype,
  custom_data, answers, created_at, updated_at
) ON organizations TO authenticated;
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
CREATE TABLE IF NOT EXISTS storage_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);

-- Only service_role and postgres can access storage_config (not exposed via API)
ALTER TABLE storage_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE storage_config FROM anon, authenticated, public;
GRANT SELECT ON TABLE storage_config TO service_role;

--------------------------------------------------------------------------------
-- is_storage_entity_published: check if the entity owning a storage path is published
--
-- Path format: {project_id}/{entity_type}/{entity_id}/filename.ext
-- entity_type_segment maps directly to the table name.
-- Special cases:
--   'project' -> project-level files, always accessible
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_storage_entity_published(entity_type_segment text, entity_id_segment text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_published boolean;
BEGIN
  -- Project-level files are always accessible
  IF entity_type_segment = 'project' THEN
    RETURN true;
  END IF;

  -- For all other entity types, check published = true on the owning entity
  EXECUTE format(
    'SELECT published FROM public.%I WHERE id = $1',
    entity_type_segment
  ) INTO is_published USING entity_id_segment::uuid;

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
CREATE OR REPLACE FUNCTION delete_storage_object(bucket text, file_path text)
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
    url := base_url || '/storage/v1/object/' || bucket,
    body := jsonb_build_object('prefixes', jsonb_build_array(file_path)),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_key,
      'Content-Type', 'application/json'
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Storage cleanup failed for %/%: %', bucket, file_path, SQLERRM;
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
CREATE OR REPLACE FUNCTION cleanup_entity_storage_files()
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
  AFTER DELETE ON candidates
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON organizations
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON factions
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON alliances
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON elections
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON constituencies
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON constituency_groups
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON nominations
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON question_categories
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON questions
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();

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
CREATE OR REPLACE FUNCTION cleanup_old_image_file()
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
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON factions
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON alliances
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON elections
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON constituencies
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON constituency_groups
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON nominations
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON question_categories
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

CREATE TRIGGER cleanup_image_on_update
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();

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

ALTER TABLE elections ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_elections_external_id
  ON elections (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE constituency_groups ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_constituency_groups_external_id
  ON constituency_groups (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE constituencies ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_constituencies_external_id
  ON constituencies (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE candidates ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_candidates_external_id
  ON candidates (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE organizations ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_organizations_external_id
  ON organizations (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE factions ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_factions_external_id
  ON factions (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE alliances ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_alliances_external_id
  ON alliances (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE nominations ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_nominations_external_id
  ON nominations (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE questions ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_questions_external_id
  ON questions (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE question_categories ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_question_categories_external_id
  ON question_categories (project_id, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE app_settings ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_app_settings_external_id
  ON app_settings (project_id, external_id) WHERE external_id IS NOT NULL;

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
  BEFORE UPDATE ON elections
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON constituency_groups
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON constituencies
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON factions
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON alliances
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON nominations
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON question_categories
  FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();

CREATE TRIGGER enforce_external_id_immutability
  BEFORE UPDATE ON app_settings
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
CREATE OR REPLACE FUNCTION resolve_external_ref(
  ref jsonb,
  target_table text,
  p_project_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  resolved_id uuid;
  ext_id text;
BEGIN
  IF ref IS NULL OR ref = 'null'::jsonb THEN
    RETURN NULL;
  END IF;

  -- If ref is a JSON object with external_id key, resolve it
  IF jsonb_typeof(ref) = 'object' AND ref ? 'external_id' THEN
    ext_id := ref ->> 'external_id';
    IF ext_id IS NULL THEN
      RETURN NULL;
    END IF;

    EXECUTE format(
      'SELECT id FROM %I WHERE project_id = $1 AND external_id = $2',
      target_table
    ) INTO resolved_id USING p_project_id, ext_id;

    IF resolved_id IS NULL THEN
      RAISE EXCEPTION 'External reference not found: external_id "%" in table "%"',
        ext_id, target_table;
    END IF;

    RETURN resolved_id;
  END IF;

  -- If ref is a string, treat as direct UUID
  IF jsonb_typeof(ref) = 'string' THEN
    RETURN (ref #>> '{}')::uuid;
  END IF;

  RAISE EXCEPTION 'Invalid reference format: expected object with external_id or UUID string, got %',
    jsonb_typeof(ref);
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
CREATE OR REPLACE FUNCTION _bulk_upsert_record(
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
      resolved_uuid := resolve_external_ref(item_value, rel_target, p_project_id);

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
    'INSERT INTO %I (%s) VALUES (%s) ON CONFLICT (project_id, external_id) WHERE external_id IS NOT NULL DO UPDATE SET %s RETURNING (xmax = 0) AS inserted',
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
CREATE OR REPLACE FUNCTION bulk_import(data jsonb)
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
  FOR collection_name IN SELECT * FROM jsonb_object_keys(data)
  LOOP
    IF NOT collection_name = ANY(processing_order) THEN
      RAISE EXCEPTION 'Unknown collection: %', collection_name;
    END IF;
  END LOOP;

  -- Process collections in dependency order
  FOREACH col_name IN ARRAY processing_order
  LOOP
    IF NOT data ? col_name THEN CONTINUE; END IF;
    collection_data := data -> col_name;

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
      was_inserted := _bulk_upsert_record(col_name, item, item_project_id);

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
CREATE OR REPLACE FUNCTION bulk_delete(data jsonb)
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
  IF NOT data ? 'project_id' THEN
    RAISE EXCEPTION 'project_id is required at the top level of bulk_delete data';
  END IF;
  p_project_id := (data ->> 'project_id')::uuid;

  -- Extract collections
  IF NOT data ? 'collections' THEN
    RAISE EXCEPTION '"collections" object is required in bulk_delete data';
  END IF;
  collections := data -> 'collections';

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
        'DELETE FROM %I WHERE project_id = $1 AND external_id LIKE $2',
        col_name
      );
      EXECUTE sql_text USING p_project_id, prefix_val || '%';
      GET DIAGNOSTICS deleted_count = ROW_COUNT;

    ELSIF collection_spec ? 'ids' THEN
      -- UUID list deletion
      sql_text := format(
        'DELETE FROM %I WHERE project_id = $1 AND id = ANY(
          SELECT value::uuid FROM jsonb_array_elements_text($2)
        )',
        col_name
      );
      EXECUTE sql_text USING p_project_id, collection_spec -> 'ids';
      GET DIAGNOSTICS deleted_count = ROW_COUNT;

    ELSIF collection_spec ? 'external_ids' THEN
      -- External ID list deletion
      sql_text := format(
        'DELETE FROM %I WHERE project_id = $1 AND external_id = ANY(
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
GRANT EXECUTE ON FUNCTION bulk_import(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_delete(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_external_ref(jsonb, text, uuid) TO authenticated;
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
CREATE OR REPLACE FUNCTION resolve_email_variables(
  user_ids uuid[],
  template_body text DEFAULT '',
  template_subject text DEFAULT ''
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
  FOREACH uid IN ARRAY user_ids
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
GRANT EXECUTE ON FUNCTION resolve_email_variables(uuid[], text, text) TO authenticated;
-- Also grant to service_role (used by Edge Functions with service_role key)
GRANT EXECUTE ON FUNCTION resolve_email_variables(uuid[], text, text) TO service_role;

--------------------------------------------------------------------------------
-- Phase 22 additions (SCHM-01, SCHM-03, SCHM-04)
--------------------------------------------------------------------------------

-- SCHM-01: App customization column on app_settings
-- Image references use {path, pathDark?, alt?, width?, height?} format.
-- Existing RLS (anon SELECT, admin INSERT/UPDATE/DELETE) covers this column.
ALTER TABLE app_settings ADD COLUMN customization jsonb DEFAULT '{}'::jsonb;

-- SCHM-03: Terms-of-use acceptance timestamp on candidates
-- NULL = not yet accepted. Candidates can update their own row (column-level GRANT updated below).
ALTER TABLE candidates ADD COLUMN terms_of_use_accepted timestamptz;

-- SCHM-03 (cont.): Update column-level GRANT so candidates can update their own terms acceptance
REVOKE UPDATE ON candidates FROM authenticated;
GRANT UPDATE (
  name, short_name, info, color, image, sort_order, subtype,
  custom_data, first_name, last_name, answers, created_at, updated_at,
  terms_of_use_accepted
) ON candidates TO authenticated;

-- SCHM-04: upsert_answers RPC for atomic candidate answer writes
-- SECURITY INVOKER: RLS (candidate_update_own) enforces row-level access.
-- validate_answers_jsonb() trigger fires on the underlying UPDATE automatically.
-- Null-valued keys are stripped after merge to support "remove answer" semantics.
CREATE OR REPLACE FUNCTION upsert_answers(
  entity_id uuid,
  answers   jsonb,
  overwrite boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  updated_answers jsonb;
BEGIN
  IF overwrite THEN
    UPDATE candidates
    SET answers = (
      SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
      FROM jsonb_each(COALESCE(upsert_answers.answers, '{}'::jsonb)) AS t(k, v)
      WHERE v IS NOT NULL AND v != 'null'::jsonb
    )
    WHERE id = entity_id
    RETURNING candidates.answers INTO updated_answers;
  ELSE
    UPDATE candidates
    SET answers = (
      SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
      FROM jsonb_each(
        COALESCE(candidates.answers, '{}'::jsonb) || COALESCE(upsert_answers.answers, '{}'::jsonb)
      ) AS t(k, v)
      WHERE v IS NOT NULL AND v != 'null'::jsonb
    )
    WHERE id = entity_id
    RETURNING candidates.answers INTO updated_answers;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entity not found or access denied: %', entity_id;
  END IF;

  RETURN updated_answers;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_answers(uuid, jsonb, boolean) TO authenticated;
