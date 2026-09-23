-- Elections, constituency groups, constituencies, and their join tables
CREATE TABLE public.elections (
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
  election_date date,
  election_start_date date,
  -- REPURPOSED, not added. The column keeps its name and takes a NEW MEANING per the operator's section 8.2 note and D-16: it now carries which of section 6.2's three nomination flows this election runs -- whether a candidate picks a party, whether a party nominates a list, and whether the free-text branch is reachable at all. The values it used to hold are deleted, and they are not members of the type, so a row carrying one is rejected by PostgreSQL rather than stored.
  -- `subtype` above is a DIFFERENT AXIS and is not this. The two have always been separate columns on this table; before 162-07 the frontend adapter conflated them into one property, and that term is removed in the same commit as this retype so the property means one thing from one column.
  -- The default is the operator's own reading of which shape most projects will run, not a planner's; NOT NULL with a default is also what lets every creation path stay ignorant of this column.
  election_type public.nomination_shape NOT NULL DEFAULT 'organization_list',
  multiple_rounds boolean DEFAULT false,
  current_round integer DEFAULT 1,
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.elections FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

CREATE TABLE public.constituency_groups (
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
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.constituency_groups FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

CREATE TABLE public.constituencies (
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
  keywords jsonb,
  parent_id uuid REFERENCES public.constituencies (id) ON DELETE SET NULL,
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.constituencies FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

CREATE TABLE public.constituency_group_constituencies (
  constituency_group_id uuid NOT NULL REFERENCES public.constituency_groups (id) ON DELETE CASCADE,
  constituency_id uuid NOT NULL REFERENCES public.constituencies (id) ON DELETE CASCADE,
  PRIMARY KEY (constituency_group_id, constituency_id)
);

CREATE TABLE public.election_constituency_groups (
  election_id uuid NOT NULL REFERENCES public.elections (id) ON DELETE CASCADE,
  constituency_group_id uuid NOT NULL REFERENCES public.constituency_groups (id) ON DELETE CASCADE,
  PRIMARY KEY (election_id, constituency_group_id)
);
