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
