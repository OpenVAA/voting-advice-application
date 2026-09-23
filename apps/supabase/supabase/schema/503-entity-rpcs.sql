-- Entity RPC functions
--
-- Functions:
--   get_nominations()         - return nominations with entity data get_entity_basic_data() - basic-data projection of an entity the caller holds nomination.read on get_candidate_user_data() - return entity row for authenticated user upsert_answers()          - atomic answer write for a single entity
--------------------------------------------------------------------------------
-- get_nominations RPC: returns nominations with entity data in a single round trip
--
-- p_project_id is REQUIRED and carries no DEFAULT. Every other filter defaults NULL, and NULL means "no filter", so a defaulted project would let a caller that forgets the argument read every project's nominations without anything saying so. It comes first because PostgreSQL forbids a parameter without a default from following one that has a default.
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
  -- The project term belongs in the JOIN condition and not in the WHERE clause. These are LEFT joins: a WHERE predicate on the right-hand table would discard every nomination whose entity is of a different type (three of the four aliases are NULL on any given row), turning the whole result set empty. In the ON clause a non-matching entity simply resolves to NULL, which is what the trailing COALESCE filter is already written to handle.
  LEFT JOIN public.candidates c ON n.candidate_id = c.id AND c.project_id = p_project_id
  LEFT JOIN public.organizations o ON n.organization_id = o.id AND o.project_id = p_project_id
  LEFT JOIN public.factions f ON n.faction_id = f.id AND f.project_id = p_project_id
  LEFT JOIN public.alliances a ON n.alliance_id = a.id AND a.project_id = p_project_id
  -- The project predicate is an unconditional equality rather than the `IS NULL OR` shape the other filters use, because there is no "every project" case: a caller without a project is a caller that should not be reading nominations at all.
  WHERE n.project_id = p_project_id
    AND (p_election_id IS NULL OR n.election_id = p_election_id)
    AND (p_constituency_id IS NULL OR n.constituency_id = p_constituency_id)
    AND (p_include_unconfirmed OR n.confirmed)
    -- nominations.election_round is a scalar integer, so this is an equality rather than the array containment that get_questions uses against the JSONB election_rounds on questions and question categories.
    AND (p_election_round IS NULL OR n.election_round = p_election_round)
    -- SECURITY INVOKER means the LEFT JOINs run with the caller's permissions, so RLS-hidden entity rows return NULL on the entity-side columns. Drop rows where every entity-side join resolved to NULL. With the join predicates above, this filter also drops a nomination whose entity belongs to another project.
    --
    -- ⚠ NARROWER SINCE 162-08, AND KEPT AS DEFENCE IN DEPTH RATHER THAN REMOVED. This filter was written when the nomination row carried no gate of its own beyond its own policy: an entity hidden by `anon_select_candidates`' terms-of-use clause would still have left its nomination visible, and this line is what stopped the leak. Since 162-08 `anon_select_nominations` carries the transitive conjunct itself -- every entity a nomination links must be confirmed -- so the class of row this filter still catches is smaller than the class it was written for. 162-08 recorded the narrowing as a note for 162-16 rather than as an action, and 162-16 records it again and CHANGES NOTHING: the remaining class is not empty (the terms-of-use clause is a candidates-policy term that no nominations predicate restates), and deleting a defence-in-depth filter inside a comment sweep is the silent change this phase exists to prevent.
    AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL
  ORDER BY n.sort_order NULLS LAST, n.id;
$$;

GRANT
EXECUTE ON FUNCTION public.get_nominations (uuid, uuid, uuid, boolean, integer) TO anon,
authenticated;

