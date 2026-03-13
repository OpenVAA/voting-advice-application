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
