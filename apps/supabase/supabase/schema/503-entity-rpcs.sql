-- Entity RPC functions
--
-- Functions:
-- - get_nominations() - return nominations with entity data
-- - get_entity_basic_data() - basic-data projection of an entity the caller holds nomination.read on
-- - get_candidate_user_data() - return the entity row for the authenticated user
-- - upsert_answers() - atomic answer write for a single entity
--------------------------------------------------------------------------------
-- get_nominations RPC: returns nominations with entity data in a single round trip
--
-- p_project_id is REQUIRED and carries no DEFAULT. Every other filter defaults to NULL, meaning no filter, so a defaulted project would let a caller that omits the argument read every project's nominations. It comes first because PostgreSQL forbids a parameter without a default from following one that has a default.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_nominations (
  p_project_id uuid,
  p_election_id uuid DEFAULT NULL,
  p_constituency_id uuid DEFAULT NULL,
  p_include_unconfirmed boolean DEFAULT false,
  p_election_round integer DEFAULT NULL
) RETURNS TABLE (
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
  entity_last_name text
) LANGUAGE sql STABLE SECURITY INVOKER AS $$
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
    c.last_name AS entity_last_name
  FROM public.nominations n
  -- The project term belongs in the JOIN condition, not the WHERE clause. These are LEFT joins and three of the four aliases are NULL on any row, so a WHERE predicate on a right-hand table would discard every nomination whose entity is of another type. In the ON clause a non-matching entity resolves to NULL, which the trailing COALESCE filter handles.
  LEFT JOIN public.candidates c ON n.candidate_id = c.id AND c.project_id = p_project_id
  LEFT JOIN public.organizations o ON n.organization_id = o.id AND o.project_id = p_project_id
  LEFT JOIN public.factions f ON n.faction_id = f.id AND f.project_id = p_project_id
  LEFT JOIN public.alliances a ON n.alliance_id = a.id AND a.project_id = p_project_id
  -- The project predicate is an unconditional equality rather than the `IS NULL OR` shape the other filters use: there is no every-project case.
  WHERE n.project_id = p_project_id
    AND (p_election_id IS NULL OR n.election_id = p_election_id)
    AND (p_constituency_id IS NULL OR n.constituency_id = p_constituency_id)
    AND (p_include_unconfirmed OR n.confirmed)
    -- nominations.election_round is a scalar integer, so this is an equality rather than the array containment that get_questions uses against the JSONB election_rounds on questions and question categories.
    AND (p_election_round IS NULL OR n.election_round = p_election_round)
    -- SECURITY INVOKER means the LEFT JOINs run with the caller's permissions, so RLS-hidden entity rows return NULL on the entity-side columns. Drop rows where every entity-side join resolved to NULL. With the join predicates above, this filter also drops a nomination whose entity belongs to another project.
    --
    -- This filter is defence in depth. `anon_select_nominations` already requires every entity a nomination links to be confirmed, but the terms-of-use clause of `anon_select_candidates` is a candidates-policy term that no nominations predicate restates, so a nomination whose candidate that clause hides is dropped only here.
    AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL
  ORDER BY n.sort_order NULLS LAST, n.id;
$$;

GRANT
EXECUTE ON FUNCTION public.get_nominations (uuid, uuid, uuid, boolean, integer) TO anon,
authenticated;

--------------------------------------------------------------------------------
-- get_entity_basic_data: an entity's BASIC data for a caller holding nomination.read on it
--
-- An entity grantee reads a related entity's basic data through is_child_nominee, but not its answers unless they are public. Row-level security cannot express that, because a SELECT policy that admits a row returns every column of it, so the entity SELECT policies carry no `nomination.read` disjunct (302-rls.sql) and the parent's reach is granted here instead.
--
-- The gate is ONE `user_can ('entity', p_entity_id, 'nomination.read', p_entity_type)` call, so the matrix is asked rather than re-derived: the child-nominee hop is user_can's named branch 2, and every project-scope role holding nomination.read passes through the ordinary reach rules.
--
-- The entity is named by its type and id together, because the four entity tables have independent primary keys and one uuid can name two entities in two projects. The type selects the one table probed, and the gate asks about that same entity.
--
-- The projection is an ALLOW-LIST, not `to_jsonb(row) - <deny-list>`: a column added to an entity table later is withheld until someone decides it is basic data. Withheld today: answers, auth_user_id, terms_of_use_accepted, custom_data, external_id and the two timestamps.
--
-- Returns NULL -- never raises -- when the caller lacks the permission, when the type is NULL, or when the named table holds no row with that id, so the answer does not distinguish "does not exist" from "not yours".
--
-- SECURITY DEFINER because the whole point is to return a row the caller's own SELECT policy refuses; search_path is pinned as on every definer function in this schema. EXECUTE is authenticated only: anon carries no grants claim, so user_can would deny it on every call anyway.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_entity_basic_data (
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_entity_id IS NULL OR NOT public.user_can('entity', p_entity_id, 'nomination.read', p_entity_type) THEN
    RETURN NULL;
  END IF;

  CASE p_entity_type
    WHEN 'candidate' THEN
      SELECT jsonb_build_object(
          'entity_type', 'candidate', 'id', c.id, 'project_id', c.project_id,
          'first_name', c.first_name, 'last_name', c.last_name,
          'short_name', c.short_name, 'info', c.info, 'color', c.color, 'image', c.image,
          'sort_order', c.sort_order, 'subtype', c.subtype, 'confirmed', c.confirmed)
        INTO result
        FROM public.candidates c WHERE c.id = p_entity_id;
    WHEN 'organization' THEN
      SELECT jsonb_build_object(
          'entity_type', 'organization', 'id', o.id, 'project_id', o.project_id,
          'name', o.name, 'short_name', o.short_name, 'info', o.info, 'color', o.color, 'image', o.image,
          'sort_order', o.sort_order, 'subtype', o.subtype, 'confirmed', o.confirmed)
        INTO result
        FROM public.organizations o WHERE o.id = p_entity_id;
    WHEN 'faction' THEN
      SELECT jsonb_build_object(
          'entity_type', 'faction', 'id', f.id, 'project_id', f.project_id,
          'organization_id', f.organization_id,
          'name', f.name, 'short_name', f.short_name, 'info', f.info, 'color', f.color, 'image', f.image,
          'sort_order', f.sort_order, 'subtype', f.subtype, 'confirmed', f.confirmed)
        INTO result
        FROM public.factions f WHERE f.id = p_entity_id;
    WHEN 'alliance' THEN
      SELECT jsonb_build_object(
          'entity_type', 'alliance', 'id', a.id, 'project_id', a.project_id,
          'name', a.name, 'short_name', a.short_name, 'info', a.info, 'color', a.color, 'image', a.image,
          'sort_order', a.sort_order, 'subtype', a.subtype, 'confirmed', a.confirmed)
        INTO result
        FROM public.alliances a WHERE a.id = p_entity_id;
  END CASE;
  RETURN result;
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.get_entity_basic_data (public.entity_type, uuid)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.get_entity_basic_data (public.entity_type, uuid) TO authenticated;

