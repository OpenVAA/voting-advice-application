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

-- Terms-of-use acceptance tracking: nullable timestamptz
-- NULL = not yet accepted. Set by candidate when accepting ToU.
-- Existing column-level GRANT in 013-auth-rls.sql must include this column (see that file).
ALTER TABLE candidates ADD COLUMN terms_of_use_accepted timestamptz;

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
