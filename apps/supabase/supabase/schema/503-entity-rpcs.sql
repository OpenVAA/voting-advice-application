-- Entity RPC functions
--
-- Functions:
--   get_nominations()         - return nominations with entity data get_candidate_user_data() - return entity row for authenticated user upsert_answers()          - atomic answer write for a single entity

--------------------------------------------------------------------------------
-- get_nominations RPC: returns nominations with entity data in a single round trip
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_nominations(
  p_election_id uuid DEFAULT NULL,
  p_constituency_id uuid DEFAULT NULL,
  p_include_unconfirmed boolean DEFAULT false,
  p_election_round integer DEFAULT NULL
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
    COALESCE(o.name, f.name, a.name) AS entity_name,
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
    -- nominations.election_round is a scalar integer, so this is an equality rather than the array containment that get_questions uses against the JSONB election_rounds on questions and question categories.
    AND (p_election_round IS NULL OR n.election_round = p_election_round)
    -- SECURITY INVOKER means the LEFT JOINs run with the caller's permissions, so RLS-hidden entity rows return NULL on the entity-side columns. The nomination row itself has no published/ToU gate, so we would otherwise leak nominations whose underlying entity is hidden by `anon_select_candidates`. Drop rows where every entity-side join resolved to NULL.
    AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL
  ORDER BY n.sort_order NULLS LAST, n.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_nominations(uuid, uuid, boolean, integer) TO anon, authenticated;

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
  SELECT c.id, c.project_id, NULL::jsonb, c.short_name, c.info,
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
-- Covers every entity table carrying an answers column, which is exactly public.candidates and public.organizations; factions and alliances carry no such column.
--
-- Adjacency: candidates are tried first and the organizations attempt runs only when the candidate update matched no row, so one call never writes both tables. That much is enforced by the control flow.
--
-- What is NOT enforced, stated so it is not read as a guarantee: nothing in the schema makes public.candidates.id and public.organizations.id disjoint. They are independent gen_random_uuid() defaults, so a collision cannot arise by accident - but id is a writable, importable column (it is in the dev-seed allowlist, and bulk_import builds its INSERT column list from the JSON keys it is handed), so a hand-authored template or an external import that reuses one UUID across the two tables would make the CANDIDATE branch match and land an intended organization answer on the candidate row, returning success. Disjointness is a convention this function relies on and does not check. If that ever stops being safe, take the entity table from the caller rather than inferring it from which UPDATE matched.
--
-- SECURITY INVOKER: runs with caller's permissions, so each branch's UPDATE is gated by that table's own RLS policies - a candidate can only update their own row, an organization admin only their own organization.
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

    IF NOT FOUND THEN
      UPDATE public.organizations
      SET answers = (
        SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
        FROM jsonb_each(COALESCE(p_answers, '{}'::jsonb)) AS t(k, v)
        WHERE v IS NOT NULL AND v != 'null'::jsonb
      )
      WHERE id = p_entity_id
      RETURNING public.organizations.answers INTO p_updated_answers;
    END IF;
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

    IF NOT FOUND THEN
      UPDATE public.organizations
      SET answers = (
        SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
        FROM jsonb_each(
          COALESCE(public.organizations.answers, '{}'::jsonb) || COALESCE(p_answers, '{}'::jsonb)
        ) AS t(k, v)
        WHERE v IS NOT NULL AND v != 'null'::jsonb
      )
      WHERE id = p_entity_id
      RETURNING public.organizations.answers INTO p_updated_answers;
    END IF;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entity not found or access denied: %', p_entity_id;
  END IF;

  RETURN p_updated_answers;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_answers(uuid, jsonb, boolean) TO authenticated;
