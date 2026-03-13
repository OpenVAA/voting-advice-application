-- Migration: Create all content entity tables and localized views
-- Phase 9 Plan 01 Task 2
--
-- All content tables share a common column set from DataObjectData:
--   id, project_id, name, short_name, info, color, color_dark, image,
--   sort_order, subtype, custom_data, is_generated, created_at, updated_at
--
-- Tables created:
--   elections, constituency_groups, constituencies,
--   constituency_group_constituencies (join), election_constituency_groups (join),
--   organizations, candidates, factions, alliances,
--   question_templates, question_categories, questions, nominations
--
-- Localized views:
--   elections_localized, questions_localized

--------------------------------------------------------------------------------
-- elections
--------------------------------------------------------------------------------
CREATE TABLE elections (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid        NOT NULL REFERENCES projects(id),
  name               jsonb,
  short_name         jsonb,
  info               jsonb,
  color              text,
  color_dark         text,
  image              jsonb,
  sort_order         integer,
  subtype            text,
  custom_data        jsonb,
  is_generated       boolean     DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  -- Entity-specific columns
  election_date      date,
  election_start_date date,
  election_type      text,
  multiple_rounds    boolean     DEFAULT false,
  current_round      integer     DEFAULT 1
);

--------------------------------------------------------------------------------
-- constituency_groups
--------------------------------------------------------------------------------
CREATE TABLE constituency_groups (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid        NOT NULL REFERENCES projects(id),
  name               jsonb,
  short_name         jsonb,
  info               jsonb,
  color              text,
  color_dark         text,
  image              jsonb,
  sort_order         integer,
  subtype            text,
  custom_data        jsonb,
  is_generated       boolean     DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

--------------------------------------------------------------------------------
-- constituencies
--------------------------------------------------------------------------------
CREATE TABLE constituencies (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid        NOT NULL REFERENCES projects(id),
  name               jsonb,
  short_name         jsonb,
  info               jsonb,
  color              text,
  color_dark         text,
  image              jsonb,
  sort_order         integer,
  subtype            text,
  custom_data        jsonb,
  is_generated       boolean     DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  -- Entity-specific columns
  keywords           jsonb,
  parent_id          uuid        REFERENCES constituencies(id)
);

--------------------------------------------------------------------------------
-- constituency_group_constituencies (join table)
--------------------------------------------------------------------------------
CREATE TABLE constituency_group_constituencies (
  constituency_group_id uuid NOT NULL REFERENCES constituency_groups(id) ON DELETE CASCADE,
  constituency_id       uuid NOT NULL REFERENCES constituencies(id) ON DELETE CASCADE,
  PRIMARY KEY (constituency_group_id, constituency_id)
);

--------------------------------------------------------------------------------
-- election_constituency_groups (join table)
--------------------------------------------------------------------------------
CREATE TABLE election_constituency_groups (
  election_id           uuid NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  constituency_group_id uuid NOT NULL REFERENCES constituency_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (election_id, constituency_group_id)
);

--------------------------------------------------------------------------------
-- organizations (maps to @openvaa/data Organization / Strapi "party")
--------------------------------------------------------------------------------
CREATE TABLE organizations (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid        NOT NULL REFERENCES projects(id),
  name               jsonb,
  short_name         jsonb,
  info               jsonb,
  color              text,
  color_dark         text,
  image              jsonb,
  sort_order         integer,
  subtype            text,
  custom_data        jsonb,
  is_generated       boolean     DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

--------------------------------------------------------------------------------
-- candidates
--------------------------------------------------------------------------------
CREATE TABLE candidates (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid        NOT NULL REFERENCES projects(id),
  name               jsonb,
  short_name         jsonb,
  info               jsonb,
  color              text,
  color_dark         text,
  image              jsonb,
  sort_order         integer,
  subtype            text,
  custom_data        jsonb,
  is_generated       boolean     DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  -- Entity-specific columns
  first_name         text        NOT NULL,
  last_name          text        NOT NULL,
  organization_id    uuid        REFERENCES organizations(id)
  -- Note: auth_user_id is added in Phase 10 (Authentication)
);

--------------------------------------------------------------------------------
-- factions
--------------------------------------------------------------------------------
CREATE TABLE factions (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid        NOT NULL REFERENCES projects(id),
  name               jsonb,
  short_name         jsonb,
  info               jsonb,
  color              text,
  color_dark         text,
  image              jsonb,
  sort_order         integer,
  subtype            text,
  custom_data        jsonb,
  is_generated       boolean     DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

--------------------------------------------------------------------------------
-- alliances
--------------------------------------------------------------------------------
CREATE TABLE alliances (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid        NOT NULL REFERENCES projects(id),
  name               jsonb,
  short_name         jsonb,
  info               jsonb,
  color              text,
  color_dark         text,
  image              jsonb,
  sort_order         integer,
  subtype            text,
  custom_data        jsonb,
  is_generated       boolean     DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

--------------------------------------------------------------------------------
-- question_templates (maps to Strapi "QuestionType" concept)
--
-- Valid type values (QuestionType enum):
--   'text', 'number', 'boolean', 'image', 'date', 'multipleText',
--   'singleChoiceOrdinal', 'singleChoiceCategorical', 'multipleChoiceCategorical'
--------------------------------------------------------------------------------
CREATE TABLE question_templates (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid        NOT NULL REFERENCES projects(id),
  name               jsonb,
  short_name         jsonb,
  info               jsonb,
  color              text,
  color_dark         text,
  image              jsonb,
  sort_order         integer,
  subtype            text,
  custom_data        jsonb,
  is_generated       boolean     DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  -- Entity-specific columns
  type               text        NOT NULL
    CHECK (type IN (
      'text', 'number', 'boolean', 'image', 'date', 'multipleText',
      'singleChoiceOrdinal', 'singleChoiceCategorical', 'multipleChoiceCategorical'
    )),
  settings           jsonb,
  default_choices    jsonb
);

--------------------------------------------------------------------------------
-- question_categories
--------------------------------------------------------------------------------
CREATE TABLE question_categories (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid        NOT NULL REFERENCES projects(id),
  name               jsonb,
  short_name         jsonb,
  info               jsonb,
  color              text,
  color_dark         text,
  image              jsonb,
  sort_order         integer,
  subtype            text,
  custom_data        jsonb,
  is_generated       boolean     DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  -- Entity-specific columns
  category_type      text        DEFAULT 'opinion',
  election_ids       jsonb,
  election_rounds    jsonb,
  constituency_ids   jsonb,
  entity_type        jsonb
);

--------------------------------------------------------------------------------
-- questions
--
-- Valid type values (QuestionType enum):
--   'text', 'number', 'boolean', 'image', 'date', 'multipleText',
--   'singleChoiceOrdinal', 'singleChoiceCategorical', 'multipleChoiceCategorical'
--------------------------------------------------------------------------------
CREATE TABLE questions (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid        NOT NULL REFERENCES projects(id),
  name               jsonb,
  short_name         jsonb,
  info               jsonb,
  color              text,
  color_dark         text,
  image              jsonb,
  sort_order         integer,
  subtype            text,
  custom_data        jsonb,
  is_generated       boolean     DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  -- Entity-specific columns
  type               text        NOT NULL
    CHECK (type IN (
      'text', 'number', 'boolean', 'image', 'date', 'multipleText',
      'singleChoiceOrdinal', 'singleChoiceCategorical', 'multipleChoiceCategorical'
    )),
  category_id        uuid        NOT NULL REFERENCES question_categories(id),
  template_id        uuid        REFERENCES question_templates(id),
  choices            jsonb,
  settings           jsonb,
  election_ids       jsonb,
  election_rounds    jsonb,
  constituency_ids   jsonb,
  entity_type        jsonb,
  allow_open         boolean     DEFAULT true,
  required           boolean     DEFAULT true
);

--------------------------------------------------------------------------------
-- nominations
--
-- entity_id is polymorphic: it references candidates, organizations, factions,
-- or alliances depending on entity_type. A simple FK is not possible because
-- the target table varies. Trigger-based validation of entity_id against the
-- correct table is deferred to Phase 10 (Authentication and Roles).
--------------------------------------------------------------------------------
CREATE TABLE nominations (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            uuid        NOT NULL REFERENCES projects(id),
  name                  jsonb,
  short_name            jsonb,
  info                  jsonb,
  color                 text,
  color_dark            text,
  image                 jsonb,
  sort_order            integer,
  subtype               text,
  custom_data           jsonb,
  is_generated          boolean     DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  -- Entity-specific columns
  entity_type           text        NOT NULL
    CHECK (entity_type IN ('candidate', 'organization', 'faction', 'alliance')),
  entity_id             uuid        NOT NULL,
  election_id           uuid        NOT NULL REFERENCES elections(id),
  constituency_id       uuid        NOT NULL REFERENCES constituencies(id),
  election_round        integer     DEFAULT 1,
  election_symbol       text,
  parent_nomination_id  uuid        REFERENCES nominations(id),
  parent_entity_type    text,
  unconfirmed           boolean     DEFAULT false
);

COMMENT ON COLUMN nominations.entity_id IS
  'Polymorphic FK: references candidates, organizations, factions, or alliances '
  'based on entity_type. Cannot use a simple FK constraint. '
  'Trigger validation deferred to Phase 10.';

--------------------------------------------------------------------------------
-- updated_at triggers for all content tables (not join tables)
--------------------------------------------------------------------------------
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON elections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON constituency_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON constituencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON factions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON alliances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON question_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON question_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON nominations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

--------------------------------------------------------------------------------
-- Localized views for voter-facing queries
--
-- These views use get_localized() with current_setting('app.locale', TRUE) to
-- resolve JSONB locale columns to plain text strings. Per CONTEXT.md decision:
-- "Voter-facing queries return resolved strings only (flat text, not JSONB)."
--
-- Set the locale before querying:
--   SELECT set_config('app.locale', 'fi', TRUE);
--   SELECT * FROM elections_localized;
--------------------------------------------------------------------------------

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
