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
