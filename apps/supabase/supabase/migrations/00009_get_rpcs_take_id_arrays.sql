--------------------------------------------------------------------------------
-- get_nominations and get_questions take arrays of election and constituency ids
--
-- WHAT IT CHANGES. Drops public.get_nominations (uuid, uuid, uuid, boolean, integer) and public.get_questions (uuid, uuid, uuid, integer) and recreates them with `p_election_ids uuid[] DEFAULT NULL` and `p_constituency_ids uuid[] DEFAULT NULL` in place of the scalar `p_election_id` and `p_constituency_id`. get_nominations matches a row whose election and constituency are each any one of the given ids; get_questions matches a row whose JSONB id list contains any one of them, and still includes a row whose list is NULL or empty. One call with every selected id returns what the union of one call per (election, constituency) pair returned.
--
-- WHAT IT LEAVES. The required p_project_id, p_include_unconfirmed and p_election_round, the return shapes, the ordering, SECURITY INVOKER and the grants to anon and authenticated, which are re-issued for the new signatures.
--------------------------------------------------------------------------------

DROP FUNCTION public.get_nominations (uuid, uuid, uuid, boolean, integer);

DROP FUNCTION public.get_questions (uuid, uuid, uuid, integer);

CREATE OR REPLACE FUNCTION public.get_nominations (
  p_project_id uuid,
  p_election_ids uuid[] DEFAULT NULL,
  p_constituency_ids uuid[] DEFAULT NULL,
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
    AND (p_election_ids IS NULL OR n.election_id = ANY (p_election_ids))
    AND (p_constituency_ids IS NULL OR n.constituency_id = ANY (p_constituency_ids))
    AND (p_include_unconfirmed OR n.confirmed)
    -- nominations.election_round is a scalar integer, so this is an equality rather than the array containment that get_questions uses against the JSONB election_rounds on questions and question categories.
    AND (p_election_round IS NULL OR n.election_round = p_election_round)
    -- SECURITY INVOKER means the LEFT JOINs run with the caller's permissions, so RLS-hidden entity rows return NULL on the entity-side columns. Drop rows where every entity-side join resolved to NULL. With the join predicates above, this filter also drops a nomination whose entity belongs to another project.
    AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL
  ORDER BY n.sort_order NULLS LAST, n.id;
$$;

GRANT
EXECUTE ON FUNCTION public.get_nominations (uuid, uuid[], uuid[], boolean, integer) TO anon,
authenticated;

CREATE OR REPLACE FUNCTION public.get_questions (
  p_project_id uuid,
  p_election_ids uuid[] DEFAULT NULL,
  p_constituency_ids uuid[] DEFAULT NULL,
  p_election_round integer DEFAULT NULL
) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT jsonb_build_object(
    'categories',
    COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(qc) ORDER BY qc.sort_order NULLS LAST, qc.id)
        FROM public.question_categories qc
        -- The project predicate is an unconditional equality rather than the `IS NULL OR` shape the other three filters use: there is no every-project case. It comes first so the project bound is found without reading past the three optional filters.
        WHERE qc.project_id = p_project_id
          AND (p_election_ids IS NULL
               OR qc.election_ids IS NULL
               OR jsonb_array_length(qc.election_ids) = 0
               OR qc.election_ids ?| p_election_ids::text[])
          AND (p_constituency_ids IS NULL
               OR qc.constituency_ids IS NULL
               OR jsonb_array_length(qc.constituency_ids) = 0
               OR qc.constituency_ids ?| p_constituency_ids::text[])
          AND (p_election_round IS NULL
               OR qc.election_rounds IS NULL
               OR jsonb_array_length(qc.election_rounds) = 0
               OR qc.election_rounds @> to_jsonb(p_election_round))
      ),
      '[]'::jsonb
    ),
    'questions',
    COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(q) ORDER BY q.sort_order NULLS LAST, q.id)
        FROM public.questions q
        WHERE q.project_id = p_project_id
          AND (p_election_ids IS NULL
               OR q.election_ids IS NULL
               OR jsonb_array_length(q.election_ids) = 0
               OR q.election_ids ?| p_election_ids::text[])
          AND (p_constituency_ids IS NULL
               OR q.constituency_ids IS NULL
               OR jsonb_array_length(q.constituency_ids) = 0
               OR q.constituency_ids ?| p_constituency_ids::text[])
          AND (p_election_round IS NULL
               OR q.election_rounds IS NULL
               OR jsonb_array_length(q.election_rounds) = 0
               OR q.election_rounds @> to_jsonb(p_election_round))
      ),
      '[]'::jsonb
    )
  );
$$;

GRANT
EXECUTE ON FUNCTION public.get_questions (uuid, uuid[], uuid[], integer) TO anon,
authenticated;
