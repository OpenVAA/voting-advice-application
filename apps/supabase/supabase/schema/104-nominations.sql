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
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  is_generated boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- WHO ORIGINATED THIS ROW. Added by 162-12 (task 2 Q1 = A) because section 8.9 asks for two things the schema could not do: a CAP on how many unconfirmed parent nominations one candidate may originate, and an ADMIN QUEUE showing who created each. A cap needs a subject and the queue has nothing to show, so the cap was never a number waiting to be chosen -- it is a column plus a number, and this column is what section 8.9's second half asks for in its own words.
  --
  -- ⚠ TWO PROPERTIES MAKE THE CAP A CAP RATHER THAN A SUGGESTION, and only one of them is visible here.
  -- It DEFAULTS to the calling user, so an honest insert records the caller without naming the column; and it is ABSENT from the INSERT column grant in 303-column-grants.sql, so a caller who names it is refused at privilege level before any policy is consulted. Without that absence the cap would count a value the capped party chooses.
  --
  -- NULLABLE, and the nullability is honest rather than lax: the service-role and owner paths have NO calling user, so `auth.uid()` is NULL for every seeded and every pgTAP-inserted row. A NOT NULL column here would either block those paths or force them to invent an author. `ON DELETE SET NULL` so that deleting an account does not take nomination rows with it -- the row outlives its originator, which is what an audit column is for.
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL DEFAULT auth.uid (),
  -- Entity FK columns: exactly one must be set
  candidate_id uuid REFERENCES public.candidates (id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations (id) ON DELETE CASCADE,
  faction_id uuid REFERENCES public.factions (id) ON DELETE CASCADE,
  alliance_id uuid REFERENCES public.alliances (id) ON DELETE CASCADE,
  -- Generated entity_type from FK columns
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
  election_round integer DEFAULT 1,
  election_symbol text,
  -- Nesting ⚠ `ON DELETE NO ACTION`, RULED AT 162-12 TASK 2 Q2 = A, AND THE CHOICE IS THE POINT. It was `ON DELETE CASCADE`, which 162-IMPLEMENTATION-BRIEF.md section 11.5 fact 35 names the QUIET DATA-LOSS PATH and forbids leaving in place: an admin rejecting one candidate-created placeholder silently deleted every nomination beneath it, including candidates who joined that placeholder later and had nothing to do with creating it. Before this phase no non-admin could create a parent, so the hazard was theoretical; from 162-12 it is live.
  --
  -- `NO ACTION` refuses at the END OF THE STATEMENT; `RESTRICT` refuses at the offending row. The catalogue barely distinguishes them and the behaviour distinguishes them in exactly one case, which is the case that matters here. MEASURED: `bulk_delete` (501-bulk-operations.sql) removes a collection with ONE `DELETE ... WHERE project_id = $1 AND external_id LIKE $2` per table and puts `nominations` FIRST in its delete_order, so parent and children go together in a single statement. Under `NO ACTION` that succeeds, because by the time the check runs there are no referencing rows left; under `RESTRICT` it would fail and break EVERY teardown the seeder performs. Measured end to end: `yarn db:seed:teardown` exits 0 and removes 751 rows with no foreign-key error, while a targeted delete of a parent that still has children is refused by name.
  parent_nomination_id uuid REFERENCES public.nominations (id) ON DELETE NO ACTION,
  -- Confirmation state. RENAMED AND INVERTED from `unconfirmed` by 162-12 (D-11c) so that the two booleans this phase leaves behind read the same way: after this plan `true` means confirmed on the nomination and on all four entity tables, and the schema carries ONE polarity rather than two adjacent ones pointing in opposite directions.
  --
  -- ⚠ THE DEFAULT IS LOAD-BEARING, NOT COSMETIC, and it is the half a reader is most likely to skim. 162-IMPLEMENTATION-BRIEF.md section 11.5's second guard says the candidate-created parent is created UNCONFIRMED and that the candidate cannot override that; fact 34 says the mechanism is the INSERT column grant in 303-column-grants.sql; and a column ABSENT from a `GRANT INSERT` column list takes its declared default rather than erroring. So `DEFAULT false` is what makes guard 2 true in the only case that matters -- the one where the caller cannot name the column at all. A default of `true` would make that grant list express nothing.
  --
  -- `NOT NULL` buys the other half. Every reader of the old nullable column wrapped it in a null-coalescing call (`NOT COALESCE(unconfirmed, false)`), because the spelling `unconfirmed = false` would silently drop every NULL row. Non-nullable makes the wrapper REMOVABLE rather than merely renameable, so 162-12 asserts its ABSENCE -- a stronger statement than its correctness. There is no row to migrate: D-14 records that no database has been published, so a reset builds from nothing and `NOT NULL` is what stops a future path writing a null a bare boolean read would drop.
  confirmed boolean NOT NULL DEFAULT false,
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
  -- An entity may be nominated only ONCE in a given election / constituency / round -- UNLESS it is nominated by a different parent, which is what admits the case the operator gave as the reason for the shape: the same presidential candidate nominated in one contest by three different parties, each a genuinely distinct nomination rather than a duplicate (162-IMPLEMENTATION-BRIEF.md section 11.7).
  --
  -- ⚠ `NULLS NOT DISTINCT` IS THE WHOLE CONSTRAINT, NOT A REFINEMENT OF IT. PostgreSQL's default `UNIQUE` treats NULLs as distinct, so two rows never conflict if any keyed column is NULL in either of them -- and on THIS table the CHECK above guarantees that every row has three NULL entity foreign keys, always, while `parent_nomination_id` is NULL for every top-level nomination. A plain `UNIQUE` over these eight columns would therefore reject NOTHING, while reading as a guarantee in the schema, in review and in the diff. MEASURED, same database and same estate: written plain, the pgTAP estate passes 923 assertions and the constraint catches nothing; written with this clause, it catches three real duplicate pairs. The two forms are not interchangeable here.
  --
  -- ⚠ THIS IS THE FIRST THING IN THIS SCHEMA THAT PINS THE POSTGRESQL FLOOR. `NULLS NOT DISTINCT` is a PostgreSQL 15 feature and `supabase/config.toml` declares `major_version = 15` -- available, with no margin. A downgrade would SILENTLY turn this constraint into the no-op above rather than fail to apply, which is why the floor is stated here and asserted from `pg_index.indnullsnotdistinct` on the applied database rather than read off this file.
  --
  -- Named explicitly, for the same reason `nominations_election_round_check` below is: a pgTAP `throws_ok` needs a stable handle and 162-17 asserts this one by name.
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
  -- Election rounds are numbered from one. Named explicitly rather than left to PostgreSQL's generated name: the name is cited by 156-DISPOSITIONS.md Record B and is the handle any throws_ok on this constraint has to match, so it belongs under source control. The literal is identical to what PostgreSQL generates, so this declares the existing name rather than changing it.
  CONSTRAINT nominations_election_round_check CHECK (election_round >= 1)
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

CREATE TRIGGER validate_nomination_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.validate_nomination ();

-- The confirmation transition (162-12). 162-USER-RIGHTS.md says "when editing, turn confirmed false" -- the SYSTEM sets it, so this is a trigger and not a policy: a policy can refuse a row, it cannot rewrite one.
--
-- It runs AFTER validate_nomination in the alphabetical order PostgreSQL uses for same-timing triggers on one table (`enforce_` < `set_` < `validate_`, so in fact it runs FIRST) -- the order does not matter, because the two functions read disjoint columns and neither depends on the other's rewrite.
-- The column bound for callers who are not project nomination editors (162-REVIEW WR-05): 303-column-grants.sql cannot tell them from an admin, this trigger can.
CREATE TRIGGER enforce_nomination_columns_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.enforce_nomination_entity_columns ();

CREATE TRIGGER enforce_nomination_confirmation_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.enforce_nomination_confirmation ();
