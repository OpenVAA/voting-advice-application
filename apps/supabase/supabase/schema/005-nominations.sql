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

--------------------------------------------------------------------------------
-- get_nominations RPC: returns nominations with entity data in a single round trip
--
-- Joins nominations with all 4 entity tables (candidates, organizations, factions, alliances)
-- to resolve polymorphic entity references. Entity columns are prefixed with entity_ to avoid
-- name collisions with nomination columns.
--
-- LANGUAGE sql: simpler, inlineable by the planner
-- STABLE: reads data but never modifies it
-- SECURITY INVOKER: RLS policies on nominations and entity tables are enforced
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_nominations(
  p_election_id uuid DEFAULT NULL,
  p_constituency_id uuid DEFAULT NULL,
  p_include_unconfirmed boolean DEFAULT false
)
RETURNS TABLE (
  -- Nomination columns
  id uuid,
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  entity_type entity_type,
  candidate_id uuid,
  organization_id uuid,
  faction_id uuid,
  alliance_id uuid,
  election_id uuid,
  constituency_id uuid,
  election_round integer,
  election_symbol text,
  parent_nomination_id uuid,
  -- Entity columns (prefixed to avoid name collision)
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
  -- Candidate-specific entity columns
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
  FROM nominations n
  LEFT JOIN candidates c ON n.candidate_id = c.id
  LEFT JOIN organizations o ON n.organization_id = o.id
  LEFT JOIN factions f ON n.faction_id = f.id
  LEFT JOIN alliances a ON n.alliance_id = a.id
  WHERE (p_election_id IS NULL OR n.election_id = p_election_id)
    AND (p_constituency_id IS NULL OR n.constituency_id = p_constituency_id)
    AND (p_include_unconfirmed OR NOT COALESCE(n.unconfirmed, false))
  ORDER BY n.sort_order NULLS LAST, n.id;
$$;

GRANT EXECUTE ON FUNCTION get_nominations(uuid, uuid, boolean) TO anon, authenticated;

--------------------------------------------------------------------------------
-- get_candidate_user_data: returns the entity row for the authenticated user
--
-- Generic RPC that works for both candidates and organizations by accepting
-- an entity_type parameter. Queries the appropriate table filtered by
-- auth_user_id = auth.uid().
--
-- LANGUAGE sql: simple, inlineable by planner
-- STABLE: reads only
-- SECURITY INVOKER: RLS policies enforced on entity tables
--
-- Returns: single row with all entity columns needed for CandidateUserData.
-- Candidate-only columns (first_name, last_name, organization_id,
-- terms_of_use_accepted) are NULL for organizations.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_candidate_user_data(
  p_entity_type entity_type DEFAULT 'candidate'
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
  FROM candidates c
  WHERE c.auth_user_id = (SELECT auth.uid())
    AND p_entity_type = 'candidate'
  UNION ALL
  SELECT o.id, o.project_id, o.name, o.short_name, o.info,
         o.color, o.image, o.sort_order, o.subtype,
         o.custom_data, o.answers, NULL::timestamptz,
         NULL::text, NULL::text, NULL::uuid
  FROM organizations o
  WHERE o.auth_user_id = (SELECT auth.uid())
    AND p_entity_type = 'organization'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_candidate_user_data(entity_type) TO authenticated;
