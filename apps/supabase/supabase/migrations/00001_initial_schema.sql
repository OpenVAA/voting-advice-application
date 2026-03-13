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
-- Question templates, categories, and questions

CREATE TABLE question_templates (
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
  settings        jsonb,
  default_choices jsonb
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON question_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

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
  template_id     uuid          REFERENCES question_templates(id) ON DELETE SET NULL,
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
-- Alternative: see schema/alternatives/answers-relational.sql

ALTER TABLE candidates ADD COLUMN answers jsonb DEFAULT '{}'::jsonb;
ALTER TABLE organizations ADD COLUMN answers jsonb DEFAULT '{}'::jsonb;

--------------------------------------------------------------------------------
-- JSONB answer validation trigger function
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_answers_jsonb()
RETURNS TRIGGER AS $$
DECLARE
  question_id text;
  answer_value jsonb;
  question_record record;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.answers IS NOT DISTINCT FROM OLD.answers THEN
    RETURN NEW;
  END IF;

  IF NEW.answers IS NULL OR NEW.answers = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  FOR question_id, answer_value IN SELECT * FROM jsonb_each(NEW.answers)
  LOOP
    SELECT q.type, q.template_id, q.choices, qt.default_choices
    INTO question_record
    FROM questions q
    LEFT JOIN question_templates qt ON q.template_id = qt.id
    WHERE q.id = question_id::uuid
      AND q.project_id = NEW.project_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Question % not found in project', question_id;
    END IF;

    PERFORM validate_answer_value(
      answer_value,
      question_record.type,
      COALESCE(question_record.choices, question_record.default_choices)
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
-- Localized views for voter-facing queries
--
-- Resolve JSONB locale columns to plain text strings via get_localized().
--
-- Set the locale before querying:
--   SELECT set_config('app.locale', 'fi', TRUE);
--   SELECT * FROM elections_localized;

CREATE OR REPLACE VIEW elections_localized AS
SELECT
  id,
  project_id,
  get_localized(name, current_setting('app.locale', TRUE),
    (SELECT default_locale FROM projects WHERE id = elections.project_id)) AS name,
  get_localized(short_name, current_setting('app.locale', TRUE),
    (SELECT default_locale FROM projects WHERE id = elections.project_id)) AS short_name,
  get_localized(info, current_setting('app.locale', TRUE),
    (SELECT default_locale FROM projects WHERE id = elections.project_id)) AS info,
  election_date,
  election_start_date,
  election_type,
  multiple_rounds,
  current_round,
  sort_order
FROM elections;

CREATE OR REPLACE VIEW questions_localized AS
SELECT
  id,
  project_id,
  get_localized(name, current_setting('app.locale', TRUE),
    (SELECT default_locale FROM projects WHERE id = questions.project_id)) AS name,
  get_localized(info, current_setting('app.locale', TRUE),
    (SELECT default_locale FROM projects WHERE id = questions.project_id)) AS info,
  type,
  category_id,
  template_id,
  choices,
  settings,
  election_ids,
  constituency_ids,
  entity_type,
  allow_open,
  required,
  sort_order
FROM questions;
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
CREATE INDEX IF NOT EXISTS idx_question_templates_project_id ON question_templates (project_id);
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
CREATE INDEX IF NOT EXISTS idx_questions_template_id ON questions (template_id);
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
-- Row Level Security: deny-all placeholder policies
--
-- Phase 10 will DROP these placeholders and CREATE real role-based policies.

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts_deny_all" ON accounts FOR ALL USING (false);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_deny_all" ON projects FOR ALL USING (false);

ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "elections_deny_all" ON elections FOR ALL USING (false);

ALTER TABLE constituency_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "constituency_groups_deny_all" ON constituency_groups FOR ALL USING (false);

ALTER TABLE constituencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "constituencies_deny_all" ON constituencies FOR ALL USING (false);

ALTER TABLE constituency_group_constituencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "constituency_group_constituencies_deny_all" ON constituency_group_constituencies FOR ALL USING (false);

ALTER TABLE election_constituency_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "election_constituency_groups_deny_all" ON election_constituency_groups FOR ALL USING (false);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizations_deny_all" ON organizations FOR ALL USING (false);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "candidates_deny_all" ON candidates FOR ALL USING (false);

ALTER TABLE factions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "factions_deny_all" ON factions FOR ALL USING (false);

ALTER TABLE alliances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alliances_deny_all" ON alliances FOR ALL USING (false);

ALTER TABLE question_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "question_templates_deny_all" ON question_templates FOR ALL USING (false);

ALTER TABLE question_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "question_categories_deny_all" ON question_categories FOR ALL USING (false);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_deny_all" ON questions FOR ALL USING (false);

ALTER TABLE nominations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nominations_deny_all" ON nominations FOR ALL USING (false);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings_deny_all" ON app_settings FOR ALL USING (false);
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
