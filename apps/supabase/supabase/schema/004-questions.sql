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
