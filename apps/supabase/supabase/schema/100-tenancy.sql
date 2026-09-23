-- Multi-tenant foundation: accounts and projects
--
-- All content tables reference projects via project_id FK with ON DELETE CASCADE.
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.accounts FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts (id) ON DELETE CASCADE,
  name text NOT NULL,
  default_locale text NOT NULL DEFAULT 'en',
  -- Read by 162-08, which makes it the PROJECT-LEVEL term of section 3.4's public-read rule: an anonymous reader sees a row only when this is true, its nomination is confirmed and every entity that nomination links is confirmed. Defaults to the closed direction because a project created this minute is not world-readable; the creation paths (seed.sql, SupabaseAdminClient.ensureProject) set it true, which is today's behaviour rather than a new one.
  open_for_voters boolean NOT NULL DEFAULT false,
  -- Read by 162-12 and by NOTHING TODAY. It ships inert: no policy consults it, no seed sets it, and no assertion in the estate claims anything for it beyond existence, type, NOT NULL and default. Its default false IS today's behaviour rather than a new permissive setting -- section 3.3 grants admins `nomination.edit` unconditionally, and the `own, unless locked` cells this flag gates belong to the entity-user nomination write policies 162-12 creates. Do not read this column as an enforced setting until that plan wires it.
  lock_nominations boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.projects FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();