--------------------------------------------------------------------------------
-- get_candidate_user_data: returns the entity row for the authenticated user, in ONE project
--
-- p_project_id is REQUIRED and carries no DEFAULT. One identity may hold entity rows in several projects (identity-callback's lookup allows for it), and without a project term `LIMIT 1` with no ORDER BY would return an arbitrary one of them. It comes first because PostgreSQL forbids a parameter without a default from following one that has a default.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_candidate_user_data (
  p_project_id uuid,
  p_entity_type public.entity_type DEFAULT 'candidate'
) RETURNS TABLE (
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
  last_name text
) LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT c.id, c.project_id, NULL::jsonb, c.short_name, c.info,
         c.color, c.image, c.sort_order, c.subtype,
         c.custom_data, c.answers, c.terms_of_use_accepted,
         c.first_name, c.last_name
  FROM public.candidates c
  WHERE c.auth_user_id = (SELECT auth.uid())
    AND c.project_id = p_project_id
    AND p_entity_type = 'candidate'
  UNION ALL
  SELECT o.id, o.project_id, o.name, o.short_name, o.info,
         o.color, o.image, o.sort_order, o.subtype,
         o.custom_data, o.answers, NULL::timestamptz,
         NULL::text, NULL::text
  FROM public.organizations o
  WHERE o.auth_user_id = (SELECT auth.uid())
    AND o.project_id = p_project_id
    AND p_entity_type = 'organization'
  LIMIT 1;
$$;

GRANT
EXECUTE ON FUNCTION public.get_candidate_user_data (uuid, public.entity_type) TO authenticated;

--------------------------------------------------------------------------------
-- upsert_answers: atomic answer write for a single entity
--
-- The entity is named by its type and id together, because the entity tables have independent primary keys and one UUID can name a candidate and an organization at once. The type selects the one table written: 'candidate' writes public.candidates and 'organization' writes public.organizations, the only two tables carrying an answers column. Any other type, and a NULL type, raises before any table is written.
--
-- p_overwrite = true replaces the stored answers with p_answers; otherwise p_answers is merged over them. Either way, keys whose value is JSON null are dropped.
--
-- SECURITY INVOKER: the UPDATE is gated by the named table's RLS policies, so a caller can update only the answers of an entity those policies let them edit. An id that matches no row the caller may update raises the not-found exception.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_answers (
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_answers jsonb,
  p_overwrite boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  p_updated_answers jsonb;
BEGIN
  CASE p_entity_type
    WHEN 'candidate' THEN
      UPDATE public.candidates
      SET answers = (
        SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
        FROM jsonb_each(
          CASE WHEN p_overwrite THEN '{}'::jsonb ELSE COALESCE(public.candidates.answers, '{}'::jsonb) END
          || COALESCE(p_answers, '{}'::jsonb)
        ) AS t(k, v)
        WHERE v IS NOT NULL AND v != 'null'::jsonb
      )
      WHERE id = p_entity_id
      RETURNING public.candidates.answers INTO p_updated_answers;
    WHEN 'organization' THEN
      UPDATE public.organizations
      SET answers = (
        SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
        FROM jsonb_each(
          CASE WHEN p_overwrite THEN '{}'::jsonb ELSE COALESCE(public.organizations.answers, '{}'::jsonb) END
          || COALESCE(p_answers, '{}'::jsonb)
        ) AS t(k, v)
        WHERE v IS NOT NULL AND v != 'null'::jsonb
      )
      WHERE id = p_entity_id
      RETURNING public.organizations.answers INTO p_updated_answers;
    ELSE
      RAISE EXCEPTION 'Entity type % has no answers', p_entity_type;
  END CASE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entity not found or access denied: %', p_entity_id;
  END IF;

  RETURN p_updated_answers;
END;
$$;

GRANT
EXECUTE ON FUNCTION public.upsert_answers (public.entity_type, uuid, jsonb, boolean) TO authenticated;
