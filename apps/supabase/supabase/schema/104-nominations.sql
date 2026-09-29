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
-- Parent-child nominations must share election_id, constituency_id, and election_round (also enforced by trigger).
CREATE TABLE public.nominations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- Localized string `{ "<locale>": string }`.
  name jsonb,
  -- Localized string `{ "<locale>": string }`: the abbreviated name.
  short_name jsonb,
  -- Localized string `{ "<locale>": string }`: a longer description.
  info jsonb,
  -- `Colors` from @openvaa/data: `{ normal, dark? }`, colour strings for the default and dark themes.
  color jsonb,
  -- `StoredImage` from @openvaa/app-shared: storage paths in the public-assets bucket, not URLs.
  image jsonb,
  -- Ascending display order, nulls last.
  sort_order integer,
  -- A free-text label that tells apart objects of the same kind.
  subtype text,
  -- A free-form JSON object, read by the frontend as `customData`; `requestedParentOrganization` marks a candidate waiting for a party that is not in the system, and blocks confirmation.
  custom_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- The user who created the row, which the cap on unconfirmed parent nominations counts. It defaults to the caller and is outside the authenticated column grants, so an authenticated caller can neither set nor rewrite it. Null on service-role and owner inserts, which have no calling user, and set to null when the user is deleted so the row survives.
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL DEFAULT auth.uid (),
  -- Entity FK columns: exactly one must be set
  candidate_id uuid REFERENCES public.candidates (id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations (id) ON DELETE CASCADE,
  faction_id uuid REFERENCES public.factions (id) ON DELETE CASCADE,
  alliance_id uuid REFERENCES public.alliances (id) ON DELETE CASCADE,
  -- Which entity kind the row nominates, generated from the one entity foreign key that is set.
  entity_type public.entity_type NOT NULL GENERATED ALWAYS AS (
    CASE
      WHEN candidate_id IS NOT NULL THEN 'candidate'::public.entity_type
      WHEN organization_id IS NOT NULL THEN 'organization'::public.entity_type
      WHEN faction_id IS NOT NULL THEN 'faction'::public.entity_type
      WHEN alliance_id IS NOT NULL THEN 'alliance'::public.entity_type
    END
  ) STORED,
  -- Election context
  election_id uuid NOT NULL REFERENCES public.elections (id) ON DELETE CASCADE,
  constituency_id uuid NOT NULL REFERENCES public.constituencies (id) ON DELETE CASCADE,
  -- The round the nomination is for, counted from 1.
  election_round integer DEFAULT 1,
  -- The symbol, usually a number, marked on the ballot instead of the nominee's name.
  election_symbol text,
  -- The nomination this one sits under, per the hierarchy above. NO ACTION, not CASCADE, so deleting a parent never silently deletes the nominations under it: the delete is refused while children remain. NO ACTION rather than RESTRICT because the check runs at the end of the statement, which lets bulk_delete remove a parent and its children in one statement.
  parent_nomination_id uuid REFERENCES public.nominations (id) ON DELETE NO ACTION,
  -- Whether an admin has confirmed the nomination; it is public only when this is true. The default is load-bearing: the column is absent from the INSERT column grant in 303-column-grants.sql, so every row an authenticated caller inserts starts unconfirmed.
  confirmed boolean NOT NULL DEFAULT false,
  -- The import key bulk_import matches rows by; unique per project and unchangeable once set (500-external-id.sql).
  external_id text,
  -- Exactly one entity FK must be set
  CHECK (
    num_nonnulls (
      candidate_id,
      organization_id,
      faction_id,
      alliance_id
    ) = 1
  ),
  -- An entity is nominated at most once per election, constituency and round under the same parent. A different parent makes a distinct nomination, such as one presidential candidate nominated by three parties.
  --
  -- `NULLS NOT DISTINCT` is what makes the constraint catch anything: every row has three null entity foreign keys and every top-level nomination a null parent, so a plain UNIQUE would never find two rows equal. It needs PostgreSQL 15, which `supabase/config.toml` declares, and the applied database is checked through `pg_index.indnullsnotdistinct`.
  --
  -- Named so a pgTAP `throws_ok` can match it.
  CONSTRAINT nominations_entity_parent_contest_key UNIQUE NULLS NOT DISTINCT (
    candidate_id,
    faction_id,
    organization_id,
    alliance_id,
    parent_nomination_id,
    election_id,
    constituency_id,
    election_round
  ),
  -- Election rounds are numbered from one. Named so a pgTAP `throws_ok` can match it; the name is the one PostgreSQL would generate.
  CONSTRAINT nominations_election_round_check CHECK (election_round >= 1)
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

CREATE TRIGGER validate_nomination_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.validate_nomination ();

-- Holds the presentation and bookkeeping columns and the entity foreign keys unset or unchanged for a caller without `project.edit_nominations`. 303-column-grants.sql cannot tell that caller from an admin; this trigger can.
CREATE TRIGGER enforce_nomination_columns_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.enforce_nomination_entity_columns ();

-- Editing a nomination turns its confirmation off. The system rewrites the row, so this is a trigger rather than a policy, which can refuse a row but not rewrite it.
CREATE TRIGGER enforce_nomination_confirmation_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.enforce_nomination_confirmation ();
