-- Migration 00002: Tighten anon visibility of candidates + filter RLS-blocked nominations out of get_nominations
--
-- Background: under the previous `published = true` rule, a candidate seeded with terms_of_use_accepted = NULL was still visible to the voter app, so a candidate who had never accepted the terms of use could be browsed and matched against. An end-to-end voter walkthrough surfaced the gap.
-- This migration:
--   1. Tightens `anon_select_candidates` to also require `terms_of_use_accepted IS NOT NULL AND terms_of_use_accepted < now()`.
--   2. Updates `get_nominations` to skip rows whose entity-side join returned NULL (which happens when SECURITY INVOKER RLS blocks the candidate / org / faction / alliance read but the nomination row itself is still visible).
--
-- Applies to schema files:
--   - apps/supabase/supabase/schema/302-rls.sql (anon_select_candidates)
--   - apps/supabase/supabase/schema/503-entity-rpcs.sql (get_nominations)

BEGIN;

-- =====================================================================
-- 1. Tighten anon_select_candidates RLS policy
-- =====================================================================

DROP POLICY IF EXISTS "anon_select_candidates" ON public.candidates;

CREATE POLICY "anon_select_candidates" ON public.candidates FOR SELECT TO anon
  USING (
    published = true
    AND terms_of_use_accepted IS NOT NULL
    AND terms_of_use_accepted < now()
  );

-- =====================================================================
-- 2. Update get_nominations to filter RLS-blocked entity rows
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_nominations(
  p_election_id uuid DEFAULT NULL,
  p_constituency_id uuid DEFAULT NULL,
  p_include_unconfirmed boolean DEFAULT false
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
    AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL
  ORDER BY n.sort_order NULLS LAST, n.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_nominations(uuid, uuid, boolean) TO anon, authenticated;

COMMIT;