--------------------------------------------------------------------------------
-- get_entity_basic_data: an entity's BASIC data for a caller holding nomination.read on it (162-REVIEW CR-02)
--
-- SPEC section 7 row 3: an entity grantee reads, via is_child_nominee, a related entity's basic data only -- not its answers unless public. Row-level security cannot express that, because a SELECT policy that admits a row returns every column of it; the four entity SELECT policies therefore no longer carry a `nomination.read` disjunct (302-rls.sql), and this function is where the parent's reach lives instead.
--
-- The gate is ONE `user_can ('entity', p_entity_id, 'nomination.read')` call, so the matrix is asked rather than re-derived: the child-nominee hop is user_can's named branch 2, and every project-scope role holding nomination.read passes through the ordinary reach rules.
--
-- The projection is an ALLOW-LIST, not `to_jsonb(row) - <deny-list>`: a column added to an entity table later is withheld until someone decides it is basic data. Withheld today: answers, auth_user_id, terms_of_use_accepted, custom_data, is_generated, external_id and the two timestamps.
--
-- Returns NULL -- never raises -- when the caller lacks the permission or the id is in no entity table, so the answer does not distinguish "does not exist" from "not yours".
--
-- SECURITY DEFINER because the whole point is to return a row the caller's own SELECT policy refuses; search_path is pinned as on every definer function in this schema. EXECUTE is authenticated only: anon carries no grants claim, so user_can would deny it on every call anyway.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_entity_basic_data (p_entity_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_entity_id IS NULL OR NOT public.user_can('entity', p_entity_id, 'nomination.read') THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
      'entity_type', 'candidate', 'id', c.id, 'project_id', c.project_id,
      'first_name', c.first_name, 'last_name', c.last_name,
      'short_name', c.short_name, 'info', c.info, 'color', c.color, 'image', c.image,
      'sort_order', c.sort_order, 'subtype', c.subtype, 'confirmed', c.confirmed)
    INTO result
    FROM public.candidates c WHERE c.id = p_entity_id;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT jsonb_build_object(
      'entity_type', 'organization', 'id', o.id, 'project_id', o.project_id,
      'name', o.name, 'short_name', o.short_name, 'info', o.info, 'color', o.color, 'image', o.image,
      'sort_order', o.sort_order, 'subtype', o.subtype, 'confirmed', o.confirmed)
    INTO result
    FROM public.organizations o WHERE o.id = p_entity_id;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT jsonb_build_object(
      'entity_type', 'faction', 'id', f.id, 'project_id', f.project_id,
      'organization_id', f.organization_id,
      'name', f.name, 'short_name', f.short_name, 'info', f.info, 'color', f.color, 'image', f.image,
      'sort_order', f.sort_order, 'subtype', f.subtype, 'confirmed', f.confirmed)
    INTO result
    FROM public.factions f WHERE f.id = p_entity_id;
  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT jsonb_build_object(
      'entity_type', 'alliance', 'id', a.id, 'project_id', a.project_id,
      'name', a.name, 'short_name', a.short_name, 'info', a.info, 'color', a.color, 'image', a.image,
      'sort_order', a.sort_order, 'subtype', a.subtype, 'confirmed', a.confirmed)
    INTO result
    FROM public.alliances a WHERE a.id = p_entity_id;
  RETURN result;
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.get_entity_basic_data (uuid)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.get_entity_basic_data (uuid) TO authenticated;

--------------------------------------------------------------------------------
-- get_candidate_user_data: returns the entity row for the authenticated user, in ONE project
--
-- p_project_id is REQUIRED and carries no DEFAULT (162-REVIEW WR-08). One identity may legitimately hold entity rows in several projects -- identity-callback's own lookup says so -- and without a project term this function ended `LIMIT 1` over all of them with no ORDER BY, so a multi-project user got an arbitrary row and the adapter's own project check then failed at random. It comes first because PostgreSQL forbids a parameter without a default from following one that has a default.
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
-- Covers every entity table carrying an answers column, which is exactly public.candidates and public.organizations; factions and alliances carry no such column.
--
-- Adjacency: candidates are tried first and the organizations attempt runs only when the candidate update matched no row, so one call never writes both tables. That much is enforced by the control flow.
--
-- What is NOT enforced, stated so it is not read as a guarantee: nothing in the schema makes public.candidates.id and public.organizations.id disjoint. They are independent gen_random_uuid() defaults, so a collision cannot arise by accident - but id is a writable, importable column (it is in the dev-seed allowlist, and bulk_import builds its INSERT column list from the JSON keys it is handed), so a hand-authored template or an external import that reuses one UUID across the two tables would make the CANDIDATE branch match and land an intended organization answer on the candidate row, returning success. Disjointness is a convention this function relies on and does not check. If that ever stops being safe, take the entity table from the caller rather than inferring it from which UPDATE matched.
--
-- SECURITY INVOKER: runs with caller's permissions, so each branch's UPDATE is gated by that table's own RLS policies - a candidate can only update their own row, an organization admin only their own organization.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_answers (
  p_entity_id uuid,
  p_answers jsonb,
  p_overwrite boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
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

GRANT
EXECUTE ON FUNCTION public.upsert_answers (uuid, jsonb, boolean) TO authenticated;
