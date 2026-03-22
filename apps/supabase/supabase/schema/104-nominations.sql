-- Nominations
--
-- Uses separate FK columns for each entity type instead of polymorphic entity_id.
-- entity_type is a generated column derived from which FK is set.
--
-- Hierarchy (enforced by validate_nomination trigger):
--   alliance    -> no parent
--   organization -> parent: alliance (or standalone)
--   faction     -> parent: organization (required)
--   candidate   -> parent: organization or faction (or standalone)
--
-- Parent-child nominations must share election_id, constituency_id, and
-- election_round (also enforced by trigger).

CREATE TABLE public.nominations (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
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
  candidate_id         uuid        REFERENCES public.candidates(id) ON DELETE CASCADE,
  organization_id      uuid        REFERENCES public.organizations(id) ON DELETE CASCADE,
  faction_id           uuid        REFERENCES public.factions(id) ON DELETE CASCADE,
  alliance_id          uuid        REFERENCES public.alliances(id) ON DELETE CASCADE,
  -- Generated entity_type from FK columns
  entity_type          public.entity_type NOT NULL GENERATED ALWAYS AS (
    CASE
      WHEN candidate_id IS NOT NULL THEN 'candidate'::public.entity_type
      WHEN organization_id IS NOT NULL THEN 'organization'::public.entity_type
      WHEN faction_id IS NOT NULL THEN 'faction'::public.entity_type
      WHEN alliance_id IS NOT NULL THEN 'alliance'::public.entity_type
    END
  ) STORED,
  -- Election context
  election_id          uuid        NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  constituency_id      uuid        NOT NULL REFERENCES public.constituencies(id) ON DELETE CASCADE,
  election_round       integer     DEFAULT 1,
  election_symbol      text,
  -- Nesting
  parent_nomination_id uuid        REFERENCES public.nominations(id) ON DELETE CASCADE,
  unconfirmed          boolean     DEFAULT false,
  -- Exactly one entity FK must be set
  CHECK (num_nonnulls(candidate_id, organization_id, faction_id, alliance_id) = 1)
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.nominations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER validate_nomination_before_insert_or_update
  BEFORE INSERT OR UPDATE ON public.nominations
  FOR EACH ROW EXECUTE FUNCTION public.validate_nomination();
