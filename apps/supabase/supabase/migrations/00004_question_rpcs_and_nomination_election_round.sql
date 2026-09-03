-- Migration 00004: Add the get_questions RPC and give get_nominations an election-round filter
--
-- Background: the voter app assembled its question data client-side in two round trips, reading every question category, filtering them in TypeScript by election only, and then reading the questions belonging to whichever categories survived. That assembly could not filter questions at all, and an empty filtered category list read the whole questions table. Both filter columns exist in SQL on both tables for all three axes, so get_questions replaces the assembly with one call that filters categories and questions alike by election, constituency and election round.
--
-- Applies to schema files:
--   - apps/supabase/supabase/schema/505-question-rpcs.sql (get_questions, new file)
--   - apps/supabase/supabase/schema/503-entity-rpcs.sql (get_nominations)

BEGIN;

-- =====================================================================
-- 1. get_questions: categories and their questions in one round trip
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_questions(
  p_election_id uuid DEFAULT NULL,
  p_constituency_id uuid DEFAULT NULL,
  p_election_round integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT jsonb_build_object(
    'categories',
    COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(qc) ORDER BY qc.sort_order NULLS LAST, qc.id)
        FROM public.question_categories qc
        WHERE (p_election_id IS NULL
               OR qc.election_ids IS NULL
               OR jsonb_array_length(qc.election_ids) = 0
               OR qc.election_ids @> to_jsonb(p_election_id::text))
          AND (p_constituency_id IS NULL
               OR qc.constituency_ids IS NULL
               OR jsonb_array_length(qc.constituency_ids) = 0
               OR qc.constituency_ids @> to_jsonb(p_constituency_id::text))
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
        WHERE (p_election_id IS NULL
               OR q.election_ids IS NULL
               OR jsonb_array_length(q.election_ids) = 0
               OR q.election_ids @> to_jsonb(p_election_id::text))
          AND (p_constituency_id IS NULL
               OR q.constituency_ids IS NULL
               OR jsonb_array_length(q.constituency_ids) = 0
               OR q.constituency_ids @> to_jsonb(p_constituency_id::text))
          AND (p_election_round IS NULL
               OR q.election_rounds IS NULL
               OR jsonb_array_length(q.election_rounds) = 0
               OR q.election_rounds @> to_jsonb(p_election_round))
      ),
      '[]'::jsonb
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_questions(uuid, uuid, integer) TO anon, authenticated;

-- =====================================================================
-- 2. get_nominations gains a p_election_round filter
-- =====================================================================

-- The parameter is appended last, so the signature changes and CREATE OR REPLACE would add a second overload rather than replace the existing function. Two overloads make PostgREST answer with PGRST203 ambiguity at runtime, so the three-argument form is dropped first. Dropping it also drops its grant, which is why the grant below is re-issued with the full four-argument type list.
DROP FUNCTION IF EXISTS public.get_nominations(uuid, uuid, boolean);

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

COMMIT;
